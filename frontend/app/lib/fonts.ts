import { Fraunces, Poppins } from "next/font/google";

/* Mengikuti buku menu Treehouse: judul serif tebal, teks Poppins */
export const judul = Fraunces({ subsets: ["latin"], weight: ["600", "800"] });
export const teks = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
