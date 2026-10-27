"use client";

import { useEffect, useState, type FormEvent } from "react";
import AdminShell, { kelasInput, kelasKartu, kelasTombol, kelasTombolGaris } from "../../components/AdminShell";
import { formatTanggal, panggilAdmin } from "../../lib/adminApi";

type Status = { status_terakhir: string; pesan_terakhir: string; dicek_pada: string | null; api_key_terisi: boolean };
type KonfCuaca = Status & {
  penyedia: string; endpoint: string; nama_lokasi: string; lintang: number; bujur: number; cache_menit: number; aktif: boolean;
};
type KonfAI = Status & { penyedia: string; model: string; model_dipakai: string };

function LencanaStatus({ s }: { s: Status }) {
  const gaya =
    s.status_terakhir === "berhasil" ? "bg-[#e6f4ec] text-[#1f6b50]" : s.status_terakhir === "gagal" ? "bg-red-50 text-red-700" : "bg-[#eef1f3] text-[#4f5b63]";
  const teks = s.status_terakhir === "berhasil" ? "Terhubung" : s.status_terakhir === "gagal" ? "Gagal" : "Belum dites";
  return (
    <div className={`rounded-xl px-3 py-2.5 text-sm ${gaya}`} role="status">
      <p className="font-semibold">{teks}</p>
      {s.pesan_terakhir && <p className="mt-0.5 break-words">{s.pesan_terakhir}</p>}
      {s.dicek_pada && <p className="mt-0.5 text-xs opacity-80">Dicek {formatTanggal(s.dicek_pada)}</p>}
    </div>
  );
}

function KolomKunci({ terisi, nilai, onUbah, hapus, onHapus, label }: {
  terisi: boolean; nilai: string; onUbah: (v: string) => void; hapus: boolean; onHapus: (v: boolean) => void; label: string;
}) {
  return (
    <div className="text-sm">
      <label className="block">
        {label}
        <input
          type="password"
          autoComplete="off"
          value={nilai}
          onChange={(e) => onUbah(e.target.value)}
          placeholder={terisi ? "Tersimpan. Isi hanya kalau mau mengganti." : "Tempel API key di sini"}
          className={`${kelasInput} mt-1`}
        />
      </label>
      {terisi && (
        <label className="mt-1.5 flex items-center gap-2 text-xs text-[#4f6358]">
          <input type="checkbox" checked={hapus} onChange={(e) => onHapus(e.target.checked)} className="accent-[#2f7d62]" /> Hapus API key yang tersimpan
        </label>
      )}
    </div>
  );
}

export default function Pengaturan() {
  const [cuaca, setCuaca] = useState<KonfCuaca | null>(null);
  const [ai, setAi] = useState<KonfAI | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([panggilAdmin<KonfCuaca>("/api/admin/konfigurasi/cuaca/"), panggilAdmin<KonfAI>("/api/admin/konfigurasi/ai/")])
      .then(([c, a]) => {
        setCuaca(c);
        setAi(a);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <AdminShell judul="Pengaturan">
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {!cuaca && !error && <p className="text-sm text-[#4f6358]">Memuat pengaturan...</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        {cuaca && <FormCuaca awal={cuaca} />}
        {ai && <FormAI awal={ai} />}
      </div>
    </AdminShell>
  );
}

/* ---------- ADM-05: API cuaca ---------- */
function FormCuaca({ awal }: { awal: KonfCuaca }) {
  const [k, setK] = useState(awal);
  const [kunci, setKunci] = useState("");
  const [hapusKunci, setHapusKunci] = useState(false);
  const [sibuk, setSibuk] = useState<"" | "simpan" | "tes">("");
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");
  const set = <K extends keyof KonfCuaca>(f: K, v: KonfCuaca[K]) => setK((x) => ({ ...x, [f]: v }));

  const simpan = async (e?: FormEvent) => {
    e?.preventDefault();
    setSibuk("simpan");
    setError("");
    setPesan("");
    try {
      const d = await panggilAdmin<KonfCuaca>("/api/admin/konfigurasi/cuaca/", {
        method: "PATCH",
        body: JSON.stringify({
          penyedia: k.penyedia, endpoint: k.endpoint, nama_lokasi: k.nama_lokasi, lintang: Number(k.lintang),
          bujur: Number(k.bujur), cache_menit: Number(k.cache_menit), aktif: k.aktif, api_key: kunci, hapus_api_key: hapusKunci,
        }),
      });
      setK(d);
      setKunci("");
      setHapusKunci(false);
      setPesan("Pengaturan cuaca disimpan.");
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setSibuk("");
    }
  };

  const tes = async () => {
    if (!(await simpan())) return;
    setSibuk("tes");
    try {
      const d = await panggilAdmin<{ konfigurasi: KonfCuaca }>("/api/admin/konfigurasi/cuaca/tes/", { method: "POST" });
      setK(d.konfigurasi);
      setPesan("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSibuk("");
    }
  };

  return (
    <form onSubmit={simpan} className={`${kelasKartu} space-y-4`}>
      <div>
        <h2 className="font-semibold">API cuaca</h2>
        <p className="text-xs text-[#4f6358]">Dipakai untuk rekomendasi menu dan cuaca di beranda. Kalau gagal, rekomendasi tetap jalan berdasarkan jam.</p>
      </div>
      <LencanaStatus s={k} />
      <label className="block text-sm">
        Penyedia
        <select value={k.penyedia} onChange={(e) => set("penyedia", e.target.value)} className={`${kelasInput} mt-1`}>
          <option value="open-meteo">Open-Meteo (gratis, tanpa API key)</option>
          <option value="openweathermap">OpenWeatherMap (butuh API key)</option>
        </select>
      </label>
      <label className="block text-sm">
        Endpoint (opsional)
        <input
          value={k.endpoint}
          onChange={(e) => set("endpoint", e.target.value)}
          placeholder={k.penyedia === "openweathermap" ? "https://api.openweathermap.org/data/2.5/weather" : "https://api.open-meteo.com/v1/forecast"}
          className={`${kelasInput} mt-1`}
        />
      </label>
      <KolomKunci
        label={k.penyedia === "openweathermap" ? "API key (wajib)" : "API key (opsional, untuk paket berbayar)"}
        terisi={k.api_key_terisi} nilai={kunci} onUbah={setKunci} hapus={hapusKunci} onHapus={setHapusKunci}
      />
      <div className="grid grid-cols-3 gap-3">
        <label className="col-span-3 block text-sm sm:col-span-1">
          Lokasi
          <input value={k.nama_lokasi} onChange={(e) => set("nama_lokasi", e.target.value)} className={`${kelasInput} mt-1`} />
        </label>
        <label className="block text-sm">
          Lintang
          <input type="number" step="any" value={k.lintang} onChange={(e) => set("lintang", e.target.value as unknown as number)} className={`${kelasInput} mt-1`} />
        </label>
        <label className="block text-sm">
          Bujur
          <input type="number" step="any" value={k.bujur} onChange={(e) => set("bujur", e.target.value as unknown as number)} className={`${kelasInput} mt-1`} />
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm">
          Perbarui tiap (menit)
          <input type="number" min={1} max={180} value={k.cache_menit} onChange={(e) => set("cache_menit", e.target.value as unknown as number)} className={`${kelasInput} mt-1 w-28`} />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={k.aktif} onChange={(e) => set("aktif", e.target.checked)} className="accent-[#2f7d62]" /> Integrasi cuaca aktif
        </label>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {pesan && <p className="text-sm text-[#1f6b50]">{pesan}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={tes} disabled={!!sibuk} className={kelasTombolGaris}>{sibuk === "tes" ? "Mengetes..." : "Simpan & tes koneksi"}</button>
        <button disabled={!!sibuk} className={kelasTombol}>{sibuk === "simpan" ? "Menyimpan..." : "Simpan"}</button>
      </div>
    </form>
  );
}

/* ---------- Chatbox AI ---------- */
function FormAI({ awal }: { awal: KonfAI }) {
  const [k, setK] = useState(awal);
  const [kunci, setKunci] = useState("");
  const [hapusKunci, setHapusKunci] = useState(false);
  const [sibuk, setSibuk] = useState<"" | "simpan" | "tes">("");
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");

  const simpan = async (e?: FormEvent) => {
    e?.preventDefault();
    setSibuk("simpan");
    setError("");
    setPesan("");
    try {
      const d = await panggilAdmin<KonfAI>("/api/admin/konfigurasi/ai/", {
        method: "PATCH",
        body: JSON.stringify({ penyedia: k.penyedia, model: k.model, api_key: kunci, hapus_api_key: hapusKunci }),
      });
      setK(d);
      setKunci("");
      setHapusKunci(false);
      setPesan("Pengaturan AI disimpan.");
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setSibuk("");
    }
  };

  const tes = async () => {
    if (!(await simpan())) return;
    setSibuk("tes");
    try {
      await panggilAdmin("/api/admin/konfigurasi/ai/tes/", { method: "POST" });
      setK(await panggilAdmin<KonfAI>("/api/admin/konfigurasi/ai/"));
      setPesan("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSibuk("");
    }
  };

  const tanpaAI = k.penyedia === "tanpa";
  return (
    <form onSubmit={simpan} className={`${kelasKartu} space-y-4`}>
      <div>
        <h2 className="font-semibold">Chatbox AI</h2>
        <p className="text-xs text-[#4f6358]">
          Tanpa API key, chatbox tetap bisa dipakai dengan pencocokan kata kunci. Dengan AI, tamu bisa bertanya lebih bebas.
          Kalau layanan AI gagal, chat otomatis kembali ke mode kata kunci.
        </p>
      </div>
      {!tanpaAI && <LencanaStatus s={k} />}
      <label className="block text-sm">
        Layanan
        <select value={k.penyedia} onChange={(e) => setK({ ...k, penyedia: e.target.value, model: "" })} className={`${kelasInput} mt-1`}>
          <option value="tanpa">Tanpa AI (kata kunci)</option>
          <option value="anthropic">Claude (Anthropic)</option>
          <option value="gemini">Gemini (Google)</option>
          <option value="openai">OpenAI</option>
        </select>
      </label>
      {!tanpaAI && (
        <>
          <label className="block text-sm">
            Model (opsional)
            <input
              value={k.model}
              onChange={(e) => setK({ ...k, model: e.target.value })}
              placeholder={k.penyedia === awal.penyedia && awal.model_dipakai ? `Bawaan: ${awal.model_dipakai}` : "Kosongkan untuk model bawaan"}
              className={`${kelasInput} mt-1`}
            />
          </label>
          <KolomKunci label="API key" terisi={k.api_key_terisi} nilai={kunci} onUbah={setKunci} hapus={hapusKunci} onHapus={setHapusKunci} />
          <p className="text-xs text-[#4f6358]">API key hanya disimpan di server dan tidak pernah dikirim ke browser pelanggan.</p>
        </>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {pesan && <p className="text-sm text-[#1f6b50]">{pesan}</p>}
      <div className="flex justify-end gap-2">
        {!tanpaAI && (
          <button type="button" onClick={tes} disabled={!!sibuk} className={kelasTombolGaris}>{sibuk === "tes" ? "Mengetes..." : "Simpan & tes koneksi"}</button>
        )}
        <button disabled={!!sibuk} className={kelasTombol}>{sibuk === "simpan" ? "Menyimpan..." : "Simpan"}</button>
      </div>
    </form>
  );
}
