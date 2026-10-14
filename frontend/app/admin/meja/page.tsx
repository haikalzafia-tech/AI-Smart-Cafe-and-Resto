"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API, KUNCI_TOKEN } from "../../lib/api";

type Meja = { id: number; nomor: number; aktif: boolean; link: string; qr: string };

export default function KelolaMeja() {
  const router = useRouter();
  const [daftar, setDaftar] = useState<Meja[]>([]);
  const [sampai, setSampai] = useState("20");
  const [nomor, setNomor] = useState("");
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(true);

  const panggil = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = localStorage.getItem(KUNCI_TOKEN);
      if (!token) {
        router.replace("/admin/login");
        throw new Error("Belum login.");
      }
      const r = await fetch(`${API}/api/meja/${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      });
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem(KUNCI_TOKEN);
        router.replace("/admin/login");
        throw new Error("Sesi berakhir.");
      }
      const d = r.status === 204 ? null : await r.json();
      if (!r.ok) throw new Error(d?.detail ?? "Terjadi kesalahan.");
      return d;
    },
    [router]
  );

  useEffect(() => {
    panggil("")
      .then(setDaftar)
      .catch((e: Error) => setPesan(e.message))
      .finally(() => setMemuat(false));
  }, [panggil]);

  const buat = (body: object) => {
    setPesan("");
    panggil("", { method: "POST", body: JSON.stringify(body) })
      .then(setDaftar)
      .catch((e: Error) => setPesan(e.message));
  };

  const ubahAktif = (m: Meja) =>
    panggil(`${m.id}/`, { method: "PATCH", body: JSON.stringify({ aktif: !m.aktif }) })
      .then((baru: Meja) => setDaftar((l) => l.map((x) => (x.id === baru.id ? baru : x))))
      .catch((e: Error) => setPesan(e.message));

  const hapus = (m: Meja) => {
    if (!confirm(`Hapus Meja ${m.nomor}? QR yang sudah ditempel tidak akan bisa dipakai lagi.`)) return;
    panggil(`${m.id}/`, { method: "DELETE" })
      .then(() => setDaftar((l) => l.filter((x) => x.id !== m.id)))
      .catch((e: Error) => setPesan(e.message));
  };

  const tombol = "rounded-lg bg-[#2f7d62] px-3 py-1.5 text-sm text-white hover:bg-[#256650]";
  const input = "mt-1 w-24 rounded-lg border border-[#d6e6dc] px-3 py-1.5";

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2a23] print:bg-white">
      <header className="flex items-center justify-between border-b border-[#e1ece5] bg-white px-4 py-3 sm:px-6 print:hidden">
        <h1 className="text-lg font-bold text-[#1f6b50]">Kelola Meja & QR</h1>
        <div className="flex gap-2">
          <a href="/admin/dashboard" className="rounded-lg border border-[#d6e6dc] px-3 py-1.5 text-sm hover:bg-[#e6f4ec]">
            ← Dashboard
          </a>
          <button onClick={() => window.print()} className={tombol}>Cetak QR</button>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 print:max-w-none print:p-0">
        <section className="grid gap-4 rounded-2xl border border-[#cfe7db] bg-white p-4 sm:grid-cols-2 print:hidden">
          <form onSubmit={(e) => { e.preventDefault(); buat({ sampai: Number(sampai) }); }} className="flex items-end gap-2">
            <label className="flex flex-col text-sm">
              Buat meja 1 sampai
              <input type="number" min={1} max={200} value={sampai} onChange={(e) => setSampai(e.target.value)} className={input} />
            </label>
            <button className={tombol}>Buat</button>
          </form>
          <form onSubmit={(e) => { e.preventDefault(); buat({ nomor: Number(nomor) }); setNomor(""); }} className="flex items-end gap-2">
            <label className="flex flex-col text-sm">
              Tambah satu meja, nomor
              <input type="number" min={1} value={nomor} onChange={(e) => setNomor(e.target.value)} className={input} required />
            </label>
            <button className={tombol}>Tambah</button>
          </form>
          <p className="text-xs text-[#4f6358] sm:col-span-2">
            Meja yang sudah ada tidak dibuat ulang, jadi QR yang sudah ditempel tetap berlaku.
          </p>
        </section>

        {pesan && <p className="text-red-600 print:hidden">{pesan}</p>}
        {memuat && <p>Memuat...</p>}
        {!memuat && daftar.length === 0 && <p className="text-sm text-[#4f6358]">Belum ada meja.</p>}

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
          {daftar.map((m) => (
            <div
              key={m.id}
              className={`break-inside-avoid rounded-2xl border bg-white p-4 text-center ${
                m.aktif ? "border-[#cfe7db]" : "border-red-200 opacity-60 print:hidden"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-[#2f7d62]">Treehouse Cafe and Resto</p>
              <p className="text-2xl font-bold text-[#1f6b50]">Meja {m.nomor}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.qr} alt={`QR Meja ${m.nomor}`} className="mx-auto my-2 w-full max-w-[180px]" />
              <p className="text-xs text-[#4f6358]">Scan untuk melihat menu</p>
              <div className="mt-3 space-y-2 print:hidden">
                <a href={m.link} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-blue-600 underline">
                  {m.link}
                </a>
                <div className="flex justify-center gap-2">
                  <button onClick={() => ubahAktif(m)} className="rounded-lg border border-[#d6e6dc] px-2 py-1 text-xs hover:bg-[#e6f4ec]">
                    {m.aktif ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button onClick={() => hapus(m)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}