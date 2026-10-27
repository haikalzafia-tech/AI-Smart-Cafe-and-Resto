from rest_framework import serializers

from .models import Menu

MAKS_FOTO_MB = 5


class MenuSerializer(serializers.ModelSerializer):
    suka = serializers.SerializerMethodField()
    tidak_suka = serializers.SerializerMethodField()

    class Meta:
        model = Menu
        fields = "__all__"
        extra_kwargs = {"harga": {"required": False}}

    def get_suka(self, obj):
        return getattr(obj, "jml_suka", 0)

    def get_tidak_suka(self, obj):
        return getattr(obj, "jml_tidak_suka", 0)

    # ADM-01: validasi field wajib
    def validate_nama(self, v):
        v = (v or "").strip()
        if not v:
            raise serializers.ValidationError("Nama menu wajib diisi.")
        return v

    def validate_subkategori(self, v):
        v = (v or "").strip()
        if not v:
            raise serializers.ValidationError("Subkategori wajib diisi, misalnya Soup atau Mocktail.")
        return v

    def validate_tag(self, v):
        if isinstance(v, str):
            v = v.split(",")
        if not isinstance(v, list):
            raise serializers.ValidationError("Tag harus berupa daftar kata.")
        return [str(t).strip().lower() for t in v if str(t).strip()][:15]

    def validate_varian(self, v):
        if v in (None, ""):
            return []
        if not isinstance(v, list) or len(v) > 10:
            raise serializers.ValidationError("Varian harus berupa daftar (maksimal 10).")
        hasil = []
        for item in v:
            try:
                nama, harga = str(item["nama"]).strip(), int(item["harga"])
            except (KeyError, TypeError, ValueError):
                raise serializers.ValidationError("Setiap varian butuh nama dan harga angka.") from None
            if not nama or harga <= 0:
                raise serializers.ValidationError("Nama varian wajib diisi dan harganya harus lebih dari 0.")
            hasil.append({"nama": nama, "harga": harga})
        return hasil

    def validate_foto(self, f):
        if f and f.size > MAKS_FOTO_MB * 1024 * 1024:
            raise serializers.ValidationError(f"Ukuran foto maksimal {MAKS_FOTO_MB} MB.")
        return f

    def validate(self, data):
        varian = data.get("varian", getattr(self.instance, "varian", []) or [])
        if varian:
            data["harga"] = min(x["harga"] for x in varian)  # harga = varian termurah
        else:
            harga = data.get("harga", getattr(self.instance, "harga", None))
            if not harga or harga <= 0:
                raise serializers.ValidationError({"harga": "Harga wajib diisi dan harus lebih dari 0."})
        return data
