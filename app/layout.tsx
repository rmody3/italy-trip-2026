import type { Metadata } from "next";
import "./globals.css";
import { Inter, DM_Serif_Display } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const dmSerif = DM_Serif_Display({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Italy 2026 · Rahul & Dhrumi",
  description: "Jul 22 – Aug 6 · Lake Maggiore · Tuscany · Puglia · Sardinia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", inter.variable, dmSerif.variable)}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
