import { KUNCI_MEJA } from "./api";

export type SesiMeja = { nomor: number; kode: string; sampai: number };

const DURASI_MS = 1 * 60 * 60 * 1000; // sesi berlaku 1 jam setelah scan

export function simpanSesi(nomor: number, kode: string) {
  const sesi: SesiMeja = { nomor, kode, sampai: Date.now() + DURASI_MS };
  try {
    localStorage.setItem(KUNCI_MEJA, JSON.stringify(sesi));
  } catch {}
}

export function ambilSesi(): SesiMeja | null {
  try {
    const mentah = localStorage.getItem(KUNCI_MEJA);
    if (!mentah) return null;
    const sesi = JSON.parse(mentah) as SesiMeja;
    if (!sesi.nomor || Date.now() > sesi.sampai) {
      localStorage.removeItem(KUNCI_MEJA);
      return null;
    }
    return sesi;
  } catch {
    return null;
  }
}