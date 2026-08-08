import type { Metadata } from "next";
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
      <body className="bg-bg text-bone font-sans min-h-screen">{children}</body>
    </html>
  );
}
