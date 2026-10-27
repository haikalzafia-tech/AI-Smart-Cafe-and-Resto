from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS, AllowAny, BasePermission
from rest_framework.response import Response

from meja.models import Meja

from .models import Menu, Reaksi
from .serializers import MenuSerializer


class LihatPublikUbahAdmin(BasePermission):
    """Siapa saja boleh melihat menu, hanya admin (staff) yang boleh mengubah."""

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or bool(request.user and request.user.is_staff)


def hitung(menu):
    r = menu.reaksi.aggregate(
        suka=Count("id", filter=Q(nilai=1)),
        tidak_suka=Count("id", filter=Q(nilai=-1)),
    )
    return {"id": menu.id, "suka": r["suka"], "tidak_suka": r["tidak_suka"]}


class MenuViewSet(viewsets.ModelViewSet):
    serializer_class = MenuSerializer
    permission_classes = [LihatPublikUbahAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = Menu.objects.annotate(
            jml_suka=Count("reaksi", filter=Q(reaksi__nilai=1)),
            jml_tidak_suka=Count("reaksi", filter=Q(reaksi__nilai=-1)),
        )
        kategori = self.request.query_params.get("kategori")
        if kategori:
            qs = qs.filter(kategori=kategori)
        return qs

    @action(detail=True, methods=["post"], authentication_classes=[], permission_classes=[AllowAny])
    def reaksi(self, request, pk=None):
        """PUBLIK: pelanggan memberi like (1), dislike (-1), atau membatalkan (0).
        Wajib membawa kode QR meja yang valid, jadi orang luar tidak bisa ikut menilai."""
        meja = Meja.objects.filter(kode=str(request.data.get("kode", "")), aktif=True).first()
        if meja is None:
            return Response({"detail": "Scan QR meja dulu untuk memberi penilaian."}, status=403)

        pemilih = str(request.data.get("pemilih", "")).strip()
        if not 8 <= len(pemilih) <= 64:
            return Response({"detail": "Data pemilih tidak valid."}, status=400)
        try:
            nilai = int(request.data.get("nilai"))
        except (TypeError, ValueError):
            nilai = None
        if nilai not in (1, -1, 0):
            return Response({"detail": "Nilai harus 1, -1, atau 0."}, status=400)

        menu = Menu.objects.filter(pk=pk).first()
        if menu is None:
            return Response({"detail": "Menu tidak ditemukan."}, status=404)

        if nilai == 0:
            Reaksi.objects.filter(menu=menu, pemilih=pemilih).delete()
        else:
            from rekomendasi.cuaca import kondisi_sekarang

            cuaca, periode = kondisi_sekarang()  # PLG-04: like/dislike terhubung ke kondisi saat itu
            Reaksi.objects.update_or_create(
                menu=menu,
                pemilih=pemilih,
                defaults={"nilai": nilai, "meja": meja.nomor, "cuaca": cuaca, "periode": periode},
            )
        return Response(hitung(menu))
