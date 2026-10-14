"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API, KUNCI_TOKEN } from "../../lib/api";

type Statistik = {
  hari: number;
  ringkasan: { total: number; hari_ini: number; periode: number; periode_qr: number; periode_langsung: number };
  harian: { tanggal: string; jumlah: number }[];
  per_jam: { jam: number; jumlah: number }[];
  meja_teratas: { meja: number; jumlah: number }[];
};

function Kartu({ judul, nilai }: { judul: string; nilai: number }) {
  return (
    <div className="rounded-2xl border border-[#cfe7db] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#4f6358]">{judul}</p>
      <p className="text-3xl font-bold text-[#1f6b50]">{nilai.toLocaleString("id-ID")}</p>
    </div>
  );
}

function Batang({ data, label }: { data: { k: string; n: number }[]; label: (k: string) => string }) {
  const maks = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="overflow-x-auto">
      <div className="flex h-44 min-w-max items-end gap-1.5">
        {data.map((d) => (
          <div key={d.k} className="flex w-7 flex-col items-center justify-end gap-1" title={`${label(d.k)}: ${d.n}`}>
            <span className="text-[10px] text-[#4f6358]">{d.n || ""}</span>
            <div className="w-full rounded-t bg-[#2f7d62]" style={{ height: `${(d.n / maks) * 120}px`, minHeight: d.n ? 3 : 1 }} />
            <span className="text-[10px] text-[#4f6358]">{label(d.k)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [hari, setHari] = useState(7);
  const [data, setData] = useState<Statistik | null>(null);
  const [error, setError] = useState("");

  const keluar = useCallback(() => {
    localStorage.removeItem(KUNCI_TOKEN);
    router.replace("/admin/login");
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem(KUNCI_TOKEN);
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    fetch(`${API}/api/admin/statistik/?hari=${hari}`, { headers: { Authorization: `Token ${token}` } })
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          keluar();
          throw new Error("Sesi berakhir.");
        }
        return r.json();
      })
      .then((d: Statistik) => {
        setData(d);
        setError("");
      })
      .catch((e: Error) => setError(e.message));
  }, [hari, router, keluar]);

  const persenQr = data && data.ringkasan.periode ? Math.round((data.ringkasan.periode_qr / data.ringkasan.periode) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2a23]">
      <header className="flex items-center justify-between border-b border-[#e1ece5] bg-white px-4 py-3 sm:px-6">
        <h1 className="text-lg font-bold text-[#1f6b50]">Dashboard Admin - Treehouse</h1>
        <div className="flex gap-2">
          <a href="/admin/meja" className="rounded-lg bg-[#2f7d62] px-3 py-1.5 text-sm text-white hover:bg-[#256650]">
            Kelola Meja & QR
          </a>
          <button onClick={keluar} className="rounded-lg border border-[#d6e6dc] px-3 py-1.5 text-sm hover:bg-[#e6f4ec]">
            Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#4f6358]">Periode:</span>
          {[7, 14, 30].map((h) => (
            <button key={h} onClick={() => setHari(h)} className={`rounded-full px-3 py-1 text-sm ${hari === h ? "bg-[#2f7d62] text-white" : "border border-[#d6e6dc] bg-white"}`}>
              {h} hari
            </button>
          ))}
        </div>

        {error && <p className="text-red-600">{error}</p>}
        {!data && !error && <p>Memuat data...</p>}

        {data && (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kartu judul="Total kunjungan" nilai={data.ringkasan.total} />
              <Kartu judul="Hari ini" nilai={data.ringkasan.hari_ini} />
              <Kartu judul={`${data.hari} hari terakhir`} nilai={data.ringkasan.periode} />
              <Kartu judul={`Via QR (${persenQr}%)`} nilai={data.ringkasan.periode_qr} />
            </section>

            <section className="rounded-2xl border border-[#cfe7db] bg-white p-4">
              <h2 className="mb-3 font-semibold">Kunjungan per hari</h2>
              <Batang data={data.harian.map((d) => ({ k: d.tanggal, n: d.jumlah }))} label={(k) => k.slice(8) + "/" + k.slice(5, 7)} />
            </section>

            <section className="rounded-2xl border border-[#cfe7db] bg-white p-4">
              <h2 className="mb-3 font-semibold">Jam ramai (WIB)</h2>
              <Batang data={data.per_jam.map((d) => ({ k: String(d.jam), n: d.jumlah }))} label={(k) => k.padStart(2, "0")} />
            </section>

            <section className="rounded-2xl border border-[#cfe7db] bg-white p-4">
              <h2 className="mb-3 font-semibold">Meja paling sering scan</h2>
              {data.meja_teratas.length === 0 ? (
                <p className="text-sm text-[#4f6358]">Belum ada data meja.</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {data.meja_teratas.map((m) => (
                    <li key={m.meja} className="flex justify-between border-b border-[#eef5f0] py-1">
                      <span>Meja {m.meja}</span>
                      <strong>{m.jumlah}</strong>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
