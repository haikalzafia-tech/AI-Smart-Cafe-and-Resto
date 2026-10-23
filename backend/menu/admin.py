from django.contrib import admin
from django.db.models import Count, Q
from django.utils.html import format_html

from .models import Menu, Reaksi


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ("thumb", "nama", "kategori", "subkategori", "harga", "suhu", "suka", "tidak_suka", "best_seller", "tersedia")
    list_display_links = ("thumb", "nama")
    list_editable = ("harga", "suhu", "best_seller", "tersedia")
    list_filter = ("kategori", "suhu", "best_seller", "tersedia", "subkategori")
    search_fields = ("nama", "deskripsi", "subkategori")
    list_per_page = 50

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _suka=Count("reaksi", filter=Q(reaksi__nilai=1)),
            _tidak=Count("reaksi", filter=Q(reaksi__nilai=-1)),
        )

    @admin.display(description="Foto")
    def thumb(self, obj):
        if not obj.foto:
            return "-"
        return format_html('<img src="{}" style="height:40px;width:56px;object-fit:cover;border-radius:6px">', obj.foto.url)

    @admin.display(description="👍", ordering="_suka")
    def suka(self, obj):
        return obj._suka

    @admin.display(description="👎", ordering="_tidak")
    def tidak_suka(self, obj):
        return obj._tidak


@admin.register(Reaksi)
class ReaksiAdmin(admin.ModelAdmin):
    list_display = ("menu", "nilai", "cuaca", "periode", "meja", "waktu")
    list_filter = ("nilai", "cuaca", "periode")
