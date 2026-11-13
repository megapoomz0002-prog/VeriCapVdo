import type { Metadata } from "next";
import { Noto_Sans_Thai, Kanit } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VeriCapVdo AI Studio - Suno v6 × Google Flow MV Creator",
  description: "แต่งเพลง 9 องก์ Suno v6 และสร้าง Music Video สัดส่วน 9:16 / 16:9 ด้วย AI พร้อมซับเด้งสไตล์ TikTok",
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
