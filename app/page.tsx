"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SongStudio from "@/components/SongStudio";
import CoverMotionStudio from "@/components/CoverMotionStudio";
import MvStudio from "@/components/MvStudio";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"song" | "cover" | "mv">("song");
  const [apiKey, setApiKey] = useState<string>("");

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
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
