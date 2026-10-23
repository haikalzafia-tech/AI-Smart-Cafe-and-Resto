from rest_framework import serializers

from .models import AturanRekomendasi, KonfigurasiAI, KonfigurasiCuaca, Ulasan


class AturanSerializer(serializers.ModelSerializer):
    menu_nama = serializers.CharField(source="menu.nama", read_only=True)
    menu_kategori = serializers.CharField(source="menu.kategori", read_only=True)

    class Meta:
        model = AturanRekomendasi
        fields = ["id", "menu", "menu_nama", "menu_kategori", "cuaca", "waktu", "prioritas", "aktif", "dibuat"]
        validators = []  # pesan duplikat ditangani manual di bawah supaya berbahasa Indonesia

    def validate_prioritas(self, v):
        if not 1 <= v <= 5:
            raise serializers.ValidationError("Prioritas harus 1 sampai 5.")
        return v

    def validate(self, data):
        menu = data.get("menu", getattr(self.instance, "menu", None))
        cuaca = data.get("cuaca", getattr(self.instance, "cuaca", "semua"))
        waktu = data.get("waktu", getattr(self.instance, "waktu", "semua"))
        qs = AturanRekomendasi.objects.filter(menu=menu, cuaca=cuaca, waktu=waktu)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({"detail": "Aturan yang sama untuk menu ini sudah ada."})
        return data


class _KonfigurasiDasar(serializers.ModelSerializer):
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    hapus_api_key = serializers.BooleanField(write_only=True, required=False)
    api_key_terisi = serializers.SerializerMethodField()

    def get_api_key_terisi(self, obj):
        return bool(obj.api_key)

    def update(self, instance, data):
        key = data.pop("api_key", "")
        if data.pop("hapus_api_key", False):
            instance.api_key = ""
        elif key.strip():
            instance.api_key = key.strip()  # kosong = tidak diubah
        return super().update(instance, data)


class KonfigurasiCuacaSerializer(_KonfigurasiDasar):
    class Meta:
        model = KonfigurasiCuaca
        fields = [
            "penyedia", "endpoint", "api_key", "hapus_api_key", "api_key_terisi", "nama_lokasi", "lintang", "bujur",
            "cache_menit", "aktif", "status_terakhir", "pesan_terakhir", "dicek_pada",
        ]
        read_only_fields = ["status_terakhir", "pesan_terakhir", "dicek_pada"]

    def validate_lintang(self, v):
        if not -90 <= v <= 90:
            raise serializers.ValidationError("Lintang harus di antara -90 dan 90.")
        return v

    def validate_bujur(self, v):
        if not -180 <= v <= 180:
            raise serializers.ValidationError("Bujur harus di antara -180 dan 180.")
        return v

    def validate_cache_menit(self, v):
        if not 1 <= v <= 180:
            raise serializers.ValidationError("Cache harus 1 sampai 180 menit.")
        return v


class KonfigurasiAISerializer(_KonfigurasiDasar):
    model_dipakai = serializers.CharField(read_only=True)

    class Meta:
        model = KonfigurasiAI
        fields = [
            "penyedia", "model", "model_dipakai", "api_key", "hapus_api_key", "api_key_terisi",
            "status_terakhir", "pesan_terakhir", "dicek_pada",
        ]
        read_only_fields = ["status_terakhir", "pesan_terakhir", "dicek_pada"]


class UlasanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ulasan
        fields = ["id", "meja", "rating", "komentar", "sentimen", "dibuat"]
