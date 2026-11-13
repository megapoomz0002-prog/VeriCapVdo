"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SongStudio from "@/components/SongStudio";
import CoverMotionStudio from "@/components/CoverMotionStudio";
import MvStudio from "@/components/MvStudio";
import LicenseGate from "@/components/LicenseGate";
import {
  LicenseSession,
  getOrCreateDeviceId,
  maskLicenseKey,
  formatLicenseType,
} from "@/components/LicenseModal";
import { Crown, CheckCircle2 } from "lucide-react";

interface SharedSongData {
  title: string;
  lyrics: string;
  mood: string;
  tempo?: string;
  key?: string;
  flowStyle?: string;
  rhymeIntensity?: string;
  credit?: string;
  hookHeadline?: string;
}

interface SharedCoverData {
  title: string;
  coverImage: string;
  backgroundVideo?: string;
  credit: string;
  lyrics?: string;
  hookHeadline?: string;
}

function safeWriteStorage(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage errors
  }
}

export default function Home() {
  const [activeTab, setActiveTabState] = useState<"song" | "cover" | "mv">("song");
  const [apiKey, setApiKey] = useState<string>("");
  const [licenseSession, setLicenseSession] = useState<LicenseSession | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);

  // Shared state across stages
  const [songData, setSongData] = useState<SharedSongData>({
    title: "",
    lyrics: "",
    mood: "",
    hookHeadline: "",
  });

  const [coverData, setCoverData] = useState<SharedCoverData>({
    title: "",
    coverImage: "",
    backgroundVideo: undefined,
    credit: "megapoomz",
    lyrics: "",
    hookHeadline: "",
  });

  const setActiveTab = (tab: "song" | "cover" | "mv") => {
    setActiveTabState(tab);
    safeWriteStorage("vericap_active_tab", tab);
  };

  // Load saved keys, session, and studio state, then verify/sync license with server session
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function bootstrapSession() {
      let localLic: LicenseSession | null = null;
      try {
        const savedGeminiKey = localStorage.getItem("gemini_api_key");
        if (savedGeminiKey && isMounted) setApiKey(savedGeminiKey);

        const savedTab = localStorage.getItem("vericap_active_tab");
        if ((savedTab === "song" || savedTab === "cover" || savedTab === "mv") && isMounted) {
          setActiveTabState(savedTab);
        }

        const savedSong = localStorage.getItem("vericap_song_data");
        if (savedSong) {
          const parsed = JSON.parse(savedSong);
          if (parsed && typeof parsed === "object" && isMounted) setSongData(parsed);
        }

        const savedCover = localStorage.getItem("vericap_cover_data");
        if (savedCover) {
          const parsed = JSON.parse(savedCover);
          if (parsed && typeof parsed === "object" && isMounted) setCoverData(parsed);
        }

        const savedLicense = localStorage.getItem("vericap_license_session");
        if (savedLicense) {
          const parsedLic = JSON.parse(savedLicense);
          if (
            parsedLic &&
            typeof parsedLic === "object" &&
            typeof parsedLic.licenseKey === "string" &&
            parsedLic.licenseKey.trim().length > 0
          ) {
            const fixedDeviceId =
              parsedLic.deviceId && parsedLic.deviceId !== "VCV-WEB-CLIENT"
                ? parsedLic.deviceId
                : getOrCreateDeviceId();
            localLic = { ...parsedLic, deviceId: fixedDeviceId };
            if (isMounted) setLicenseSession(localLic);
          } else {
            localStorage.removeItem("vericap_license_session");
          }
        }
      } catch (e) {
        console.warn("Could not load saved studio session:", e);
      } finally {
        if (isMounted) setIsAuthLoaded(true);
      }

      // Background server session check & silent HttpOnly cookie sync for legacy sessions
      try {
        const res = await fetch("/api/license/verify?action=session&recheck=1", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!isMounted || !data) return;

        if (data.authenticated && data.session?.licenseKey) {
          const syncedSession: LicenseSession = {
            licenseKey: data.session.licenseKey,
            userName: data.session.userName || localLic?.userName || "VIP Member",
            licenseType: data.session.licenseType || localLic?.licenseType || "Permanent",
            activatedAt: localLic?.activatedAt || new Date().toISOString(),
            deviceId: data.session.deviceId || localLic?.deviceId || getOrCreateDeviceId(),
          };
          safeWriteStorage("vericap_license_session", JSON.stringify(syncedSession));
          setLicenseSession(syncedSession);
        } else if (data.revoked) {
          try {
            localStorage.removeItem("vericap_license_session");
          } catch {}
          setLicenseSession(null);
        } else if (!data.authenticated && localLic) {
          // Legacy localStorage session exists without signed cookie — sync once via POST
          const syncRes = await fetch("/api/license/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: localLic.licenseKey,
              deviceId: localLic.deviceId,
              userName: localLic.userName || "",
            }),
            signal: controller.signal,
          });
          const syncData = await syncRes.json().catch(() => null);
          if (!isMounted) return;

          if (syncRes.ok && syncData?.success) {
            const refreshedSession: LicenseSession = {
              licenseKey: syncData.licenseKey || localLic.licenseKey,
              userName: syncData.userName || localLic.userName || "VIP Member",
              licenseType: syncData.licenseType || localLic.licenseType || "Permanent",
              activatedAt: localLic.activatedAt || new Date().toISOString(),
              deviceId: localLic.deviceId,
            };
            safeWriteStorage("vericap_license_session", JSON.stringify(refreshedSession));
            setLicenseSession(refreshedSession);
          } else if (syncRes.status >= 400 && syncRes.status < 500) {
            try {
              localStorage.removeItem("vericap_license_session");
            } catch {}
            setLicenseSession(null);
          }
        }
      } catch {
        // Offline or aborted: keep cached session cleanly for client tools
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Handler when Song is done and forwarded to Cover Studio
  const handleSongToCover = (data: SharedSongData) => {
    setSongData(data);
    safeWriteStorage("vericap_song_data", JSON.stringify(data));

    setCoverData((prev) => {
      const updated: SharedCoverData = {
        ...prev,
        title: data.title,
        lyrics: data.lyrics,
        credit: data.credit !== undefined ? data.credit : prev.credit,
        hookHeadline: data.hookHeadline !== undefined ? data.hookHeadline : prev.hookHeadline,
      };
      safeWriteStorage("vericap_cover_data", JSON.stringify(updated));
      return updated;
    });
    setActiveTab("cover");
  };

  // Handler when Cover is done and forwarded to MV Studio
  const handleCoverToMv = (data: {
    title: string;
    coverImage: string;
    backgroundVideo?: string;
    credit: string;
    lyrics?: string;
    hookHeadline?: string;
  }) => {
    setCoverData((prev) => {
      const updated: SharedCoverData = {
        ...prev,
        ...data,
        backgroundVideo: data.backgroundVideo || undefined,
        lyrics: data.lyrics !== undefined ? data.lyrics : prev.lyrics || songData.lyrics,
        hookHeadline: data.hookHeadline !== undefined ? data.hookHeadline : prev.hookHeadline || songData.hookHeadline,
      };
      safeWriteStorage("vericap_cover_data", JSON.stringify(updated));
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
          isLicenseModalOpen={isLicenseModalOpen}
          onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
          onCloseLicenseModal={() => setIsLicenseModalOpen(false)}
        />
        <main className="flex-1 flex items-center justify-center">
          <LicenseGate onSuccess={(session) => setLicenseSession(session)} />
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
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
        isLicenseModalOpen={isLicenseModalOpen}
        onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
        onCloseLicenseModal={() => setIsLicenseModalOpen(false)}
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white">ระบบตรวจสอบสิทธิ์ Google Sheets</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                  ✓ อนุมัติสิทธิ์ {formatLicenseType(licenseSession.licenseType)}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                ยินดีต้อนรับคุณ {licenseSession.userName || "VIP Member"} • คีย์:{" "}
                <span className="font-mono text-amber-300">{maskLicenseKey(licenseSession.licenseKey)}</span>{" "}
                (ปลดล็อคเครื่องมือทั้งหมดเรียบร้อยแล้ว)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsLicenseModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>ดูข้อมูลสิทธิ์ / เปลี่ยนคีย์</span>
            </button>
          </div>
        </div>

        <section className={activeTab === "song" ? "block" : "hidden"} aria-hidden={activeTab !== "song"}>
          <SongStudio onSendToMv={handleSongToCover} />
        </section>

        <section className={activeTab === "cover" ? "block" : "hidden"} aria-hidden={activeTab !== "cover"}>
          <CoverMotionStudio
            songData={{
              ...songData,
              lyrics: songData.lyrics || coverData.lyrics || "",
              title: songData.title || coverData.title || "",
              hookHeadline: songData.hookHeadline || coverData.hookHeadline || "",
            }}
            onSendToMvStudio={handleCoverToMv}
          />
        </section>

        <section className={activeTab === "mv" ? "block" : "hidden"} aria-hidden={activeTab !== "mv"}>
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
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <p>VeriCapVdo AI Studio • สร้างสรรค์ผลงานเพลง ภาพปก และวิดีโอคาราโอเกะด้วย AI อิสระ (ฟรี 100%)</p>
      </footer>
    </div>
  );
}
