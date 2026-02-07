import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RegionProvider } from "@/lib/i18n/region-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <RegionProvider>{children}</RegionProvider>
      </body>
    </html>
  );
}
