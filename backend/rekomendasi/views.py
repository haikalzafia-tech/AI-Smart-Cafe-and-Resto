import re
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate, TruncWeek
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from meja.models import Meja
from menu.models import Menu, Reaksi
from menu.serializers import MenuSerializer

from . import chat as chatbot
from .cuaca import KUNCI_CACHE, LABEL_WAKTU, cuaca_terkini, periode_waktu
from .mesin import judul_rekomendasi, rekomendasikan
from .models import (
    KONDISI_CUACA, PERIODE_WAKTU, AturanRekomendasi, KonfigurasiAI, KonfigurasiCuaca, LogRekomendasi, Ulasan,
)
from .sentimen import analisis
from .serializers import AturanSerializer, KonfigurasiAISerializer, KonfigurasiCuacaSerializer, UlasanSerializer


def publik(view):
    """Endpoint tanpa login."""
    return authentication_classes([])(permission_classes([AllowAny])(view))


def meja_dari_kode(kode):
    kode = str(kode or "").strip()
    return Meja.objects.filter(kode=kode, aktif=True).first() if kode else None


def batasi(kunci, maks, detik):
    """Rate limit sederhana. True kalau masih boleh."""
    cache.add(kunci, 0, detik)
    try:
        jumlah = cache.incr(kunci)
    except ValueError:
        cache.set(kunci, 1, detik)
        jumlah = 1
    return jumlah <= maks


def info_waktu():
    w = periode_waktu()
    return {"waktu": w, "label_waktu": LABEL_WAKTU[w]}


def data_rekomendasi(request, kondisi, waktu, jumlah, jam):
    hasil = rekomendasikan(kondisi, waktu, jumlah=jumlah, jam=jam)
    menu = []
    for m, alasan in hasil:
        d = MenuSerializer(m, context={"request": request}).data
        d["alasan"] = alasan
        menu.append(d)
    return hasil, menu


def catat_log(menu_list, kondisi, waktu, meja, sumber):
    LogRekomendasi.objects.bulk_create(
        [LogRekomendasi(menu=m, cuaca=kondisi or "", waktu=waktu, meja=meja, sumber=sumber) for m in menu_list]
    )


# ---------- Publik ----------

@api_view(["GET"])
@publik
def cuaca(request):
    return Response({"cuaca": cuaca_terkini(), **info_waktu()})


@api_view(["GET"])
@publik
def rekomendasi(request):
    """PLG-02: 3–5 menu sesuai cuaca & waktu sekarang. Tetap jalan walau API cuaca gagal."""
    try:
        jumlah = min(max(int(request.GET.get("jumlah", 5)), 3), 5)
    except ValueError:
        jumlah = 5
    c = cuaca_terkini()
    sekarang = timezone.localtime()
    waktu = periode_waktu(sekarang)
    hasil, menu = data_rekomendasi(request, c["kondisi"], waktu, jumlah, sekarang.hour)

    meja = meja_dari_kode(request.GET.get("kode"))
    if meja and cache.add(f"logrek:{meja.nomor}:{sekarang:%Y%m%d%H}", 1, 3600):  # dicatat maks 1x per meja per jam
        catat_log([m for m, _ in hasil], c["kondisi"], waktu, meja.nomor, "otomatis")

    return Response({"judul": judul_rekomendasi(c["kondisi"], waktu), "cuaca": c, **info_waktu(), "menu": menu})


@api_view(["POST"])
@publik
def chat(request):
    meja = meja_dari_kode(request.data.get("kode"))
    if meja is None:
        return Response({"detail": "Scan QR meja dulu untuk memakai chat."}, status=403)
    pesan = str(request.data.get("pesan", "")).strip()[:500]
    if not pesan:
        return Response({"detail": "Pesan tidak boleh kosong."}, status=400)
    if not batasi(f"chat:{meja.nomor}", 25, 600):
        return Response({"detail": "Terlalu banyak pesan. Coba lagi beberapa menit lagi."}, status=429)

    riwayat = []
    for r in (request.data.get("riwayat") or [])[-8:]:
        if isinstance(r, dict) and r.get("peran") in ("tamu", "asisten") and str(r.get("teks", "")).strip():
            riwayat.append({"peran": r["peran"], "teks": str(r["teks"])[:500]})
    while riwayat and riwayat[0]["peran"] != "tamu":
        riwayat.pop(0)
    riwayat.append({"peran": "tamu", "teks": pesan})

    c = cuaca_terkini()
    sekarang = timezone.localtime()
    waktu = periode_waktu(sekarang)
    semua = list(Menu.objects.all())
    peta = {m.id: m for m in semua}
    token = set(re.findall(r"[a-z]+", pesan.lower()))
    boleh_alkohol = bool(token & chatbot.KATA_ALKOHOL)

    balasan, terpilih, sumber = "", [], "kata-kunci"
    konf = KonfigurasiAI.ambil()
    if konf.penyedia != "tanpa" and konf.api_key:
        try:
            teks = chatbot.panggil_ai(konf, chatbot.susun_prompt(semua, c, waktu), riwayat)
            balasan, ids = chatbot.baca_balasan(teks)
            terpilih = [
                peta[i] for i in dict.fromkeys(ids)
                if i in peta and peta[i].tersedia and (boleh_alkohol or not peta[i].beralkohol)
            ][: chatbot.MAKS_MENU]
            sumber = "ai"
        except Exception as e:  # jaringan/API key/kuota bermasalah → pakai mode kata kunci
            konf.status_terakhir, konf.pesan_terakhir, konf.dicek_pada = "gagal", chatbot.pesan_galat_ai(e), timezone.now()
            konf.save(update_fields=["status_terakhir", "pesan_terakhir", "dicek_pada"])
            balasan = ""

    if not balasan:
        sumber = "kata-kunci"
        urutan = rekomendasikan(c["kondisi"], waktu, jumlah=20, jam=sekarang.hour)
        skor = {m.id: 50 - i * 2 for i, (m, _) in enumerate(urutan)}
        cocok, ada_kriteria, maks = chatbot.cocokkan(pesan, semua, skor)
        if ada_kriteria and cocok:
            terpilih = cocok
            balasan = "Ini beberapa pilihan yang cocok buat kamu" + (
                f" dengan harga di bawah {chatbot.rupiah(maks)}" if maks else ""
            ) + ". Ketuk menunya untuk lihat detail."
        else:
            terpilih = [m for m, _ in urutan[: chatbot.MAKS_MENU]]
            awal = (
                "Maaf, aku belum nemu menu yang pas dengan itu. " if ada_kriteria
                else "Halo! "
            )
            balasan = awal + judul_rekomendasi(c["kondisi"], waktu) + ". Ini pilihanku untuk sekarang:"

    if terpilih:
        catat_log(terpilih, c["kondisi"], waktu, meja.nomor, "chat")
    data = MenuSerializer(terpilih, many=True, context={"request": request}).data
    return Response({"balasan": balasan, "menu": data, "sumber": sumber})


@api_view(["POST"])
@publik
def kirim_ulasan(request):
    """PLG-05: ulasan dari pelanggan yang sudah scan QR."""
    meja = meja_dari_kode(request.data.get("kode"))
    if meja is None:
        return Response({"detail": "Scan QR meja dulu untuk memberi ulasan."}, status=403)
    try:
        rating = int(request.data.get("rating"))
    except (TypeError, ValueError):
        rating = 0
    if not 1 <= rating <= 5:
        return Response({"detail": "Pilih rating 1 sampai 5 bintang."}, status=400)
    komentar = str(request.data.get("komentar", "")).strip()[:1000]
    if not batasi(f"ulasan:{meja.nomor}", 3, 1800):
        return Response({"detail": "Ulasan dari meja ini sudah terkirim. Terima kasih!"}, status=429)
    u = Ulasan.objects.create(meja=meja.nomor, rating=rating, komentar=komentar, sentimen=analisis(komentar, rating))
    return Response(UlasanSerializer(u).data, status=201)


# ---------- Admin ----------

@api_view(["GET"])
@permission_classes([IsAdminUser])
def simulasi(request):
    """ADM-03: pratinjau rekomendasi untuk cuaca/waktu tertentu (tidak dicatat)."""
    kondisi = request.GET.get("cuaca") or None
    if kondisi not in dict(KONDISI_CUACA):
        kondisi = None
    waktu = request.GET.get("waktu")
    if waktu not in dict(PERIODE_WAKTU):
        waktu = periode_waktu()
    _, menu = data_rekomendasi(request, kondisi, waktu, 5, timezone.localtime().hour)
    return Response({"judul": judul_rekomendasi(kondisi, waktu), "cuaca": kondisi, "waktu": waktu, "menu": menu})


class AturanViewSet(viewsets.ModelViewSet):
    serializer_class = AturanSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        qs = AturanRekomendasi.objects.select_related("menu")
        for f in ("cuaca", "waktu", "menu"):
            if self.request.query_params.get(f):
                qs = qs.filter(**{f: self.request.query_params[f]})
        return qs


def _konfigurasi(request, model, serializer_cls):
    konf = model.ambil()
    if request.method == "GET":
        return Response(serializer_cls(konf).data)
    s = serializer_cls(konf, data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    s.save()
    return Response(serializer_cls(model.ambil()).data)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAdminUser])
def konfigurasi_cuaca(request):
    """ADM-05: form konfigurasi API cuaca."""
    resp = _konfigurasi(request, KonfigurasiCuaca, KonfigurasiCuacaSerializer)
    if request.method != "GET":
        cache.delete(KUNCI_CACHE)
    return resp


@api_view(["POST"])
@permission_classes([IsAdminUser])
def tes_cuaca(request):
    hasil = cuaca_terkini(paksa=True)
    return Response({"hasil": hasil, "konfigurasi": KonfigurasiCuacaSerializer(KonfigurasiCuaca.ambil()).data})


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAdminUser])
def konfigurasi_ai(request):
    return _konfigurasi(request, KonfigurasiAI, KonfigurasiAISerializer)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def tes_ai(request):
    konf = KonfigurasiAI.ambil()
    if konf.penyedia == "tanpa":
        return Response({"berhasil": True, "pesan": "Mode tanpa AI aktif: chat memakai pencocokan kata kunci."})
    if not konf.api_key:
        return Response({"berhasil": False, "pesan": "API key belum diisi."})
    try:
        teks = chatbot.panggil_ai(
            konf, 'Balas hanya dengan JSON {"balasan": "OK", "menu_ids": []}.', [{"peran": "tamu", "teks": "Tes koneksi"}]
        )
        berhasil, pesan = True, f"Terhubung ke {konf.get_penyedia_display()} ({konf.model_dipakai})."
        if not teks:
            berhasil, pesan = False, "Terhubung, tapi balasan AI kosong."
    except Exception as e:
        berhasil, pesan = False, chatbot.pesan_galat_ai(e)
    konf.status_terakhir, konf.pesan_terakhir, konf.dicek_pada = ("berhasil" if berhasil else "gagal"), pesan, timezone.now()
    konf.save(update_fields=["status_terakhir", "pesan_terakhir", "dicek_pada"])
    return Response({"berhasil": berhasil, "pesan": pesan})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def statistik_menu(request):
    """ADM-04: frekuensi rekomendasi, like/dislike, per kondisi cuaca, harian/mingguan."""
    try:
        hari = min(max(int(request.GET.get("hari", 7)), 1), 90)
    except ValueError:
        hari = 7
    mingguan = request.GET.get("kelompok") == "mingguan"
    awal_hari_ini = timezone.localtime().replace(hour=0, minute=0, second=0, microsecond=0)
    mulai = awal_hari_ini - timedelta(days=hari - 1)

    log = LogRekomendasi.objects.filter(dibuat__gte=mulai)
    reaksi = Reaksi.objects.filter(waktu__gte=mulai)
    ulasan = Ulasan.objects.filter(dibuat__gte=mulai)

    rek_teratas = list(
        log.values("menu__id", "menu__nama").annotate(jumlah=Count("id")).order_by("-jumlah", "menu__nama")[:10]
    )
    rek_sumber = dict(log.values_list("sumber").annotate(n=Count("id")))
    disukai = list(
        reaksi.values("menu__id", "menu__nama")
        .annotate(suka=Count("id", filter=Q(nilai=1)), tidak_suka=Count("id", filter=Q(nilai=-1)))
        .order_by("-suka", "tidak_suka", "menu__nama")[:10]
    )
    tidak_disukai = list(
        reaksi.values("menu__id", "menu__nama")
        .annotate(tidak_suka=Count("id", filter=Q(nilai=-1)), suka=Count("id", filter=Q(nilai=1)))
        .filter(tidak_suka__gt=0)
        .order_by("-tidak_suka", "menu__nama")[:5]
    )
    per_kondisi = []
    for kode, label in [("", "Tidak diketahui")] + KONDISI_CUACA:
        q = reaksi.filter(cuaca=kode)
        per_kondisi.append({
            "kondisi": kode or "tidak_diketahui",
            "label": label,
            "suka": q.filter(nilai=1).count(),
            "tidak_suka": q.filter(nilai=-1).count(),
            "rekomendasi": log.filter(cuaca=kode).count(),
        })

    potong = TruncWeek if mingguan else TruncDate
    rek_seri = {r["t"]: r["n"] for r in log.annotate(t=potong("dibuat")).values("t").annotate(n=Count("id"))}
    suka_seri = {
        r["t"]: (r["s"], r["ts"])
        for r in reaksi.annotate(t=potong("waktu")).values("t")
        .annotate(s=Count("id", filter=Q(nilai=1)), ts=Count("id", filter=Q(nilai=-1)))
    }

    def kunci(t):
        return t.date() if hasattr(t, "date") and callable(t.date) else t

    rek_seri = {kunci(k): v for k, v in rek_seri.items() if k}
    suka_seri = {kunci(k): v for k, v in suka_seri.items() if k}
    seri, d = [], mulai.date()
    if mingguan:
        d -= timedelta(days=d.weekday())
    langkah = timedelta(days=7 if mingguan else 1)
    while d <= awal_hari_ini.date():
        s, ts = suka_seri.get(d, (0, 0))
        seri.append({"tanggal": d.isoformat(), "rekomendasi": rek_seri.get(d, 0), "suka": s, "tidak_suka": ts})
        d += langkah

    return Response({
        "hari": hari,
        "kelompok": "mingguan" if mingguan else "harian",
        "ringkasan": {
            "rekomendasi": log.count(),
            "rekomendasi_chat": rek_sumber.get("chat", 0),
            "suka": reaksi.filter(nilai=1).count(),
            "tidak_suka": reaksi.filter(nilai=-1).count(),
            "ulasan": ulasan.count(),
            "rata_rating": round(ulasan.aggregate(r=Avg("rating"))["r"] or 0, 2),
        },
        "rekomendasi_teratas": rek_teratas,
        "disukai_teratas": disukai,
        "tidak_disukai_teratas": tidak_disukai,
        "per_kondisi": per_kondisi,
        "seri": seri,
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def daftar_ulasan(request):
    qs = Ulasan.objects.all()
    if request.GET.get("sentimen") in ("positif", "netral", "negatif"):
        qs = qs.filter(sentimen=request.GET["sentimen"])
    semua = Ulasan.objects.all()
    return Response({
        "ringkasan": {
            "jumlah": semua.count(),
            "rata_rating": round(semua.aggregate(r=Avg("rating"))["r"] or 0, 2),
            "sentimen": {s: semua.filter(sentimen=s).count() for s in ("positif", "netral", "negatif")},
            "bintang": {str(b): semua.filter(rating=b).count() for b in range(1, 6)},
        },
        "ulasan": UlasanSerializer(qs[:200], many=True).data,
    })


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def hapus_ulasan(request, pk):
    Ulasan.objects.filter(pk=pk).delete()
    return Response(status=204)
