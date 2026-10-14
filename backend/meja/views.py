import segno
from django.conf import settings
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from analytics.models import Kunjungan

from .models import Meja


def link_qr(meja):
    return f"{settings.FRONTEND_URL.rstrip('/')}/scan/{meja.kode}"


def data_meja(meja):
    link = link_qr(meja)
    return {
        "id": meja.id,
        "nomor": meja.nomor,
        "aktif": meja.aktif,
        "link": link,
        "qr": segno.make(link, error="m").png_data_uri(scale=8, border=2),
    }


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def scan(request):
    """PUBLIK: dipanggil halaman /scan/<kode>. Validasi QR + catat kunjungan."""
    kode = str(request.data.get("kode", "")).strip()
    meja = Meja.objects.filter(kode=kode, aktif=True).first()
    if meja is None:
        return Response({"detail": "QR code tidak valid atau meja tidak aktif."}, status=404)
    Kunjungan.objects.create(meja=meja.nomor, sumber="qr")
    return Response({"nomor": meja.nomor, "kode": meja.kode})


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def daftar_meja(request):
    """ADMIN: lihat semua meja, atau buat meja baru."""
    if request.method == "POST":
        try:
            if request.data.get("sampai") is not None:
                sampai = int(request.data["sampai"])
                if not 1 <= sampai <= 200:
                    raise ValueError
                for n in range(1, sampai + 1):
                    Meja.objects.get_or_create(nomor=n)  # yang sudah ada tidak diubah
            else:
                nomor = int(request.data.get("nomor"))
                if not 1 <= nomor <= 999:
                    raise ValueError
                if Meja.objects.filter(nomor=nomor).exists():
                    return Response({"detail": f"Meja {nomor} sudah ada."}, status=400)
                Meja.objects.create(nomor=nomor)
        except (TypeError, ValueError):
            return Response({"detail": "Nomor meja tidak valid."}, status=400)
    return Response([data_meja(m) for m in Meja.objects.all()])


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def ubah_meja(request, pk):
    """ADMIN: aktifkan/nonaktifkan atau hapus meja."""
    meja = Meja.objects.filter(pk=pk).first()
    if meja is None:
        return Response({"detail": "Meja tidak ditemukan."}, status=404)
    if request.method == "DELETE":
        meja.delete()
        return Response(status=204)
    if "aktif" in request.data:
        meja.aktif = bool(request.data["aktif"])
        meja.save(update_fields=["aktif"])
    return Response(data_meja(meja))