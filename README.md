# AI-Smart-Cafe-and-Resto
AI Smart Cafe and Resto adalah sistem berbasis AI untuk meningkatkan pelayanan cafe dan restoran. Fitur utamanya meliputi analisis ulasan pelanggan dengan NLP, rekomendasi menu berdasarkan waktu, cuaca, dan preferensi, serta rekomendasi meja reservasi berdasarkan jumlah pelanggan, area, lokasi, dan view yang diinginkan.

## Menjalankan di laptop

**Backend (Django)**, dari folder `backend` dengan venv aktif:

```powershell
pip install -r requirements.txt
python manage.py migrate
python manage.py impor_menu        # isi 224 menu + 47 foto (aman diulang)
python manage.py contoh_aturan     # opsional: contoh aturan rekomendasi cuaca/waktu
python manage.py createsuperuser   # akun admin
python manage.py runserver
```

**Frontend (Next.js)**, dari folder `frontend`:

```powershell
npm install
npm run dev
```

| Alamat | Isi |
|---|---|
| `localhost:3001/admin/login` | Panel admin: menu, aturan rekomendasi, statistik, ulasan, meja & QR, pengaturan |
| `localhost:3001/scan/<kode>` | Pintu masuk pelanggan (dari QR meja) |
| `127.0.0.1:8000/admin/` | Admin bawaan Django |

## Fitur per backlog

| Kode | Fitur | Lokasi |
|---|---|---|
| PLG-01 | Akses menu lewat QR per meja | `meja`, `frontend/app/scan` |
| PLG-02 | Rekomendasi menu sesuai cuaca & waktu (+ cadangan kalau API gagal) | `rekomendasi/mesin.py`, `frontend/app/menu` |
| PLG-03 | Cari, filter kategori & harga | `frontend/app/menu` |
| PLG-04 | Like/dislike anonim, tercatat dengan kondisi cuaca & waktu | `menu.Reaksi` |
| PLG-05 | Ulasan bintang + komentar, sentimen otomatis | `rekomendasi.Ulasan`, `frontend/app/review` |
| ADM-01/02 | Kelola menu + foto, toggle tersedia & best seller | `frontend/app/admin/menu` |
| ADM-03 | Aturan menu per cuaca/waktu + pratinjau | `frontend/app/admin/aturan` |
| ADM-04 | Statistik rekomendasi & like, harian/mingguan | `frontend/app/admin/statistik` |
| ADM-05 | Konfigurasi & tes koneksi API cuaca | `frontend/app/admin/pengaturan` |
| Tambahan | Chatbox rekomendasi (Claude/Gemini/OpenAI atau tanpa AI), keranjang | `rekomendasi/chat.py`, `components/ChatBox.tsx` |
