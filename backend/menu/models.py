from django.db import models


class Menu(models.Model):
    KATEGORI = [
        ("makanan", "Makanan"),
        ("minuman", "Minuman"),
        ("dessert", "Dessert"),
        ("alkohol", "Alkohol"),
        ("lainnya", "Lainnya"),
    ]
    SUHU = [
        ("hangat", "Hangat / panas"),   # cocok saat hujan / dingin
        ("dingin", "Dingin / segar"),   # cocok saat cuaca panas
        ("fleksibel", "Bisa hot / ice"),
        ("netral", "Netral"),
    ]

    nama = models.CharField(max_length=120, unique=True)
    kategori = models.CharField(max_length=10, choices=KATEGORI, db_index=True)
    subkategori = models.CharField(max_length=60, help_text="Contoh: Soup, Steak, Mocktail")
    deskripsi = models.TextField(blank=True)
    harga = models.PositiveIntegerField(help_text="Rupiah. Kalau ada varian, isi harga termurah.")
    varian = models.JSONField(default=list, blank=True, help_text='Contoh: [{"nama": "Big", "harga": 99000}]')
    foto = models.ImageField(upload_to="menu/", blank=True)
    suhu = models.CharField(max_length=10, choices=SUHU, default="netral")
    tag = models.JSONField(default=list, blank=True, help_text='Contoh: ["pedas", "seafood"]')
    beralkohol = models.BooleanField(default=False)
    best_seller = models.BooleanField(default=False)
    tersedia = models.BooleanField(default=True)
    urutan = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["urutan", "nama"]
        verbose_name_plural = "Menu"

    def __str__(self):
        return self.nama


class Reaksi(models.Model):
    """Like (+1) / dislike (-1) dari satu browser pelanggan untuk satu menu."""

    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name="reaksi")
    pemilih = models.CharField(max_length=64, help_text="ID acak per browser, bukan data pribadi")
    nilai = models.SmallIntegerField(choices=[(1, "Suka"), (-1, "Tidak suka")])
    meja = models.PositiveSmallIntegerField(null=True, blank=True)
    cuaca = models.CharField(max_length=10, blank=True, help_text="Kondisi cuaca saat menilai (PLG-04)")
    periode = models.CharField(max_length=10, blank=True, help_text="pagi / siang / sore / malam")
    waktu = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["menu", "pemilih"], name="satu_reaksi_per_pemilih")]
        verbose_name_plural = "Reaksi"

    def __str__(self):
        return f"{self.menu} {'+1' if self.nilai == 1 else '-1'}"
