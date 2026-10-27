"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell, { Angka, Konfirmasi, kelasKartu } from "../../components/AdminShell";
import { formatTanggal, panggilAdmin } from "../../lib/adminApi";

type Ulasan = { id: number; meja: number | null; rating: number; komentar: string; sentimen: "positif" | "netral" | "negatif"; dibuat: string };
type Data = {
  ringkasan: { jumlah: number; rata_rating: number; sentimen: Record<string, number>; bintang: Record<string, number> };
  ulasan: Ulasan[];
};

const GAYA_SENTIMEN = {
  positif: "bg-[#e6f4ec] text-[#1f6b50]",
  netral: "bg-[#eef1f3] text-[#4f5b63]",
  negatif: "bg-red-50 text-red-700",
};

export default function DaftarUlasan() {
  const [data, setData] = useState<Data | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [hapus, setHapus] = useState<Ulasan | null>(null);

  const muat = useCallback(() => {
    panggilAdmin<Data>(`/api/admin/ulasan/${filter ? `?sentimen=${filter}` : ""}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [filter]);

  useEffect(() => {
    muat();
  }, [muat]);

  const jalankanHapus = async () => {
    if (!hapus) return;
    try {
      await panggilAdmin(`/api/admin/ulasan/${hapus.id}/`, { method: "DELETE" });
      muat();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setHapus(null);
    }
  };

  const r = data?.ringkasan;
  const maksBintang = r ? Math.max(1, ...Object.values(r.bintang)) : 1;

  return (
    <AdminShell judul="Ulasan pelanggan">
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-sm text-[#4f6358]">Memuat ulasan...</p>}

      {data && r && (
        <>
          <section className="grid gap-3 md:grid-cols-[repeat(4,1fr)_1.6fr]">
            <Angka judul="Total ulasan" nilai={r.jumlah} />
            <Angka judul="Rata-rata" nilai={r.jumlah ? `${r.rata_rating.toLocaleString("id-ID")} ★` : "-"} />
            <Angka judul="Positif" nilai={r.sentimen.positif} />
            <Angka judul="Negatif" nilai={r.sentimen.negatif} catatan={`${r.sentimen.netral} netral`} />
            <div className="rounded-2xl border border-[#cfe7db] bg-white p-4">
              <p className="mb-2 text-sm text-[#4f6358]">Sebaran bintang</p>
              {[5, 4, 3, 2, 1].map((b) => (
                <div key={b} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-right">{b}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef5f0]">
                    <div className="h-full rounded-full bg-[#d98a3d]" style={{ width: `${(r.bintang[String(b)] / maksBintang) * 100}%` }} />
                  </div>
                  <span className="w-6 tabular-nums">{r.bintang[String(b)]}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#4f6358]">Sentimen:</span>
            {[["", "Semua"], ["positif", "Positif"], ["netral", "Netral"], ["negatif", "Negatif"]].map(([id, lbl]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={`rounded-full px-3 py-1 text-sm ${filter === id ? "bg-[#2f7d62] text-white" : "border border-[#d6e6dc] bg-white"}`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {data.ulasan.length === 0 ? (
            <p className="text-sm text-[#4f6358]">Belum ada ulasan{filter ? ` dengan sentimen ${filter}` : ""}. Ulasan masuk dari tombol &ldquo;Beri Ulasan&rdquo; di halaman pelanggan.</p>
          ) : (
            <ul className="space-y-3">
              {data.ulasan.map((u) => (
                <li key={u.id} className={kelasKartu}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[#d98a3d]" aria-label={`${u.rating} dari 5 bintang`}>
                      {"★".repeat(u.rating)}<span className="text-[#dfe6e2]">{"★".repeat(5 - u.rating)}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${GAYA_SENTIMEN[u.sentimen]}`}>{u.sentimen}</span>
                    <span className="text-xs text-[#4f6358]">Meja {u.meja ?? "-"}, {formatTanggal(u.dibuat)}</span>
                    <button onClick={() => setHapus(u)} className="ml-auto rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50">Hapus</button>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{u.komentar || <span className="text-[#4f6358]">Tanpa komentar.</span>}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {hapus && (
        <Konfirmasi pesan="Hapus ulasan ini? Biasanya hanya untuk ulasan spam atau tidak pantas." onYa={jalankanHapus} onBatal={() => setHapus(null)} />
      )}
    </AdminShell>
  );
}
