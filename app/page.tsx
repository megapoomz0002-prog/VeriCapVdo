"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SongStudio from "@/components/SongStudio";
import CoverMotionStudio from "@/components/CoverMotionStudio";
import MvStudio from "@/components/MvStudio";
import { LicenseSession } from "@/components/LicenseModal";
import { Crown, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"song" | "cover" | "mv">("song");
  const [apiKey, setApiKey] = useState<string>("");
  const [licenseSession, setLicenseSession] = useState<LicenseSession | null>(null);

  // Shared state across stages
  const [songData, setSongData] = useState<{
    title: string;
    lyrics: string;
    mood: string;
    hookHeadline?: string;
  }>({
    title: "",
    lyrics: "",
    mood: "",
    hookHeadline: "",
  });

  const [coverData, setCoverData] = useState<{
    title: string;
    coverImage: string;
    backgroundVideo?: string;
    credit: string;
    lyrics?: string;
    hookHeadline?: string;
  }>({
    title: "",
    coverImage: "",
    backgroundVideo: undefined,
    credit: "megapoomz",
    lyrics: "",
    hookHeadline: "",
  });

  // Load API keys and saved studio session from local storage on mount
  useEffect(() => {
    try {
      const savedGeminiKey = localStorage.getItem("gemini_api_key");
      if (savedGeminiKey) setApiKey(savedGeminiKey);

      const savedLicense = localStorage.getItem("vericap_license_session");
      if (savedLicense) {
        const parsedLic = JSON.parse(savedLicense);
        if (parsedLic && typeof parsedLic === "object") setLicenseSession(parsedLic);
      }

      const savedSong = localStorage.getItem("vericap_song_data");
      if (savedSong) {
        const parsed = JSON.parse(savedSong);
        if (parsed && typeof parsed === "object") setSongData(parsed);
      }

      const savedCover = localStorage.getItem("vericap_cover_data");
      if (savedCover) {
        const parsed = JSON.parse(savedCover);
        if (parsed && typeof parsed === "object") setCoverData(parsed);
      }
    } catch (e) {
      console.warn("Could not load saved studio session:", e);
    }
  }, []);

  // Handler when Song is done and forwarded to Cover Studio
  const handleSongToCover = (data: { title: string; lyrics: string; mood: string; credit?: string; hookHeadline?: string }) => {
    setSongData(data);
    try {
      localStorage.setItem("vericap_song_data", JSON.stringify(data));
    } catch (e) {}

    setCoverData((prev) => {
      const updated = {
        ...prev,
        title: data.title,
        lyrics: data.lyrics,
        credit: data.credit || prev.credit,
        hookHeadline: data.hookHeadline || prev.hookHeadline,
      };
      try {
        localStorage.setItem("vericap_cover_data", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveTab("cover");
  };

  // Handler when Cover is done and forwarded to MV Studio
  const handleCoverToMv = (data: { title: string; coverImage: string; backgroundVideo?: string; credit: string; lyrics?: string }) => {
    setCoverData((prev) => {
      const updated = {
        ...prev,
        ...data,
        lyrics: data.lyrics || prev.lyrics || songData.lyrics,
        hookHeadline: prev.hookHeadline || songData.hookHeadline,
      };
      try {
        localStorage.setItem("vericap_cover_data", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveTab("mv");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiKey={apiKey}
        setApiKey={setApiKey}
        licenseSession={licenseSession}
        setLicenseSession={setLicenseSession}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Google Sheets License Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">ระบบตรวจสอบสิทธิ์ Google Sheets</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  licenseSession
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                }`}>
                  {licenseSession ? "✓ อนุมัติสิทธิ์แล้ว" : "ยังไม่ได้เปิดสิทธิ์"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {licenseSession
                  ? `ยินดีต้อนรับคุณ ${licenseSession.userName || "VIP"} • คีย์: ${licenseSession.licenseKey} (สิทธิ์ตลอดชีพ)`
                  : "กรอก License Key เพื่อเปิดใช้งานระบบแบบสมบูรณ์ ตรวจสอบสิทธิ์กับ Google Sheets แบบเรียลไทม์"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => {
                // Find and trigger license button in header or dispatch custom event
                const licBtn = document.querySelector('button[title*="Google Sheets"]') as HTMLButtonElement | null;
                if (licBtn) licBtn.click();
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{licenseSession ? "ดูรายละเอียดสิทธิ์" : "กรอก Key เปิดสิทธิ์"}</span>
            </button>
          </div>
        </div>
        {activeTab === "song" && (
          <SongStudio apiKey={apiKey} onSendToMv={handleSongToCover} />
        )}

        {activeTab === "cover" && (
          <CoverMotionStudio
            apiKey={apiKey}
            songData={{
              ...songData,
              lyrics: songData.lyrics || coverData.lyrics || "",
              title: songData.title || coverData.title || "",
            }}
            onSendToMvStudio={handleCoverToMv}
          />
        )}

        {activeTab === "mv" && (
          <MvStudio
            apiKey={apiKey}
            onUpdateApiKey={setApiKey}
            initialTitle={coverData.title || songData.title}
            initialCoverImage={coverData.coverImage}
            initialIsVideoBg={Boolean(coverData.backgroundVideo)}
            initialCredit={coverData.credit}
            initialLyrics={coverData.lyrics || songData.lyrics}
            initialHookHeadline={coverData.hookHeadline || songData.hookHeadline}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>VeriCapVdo AI Studio • สร้างสรรค์ผลงานเพลง ภาพปก และวิดีโอคาราโอเกะด้วย AI อิสระ (ฟรี 100%)</p>
      </footer>
    </div>
  );
}
