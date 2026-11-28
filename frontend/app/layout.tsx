import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "GrowSafe — Tập phản xạ tự bảo vệ",
  description: "Game tình huống giúp trẻ 6-15 tuổi tập nói KHÔNG, rời đi và kể với người lớn tin cậy.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#cfeefa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${baloo.variable} ${nunito.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
