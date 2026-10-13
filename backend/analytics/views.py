from datetime import timedelta

from django.contrib.auth import authenticate
from django.db.models import Count
from django.db.models.functions import ExtractHour, TruncDate
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from .models import Kunjungan

JUMLAH_MEJA = 20


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def catat_kunjungan(request):
    """PUBLIK: dipanggil halaman menu saat pelanggan membuka halaman (tanpa login)."""
    sumber = "qr" if request.data.get("sumber") == "qr" else "langsung"
    try:
        meja = int(request.data.get("meja"))
        meja = meja if 1 <= meja <= JUMLAH_MEJA else None
    except (TypeError, ValueError):
        meja = None
    Kunjungan.objects.create(meja=meja, sumber=sumber)
    return Response({"ok": True}, status=201)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login_admin(request):
    """Login admin. Hanya akun staff yang boleh masuk."""
    user = authenticate(
        username=request.data.get("username", ""),
        password=request.data.get("password", ""),
    )
    if user is None or not user.is_staff:
        return Response({"detail": "Username atau password salah."}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "nama": user.get_username()})


@api_view(["GET"])
@permission_classes([IsAdminUser])  # wajib login sebagai staff
def statistik(request):
    try:
        hari = min(max(int(request.GET.get("hari", 7)), 1), 90)
    except ValueError:
        hari = 7

    sekarang = timezone.localtime()
    awal_hari_ini = sekarang.replace(hour=0, minute=0, second=0, microsecond=0)
    mulai = awal_hari_ini - timedelta(days=hari - 1)

    semua = Kunjungan.objects.all()
    periode = semua.filter(waktu__gte=mulai)

    per_tanggal = {
        r["tgl"]: r["n"]
        for r in periode.annotate(tgl=TruncDate("waktu")).values("tgl").annotate(n=Count("id"))
    }
    harian = []
    for i in range(hari):
        d = mulai.date() + timedelta(days=i)
        harian.append({"tanggal": d.isoformat(), "jumlah": per_tanggal.get(d, 0)})

    per_jam = {
        r["j"]: r["n"]
        for r in periode.annotate(j=ExtractHour("waktu")).values("j").annotate(n=Count("id"))
    }
    jam = [{"jam": j, "jumlah": per_jam.get(j, 0)} for j in range(24)]

    meja = list(
        periode.exclude(meja__isnull=True)
        .values("meja")
        .annotate(jumlah=Count("id"))
        .order_by("-jumlah")[:10]
    )

    return Response(
        {
            "hari": hari,
            "ringkasan": {
                "total": semua.count(),
                "hari_ini": semua.filter(waktu__gte=awal_hari_ini).count(),
                "periode": periode.count(),
                "periode_qr": periode.filter(sumber="qr").count(),
                "periode_langsung": periode.filter(sumber="langsung").count(),
            },
            "harian": harian,
            "per_jam": jam,
            "meja_teratas": meja,
        }
    )
