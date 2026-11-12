import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeriCapVdo AI Studio - Suno v6 × Google Flow MV Creator",
  description: "แต่งเพลง 9 องก์ Suno v6 และสร้าง Music Video สัดส่วน 9:16 ด้วย AI พร้อมซับเด้งสไตล์ TikTok",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <head>
        <script src="https://js.puter.com/v2/" async></script>
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-fuchsia-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
