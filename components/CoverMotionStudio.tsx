"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Eye,
  ArrowRight,
  Upload,
  Download,
  Bot,
  Wand2,
  FileCode,
  Image as ImageIcon,
  Film,
  Layers,
  ShieldCheck,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Music,
  Search,
  Smartphone,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  buildFullCoverArtMegaPrompt,
  buildDirectImageGenPrompt,
  buildGoogleFlowMotionPrompt,
  TIKTOK_COVER_MV_MASTER_V8_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { copyTextToClipboard } from "@/lib/clipboard";

interface CoverMotionStudioProps {
  songData: {
    title: string;
    lyrics: string;
    mood: string;
    credit?: string;
    hookHeadline?: string;
  };
  onSendToMvStudio: (data: {
    title: string;
    coverImage: string;
    backgroundVideo?: string;
    credit: string;
    lyrics?: string;
    hookHeadline?: string;
  }) => void;
}

const DEFAULT_SAMPLE_LYRICS = `เสียงกบไสไม้... ค่อยจางหายไป
กอดพ่อได้เพียง... แค่ในความทรงจำ
กลิ่นเหงื่อคราบไคล... บนเสื้อลายสก็อตตัวเก่า
ยังคงตราตรึง... อยู่ในใจลูกเสมอ
พ่อเหนื่อยมาทั้งชีวิต... เพื่อให้ลูกได้มีวันพรุ่งนี้`;

function isCreditDisabled(val: string): boolean {
  const trimmed = (val || "").trim();
  return !trimmed || /^(ไม่ใส่|ไม่ต้องใส่|none|no|no\s*credit|-)$/i.test(trimmed);
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function triggerBlobOrUrlDownload(href: string, fileName: string, revokeAfterDownload = false) {
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (revokeAfterDownload) {
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
}

function extractLyricHighlight(rawLyrics: string, songTitle: string): string {
  if (!rawLyrics) return songTitle || "บทเพลงเพื่อชีวิต... บรรเลงก้องในใจ";
  const lines = rawLyrics
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !l.startsWith("[") && !l.endsWith("]"));

  for (const line of lines) {
    const clean = line.replace(/\[[^\]]*\]/g, "").replace(/\([^\)]*\)/g, "").trim();
    if (clean.length >= 6) {
      return clean.length > 38 ? `${clean.slice(0, 38)}...` : clean;
    }
  }
  return lines[0] || songTitle || "บทเพลงเพื่อชีวิต... บรรเลงก้องในใจ";
}

export default function CoverMotionStudio({
  songData,
  onSendToMvStudio,
}: CoverMotionStudioProps) {
  // Inputs matching # THAI TIKTOK SONG COVER & MV MASTER v8.0 (จาก สร้างปก.txt)
  const [songTitle, setSongTitle] = useState(songData.title || "กอดพ่อได้เพียง");
  const [lyrics, setLyrics] = useState(songData.lyrics || DEFAULT_SAMPLE_LYRICS);
  const [credit, setCredit] = useState(songData.credit ?? "FRANKYTEAM");
  const [hookHeadline, setHookHeadline] = useState(songData.hookHeadline || "");
  const [mode, setMode] = useState<"cover-only" | "loop-mv">("loop-mv");
  const [moodTone, setMoodTone] = useState<string>("AUTO");
  const [characterSymbol, setCharacterSymbol] = useState<string>("AUTO");

  // Highlight Quote (optional text burning)
  const [highlightQuote, setHighlightQuote] = useState(() =>
    extractLyricHighlight(songData.lyrics, songData.title)
  );

  // Uploaded or chosen cover image (Defaults to sample cover with title 'พ่อ' & 'FRANKYTEAM' already embedded)
  const [coverImageUrl, setCoverImageUrl] = useState("/covers/phaw_carpenter_cover.jpg");
  const [imageFileName, setImageFileName] = useState("");
  const [isVideoCover, setIsVideoCover] = useState(false);

  // Preview control toggles (Default to TikTok Simulator so user sees real post verification)
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showTikTokSimulator, setShowTikTokSimulator] = useState(true);
  const [enableTypographyOverlay, setEnableTypographyOverlay] = useState(false);

  // Unified copy / toast status indicators with cleanup
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");
  const [justUploaded, setJustUploaded] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCopyFeedback = async (id: string, text: string, duration = 2200) => {
    setCopyError("");
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedKey(id);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopiedKey((prev) => (prev === id ? null : prev));
      }, duration);
    } else {
      setCopyError("เบราว์เซอร์จำกัดสิทธิ์คลิปบอร์ด — กดเลือกข้อความแล้วคัดลอกด้วย Ctrl+C ได้ทันที");
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current);
    };
  }, []);

  // Dynamic Prompts Generated in Real-Time
  const directImagePrompt = buildDirectImageGenPrompt({
    songTitle,
    lyrics,
    credit,
    moodTone,
    characterSymbol,
  });

  const fullMegaPrompt = buildFullCoverArtMegaPrompt({
    songTitle,
    lyrics,
    credit,
    mode,
    moodTone,
    characterSymbol,
  });

  const motionPrompt = buildGoogleFlowMotionPrompt(
    characterSymbol,
    moodTone,
    songTitle,
    lyrics
  );

  // Download cover image (with burned-in typography inside 15-28% Title Safe Zone if active)
  const handleDownloadCoverImage = async () => {
    const rawExt = isVideoCover ? imageFileName.split(".").pop()?.toLowerCase() : "jpg";
    const safeExt = rawExt && /^[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : isVideoCover ? "mp4" : "jpg";
    const fileName = `${(songTitle || "MusicCover").trim().replace(/\s+/g, "_")}_9x16.${safeExt}`;

    if (isVideoCover || !enableTypographyOverlay) {
      triggerBlobOrUrlDownload(coverImageUrl, fileName, false);
      return;
    }

    try {
      if (typeof document !== "undefined" && document.fonts?.ready) {
        await document.fonts.ready;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = coverImageUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Center-crop 9:16
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const dx = (canvas.width - drawW) / 2;
      const dy = (canvas.height - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);

      // Subtle upper vignette covering 10%-30% Title Safe Zone for crisp legibility
      const topGrad = ctx.createLinearGradient(0, 120, 0, 620);
      topGrad.addColorStop(0, "rgba(0,0,0,0)");
      topGrad.addColorStop(0.25, "rgba(0,0,0,0.68)");
      topGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 120, canvas.width, 500);

      // Song Title centered at 18% vertical height (strictly inside 15%-28% TikTok Safe Zone)
      const titleText = songTitle.trim() || "ชื่อเพลงของคุณ";
      let titleFontSize = 72;
      ctx.save();
      ctx.font = `900 ${titleFontSize}px "Noto Sans Thai", "Kanit", sans-serif`;
      while (titleFontSize > 42 && ctx.measureText(titleText).width > canvas.width - 140) {
        titleFontSize -= 4;
        ctx.font = `900 ${titleFontSize}px "Noto Sans Thai", "Kanit", sans-serif`;
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.95)";
      ctx.shadowBlur = 24;
      ctx.lineWidth = 10;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      const titleY = 345;
      ctx.strokeText(titleText, canvas.width / 2, titleY);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(titleText, canvas.width / 2, titleY);
      ctx.restore();

      // Credit pill right below Title (~24.5%) — strictly inside Safe Zone, clear of TikTok bottom 25% UI!
      if (!isCreditDisabled(credit)) {
        ctx.save();
        ctx.font = '700 30px "Noto Sans Thai", "Kanit", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const creditStr = credit.trim();
        const metrics = ctx.measureText(creditStr);
        const pillW = Math.min(canvas.width - 140, metrics.width + 64);
        const pillH = 54;
        const pillX = (canvas.width - pillW) / 2;
        const pillY = 425;
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.beginPath();
        drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, 27);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#f1f5f9";
        ctx.fillText(creditStr, canvas.width / 2, pillY + pillH / 2);
        ctx.restore();
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          triggerBlobOrUrlDownload(url, fileName, true);
        },
        "image/jpeg",
        0.95
      );
    } catch {
      triggerBlobOrUrlDownload(coverImageUrl, fileName, false);
    }
  };

  // Sync props when user passes data from Step 1
  useEffect(() => {
    if (songData.title) setSongTitle(songData.title);
    if (songData.credit !== undefined) setCredit(songData.credit);
    if (songData.hookHeadline !== undefined) setHookHeadline(songData.hookHeadline);
    if (songData.lyrics) {
      setLyrics(songData.lyrics);
      setHighlightQuote(extractLyricHighlight(songData.lyrics, songData.title));
    }
  }, [songData]);

  // Handle local image / video upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverImageUrl(url);
      setImageFileName(file.name);
      setIsVideoCover(file.type.startsWith("video/"));
      setJustUploaded(true);
      if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current);
      uploadTimerRef.current = setTimeout(() => setJustUploaded(false), 3000);
    }
    e.target.value = "";
  };

  // 1-Click Copy Handlers
  const handleCopyDirectPrompt = () => {
    void triggerCopyFeedback("direct", directImagePrompt, 2500);
  };

  const handleCopyMegaPrompt = () => {
    void triggerCopyFeedback("mega", fullMegaPrompt, 2500);
  };

  const handleCopyMotionPrompt = () => {
    void triggerCopyFeedback("motion", motionPrompt, 2500);
  };

  const handleExportSkill = () => {
    const skillContent = `---
name: thai-tiktok-song-cover-mv-master
description: Creative Director, Album Cover Specialist, Typography Director และ Motion Prompt Specialist สำหรับ Google Flow สร้าง 1 ภาพปกที่ดีที่สุด 9:16 พร้อมคำสั่ง 10s Infinite Seamless Loop
---

${TIKTOK_COVER_MV_MASTER_V8_SYSTEM_PROMPT}`;

    const blob = new Blob([skillContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerBlobOrUrlDownload(url, "TIKTOK_COVER_MV_MASTER_v8.skill.md", true);
    setCopiedKey("skill");
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopiedKey((prev) => (prev === "skill" ? null : prev));
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-cyan-950/30 to-slate-900/40 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-cyan-600/20 rounded-xl border border-cyan-500/30 text-cyan-400">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>THAI TIKTOK SONG COVER & MV MASTER v8.0</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  1-Best-Frame • Infinite Seamless Loop Engine • 9:16
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                สร้างภาพปก 9:16 ที่ดีที่สุด (มีชื่อเพลงฝังในปก) พร้อมชุดคำสั่ง <strong>Infinite Seamless Loop (Google Flow / Omni Flash)</strong> ยึดตามมาตรฐาน <code>สร้างปก.txt</code> ครบถ้วน 100%
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportSkill}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all whitespace-nowrap"
            title="ดาวน์โหลดเป็นไฟล์ทักษะ SKILL.md"
          >
            {copiedKey === "skill" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedKey === "skill" ? "บันทึก SKILL.md แล้ว" : "บันทึกเป็นทักษะ (SKILL.md)"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form & Prompt Generators */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. USER INPUT Card (Strictly according to สร้างปก.txt) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>1. ข้อมูลเพลง (USER INPUT v8.0)</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                One-Input Autopilot
              </span>
            </div>

            {/* Select Mode */}
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                ประเภทงานที่ต้องการ (Select Mode) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("cover-only")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mode === "cover-only"
                      ? "bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-600/20"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold">[1] สร้างปกเพลงปกติ</span>
                  </div>
                  <p className="text-[10px] text-slate-400">สร้างภาพ 9:16 จบงานทันที</p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("loop-mv")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mode === "loop-mv"
                      ? "bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Film className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold">[2] ทำ MV วนลูป 10s (แนะนำ)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">ภาพ + คำสั่ง 10s Seamless Loop</p>
                </button>
              </div>
            </div>

            {/* Input 1: Song Title */}
            <div>
              <label htmlFor="cover-song-title-input" className="text-xs font-semibold text-slate-200 block mb-1">
                ชื่อเพลง (Song Title) *
              </label>
              <input
                id="cover-song-title-input"
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="ใส่ชื่อเพลง เช่น กอดพ่อได้เพียง..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-semibold"
              />
              {!songTitle.trim() && (
                <p className="text-[10.5px] text-amber-300 mt-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>ควรใส่ชื่อเพลง เพื่อให้พรอพท์และหน้าปกแสดงชื่อเพลงได้ครบถ้วน</span>
                </p>
              )}
            </div>

            {/* Input 2: Lyrics / Story / Hook */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="cover-lyrics-input" className="text-xs font-semibold text-slate-200 block">
                  เนื้อร้อง / แก่นเรื่อง / ท่อนฮุก *
                </label>
                <div className="flex items-center space-x-2">
                  {lyrics !== DEFAULT_SAMPLE_LYRICS && (
                    <button
                      type="button"
                      onClick={() => {
                        setLyrics(DEFAULT_SAMPLE_LYRICS);
                        setSongTitle((prev) => prev || "กอดพ่อได้เพียง");
                        setHighlightQuote(extractLyricHighlight(DEFAULT_SAMPLE_LYRICS, songTitle || "กอดพ่อได้เพียง"));
                      }}
                      className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>ใช้ตัวอย่างเริ่มต้น</span>
                    </button>
                  )}
                  <span className="text-[10px] text-cyan-400 font-medium">คลังภาพจำ & อารมณ์</span>
                </div>
              </div>
              <textarea
                id="cover-lyrics-input"
                rows={4}
                value={lyrics}
                onChange={(e) => {
                  setLyrics(e.target.value);
                  setHighlightQuote(extractLyricHighlight(e.target.value, songTitle));
                }}
                placeholder="วางเนื้อเพลงทั้งหมด หรือเฉพาะท่อนสำคัญ..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all leading-relaxed font-sans"
              />
              {!lyrics.trim() && (
                <p className="text-[10.5px] text-amber-300 mt-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>กรุณาวางเนื้อเพลงหรือแก่นเรื่อง เพื่อให้ AI ตีความภาพปกตรงกับเพลงที่สุด</span>
                </p>
              )}
            </div>

            {/* Input 3: Credit & Hook Headline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cover-credit-input" className="text-xs font-semibold text-slate-200 block mb-1">
                  ชื่อคนแต่ง / เครดิต (Credit)
                </label>
                <input
                  id="cover-credit-input"
                  type="text"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder="ใส่ชื่อ หรือระบุ ไม่ใส่"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label htmlFor="cover-hook-input" className="text-xs font-semibold text-slate-200 block mb-1">
                  คำพาดหัวสะกิดใจ (3s Hook • ส่งต่อ Step 3)
                </label>
                <input
                  id="cover-hook-input"
                  type="text"
                  value={hookHeadline}
                  onChange={(e) => setHookHeadline(e.target.value)}
                  placeholder="คำโปรยสั้น 1-2 บรรทัดบน MV (ไม่บังคับ)"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>
            </div>

            {/* Input 4: Mood & Tone */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-200 block">
                  แนวภาพ / Mood & Tone (อารมณ์และแสง)
                </label>
                <span className="text-[10px] text-cyan-400 font-medium">✨ ค่าเริ่มต้น AUTO = AI วิเคราะห์เอง</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                {[
                  { label: "✨ AUTO (AI ตีความอิสระ)", val: "AUTO" },
                  { label: "🪷 ธรรมะ / ปล่อยวาง / แสงธรรม", val: "Sacred tranquil water sanctuary, blooming ethereal lotus flower, divine celestial golden rays, profound inner peace" },
                  { label: "🎬 Cinematic 35mm Film", val: "Cinematic 35mm film, dramatic volumetric light, emotional depth" },
                  { label: "🌾 เพื่อชีวิต แสงสีทองชนบท", val: "Thai soulful folk aesthetic, warm golden hour sunbeams, rustic wood textures" },
                  { label: "☕ อบอุ่น โรแมนติก โบเก้ละมุน", val: "Cozy warm indoor cafe, soft honey ambient lighting, creamy dreamy bokeh" },
                  { label: "🌧️ ฝนพรำยามค่ำคืน นีออนสะท้อนน้ำ", val: "Melancholic rainy midnight Bangkok street, neon reflections on wet asphalt" },
                  { label: "⚡ ร็อกพลังใจ คมเข้มดุดัน", val: "Dramatic chiaroscuro stage lighting, electric blue and volcanic orange rim light" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMoodTone(item.val)}
                    className={`p-2 rounded-lg text-[10px] font-semibold border truncate text-left transition-all ${
                      moodTone === item.val
                        ? "bg-cyan-600 text-white border-cyan-400 font-bold shadow-md shadow-cyan-600/30"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={moodTone}
                onChange={(e) => setMoodTone(e.target.value)}
                placeholder="AUTO (AI จะอ่านเนื้อเพลงแล้วจัดแสงและสีให้เข้ากับอารมณ์เพลงเอง หรือพิมพ์ระบุเอง...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            {/* Input 5: Character / Specific Symbol */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-200 block">
                  ตัวละครหลัก / สัญลักษณ์เฉพาะ (Subject & Symbol)
                </label>
                <span className="text-[10px] text-emerald-400 font-medium">✨ ปลดล็อค AI อิสระ 100%</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                {[
                  { label: "✨ AUTO (AI วิเคราะห์เนื้อเพลงเอง 100%)", val: "AUTO" },
                  { label: "🪷 ดอกบัวบาน & แสงธรรม", val: "A breathtaking sacred blooming lotus flower above crystal tranquil water with divine radiant morning sunbeams" },
                  { label: "🌾 คนสู้ชีวิต / ทุ่งรวงข้าว", val: "A humble rural Thai figure standing peacefully in expansive golden rice terraces at twilight" },
                  { label: "🏠 พ่อแม่ / ครอบครัวอบอุ่น", val: "A kind-eyed elderly Thai parent smiling gently on a rustic wooden veranda in warm sunset light" },
                  { label: "🌧️ คนเดียวดายริมหน้าต่างฝน", val: "A solitary reflective person by a rain-streaked window overlooking glowing nocturnal city neon" },
                  { label: "🎸 ศิลปินเดี่ยวกีตาร์โปร่ง", val: "A soulful acoustic guitarist lost in musical reverie with warm atmospheric rim light" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCharacterSymbol(item.val)}
                    className={`p-2 rounded-lg text-[10px] font-semibold border truncate text-left transition-all ${
                      characterSymbol === item.val
                        ? "bg-cyan-600 text-white border-cyan-400 font-bold shadow-md shadow-cyan-600/30"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={characterSymbol}
                onChange={(e) => setCharacterSymbol(e.target.value)}
                placeholder="AUTO (ค่าเริ่มต้น: ให้ AI อ่านเนื้อเพลงทั้งหมด แล้วเลือกสัจธรรม/สัญลักษณ์ที่ลึกซึ้งที่สุดเอง)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                💡 <strong>ไม่ต้องเลือกหมวดใดๆ ก็ได้:</strong> เพียงปล่อยไว้เป็น <code>AUTO</code> ระบบจะส่งเนื้อเพลงเต็มให้ AI เจนภาพอ่านและวิเคราะห์ภาพเปรียบเทียบ (Metaphor) เอง 100% โดยไม่มีการล็อคหมวดหรือสุ่มอาชีพที่ไม่เกี่ยวข้อง
              </p>
            </div>

            {/* Real-time Status Indicator */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>พรอพท์ในกล่องที่ 2 อัปเดต Real-time พร้อมคัดลอกทันที</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                ✓ พร้อมคัดลอก
              </span>
            </div>
          </div>

          {/* 1-Click Fast Copy Prompts (Pre-compiled, Zero Latency) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>2. ชุดคำสั่งพร้อมคัดลอกไปสั่งในแชท AI (ฟรี 100%)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  คัดลอกพรอพท์ด้านล่างนี้ไปสั่งในแชท AI ที่คุณชอบ แล้วนำรูปที่ได้มาอัปโหลดในกล่องขวามือ
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                Safe Zone Locked
              </span>
            </div>

            {/* Quick Links to Popular AI Tools */}
            <div className="space-y-1.5 pb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 block">
                เปิดแชท AI สำหรับนำพรอพท์ไปสร้างรูปและคลิปวนลูป:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-[11px] font-semibold transition-all hover:border-emerald-500/50 truncate"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">ChatGPT</span>
                </a>

                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-[11px] font-semibold transition-all hover:border-cyan-500/50 truncate"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Gemini</span>
                </a>

                <a
                  href="https://ideogram.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-[11px] font-semibold transition-all hover:border-pink-500/50 truncate"
                  title="แนะนำสำหรับตัวหนังสือและชื่อเพลงที่คมกริบ"
                >
                  <Wand2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="truncate">Ideogram</span>
                </a>

                <a
                  href="https://copilot.microsoft.com/images/create"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-[11px] font-semibold transition-all hover:border-indigo-500/50 truncate"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Bing Image</span>
                </a>

                <a
                  href="https://flow.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800/80 hover:to-purple-800/80 text-purple-200 rounded-xl border border-purple-500/40 text-[11px] font-bold transition-all truncate"
                  title="Google Flow สำหรับทำ Seamless Loop 10s"
                >
                  <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Google Flow</span>
                </a>

                <a
                  href="https://midjourney.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-[11px] font-semibold transition-all hover:border-amber-500/50 truncate"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Midjourney</span>
                </a>
              </div>
            </div>

            {/* 1. Master Image Prompt 9:16 */}
            <div className="space-y-2 p-3.5 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-950 border border-cyan-500/40 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <label className="text-xs font-bold text-white">
                      1. Masterpiece Image Prompt 9:16 (พร้อมแนบเนื้อเพลงเต็ม - ส่งให้ AI เจนภาพปกในแชทใหม่)
                    </label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      🌟 แนะนำที่สุด
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    บรรจุ <strong>ชื่อเพลงภาษาไทย + เนื้อเพลงทั้งหมด + สเปกภาพ ARRI 35mm + กฎห้ามสร้างภาพโปรแกรม</strong> ครบถ้วน นำไปวางในแชทใหม่ของ <strong>ChatGPT, Gemini, Ideogram, Midjourney</strong> AI จะอ่านเนื้อเพลงและวาดภาพปกที่ตรงกับอารมณ์เพลงของคุณเป๊ะ 1 ภาพจบ ไร้รูป Google Flow หรือไดอะแกรม 100%!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDirectPrompt}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-cyan-600/30 transition-all shrink-0"
                >
                  {copiedKey === "direct" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "direct" ? "คัดลอกแล้ว!" : "คัดลอกคำสั่งภาพปกนี้"}</span>
                </button>
              </div>
              {copyError && (
                <div role="alert" className="p-2 rounded-lg bg-amber-950/70 border border-amber-500/40 text-[11px] text-amber-200">
                  {copyError}
                </div>
              )}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-200/90 whitespace-pre-wrap leading-relaxed select-all max-h-48 overflow-y-auto">
                {directImagePrompt}
              </div>
            </div>

            {/* 2. Google Flow / Omni Flash Motion Prompt (Mode 2) */}
            {mode === "loop-mv" && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                      <Film className="w-3.5 h-3.5 text-indigo-400" />
                      <span>2. Motion Prompt วิดีโอลูป 10 วินาที (สำหรับนำภาพปกไปขยับใน Google Flow / AI Video)</span>
                    </label>
                    <p className="text-[10px] text-slate-400">
                      ตามแม่บทข้อที่ 2 ใน สร้างปก.txt: ล็อกมุมกล้อง 100% ตัวละครหายใจ 3.3s ละอองบรรยากาศพริ้วไหว วนลูปเนียนสนิท 0s = 10s
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyMotionPrompt}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/30 transition-all shrink-0"
                  >
                    {copiedKey === "motion" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "motion" ? "คัดลอกแล้ว!" : "คัดลอกคำสั่งวิดีโอ"}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded-xl text-xs font-mono text-indigo-200 whitespace-pre-wrap leading-relaxed select-all">
                  {motionPrompt}
                </div>

                {/* Recommended Settings Box */}
                <div className="p-2.5 bg-indigo-950/40 rounded-xl border border-indigo-500/20 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Duration</span>
                    <span className="text-indigo-300 font-bold">10s</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Motion Strength</span>
                    <span className="text-indigo-300 font-bold">2–3 (กำลังดี)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Camera Motion</span>
                    <span className="text-indigo-300 font-bold">Off / None</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Master Mega-Prompt v8.0 */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    <label className="text-xs font-bold text-amber-300">
                      3. Master Mega-Prompt v8.0 (ส่งเข้าแชท AI คุยยาวครบวงจร: พิมพ์เขียว + ภาพปก + โมชั่น)
                    </label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      🛡️ ป้องกันรูป Flow 100%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    รวมคำสั่งวิเคราะห์ + แนบเนื้อเพลง + สั่งสร้างภาพปก 1 ภาพ + สั่งทำโมชั่น (มีเกราะป้องกัน AI เจนรูปหน้าจอโปรแกรม Google Flow หรือไดอะแกรม 100%)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMegaPrompt}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md shadow-amber-600/30 transition-all shrink-0"
                >
                  {copiedKey === "mega" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "mega" ? "คัดลอกแล้ว!" : "คัดลอก Mega-Prompt"}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-200/90 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                {fullMegaPrompt}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live 9:16 Artwork & Safe Zone Verification */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center">
            {/* Top Bar: Title & Upload */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  3. ภาพปกหรือคลิปวิดีโอ 9:16 สำหรับใช้ทำ MV
                </h3>
              </div>

              {/* Upload Button */}
              <label className="cursor-pointer flex items-center space-x-1.5 text-xs px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-md shadow-cyan-600/25 transition-all focus-within:ring-2 focus-within:ring-cyan-300">
                <Upload className="w-3.5 h-3.5" />
                <span>📁 นำเข้าภาพ/คลิป 9:16</span>
                <input
                  type="file"
                  accept="image/*,video/*,.png,.jpg,.jpeg,.webp,.mp4,.mov,.webm"
                  onChange={handleMediaUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Safe Zone & Simulator 3-Mode Toggle Bar */}
            <div className="w-full space-y-1.5 mb-2">
              <div className="w-full p-1 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowTikTokSimulator(true);
                    setShowSafeZones(false);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center space-x-1 ${
                    showTikTokSimulator
                      ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white border-pink-400 shadow-md shadow-pink-600/30"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>📱 จำลอง TikTok จริง</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowTikTokSimulator(false);
                    setShowSafeZones(true);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center space-x-1 ${
                    showSafeZones
                      ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>📐 ผัง Safe Zone 4 มิติ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowTikTokSimulator(false);
                    setShowSafeZones(false);
                  }}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center space-x-1 ${
                    !showTikTokSimulator && !showSafeZones
                      ? "bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ภาพเพียว</span>
                </button>
              </div>

              {/* Status explanation */}
              <div className="text-[10px] px-1 flex items-center justify-between">
                {showTikTokSimulator ? (
                  <span className="text-pink-300 font-semibold flex items-center space-x-1">
                    <span>✨ ตรวจสอบความปลอดภัย:</span>
                    <span>คำโพสต์ด้านล่างไม่บังชื่อเพลง และซับเพลงกลางจออ่านง่าย 100%</span>
                  </span>
                ) : showSafeZones ? (
                  <span className="text-emerald-300 font-semibold flex items-center space-x-1">
                    <span>🛡️ พิกัด Safe Zone:</span>
                    <span>เขียว = ชื่อเพลง (15-28%), ฟ้า = ซับเพลง (40-72%), แดง = โซนคำโพสต์ TikTok</span>
                  </span>
                ) : (
                  <span className="text-slate-400">กำลังแสดงภาพงานศิลป์ 9:16 เพียวๆ</span>
                )}
              </div>
            </div>

            {/* All-Genre Sample Covers Quick Switcher */}
            <div className="w-full space-y-1 mb-3">
              <span className="text-[10px] font-bold text-slate-300 block">
                เลือกชมภาพปกตัวอย่างตามแนวเพลง (1-Click Switch • ครบทั้ง 6 ปก):
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  {
                    name: "เพื่อชีวิต (พ่อ)",
                    icon: "🌾",
                    title: "กอดพ่อได้เพียง",
                    url: "/covers/phaw_carpenter_cover.jpg",
                  },
                  {
                    name: "ช่างไม้ (คิดถึง)",
                    icon: "🪵",
                    title: "กลิ่นขี้เลื่อยในเสื้อตัวเก่า",
                    url: "/covers/woodworker_father_cover.jpg",
                  },
                  {
                    name: "สายใย (พ่อ-ลูก)",
                    icon: "🏡",
                    title: "อ้อมกอดของพ่อ",
                    url: "/covers/father_memory_son_cover.jpg",
                  },
                  {
                    name: "เพลงรัก (คาเฟ่)",
                    icon: "🌸",
                    title: "รักแรกพบ",
                    url: "/covers/love_acoustic_cover.jpg",
                  },
                  {
                    name: "อกหัก (ฝนพรำ)",
                    icon: "🌧️",
                    title: "คืนฝนพรำ",
                    url: "/covers/rain_city_melancholy_cover.jpg",
                  },
                  {
                    name: "ร็อก (สุดทางฝัน)",
                    icon: "🎸",
                    title: "สุดทางฝัน",
                    url: "/covers/neon_rock_stage_cover.jpg",
                  },
                ].map((cov) => (
                  <button
                    key={cov.url}
                    type="button"
                    onClick={() => {
                      setCoverImageUrl(cov.url);
                      setSongTitle(cov.title);
                      setImageFileName("");
                      setIsVideoCover(false);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-semibold border text-center transition-all truncate flex flex-col items-center space-y-0.5 ${
                      coverImageUrl === cov.url
                        ? "bg-cyan-600 text-white border-cyan-400 font-bold shadow-md shadow-cyan-600/30 ring-1 ring-cyan-300"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <span className="text-sm">{cov.icon}</span>
                    <span className="truncate w-full text-center text-[9px]">{cov.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 9:16 Artwork Box */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-black flex flex-col justify-between p-4 select-none transition-all w-[300px] sm:w-[340px] h-[533px] sm:h-[604px]">
              {/* Toast when new media uploaded */}
              {justUploaded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3 py-1 bg-emerald-500 text-slate-950 text-[11px] font-black rounded-full shadow-2xl border border-white/50 animate-bounce flex items-center space-x-1 whitespace-nowrap">
                  <Check className="w-3.5 h-3.5" />
                  <span>✨ อัปโหลดสื่อสำหรับ MV เรียบร้อยแล้ว!</span>
                </div>
              )}

              {/* Background Media */}
              {coverImageUrl && (
                isVideoCover ? (
                  <video
                    src={coverImageUrl}
                    loop
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-100"
                  />
                ) : (
                  <img
                    key={coverImageUrl}
                    src={coverImageUrl}
                    alt="Cover Preview"
                    className="absolute inset-0 w-full h-full object-cover scale-100"
                  />
                )
              )}

              {/* 1. TikTok Live UI Simulator Overlay */}
              {showTikTokSimulator && (
                <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 select-none">
                  {/* Top Header: LIVE / Tabs / Search */}
                  <div className="w-full flex items-center justify-between pt-1 px-1">
                    <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white/90 drop-shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      <span>LIVE</span>
                    </span>
                    <div className="flex items-center space-x-2.5 text-[11px] drop-shadow font-semibold text-white/70">
                      <span>กำลังติดตาม</span>
                      <span className="text-white font-bold border-b-2 border-white pb-0.5">สำหรับคุณ</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                      <Search className="w-3 h-3 text-white drop-shadow" />
                    </div>
                  </div>

                  {/* Center: Dynamic Subtitle Live Preview (ซับเนื้อเพลงวิ่ง) */}
                  <div className="absolute left-3 right-12 top-[58%] -translate-y-1/2 flex flex-col items-center">
                    <div className="bg-black/75 backdrop-blur-md border border-cyan-400/50 rounded-2xl px-3 py-2 shadow-2xl text-center max-w-[95%] ring-1 ring-cyan-500/30">
                      <div className="flex items-center justify-center space-x-1 text-[8px] text-cyan-300 font-bold mb-0.5">
                        <Music className="w-2.5 h-2.5 text-cyan-400 animate-spin" style={{ animationDuration: "4s" }} />
                        <span>ตัวอย่างซับเพลงคาราโอเกะ (ใน Safe Zone กึ่งกลางจอ)</span>
                      </div>
                      <p className="text-xs sm:text-sm font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] tracking-wide">
                        {highlightQuote || (songTitle ? `"${songTitle}"... บรรเลงก้องในใจ` : "บทเพลงเพื่อชีวิต... บรรเลงก้องในใจ")}
                      </p>
                    </div>
                    <span className="text-[8px] text-emerald-300/90 font-bold mt-1 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ ไม่ทับชื่อเพลงด้านบน และไม่โดนโพสต์ด้านล่างบัง 100%
                    </span>
                  </div>

                  {/* Right Side Vertical Icons */}
                  <div className="absolute right-2 bottom-16 flex flex-col items-center space-y-2.5">
                    {/* Avatar */}
                    <div className="relative flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-lg border border-white">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[9px] font-black text-white">
                          {!isCreditDisabled(credit) ? credit.trim().slice(0, 2).toUpperCase() : "VC"}
                        </div>
                      </div>
                      <div className="absolute -bottom-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-black shadow border border-white">
                        +
                      </div>
                    </div>

                    {/* Like */}
                    <div className="flex flex-col items-center text-white drop-shadow">
                      <Heart className="w-5 h-5 fill-rose-500 text-rose-500 drop-shadow" />
                      <span className="text-[8px] font-bold mt-0.5">142.8K</span>
                    </div>

                    {/* Comment */}
                    <div className="flex flex-col items-center text-white drop-shadow">
                      <MessageCircle className="w-5 h-5 fill-white/20 text-white drop-shadow" />
                      <span className="text-[8px] font-bold mt-0.5">3,842</span>
                    </div>

                    {/* Bookmark */}
                    <div className="flex flex-col items-center text-white drop-shadow">
                      <Bookmark className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow" />
                      <span className="text-[8px] font-bold mt-0.5">21.5K</span>
                    </div>

                    {/* Share */}
                    <div className="flex flex-col items-center text-white drop-shadow">
                      <Share2 className="w-5 h-5 text-white drop-shadow" />
                      <span className="text-[8px] font-bold mt-0.5">12.3K</span>
                    </div>

                    {/* Spinning Vinyl Disc */}
                    <div
                      className="w-7 h-7 rounded-full bg-slate-950 border-2 border-slate-600 shadow-xl flex items-center justify-center animate-spin"
                      style={{ animationDuration: "5s" }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    </div>
                  </div>

                  {/* Bottom: TikTok Post Caption & Audio Ticker (คำโพสต์ของ TikTok) */}
                  <div className="w-full pr-12 pb-1 space-y-1">
                    <div className="text-[11px] font-black text-white drop-shadow flex items-center space-x-1">
                      <span>@{!isCreditDisabled(credit) ? credit.trim().toLowerCase().replace(/\s+/g, "") : "vericapvdo"}</span>
                      <span className="text-white/60 text-[9px] font-normal">· 1 วันที่แล้ว</span>
                    </div>
                    <p className="text-[10px] text-white font-medium leading-snug drop-shadow line-clamp-2">
                      {hookHeadline.trim() || `${songTitle || "บทเพลงของคุณ"}... บทเพลงแห่งความทรงจำ 🌾`}{" "}
                      #{songTitle ? songTitle.replace(/\s+/g, "") : "เพลงใหม่"} #เพลงฮิต #fyp
                    </p>
                    <div className="flex items-center space-x-1 text-[9px] text-white/90 drop-shadow">
                      <Music className="w-2.5 h-2.5 text-white shrink-0 animate-bounce" />
                      <span className="truncate">
                        เสียงต้นฉบับ - {!isCreditDisabled(credit) ? credit.trim() : "VeriCapVdo"} • {songTitle || "Music"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Analytical Safe Zone Grid Overlay (ผัง Safe Zone 4 มิติ) */}
              {showSafeZones && (
                <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 select-none">
                  {/* Title Safe Zone (Upper-Center: 15% - 28%) */}
                  <div
                    className="w-full border-2 border-dashed border-emerald-400 rounded-xl bg-emerald-500/15 flex flex-col items-center justify-center p-2 text-center shadow-lg mt-[12%]"
                    style={{ height: "22%" }}
                  >
                    <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow">
                      🟢 Title Safe Zone (15% - 28%)
                    </span>
                    <span className="text-[9px] text-emerald-200 mt-0.5 font-bold">
                      {songTitle || "ชื่อเพลงภาษาไทย"}
                    </span>
                    <span className="text-[7.5px] text-emerald-300">
                      ✓ ปลอดภัยจากแถบบน TikTok (0-12%) และอยู่เหนือซับเพลง 100%
                    </span>
                  </div>

                  {/* Lyric Subtitle Zone (Center: 40% - 72%) */}
                  <div
                    className="w-full border-2 border-dashed border-cyan-400 rounded-xl bg-cyan-500/15 flex flex-col items-center justify-center p-2 text-center shadow-lg my-auto"
                    style={{ height: "30%" }}
                  >
                    <span className="bg-cyan-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow">
                      🔵 Lyric Subtitle Zone (40% - 72%)
                    </span>
                    <span className="text-[9px] text-cyan-200 mt-0.5 font-semibold">
                      พื้นที่ซับคาราโอเกะ (Negative Space)
                    </span>
                    <span className="text-[7.5px] text-cyan-300">
                      ✓ เว้นโปร่งตา โบเก้ละมุน ห้ามมีตัวหนังสืออื่น ซับอ่านง่าย 100%
                    </span>
                  </div>

                  {/* TikTok Post Caption Danger Zone (Bottom: 25%) */}
                  <div
                    className="w-full border-2 border-dashed border-rose-500 rounded-xl bg-rose-500/20 flex flex-col items-center justify-center p-1.5 text-center mt-auto shadow-lg"
                    style={{ height: "22%" }}
                  >
                    <span className="bg-rose-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow">
                      🔴 TikTok Post Danger Zone (ล่างสุด 25%)
                    </span>
                    <span className="text-[8px] text-rose-200 mt-0.5 font-bold">
                      ห้ามวางชื่อเพลงตรงนี้เด็ดขาด!
                    </span>
                    <span className="text-[7.5px] text-rose-300">
                      คำโพสต์ TikTok + แคปชัน + แฮชแท็ก + เสียงเพลง จะบังมิด
                    </span>
                  </div>

                  {/* Right Side Buttons Clearance indicator */}
                  <div
                    className="absolute top-1/4 bottom-1/4 right-0 w-11 border-l-2 border-dashed border-amber-400 bg-amber-500/10 flex items-center justify-center p-1 text-center"
                  >
                    <span className="text-[7px] text-amber-300 font-bold rotate-90 whitespace-nowrap">
                      🟠 ขอบปุ่ม Like/Share
                    </span>
                  </div>
                </div>
              )}

              {/* Optional Typography Burning Overlay placed strictly inside 15-28% Title Safe Zone */}
              {enableTypographyOverlay && (
                <div className="absolute inset-x-4 top-[14%] pointer-events-none z-20 flex flex-col items-center space-y-2 text-center">
                  <h4
                    className="text-lg font-black text-white tracking-wide drop-shadow-2xl px-2 leading-tight"
                    style={{
                      textShadow: "0 4px 16px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9)",
                    }}
                  >
                    {songTitle || "ชื่อเพลงของคุณ"}
                  </h4>

                  {!isCreditDisabled(credit) && (
                    <div className="px-3 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/25 shadow-lg max-w-[90%] truncate">
                      <p className="text-[10px] font-bold text-slate-100 drop-shadow truncate">
                        {credit.trim()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optional Typography Toggle */}
            <div className="w-full max-w-[340px] mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                {isVideoCover
                  ? "สำหรับวิดีโอ: แนะนำปรับข้อความในขั้นตอนที่ 3 (MV Studio)"
                  : "เผื่อใช้รูปเปล่าที่ยังไม่มีตัวหนังสือ:"}
              </span>
              {!isVideoCover && (
                <button
                  type="button"
                  onClick={() => setEnableTypographyOverlay(!enableTypographyOverlay)}
                  className="text-[11px] text-cyan-400 hover:underline font-semibold shrink-0 ml-2"
                >
                  {enableTypographyOverlay ? "ปิดการพิมพ์ข้อความทับ" : "พิมพ์ข้อความจำลองทับ"}
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDownloadCoverImage}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isVideoCover
                    ? "ดาวน์โหลดไฟล์วิดีโอนี้"
                    : enableTypographyOverlay
                    ? "ดาวน์โหลดภาพปก (พร้อมชื่อเพลง)"
                    : "ดาวน์โหลดภาพปกนี้"}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSendToMvStudio({
                    title: songTitle,
                    coverImage: coverImageUrl,
                    backgroundVideo: isVideoCover ? coverImageUrl : undefined,
                    credit: isCreditDisabled(credit) ? "" : credit.trim(),
                    lyrics: lyrics,
                    hookHeadline: hookHeadline.trim() || undefined,
                  })
                }
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 ml-auto"
              >
                <span>ส่งต่อไปทำ MV วิดีโอ (Step 3)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
