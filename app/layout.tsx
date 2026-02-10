import type { Metadata } from "next";
import { EB_Garamond, Figtree } from "next/font/google";
import { RegionProvider } from "@/lib/i18n/region-context";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
});

const figtree = Figtree({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "AI Сметчик — Автоматические сметы на ремонт",
  description:
    "SaaS-сервис для автоматического составления смет на ремонт квартир с помощью AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${ebGaramond.variable} ${figtree.variable} antialiased`}
        suppressHydrationWarning
      >
        <RegionProvider>{children}</RegionProvider>
      </body>
    </html>
  );
}
