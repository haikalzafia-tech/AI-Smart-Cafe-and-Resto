"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { API } from "../lib/api";
import { useMeja } from "../components/WajibScan";
import { useKeranjang } from "../components/Keranjang";
import { ikonMenu, kirimReaksi, reaksiSaya, rupiah, type Menu } from "../lib/menu";
import { judul, teks } from "../lib/fonts";

const KATEGORI = [
  { id: "makanan", label: "Makanan" },
  { id: "minuman", label: "Minuman" },
  { id: "dessert", label: "Dessert" },
  { id: "alkohol", label: "Alkohol" },
  { id: "lainnya", label: "Lainnya" },
];

const SUHU: Record<string, { teks: string; kelas: string } | undefined> = {
  hangat: { teks: "Hangat", kelas: "bg-[#F6DEC6] text-[#8A4B17]" },
  dingin: { teks: "Dingin", kelas: "bg-[#D9EAF2] text-[#245A75]" },
  fleksibel: { teks: "Hot / ice", kelas: "bg-[#E6DDEE] text-[#5A4278]" },
};

type Reaksi = Record<number, 1 | -1>;

/* PLG-03: filter harga */
const RENTANG_HARGA = [
  { id: "semua", label: "Semua harga", min: 0, maks: Infinity },
  { id: "hemat", label: "Di bawah Rp40rb", min: 0, maks: 39999 },
  { id: "sedang", label: "Rp40rb–70rb", min: 40000, maks: 70000 },
  { id: "premium", label: "Di atas Rp70rb", min: 70001, maks: Infinity },
];

type Rekomendasi = {
  judul: string;
  label_waktu: string;
  cuaca: { ok: boolean; kondisi: string | null; suhu: number | null; deskripsi: string; lokasi: string };
  menu: (Menu & { alasan: string })[];
};

export default function HalamanMenu() {
  const sesi = useMeja();
  const keranjang = useKeranjang();
  const [menu, setMenu] = useState<Menu[]>([]);
  const [kategori, setKategori] = useState("makanan");
  const [cari, setCari] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState("");
  const [reaksi, setReaksi] = useState<Reaksi>({});
  const [sibuk, setSibuk] = useState<number | null>(null);
  const [dibukaId, setDibukaId] = useState<number | null>(null);
  const [pesan, setPesan] = useState("");
  const [harga, setHarga] = useState("semua");
  const [rek, setRek] = useState<Rekomendasi | null>(null);
  const kodeMeja = sesi?.kode ?? "";

  // Muat menu, lalu perbarui diam-diam tiap 60 detik / saat tab dibuka lagi,
  // supaya perubahan "habis/tersedia" dari admin langsung terlihat (ADM-02).
  useEffect(() => {
    setReaksi(reaksiSaya());
    let pertama = true;
    const muat = () =>
      fetch(`${API}/api/menu/`)
        .then((r) => {
          if (!r.ok) throw new Error("Menu gagal dimuat. Muat ulang halaman ini.");
          return r.json();
        })
        .then((d: Menu[]) => {
          setMenu(d);
          setError("");
        })
        .catch((e: Error) => {
          if (pertama) setError(e.message === "Failed to fetch" ? "Server tidak bisa dihubungi. Panggil pelayan kami." : e.message);
        })
        .finally(() => {
          pertama = false;
          setMemuat(false);
        });
    muat();
    const t = setInterval(muat, 60_000);
    const saatTerlihat = () => document.visibilityState === "visible" && muat();
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, []);

  // PLG-02: rekomendasi sesuai cuaca & waktu, diperbarui tiap 10 menit
  useEffect(() => {
    const muat = () =>
      fetch(`${API}/api/rekomendasi/?kode=${encodeURIComponent(kodeMeja)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: Rekomendasi | null) => d && setRek(d))
        .catch(() => {});
    muat();
    const t = setInterval(muat, 10 * 60_000);
    return () => clearInterval(t);
  }, [kodeMeja]);

  // Dibuka dari chat: /menu?buka=12 langsung membuka detail menu itu
  useEffect(() => {
    if (!menu.length) return;
    const id = Number(new URLSearchParams(window.location.search).get("buka"));
    if (id && menu.some((m) => m.id === id)) {
      setDibukaId(id);
      window.history.replaceState(null, "", "/menu");
    }
  }, [menu]);

  useEffect(() => {
    if (!pesan) return;
    const t = setTimeout(() => setPesan(""), 2200);
    return () => clearTimeout(t);
  }, [pesan]);

  const beriReaksi = async (m: Menu, pilih: 1 | -1) => {
    if (!sesi || sibuk) return;
    const baru = reaksi[m.id] === pilih ? 0 : pilih; // klik lagi = batal
    setSibuk(m.id);
    try {
      const d = await kirimReaksi(m.id, baru, sesi.kode);
      setMenu((l) => l.map((x) => (x.id === d.id ? { ...x, suka: d.suka, tidak_suka: d.tidak_suka } : x)));
      setReaksi((r) => {
        const s = { ...r };
        if (baru === 0) delete s[m.id];
        else s[m.id] = baru;
        return s;
      });
    } catch (e) {
      setPesan((e as Error).message);
    } finally {
      setSibuk(null);
    }
  };

  const kelompok = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    const r = RENTANG_HARGA.find((x) => x.id === harga) ?? RENTANG_HARGA[0];
    const terpilih = menu.filter(
      (m) =>
        (kata
          ? `${m.nama} ${m.deskripsi} ${m.subkategori} ${m.tag.join(" ")}`.toLowerCase().includes(kata)
          : m.kategori === kategori) &&
        m.harga >= r.min &&
        m.harga <= r.maks
    );
    const peta = new Map<string, Menu[]>();
    for (const m of terpilih) {
      if (!peta.has(m.subkategori)) peta.set(m.subkategori, []);
      peta.get(m.subkategori)!.push(m);
    }
    return [...peta.entries()];
  }, [menu, kategori, cari, harga]);

  const favorit = useMemo(
    () =>
      menu
        .filter((m) => !m.beralkohol && m.kategori !== "lainnya" && m.suka > 0)
        .sort((a, b) => b.suka - b.tidak_suka - (a.suka - a.tidak_suka) || b.suka - a.suka)
        .slice(0, 8),
    [menu]
  );

  const dibuka = menu.find((m) => m.id === dibukaId) ?? null;
  const tutupDetail = useCallback(() => setDibukaId(null), []);
  const bukaDetail = useCallback((m: Menu) => setDibukaId(m.id), []);

  // Pakai data dari daftar menu (jumlah like ikut ter-update), alasan dari mesin rekomendasi
  const rekMenu = (rek?.menu ?? [])
    .map((r) => {
      const m = menu.find((x) => x.id === r.id);
      return m && m.tersedia ? { m, alasan: r.alasan } : null;
    })
    .filter((x): x is { m: Menu; alasan: string } => x !== null);

  const kategoriAda = KATEGORI.filter((k) => menu.some((m) => m.kategori === k.id));
  const propsKartu = { reaksi, sibuk, onReaksi: beriReaksi, onBuka: bukaDetail };

  return (
    <div className={`${teks.className} min-h-screen bg-[#E2D4B2] text-[#3B2618]`}>
      {/* Header kayu */}
      <header className="sticky top-0 z-30 bg-[#3B2618] text-[#F3EBD8] shadow-[0_6px_18px_-8px_rgba(0,0,0,.6)]">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 pt-3 sm:px-6">
          <Link href="/" className="rounded-full px-3 py-1.5 text-sm text-[#E2D4B2] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#E2D4B2]">
            Beranda
          </Link>
          <h1 className={`${judul.className} text-xl font-extrabold tracking-tight`}>Menu Book</h1>
          <Link
            href="/keranjang"
            aria-label={`Keranjang, ${keranjang.jumlah} item`}
            className="relative rounded-full border border-[#E2D4B2]/40 px-3 py-1.5 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#E2D4B2]"
          >
            Meja {sesi?.nomor}
            {keranjang.jumlah > 0 && (
              <span key={keranjang.jumlah} className="absolute -right-2 -top-2 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-[#2F7D62] px-1 text-[0.7rem] font-bold text-white">
                {keranjang.jumlah}
              </span>
            )}
          </Link>
        </div>

        <div className="mx-auto max-w-[1100px] space-y-3 px-4 pb-3 pt-3 sm:px-6">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari: pedas, seafood, matcha, kopi..."
            aria-label="Cari menu"
            className="w-full rounded-full border border-[#E2D4B2]/30 bg-[#2A1A10] px-4 py-2.5 text-sm text-[#F3EBD8] placeholder:text-[#B9A783] outline-none focus:border-[#E2D4B2]"
          />
          {!cari && (
            <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Kategori menu">
              {kategoriAda.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKategori(k.id)}
                  aria-pressed={kategori === k.id}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-[#E2D4B2] ${
                    kategori === k.id ? "bg-[#E2D4B2] text-[#3B2618]" : "text-[#E2D4B2] hover:bg-white/10"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </nav>
          )}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Filter harga">
            {RENTANG_HARGA.map((r) => (
              <button
                key={r.id}
                onClick={() => setHarga(r.id)}
                aria-pressed={harga === r.id}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs transition focus-visible:outline-2 focus-visible:outline-[#E2D4B2] ${
                  harga === r.id ? "border-[#E2D4B2] bg-[#E2D4B2]/15 text-[#F3EBD8]" : "border-transparent text-[#B9A783] hover:text-[#E2D4B2]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 pb-32 pt-6 sm:px-6">
        {memuat && <p className="py-10 text-center text-sm text-[#7A5236]">Membuka buku menu...</p>}
        {error && <p className="rounded-xl bg-[#F6DEC6] p-4 text-sm text-[#8A4B17]">{error}</p>}

        {!cari && rek && rekMenu.length > 0 && (
          <section className="mb-10 rounded-[28px] bg-[#3B2618] px-4 pb-2 pt-5 text-[#F3EBD8] shadow-[0_8px_0_#2A1A10] sm:px-6">
            <p className="text-sm text-[#E2D4B2]">
              {rek.cuaca.ok
                ? `${rek.cuaca.lokasi}, ${rek.cuaca.deskripsi.toLowerCase()} ${rek.cuaca.suhu}°C`
                : `${rek.label_waktu} hari di ${rek.cuaca.lokasi}`}
            </p>
            <h2 className={`${judul.className} mb-4 text-2xl font-extrabold leading-tight sm:text-3xl`}>{rek.judul}</h2>
            <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-8 pt-2 sm:-mx-6 sm:px-6">
              {rekMenu.map(({ m, alasan }) => (
                <div key={m.id} className="flex w-[230px] shrink-0 snap-start flex-col gap-2 text-[#3B2618]">
                  <p className="min-h-[2.5em] text-xs leading-snug text-[#E2D4B2]">{alasan}</p>
                  <KartuMenu m={m} {...propsKartu} />
                </div>
              ))}
            </div>
          </section>
        )}

        {!cari && favorit.length > 0 && (
          <section className="mb-10">
            <h2 className={`${judul.className} mb-1 text-2xl font-extrabold text-[#5B3A26]`}>Paling disukai pengunjung</h2>
            <p className="mb-4 text-sm text-[#7A5236]">Dari jempol tamu-tamu Treehouse.</p>
            <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-8 pt-2 sm:-mx-6 sm:px-6">
              {favorit.map((m) => (
                <div key={m.id} className="w-[230px] shrink-0 snap-start">
                  <KartuMenu m={m} {...propsKartu} />
                </div>
              ))}
            </div>
          </section>
        )}

        {!memuat && !error && kelompok.length === 0 && (
          <p className="py-10 text-center text-sm text-[#7A5236]">
            {cari
              ? <>Tidak ada menu dengan kata &ldquo;{cari}&rdquo; di rentang harga ini. Coba kata lain atau pilih &ldquo;Semua harga&rdquo;.</>
              : <>Belum ada menu di rentang harga ini. Pilih &ldquo;Semua harga&rdquo; untuk melihat semuanya.</>}
          </p>
        )}

        {kelompok.map(([sub, daftar]) => (
          <section key={sub} className="mb-12">
            <h2 className={`${judul.className} mb-5 border-b-2 border-[#5B3A26]/20 pb-2 text-2xl font-extrabold text-[#5B3A26]`}>
              {sub}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
              {daftar.map((m) => (
                <KartuMenu key={m.id} m={m} {...propsKartu} />
              ))}
            </div>
          </section>
        ))}

        <p className="text-center text-xs text-[#7A5236]">Harga belum termasuk pajak dan service.</p>
      </main>

      {keranjang.jumlah > 0 && (
        <Link
          href="/keranjang"
          className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-[560px] items-center justify-between rounded-2xl bg-[#2F7D62] px-5 py-3.5 text-white shadow-[0_5px_0_#1E5642,0_18px_30px_-10px_rgba(0,0,0,.5)] transition active:translate-y-1 active:shadow-[0_1px_0_#1E5642] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2618]"
        >
          <span className="font-semibold">Lihat keranjang ({keranjang.jumlah})</span>
          <span className="font-bold">{rupiah(keranjang.total)}</span>
        </Link>
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center px-4">
        {pesan && <p className="animate-pop rounded-full bg-[#3B2618] px-4 py-2 text-sm text-[#F3EBD8] shadow-lg">{pesan}</p>}
      </div>

      {dibuka && (
        <DetailMenu
          m={dibuka}
          reaksiSaya={reaksi[dibuka.id]}
          sibuk={sibuk === dibuka.id}
          onReaksi={(p) => beriReaksi(dibuka, p)}
          onTutup={tutupDetail}
          onTambah={(varian, harga, jumlah, catatan) => {
            keranjang.tambah({ menuId: dibuka.id, nama: dibuka.nama, varian, harga, jumlah, catatan, foto: dibuka.foto });
            setPesan(`${dibuka.nama} masuk keranjang`);
            setDibukaId(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Kartu 3D ---------- */

type KartuProps = {
  m: Menu;
  reaksi: Record<number, 1 | -1>;
  sibuk: number | null;
  onReaksi: (m: Menu, p: 1 | -1) => void;
  onBuka: (m: Menu) => void;
};

function KartuMenu({ m, reaksi, sibuk, onReaksi, onBuka }: KartuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const suhu = SUHU[m.suhu];

  // Kartu miring mengikuti kursor (hanya mouse, dan tidak saat pengguna memilih kurangi animasi)
  const miring = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    el.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
    el.style.setProperty("--kilau", "1");
  };
  const lurus = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--kilau", "0");
  };

  return (
    <div className="[perspective:900px]">
      <div
        ref={ref}
        onPointerMove={miring}
        onPointerLeave={lurus}
        style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
        className={`relative flex h-full flex-col rounded-[22px] border border-[#CDBB94] bg-[#FBF6EA] p-2.5 shadow-[0_6px_0_#C2AC7F,0_22px_32px_-14px_rgba(59,38,24,.55)] transition-transform duration-200 ease-out [transform-style:preserve-3d] ${
          m.tersedia ? "" : "grayscale-[.7]"
        }`}
      >
        {/* Foto: lapisan paling depan */}
        <button
          type="button"
          onClick={() => onBuka(m)}
          aria-label={`Lihat ${m.nama}`}
          style={{ transform: "translateZ(36px)" }}
          className="relative block aspect-[4/3] overflow-hidden rounded-[16px] bg-[#5B3A26] shadow-[0_10px_18px_-8px_rgba(59,38,24,.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F7D62]"
        >
          <Foto m={m} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-200"
            style={{
              opacity: "var(--kilau, 0)",
              background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,.35), transparent 55%)",
            }}
          />
          {m.best_seller && (
            <span className="absolute left-2 top-2 rounded-full bg-[#F3EBD8] px-2 py-0.5 text-[0.68rem] font-semibold text-[#5B3A26]">Best seller</span>
          )}
          {!m.tersedia && (
            <span className="absolute inset-0 grid place-items-center bg-black/45 text-sm font-semibold text-white">Sedang habis</span>
          )}
        </button>

        {/* Isi: lapisan tengah */}
        <div style={{ transform: "translateZ(18px)" }} className="flex flex-1 flex-col px-1 pb-0.5 pt-3">
          <h3 className={`${judul.className} text-[1.02rem] font-semibold leading-snug text-[#3B2618]`}>
            <button type="button" onClick={() => onBuka(m)} className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-[#2F7D62]">
              {m.nama}
            </button>
          </h3>
          <p className="mt-1 text-sm font-bold text-[#7A5236]">
            {m.varian.length > 0 ? `mulai ${rupiah(m.harga)}` : rupiah(m.harga)}
          </p>
          {suhu && <span className={`mt-1.5 w-fit rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${suhu.kelas}`}>{suhu.teks}</span>}

          <div className="mt-auto flex items-center justify-between gap-1 pt-3">
            <div className="flex gap-1">
              <TombolReaksi aktif={reaksi[m.id] === 1} jumlah={m.suka} label="Suka" ikon="👍" disabled={sibuk === m.id} onClick={() => onReaksi(m, 1)} />
              <TombolReaksi aktif={reaksi[m.id] === -1} jumlah={m.tidak_suka} label="Tidak suka" ikon="👎" disabled={sibuk === m.id} onClick={() => onReaksi(m, -1)} />
            </div>
            <button
              type="button"
              onClick={() => onBuka(m)}
              disabled={!m.tersedia}
              aria-label={`Tambah ${m.nama}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#2F7D62] text-xl leading-none text-white shadow-[0_3px_0_#1E5642] transition active:translate-y-[3px] active:shadow-none disabled:bg-[#B9A783] disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2618]"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Foto({ m, besar = false }: { m: Menu; besar?: boolean }) {
  if (!m.foto)
    return (
      <span className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#7A5236,#3B2618)]">
        <span className={besar ? "text-7xl" : "text-5xl"} aria-hidden="true">{ikonMenu(m)}</span>
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={m.foto} alt={m.nama} loading="lazy" className="h-full w-full object-cover" />;
}

function TombolReaksi(p: { aktif: boolean; jumlah: number; label: string; ikon: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={p.onClick}
      disabled={p.disabled}
      aria-pressed={p.aktif}
      aria-label={`${p.label} (${p.jumlah})`}
      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#2F7D62] ${
        p.aktif ? "bg-[#3B2618] text-[#F3EBD8]" : "bg-[#EFE5CD] text-[#5B3A26] hover:bg-[#E5D7B5]"
      }`}
    >
      <span aria-hidden="true">{p.ikon}</span>
      {p.jumlah}
    </button>
  );
}

/* ---------- Detail + tambah ke keranjang ---------- */

function DetailMenu(p: {
  m: Menu;
  reaksiSaya?: 1 | -1;
  sibuk: boolean;
  onReaksi: (pilih: 1 | -1) => void;
  onTutup: () => void;
  onTambah: (varian: string | null, harga: number, jumlah: number, catatan: string) => void;
}) {
  const { m } = p;
  const [varian, setVarian] = useState(m.varian[0]?.nama ?? null);
  const [jumlah, setJumlah] = useState(1);
  const [catatan, setCatatan] = useState("");
  const harga = m.varian.find((v) => v.nama === varian)?.harga ?? m.harga;
  const tutup = useRef<HTMLButtonElement>(null);
  const { onTutup } = p;

  useEffect(() => {
    tutup.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onTutup]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#1E120A]/60 sm:items-center sm:p-6" onClick={onTutup}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={m.nama}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-[480px] animate-fade-up overflow-y-auto rounded-t-[28px] bg-[#FBF6EA] sm:rounded-[28px]"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-[28px] bg-[#5B3A26]">
          <Foto m={m} besar />
          <button
            ref={tutup}
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[#FBF6EA] text-lg text-[#3B2618] shadow focus-visible:outline-2 focus-visible:outline-[#2F7D62]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h2 className={`${judul.className} text-2xl font-extrabold leading-tight text-[#3B2618]`}>{m.nama}</h2>
            {m.deskripsi && <p className="mt-1.5 text-sm leading-relaxed text-[#6B4A33]">{m.deskripsi}</p>}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B4A33]">Suka menu ini?</span>
            <TombolReaksi aktif={p.reaksiSaya === 1} jumlah={m.suka} label="Suka" ikon="👍" disabled={p.sibuk} onClick={() => p.onReaksi(1)} />
            <TombolReaksi aktif={p.reaksiSaya === -1} jumlah={m.tidak_suka} label="Tidak suka" ikon="👎" disabled={p.sibuk} onClick={() => p.onReaksi(-1)} />
          </div>

          {m.varian.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Pilih ukuran</legend>
              <div className="space-y-2">
                {m.varian.map((v) => (
                  <label
                    key={v.nama}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-2.5 text-sm transition ${
                      varian === v.nama ? "border-[#2F7D62] bg-[#E6F1EA]" : "border-[#E2D4B2]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input type="radio" name="varian" checked={varian === v.nama} onChange={() => setVarian(v.nama)} className="accent-[#2F7D62]" />
                      {v.nama}
                    </span>
                    <span className="font-semibold text-[#7A5236]">{rupiah(v.harga)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <label className="block text-sm font-semibold">
            Catatan untuk dapur
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value.slice(0, 120))}
              rows={2}
              placeholder="Contoh: tidak pedas, es sedikit"
              className="mt-1.5 w-full resize-none rounded-xl border border-[#E2D4B2] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#2F7D62]"
            />
          </label>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center rounded-full border border-[#E2D4B2] bg-white">
              <button type="button" onClick={() => setJumlah((j) => Math.max(1, j - 1))} aria-label="Kurangi" className="h-11 w-11 text-xl text-[#5B3A26]">−</button>
              <span className="w-6 text-center font-semibold" aria-live="polite">{jumlah}</span>
              <button type="button" onClick={() => setJumlah((j) => Math.min(50, j + 1))} aria-label="Tambah jumlah" className="h-11 w-11 text-xl text-[#5B3A26]">+</button>
            </div>
            <button
              type="button"
              disabled={!m.tersedia}
              onClick={() => p.onTambah(varian, harga, jumlah, catatan)}
              className="flex h-12 flex-1 items-center justify-between rounded-full bg-[#2F7D62] px-5 text-sm font-semibold text-white shadow-[0_4px_0_#1E5642] transition active:translate-y-1 active:shadow-none disabled:bg-[#B9A783] disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2618]"
            >
              <span>{m.tersedia ? "Tambah ke keranjang" : "Sedang habis"}</span>
              <span>{rupiah(harga * jumlah)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
