from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("admin/aturan", views.AturanViewSet, basename="aturan")

urlpatterns = [
    path("cuaca/", views.cuaca),
    path("rekomendasi/", views.rekomendasi),
    path("chat/", views.chat),
    path("ulasan/", views.kirim_ulasan),
    path("admin/rekomendasi/simulasi/", views.simulasi),
    path("admin/konfigurasi/cuaca/", views.konfigurasi_cuaca),
    path("admin/konfigurasi/cuaca/tes/", views.tes_cuaca),
    path("admin/konfigurasi/ai/", views.konfigurasi_ai),
    path("admin/konfigurasi/ai/tes/", views.tes_ai),
    path("admin/statistik-menu/", views.statistik_menu),
    path("admin/ulasan/", views.daftar_ulasan),
    path("admin/ulasan/<int:pk>/", views.hapus_ulasan),
] + router.urls
