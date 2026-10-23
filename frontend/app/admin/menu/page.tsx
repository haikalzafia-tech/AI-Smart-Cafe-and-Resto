"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AdminShell, { Konfirmasi, Saklar, kelasInput, kelasKartu, kelasTombol, kelasTombolGaris } from "../../components/AdminShell";
import { panggilAdmin } from "../../lib/adminApi";
import { ikonMenu, rupiah, type Menu, type Varian } from "../../lib/menu";

const KATEGORI = [
  { id: "makanan", label: "Makanan" },
  { id: "minuman", label: "Minuman" },
  { id: "dessert", label: "Dessert" },
  { id: "alkohol", label: "Alkohol" },
  { id: "lainnya", label: "Lainnya" },
];
const SUHU = [
  { id: "hangat", label: "Hangat / panas" },
  { id: "dingin", label: "Dingin / segar" },
  { id: "fleksibel", label: "Bisa hot / ice" },
  { id: "netral", label: "Netral" },
];
const labelKategori = (id: string) => KATEGORI.find((k) => k.id === id)?.label ?? id;
const labelSuhu = (id: string) => SUHU.find((s) => s.id === id)?.label ?? id;

export default function KelolaMenu() {
  const [menu, setMenu] = useState<Menu[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cari, setCari] = useState("");
  const [kategori, setKategori] = useState("semua");
  const [status, setStatus] = useState("semua");
  const [form, setForm] = useState<Menu | "baru" | null>(null);
  const [hapus, setHapus] = useState<Menu | null>(null);
  const [sibuk, setSibuk] = useState<number | null>(null);

  const muat = useCallback(() => {
    panggilAdmin<Menu[]>("/api/menu/")
      .then(setMenu)
      .catch((e: Error) => setError(e.message))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(""), 2500);
    return () => clearTimeout(t);
  }, [info]);

  const tersaring = useMemo(() => {
    const k = cari.trim().toLowerCase();
    return menu.filter(
      (m) =>
        (!k || `${m.nama} ${m.subkategori}`.toLowerCase().includes(k)) &&
        (kategori === "semua" || m.kategori === kategori) &&
        (status === "semua" || (status === "tersedia" ? m.tersedia : !m.tersedia))
    );
  }, [menu, cari, kategori, status]);

  // ADM-02: ubah status langsung dari daftar
  const ubah = async (m: Menu, data: Partial<Menu>, pesan: string) => {
    setSibuk(m.id);
    try {
      const baru = await panggilAdmin<Menu>(`/api/menu/${m.id}/`, { method: "PATCH", body: JSON.stringify(data) });
      setMenu((l) => l.map((x) => (x.id === m.id ? { ...x, ...baru, suka: x.suka, tidak_suka: x.tidak_suka } : x)));
      setInfo(pesan);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSibuk(null);
    }
  };

  const jalankanHapus = async () => {
    if (!hapus) return;
    try {
      await panggilAdmin(`/api/menu/${hapus.id}/`, { method: "DELETE" });
      setMenu((l) => l.filter((x) => x.id !== hapus.id));
      setInfo(`${hapus.nama} dihapus`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setHapus(null);
    }
  };

  const subkategoriAda = useMemo(() => [...new Set(menu.map((m) => m.subkategori))].sort(), [menu]);
  const jumlahHabis = menu.filter((m) => !m.tersedia).length;

  return (
    <AdminShell judul="Kelola menu" aksi={<button onClick={() => setForm("baru")} className={kelasTombol}>Tambah menu</button>}>
      <section className={`${kelasKartu} flex flex-wrap items-end gap-3`}>
        <label className="min-w-[200px] flex-1 text-sm">
          Cari
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Nama atau kelompok menu" className={`${kelasInput} mt-1`} />
        </label>
        <label className="text-sm">
          Kategori
          <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={`${kelasInput} mt-1`}>
            <option value="semua">Semua</option>
            {KATEGORI.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${kelasInput} mt-1`}>
            <option value="semua">Semua</option>
            <option value="tersedia">Tersedia</option>
            <option value="habis">Habis</option>
          </select>
        </label>
        <p className="w-full text-xs text-[#4f6358]">
          {menu.length} menu, {jumlahHabis} sedang habis. Status tersedia/habis langsung terlihat di halaman pelanggan dalam satu menit.
        </p>
      </section>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {memuat && <p className="text-sm text-[#4f6358]">Memuat menu...</p>}
      {!memuat && tersaring.length === 0 && <p className="text-sm text-[#4f6358]">Tidak ada menu yang cocok dengan filter ini.</p>}

      {tersaring.length > 0 && (
        <section className="overflow-x-auto rounded-2xl border border-[#cfe7db] bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-[#f1f7f3] text-left text-xs text-[#4f6358]">
              <tr>
                <th className="px-3 py-2.5 font-medium">Menu</th>
                <th className="px-3 py-2.5 font-medium">Kategori</th>
                <th className="px-3 py-2.5 text-right font-medium">Harga</th>
                <th className="px-3 py-2.5 font-medium">Suhu</th>
                <th className="px-3 py-2.5 text-center font-medium">Suka</th>
                <th className="px-3 py-2.5 text-center font-medium">Tersedia</th>
                <th className="px-3 py-2.5 text-center font-medium">Best seller</th>
                <th className="px-3 py-2.5"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {tersaring.map((m) => (
                <tr key={m.id} className={`border-t border-[#eef5f0] ${m.tersedia ? "" : "bg-[#fafafa] text-[#7b8a82]"}`}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#e6f4ec] text-xl">
                        {m.foto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.foto} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span aria-hidden="true">{ikonMenu(m)}</span>
                        )}
                      </span>
                      <span>
                        <span className="block font-medium text-[#1f2a23]">{m.nama}</span>
                        <span className="text-xs text-[#4f6358]">{m.subkategori}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">{labelKategori(m.kategori)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {m.varian.length > 0 ? `mulai ${rupiah(m.harga)}` : rupiah(m.harga)}
                  </td>
                  <td className="px-3 py-2 text-xs">{labelSuhu(m.suhu)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-center text-xs">👍 {m.suka} 👎 {m.tidak_suka}</td>
                  <td className="px-3 py-2 text-center">
                    <Saklar
                      nyala={m.tersedia}
                      disabled={sibuk === m.id}
                      label={`${m.nama} tersedia`}
                      onUbah={() => ubah(m, { tersedia: !m.tersedia }, `${m.nama} ${m.tersedia ? "ditandai habis" : "tersedia lagi"}`)}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Saklar
                      nyala={m.best_seller}
                      disabled={sibuk === m.id}
                      label={`${m.nama} best seller`}
                      onUbah={() => ubah(m, { best_seller: !m.best_seller }, `Best seller ${m.best_seller ? "dilepas dari" : "ditambahkan ke"} ${m.nama}`)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button onClick={() => setForm(m)} className="rounded-lg px-2.5 py-1.5 text-sm text-[#1f6b50] hover:bg-[#e6f4ec]">Ubah</button>
                    <button onClick={() => setHapus(m)} className="rounded-lg px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {info && (
        <p role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1f3a2e] px-4 py-2 text-sm text-white shadow-lg">
          {info}
        </p>
      )}

      {hapus && (
        <Konfirmasi
          pesan={`Hapus "${hapus.nama}"? Menu ini akan hilang dari halaman pelanggan, aturan rekomendasi, dan data like-nya juga ikut terhapus.`}
          onYa={jalankanHapus}
          onBatal={() => setHapus(null)}
        />
      )}

      {form && (
        <FormMenu
          awal={form === "baru" ? null : form}
          subkategoriAda={subkategoriAda}
          onBatal={() => setForm(null)}
          onTersimpan={(m, baru) => {
            setMenu((l) => (baru ? [...l, { ...m, suka: 0, tidak_suka: 0 }] : l.map((x) => (x.id === m.id ? { ...m, suka: x.suka, tidak_suka: x.tidak_suka } : x))));
            setInfo(baru ? `${m.nama} ditambahkan` : `${m.nama} disimpan`);
            setForm(null);
          }}
        />
      )}
    </AdminShell>
  );
}

/* ---------- Form tambah / ubah menu ---------- */

function FormMenu({
  awal,
  subkategoriAda,
  onBatal,
  onTersimpan,
}: {
  awal: Menu | null;
  subkategoriAda: string[];
  onBatal: () => void;
  onTersimpan: (m: Menu, baru: boolean) => void;
}) {
  const [nama, setNama] = useState(awal?.nama ?? "");
  const [kategori, setKategori] = useState(awal?.kategori ?? "makanan");
  const [subkategori, setSubkategori] = useState(awal?.subkategori ?? "");
  const [deskripsi, setDeskripsi] = useState(awal?.deskripsi ?? "");
  const [harga, setHarga] = useState(awal && !awal.varian.length ? String(awal.harga) : "");
  const [varian, setVarian] = useState<{ nama: string; harga: string }[]>(
    (awal?.varian ?? []).map((v: Varian) => ({ nama: v.nama, harga: String(v.harga) }))
  );
  const [suhu, setSuhu] = useState<string>(awal?.suhu ?? "netral");
  const [tag, setTag] = useState((awal?.tag ?? []).join(", "));
  const [beralkohol, setBeralkohol] = useState(awal?.beralkohol ?? false);
  const [tersedia, setTersedia] = useState(awal?.tersedia ?? true);
  const [bestSeller, setBestSeller] = useState(awal?.best_seller ?? false);
  const [foto, setFoto] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(awal?.foto ?? null);
  const [error, setError] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    if (!foto) return;
    const url = URL.createObjectURL(foto);
    setPratinjau(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBatal();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onBatal]);

  const simpan = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    // Validasi field wajib di sisi browser (backend juga memvalidasi ulang)
    const varianBersih = varian.filter((v) => v.nama.trim() || v.harga.trim());
    if (!nama.trim()) return setError("Nama menu wajib diisi.");
    if (!subkategori.trim()) return setError("Kelompok menu wajib diisi, misalnya Soup atau Mocktail.");
    if (varianBersih.some((v) => !v.nama.trim() || !(Number(v.harga) > 0)))
      return setError("Setiap varian butuh nama dan harga lebih dari 0.");
    if (!varianBersih.length && !(Number(harga) > 0)) return setError("Harga wajib diisi dan harus lebih dari 0.");
    if (foto && foto.size > 5 * 1024 * 1024) return setError("Ukuran foto maksimal 5 MB.");

    const fd = new FormData();
    fd.append("nama", nama.trim());
    fd.append("kategori", kategori);
    fd.append("subkategori", subkategori.trim());
    fd.append("deskripsi", deskripsi.trim());
    fd.append("varian", JSON.stringify(varianBersih.map((v) => ({ nama: v.nama.trim(), harga: Number(v.harga) }))));
    if (!varianBersih.length) fd.append("harga", String(Number(harga)));
    fd.append("suhu", suhu);
    fd.append("tag", JSON.stringify(tag.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)));
    fd.append("beralkohol", String(beralkohol));
    fd.append("tersedia", String(tersedia));
    fd.append("best_seller", String(bestSeller));
    if (foto) fd.append("foto", foto);

    setMenyimpan(true);
    try {
      const m = await panggilAdmin<Menu>(awal ? `/api/menu/${awal.id}/` : "/api/menu/", {
        method: awal ? "PATCH" : "POST",
        body: fd,
      });
      onTersimpan(m, !awal);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={onBatal}>
      <form
        onSubmit={simpan}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={awal ? `Ubah ${awal.nama}` : "Tambah menu"}
        className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1f6b50]">{awal ? `Ubah ${awal.nama}` : "Tambah menu"}</h2>
          <button type="button" onClick={onBatal} aria-label="Tutup" className="rounded-lg px-2 py-1 text-lg hover:bg-[#e6f4ec]">✕</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div>
            <span className="text-sm">Foto</span>
            <label className="mt-1 grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-[#cfe7db] bg-[#f6faf7] text-center text-xs text-[#4f6358] hover:border-[#2f7d62]">
              {pratinjau ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pratinjau} alt="Pratinjau foto" className="h-full w-full object-cover" />
              ) : (
                <span className="px-2">Pilih foto (JPG/PNG, maks 5 MB)</span>
              )}
              <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} className="sr-only" />
            </label>
            {pratinjau && <p className="mt-1 text-xs text-[#4f6358]">Klik foto untuk mengganti.</p>}
          </div>

          <div className="space-y-3">
            <label className="block text-sm">
              Nama menu <span className="text-red-600">*</span>
              <input value={nama} onChange={(e) => setNama(e.target.value)} className={`${kelasInput} mt-1`} required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Kategori <span className="text-red-600">*</span>
                <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={`${kelasInput} mt-1`}>
                  {KATEGORI.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                Kelompok <span className="text-red-600">*</span>
                <input
                  value={subkategori}
                  onChange={(e) => setSubkategori(e.target.value)}
                  list="daftar-subkategori"
                  placeholder="Soup, Mocktail, ..."
                  className={`${kelasInput} mt-1`}
                  required
                />
                <datalist id="daftar-subkategori">
                  {subkategoriAda.map((s) => <option key={s} value={s} />)}
                </datalist>
              </label>
            </div>
          </div>
        </div>

        <label className="block text-sm">
          Deskripsi / bahan
          <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={2} className={`${kelasInput} mt-1 resize-none`} />
        </label>

        <fieldset className="rounded-xl border border-[#e1ece5] p-3">
          <legend className="px-1 text-sm">Harga <span className="text-red-600">*</span></legend>
          {varian.length === 0 ? (
            <label className="block text-sm">
              <span className="sr-only">Harga (Rupiah)</span>
              <input type="number" min={1} step={500} value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="Contoh: 45000" className={kelasInput} />
            </label>
          ) : (
            <p className="mb-2 text-xs text-[#4f6358]">Menu ini punya ukuran/varian. Harga yang ditampilkan otomatis memakai varian termurah.</p>
          )}
          {varian.map((v, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <input
                value={v.nama}
                onChange={(e) => setVarian((l) => l.map((x, j) => (j === i ? { ...x, nama: e.target.value } : x)))}
                placeholder="Nama varian (Small, 2 pax)"
                aria-label={`Nama varian ${i + 1}`}
                className={kelasInput}
              />
              <input
                type="number"
                min={1}
                step={500}
                value={v.harga}
                onChange={(e) => setVarian((l) => l.map((x, j) => (j === i ? { ...x, harga: e.target.value } : x)))}
                placeholder="Harga"
                aria-label={`Harga varian ${i + 1}`}
                className={`${kelasInput} max-w-[140px]`}
              />
              <button type="button" onClick={() => setVarian((l) => l.filter((_, j) => j !== i))} aria-label={`Hapus varian ${i + 1}`} className="rounded-lg px-2 text-red-600 hover:bg-red-50">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setVarian((l) => [...l, { nama: "", harga: "" }])} className="mt-2 text-sm text-[#1f6b50] hover:underline">
            Tambah varian / ukuran
          </button>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Suhu (untuk rekomendasi cuaca)
            <select value={suhu} onChange={(e) => setSuhu(e.target.value)} className={`${kelasInput} mt-1`}>
              {SUHU.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            Ciri / tag (pisahkan dengan koma)
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="pedas, seafood, berkuah" className={`${kelasInput} mt-1`} />
          </label>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={tersedia} onChange={(e) => setTersedia(e.target.checked)} className="accent-[#2f7d62]" /> Tersedia</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={bestSeller} onChange={(e) => setBestSeller(e.target.checked)} className="accent-[#2f7d62]" /> Best seller</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={beralkohol} onChange={(e) => setBeralkohol(e.target.checked)} className="accent-[#2f7d62]" /> Mengandung alkohol</label>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-[#eef5f0] pt-4">
          <button type="button" onClick={onBatal} className={kelasTombolGaris}>Batal</button>
          <button disabled={menyimpan} className={kelasTombol}>{menyimpan ? "Menyimpan..." : awal ? "Simpan perubahan" : "Tambah menu"}</button>
        </div>
      </form>
    </div>
  );
}
