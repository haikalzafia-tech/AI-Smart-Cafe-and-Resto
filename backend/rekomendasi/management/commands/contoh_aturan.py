from django.core.management.base import BaseCommand

from menu.models import Menu
from rekomendasi.models import AturanRekomendasi

# (nama menu, cuaca, waktu, prioritas). Contoh awal, bisa diubah/dihapus dari dashboard admin.
CONTOH = [
    ("Ginger Honey Tea", "hujan", "semua", 5),
    ("Tom Yam Goong", "hujan", "semua", 4),
    ("Oxtail Soup", "hujan", "malam", 5),
    ("Ramen by Tree House", "hujan", "malam", 4),
    ("Pisang Goreng", "hujan", "sore", 4),
    ("Broccoli Cream Soup", "berawan", "semua", 3),
    ("Coffee Latte", "hujan", "pagi", 4),
    ("Treehouse Signature", "semua", "pagi", 4),
    ("Sunny Side Egg Toast", "semua", "pagi", 3),
    ("Snow Ice Mango", "panas", "semua", 5),
    ("Crema Gelato", "panas", "siang", 4),
    ("Kelapa Pandan", "panas", "semua", 4),
    ("Virgin Mojito", "panas", "sore", 4),
    ("Watermelon Juice", "cerah", "siang", 3),
    ("Thai Beef Salad", "cerah", "siang", 3),
    ("Charcoal Grilled Claypot Seafood Rice", "semua", "malam", 3),
]


class Command(BaseCommand):
    help = "Isi contoh aturan rekomendasi cuaca/waktu (ADM-03). Aman dijalankan berulang."

    def handle(self, *args, **opts):
        dibuat = 0
        for nama, cuaca, waktu, prioritas in CONTOH:
            menu = Menu.objects.filter(nama=nama).first()
            if not menu:
                self.stdout.write(self.style.WARNING(f"Lewati: menu '{nama}' tidak ditemukan"))
                continue
            _, baru = AturanRekomendasi.objects.get_or_create(
                menu=menu, cuaca=cuaca, waktu=waktu, defaults={"prioritas": prioritas}
            )
            dibuat += baru
        self.stdout.write(self.style.SUCCESS(f"Selesai: {dibuat} aturan baru ditambahkan."))
