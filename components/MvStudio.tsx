"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Download,
  Sparkles,
  Music,
  FileText,
  Sliders,
  Smartphone,
  Monitor,
  Check,
  Loader2,
  Activity,
  Wand2,
  Edit3,
  Clock,
  FastForward,
  Rewind,
  ListMusic,
  Trash2,
  Plus,
  Target,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Key,
  ExternalLink,
  Scissors,
  Film,
  Zap,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import {
  parseSubtitleFile,
  autoGenerateCuesFromLyrics,
  exportCuesToSRT,
  exportCuesToLRC,
  exportCuesToVTT,
  offsetCues,
  cleanLyricsToLines,
  SubtitleCue,
  formatTime,
  getDefaultKodPhorCues,
  DEFAULT_KOD_PHOR_LRC,
  cleanSubtitleText,
  balanceThaiLyric,
} from "@/lib/srtParser";
import { createAcousticDemoAudio } from "@/lib/audioDemo";
import { exportMusicVideo } from "@/lib/videoExporter";
import {
  createMvParticles,
  createMvSprites,
  computeCameraTransform,
  drawMvEffects,
} from "@/lib/mvVisuals";

function safeGetStorageItem(key: string): string {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) || "" : "";
  } catch {
    return "";
  }
}

function safeSetStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

function safeRemoveStorageItem(key: string): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore private-mode errors
  }
}

interface MvStudioProps {
  apiKey?: string;
  onUpdateApiKey?: (newKey: string) => void;
  initialTitle?: string;
  initialCoverImage?: string;
  initialIsVideoBg?: boolean;
  initialCredit?: string;
  initialLyrics?: string;
  initialHookHeadline?: string;
}

export default function MvStudio({
  apiKey = "",
  onUpdateApiKey,
  initialTitle = "",
  initialCoverImage = "",
  initialIsVideoBg = false,
  initialCredit = "",
  initialLyrics = "",
  initialHookHeadline = "",
}: MvStudioProps) {
  // API Key management (exclusively used in Step 3 for Audio & Subtitle Precision Sync)
  const [apiKeyVal, setApiKeyVal] = useState<string>(() => apiKey || safeGetStorageItem("gemini_api_key"));
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [showKeyEditor, setShowKeyEditor] = useState<boolean>(false);
  const [tempKeyInput, setTempKeyInput] = useState<string>(() => apiKey || safeGetStorageItem("gemini_api_key"));
  const [showTempKeyPassword, setShowTempKeyPassword] = useState<boolean>(false);

  useEffect(() => {
    if (apiKey && apiKey !== apiKeyVal) {
      setApiKeyVal(apiKey);
      setTempKeyInput(apiKey);
    }
  }, [apiKey, apiKeyVal]);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/gemini/test-connection", { method: "GET", signal: ac.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.hasServerKey === "boolean") {
          setHasServerKey(data.hasServerKey);
        }
      })
      .catch(() => {
        // Ignore abort or offline check
      });
    return () => ac.abort();
  }, []);
  // 1. Song Metadata (Directly Editable)
  const [songTitle, setSongTitle] = useState(initialTitle || "กอดพ่อได้เพียง");
  const [credit, setCredit] = useState(initialCredit || "megapoomz");
  const [lyrics, setLyrics] = useState(
    initialLyrics ||
      DEFAULT_KOD_PHOR_LRC.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, "").trim()
  );
  const [hookHeadline, setHookHeadline] = useState<string>("ใครที่กำลังเหนื่อย... ฟังเพลงนี้เถอะนะ 💔");
  const [showHookHeadline, setShowHookHeadline] = useState<boolean>(true);
  const [showVinylDisc, setShowVinylDisc] = useState<boolean>(false);

  // AI Sync States (Google AI Studio)
  const [isAiSyncing, setIsAiSyncing] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [apiTestStatus, setApiTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // 2. Media states
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioName, setAudioName] = useState<string>("");
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>(getDefaultKodPhorCues());
  const [subtitleFileName, setSubtitleFileName] = useState<string>("กอดพ่อได้เพียง.lrc (ซิงก์ตรงเป๊ะ 100%)");
  const [backgroundMediaUrl, setBackgroundMediaUrl] = useState<string>(
    initialCoverImage || "/covers/phaw_carpenter_cover.jpg"
  );
  const [isVideoBg, setIsVideoBg] = useState(false);

  // 3. Player & CapCut Trimming states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");

  // CapCut-Style Trimming States
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [isTrimActive, setIsTrimActive] = useState<boolean>(false);

  // 4. Styling customizer
  const [subtitleStyle, setSubtitleStyle] = useState<"neon-yellow" | "cyber-cyan" | "pure-white" | "sunset-gold" | "ruby-red">("neon-yellow");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "mega">("large");
  const [subtitlePosY, setSubtitlePosY] = useState<number>(0.64);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [showTopTitle, setShowTopTitle] = useState<boolean>(false);
  const [showWaveform, setShowWaveform] = useState<boolean>(true);
  const [showTikTokSafeArea, setShowTikTokSafeArea] = useState<boolean>(false);
  const [enableKenBurns, setEnableKenBurns] = useState<boolean>(true);
  const [cameraMotion, setCameraMotion] = useState<
    "organic-breath" | "slow-zoom-in" | "slow-pan" | "beat-pulse" | "static" | "zoom-pulse" | "pan-drift" | "dramatic-pulse"
  >("organic-breath");
  const [subtitleTransition, setSubtitleTransition] = useState<"slide-up" | "bounce-pop" | "glow-fade">("slide-up");
  const [currentGenrePreset, setCurrentGenrePreset] = useState<string>("folk-life");
  const [visualEffect, setVisualEffect] = useState<
    "bokeh-glow" | "golden-hour" | "rain-drops" | "stage-spotlight" | "cyber-neon" | "vintage-film" | "snow-drift" | "none" | "golden-dust" | "sunbeam" | "lantern-glow" | "gentle-rain"
  >("bokeh-glow");
  const [showLyricEditor, setShowLyricEditor] = useState<boolean>(false);
  const [showTimingTable, setShowTimingTable] = useState<boolean>(false);
  const [showSubtitleSectionInCleanMode, setShowSubtitleSectionInCleanMode] = useState<boolean>(false);

  // 5. Live Karaoke "Tap-to-Sync" State
  const [isTappingMode, setIsTappingMode] = useState<boolean>(false);
  const [tapIndex, setTapIndex] = useState<number>(0);
  const [tapDraftCues, setTapDraftCues] = useState<SubtitleCue[]>([]);
  const [toastMessage, setToastMessage] = useState<string>("");

  // 6. Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDoneUrl, setExportDoneUrl] = useState<string>("");
  const [exportedFileExt, setExportedFileExt] = useState<string>("mp4");
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoBgRef = useRef<HTMLVideoElement | null>(null);
  const bgMediaContainerRef = useRef<HTMLDivElement | null>(null);
  const effectCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapDraftCuesRef = useRef<SubtitleCue[]>([]);
  const tapStampedIndicesRef = useRef<Set<number>>(new Set());
  const exportAbortRef = useRef<AbortController | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const bgBlobUrlRef = useRef<string | null>(null);
  const exportBlobUrlRef = useRef<string | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (finishTapTimerRef.current) clearTimeout(finishTapTimerRef.current);
      exportAbortRef.current?.abort();
      if (audioBlobUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
      if (bgBlobUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(bgBlobUrlRef.current);
      }
      if (exportBlobUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(exportBlobUrlRef.current);
      }
    };
  }, []);

  const applyGenrePreset = (presetId: string) => {
    setCurrentGenrePreset(presetId);
    switch (presetId) {
      case "folk-life":
        setCameraMotion("organic-breath");
        setVisualEffect("golden-hour");
        setSubtitleStyle("neon-yellow");
        setSubtitleTransition("slide-up");
        showToast("🌾 สลับสู่โหมด: เพื่อชีวิต / สู้ชีวิต (แสงแดดสีทอง + ลมหายใจ 3.3s)");
        break;
      case "melancholy":
        setCameraMotion("slow-zoom-in");
        setVisualEffect("rain-drops");
        setSubtitleStyle("cyber-cyan");
        setSubtitleTransition("glow-fade");
        showToast("🌧️ สลับสู่โหมด: อกหัก / ซึ้งคิดถึง (ละอองฝนโปรย + ซูมเข้าดึงอารมณ์)");
        break;
      case "love-acoustic":
        setCameraMotion("organic-breath");
        setVisualEffect("bokeh-glow");
        setSubtitleStyle("pure-white");
        setSubtitleTransition("glow-fade");
        showToast("🌸 สลับสู่โหมด: เพลงรัก / อะคูสติก (ประกายโบเก้ละมุน + ขาวคมชัด)");
        break;
      case "rock-energy":
        setCameraMotion("beat-pulse");
        setVisualEffect("stage-spotlight");
        setSubtitleStyle("ruby-red");
        setSubtitleTransition("bounce-pop");
        showToast("🎸 สลับสู่โหมด: ร็อกมันส์ / บีตหนัก (สปอตไลต์เวที + บีตเด้ง)");
        break;
      case "city-pop":
        setCameraMotion("slow-pan");
        setVisualEffect("cyber-neon");
        setSubtitleStyle("cyber-cyan");
        setSubtitleTransition("slide-up");
        showToast("🏙️ สลับสู่โหมด: ซิตี้ป๊อป / ค่ำคืนในเมือง (แสงนีออนสะท้อน + สไลด์กล้อง)");
        break;
      case "family-warmth":
        setCameraMotion("organic-breath");
        setVisualEffect("golden-hour");
        setSubtitleStyle("sunset-gold");
        setSubtitleTransition("slide-up");
        showToast("🏠 สลับสู่โหมด: ครอบครัว / อบอุ่น (แสงแดดยามเย็น + ลมหายใจ 3.3s)");
        break;
    }
  };

  // 1-Click AI Auto-Director: Analyzes song, lyrics, and mood to auto-configure camera, effects, headline, and waveform
  const handleAiAutoDirect = () => {
    const textToAnalyze = `${songTitle} ${lyrics}`.toLowerCase();

    let selectedPreset = "folk-life";
    let headline = "ใครที่กำลังเหนื่อย... ฟังเพลงนี้เถอะนะ 💔";

    if (
      textToAnalyze.includes("พ่อ") ||
      textToAnalyze.includes("ไม้") ||
      textToAnalyze.includes("ช่าง") ||
      textToAnalyze.includes("เหงื่อ") ||
      textToAnalyze.includes("รวงข้าว") ||
      textToAnalyze.includes("ดิน") ||
      textToAnalyze.includes("สู้")
    ) {
      selectedPreset = "folk-life";
      headline = songTitle.includes("พ่อ")
        ? "บทเพลงแห่งความคิดถึง... กอดพ่อได้เพียงในความทรงจำ 🌾"
        : "ใครที่กำลังเหนื่อยและท้อ... ฟังเพลงนี้สู้ต่อนะ 🌾";
    } else if (
      textToAnalyze.includes("รัก") ||
      textToAnalyze.includes("สบตา") ||
      textToAnalyze.includes("กาแฟ") ||
      textToAnalyze.includes("ยิ้ม")
    ) {
      selectedPreset = "love-acoustic";
      headline = "หยุดฟัง 10 วินาที... แล้วคุณจะตกหลุมรักเพลงนี้ 🌸";
    } else if (
      textToAnalyze.includes("ฝน") ||
      textToAnalyze.includes("คิดถึง") ||
      textToAnalyze.includes("อกหัก") ||
      textToAnalyze.includes("น้ำตา") ||
      textToAnalyze.includes("คืน")
    ) {
      selectedPreset = "melancholy";
      headline = "เปิดฟังตอนฝนตก... ดิ่งและกินใจมาก 🌧️";
    } else if (
      textToAnalyze.includes("ร็อก") ||
      textToAnalyze.includes("ฝัน") ||
      textToAnalyze.includes("พลัง") ||
      textToAnalyze.includes("ไฟ") ||
      textToAnalyze.includes("นักสู้")
    ) {
      selectedPreset = "rock-energy";
      headline = "เพลงเติมพลังใจ... ลุกขึ้นมาสู้สุดทางฝัน 🎸";
    } else {
      selectedPreset = "city-pop";
      headline = "บทเพลงยามค่ำคืน... เปิดฟังเพลินๆ ชวนให้คิดถึงใครบางคน 🏙️";
    }

    applyGenrePreset(selectedPreset);
    setHookHeadline(headline);
    setShowHookHeadline(true);
    setShowWaveform(true);

    // If user has lyrics and subtitles is empty, auto-generate cues!
    if (lyrics.trim() && subtitles.length === 0) {
      const targetDur = duration > 0 ? duration : 60;
      const cues = autoGenerateCuesFromLyrics(lyrics, targetDur, 2.0, 4.0);
      setSubtitles(cues);
      setSubtitleFileName(`สร้างซับอัตโนมัติจากเนื้อเพลง (${cues.length} ท่อน)`);
    }

    showToast(`✨ ผู้กำกับ AI ตัดต่อให้เรียบร้อย: สไตล์ ${selectedPreset} + เอฟเฟกต์บรรยากาศและมุมกล้องเข้ากับปกเพลง 100%!`);
  };

  // 1-Click Auto Generate Subtitles from Lyrics (No SRT/LRC required!)
  const handleAutoGenerateFromLyrics = () => {
    if (!lyrics.trim()) {
      showToast("⚠️ ไม่พบเนื้อเพลง กรุณาพิมพ์หรือวางเนื้อเพลงก่อนครับ");
      return;
    }
    const targetDur = duration > 0 ? duration : 60;
    const cues = autoGenerateCuesFromLyrics(lyrics, targetDur, 2.0, 4.0);
    setSubtitles(cues);
    setSubtitleFileName(`สร้างซับอัตโนมัติจากเนื้อเพลง (${cues.length} ท่อน)`);
    setShowSubtitles(true);
    showToast(`⚡ สร้างซับไตเติลอัตโนมัติ ${cues.length} ท่อนเรียบร้อยแล้ว (ไม่ต้องใช้ไฟล์ SRT)`);
  };

  const getSubtitleAnimClass = () => {
    switch (subtitleTransition) {
      case "bounce-pop":
        return "anim-bounce-pop";
      case "glow-fade":
        return "anim-glow-fade";
      case "slide-up":
      default:
        return "anim-slide-up";
    }
  };

  // Live Canvas Atmospheric Effect Loop & 60 FPS Camera Motion (Shared @/lib/mvVisuals engine)
  useEffect(() => {
    const canvas = effectCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 340);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 604);

    const buildMistGradient = (h: number) => {
      const grad = ctx.createLinearGradient(0, h * 0.7, 0, h);
      grad.addColorStop(0, "rgba(200, 225, 255, 0)");
      grad.addColorStop(1, "rgba(180, 215, 245, 0.18)");
      return grad;
    };

    let mistGradient = buildMistGradient(height);
    const sprites = createMvSprites();
    let particles = createMvParticles(width, height, 45);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const nextW = canvas.parentElement.clientWidth || 340;
      const nextH = canvas.parentElement.clientHeight || 604;
      if (nextW !== width || nextH !== height) {
        width = canvas.width = nextW;
        height = canvas.height = nextH;
        mistGradient = buildMistGradient(height);
        particles = createMvParticles(width, height, 45);
      }
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleResize) : null;
    if (resizeObserver && canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    } else {
      window.addEventListener("resize", handleResize);
    }

    let t = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dtMs = now - lastTime;
      lastTime = now;
      const dtScale = Math.min(Math.max(dtMs / 16.6667, 0.25), 2.5);
      ctx.clearRect(0, 0, width, height);

      // 1. Camera Motion synchronized with @/lib/mvVisuals
      if (bgMediaContainerRef.current) {
        if (!enableKenBurns || !isPlaying) {
          bgMediaContainerRef.current.style.transform = "scale(1.0) translate(0px, 0px)";
        } else {
          const curT =
            audioRef.current && !audioRef.current.paused ? audioRef.current.currentTime : t;
          const totalD = duration > 0 ? duration : 60;
          const prog = curT / totalD;
          const bassEnergy = 0.22 * (0.5 + 0.5 * Math.sin(curT * 3.1));
          const { scale, panX, panY } = computeCameraTransform(
            curT,
            prog,
            bassEnergy,
            enableKenBurns,
            cameraMotion,
            width,
            height
          );
          bgMediaContainerRef.current.style.transform = `scale(${scale.toFixed(4)}) translate(${panX.toFixed(2)}px, ${panY.toFixed(2)}px)`;
        }
      }

      // 2. Atmospheric Visual Effects using pre-cached radial sprites
      if (visualEffect !== "none") {
        t += (isPlaying ? 0.03 : 0.015) * dtScale;
        const bassEnergy = isPlaying ? 0.25 : 0;
        drawMvEffects(ctx, {
          width,
          height,
          currentTime: t,
          bassEnergy,
          visualEffect,
          particles,
          sprites,
          mistGradient,
          dtScale,
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [visualEffect, isPlaying, enableKenBurns, cameraMotion, duration]);

  // Auto-initialize demo acoustic audio on initial mount if audioUrl is empty
  useEffect(() => {
    let active = true;
    if (!audioUrl) {
      createAcousticDemoAudio()
        .then((demoUrl) => {
          if (active) {
            if (demoUrl.startsWith("blob:") && !audioBlobUrlRef.current) {
              audioBlobUrlRef.current = demoUrl;
            }
            setAudioUrl((prev) => prev || demoUrl);
            setAudioName((prev) => prev || "เสียงกีตาร์โฟล์กเพื่อชีวิต 78 BPM (เสียงอะคูสติกจริง)");
          } else if (demoUrl.startsWith("blob:")) {
            URL.revokeObjectURL(demoUrl);
          }
        })
        .catch(() => {
          // AudioContext may require user interaction in strict browser policies
        });
    }
    return () => {
      active = false;
    };
  }, []);

  // Sync props when user passes data from previous tabs
  useEffect(() => {
    if (initialCoverImage) {
      setBackgroundMediaUrl(initialCoverImage);
      setIsVideoBg(
        Boolean(initialIsVideoBg || /\.(mp4|webm|mov)(\?|$)/i.test(initialCoverImage))
      );
    }
    if (initialTitle) setSongTitle(initialTitle);
    if (initialCredit !== undefined) setCredit(initialCredit);
    if (initialHookHeadline && initialHookHeadline.trim()) {
      setHookHeadline(initialHookHeadline.trim());
      setShowHookHeadline(true);
    }
    if (initialLyrics) {
      setLyrics(initialLyrics);
      if (initialTitle?.includes("กอดพ่อ") || initialLyrics?.includes("กอดพ่อ")) {
        setSubtitles(getDefaultKodPhorCues());
        setSubtitleFileName("กอดพ่อได้เพียง.lrc (ซิงก์ตรงเป๊ะ 100%)");
      } else {
        const generated = autoGenerateCuesFromLyrics(initialLyrics, duration > 0 ? duration : 30, 2.0, 4.0);
        if (generated.length > 0) {
          setSubtitles(generated);
          setSubtitleFileName(`ซับสำหรับ ${initialTitle || "เพลงใหม่"} (${generated.length} ท่อน)`);
        }
      }
    }
  }, [initialCoverImage, initialIsVideoBg, initialTitle, initialCredit, initialLyrics, initialHookHeadline]);

  // Handle auto generation of cues from raw lyrics
  const handleAutoGenerateCues = (customText?: string, introOffset: number = 2.0, pace: number = 4.0) => {
    const textToUse = customText || lyrics;
    if (!textToUse.trim()) {
      showToast("⚠️ กรุณากรอกหรือวางเนื้อเพลงก่อนครับ");
      return;
    }
    const targetDuration = duration > 0 ? duration : (audioRef.current?.duration || 45);
    const cues = autoGenerateCuesFromLyrics(textToUse, targetDuration, introOffset, pace);
    if (cues.length === 0) {
      showToast("⚠️ ไม่พบบรรทัดเนื้อเพลงที่สามารถสร้างซับได้");
      return;
    }
    setSubtitles(cues);
    setSubtitleFileName(`ซับซิงก์จากเนื้อเพลงจริง (${cues.length} ท่อน • คำนวณอัตโนมัติ)`);
    showToast(`✨ คำนวณเวลาซับ ${cues.length} ท่อนจากเนื้อเพลงสำเร็จ`);
  };

  // 1-Click Fast Subtitle Calculation (Zero API Key needed)
  const handleAutoCalcSubtitles = () => {
    if (!lyrics.trim()) {
      showToast("⚠️ กรุณากรอกหรือวางเนื้อเพลงก่อนครับ");
      return;
    }
    const d = duration > 0 ? duration : (audioRef.current?.duration || 45);
    const cues = autoGenerateCuesFromLyrics(lyrics, d, 2.0, 4.0);
    if (cues.length === 0) {
      showToast("⚠️ ไม่พบบรรทัดเนื้อเพลงที่สามารถสร้างซับได้");
      return;
    }
    setSubtitles(cues);
    setSubtitleFileName(`ซับซิงก์อัตโนมัติ (${cues.length} ท่อน • ${Math.round(d)} วินาที)`);
    showToast(`⚡ คำนวณเวลาซับ ${cues.length} ท่อนให้ตรงกับความยาวเพลงเรียบร้อย!`);
  };

  // Live Tap-to-Sync Engine
  const finishTapSyncMode = useCallback(() => {
    if (finishTapTimerRef.current) {
      clearTimeout(finishTapTimerRef.current);
      finishTapTimerRef.current = null;
    }
    setIsTappingMode(false);
    const draftSnapshot = tapDraftCuesRef.current;
    const stampedSet = tapStampedIndicesRef.current;
    if (draftSnapshot.length > 0) {
      // Preserve every stamped line (including index 0 even if stamped at 0.0s)
      const finalCues = draftSnapshot
        .filter((_, idx) => (stampedSet.size > 0 ? stampedSet.has(idx) : idx === 0))
        .map((c, i, arr) => {
          const next = arr[i + 1];
          const endTime =
            next && next.startTime > c.startTime
              ? Number((next.startTime - 0.1).toFixed(2))
              : Number((c.startTime + 3.8).toFixed(2));
          return {
            ...c,
            id: i + 1,
            endTime,
          };
        });

      if (finalCues.length > 0) {
        setSubtitles(finalCues);
        setSubtitleFileName("ซับซิงก์สดด้วยมือ 100% (Tap-to-Sync Master)");
        showToast("🎉 เคาะจังหวะครบทุกท่อนแล้ว! ซับจะขึ้นตรงกับเสียงร้อง 100% เป๊ะ!");
      }
    }
  }, [showToast]);

  const startTapSyncMode = async () => {
    const cleanLines = cleanLyricsToLines(lyrics);
    if (cleanLines.length === 0) {
      showToast("⚠️ กรุณาใส่เนื้อเพลงก่อนเริ่มเคาะจังหวะครับ");
      return;
    }
    if (finishTapTimerRef.current) {
      clearTimeout(finishTapTimerRef.current);
      finishTapTimerRef.current = null;
    }

    let currentAudio = audioUrl;
    if (!currentAudio) {
      try {
        showToast("🎵 กำลังโหลดเสียงดนตรี Demo เพื่อเริ่มเคาะจังหวะ...");
        currentAudio = await createAcousticDemoAudio();
        if (currentAudio.startsWith("blob:")) {
          if (audioBlobUrlRef.current?.startsWith("blob:")) {
            URL.revokeObjectURL(audioBlobUrlRef.current);
          }
          audioBlobUrlRef.current = currentAudio;
        }
        setAudioUrl(currentAudio);
        setAudioName("เสียงกีตาร์โฟล์กเพื่อชีวิต 78 BPM (เสียงอะคูสติกจริง)");
        if (audioRef.current) {
          audioRef.current.src = currentAudio;
        }
      } catch {
        showToast("⚠️ ไม่สามารถสร้างเสียง Demo ได้ กรุณาอัปโหลดไฟล์เพลง");
        return;
      }
    }

    // Prepare fresh draft cues with empty timings
    const initialDrafts: SubtitleCue[] = cleanLines.map((text, i) => ({
      id: i + 1,
      startTime: 0,
      endTime: 0,
      text,
    }));

    tapDraftCuesRef.current = initialDrafts;
    tapStampedIndicesRef.current = new Set();
    setTapDraftCues(initialDrafts);
    setTapIndex(0);
    setIsTappingMode(true);

    // Start playing audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    showToast("🎯 เริ่มโหมดเคาะจังหวะซับแล้ว! ฟังเพลงแล้วกดปุ่มเคาะ หรือเคาะ Spacebar เมื่อนักร้องเริ่มร้องแต่ละท่อน");
  };

  const handleTapCurrentLine = useCallback(() => {
    if (!isTappingMode || !audioRef.current) return;

    const t = Number(audioRef.current.currentTime.toFixed(2));
    const currentDrafts = tapDraftCuesRef.current;

    if (tapIndex >= currentDrafts.length) {
      finishTapSyncMode();
      return;
    }

    const updated = [...currentDrafts];
    if (tapIndex > 0 && updated[tapIndex - 1]) {
      updated[tapIndex - 1] = {
        ...updated[tapIndex - 1],
        endTime: Math.max(t - 0.1, updated[tapIndex - 1].startTime + 0.8),
      };
    }
    updated[tapIndex] = {
      ...updated[tapIndex],
      startTime: t,
      endTime: t + 4.0,
    };

    tapDraftCuesRef.current = updated;
    tapStampedIndicesRef.current.add(tapIndex);
    setTapDraftCues(updated);

    const nextIdx = tapIndex + 1;
    setTapIndex(nextIdx);

    if (nextIdx >= currentDrafts.length) {
      finishTapTimerRef.current = setTimeout(() => {
        finishTapSyncMode();
      }, 600);
    }
  }, [isTappingMode, tapIndex, finishTapSyncMode]);

  // Global Time Offset Adjuster
  const handleShiftAllCues = (offsetSeconds: number) => {
    if (subtitles.length === 0) return;
    setSubtitles((prev) => offsetCues(prev, offsetSeconds));
    showToast(`เลื่อนเวลาซับ ${offsetSeconds > 0 ? `+${offsetSeconds}` : offsetSeconds} วินาที เรียบร้อยแล้ว`);
  };

  // Set first cue to start at current playback position (Sync Intro)
  const handleAlignIntroToCurrentTime = () => {
    if (subtitles.length === 0) return;
    const currentT = Number(currentTime.toFixed(2));
    const firstCueStart = subtitles[0].startTime;
    const diff = currentT - firstCueStart;
    handleShiftAllCues(diff);
    showToast(`ขยับซับท่อนแรกให้เริ่มที่ ${formatTime(currentT)} เรียบร้อยแล้ว`);
  };

  // Sample Demo Loader with real synthetic acoustic audio
  const loadDemoSample = async () => {
    try {
      const realAudioUrl = await createAcousticDemoAudio();
      if (realAudioUrl.startsWith("blob:")) {
        if (audioBlobUrlRef.current?.startsWith("blob:")) {
          URL.revokeObjectURL(audioBlobUrlRef.current);
        }
        audioBlobUrlRef.current = realAudioUrl;
      }
      setAudioUrl(realAudioUrl);
      setAudioName("เสียงกีตาร์โฟล์กเพื่อชีวิต 78 BPM (เสียงอะคูสติกจริง)");
      setDuration(0);
      setCurrentTime(0);
      handleAutoGenerateCues(lyrics, 1.5);
    } catch {
      showToast("⚠️ ไม่สามารถโหลดเสียง Demo ได้ในขณะนี้");
    }
  };

  // Playback control
  const togglePlay = useCallback(async () => {
    const effectiveAudio = audioRef.current;
    if (!audioUrl) {
      try {
        showToast("🎵 กำลังโหลดเสียงดนตรีเพื่อเริ่มเล่น...");
        const demoUrl = await createAcousticDemoAudio();
        if (demoUrl.startsWith("blob:")) {
          if (audioBlobUrlRef.current?.startsWith("blob:")) {
            URL.revokeObjectURL(audioBlobUrlRef.current);
          }
          audioBlobUrlRef.current = demoUrl;
        }
        setAudioUrl(demoUrl);
        setAudioName("เสียงกีตาร์โฟล์กเพื่อชีวิต 78 BPM (Demo)");
        if (audioRef.current) {
          audioRef.current.src = demoUrl;
          audioRef.current.play().catch(() => {});
          if (videoBgRef.current) videoBgRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } catch {
        showToast("⚠️ กรุณาอัปโหลดไฟล์เพลงเพื่อเล่นพรีวิว");
      }
      return;
    }

    if (!effectiveAudio) return;

    if (isPlaying) {
      effectiveAudio.pause();
      if (videoBgRef.current) videoBgRef.current.pause();
      setIsPlaying(false);
    } else {
      if (isTrimActive && trimEnd > trimStart) {
        if (currentTime < trimStart || currentTime >= trimEnd - 0.1) {
          effectiveAudio.currentTime = trimStart;
          setCurrentTime(trimStart);
        }
      }
      effectiveAudio.play().catch(() => {});
      if (videoBgRef.current) videoBgRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying, isTrimActive, trimStart, trimEnd, currentTime, showToast]);

  // Keyboard shortcut listener for Spacebar & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showExportModal) {
          setShowExportModal(false);
          return;
        }
        if (showKeyEditor) {
          setShowKeyEditor(false);
          return;
        }
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.isContentEditable ||
          target.getAttribute("role") === "button" ||
          target.getAttribute("role") === "slider")
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (isTappingMode) {
          handleTapCurrentLine();
        } else {
          togglePlay();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTappingMode, handleTapCurrentLine, togglePlay, showExportModal, showKeyEditor]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);

      // Loop smoothly if trimming is active and past trimEnd
      if (isTrimActive && trimEnd > trimStart) {
        if (cur >= trimEnd) {
          audioRef.current.currentTime = trimStart;
          setCurrentTime(trimStart);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      setDuration(d);
      if (trimEnd === 0 || trimEnd > d) {
        setTrimEnd(d);
      }
      // If full song duration is known and we have custom lyrics, adjust cues to span full duration!
      if (d > 40 && !songTitle.includes("กอดพ่อ") && lyrics.trim()) {
        const lastCue = subtitles[subtitles.length - 1];
        if (!lastCue || lastCue.endTime < d * 0.5) {
          const updated = autoGenerateCuesFromLyrics(lyrics, d, 2.0, 4.0);
          if (updated.length > 0) {
            setSubtitles(updated);
            setSubtitleFileName(`ซับซิงก์เต็มความยาวเพลง (${Math.round(d)} วินาที • ${updated.length} ท่อน)`);
          }
        }
      }
    }
  };

  // CapCut Trimming Handlers
  const handleSetTrimStart = () => {
    const cur = Number(currentTime.toFixed(2));
    const maxStart = (trimEnd > 1 ? trimEnd - 0.5 : duration - 0.5) || 0;
    const newStart = Math.max(0, Math.min(cur, maxStart));
    setTrimStart(newStart);
    setIsTrimActive(true);
    showToast(`✂️ ตัดท่อนหัวออกแล้ว (เริ่มคลิปที่ ${formatTime(newStart)})`);
  };

  const handleSetTrimEnd = () => {
    const cur = Number(currentTime.toFixed(2));
    const minEnd = trimStart + 0.5;
    const newEnd = Math.max(minEnd, Math.min(cur, duration || cur));
    setTrimEnd(newEnd);
    setIsTrimActive(true);
    showToast(`✂️ ตัดท่อนท้ายออกแล้ว (สิ้นสุดที่ ${formatTime(newEnd)})`);
  };

  const handleResetTrim = () => {
    setTrimStart(0);
    setTrimEnd(duration || 0);
    setIsTrimActive(false);
    showToast("🔄 รีเซ็ตช่วงเวลา กลับมาใช้เพลงเต็ม 100%");
  };

  const handlePlayTrimmedClip = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = trimStart;
    setCurrentTime(trimStart);
    if (!isPlaying) {
      audioRef.current.play().catch(() => {});
      if (videoBgRef.current) videoBgRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    showToast(`▶️ กำลังเล่นพรีวิวท่อนที่ตัด (${formatTime(trimStart)} - ${formatTime(trimEnd || duration)})`);
  };

  const handlePresetTrim = (seconds: number) => {
    const maxDur = duration || 180;
    const start = Math.max(0, Math.min(currentTime, maxDur - seconds));
    const end = Math.min(maxDur, start + seconds);
    setTrimStart(start);
    setTrimEnd(end);
    setIsTrimActive(true);
    if (audioRef.current) {
      audioRef.current.currentTime = start;
      setCurrentTime(start);
    }
    showToast(`⚡ ตัดช่วงคลิป ${seconds} วินาที (${formatTime(start)} - ${formatTime(end)})`);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    if (videoBgRef.current) {
      videoBgRef.current.currentTime = time % (videoBgRef.current.duration || 10);
    }
  };

  // File Upload Handlers
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioBlobUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
      setUploadedAudioFile(file);
      const url = URL.createObjectURL(file);
      audioBlobUrlRef.current = url;
      setAudioUrl(url);
      setAudioName(file.name);
      setIsPlaying(false);
      setDuration(0);
      setCurrentTime(0);
      setTrimStart(0);
      setTrimEnd(0);
      setIsTrimActive(false);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.currentTime = 0;
      }

      // Auto-detect and set song title & credit from filename
      const rawClean = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").trim();
      let detectedTitle = rawClean;
      let detectedCredit = "";

      if (rawClean.includes(" by ")) {
        const parts = rawClean.split(" by ");
        detectedTitle = parts[0].trim();
        detectedCredit = parts[1].trim();
      } else if (rawClean.includes(" - ")) {
        const parts = rawClean.split(" - ");
        detectedTitle = parts[0].trim();
        detectedCredit = parts[1].trim();
      }

      if (rawClean.includes("กอดพ่อ") || detectedTitle.includes("กอดพ่อ")) {
        setSongTitle("กอดพ่อได้เพียง");
        setCredit(detectedCredit || "megapoomz");
        setSubtitles(getDefaultKodPhorCues());
        setSubtitleFileName("กอดพ่อได้เพียง.lrc (ซิงก์ตรงเป๊ะ 100%)");
        showToast("✨ โหลดเพลงกอดพ่อได้เพียง: ซิงก์ซับเป๊ะ 36 ท่อนพร้อมเครดิต megapoomz ทันที!");
      } else {
        if (detectedTitle) {
          setSongTitle(detectedTitle);
        }
        if (detectedCredit) {
          setCredit(detectedCredit);
        }

        // Auto-generate fresh cues for the newly uploaded song!
        if (lyrics.trim()) {
          const initialCues = autoGenerateCuesFromLyrics(lyrics, 60, 2.0, 4.0);
          setSubtitles(initialCues);
          setSubtitleFileName(`ซับสำหรับ ${detectedTitle || "เพลงใหม่"} (${initialCues.length} ท่อน)`);
        }

        showToast(`โหลดไฟล์เพลง ${file.name} สำเร็จ!`);
      }
    }
    e.target.value = "";
  };

  const handleSubtitleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const parsed = parseSubtitleFile(text, file.name);
      if (parsed.length > 0) {
        setSubtitles(parsed);
        setSubtitleFileName(file.name);
        showToast(`นำเข้าซับไตเติล ${parsed.length} ท่อน สำเร็จ`);
      } else {
        showToast("⚠️ ไม่พบรูปแบบเวลาซับไตเติลในไฟล์ กรุณาตรวจสอบไฟล์ .SRT หรือ .LRC ครับ");
      }
    }
    e.target.value = "";
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (bgBlobUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(bgBlobUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      bgBlobUrlRef.current = url;
      const isVid = file.type.startsWith("video/");
      setIsVideoBg(isVid);
      setBackgroundMediaUrl(url);
      showToast("อัปเดตภาพพื้นหลัง MV สำเร็จ");
    }
    e.target.value = "";
  };

  // AI Precision Vocal Sync via Google AI Studio
  const handleAiSyncSubtitles = async () => {
    const token = apiKeyVal || apiKey || safeGetStorageItem("gemini_api_key");
    if (!token && !hasServerKey) {
      setShowKeyEditor(true);
      showToast("🔑 กรุณากรอก Google AI Studio Key ในช่องด้านบนก่อนครับ");
      return;
    }

    if (!lyrics.trim()) {
      showToast("⚠️ กรุณากรอกหรือวางเนื้อเพลงก่อนให้ AI ทำการวิเคราะห์ครับ");
      return;
    }

    setIsAiSyncing(true);
    showToast("🤖 กำลังเชื่อมต่อ Google AI Studio เพื่อฟังเสียงและซิงก์ซับ...");

    try {
      const formData = new FormData();
      if (uploadedAudioFile) {
        formData.append("audio", uploadedAudioFile);
      }
      formData.append("lyrics", lyrics);
      formData.append("songTitle", songTitle);
      formData.append("duration", (duration > 0 ? duration : 60).toString());
      if (token) {
        formData.append("apiKey", token);
      }

      const res = await fetch("/api/gemini/sync-subtitles", {
        method: "POST",
        body: formData,
      });

      const rawText = await res.text();
      let resData: any = {};
      try {
        resData = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          res.status === 504 || res.status === 502
            ? "การเชื่อมต่อกับ AI หมดเวลา กรุณาลองใหม่อีกครั้งหรือใช้ปุ่มคำนวณซับอัตโนมัติ"
            : `เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (HTTP ${res.status})`
        );
      }

      if (!res.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการวิเคราะห์ด้วย AI");
      }

      if (resData.data) {
        const { subtitles: aiCues, recommendedHook, recommendedStyle, vocalInsight } = resData.data;

        if (aiCues && aiCues.length > 0) {
          const cleanedCues = aiCues.map((c: any, idx: number) => ({
            ...c,
            id: typeof c.id === "number" ? c.id : idx + 1,
            text: cleanSubtitleText(c.text),
          }));
          setSubtitles(cleanedCues);
          setSubtitleFileName(
            resData.mode === "fallback"
              ? `ซับซิงก์อัตโนมัติ (โหมดสำรอง • ${cleanedCues.length} ท่อน)`
              : `ซับซิงก์เสียงร้องด้วย AI (Google AI Studio • ${cleanedCues.length} ท่อน)`
          );
        }

        if (recommendedHook) {
          setHookHeadline(cleanSubtitleText(recommendedHook));
        }

        if (recommendedStyle) {
          setSubtitleStyle(recommendedStyle);
        }

        if (vocalInsight) {
          setAiInsight(vocalInsight);
        }

        // Lock to optimal TikTok lower-middle safe zone (64%)
        setSubtitlePosY(0.64);

        if (resData.mode === "fallback") {
          showToast("⚠️ AI ตอบกลับช้าหรือโควตาเต็มชั่วคราว — คำนวณจังหวะซับด้วยระบบสำรองอัตโนมัติให้แล้ว");
        } else {
          showToast("🎉 AI วิเคราะห์เสียงร้องและจัดแบ่งซับตำแหน่ง TikTok Safe Zone ให้เรียบร้อย!");
        }
      }
    } catch (err: any) {
      console.error("AI Sync failed:", err);
      showToast("⚠️ ไม่สามารถวิเคราะห์ด้วย AI ได้: " + (err?.message || "กรุณาลองใหม่"));
    } finally {
      setIsAiSyncing(false);
    }
  };

  // Test API Connection Handler
  const handleTestApiConnection = async () => {
    const token = apiKeyVal || apiKey || safeGetStorageItem("gemini_api_key");
    if (!token && !hasServerKey) {
      setShowKeyEditor(true);
      setApiTestStatus({
        success: false,
        message: "ยังไม่พบ API Key: กรุณากรอกคีย์ฟรีในช่องด้านล่างนี้ก่อนครับ",
      });
      return;
    }
    setIsTestingApi(true);
    setApiTestStatus(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch("/api/gemini/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { apiKey: token } : {}),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const rawText = await res.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (res.ok && data.success) {
        setApiTestStatus({
          success: true,
          message: data.message,
        });
        showToast("✅ เชื่อมต่อ Google AI Studio สำเร็จ!");
      } else {
        setApiTestStatus({
          success: false,
          message: data.error || "เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบ API Key",
        });
      }
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        setApiTestStatus({
          success: false,
          message: "การเชื่อมต่อหมดเวลา (เกิน 6 วินาที) กรุณาลองใหม่อีกครั้ง",
        });
      } else {
        setApiTestStatus({
          success: false,
          message: "เกิดข้อผิดพลาดในการเชื่อมต่อ: " + (err?.message || "Unknown error"),
        });
      }
    } finally {
      setIsTestingApi(false);
    }
  };

  // Export Video Handler (Client-side MediaRecorder Rendering)
  const handleCancelExport = () => {
    if (exportAbortRef.current) {
      exportAbortRef.current.abort();
      exportAbortRef.current = null;
    }
  };

  const handleExportVideo = async () => {
    if (isExporting) return;

    // Pause live preview players so export audio/video never compete with preview playback
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    if (videoBgRef.current && !videoBgRef.current.paused) {
      videoBgRef.current.pause();
    }
    setIsPlaying(false);

    let effectiveAudioUrl = audioUrl;

    if (!effectiveAudioUrl) {
      try {
        showToast("🎵 กำลังสร้างเสียงดนตรี Demo เพื่อเรนเดอร์...");
        effectiveAudioUrl = await createAcousticDemoAudio();
        if (effectiveAudioUrl.startsWith("blob:")) {
          if (audioBlobUrlRef.current?.startsWith("blob:")) {
            URL.revokeObjectURL(audioBlobUrlRef.current);
          }
          audioBlobUrlRef.current = effectiveAudioUrl;
        }
        setAudioUrl(effectiveAudioUrl);
        setAudioName("เสียงกีตาร์โฟล์กเพื่อชีวิต 78 BPM (Demo)");
        if (audioRef.current) {
          audioRef.current.src = effectiveAudioUrl;
        }
      } catch {
        showToast("⚠️ ไม่สามารถเตรียมไฟล์เสียงสำหรับเรนเดอร์ได้");
        return;
      }
    }

    const abortController = new AbortController();
    exportAbortRef.current = abortController;

    setIsExporting(true);
    setExportProgress(0);
    if (exportBlobUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(exportBlobUrlRef.current);
      exportBlobUrlRef.current = null;
    }
    setExportDoneUrl("");

    try {
      await exportMusicVideo({
        audioElement: audioRef.current || undefined,
        audioUrl: effectiveAudioUrl,
        backgroundImageUrl: backgroundMediaUrl,
        isVideoBg,
        songTitle: songTitle || "เพลงไม่มีชื่อ",
        credit: credit || "",
        subtitles: showSubtitles ? subtitles : [],
        showSubtitles,
        aspectRatio,
        subtitleStyle,
        fontSize,
        visualEffect,
        cameraMotion,
        subtitleTransition,
        enableKenBurns,
        subtitlePosY,
        showTopTitle,
        showHookHeadline,
        hookHeadline,
        showVinylDisc,
        showWaveform,
        trimStartTime: isTrimActive ? trimStart : 0,
        trimEndTime: isTrimActive && trimEnd > trimStart ? trimEnd : undefined,
        signal: abortController.signal,
        onProgress: (percent) => setExportProgress(percent),
        onComplete: (downloadUrl, ext) => {
          exportAbortRef.current = null;
          setIsExporting(false);
          if (downloadUrl.startsWith("blob:")) {
            exportBlobUrlRef.current = downloadUrl;
          }
          setExportDoneUrl(downloadUrl);
          const finalExt = ext || "mp4";
          setExportedFileExt(finalExt);
          setShowExportModal(true);
          showToast(`🎉 เรนเดอร์วิดีโอ MV สำเร็จ! (.${finalExt.toUpperCase()})`);
        },
        onError: (err) => {
          exportAbortRef.current = null;
          setIsExporting(false);
          if (err?.name === "AbortError" || abortController.signal.aborted) {
            showToast("⏹️ ยกเลิกการส่งออกวิดีโอแล้ว");
          } else {
            showToast("⚠️ บันทึกวิดีโอไม่สำเร็จ: " + (err?.message || "Unknown error"));
          }
        },
      });
    } catch (e: any) {
      exportAbortRef.current = null;
      setIsExporting(false);
      if (e?.name === "AbortError" || abortController.signal.aborted) {
        showToast("⏹️ ยกเลิกการส่งออกวิดีโอแล้ว");
      } else {
        showToast("⚠️ ไม่สามารถเรนเดอร์วิดีโอได้: " + (e?.message || "Unknown error"));
      }
    }
  };

  // Find active cue
  const activeCue = subtitles.find(
    (c) => currentTime >= c.startTime && currentTime <= c.endTime
  );

  // Style classes based on selection
  const getSubtitleColorClass = () => {
    switch (subtitleStyle) {
      case "neon-yellow":
        return "text-yellow-300 drop-shadow-[0_4px_18px_rgba(250,204,21,0.95)]";
      case "cyber-cyan":
        return "text-cyan-300 drop-shadow-[0_4px_18px_rgba(6,182,212,0.95)]";
      case "sunset-gold":
        return "text-amber-300 drop-shadow-[0_4px_18px_rgba(251,191,36,0.95)]";
      case "ruby-red":
        return "text-rose-400 drop-shadow-[0_4px_18px_rgba(244,63,94,0.95)]";
      case "pure-white":
      default:
        return "text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]";
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "mega":
        return "text-xl sm:text-2xl font-black";
      case "large":
        return "text-lg sm:text-xl font-black";
      case "normal":
      default:
        return "text-sm sm:text-base font-extrabold";
    }
  };

  const cleanLinesList = cleanLyricsToLines(lyrics);

  const handleDownloadSubtitles = (format: "srt" | "lrc" | "vtt") => {
    const effectiveCues =
      isTrimActive && trimEnd > trimStart
        ? subtitles
            .filter((c) => c.endTime >= trimStart && c.startTime <= trimEnd)
            .map((c, i) => ({
              ...c,
              id: i + 1,
              startTime: Math.max(0, Number((c.startTime - trimStart).toFixed(2))),
              endTime: Math.max(0.1, Number((c.endTime - trimStart).toFixed(2))),
            }))
        : subtitles;

    const text =
      format === "srt"
        ? exportCuesToSRT(effectiveCues)
        : format === "lrc"
          ? exportCuesToLRC(effectiveCues)
          : exportCuesToVTT(effectiveCues);

    const mimeType = format === "vtt" ? "text/vtt;charset=utf-8" : "text/plain;charset=utf-8";
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(songTitle || "subtitles").replace(/\s+/g, "_")}${isTrimActive ? "_trimmed" : ""}.${format}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    if (format === "srt") {
      showToast("บันทึกไฟล์ .SRT เรียบร้อยแล้ว");
    } else if (format === "lrc") {
      showToast("บันทึกไฟล์ .LRC (Suno / คาราโอเกะ) เรียบร้อยแล้ว");
    } else {
      showToast("บันทึกไฟล์ .VTT (WebVTT) เรียบร้อยแล้ว");
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm rounded-full shadow-2xl border border-white/60 animate-bounce flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden Audio Element - Always mounted for bulletproof playback & export */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-emerald-950/30 to-slate-900/40 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-600/20 rounded-xl border border-emerald-500/30 text-emerald-400">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>สตูดิโอตัดต่อ Music Video 9:16 & ซับเด้งคาราโอเกะ (Studio Pro)</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Precision Sync • Kinetic Motion
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                สร้างวิดีโอ MV ตามเพลงจริงของคุณ แก้ไขชื่อเพลง เครดิต และ<strong>ซิงก์ซับไตเติลให้ตรงกับเสียงร้องแบบ 100%</strong> พร้อมระบบเคาะจังหวะสด (Tap-to-Sync) และเรนเดอร์วิดีโอ Ken Burns Zoom ได้ฟรีทันที
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAiAutoDirect}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-lg shadow-rose-500/25 border border-white/20 transition-all flex items-center space-x-2 animate-pulse shrink-0"
              title="ให้ AI วิเคราะห์เพลงและเลือกเอฟเฟกต์บรรยากาศ + แคปชันดักสายตา + การเคลื่อนไหวกล้องให้อัตโนมัติ"
            >
              <Wand2 className="w-4 h-4 text-amber-200" />
              <span>🪄 AI Auto-Director (ตัดต่อให้อัตโนมัติ 1 คลิก)</span>
            </button>
            <button
              onClick={loadDemoSample}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Music className="w-4 h-4 text-cyan-400" />
              <span>🎵 เสียงกีตาร์ Demo (ลองเล่น)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metadata Inputs, Subtitle Sync Tools & Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Cinematic Visual Effects Card (Title & Artist Credit are already embedded in the cover artwork) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>1. เอฟเฟกต์บรรยากาศภาพยนตร์ (Cinematic Effects)</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                เข้ากับสไตล์ปก 9:16 ✨
              </span>
            </div>

            {/* Genre Presets Quick Switcher */}
            <div className="space-y-1.5 pb-2 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 block">
                  สไตล์ดนตรีและอารมณ์เพลง (1-Click Genre Match):
                </span>
                <span className="text-[10px] text-amber-400 font-semibold">คลิกเปลี่ยนมู้ดทันที</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "folk-life", icon: "🌾", name: "เพื่อชีวิต / สู้ชีวิต" },
                  { id: "melancholy", icon: "🌧️", name: "อกหัก / คิดถึง" },
                  { id: "love-acoustic", icon: "🌸", name: "เพลงรัก / อะคูสติก" },
                  { id: "rock-energy", icon: "🎸", name: "ร็อกมันส์ / พลังใจ" },
                  { id: "city-pop", icon: "🏙️", name: "ซิตี้ป๊อป / ค่ำคืน" },
                  { id: "family-warmth", icon: "🏠", name: "ครอบครัว / อบอุ่น" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyGenrePreset(preset.id)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-left flex items-center space-x-1.5 truncate ${
                      currentGenrePreset === preset.id
                        ? "bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ภาพปกของคุณมีชื่อเพลงและเครดิตศิลปินฝังในภาพเรียบร้อยแล้ว ✨ เลือกเอฟเฟกต์บรรยากาศเพื่อเพิ่มมิติความมีชีวิตชีวาให้กับวิดีโอ:
            </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: "bokeh-glow",
                    icon: "✨",
                    name: "ประกายโบเก้ & แสงลอยละมุน",
                    desc: "โบเก้แสงนุ่มนวลลอยละมุนตา เหมาะกับทุกภาพ ทุกแนวเพลง (แนะนำ)",
                  },
                  {
                    id: "golden-hour",
                    icon: "☀️",
                    name: "แสงอาทิตย์สีทอง & ละอองประกาย",
                    desc: "แสงแดดอุ่นส่องสว่าง เหมาะกับเพลงเพื่อชีวิต ครอบครัว และเพลงรัก",
                  },
                  {
                    id: "rain-drops",
                    icon: "🌧️",
                    name: "สายฝนโปรยปราย & หมอกละออง",
                    desc: "สายฝนบางเบาและไอหมอก เหมาะกับเพลงอกหัก ซึ้ง เหงา คืนฝนพรำ",
                  },
                  {
                    id: "stage-spotlight",
                    icon: "🎸",
                    name: "แสงสปอตไลต์เวที & แสงไฟคอนเสิร์ต",
                    desc: "ลำแสงเวทีกวาดผ่านและควันสเตจ เหมาะกับร็อก ป๊อป และเพลงแสดงสด",
                  },
                  {
                    id: "cyber-neon",
                    icon: "⚡",
                    name: "แสงนีออนสะท้อน & ละอองไซเบอร์",
                    desc: "แสงนีออนสีฟ้า-ชมพูสะท้อน เหมาะกับเพลงอินดี้ ฮิปฮอป ซิตี้ป๊อป ค่ำคืน",
                  },
                  {
                    id: "vintage-film",
                    icon: "🎞️",
                    name: "เกรนฟิล์มคลาสสิก & แสงแฟลร์วินเทจ",
                    desc: "โทนฟิล์ม 35mm อบอุ่นและเกรนภาพยนตร์ เหมาะกับเพลงคลาสสิก เรโทร ยุค 90",
                  },
                  {
                    id: "snow-drift",
                    icon: "❄️",
                    name: "ละอองหิมะ / ผงแสงแฟนตาซี",
                    desc: "ละอองแสงสีขาวลอยละล่องแผ่วเบา เหมาะกับเพลงรักหวาน อะคูสติก แฟนตาซี",
                  },
                  {
                    id: "none",
                    icon: "🚫",
                    name: "ไม่ใส่เอฟเฟกต์",
                    desc: "แสดงเฉพาะภาพต้นฉบับคมชัดเต็มผืน 100%",
                  },
                ].map((eff) => (
                  <button
                    key={eff.id}
                    type="button"
                    onClick={() => {
                      setVisualEffect(eff.id as any);
                      showToast(`✨ เปิดใช้งานเอฟเฟกต์: ${eff.name}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      visualEffect === eff.id
                        ? "bg-amber-950/40 border-amber-500/70 text-amber-200 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/50"
                        : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs text-white">
                      <span>{eff.icon}</span>
                      <span className={visualEffect === eff.id ? "text-amber-300" : ""}>{eff.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">{eff.desc}</p>
                  </button>
                ))}
              </div>

            {/* Spinning Vinyl Record Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-base">💿</span>
                <div>
                  <p className="text-xs font-bold text-white">แผ่นเสียงหมุนวนลูป (Spinning Vinyl Disc)</p>
                  <p className="text-[10px] text-slate-400">สร้างความเคลื่อนไหวคลาสสิกให้ภาพนิ่ง 1 ภาพบน TikTok & YouTube</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !showVinylDisc;
                  setShowVinylDisc(next);
                  showToast(next ? "💿 เปิดแสดงแผ่นเสียงหมุนวนลูป" : "ปิดแผ่นเสียงหมุน");
                }}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  showVinylDisc ? "bg-rose-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showVinylDisc ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Viral Hook Headline Card (TikTok & YouTube Shorts Retention Booster) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  ป้ายหัวข้อดักสายตาคนฟัง (Hook Headline Banner)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !showHookHeadline;
                  setShowHookHeadline(next);
                  showToast(next ? "📌 เปิดป้ายดักสายตาท่อนฮุก" : "ซ่อนป้ายดักสายตา");
                }}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  showHookHeadline ? "bg-rose-500" : "bg-slate-700"
                }`}
                title="เปิด/ปิด ป้ายดักสายตาคนฟังบนหัวคลิป"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showHookHeadline ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              เคล็ดลับดึงดูดคนบน TikTok & YouTube Shorts: ประโยคดักสายตาท่อนบนช่วยให้คนหยุดดูและฟังเพลงต่อจนจบขึ้น 300%!
            </p>

            {showHookHeadline && (
              <div className="space-y-2.5 animate-fadeIn">
                <input
                  type="text"
                  value={hookHeadline}
                  onChange={(e) => setHookHeadline(e.target.value)}
                  placeholder="พิมพ์ข้อความดักสายตาคนฟัง เช่น ใครที่กำลังเหนื่อย... ฟังเพลงนี้เถอะนะ 💔"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                />

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    เลือกประโยคไวรัลยอดนิยม (1-Click Fill):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      "ใครที่กำลังเหนื่อย... ฟังเพลงนี้เถอะนะ 💔",
                      "บทเพลงแห่งความคิดถึง... มอบให้คนไกลบ้าน 🌾",
                      "หยุดฟัง 10 วินาที... แล้วคุณจะตกหลุมรักเพลงนี้ 🌸",
                      "ท่อนฮุกนี้ ฟังแล้วน้ำตาซึม 🥺",
                      "เปิดฟังตอนฝนตก... ดิ่งและกินใจมาก 🌧️",
                      "เพลงเติมพลังใจ... ลุกขึ้นมาสู้สุดทางฝัน 🎸",
                    ].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setHookHeadline(h);
                          showToast("📌 อัปเดตแคปชันดักสายตาเรียบร้อย!");
                        }}
                        className={`p-1.5 rounded-lg text-[10px] font-semibold border text-left truncate transition-all ${
                          hookHeadline === h
                            ? "bg-rose-950/50 border-rose-500 text-rose-200 font-bold shadow"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Media Inputs & Subtitle Precision Sync Engine */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Music className="w-4 h-4 text-emerald-400" />
                <span>2. ไฟล์เสียง & ระบบซิงก์ซับไตเติล</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold">แก้ปัญหาซับไม่ตรง 100%</span>
            </div>

            {/* Upload Audio File */}
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1">
                อัปโหลดไฟล์เพลงของคุณ (.mp3 / .wav)
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-700 hover:border-emerald-500 rounded-xl cursor-pointer transition-all">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <Music className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate font-semibold">
                    {audioName || "คลิกเลือกไฟล์เพลง MP3 จากเครื่อง..."}
                  </span>
                </div>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Subtitle Mode Selector (With Subtitles vs Clean No-Subtitles) */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>รูปแบบวิดีโอ MV (Subtitle Mode):</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  showSubtitles
                    ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}>
                  {showSubtitles ? "🎤 โหมดมีซับเด้ง" : "🎬 โหมด Clean (ไม่ใส่ซับ)"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubtitles(true);
                    showToast("🎤 สลับเป็นโหมดใส่ซับเด้งคาราโอเกะ");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    showSubtitles
                      ? "bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-200 ring-1 ring-fuchsia-500 shadow-md"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold flex items-center space-x-1">
                    <span>🎤</span>
                    <span>ใส่ซับเด้งคาราโอเกะ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    ซับเด้งตามจังหวะเสียงร้อง เหมาะสำหรับ TikTok / Reels
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSubtitles(false);
                    showToast("🎬 สลับเป็นโหมด Clean (ไม่ใส่ซับ)");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    !showSubtitles
                      ? "bg-emerald-950/50 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400 shadow-md shadow-emerald-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold flex items-center space-x-1 text-emerald-300">
                    <span>🎬</span>
                    <span>ไม่ใส่ซับ (Clean MV)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    ภาพปกเคลื่อนไหว + เพลงเพียวๆ ข้ามการซิงก์ซับได้เลย
                  </p>
                </button>
              </div>

              {!showSubtitles && (
                <div className="p-4 bg-gradient-to-br from-emerald-950/80 via-slate-950 to-teal-950/80 border border-emerald-500/40 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/40 text-emerald-300 shrink-0">
                      <Film className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        🎬 โหมด Clean MV (ไม่ใส่ซับ) พร้อมทำงาน 100%
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        สร้าง MV จากภาพปกเคลื่อนไหว + แสงเอฟเฟกต์ โดยไม่มีตัวหนังสือซับไตเติลมาบังหน้าจอ ข้ามขั้นตอนซิงก์ซับได้เลย
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{isPlaying ? "หยุดฟัง" : "ทดลองเล่น"}</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        disabled={isExporting}
                        onClick={handleExportVideo}
                        className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-75"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                            <span>เรนเดอร์ ({exportProgress}%)...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-slate-950" />
                            <span>ส่งออก Clean MV</span>
                          </>
                        )}
                      </button>
                      {isExporting && (
                        <button
                          type="button"
                          onClick={handleCancelExport}
                          aria-label="ยกเลิกการส่งออก"
                          title="ยกเลิกการส่งออกวิดีโอ"
                          className="py-2.5 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center justify-center transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">ต้องการดู/ปรับเวลาซับหรือไม่?</span>
                    <button
                      type="button"
                      onClick={() => setShowSubtitleSectionInCleanMode(!showSubtitleSectionInCleanMode)}
                      className="text-cyan-400 hover:underline font-bold flex items-center space-x-1"
                    >
                      <span>{showSubtitleSectionInCleanMode ? "ซ่อนเครื่องมือซับ" : "⚙️ แสดงเครื่องมือซับ"}</span>
                      {showSubtitleSectionInCleanMode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subtitle Precision Sync Section (Shown when showSubtitles is true OR expanded in Clean mode) */}
            {(showSubtitles || showSubtitleSectionInCleanMode) && (
              <div className="space-y-4 animate-fadeIn">
                {/* 1-Click Auto Generate from Lyrics Banner (When user has no SRT/LRC file) */}
                <div className="p-4 bg-gradient-to-r from-amber-950/60 via-purple-950/50 to-slate-900 border-2 border-amber-500/50 rounded-2xl space-y-2.5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-2.5">
                      <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-400/40 text-amber-300 shrink-0">
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-white">
                            กรณีไม่มีไฟล์ซับ .SRT หรือ .LRC:
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-extrabold border border-amber-500/40">
                            แนะนำที่สุด ⚡
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          แปลงเนื้อเพลงที่แต่งไว้ในขั้นตอนที่ 1 เป็นซับไตเติลคาราโอเกะให้อัตโนมัติทันที ไม่ต้องมีไฟล์ซับก็ทำคลิปได้สบาย
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoGenerateFromLyrics}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-200" />
                      <span>⚡ สร้างซับจากเนื้อเพลง</span>
                    </button>
                  </div>
                </div>

                {/* AI Precision Vocal Sync Card (Google AI Studio) - MAIN HIGHLIGHT */}
                <div className="p-5 bg-gradient-to-r from-cyan-950/90 via-indigo-950/80 to-slate-950 border-2 border-cyan-500/60 rounded-2xl space-y-4 shadow-2xl">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-500/40 text-cyan-400 shrink-0">
                  <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <span>สั่ง AI วิเคราะห์เสียง & ซิงก์ซับตรงเสียงร้อง 100%</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 font-black border border-cyan-400/40">
                      Google AI Studio (ใช้เฉพาะขั้นตอนนี้)
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Gemini 3.8 Flash จะฟังเพลงจริง ตรวจจับช่วงดนตรี Intro และจัดจังหวะคำร้องให้ตรงกับเสียงร้องแบบอัตโนมัติ
                  </p>
                </div>
              </div>

              {/* API Key Connection & Management Bar */}
              <div className="space-y-2">
                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${apiKeyVal || hasServerKey ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    <span className="text-xs font-bold text-white shrink-0">AI Studio Key:</span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold truncate">
                      {apiKeyVal
                        ? `••••••••••••${apiKeyVal.slice(-4)}`
                        : hasServerKey
                          ? "พร้อมใช้งานจากเซิร์ฟเวอร์"
                          : "ยังไม่ได้ใส่คีย์ฟรี"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={isTestingApi || (!apiKeyVal && !hasServerKey)}
                      onClick={handleTestApiConnection}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition-all flex items-center space-x-1 disabled:opacity-40"
                    >
                      {isTestingApi ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>กำลังทดสอบ...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3 h-3" />
                          <span>⚡ ทดสอบ API</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTempKeyInput(apiKeyVal);
                        setShowKeyEditor(!showKeyEditor);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-1"
                    >
                      <Key className="w-3 h-3 text-cyan-400" />
                      <span>{showKeyEditor ? "ปิดช่องกรอก" : apiKeyVal ? "เปลี่ยน Key" : "ใส่ Key ฟรี"}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Key Editor */}
                {((!apiKeyVal && !hasServerKey) || showKeyEditor) && (
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-500/40 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <Key className="w-3.5 h-3.5 text-cyan-400" />
                        <span>กรอก Google AI Studio Key (ฟรี ไม่ต้องผูกบัตรเครดิต)</span>
                      </label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1 font-semibold"
                      >
                        <span>กดรับคีย์ฟรีตรงนี้</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showTempKeyPassword ? "text" : "password"}
                          value={tempKeyInput}
                          onChange={(e) => setTempKeyInput(e.target.value)}
                          placeholder="วาง API Key เช่น AIzaSy..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-16 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                          {tempKeyInput && (
                            <button
                              type="button"
                              onClick={() => {
                                setTempKeyInput("");
                                setApiKeyVal("");
                                safeRemoveStorageItem("gemini_api_key");
                                onUpdateApiKey?.("");
                                showToast("🗑️ ล้าง API Key เรียบร้อยแล้ว");
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400"
                              title="ล้างคีย์"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowTempKeyPassword(!showTempKeyPassword)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title={showTempKeyPassword ? "ซ่อนคีย์" : "ดูคีย์"}
                          >
                            {showTempKeyPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = tempKeyInput.trim();
                            if (!trimmed) {
                              setApiTestStatus({
                                success: false,
                                message: "กรุณากรอก API Key ก่อนบันทึกครับ",
                              });
                              showToast("⚠️ กรุณากรอก API Key ก่อนบันทึกครับ");
                              return;
                            }
                            setApiKeyVal(trimmed);
                            safeSetStorageItem("gemini_api_key", trimmed);
                            onUpdateApiKey?.(trimmed);
                            setApiTestStatus(null);
                            setShowKeyEditor(false);
                            showToast("✅ บันทึก API Key สำหรับขั้นตอนที่ 3 เรียบร้อยแล้ว!");
                          }}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all whitespace-nowrap"
                        >
                          บันทึก Key
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      💡 คีย์จะถูกใช้เฉพาะในขั้นตอนนี้เพื่อให้ AI ฟังเพลงและคำนวณเวลาซับคำร้องเท่านั้น ไม่ถูกส่งไปที่อื่น และบันทึกในเครื่องคุณอย่างปลอดภัย
                    </p>
                  </div>
                )}
              </div>

              {/* API Test Status Banner if present */}
              {apiTestStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 animate-fadeIn ${
                    apiTestStatus.success
                      ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                      : "bg-rose-950/70 border-rose-500/50 text-rose-200"
                  }`}
                >
                  {apiTestStatus.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-semibold">{apiTestStatus.message}</span>
                </div>
              )}

              {/* AI Insight Box if present */}
              {aiInsight && (
                <div className="p-3.5 bg-black/85 rounded-xl border border-cyan-500/50 text-xs text-cyan-200 leading-relaxed flex items-start space-x-3 shadow-inner">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-spin-slow" />
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase font-bold text-cyan-400 tracking-wider block">
                      ✨ ผลการวิเคราะห์จาก Google Gemini:
                    </span>
                    <p className="text-xs text-slate-100 font-medium">{aiInsight}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={isAiSyncing}
                onClick={handleAiSyncSubtitles}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2.5 shadow-xl ${
                  isAiSyncing
                    ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                    : "bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/30 hover:scale-[1.01] active:scale-95"
                }`}
              >
                {isAiSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
                    <span>Gemini กำลังฟังไฟล์เสียงและคำนวณเวลาซับ...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 text-cyan-200" />
                    <span>✨ สั่ง AI วิเคราะห์เสียง & ซิงก์ซับให้ตรงเป๊ะทันที</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-2 pt-0.5">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">หรือ</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              <button
                type="button"
                onClick={handleAutoCalcSubtitles}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-slate-800/90 text-cyan-300 border border-cyan-500/40 transition-all flex items-center justify-center space-x-2 hover:scale-[1.01] active:scale-95 shadow-md shadow-cyan-950/40"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>⚡ คำนวณเวลาซับอัตโนมัติตามความยาวเพลง (ไม่ต้องใช้ API Key • ทำงานทันที)</span>
              </button>

              <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                <span className="flex items-center space-x-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{subtitleFileName || `${subtitles.length} ท่อนซับพร้อมเล่น`}</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                  {subtitles.length} ท่อน
                </span>
              </div>
            </div>

            {/* Optional Manual LRC / SRT Import */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">หรือมีไฟล์ซับจาก Suno/Udio อยู่แล้ว?</span>
              <label className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer font-bold flex items-center space-x-1">
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้าไฟล์ .LRC / .SRT</span>
                <input
                  type="file"
                  accept=".lrc,.srt,.vtt,text/plain"
                  onChange={handleSubtitleUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Tap-to-Sync Master Bar */}
            <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-slate-950 to-cyan-950/50 border border-emerald-500/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">เครื่องมือเคาะจังหวะซับสด (Live Tap-to-Sync)</span>
                </div>
                {!isTappingMode ? (
                  <button
                    type="button"
                    onClick={startTapSyncMode}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all hover:scale-105"
                  >
                    🎯 เริ่มเคาะจังหวะสด
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishTapSyncMode}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    เสร็จสิ้น
                  </button>
                )}
              </div>

              {/* While in Tapping Mode */}
              {isTappingMode ? (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                    <span>ท่อนที่ {tapIndex + 1} จาก {cleanLinesList.length}</span>
                    <span className="text-cyan-400">{formatTime(currentTime)}</span>
                  </div>

                  {/* Active Line being stamped */}
                  <div className="p-3 bg-black/80 rounded-xl border border-emerald-500/60 text-center space-y-1">
                    <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      ท่อนที่กำลังรอเคาะ:
                    </p>
                    <p className="text-sm font-black text-yellow-300 leading-snug">
                      "{cleanLinesList[tapIndex] || "เสร็จสิ้นทุกท่อนแล้ว"}"
                    </p>
                  </div>

                  {/* Next line preview */}
                  {cleanLinesList[tapIndex + 1] && (
                    <p className="text-[11px] text-slate-400 text-center truncate">
                      ท่อนถัดไป: {cleanLinesList[tapIndex + 1]}
                    </p>
                  )}

                  {/* Big Tap Button */}
                  <button
                    type="button"
                    onClick={handleTapCurrentLine}
                    className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <span>🎯 เคาะท่อนนี้ทันที (กดปุ่มนี้ หรือ Spacebar)</span>
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  ฟังเพลงแล้วกดเคาะตามจังหวะที่นักร้องเริ่มเปล่งเสียงแต่ละท่อน เพื่อให้คำร้องตรงกับเสียงร้องแบบ 100% เป๊ะที่สุด
                </p>
              )}
            </div>

            {/* Quick Shift Timing Buttons (Adjust Offset) */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>เลื่อนเวลาซับทั้งหมด (Quick Shift)</span>
                </span>
                <span className="text-[10px] text-slate-400">ถ้าซับขึ้นช้า/เร็วไป</span>
              </div>
              <div className="grid grid-cols-6 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleShiftAllCues(-2.0)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 font-mono text-[10px]"
                >
                  -2.0s
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftAllCues(-1.0)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 font-mono text-[10px]"
                >
                  -1.0s
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftAllCues(-0.5)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 font-mono text-[10px]"
                >
                  -0.5s
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftAllCues(0.5)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 font-mono text-[10px]"
                >
                  +0.5s
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftAllCues(1.0)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 font-mono text-[10px]"
                >
                  +1.0s
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftAllCues(2.0)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 font-mono text-[10px]"
                >
                  +2.0s
                </button>
              </div>
              <button
                type="button"
                onClick={handleAlignIntroToCurrentTime}
                className="w-full py-2 px-3 bg-gradient-to-r from-cyan-950 to-slate-900 hover:from-cyan-900 hover:to-slate-800 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-500/40 flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>⏱️ ซิงก์ท่อนแรกตรงกับเวลาที่กำลังเล่น ({formatTime(currentTime)})</span>
              </button>
            </div>

            {/* Lyric Editor & Subtitle Table Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowLyricEditor(!showLyricEditor)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{showLyricEditor ? "ซ่อนกล่องเนื้อเพลง" : "แก้ไขข้อความเนื้อเพลง"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimingTable(!showTimingTable)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>{showTimingTable ? "ซ่อนตารางไทม์ไลน์" : "ตารางไทม์ไลน์ซับละเอียด"}</span>
                </button>
              </div>

              {showLyricEditor && (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={6}
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="วางเนื้อเพลงที่นี่..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => handleAutoGenerateCues(lyrics, 2.0, 4.0)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40"
                  >
                    ⚡ คำนวณซับจากเนื้อเพลงนี้ใหม่
                  </button>
                </div>
              )}

              {/* Timing Table Drawer */}
              {showTimingTable && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-72 overflow-y-auto space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <p className="text-[11px] font-bold text-slate-300">
                      ตารางไทม์ไลน์ซับ ({subtitles.length} ท่อน)
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = Number(currentTime.toFixed(2));
                        const nextId =
                          subtitles.reduce((maxId, item) => Math.max(maxId, item.id || 0), 0) + 1;
                        const newCue: SubtitleCue = {
                          id: nextId,
                          startTime: cur,
                          endTime: Number((cur + 4.0).toFixed(2)),
                          text: "ข้อความท่อนใหม่...",
                        };
                        setSubtitles((prev) => [...prev, newCue]);
                        showToast(`เพิ่มท่อนใหม่ที่ ${formatTime(cur)} แล้ว`);
                      }}
                      className="px-2 py-0.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>เพิ่มท่อนที่เวลานี้</span>
                    </button>
                  </div>
                  {subtitles.map((cue, idx) => (
                    <div
                      key={cue.id || idx}
                      className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-cyan-400 text-[10px] font-bold shrink-0">
                          {formatTime(cue.startTime)} - {formatTime(cue.endTime)}
                        </span>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.currentTime = cue.startTime;
                                audioRef.current.play().catch(() => {});
                                if (videoBgRef.current) videoBgRef.current.play().catch(() => {});
                                setIsPlaying(true);
                              }
                            }}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-semibold"
                            title="ฟังเฉพาะท่อนนี้"
                          >
                            ▶ ฟัง
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Number(currentTime.toFixed(2));
                              setSubtitles((prev) =>
                                prev.map((c, i) =>
                                  i === idx
                                    ? { ...c, startTime: cur, endTime: Math.max(cur + 1.2, c.endTime) }
                                    : c
                                )
                              );
                              showToast(`ปักหมุดท่อนนี้ที่ ${formatTime(cur)} แล้ว`);
                            }}
                            className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded text-[10px] font-bold"
                            title="ปักหมุดเวลาเริ่มให้ตรงกับจุดที่เล่นอยู่ตอนนี้"
                          >
                            📌 เวลานี้
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubtitles((prev) =>
                                prev.map((c, i) =>
                                  i === idx
                                    ? { ...c, startTime: Number(Math.max(0, c.startTime - 0.3).toFixed(2)) }
                                    : c
                                )
                              );
                            }}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                          >
                            -0.3s
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubtitles((prev) =>
                                prev.map((c, i) => {
                                  if (i !== idx) return c;
                                  const nextStart = Number((c.startTime + 0.3).toFixed(2));
                                  return {
                                    ...c,
                                    startTime: nextStart,
                                    endTime: Number(Math.max(c.endTime, nextStart + 0.5).toFixed(2)),
                                  };
                                })
                              );
                            }}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                          >
                            +0.3s
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubtitles((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="ลบท่อนนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={cue.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubtitles((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, text: val } : c))
                          );
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Subtitle File Status & Upload */}
              <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[200px]">
                    {subtitleFileName || `${subtitles.length} ท่อนซับไตเติล`}
                  </span>
                </span>
                <label className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-semibold">
                  <span>นำเข้าไฟล์ .SRT/.LRC</span>
                  <input
                    type="file"
                    accept=".srt,.lrc,.vtt,text/plain"
                    onChange={handleSubtitleUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Background Image / Video Upload & All-Genre Cover Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 block">
                  ภาพหรือวิดีโอพื้นหลัง MV
                </label>
                <span className="text-[10px] text-cyan-400 font-medium">สลับภาพปกตามแนวเพลง</span>
              </div>

              {/* Sample Covers Quick Switcher for Testing All Styles */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  {
                    name: "เพื่อชีวิต (พ่อ)",
                    icon: "🌾",
                    url: "/covers/phaw_carpenter_cover.jpg",
                  },
                  {
                    name: "เพลงรัก (รักแรกพบ)",
                    icon: "🌸",
                    url: "/covers/love_acoustic_cover.jpg",
                  },
                  {
                    name: "อกหัก (คืนฝนพรำ)",
                    icon: "🌧️",
                    url: "/covers/rain_city_melancholy_cover.jpg",
                  },
                  {
                    name: "ร็อก (สุดทางฝัน)",
                    icon: "🎸",
                    url: "/covers/neon_rock_stage_cover.jpg",
                  },
                ].map((cov) => (
                  <button
                    key={cov.url}
                    type="button"
                    onClick={() => {
                      setBackgroundMediaUrl(cov.url);
                      setIsVideoBg(false);
                      showToast(`🖼️ สลับใช้ภาพปก: ${cov.name}`);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-semibold border text-center transition-all truncate flex flex-col items-center space-y-0.5 ${
                      backgroundMediaUrl === cov.url
                        ? "bg-purple-600 text-white border-purple-400 font-bold shadow-md shadow-purple-600/30 ring-1 ring-purple-300"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <span className="text-sm">{cov.icon}</span>
                    <span className="truncate w-full text-center text-[9px]">{cov.name}</span>
                  </button>
                ))}
              </div>

              <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-700 hover:border-emerald-500 rounded-xl cursor-pointer transition-all">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <Video className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate">
                    {backgroundMediaUrl
                      ? isVideoBg
                        ? "วิดีโอพื้นหลัง (Active)"
                        : "ภาพปกพื้นหลัง (Active)"
                      : "คลิกเลือกภาพจากเครื่อง..."}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*,.png,.jpg,.jpeg,.webp,.mp4,.mov,.webm"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 3. Visual Styling Customizer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-fuchsia-400" />
              <span>3. ปรับแต่งสไตล์วิดีโอ (Visual Style)</span>
            </h3>

            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                สัดส่วนวิดีโอ (Aspect Ratio)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio("9:16")}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    aspectRatio === "9:16"
                      ? "bg-fuchsia-600 text-white border-fuchsia-500 shadow-md shadow-fuchsia-600/30"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>แนวตั้ง 9:16 (TikTok/Reels)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio("16:9")}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    aspectRatio === "16:9"
                      ? "bg-fuchsia-600 text-white border-fuchsia-500 shadow-md shadow-fuchsia-600/30"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>แนวนอน 16:9 (YouTube)</span>
                </button>
              </div>
            </div>

            {/* Genre & Mood Master Presets */}
            <div className="p-3.5 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 rounded-2xl border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>พรีเซ็ตอารมณ์เพลงสำเร็จรูป (All-Genre Mood Presets)</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  คลิกเดียวปรับครบ ✨
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                คลิกเลือกตามแนวเพลงของคุณ ระบบจะปรับการเคลื่อนไหวกล้อง เอฟเฟกต์บรรยากาศ และสีซับให้เข้ากันทันที:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { id: "folk-life", icon: "🌾", name: "เพื่อชีวิต / สู้ชีวิต" },
                  { id: "melancholy", icon: "💔", name: "อกหัก / คิดถึง" },
                  { id: "love-acoustic", icon: "🌸", name: "เพลงรัก / อะคูสติก" },
                  { id: "rock-energy", icon: "🎸", name: "ร็อกมันส์ / บีตหนัก" },
                  { id: "city-pop", icon: "🏙️", name: "ซิตี้ป๊อป / ค่ำคืนในเมือง" },
                  { id: "family-warmth", icon: "🏠", name: "ครอบครัว / อบอุ่น" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyGenrePreset(p.id)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center space-x-1.5 ${
                      currentGenrePreset === p.id
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-cyan-400"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Motion & Zoom In-Out Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  <span>การเคลื่อนไหวของกล้อง (Camera Motion 60 FPS)</span>
                </label>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-400">เปิดโมชันกล้อง</span>
                  <button
                    type="button"
                    onClick={() => setEnableKenBurns(!enableKenBurns)}
                    className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                      enableKenBurns ? "bg-cyan-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        enableKenBurns ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {enableKenBurns && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: "organic-breath",
                      icon: "🫁",
                      name: "หายใจธรรมชาติ 3.3s",
                      desc: "ขยับหายใจตามธรรมชาติ 3.3 วินาทีตามมาตรฐาน Google Flow v8.0 เนียนสนิท ไร้รอยต่อ ไม่เหวี่ยง (แนะนำ)",
                    },
                    {
                      id: "slow-zoom-in",
                      icon: "🔍",
                      name: "ซูมเข้าช้าๆ เนียนตา",
                      desc: "ค่อยๆ ดันกล้องเข้าอย่างนุ่มนวลตลอดเพลง ดึงดูดอารมณ์สายตา",
                    },
                    {
                      id: "slow-pan",
                      icon: "↔️",
                      name: "สไลด์มุมกล้องเบาๆ",
                      desc: "เลื่อนกล้องแพนซ้าย-ขวาอย่างนุ่มนวลสไตล์สไลเดอร์ภาพยนตร์",
                    },
                    {
                      id: "beat-pulse",
                      icon: "🥁",
                      name: "กระเพื่อมตามจังหวะบีต",
                      desc: "กระเพื่อมตามจังหวะบีตเพลงอย่างนุ่มนวล เหมาะกับเพลงร็อกและป๊อป",
                    },
                    {
                      id: "static",
                      icon: "🔒",
                      name: "ล็อกมุมกล้องนิ่งสนิท",
                      desc: "มุมกล้องนิ่งสนิทแบบ Tripod เน้นภาพปกต้นฉบับคมชัดเต็มตา",
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setCameraMotion(m.id as any);
                        showToast(`🎬 สลับโหมดกล้อง: ${m.name}`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        cameraMotion === m.id ||
                        (cameraMotion === "zoom-pulse" && m.id === "organic-breath") ||
                        (cameraMotion === "pan-drift" && m.id === "slow-pan") ||
                        (cameraMotion === "dramatic-pulse" && m.id === "beat-pulse")
                          ? "bg-cyan-950/40 border-cyan-500/70 text-cyan-200 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                          : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-bold text-xs text-white">
                        <span>{m.icon}</span>
                        <span className={cameraMotion === m.id ? "text-cyan-300" : ""}>{m.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">{m.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitles Visibility Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className={`w-4 h-4 ${showSubtitles ? "text-fuchsia-400" : "text-slate-500"}`} />
                <div>
                  <p className="text-xs font-bold text-white">แสดงซับไตเติลบนวิดีโอ (Show Subtitles)</p>
                  <p className="text-[10px] text-slate-400">
                    {showSubtitles ? "เปิดอยู่: แสดงซับเด้งคาราโอเกะตามเสียงร้อง" : "ปิดอยู่: วิดีโอแบบ Clean ไม่มีตัวหนังสือซับ"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !showSubtitles;
                  setShowSubtitles(next);
                  showToast(next ? "💬 เปิดแสดงซับเด้งคาราโอเกะ" : "🎬 สลับเป็นโหมด Clean (ไม่ใส่ซับ)");
                }}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  showSubtitles ? "bg-fuchsia-600" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showSubtitles ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Subtitle Appearance Settings (Shown when showSubtitles is true) */}
            {showSubtitles ? (
              <div className="space-y-4 pt-1">
                {/* Subtitle Entrance Transition */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 block">
                    ลูกเล่นซับไตเติลเลื่อนเข้า (Subtitle Entrance Transition)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "slide-up", icon: "⬆️", name: "สไลด์ขึ้นนุ่มนวล" },
                      { id: "bounce-pop", icon: "💥", name: "เด้งซูมเข้าไวรัล" },
                      { id: "glow-fade", icon: "✨", name: "เรืองแสงจางเข้า" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSubtitleTransition(st.id as any);
                          showToast(`✨ สลับลูกเล่นซับ: ${st.name}`);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center space-y-1 ${
                          subtitleTransition === st.id
                            ? "bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-200 shadow-sm ring-1 ring-fuchsia-400/50"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="text-sm">{st.icon}</span>
                        <span className="text-[11px]">{st.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtitle Vertical Position Y */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-200">
                      ตำแหน่งความสูงซับไตเติล (TikTok Safe Zone Y)
                    </label>
                    <span className="text-[11px] text-cyan-400 font-mono font-bold">
                      {Math.round(subtitlePosY * 100)}% {Math.abs(subtitlePosY - 0.64) < 0.03 ? "(ปลอดภัย 100%)" : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.40"
                    max="0.85"
                    step="0.02"
                    value={subtitlePosY}
                    onChange={(e) => setSubtitlePosY(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {[
                      { pos: 0.64, label: "🎯 กลางล่าง TikTok 64% (แนะนำ ไม่ชนคำโพสต์)" },
                      { pos: 0.52, label: "⬆️ กลางคลิป (52%)" },
                      { pos: 0.72, label: "⬇️ ล่าง (72%)" },
                    ].map((preset) => (
                      <button
                        key={preset.pos}
                        type="button"
                        onClick={() => setSubtitlePosY(preset.pos)}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                          Math.abs(subtitlePosY - preset.pos) < 0.03
                            ? "bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-md shadow-cyan-500/20"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-emerald-400/90 mt-1.5 flex items-center gap-1">
                    <span>✨</span>
                    <span>ระดับ 64% อยู่เหนือคำโพสต์ TikTok (78%+) และไม่บังหน้าตัวละครในภาพปก</span>
                  </p>
                </div>

                {/* Subtitle Color Theme */}
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    โทนสีตัวหนังสือซับเด้ง
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "neon-yellow", label: "🟡 TikTok Yellow", bg: "border-yellow-400/40 text-yellow-300" },
                      { id: "cyber-cyan", label: "🔵 Cyber Cyan", bg: "border-cyan-400/40 text-cyan-300" },
                      { id: "sunset-gold", label: "🟠 Sunset Gold", bg: "border-amber-400/40 text-amber-300" },
                      { id: "ruby-red", label: "🔴 Ruby Red", bg: "border-rose-400/40 text-rose-300" },
                      { id: "pure-white", label: "⚪ Pure White", bg: "border-slate-400/40 text-white" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSubtitleStyle(item.id as any)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                          subtitleStyle === item.id
                            ? `bg-slate-800 ${item.bg} ring-2 ring-fuchsia-500`
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    ขนาดตัวหนังสือ
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "normal", label: "ปานกลาง" },
                      { id: "large", label: "ใหญ่ (แนะนำ)" },
                      { id: "mega", label: "ใหญ่พิเศษ" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFontSize(item.id as any)}
                        className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          fontSize === item.id
                            ? "bg-slate-800 border-cyan-500 text-cyan-300 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center space-y-1.5">
                <p className="text-xs text-slate-300 font-semibold">
                  🎬 กำลังอยู่ในโหมด Clean (ไม่ใส่ซับ)
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  วิดีโอจะเรนเดอร์ภาพปกเคลื่อนไหว แสงบรรยากาศ และเสียงเพลงแบบไม่มีตัวหนังสือซับไตเติล
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubtitles(true);
                    showToast("🎤 เปิดโหมดแสดงซับเด้ง");
                  }}
                  className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold underline"
                >
                  คลิกที่นี่หากต้องการเปิดใช้ซับเด้ง
                </button>
              </div>
            )}

            {/* Waveform Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-white">คลื่นเสียงนีออน (Audio Waveform)</p>
                  <p className="text-[10px] text-slate-400">เต้นตามจังหวะเบสเพลงบนวิดีโอ</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="เปิดหรือปิดคลื่นเสียงนีออน"
                onClick={() => setShowWaveform(!showWaveform)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  showWaveform ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showWaveform ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Top Song Title Overlay Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-xs font-bold text-white">แสดงชื่อเพลงด้านบนภาพ (Top Title)</p>
                  <p className="text-[10px] text-slate-400">
                    {showTopTitle ? "เปิดอยู่: แสดงป้ายชื่อเพลงด้านบนของวิดีโอ" : "ปิดอยู่: เน้นพื้นที่ภาพปกและป้าย Hook"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="เปิดหรือปิดชื่อเพลงด้านบน"
                onClick={() => {
                  const next = !showTopTitle;
                  setShowTopTitle(next);
                  showToast(next ? "🎵 เปิดแสดงชื่อเพลงด้านบนวิดีโอ" : "ซ่อนชื่อเพลงด้านบนแล้ว");
                }}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  showTopTitle ? "bg-cyan-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showTopTitle ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Video Player & Exporter */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center">
            {/* Top Toolbar: Aspect Ratio & TikTok Safe Zone toggle */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-300">ตัวอย่างวิดีโอ MV</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {aspectRatio === "9:16" ? "แนวตั้ง 9:16 (TikTok/Reels)" : "แนวนอน 16:9 (YouTube)"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !showSubtitles;
                    setShowSubtitles(next);
                    showToast(next ? "💬 เปิดแสดงซับเด้งคาราโอเกะ" : "🎬 สลับเป็นโหมด Clean (ไม่ใส่ซับ)");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                    showSubtitles
                      ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 hover:bg-fuchsia-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30"
                  }`}
                  title="สลับโหมด มีซับ / ไม่ใส่ซับ"
                >
                  <span>{showSubtitles ? "💬 มีซับเด้ง" : "🎬 ไม่ใส่ซับ (Clean)"}</span>
                </button>

                {aspectRatio === "9:16" && (
                  <button
                    type="button"
                    onClick={() => setShowTikTokSafeArea(!showTikTokSafeArea)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                      showTikTokSafeArea
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                    }`}
                  >
                    <span>📱</span>
                    <span>{showTikTokSafeArea ? "ซ่อนจำลอง TikTok" : "จำลองหน้าจอ TikTok"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Player Screen Frame with Ken Burns Simulation */}
            <div
              className={`relative overflow-hidden rounded-3xl border-4 border-slate-800 bg-black shadow-2xl flex flex-col justify-between p-6 select-none transition-all duration-300 ${
                aspectRatio === "9:16"
                  ? "w-[300px] sm:w-[340px] h-[533px] sm:h-[604px]"
                  : "w-full max-w-[560px] h-[315px]"
              }`}
            >
              {/* Background Media with 60 FPS Buttery-Smooth Camera Motion */}
              <div
                ref={bgMediaContainerRef}
                style={{
                  transition: isPlaying ? "none" : "transform 0.5s ease-out",
                }}
                className="absolute inset-0 w-full h-full will-change-transform"
              >
                {backgroundMediaUrl ? (
                  isVideoBg ? (
                    <video
                      ref={videoBgRef}
                      src={backgroundMediaUrl}
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover opacity-90"
                    />
                  ) : aspectRatio === "16:9" ? (
                    /* YouTube 16:9 Landscape: Blurred Ambient Backdrop + Sharp Centered Album Art + Vinyl */
                    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
                      <img
                        src={backgroundMediaUrl}
                        alt="Backdrop"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl brightness-50 scale-110 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/35 pointer-events-none" />

                      {/* Spinning Vinyl Record (16:9 mode - peeking out from the right) */}
                      {showVinylDisc && (
                        <div
                          className="absolute z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-slate-900 bg-slate-950 shadow-[0_0_35px_rgba(0,0,0,0.85)] flex items-center justify-center transform translate-x-16 sm:translate-x-20 pointer-events-none"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle, #242424 20%, #0d0d0d 38%, #262626 58%, #050505 82%)",
                            animation: isPlaying ? "spin 3.5s linear infinite" : "none",
                          }}
                        >
                          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-white/10 flex items-center justify-center">
                            <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full border border-white/10 flex items-center justify-center">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 border-2 border-white/40 flex items-center justify-center shadow-inner">
                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black border border-white/30" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sharp Centered Album Art */}
                      <div className="relative z-20 h-[82%] aspect-square rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/25">
                        <img
                          src={backgroundMediaUrl}
                          alt="Cover Art"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    /* TikTok 9:16 Vertical: Fullscreen cover art */
                    <img
                      src={backgroundMediaUrl}
                      alt="Background"
                      className="w-full h-full object-cover opacity-90"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-indigo-950/80 via-slate-950 to-black" />
                )}
              </div>

              {/* Floating Spinning Vinyl Disc for 9:16 Vertical Mode */}
              {aspectRatio === "9:16" && showVinylDisc && (
                <div
                  className="absolute top-16 right-3.5 z-[25] w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-slate-900 bg-slate-950 shadow-[0_6px_25px_rgba(0,0,0,0.85)] flex items-center justify-center pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #242424 22%, #0f0f0f 42%, #262626 62%, #050505 84%)",
                    animation: isPlaying ? "spin 3.5s linear infinite" : "none",
                  }}
                >
                  <div className="w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-full border border-white/15 flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 border border-white/40 flex items-center justify-center shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-black border border-white/30" />
                    </div>
                  </div>
                </div>
              )}

              {/* Live Canvas Atmospheric Effects Overlay (Golden Dust, Sunbeams, Lantern Flicker) */}
              <canvas
                ref={effectCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />

              {/* Subtle Vignette Overlay for lyric readability while keeping artwork vibrant */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none z-[15]" />

              {/* Viral Hook Headline Banner (TikTok / YouTube Shorts Retention Booster) */}
              {showHookHeadline && hookHeadline.trim() && (
                <div className="relative z-[25] text-center pt-3 px-3 pointer-events-none">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/95 via-rose-500/95 to-purple-600/95 backdrop-blur-md border border-white/40 shadow-xl max-w-[95%]">
                    <span className="text-[11px] sm:text-xs font-black text-white tracking-wide truncate drop-shadow-md">
                      {/^[\u{1F300}-\u{1FAFF}🔥]/u.test(hookHeadline.trim())
                        ? hookHeadline.trim()
                        : `🔥 ${hookHeadline.trim()}`}
                    </span>
                  </div>
                </div>
              )}

              {/* 1. Upper Title Zone (Optional Toggle, default off) */}
              {showTopTitle && songTitle && (
                <div className="relative z-20 text-center pt-2">
                  <div className="inline-block px-3.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 shadow-lg max-w-[95%] truncate">
                    <h3 className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                      🎵 {songTitle}
                    </h3>
                  </div>
                </div>
              )}

              {/* TikTok UI & Safe Zone Simulation Overlay */}
              {aspectRatio === "9:16" && showTikTokSafeArea && (
                <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between text-[11px] overflow-hidden">
                  {/* Top TikTok Status Bar */}
                  <div className="w-full pt-3 px-3 flex justify-between items-center text-white/70 bg-gradient-to-b from-black/70 to-transparent">
                    <span className="text-[10px] font-bold">LIVE</span>
                    <div className="flex space-x-3 font-semibold text-xs text-white">
                      <span className="opacity-60">Following</span>
                      <span className="border-b-2 border-white pb-0.5 font-bold">For You</span>
                    </div>
                    <span className="text-xs">🔍</span>
                  </div>

                  {/* Right TikTok Action Column */}
                  <div className="absolute right-2 bottom-20 flex flex-col items-center space-y-2.5 text-white">
                    <div className="w-8 h-8 rounded-full border border-rose-500 bg-slate-800 flex items-center justify-center text-[10px]">
                      👤
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm">❤️</span>
                      <span className="text-[9px] font-bold">142K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm">💬</span>
                      <span className="text-[9px] font-bold">1.2K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm">🔖</span>
                      <span className="text-[9px] font-bold">18K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm">↗️</span>
                      <span className="text-[9px] font-bold">Share</span>
                    </div>
                  </div>

                  {/* TikTok Safe Zone Visual Indicator (60% to 70%) */}
                  <div
                    className="absolute inset-x-3 border-2 border-dashed border-emerald-400/90 rounded-2xl bg-emerald-500/15 flex flex-col items-center justify-center pointer-events-none p-2 shadow-lg"
                    style={{ top: "59%", height: "13%" }}
                  >
                    <span className="bg-emerald-600 text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold shadow -mt-4">
                      ✅ TikTok Safe Zone (จุดปลอดภัย {Math.round(subtitlePosY * 100)}%)
                    </span>
                    <span className="text-[9px] text-emerald-200 font-semibold mt-1">
                      ปลอดภัย 100% ไม่ทับคำโพสต์ และไม่บังตัวละคร
                    </span>
                  </div>

                  {/* Bottom TikTok Post Caption & Sound Bar (78% to 100%) */}
                  <div className="w-full pb-3 px-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-1 mt-auto border-t border-dashed border-rose-500/50">
                    <div className="flex items-center space-x-1.5">
                      <span className="bg-rose-500/30 text-rose-300 border border-rose-500/50 px-1.5 py-0.5 rounded text-[8px] font-bold">
                        🚫 เขตคำโพสต์ TikTok
                      </span>
                      <span className="font-bold text-white text-xs">@artist_official</span>
                    </div>
                    <p className="text-[10px] text-slate-200 line-clamp-2 leading-tight">
                      เพลงใหม่โดนใจ ฟังแล้วคิดถึงพ่อมาก #เพลงเพื่อชีวิต #ซูนิน #suno #fyp #ฟีด
                    </p>
                    <div className="flex items-center space-x-1 text-[9px] text-slate-300">
                      <span>♫</span>
                      <span className="truncate">{songTitle || "เพลงต้นฉบับ"} - Suno AI</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Middle Lyric Overlay Zone (Precise Vertical Positioning at subtitlePosY) */}
              {showSubtitles ? (
                <div
                  className="absolute inset-x-0 text-center px-4 pointer-events-none z-30 transition-all duration-200"
                  style={{
                    top: `${subtitlePosY * 100}%`,
                    transform: "translateY(-50%)",
                  }}
                >
                  {activeCue ? (
                    <div
                      key={activeCue.id}
                      className={`w-full max-w-[94%] mx-auto px-1 flex flex-col items-center ${getSubtitleAnimClass()}`}
                    >
                      <div className="inline-block py-1.5 px-3.5 rounded-2xl bg-black/45 backdrop-blur-[2px] border border-white/10 shadow-2xl">
                        {balanceThaiLyric(activeCue.text).map((line, idx) => (
                          <p
                            key={idx}
                            className={`tiktok-stroke-thick font-black leading-tight sm:leading-snug drop-shadow-2xl whitespace-nowrap text-center ${getFontSizeClass()} ${getSubtitleColorClass()}`}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400/80 text-xs tracking-wider">
                      {isPlaying ? "♪ ดนตรีบรรเลง ♪" : "กดปุ่ม Play เพื่อเริ่มเล่นเพลงและดูซับเด้ง"}
                    </div>
                  )}
                </div>
              ) : (
                !isPlaying && (
                  <div className="absolute inset-x-0 text-center px-4 pointer-events-none z-30 top-1/2 -translate-y-1/2">
                    <div className="inline-block px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-slate-300 text-xs shadow-lg">
                      🎬 โหมด Clean (ไม่ใส่ซับ)
                    </div>
                  </div>
                )
              )}

              {/* 2.5 Live Dancing Waveform Bars */}
              {showWaveform && (
                <div className="relative z-20 flex items-center justify-center space-x-1 pb-3 mt-auto">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isPlaying
                          ? subtitleStyle === "cyber-cyan"
                            ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                            : subtitleStyle === "sunset-gold"
                            ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                            : subtitleStyle === "ruby-red"
                            ? "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                            : "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                          : "bg-slate-600 h-1"
                      }`}
                      style={{
                        height: isPlaying ? `${Math.sin(currentTime * 8 + i) * 12 + 16}px` : "4px",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Playback Progress & Controls */}
            <div className="w-full max-w-[560px] mt-5 space-y-3">
              {/* Progress Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    const targetTime = isTrimActive ? trimStart : 0;
                    setCurrentTime(targetTime);
                    if (audioRef.current) audioRef.current.currentTime = targetTime;
                  }}
                  className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                  title={isTrimActive ? "เริ่มใหม่จากจุดตัดหัว" : "เริ่มใหม่ตั้งแต่ต้น"}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            {/* CapCut-Style Video Trimmer Studio */}
            <div className="w-full max-w-[560px] mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3.5">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center space-x-1.5">
                      <span>ตัดต่อช่วงวิดีโอ (CapCut-Style Trimmer)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      ตัดท่อนหัว / ท่อนท้ายออก เลือกเฉพาะช่วงที่ต้องการลงโซเชียล
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center space-x-2">
                  {isTrimActive ? (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse">
                      ✂️ กำลังตัดต่อคลิป
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      🎵 ใช้ทั้งเพลง
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Multi-Track Trimmer Timeline */}
              <div className="space-y-1.5">
                {/* Visual Timeline Bar */}
                <div className="relative h-8 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700/60 flex items-center select-none">
                  {/* 1. Left Cut Segment (ท่อนหัวที่ตัดออก) */}
                  <div
                    className="h-full bg-slate-900/95 border-r border-dashed border-red-500/60 relative flex items-center justify-center transition-all duration-100"
                    style={{
                      width: `${duration > 0 ? (trimStart / duration) * 100 : 0}%`,
                    }}
                  >
                    {trimStart > 0 && (
                      <span className="text-[9px] font-bold text-red-400/80 truncate px-1">
                        ✂️ ตัดหัวออก
                      </span>
                    )}
                  </div>

                  {/* 2. Middle Active Segment (ช่วงที่เลือกเรนเดอร์) */}
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 border-y-2 border-emerald-400/80 relative flex items-center justify-between px-2 transition-all duration-100 shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]"
                    style={{
                      width: `${
                        duration > 0
                          ? (((trimEnd || duration) - trimStart) / duration) * 100
                          : 100
                      }%`,
                    }}
                  >
                    <span className="text-[10px] font-mono font-bold text-emerald-300 drop-shadow">
                      IN: {formatTime(trimStart)}
                    </span>
                    <span className="text-[10px] font-bold text-white/90 drop-shadow bg-emerald-950/70 px-1.5 py-0.5 rounded">
                      🎬 {formatTime(Math.max((trimEnd || duration) - trimStart, 0))}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-cyan-300 drop-shadow">
                      OUT: {formatTime(trimEnd || duration)}
                    </span>
                  </div>

                  {/* 3. Right Cut Segment (ท่อนท้ายที่ตัดออก) */}
                  <div
                    className="h-full bg-slate-900/95 border-l border-dashed border-red-500/60 relative flex items-center justify-center transition-all duration-100"
                    style={{
                      width: `${
                        duration > 0 && trimEnd > 0
                          ? ((duration - trimEnd) / duration) * 100
                          : 0
                      }%`,
                    }}
                  >
                    {duration > 0 && trimEnd > 0 && trimEnd < duration && (
                      <span className="text-[9px] font-bold text-red-400/80 truncate px-1">
                        ✂️ ตัดท้ายออก
                      </span>
                    )}
                  </div>

                  {/* 4. Playhead scrubber needle */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] z-10 pointer-events-none transition-all duration-75"
                    style={{
                      left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                    }}
                  >
                    <div className="w-2.5 h-2.5 -ml-[3px] -mt-0.5 rounded-full bg-white shadow" />
                  </div>
                </div>

                {/* Time Summary Details */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                  <span className="text-slate-400">
                    เริ่มคลิป: <strong className="text-emerald-400">{formatTime(trimStart)}</strong>
                  </span>
                  <span className="text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    ความยาวสุทธิ: {formatTime(Math.max((trimEnd || duration) - trimStart, 0))} นาที
                  </span>
                  <span className="text-slate-400">
                    จบคลิป: <strong className="text-cyan-400">{formatTime(trimEnd || duration)}</strong>
                  </span>
                </div>
              </div>

              {/* Quick Action One-Click Cut Buttons (CapCut Style) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSetTrimStart}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-sm"
                  title="ตัดท่อนหัวออก และเริ่มคลิปตรงเวลาที่กำลังเล่น"
                >
                  <Scissors className="w-3.5 h-3.5 rotate-90 text-emerald-400" />
                  <span>ตัดหัว [{formatTime(currentTime)}]</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetTrimEnd}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-sm"
                  title="ตัดท่อนท้ายออก และสิ้นสุดคลิปตรงเวลาที่กำลังเล่น"
                >
                  <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ตัดท้าย [{formatTime(currentTime)}]</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlayTrimmedClip}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                  title="เริ่มเล่นพรีวิวเฉพาะช่วงที่ตัดไว้"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-300" />
                  <span>เล่นท่อนที่ตัด</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetTrim}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                  title="ล้างการตัด กลับไปใช้เพลงเต็ม"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>รีเซ็ต (เต็มเพลง)</span>
                </button>
              </div>

              {/* Precision Sliders with -1s / +1s Steppers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                {/* In-point Slider */}
                <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center space-x-1">
                      <span className="text-emerald-400">🚩</span>
                      <span>จุดเริ่ม (Trim In):</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          const maxDur = duration || 180;
                          if (trimEnd === 0) setTrimEnd(maxDur);
                          const val = Number(Math.max(0, trimStart - 1).toFixed(2));
                          setTrimStart(val);
                          setIsTrimActive(true);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700 font-mono"
                      >
                        -1s
                      </button>
                      <span className="font-mono text-emerald-400 font-bold px-1 text-xs">
                        {formatTime(trimStart)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const maxDur = duration || 180;
                          const curEnd = trimEnd > 0 ? trimEnd : maxDur;
                          if (trimEnd === 0) setTrimEnd(curEnd);
                          const val = Number(Math.min(Math.max(0, curEnd - 0.5), trimStart + 1).toFixed(2));
                          setTrimStart(val);
                          setIsTrimActive(true);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700 font-mono"
                      >
                        +1s
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max((trimEnd > 0 ? trimEnd : duration || 180) - 0.5, 0.5)}
                    step="0.2"
                    value={Math.min(trimStart, Math.max((trimEnd > 0 ? trimEnd : duration || 180) - 0.5, 0.5))}
                    onChange={(e) => {
                      const maxDur = duration || 180;
                      const curEnd = trimEnd > 0 ? trimEnd : maxDur;
                      if (trimEnd === 0) setTrimEnd(curEnd);
                      const val = Math.min(parseFloat(e.target.value), Math.max(0, curEnd - 0.5));
                      setTrimStart(val);
                      setIsTrimActive(true);
                      if (audioRef.current && currentTime < val) {
                        audioRef.current.currentTime = val;
                        setCurrentTime(val);
                      }
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Out-point Slider */}
                <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center space-x-1">
                      <span className="text-cyan-400">🏁</span>
                      <span>จุดจบ (Trim Out):</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          const maxDur = duration || 180;
                          const curEnd = trimEnd > 0 ? trimEnd : maxDur;
                          const val = Number(Math.max(trimStart + 0.5, curEnd - 1).toFixed(2));
                          setTrimEnd(val);
                          setIsTrimActive(true);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700 font-mono"
                      >
                        -1s
                      </button>
                      <span className="font-mono text-cyan-400 font-bold px-1 text-xs">
                        {formatTime(trimEnd || duration)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const maxDur = duration || 180;
                          const curEnd = trimEnd > 0 ? trimEnd : maxDur;
                          const val = Number(Math.min(maxDur, curEnd + 1).toFixed(2));
                          setTrimEnd(val);
                          setIsTrimActive(true);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700 font-mono"
                      >
                        +1s
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={Math.min(trimStart + 0.5, duration || 180)}
                    max={duration || 180}
                    step="0.2"
                    value={Math.max(trimEnd || duration || 180, trimStart + 0.5)}
                    onChange={(e) => {
                      const val = Math.max(parseFloat(e.target.value), trimStart + 0.5);
                      setTrimEnd(val);
                      setIsTrimActive(true);
                      if (audioRef.current && currentTime > val) {
                        audioRef.current.currentTime = val;
                        setCurrentTime(val);
                      }
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons for TikTok / Reels */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <span className="text-[11px] text-slate-400 font-medium">คีย์ลัดความยาวคลิป:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handlePresetTrim(30)}
                    className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[11px] font-semibold transition-all"
                  >
                    🔥 30 วิ (TikTok / Shorts)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetTrim(60)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all"
                  >
                    ⚡ 60 วิ (Reels)
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTrim}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all"
                  >
                    🎵 ทั้งเพลง
                  </button>
                </div>
              </div>
            </div>

            {/* Export Progress Bar */}
            {isExporting && (
              <div className="w-full max-w-[560px] mt-4 p-4 bg-slate-950 border border-emerald-500/50 rounded-2xl space-y-2.5 shadow-xl shadow-emerald-950/40">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-400 flex items-center space-x-1.5">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>กำลังเรนเดอร์ Music Video HD (ระบบป้องกันภาพค้าง 30 FPS Lock)...</span>
                  </span>
                  <span className="text-white font-mono font-bold">{exportProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 h-full transition-all duration-200"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-amber-300/90 font-medium">
                  💡 คำแนะนำ: กรุณาเปิดหน้านี้ไว้จนกว่าจะเสร็จ เพื่อให้เบราว์เซอร์ส่งเฟรมภาพต่อเนื่อง 100% ไม่สะดุด
                </p>
              </div>
            )}

            {/* Export Actions Card */}
            <div className="w-full max-w-[560px] mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-200">พร้อมแชร์ลง TikTok / Reels / Shorts แล้ว</h4>
                <p className="text-[11px] text-slate-400">
                  วิดีโอคุณภาพสูง 720p เสียงคมชัด ซับซิงก์ตรงกับเสียงร้อง
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Subtitle Export Multi-Format Group (.SRT, .LRC, .VTT) */}
                <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700/80 rounded-xl p-1">
                  <span className="text-[10px] text-slate-400 px-2 font-medium hidden sm:inline">บันทึกซับ:</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadSubtitles("srt")}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                    title="ไฟล์ SubRip สำหรับโปรแกรมตัดต่อ (CapCut, Premiere, DaVinci)"
                  >
                    .SRT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSubtitles("lrc")}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                    title="ไฟล์คาราโอเกะสำหรับ Suno, Spotify, และ Music Player"
                  >
                    .LRC
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSubtitles("vtt")}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                    title="ไฟล์ WebVTT สำหรับเว็บและ TikTok"
                  >
                    .VTT
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportVideo}
                  className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isExporting
                      ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95"
                  }`}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังเรนเดอร์ ({exportProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>
                        {isTrimActive && trimEnd > trimStart
                          ? `ส่งออกคลิปที่ตัด (${formatTime(trimEnd - trimStart)})`
                          : `ส่งออก Music Video (${aspectRatio})${!showSubtitles ? " • ไม่ใส่ซับ" : ""}`}
                      </span>
                    </>
                  )}
                </button>
                {isExporting && (
                  <button
                    type="button"
                    onClick={handleCancelExport}
                    className="flex items-center space-x-1 px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ยกเลิก</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Export Completed Modal with In-Browser Player (No external player hang!) */}
      {showExportModal && exportDoneUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mv-export-modal-title"
        >
          <div
            className={`bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 w-full shadow-2xl relative space-y-4 flex flex-col items-center ${
              aspectRatio === "16:9" ? "max-w-lg" : "max-w-sm sm:max-w-md"
            }`}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Check className="w-4 h-4" />
                </div>
                <h3 id="mv-export-modal-title" className="text-sm font-bold text-white">
                  สร้างวิดีโอ MV {aspectRatio} สำเร็จ!
                </h3>
              </div>
              <button
                type="button"
                aria-label="ปิดหน้าต่างพรีวิววิดีโอ"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Embedded HTML5 Video Player */}
            <div
              className={`relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black shadow-2xl ${
                aspectRatio === "16:9" ? "w-full max-w-[440px] aspect-video" : "w-[240px] h-[426px]"
              }`}
            >
              <video
                src={exportDoneUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-slate-300 text-center leading-relaxed">
              วิดีโอได้รับการเข้ารหัสด้วยฟอร์แมต <strong>{(exportedFileExt || "mp4").toUpperCase()}</strong> ความคมชัดสูงและประหยัดทรัพยากร สามารถกดรับชมในเบราว์เซอร์ได้ทันที
            </p>

            {/* Action Buttons */}
            <div className="w-full flex items-center space-x-2 pt-2">
              <a
                href={exportDoneUrl}
                download={`${(songTitle || "MusicVideo").replace(/\s+/g, "_")}_${aspectRatio.replace(":", "x")}_MV.${exportedFileExt || "mp4"}`}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg text-center flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์ (.{(exportedFileExt || "mp4").toUpperCase()})</span>
              </a>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="py-3 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
