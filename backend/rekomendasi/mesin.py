"""PLG-02: mesin rekomendasi menu berdasarkan cuaca, waktu, aturan admin, dan like/dislike.

Bagian `hitung_skor` dan `pilih` tidak menyentuh database supaya mudah diuji.
"""

from dataclasses import dataclass, field

from .cuaca import LABEL_CUACA, LABEL_WAKTU

JUMLAH_DEFAULT = 5


@dataclass
class Kandidat:
    id: int
    nama: str
    kategori: str
    subkategori: str
    suhu: str
    tag: list
    best_seller: bool = False
    suka: int = 0
    tidak_suka: int = 0
    suka_kondisi: int = 0
    tidak_suka_kondisi: int = 0
    skor: float = 0
    alasan: list = field(default_factory=list)  # (bobot, teks)

    @property
    def alasan_utama(self):
        if not self.alasan:
            return "Pilihan favorit di Treehouse"
        return max(self.alasan, key=lambda a: a[0])[1]


def _batas(x, bawah, atas):
    return max(bawah, min(atas, x))


def _teks_aturan(cuaca, waktu):
    c, w = LABEL_CUACA.get(cuaca, ""), LABEL_WAKTU.get(waktu, "").lower()
    if cuaca != "semua" and waktu != "semua":
        return f"Pilihan kami saat {c.lower()} di {w} hari"
    if cuaca != "semua":
        return f"Pas untuk cuaca {c.lower()}"
    if waktu != "semua":
        return f"Cocok dinikmati {w} hari"
    return "Rekomendasi spesial Treehouse"


def hitung_skor(k, kondisi, waktu, aturan, jam=0):
    """Isi k.skor dan k.alasan. `aturan` = list (cuaca, waktu, prioritas) milik menu ini."""
    s = 0.0
    al = []
    tag = set(k.tag or [])

    # 1. Aturan dari admin (ADM-03): ambil aturan cocok yang paling kuat
    terbaik = None
    for a_cuaca, a_waktu, prioritas in aturan:
        if a_cuaca not in ("semua", kondisi) or a_waktu not in ("semua", waktu):
            continue
        spesifik = (a_cuaca != "semua") + (a_waktu != "semua")
        nilai = 30 + prioritas * 8 + spesifik * 10
        if terbaik is None or nilai > terbaik[0]:
            terbaik = (nilai, a_cuaca, a_waktu)
    if terbaik:
        s += terbaik[0]
        al.append((terbaik[0], _teks_aturan(terbaik[1], terbaik[2])))

    # 2. Kecocokan suhu menu dengan cuaca
    if kondisi == "hujan":
        s += {"hangat": 25, "fleksibel": 8, "dingin": -25}.get(k.suhu, 0)
        if k.suhu == "hangat":
            al.append((40, "Hangat, pas dinikmati saat hujan"))
    elif kondisi == "panas":
        s += {"dingin": 25, "fleksibel": 8, "hangat": -20}.get(k.suhu, 0)
        if k.suhu == "dingin":
            al.append((40, "Segar untuk cuaca panas"))
    elif kondisi == "cerah":
        s += {"dingin": 12, "hangat": -5}.get(k.suhu, 0)
        if k.suhu == "dingin":
            al.append((25, "Segar di hari yang cerah"))
    elif kondisi == "berawan":
        s += {"hangat": 5}.get(k.suhu, 0)

    # 3. Kecocokan dengan waktu
    if waktu == "pagi" and tag & {"kopi", "sarapan", "roti"}:
        s += 16
        al.append((20, "Teman pagi yang pas"))
    elif waktu == "siang" and k.kategori == "makanan" and tag & {"berat", "nasi"}:
        s += 10
        al.append((18, "Makan siang yang mengenyangkan"))
    elif waktu == "sore" and (tag & {"snack", "kopi"} or k.kategori == "dessert"):
        s += 10
        al.append((18, "Cocok buat santai sore"))
    elif waktu == "malam" and k.suhu == "hangat":
        s += 8
        al.append((15, "Hangat untuk malam hari"))

    # 4. Like/dislike pelanggan (PLG-04): saat kondisi yang sama dihitung lebih berat
    bersih_kondisi = k.suka_kondisi - k.tidak_suka_kondisi
    bersih = k.suka - k.tidak_suka
    s += _batas(bersih_kondisi * 4, -20, 24) + _batas(bersih * 1.5, -10, 12)
    if kondisi and bersih_kondisi >= 2:
        al.append((50, f"Paling disukai tamu saat {LABEL_CUACA[kondisi].lower()}"))
    elif bersih >= 3:
        al.append((35, "Favorit pengunjung"))

    if k.best_seller:
        s += 10
        al.append((30, "Best seller Treehouse"))

    # 5. Variasi kecil per jam supaya rekomendasi tidak selalu sama persis
    s += (k.id * 7 + jam * 13) % 5

    k.skor, k.alasan = s, al
    return k


def pilih(kandidat, jumlah=JUMLAH_DEFAULT):
    """Ambil skor tertinggi dengan variasi: maks 1 per subkategori, maks 2 per kategori, minimal 1 minuman."""
    urut = sorted(kandidat, key=lambda k: (-k.skor, k.id))
    hasil, per_kat, per_sub = [], {}, set()
    for k in urut:
        if len(hasil) == jumlah:
            break
        if k.subkategori in per_sub or per_kat.get(k.kategori, 0) >= 2:
            continue
        hasil.append(k)
        per_sub.add(k.subkategori)
        per_kat[k.kategori] = per_kat.get(k.kategori, 0) + 1

    if hasil and not any(k.kategori == "minuman" for k in hasil):
        minuman = next((k for k in urut if k.kategori == "minuman" and k not in hasil), None)
        if minuman:
            hasil[-1] = minuman

    # Kalau aturan variasi membuat daftar kurang dari jumlah, isi dengan skor tertinggi berikutnya
    for k in urut:
        if len(hasil) >= jumlah:
            break
        if k not in hasil:
            hasil.append(k)
    return sorted(hasil, key=lambda k: -k.skor)


def judul_rekomendasi(kondisi, waktu):
    if kondisi == "hujan":
        return "Lagi hujan, yang hangat-hangat dulu yuk"
    if kondisi == "panas":
        return "Cuaca lagi panas, yang segar-segar dulu"
    if kondisi == "cerah":
        return "Hari cerah, pas buat yang segar"
    if kondisi == "berawan":
        return "Langit berawan, santai dulu di Treehouse"
    return {
        "pagi": "Selamat pagi, mulai harimu dengan ini",
        "siang": "Waktunya makan siang",
        "sore": "Teman santai sore ini",
        "malam": "Menu hangat untuk malam ini",
    }[waktu]


def rekomendasikan(kondisi, waktu, jumlah=JUMLAH_DEFAULT, jam=0):
    """Versi yang membaca database. Mengembalikan list (Menu, alasan)."""
    from django.db.models import Count, IntegerField, Q, Value

    from menu.models import Menu

    from .models import AturanRekomendasi

    if kondisi:
        per_kondisi = {
            "suka_k": Count("reaksi", filter=Q(reaksi__nilai=1, reaksi__cuaca=kondisi)),
            "tidak_k": Count("reaksi", filter=Q(reaksi__nilai=-1, reaksi__cuaca=kondisi)),
        }
    else:  # cuaca tidak diketahui: like per kondisi tidak dipakai
        per_kondisi = {"suka_k": Value(0, IntegerField()), "tidak_k": Value(0, IntegerField())}
    menu_qs = (
        Menu.objects.filter(tersedia=True, beralkohol=False)
        .exclude(kategori__in=["alkohol", "lainnya"])
        .annotate(
            jml_suka=Count("reaksi", filter=Q(reaksi__nilai=1)),
            jml_tidak_suka=Count("reaksi", filter=Q(reaksi__nilai=-1)),
            **per_kondisi,
        )
    )
    peta_menu = {m.id: m for m in menu_qs}

    aturan = {}
    for a in AturanRekomendasi.objects.filter(aktif=True, menu_id__in=peta_menu.keys()):
        aturan.setdefault(a.menu_id, []).append((a.cuaca, a.waktu, a.prioritas))

    kandidat = [
        hitung_skor(
            Kandidat(
                id=m.id, nama=m.nama, kategori=m.kategori, subkategori=m.subkategori, suhu=m.suhu,
                tag=m.tag, best_seller=m.best_seller, suka=m.jml_suka, tidak_suka=m.jml_tidak_suka,
                suka_kondisi=m.suka_k, tidak_suka_kondisi=m.tidak_k,
            ),
            kondisi, waktu, aturan.get(m.id, []), jam,
        )
        for m in peta_menu.values()
    ]
    return [(peta_menu[k.id], k.alasan_utama) for k in pilih(kandidat, jumlah)]
