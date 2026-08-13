import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PATRAMIND — Intelligent Procurement Workspace",
  description:
    "Context-Aware Agentic AI untuk proses pengadaan barang PT Pertamina Patra Niaga. One Context. Everyone Aligned.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
