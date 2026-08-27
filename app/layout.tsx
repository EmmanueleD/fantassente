import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Oswald, Orbitron } from "next/font/google";
import "./globals.css";

const display = Oswald({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});
const digit = Orbitron({
  // Orbitron only ships a "latin" subset in next/font's font data (no
  // latin-ext); it only ever renders digits, "."/",", and the uppercase
  // role letters P/D/C/A, all within basic latin, so this is safe.
  subsets: ["latin"],
  variable: "--font-digit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fantacalcio Proxy Bidder",
  description: "Proxy-bidder webapp for a Fantacalcio live auction.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className={`${display.variable} ${digit.variable}`}>
      <body className="min-h-screen bg-night-950 text-chalk-200 font-display antialiased">
        {children}
      </body>
    </html>
  );
}
