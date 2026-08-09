import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nyikadzino's Lineage — Chiwashira & Ziwenga Family Tree",
  description: "Interactive Chiwashira–Ziwenga family tree",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-bone font-sans min-h-screen">
        <nav className="border-b border-panelLine">
          <div className="max-w-[1180px] mx-auto px-5 py-3.5 flex items-center gap-6">
            <Link href="/" className="font-display text-sm font-medium text-gold">
              Nyikadzino's Lineage
            </Link>
            <Link href="/connections" className="font-mono text-[11px] uppercase tracking-wide text-boneDim hover:text-gold">
              Relationship Finder
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
