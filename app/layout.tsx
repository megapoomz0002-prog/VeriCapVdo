import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const notoSansThai = localFont({
  src: [
    { path: "./fonts/noto-sans-thai-400.ttf", weight: "400", style: "normal" },
    { path: "./fonts/noto-sans-thai-500.ttf", weight: "500", style: "normal" },
    { path: "./fonts/noto-sans-thai-600.ttf", weight: "600", style: "normal" },
    { path: "./fonts/noto-sans-thai-700.ttf", weight: "700", style: "normal" },
    { path: "./fonts/noto-sans-thai-800.ttf", weight: "800", style: "normal" },
    { path: "./fonts/noto-sans-thai-900.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-noto-sans-thai",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"],
});

const kanit = localFont({
  src: [
    { path: "./fonts/kanit-500.ttf", weight: "500", style: "normal" },
    { path: "./fonts/kanit-600.ttf", weight: "600", style: "normal" },
    { path: "./fonts/kanit-700.ttf", weight: "700", style: "normal" },
    { path: "./fonts/kanit-800.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-kanit",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"],
});

export const metadata: Metadata = {
  title: "VeriCapVdo AI Studio - Auto AI Songwriter & 9:16 MV Creator",
  description: "แต่งเพลงสไตล์ 3-Artist Trinity สร้างภาพปก 9:16 และตัดต่อ Music Video สัดส่วน 9:16 / 16:9 พร้อมซับเด้งสไตล์ TikTok",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`dark ${notoSansThai.variable} ${kanit.variable}`}>
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-fuchsia-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
