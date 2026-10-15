import json
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand

from menu.models import Menu

FOLDER_DATA = Path(__file__).resolve().parents[2] / "data"


class Command(BaseCommand):
    help = "Masukkan / perbarui data menu dan foto dari folder data (aman dijalankan berulang kali)."

    def add_arguments(self, parser):
        parser.add_argument("--file", default=str(FOLDER_DATA / "menu_treehouse.json"))

    def handle(self, *args, **opts):
        data = json.loads(Path(opts["file"]).read_text(encoding="utf-8"))
        baru = foto_baru = 0
        for item in data:
            nama = item.pop("nama")
            file_foto = item.pop("foto", None)
            # best_seller, tersedia & foto yang sudah diganti admin tidak ditimpa
            menu, dibuat = Menu.objects.update_or_create(nama=nama, defaults=item)
            baru += dibuat
            path = FOLDER_DATA / "foto" / file_foto if file_foto else None
            if path and path.exists() and not menu.foto:
                with path.open("rb") as f:
                    menu.foto.save(file_foto, File(f), save=True)
                foto_baru += 1
        self.stdout.write(self.style.SUCCESS(
            f"Selesai: {len(data)} menu ({baru} baru), {foto_baru} foto ditambahkan."
        ))
