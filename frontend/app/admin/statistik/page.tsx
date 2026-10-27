"use client";

import { useEffect, useState } from "react";
import AdminShell, { Angka, kelasKartu } from "../../components/AdminShell";
import { panggilAdmin } from "../../lib/adminApi";

type Baris = { "menu__id": number; "menu__nama": string };
type Statistik = {
  hari: number;
  kelompok: "harian" | "mingguan";
  ringkasan: { rekomendasi: number; rekomendasi_chat: number; suka: number; tidak_suka: number; ulasan: number; rata_rating: number };
  rekomendasi_teratas: (Baris & { jumlah: number })[];
  disukai_teratas: (Baris & { suka: number; tidak_suka: number })[];
  tidak_disukai_teratas: (Baris & { suka: number; tidak_suka: number })[];
  per_kondisi: { kondisi: string; label: string; suka: number; tidak_suka: number; rekomendasi: number }[];
  seri: { tanggal: string; rekomendasi: number; suka: number; tidak_suka: number }[];
};

function Grafik({ data, warna, satuan }: { data: { label: string; nilai: number }[]; warna: string; satuan: string }) {
  const maks = Math.max(1, ...data.map((d) => d.nilai));
  return (
    <div className="overflow-x-auto">
      <div className="flex h-44 min-w-max items-end gap-1.5" role="img" aria-label={data.map((d) => `${d.label}: ${d.nilai} ${satuan}`).join(", ")}>
        {data.map((d) => (
          <div key={d.label} className="flex w-9 flex-col items-center justify-end gap-1" title={`${d.label}: ${d.nilai} ${satuan}`}>
            <span className="text-[10px] text-[#4f6358]">{d.nilai || ""}</span>
            <div className="w-full rounded-t" style={{ background: warna, height: `${(d.nilai / maks) * 120}px`, minHeight: d.nilai ? 3 : 1 }} />
            <span className="text-[10px] text-[#4f6358]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tabel({ judul, kosong, kolom, baris }: { judul: string; kosong: string; kolom: string[]; baris: (string | number)[][] }) {
  return (
    <section className={kelasKartu}>
      <h2 className="mb-3 font-semibold">{judul}</h2>
      {baris.length === 0 ? (
        <p className="text-sm text-[#4f6358]">{kosong}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#4f6358]">
              {kolom.map((k, i) => <th key={k} className={`pb-2 font-medium ${i ? "text-right" : ""}`}>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {baris.map((b, i) => (
              <tr key={i} className="border-t border-[#eef5f0]">
                {b.map((sel, j) => <td key={j} className={`py-1.5 ${j ? "text-right tabular-nums" : ""}`}>{sel}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const labelTanggal = (iso: string, mingguan: boolean) => {
  const d = new Date(iso + "T00:00:00");
  const t = `${d.getDate()}/${d.getMonth() + 1}`;
  return mingguan ? `mg ${t}` : t;
};

export default function StatistikMenu() {
  const [hari, setHari] = useState(7);
  const [kelompok, setKelompok] = useState<"harian" | "mingguan">("harian");
  const [data, setData] = useState<Statistik | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    panggilAdmin<Statistik>(`/api/admin/statistik-menu/?hari=${hari}&kelompok=${kelompok}`)
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e: Error) => setError(e.message));
  }, [hari, kelompok]);

  const mingguan = data?.kelompok === "mingguan";
  const r = data?.ringkasan;
  const totalReaksi = r ? r.suka + r.tidak_suka : 0;

  return (
    <AdminShell judul="Statistik menu">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[#4f6358]">Periode:</span>
        {[7, 14, 30, 90].map((h) => (
          <button
            key={h}
            onClick={() => setHari(h)}
            aria-pressed={hari === h}
            className={`rounded-full px-3 py-1 text-sm ${hari === h ? "bg-[#2f7d62] text-white" : "border border-[#d6e6dc] bg-white"}`}
          >
            {h} hari
          </button>
        ))}
        <span className="ml-2 text-sm text-[#4f6358]">Tampilkan:</span>
        {(["harian", "mingguan"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKelompok(k)}
            aria-pressed={kelompok === k}
            className={`rounded-full px-3 py-1 text-sm capitalize ${kelompok === k ? "bg-[#2f7d62] text-white" : "border border-[#d6e6dc] bg-white"}`}
          >
            {k}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-sm text-[#4f6358]">Memuat statistik...</p>}

      {data && r && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Angka judul="Menu direkomendasikan" nilai={r.rekomendasi} catatan={`${r.rekomendasi_chat} di antaranya lewat chat`} />
            <Angka judul="Suka" nilai={r.suka} catatan={totalReaksi ? `${Math.round((r.suka / totalReaksi) * 100)}% dari semua penilaian` : "Belum ada penilaian"} />
            <Angka judul="Tidak suka" nilai={r.tidak_suka} />
            <Angka judul="Rata-rata ulasan" nilai={r.ulasan ? `${r.rata_rating.toLocaleString("id-ID")} ★` : "-"} catatan={`${r.ulasan} ulasan`} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className={kelasKartu}>
              <h2 className="mb-3 font-semibold">Frekuensi rekomendasi {mingguan ? "per minggu" : "per hari"}</h2>
              <Grafik
                warna="#2f7d62"
                satuan="menu direkomendasikan"
                data={data.seri.map((s) => ({ label: labelTanggal(s.tanggal, mingguan), nilai: s.rekomendasi }))}
              />
            </section>
            <section className={kelasKartu}>
              <h2 className="mb-3 font-semibold">Suka {mingguan ? "per minggu" : "per hari"}</h2>
              <Grafik
                warna="#d98a3d"
                satuan="suka"
                data={data.seri.map((s) => ({ label: labelTanggal(s.tanggal, mingguan), nilai: s.suka }))}
              />
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Tabel
              judul="Paling sering direkomendasikan"
              kosong="Belum ada rekomendasi di periode ini. Data muncul setelah pelanggan membuka halaman menu lewat QR."
              kolom={["Menu", "Kali"]}
              baris={data.rekomendasi_teratas.map((x) => [x["menu__nama"], x.jumlah])}
            />
            <Tabel
              judul="Paling disukai"
              kosong="Belum ada like di periode ini."
              kolom={["Menu", "Suka", "Tidak suka"]}
              baris={data.disukai_teratas.map((x) => [x["menu__nama"], x.suka, x.tidak_suka])}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Tabel
              judul="Penilaian per kondisi cuaca"
              kosong=""
              kolom={["Cuaca saat itu", "Direkomendasikan", "Suka", "Tidak suka"]}
              baris={data.per_kondisi
                .filter((k) => k.rekomendasi || k.suka || k.tidak_suka || k.kondisi !== "tidak_diketahui")
                .map((k) => [k.label, k.rekomendasi, k.suka, k.tidak_suka])}
            />
            <Tabel
              judul="Perlu perhatian (paling banyak tidak disukai)"
              kosong="Belum ada menu yang mendapat dislike. Bagus!"
              kolom={["Menu", "Tidak suka", "Suka"]}
              baris={data.tidak_disukai_teratas.map((x) => [x["menu__nama"], x.tidak_suka, x.suka])}
            />
          </div>
        </>
      )}
    </AdminShell>
  );
}
