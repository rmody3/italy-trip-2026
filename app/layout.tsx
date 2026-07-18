import type { Metadata } from "next";
import "./globals.css";
import { Inter, Cinzel } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
// Cinzel — a revival of Roman inscriptional capitals (Trajan lineage). The
// "etched in stone" display face; used carved and wide-tracked for the wordmark.
const cinzel = Cinzel({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "ITALIA · MMXXVI · Rahul & Dhrumi",
  description: "Jul 22 – Aug 6 · Lake Maggiore · Tuscany · Puglia · Sardinia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", inter.variable, cinzel.variable)}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
