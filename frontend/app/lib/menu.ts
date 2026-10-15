import { API } from "./api";

export type Varian = { nama: string; harga: number };
export type Menu = {
  id: number;
  nama: string;
  kategori: string;
  subkategori: string;
  deskripsi: string;
  harga: number;
  varian: Varian[];
  foto: string | null;
  suhu: "hangat" | "dingin" | "fleksibel" | "netral";
  tag: string[];
  beralkohol: boolean;
  best_seller: boolean;
  tersedia: boolean;
  suka: number;
  tidak_suka: number;
};

export const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

/* ID acak per browser untuk like/dislike (bukan data pribadi). */
export function idPemilih(): string {
  try {
    let id = localStorage.getItem("pemilih_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("pemilih_id", id);
    }
    return id;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2, 12);
  }
}

const KUNCI_REAKSI = "reaksi_saya";

export function reaksiSaya(): Record<number, 1 | -1> {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_REAKSI) ?? "{}");
  } catch {
    return {};
  }
}

export async function kirimReaksi(menuId: number, nilai: 1 | -1 | 0, kodeMeja: string) {
  const r = await fetch(`${API}/api/menu/${menuId}/reaksi/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nilai, kode: kodeMeja, pemilih: idPemilih() }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.detail ?? "Gagal menyimpan penilaian.");
  try {
    const peta = reaksiSaya();
    if (nilai === 0) delete peta[menuId];
    else peta[menuId] = nilai;
    localStorage.setItem(KUNCI_REAKSI, JSON.stringify(peta));
  } catch {}
  return d as { id: number; suka: number; tidak_suka: number };
}

/* Gambar pengganti kalau menu belum punya foto */
const IKON_SUB: Record<string, string> = {
  "Signature Rettecoffee": "☕",
  "Coffee Hot / Ice": "☕",
  "Manual Brew": "☕",
  Mocktail: "🍹",
  Juice: "🧃",
  "Flavored Blend": "🥤",
  "Flavored Tea": "🍵",
  "Soft Drink": "🥤",
  Beer: "🍺",
  "Beer by Bucket": "🍺",
  Soju: "🍶",
  "Light Bites": "🍟",
  "Taste of Sweetness": "🍰",
  Cigarette: "🚬",
};
const IKON_KAT: Record<string, string> = { makanan: "🍽️", minuman: "🥤", dessert: "🍨", alkohol: "🍸", lainnya: "🛒" };
export const ikonMenu = (m: Pick<Menu, "kategori" | "subkategori">) => IKON_SUB[m.subkategori] ?? IKON_KAT[m.kategori] ?? "🍽️";
