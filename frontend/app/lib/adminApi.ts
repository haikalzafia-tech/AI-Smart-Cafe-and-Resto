import { API, KUNCI_TOKEN } from "./api";

/** Ubah error DRF ({field: ["pesan"]}) jadi satu kalimat yang bisa dibaca. */
function rangkumError(d: unknown): string {
  if (!d || typeof d !== "object") return "Terjadi kesalahan.";
  const o = d as Record<string, unknown>;
  if (typeof o.detail === "string") return o.detail;
  return Object.entries(o)
    .map(([k, v]) => {
      const isi = Array.isArray(v) ? v.join(" ") : typeof v === "object" && v ? rangkumError(v) : String(v);
      return k === "non_field_errors" || k === "detail" ? isi : `${k}: ${isi}`;
    })
    .join(" ");
}

export function keluarAdmin() {
  try {
    localStorage.removeItem(KUNCI_TOKEN);
  } catch {}
  window.location.href = "/admin/login";
}

/** fetch ke backend dengan token admin. Body FormData dikirim apa adanya (untuk upload foto). */
export async function panggilAdmin<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem(KUNCI_TOKEN) : null;
  if (!token) {
    keluarAdmin();
    throw new Error("Silakan login dulu.");
  }
  const headers: Record<string, string> = { Authorization: `Token ${token}` };
  if (init.body && !(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  let r: Response;
  try {
    r = await fetch(`${API}${path}`, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } });
  } catch {
    throw new Error("Server tidak bisa dihubungi. Pastikan backend sedang berjalan.");
  }
  if (r.status === 401 || r.status === 403) {
    keluarAdmin();
    throw new Error("Sesi admin berakhir, silakan login lagi.");
  }
  if (r.status === 204) return null as T;
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(rangkumError(d));
  return d as T;
}

export const formatTanggal = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";
