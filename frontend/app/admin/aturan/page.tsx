"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AdminShell, { Konfirmasi, Saklar, kelasInput, kelasKartu, kelasTombol, kelasTombolGaris } from "../../components/AdminShell";
import { panggilAdmin } from "../../lib/adminApi";
import { rupiah, type Menu } from "../../lib/menu";

type Aturan = {
  id: number;
  menu: number;
  menu_nama: string;
  menu_kategori: string;
  cuaca: string;
  waktu: string;
  prioritas: number;
  aktif: boolean;
};
type HasilSimulasi = { judul: string; menu: (Menu & { alasan: string })[] };

const CUACA = [
  { id: "semua", label: "Semua cuaca" },
  { id: "cerah", label: "Cerah" },
  { id: "berawan", label: "Berawan" },
  { id: "hujan", label: "Hujan" },
  { id: "panas", label: "Panas (31°C ke atas)" },
];
const WAKTU = [
  { id: "semua", label: "Sepanjang hari" },
  { id: "pagi", label: "Pagi (05–11)" },
  { id: "siang", label: "Siang (11–15)" },
  { id: "sore", label: "Sore (15–18)" },
  { id: "malam", label: "Malam (18–05)" },
];
const label = (daftar: { id: string; label: string }[], id: string) => daftar.find((x) => x.id === id)?.label ?? id;

export default function AturanRekomendasi() {
  const [aturan, setAturan] = useState<Aturan[]>([]);
  const [menu, setMenu] = useState<Menu[]>([]);
  const [error, setError] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [filterCuaca, setFilterCuaca] = useState("semua-filter");
  const [hapus, setHapus] = useState<Aturan | null>(null);

  // form tambah
  const [cariMenu, setCariMenu] = useState("");
  const [menuId, setMenuId] = useState("");
  const [cuaca, setCuaca] = useState("hujan");
  const [waktu, setWaktu] = useState("semua");
  const [prioritas, setPrioritas] = useState(3);
  const [menyimpan, setMenyimpan] = useState(false);

  // simulasi
  const [simCuaca, setSimCuaca] = useState("hujan");
  const [simWaktu, setSimWaktu] = useState("malam");
  const [sim, setSim] = useState<HasilSimulasi | null>(null);

  const muat = useCallback(() => {
    Promise.all([panggilAdmin<Aturan[]>("/api/admin/aturan/"), panggilAdmin<Menu[]>("/api/menu/")])
      .then(([a, m]) => {
        setAturan(a);
        setMenu(m.filter((x) => !x.beralkohol && x.kategori !== "lainnya"));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setMemuat(false));
  }, []);

  const simulasikan = useCallback(() => {
    const q = new URLSearchParams({ cuaca: simCuaca === "tidak-tahu" ? "" : simCuaca, waktu: simWaktu });
    panggilAdmin<HasilSimulasi>(`/api/admin/rekomendasi/simulasi/?${q}`)
      .then(setSim)
      .catch((e: Error) => setError(e.message));
  }, [simCuaca, simWaktu]);

  useEffect(() => {
    muat();
  }, [muat]);

  useEffect(() => {
    simulasikan();
  }, [simulasikan, aturan]);

  const pilihanMenu = useMemo(() => {
    const k = cariMenu.trim().toLowerCase();
    return menu.filter((m) => !k || m.nama.toLowerCase().includes(k)).slice(0, 80);
  }, [menu, cariMenu]);

  const tampil = aturan.filter((a) => filterCuaca === "semua-filter" || a.cuaca === filterCuaca);

  const tambah = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!menuId) return setError("Pilih menunya dulu.");
    setMenyimpan(true);
    try {
      const baru = await panggilAdmin<Aturan>("/api/admin/aturan/", {
        method: "POST",
        body: JSON.stringify({ menu: Number(menuId), cuaca, waktu, prioritas }),
      });
      setAturan((l) => [baru, ...l]);
      setMenuId("");
      setCariMenu("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setMenyimpan(false);
    }
  };

  const ubah = async (a: Aturan, data: Partial<Aturan>) => {
    try {
      const baru = await panggilAdmin<Aturan>(`/api/admin/aturan/${a.id}/`, { method: "PATCH", body: JSON.stringify(data) });
      setAturan((l) => l.map((x) => (x.id === a.id ? baru : x)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const jalankanHapus = async () => {
    if (!hapus) return;
    try {
      await panggilAdmin(`/api/admin/aturan/${hapus.id}/`, { method: "DELETE" });
      setAturan((l) => l.filter((x) => x.id !== hapus.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setHapus(null);
    }
  };

  return (
    <AdminShell judul="Aturan rekomendasi">
      <p className="max-w-3xl text-sm leading-relaxed text-[#4f6358]">
        Tentukan menu yang didorong saat cuaca atau jam tertentu, misalnya Ginger Honey Tea saat hujan. Tanpa aturan pun sistem
        tetap merekomendasikan berdasarkan suhu menu (hangat/dingin) dan like pelanggan. Aturan membuat menu pilihanmu naik ke
        urutan atas.
      </p>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <form onSubmit={tambah} className={`${kelasKartu} space-y-3`}>
            <h2 className="font-semibold">Tambah aturan</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Cari menu
                <input value={cariMenu} onChange={(e) => setCariMenu(e.target.value)} placeholder="Ketik nama menu" className={`${kelasInput} mt-1`} />
              </label>
              <label className="block text-sm">
                Menu <span className="text-red-600">*</span>
                <select value={menuId} onChange={(e) => setMenuId(e.target.value)} className={`${kelasInput} mt-1`} required>
                  <option value="">Pilih menu ({pilihanMenu.length})</option>
                  {pilihanMenu.map((m) => (
                    <option key={m.id} value={m.id}>{m.nama}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Saat cuaca
                <select value={cuaca} onChange={(e) => setCuaca(e.target.value)} className={`${kelasInput} mt-1`}>
                  {CUACA.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                Pada waktu
                <select value={waktu} onChange={(e) => setWaktu(e.target.value)} className={`${kelasInput} mt-1`}>
                  {WAKTU.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="block text-sm">
                Prioritas
                <select value={prioritas} onChange={(e) => setPrioritas(Number(e.target.value))} className={`${kelasInput} mt-1 w-40`}>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>{p} {p === 1 ? "(rendah)" : p === 5 ? "(tinggi)" : ""}</option>
                  ))}
                </select>
              </label>
              <button disabled={menyimpan} className={kelasTombol}>{menyimpan ? "Menyimpan..." : "Simpan aturan"}</button>
            </div>
          </form>

          <section className={kelasKartu}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Daftar aturan ({aturan.length})</h2>
              <select value={filterCuaca} onChange={(e) => setFilterCuaca(e.target.value)} className={`${kelasInput} w-auto`} aria-label="Saring menurut cuaca">
                <option value="semua-filter">Semua kondisi</option>
                {CUACA.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            {memuat && <p className="text-sm text-[#4f6358]">Memuat...</p>}
            {!memuat && aturan.length === 0 && (
              <p className="text-sm leading-relaxed text-[#4f6358]">
                Belum ada aturan. Tambahkan lewat form di atas, atau isi contoh aturan dengan perintah
                <code className="mx-1 rounded bg-[#f1f7f3] px-1.5 py-0.5">python manage.py contoh_aturan</code>
                di terminal backend.
              </p>
            )}
            <ul className="divide-y divide-[#eef5f0]">
              {tampil.map((a) => (
                <li key={a.id} className={`flex flex-wrap items-center gap-3 py-2.5 ${a.aktif ? "" : "opacity-50"}`}>
                  <div className="min-w-[180px] flex-1">
                    <p className="font-medium">{a.menu_nama}</p>
                    <p className="text-xs text-[#4f6358]">
                      {label(CUACA, a.cuaca)}, {label(WAKTU, a.waktu).toLowerCase()}
                    </p>
                  </div>
                  <select
                    value={a.prioritas}
                    onChange={(e) => ubah(a, { prioritas: Number(e.target.value) })}
                    aria-label={`Prioritas ${a.menu_nama}`}
                    className="rounded-lg border border-[#d6e6dc] px-2 py-1 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>Prioritas {p}</option>)}
                  </select>
                  <Saklar nyala={a.aktif} onUbah={() => ubah(a, { aktif: !a.aktif })} label={`Aturan ${a.menu_nama} aktif`} />
                  <button onClick={() => setHapus(a)} className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50">Hapus</button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={`${kelasKartu} h-fit space-y-3 lg:sticky lg:top-6`}>
          <h2 className="font-semibold">Coba lihat hasilnya</h2>
          <p className="text-xs text-[#4f6358]">Pratinjau 5 menu yang akan dilihat pelanggan. Tidak dicatat ke statistik.</p>
          <div className="grid grid-cols-2 gap-2">
            <select value={simCuaca} onChange={(e) => setSimCuaca(e.target.value)} className={kelasInput} aria-label="Cuaca simulasi">
              {CUACA.filter((c) => c.id !== "semua").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              <option value="tidak-tahu">API cuaca gagal</option>
            </select>
            <select value={simWaktu} onChange={(e) => setSimWaktu(e.target.value)} className={kelasInput} aria-label="Waktu simulasi">
              {WAKTU.filter((w) => w.id !== "semua").map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>
          {sim && (
            <>
              <p className="rounded-lg bg-[#f1f7f3] px-3 py-2 text-sm font-medium text-[#1f6b50]">&ldquo;{sim.judul}&rdquo;</p>
              <ol className="space-y-2">
                {sim.menu.map((m, i) => (
                  <li key={m.id} className="flex gap-3 text-sm">
                    <span className="w-4 shrink-0 text-right text-[#4f6358]">{i + 1}</span>
                    <span>
                      <span className="block font-medium">{m.nama}</span>
                      <span className="block text-xs text-[#4f6358]">{rupiah(m.harga)}, {m.alasan}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
          <button onClick={simulasikan} className={`${kelasTombolGaris} w-full`}>Muat ulang pratinjau</button>
        </aside>
      </div>

      {hapus && (
        <Konfirmasi
          pesan={`Hapus aturan "${hapus.menu_nama}" saat ${label(CUACA, hapus.cuaca).toLowerCase()}, ${label(WAKTU, hapus.waktu).toLowerCase()}?`}
          onYa={jalankanHapus}
          onBatal={() => setHapus(null)}
        />
      )}
    </AdminShell>
  );
}
