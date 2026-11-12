"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SongStudio from "@/components/SongStudio";
import CoverMotionStudio from "@/components/CoverMotionStudio";
import MvStudio from "@/components/MvStudio";
import LicenseGate from "@/components/LicenseGate";
import { LicenseSession } from "@/components/LicenseModal";
import { Crown, CheckCircle2, Loader2 } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"song" | "cover" | "mv">("song");
  const [apiKey, setApiKey] = useState<string>("");
  const [licenseSession, setLicenseSession] = useState<LicenseSession | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(false);

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
    } finally {
      setIsAuthLoaded(true);
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

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center animate-spin shadow-lg shadow-amber-500/25">
            <Crown className="w-5 h-5 text-slate-950" />
          </div>
          <p className="text-xs text-slate-400">กำลังตรวจสอบสิทธิ์เข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  // MANDATORY LICENSE GATE: If user has not activated a valid key, LOCK the application completely
  if (!licenseSession) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          apiKey={apiKey}
          setApiKey={setApiKey}
          licenseSession={null}
          setLicenseSession={setLicenseSession}
        />
        <main className="flex-1 flex items-center justify-center">
          <LicenseGate onSuccess={(session) => setLicenseSession(session)} />
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <p>VeriCapVdo AI Studio • ระบบจัดการสิทธิ์เข้าใช้งานผ่าน Google Sheets</p>
        </footer>
      </div>
    );
  }

  // FULL UNLOCKED STUDIO (When valid license exists)
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
        {/* Google Sheets Active License Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-900 to-amber-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">ระบบตรวจสอบสิทธิ์ Google Sheets</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                  ✓ อนุมัติสิทธิ์ VIP ตลอดชีพ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ยินดีต้อนรับคุณ {licenseSession.userName || "VIP Member"} • คีย์: {licenseSession.licenseKey} (ปลดล็อคเครื่องมือทั้งหมดเรียบร้อยแล้ว)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => {
                const licBtn = document.querySelector('button[title*="Google Sheets"]') as HTMLButtonElement | null;
                if (licBtn) licBtn.click();
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>ดูข้อมูลสิทธิ์ / เปลี่ยนคีย์</span>
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
