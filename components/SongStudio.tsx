"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Music,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Flame,
  Download,
  ShieldCheck,
  Disc,
  Radio,
  FileCode,
  Sliders,
  Bot,
  ExternalLink,
  Zap,
  Wand2,
  AlertTriangle,
} from "lucide-react";
import {
  buildFullSunoMegaPrompt,
  buildSunoAuditRefinePrompt,
  buildSunoFinalMasterAuditPrompt,
  SUNO_GRANDMASTER_SYSTEM_PROMPT,
  AuditFocusMode,
  extractCleanLyricBody,
  isLineBeatAligned,
  detectWeirdOrForcedThaiPhrases,
} from "@/lib/prompts";
import { copyTextToClipboard } from "@/lib/clipboard";

interface SongStudioProps {
  onSendToMv: (songData: {
    title: string;
    lyrics: string;
    mood: string;
    tempo?: string;
    key?: string;
    flowStyle?: "auto" | "trinity" | "sdpmr-folk" | "p9d-boombap" | "melodic-rap-oldschool";
    rhymeIntensity?: "auto" | "supreme" | "sharp" | "melodic";
    credit?: string;
    hookHeadline?: string;
  }) => void;
}

const DEFAULT_STORY =
  "เรื่องราวของคนสู้ชีวิตที่ผ่านความยากลำบาก เปรียบดั่งรวงข้าวที่ยิ่งมีค่ายิ่งโน้มตัวลงหาดิน ไม่โอ้อวดตน ยืนหยัดด้วยความจริงใจและความดีจนประสบความสำเร็จ";
const DEFAULT_VOCAL_STYLE =
  "AUTO — ให้ AI วิเคราะห์เลือกแนวเพลง เพศเสียงร้อง คีย์ และ BPM ที่เข้ากับเรื่องราวนี้ที่สุดโดยอัตโนมัติ (แนะนำ 100%)";
const SONG_STORAGE_KEY = "vericap_song_studio_state";

export default function SongStudio({ onSendToMv }: SongStudioProps) {
  const [story, setStory] = useState(DEFAULT_STORY);
  const [vocalStyle, setVocalStyle] = useState(DEFAULT_VOCAL_STYLE);
  const [mood, setMood] = useState("AUTO");
  const [tempo, setTempo] = useState("AUTO");
  const [key, setKey] = useState("AUTO");
  const [isAutoMusical, setIsAutoMusical] = useState(true);
  const [flowStyle, setFlowStyle] = useState<'auto' | 'trinity' | 'sdpmr-folk' | 'p9d-boombap' | 'melodic-rap-oldschool'>('auto');
  const [rhymeIntensity, setRhymeIntensity] = useState<'auto' | 'supreme' | 'sharp' | 'melodic'>('auto');

  const [outputResult, setOutputResult] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string>("");

  // Stage 2 (1st Audit) & Stage 3 (Final Master Audit) State (v115.0 3-Stage Pipeline)
  const [auditFocus, setAuditFocus] = useState<AuditFocusMode>("all");
  const [showAuditPreview, setShowAuditPreview] = useState(false);
  const [auditPreviewStage, setAuditPreviewStage] = useState<"stage2" | "stage3">("stage2");

  const hasHydratedRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBadge = (id: string, duration = 2200) => {
    setCopiedKey(id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopiedKey((current) => (current === id ? null : current));
    }, duration);
  };

  const handleCopyText = async (id: string, text: string, duration = 2200) => {
    setCopyError("");
    const ok = await copyTextToClipboard(text);
    if (ok) {
      triggerBadge(id, duration);
    } else {
      setCopyError("เบราว์เซอร์จำกัดสิทธิ์คัดลอกอัตโนมัติ — กรุณากด Ctrl+C เพื่อคัดลอกข้อความในกล่องได้ทันที");
    }
  };

  // Restore saved Step 1 state on mount & clean timers on unmount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SONG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (typeof parsed.story === "string") setStory(parsed.story);
          if (typeof parsed.vocalStyle === "string") setVocalStyle(parsed.vocalStyle);
          if (typeof parsed.mood === "string") setMood(parsed.mood);
          if (typeof parsed.tempo === "string") setTempo(parsed.tempo);
          if (typeof parsed.key === "string") setKey(parsed.key);
          if (typeof parsed.isAutoMusical === "boolean") {
            setIsAutoMusical(parsed.isAutoMusical);
          } else if (
            (typeof parsed.tempo === "string" && parsed.tempo !== "AUTO") ||
            (typeof parsed.key === "string" && parsed.key !== "AUTO")
          ) {
            setIsAutoMusical(false);
          }
          if (parsed.flowStyle) setFlowStyle(parsed.flowStyle);
          if (parsed.rhymeIntensity) setRhymeIntensity(parsed.rhymeIntensity);
          if (typeof parsed.outputResult === "string") setOutputResult(parsed.outputResult);
          if (parsed.auditFocus) setAuditFocus(parsed.auditFocus);
        }
      }
    } catch {
      // Ignore invalid JSON or storage restrictions
    } finally {
      hasHydratedRef.current = true;
    }

    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    try {
      localStorage.setItem(
        SONG_STORAGE_KEY,
        JSON.stringify({
          story,
          vocalStyle,
          mood,
          tempo,
          key,
          isAutoMusical,
          flowStyle,
          rhymeIntensity,
          outputResult,
          auditFocus,
        })
      );
    } catch {
      // Ignore quota exceeded
    }
  }, [story, vocalStyle, mood, tempo, key, isAutoMusical, flowStyle, rhymeIntensity, outputResult, auditFocus]);

  // Live Generated Master Prompt (Tailored directly to the user's story with ZERO SPOKEN WORD for Suno Mini)
  const fullMasterPrompt = useMemo(() => {
    return buildFullSunoMegaPrompt({
      story: story.trim() || "[กรุณาพิมพ์เรื่องราวชีวิตของคุณทางซ้ายมือ]",
      vocalStyle: vocalStyle.trim(),
      mood: mood.trim(),
      tempo: isAutoMusical ? "AUTO" : tempo,
      key: isAutoMusical ? "AUTO" : key,
      flowStyle,
      rhymeIntensity,
    });
  }, [story, vocalStyle, mood, tempo, key, isAutoMusical, flowStyle, rhymeIntensity]);

  // Copy Masterpiece Prompt
  const handleCopyPrompt = () => {
    void handleCopyText("fullPrompt", fullMasterPrompt, 2500);
  };

  // Copy Audit & Polish Prompt (Follow-up for Same Chat - includes auto-detected flaws if lyrics are pasted)
  const handleCopyAuditPrompt = () => {
    const draftToScan = extractLyrics(outputResult) || outputResult.trim();
    const prompt = buildSunoAuditRefinePrompt({
      draftForDiagnosis: draftToScan || undefined,
      focus: auditFocus,
      storyContext: story.trim(),
      vocalStyle: vocalStyle.trim(),
    });
    void handleCopyText("auditPrompt", prompt, 2500);
  };

  // Copy Audit & Polish Prompt (With Embedded 1st-Round Lyrics + Auto-Detected Flaws)
  const handleCopyAuditWithLyrics = () => {
    const lyricsToUse = extractLyrics(outputResult) || outputResult.trim();
    const prompt = buildSunoAuditRefinePrompt({
      lyrics: lyricsToUse,
      focus: auditFocus,
      storyContext: story.trim(),
      vocalStyle: vocalStyle.trim(),
    });
    void handleCopyText("auditWithLyrics", prompt, 2500);
  };

  // Stage 3: Copy Final Master Audit Prompt (Follow-up in Same Chat after Stage 2)
  const handleCopyFinalAuditPrompt = () => {
    const draftToScan = extractLyrics(outputResult) || outputResult.trim();
    const prompt = buildSunoFinalMasterAuditPrompt({
      draftForDiagnosis: draftToScan || undefined,
      storyContext: story.trim(),
      vocalStyle: vocalStyle.trim(),
    });
    void handleCopyText("finalAuditPrompt", prompt, 2500);
  };

  // Stage 3: Copy Final Master Audit Prompt (With Embedded Lyrics for New Chat)
  const handleCopyFinalAuditWithLyrics = () => {
    const lyricsToUse = extractLyrics(outputResult) || outputResult.trim();
    const prompt = buildSunoFinalMasterAuditPrompt({
      lyrics: lyricsToUse,
      storyContext: story.trim(),
      vocalStyle: vocalStyle.trim(),
    });
    void handleCopyText("finalAuditWithLyrics", prompt, 2500);
  };

  // Helper functions to parse parts of the output (stops cleanly at [End], never leaks trailing AI chat questions)
  const stripMd = (s: string): string =>
    s
      .replace(/[*_`#]/g, "")
      .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
      .trim();

  const extractLyrics = (raw: string): string => {
    return extractCleanLyricBody(raw);
  };

  const extractTitle = (raw: string): string => {
    const m = raw.match(/ชื่อเพลง[*_`]*\s*[:：]\s*([^\n\r]+)/i);
    if (m && m[1]) {
      const cleaned = stripMd(m[1]);
      if (cleaned) return cleaned;
    }
    return "บทเพลงระดับตำนาน";
  };

  const extractStyle = (raw: string): string => {
    const m = raw.match(/Style of Music\)?[*_`]*\s*[:：]\s*([^\n\r]+)/i);
    if (m && m[1]) {
      const cleaned = stripMd(m[1]);
      if (cleaned) return cleaned;
    }
    return "Thai folk-soul meets boom-bap, guitar, warm piano, melodic male vocal, tight groove, catchy hook, 84 bpm";
  };

  const extractExclude = (raw: string): string => {
    const m = raw.match(/Exclude Styles\)?[*_`]*\s*[:：]\s*([^\n\r]+)/i);
    if (m && m[1]) {
      const cleaned = stripMd(m[1]);
      if (cleaned) return cleaned;
    }
    return "spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out";
  };

  const extractHook = (raw: string): string => {
    const m = raw.match(/คำพาดหัวสะกิดใจ[*_`]*\s*[:：]\s*([^\n\r]+)/i);
    if (m && m[1]) {
      const cleaned = stripMd(m[1]);
      if (cleaned) return cleaned;
    }
    return "คนจริงเขาไม่พูดเยอะ... สองมือสร้างอนาคต ไม่ก้มหัวให้ใครประทาน! 🔥";
  };

  // Presets covering All Popular Thai Music Archetypes
  const storyPresets = [
    {
      label: "🌾 สัจธรรมรวงข้าวค้อมดิน (คนจริงย่อมถ่อมตัว) [เพื่อชีวิตร่วมสมัย]",
      text: "เรื่องราวของคนสู้ชีวิตที่ผ่านความยากลำบาก เปรียบดั่งรวงข้าวสีทองที่ยิ่งมีค่ายิ่งโน้มตัวลงหาดิน ไม่โอ้อวดตน ยืนหยัดด้วยความจริงใจและความดีจนประสบความสำเร็จ",
    },
    {
      label: "🌳 ร่มเงาแห่งต้นไม้ใหญ่ (ความดีที่หยั่งรากลึก) [ปรัชญาสัจธรรม]",
      text: "เรื่องราวของต้นไม้ใหญ่ที่หยั่งรากลึกลงในผืนดิน ไม่ต้องบินสูงเหมือนนกแต่ให้ร่มเงาแก่ผู้คนที่เหนื่อยล้า อยู่อย่างมีคุณค่าในตัวเองและค้ำจุนคนรอบข้าง",
    },
    {
      label: "💧 หยดน้ำค้างบนยอดหญ้า (ความบริสุทธิ์ของความจริงใจ) [อบอุ่นให้พลังใจ]",
      text: "เรื่องราวของความจริงใจที่เรียบง่าย เปรียบดั่งหยดน้ำค้างยามเช้าที่บริสุทธิ์ใส ไม่หวังผลตอบแทน แม้โลกจะวุ่นวายแต่หัวใจยังคงสว่างไสว",
    },
    {
      label: "👑 มหากาพย์สัจธรรม & สตรีท (3-Act Epic Street Soul)",
      text: "เรื่องราวของคนสู้ชีวิตที่เริ่มต้นจากศูนย์ ผ่านความยากลำบาก โดนหักหลังและเหยียบย่ำ แต่ยืนหยัดด้วยศักดิ์ศรีและความจริงใจ จนก้าวขึ้นมาสำเร็จด้วยลำแข้งตัวเอง",
    },
    {
      label: "🌾 เพื่อชีวิต / พ่อช่างไม้",
      text: "เรื่องราวของพ่อที่เป็นช่างไม้ ในเพิงไม้เก่า ทำงานหนักเลี้ยงลูกจนเรียนจบเมืองใหญ่ วันที่ลูกกลับมาพร้อมเงินเดือนก้อนแรก พ่อก็หลับตาลาลับไปอย่างสงบ",
    },
    {
      label: "🌸 รักแรกพบ / เพลงรักอบอุ่น",
      text: "เรื่องราวของความรักที่เรียบง่ายแต่จริงใจ การได้พบสบตาในร้านกาแฟวันฝนพรำ กลายเป็นจุดเริ่มต้นของความอบอุ่นที่คอยเคียงข้างกันเสมอ",
    },
    {
      label: "🌧️ คืนฝนพรำ / อกหักคิดถึง",
      text: "เรื่องราวของค่ำคืนที่ฝนตกลงมาท่ามกลางแสงไฟนีออนของเมืองใหญ่ นั่งมองหน้าต่างคิดถึงคนที่เคยเดินกางร่มด้วยกัน เหลือเพียงความทรงจำ",
    },
    {
      label: "🎸 สุดทางฝัน / ร็อกพลังใจ",
      text: "เรื่องราวของคนหนุ่มสาวที่วิ่งตามความฝันบนเส้นทางดนตรี แม้ล้มกี่ครั้งก็ลุกขึ้นใหม่ ตะโกนก้องฟ้าด้วยความหวังว่าสักวันต้องถึงเส้นชัย",
    },
    {
      label: "👴 พระคุณพ่อแม่",
      text: "เรื่องราวของความผูกพันพ่อลูกที่พ่อทำงานหนักเลี้ยงดูลูกจนเติบโต วันหนึ่งพ่อจากลาไปอย่างสงบ ลูกกราบลาทั้งน้ำตาและคำขอบคุณ",
    },
    {
      label: "🏙️ สู้ชีวิตคนพลัดถิ่น",
      text: "เรื่องราวของกรรมกรหนุ่มจากอีสานที่เข้ามาสู้ชีวิตในกรุงเทพฯ หอบความฝันและรูปถ่ายแม่ไว้เตือนใจ แม้ลำบากแต่ไม่ยอมแพ้",
    },
    {
      label: "🤝 เพื่อนแท้ร่วมทาง",
      text: "เรื่องราวของเพื่อนแท้ที่ผ่านร้อนผ่านหนาวมาด้วยกันตั้งแต่วัยเด็ก วันที่เพื่อนล้มหรือเจ็บ เรากอดคอไม่เคยทิ้งกัน",
    },
    {
      label: "🐕 น้องหมาสี่ขาเพื่อนยาก",
      text: "เรื่องราวของคนรักสุนัขที่เก็บลูกหมาจรจัดมาเลี้ยงจนผูกพันกันเหมือนครอบครัว วันหนึ่งมันแก่ชราและจากไปในอ้อมกอด",
    },
  ];

  const vocalPresets = [
    "AUTO — ให้ AI วิเคราะห์เลือกแนวเพลง เพศเสียงร้อง คีย์ และ BPM ที่เข้ากับเรื่องราวนี้ที่สุดโดยอัตโนมัติ (แนะนำ 100%)",
    "🔒 [เมโลดี้แร็ป × โอลด์สคูล] กรูฟบูมแบ็ป 90s ผสมเมโลดี้แร็ปร้องลื่นหู: สัมผัสพ้องเสียงสระ-พยัญชนะ ฮุคก้องกังวานติดหู",
    "🔒 [ไตรภาคี 3 ศิลปิน] โมเดิร์นอะคูสติก-R&B × บูมแบ็ป 90s (SD PMR × P9D × NS-A755): เปิดชิดไมค์เปลือย -> Beat Drop -> Verse 2 เกียร์เด้งลงสแนร์ -> ฮุคพลิกคมประสานเสียง",
    "🔒 [สไตล์ SD PMR Hybrid] อะคูสติก-ซับเบส 808 ร่วมสมัย: เปิด 2 บรรทัดเปลือยคลอกีตาร์ก่อนทิ้งบีท คู่ขัดแย้งพลิกคม ฮุคกระโดดโทนประสานเสียงติดหู",
    "🔒 [สไตล์ P9D × NS-A755] แจ๊สบูมแบ็ป × โซล R&B: ชิดไมค์เล่าเรื่องจริงภาษาพูดคล้องพวง 2-4 พยางค์ สาดสัมผัสในลงสแนร์ ตัดสลับฮุคโซลกังวาน",
    "🔒 [สไตล์ SD PMR Female Version] โมเดิร์นป๊อป-R&B หญิงใสกังวาน: Verse นุ่มลึกชิดไมค์ Pre-Chorus ไต่เสียงหัว ฮุคประสานเสียงพลิกเกียร์แร็ปใน Verse 2",
    "🔒 [สไตล์ร็อกเพื่อชีวิตร่วมสมัย] คลีน-ทู-โอเวอร์ไดรฟ์ป๊อปร็อก: Verse 1 กีตาร์คลีนอั้นอารมณ์ ก่อนระเบิดคอร์ดแตกในฮุคเต็มปอด",
  ];

  // 100% Sung Hit Outputs (v129.0 True 3-Artist Trinity Fusion: 4-Gear Dynamic Contrast, Beat-Locked Prosody, Zero Intro/Solo, <= 4,500 Chars)
  const sampleSongs = {
    tripartite: `ชื่อเพลง: รวงข้าวที่ไม่เคยอวดตน (Golden Grain in Silence)
คำพาดหัวสะกิดใจ: กลองยิ่งกลวงยิ่งตีดัง... แต่ทองแท้ไม่เคยต้องอวดใคร ให้เวลาตอบแทนเอง 🌾
ประโยคหมุดทองคำ: กลองยิ่งกลวง เสียงยิ่งฟุ้งดังไกล / แต่ทองแท้ ไม่เคยต้องอวดใคร (โอ้...) / รวงข้าวยิ่งมีค่า ยิ่งโน้มลงดิน / เปลี่ยนหยาดเหงื่อ เป็นแรงให้ได้กิน
Style of Music: Thai acoustic R&B meets 90s boom-bap, fingerstyle guitar, 808 sub, melodic male vocal, catchy hook, 82 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Warm Intimate Male Baritone-Tenor, Dynamic Beat Drop, Stacked Hook, No Spoken]

[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Spoken]
มองรวงข้าวกลางทุ่งนา, ยิ่งมีค่ายิ่งโน้มลง,
ผ่านแดดฝนมาสักกี่หน, ใจยังนิ่งและมั่นคง,
ต่างกับหญ้าที่ไร้รวง, ชูยอดสูงท้าลมแรง,
พอเมฆฝนซัดลงมา, ก็พับหายไปกลางแปลง,
โลกสมัยนี้เสียงดัง, คนชอบอ้างคำสวยหรู,
เอาแต่โชว์เปลือกนอกงาม, อยากให้ใครเขารับรู้,
แต่คนจริงก้มหน้าทำ, ยอมเหน็ดเหนื่อยด้วยสองมือ,
ให้ผลงานเป็นคำตอบ, ไม่ต้องป่าวประกาศชื่อ

[Pre-Chorus 1: Rising Note Lift, Sustained Open Vowels]
ค่าของคนไม่ได้วัด, ที่คำพูดแสนสวยหรู,
แต่วัดในคืนมืดมิด, วันที่ฟ้าไม่เอ็นดู,
ทองคำแท้แม้ตกโคลน, ยังส่องแสงอยู่เรื่อยไป,
ไม่ต้องรอคำชื่นชม, ให้เวลาตอบแทนใจ

[Chorus 1: Stacked Harmony Anthem, Antithesis Flip Hook, Catchy]
กลองยิ่งกลวง, เสียงยิ่งฟุ้งดังไกล,
แต่ทองแท้, ไม่เคยต้องอวดใคร (โอ้...)
รวงข้าวยิ่งมีค่า, ยิ่งโน้มลงดิน,
เปลี่ยนหยาดเหงื่อ, เป็นแรงให้ได้กิน,
คำคุยโต, โดนลมพัดก็จาง,
คนลงมือ, ถึงเส้นชัยปลายทาง (ฮือ...)
ให้เวลา, เป็นพยานแทนคำ,
ไม่ต้องพูด, สุดท้ายคนก็จำ!

[Verse 2: Gear-Shift Rhythmic Sing-Rap, Tight Internal Rhymes - No Spoken]
ตีห้าตื่นเช้า, สวมรองเท้าผ้าใบ,
ไม่แวะคุยใคร, หิ้วกระเป๋ารีบไป,
เสื้อตัวเก่าซักซ้ำ, จนสีซีดจาง,
ก้มหน้าสร้างทาง, ไม่ได้วางมาดขวาง,
ใครจะแซะจะขำ, จดจำขึ้นใจ,
จดลงสมุดพกไว้, ไม่เคยแค้นเคืองใคร,
เก็บคำดูถูก, มาผูกเป็นพลังส่ง,
เดินเส้นทางตรง, มุ่งหน้าอย่างมั่นคง

[Pre-Chorus 2: Higher Tension Swell, Brand-New Lyrics]
เศษเหรียญร่วงลงบนพื้น, มักส่งเสียงดังข้างทาง,
แต่แบงก์ใบใหญ่ตกลง, กลับสงบและนิ่งวาง,
คนรู้จริงไม่เคยคุย, ไม่ต้องยกตนขึ้นลอย,
แค่ก้มหน้าลงมือทำ, ปล่อยผลงานตอบแทนใจ

[Chorus 2: Returning Earworm Hook, Layered Ad-Libs & Deeper Payoff]
กลองยิ่งกลวง, เสียงยิ่งฟุ้งดังไกล,
แต่ทองแท้, ไม่เคยต้องอวดใคร (โอ้...)
รวงข้าวยิ่งมีค่า, ยิ่งโน้มลงดิน,
เปลี่ยนหยาดเหงื่อ, เป็นแรงให้ได้กิน,
ลมปากคน, ผ่านมาแล้วก็จาง,
เหลือเพียงใจ, ที่ไม่เคยหลงทาง (ฮือ...)
หยาดเหงื่อริน, ตอบทุกข้อนินทา,
ไม่พูดเยอะ, ให้เวลาตอบมา!

[Bridge: Stripped-Back Confession Rising to Octave Climax]
สายน้ำที่ลึกที่สุด, ไหลรินผ่านอย่างเงียบงัน,
แต่หล่อเลี้ยงทุกชีวิต, ให้เติบโตได้ทุกวัน,
ยิ่งก้าวสูงขึ้นเพียงใด, ยิ่งก้มต่ำกว่าที่เคย,
ให้ความดีช่วยเปิดเผย, ค่าของคนที่ไม่ลืม!

[Final Chorus: Full Band Goosebumps Anthem, Stacked Harmonies & Golden Punchline]
กลองยิ่งกลวง, เสียงยิ่งฟุ้งดังไกล,
แต่ทองแท้, ไม่เคยต้องอวดใคร (โอ้...)
รวงข้าวยิ่งมีค่า, ยิ่งโน้มลงดิน,
เปลี่ยนหยาดเหงื่อ, เป็นแรงให้ได้กิน,
ก้มหัวลง, ขอบคุณทุกเส้นทาง,
ผ่านความมืด, จนเช้าที่สว่าง (โอ้...)
ให้ผลงาน, พูดแทนคำทุกอย่าง,
ทองคำแท้, ไม่มีวันเลือนราง!

[Outro: Strip Beat, Bare Acoustic Echo & Fade Out - No Spoken]
รวงข้าวสีทองค้อมต่ำ, ยิ้มรับลมยามฟ้าสาง,
ทิ้งความดีไว้กลางทาง, แทนเสียงคุยที่เลือนหาย...

[End]`,
    phaw: `ชื่อเพลง: กลิ่นขี้เลื่อยในเสื้อตัวเก่า (Father's Sawdust Shirt)
คำพาดหัวสะกิดใจ: พ่อสร้างบ้านหลังโตให้คนมานอน... แต่วันลูกกลับบ้าน เพิงไม้เก่าไม่มีพ่อรอรับ 💔
ประโยคหมุดทองคำ: พ่อสร้างบ้านหลังงามให้คนอื่นอยู่ / แต่เพิงเรากันฝนยังไม่น่าดู / วันนี้ได้กอดพ่อเพียงแค่ในฝัน (ฮือ...) / เหลือเสื้อเปื้อนขี้เลื่อยไว้ดูต่างกัน
Style of Music: Thai warm acoustic folk-soul, fingerstyle guitar, soft 808, emotional male vocal, clear melody, catchy hook, 78 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Tender Intimate Male Baritone, Close-Mic Guitar Entry, Soaring Chorus, No Spoken]

[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Spoken]
เสียงกบไสไม้ในเพิงเก่า, วันนี้เงียบเหงาเกินทน,
ตลับเมตรยังวางนิ่ง, ข้างรอยนิ้วที่เปื้อนฝุ่นปน,
เสื้อยืดพ่อแขวนตรงเสา, ยังมีกลิ่นไม้ติดจาง,
ฝ่ามือหยาบกร้านคู่นั้น, เคยจูงลูกข้ามทุกทาง,
แผลเป็นบนข้อมือพ่อ, แลกค่าเทอมให้ลูกเรียน,
พ่อไม่เคยบ่นว่าท้อ, ยอมตากแดดจนตัวเกรียม,
คืนฝนสาดเพิงไม้เก่า, พ่อกอดลูกบังลมหนาว,
ส่งลูกเข้าเมืองตามฝัน, ทั้งที่หลังพ่อปวดร้าว

[Pre-Chorus 1: Rising Note Lift, Sustained Open Vowels]
ซองเงินเดือนใบแรกนี้, ลูกกำไว้จนมือสั่น,
รีบนั่งรถกลับเพิงไม้, หวังเห็นพ่อเป็นคนแรกกัน,
แต่หน้าบ้านกลับว่างเปล่า, เงาที่คอยไม่มีอีกเลย,
ได้ยินเพียงเสียงลมพัด, พาความเศร้ามาเฉลย

[Chorus 1: Stacked Harmony Anthem, Antithesis Flip Hook, Catchy]
พ่อสร้างบ้านหลังงาม, ให้คนอื่นนอนสบาย,
แต่เพิงเรากันฝน, พ่อทนอยู่จนวันตาย (ฮือ...)
วันนี้ได้กอดพ่อ, เพียงแค่ในฝัน,
เหลือเสื้อเปื้อนขี้เลื่อย, ไว้ดูต่างกัน (โอ้...)
มือหยาบกร้านส่งลูก, จนถึงเส้นชัย,
แต่ไม่มีวันนั้น, ให้ลูกกราบเท้ากราบใจ,
ซองเงินขาวที่ถือมา, ไร้คนรับคืน,
วางหน้ารูปพ่อทั้งน้ำตา, ในคืนสะอื้น!

[Verse 2: Gear-Shift Rhythmic Sing-Rap, Tight Internal Rhymes - No Spoken]
เปิดกล่องเครื่องมือสีซีด, หยิบสิ่วเก่าที่คุ้นมือ,
ดินสอไม้ยังทัดข้างกล่อง, เหมือนพ่อรอตอกงานคือ,
จดตัวเลขบนเศษไม้, คำนวณค่าใช้จ่ายทุกเดือน,
อดมื้อกินมื้อเงียบงัน, ซ่อนความเหนื่อยไม่ให้ลูกเตือน,
ภาพถ่ายขาวดำข้างฝา, ยังยิ้มอ่อนอย่างใจดี,
มองลูกชายที่ยืนร้อง, ด้วยหัวใจที่เต็มศักดิ์ศรี,
คำสอนสั้นเพียงไม่กี่คำ, ไม่ต้องรวยขอเพียงซื่อตรง,
ฝังแน่นลงกลางหัวใจ, เป็นเข็มทิศให้ยืนมั่นคง

[Pre-Chorus 2: Higher Tension Swell, Brand-New Lyrics]
จุดธูปหอมหนึ่งดอกเล็ก, ก้มกราบลงข้างตลับเมตรเก่า,
หยาดน้ำตาหยดลงพื้นดิน, ซึมซับรักที่พ่อให้เรา,
เสียงตอกตะปูในวันวาน, ยังดังก้องอยู่ในความจำ,
ลูกจะสานต่อชีวิตนี้, ให้สมรักที่พ่อกระทำ

[Chorus 2: Returning Earworm Hook, Layered Ad-Libs & Deeper Payoff]
พ่อสร้างบ้านหลังงาม, ให้คนอื่นนอนสบาย,
แต่เพิงเรากันฝน, พ่อทนอยู่จนวันตาย (ฮือ...)
วันนี้ได้กอดพ่อ, เพียงแค่ในฝัน,
เหลือเสื้อเปื้อนขี้เลื่อย, ไว้ดูต่างกัน (โอ้...)
เหนื่อยแค่ไหนไม่เคยท้อ, ยิ้มรับแดดฝน,
สร้างเกียรติภูมิให้ลูกยืน, ไม่อายผู้คน,
แม้ไม่ได้เอ่ยคำรัก, สักครั้งก่อนลา,
แต่ทุกแผลบนมือพ่อ, บอกรักเกินคำพูดจา!

[Bridge: Stripped-Back Confession Rising to Octave Climax]
หากเวลาย้อนหมุนกลับได้, ขอเพียงสักหนึ่งนาที,
อยากกอดแผ่นหลังเปื้อนเหงื่อ, แล้วกระซิบบอกพ่อคนดี,
ว่าวันนี้ลูกเข้มแข็งแล้ว, ดูแลตัวเองได้มั่นใจ,
หลับให้สบายนะพ่อจ๋า, ไม่ต้องห่วงลูกคนนี้เลย!

[Final Chorus: Full Band Goosebumps Anthem, Stacked Harmonies & Golden Punchline]
พ่อสร้างบ้านหลังงาม, ให้คนอื่นนอนสบาย,
แต่เพิงเรากันฝน, พ่อทนอยู่จนวันตาย (ฮือ...)
วันนี้ได้กอดพ่อ, เพียงแค่ในฝัน,
เหลือเสื้อเปื้อนขี้เลื่อย, ไว้ดูต่างกัน (โอ้...)
ซองเงินแรกวางตรงหน้า, คือสัญญาจากใจลูกชาย,
จะเดินตามรอยความซื่อตรง, ที่พ่อฝากไว้ไม่เสื่อมคลาย,
ขอบคุณฟ้าที่ให้ลูก, เกิดในอ้อมแขนพ่อคนนี้,
หลับตาลงให้สบายเถิด, ลูกจะรักและกตัญญูทุกปี!

[Outro: Strip Beat, Bare Acoustic Echo & Fade Out - No Spoken]
กลิ่นขี้เลื่อยจางลงในแสงเช้า, เสื้อตัวเก่าลูกยังเก็บรักษา,
กอดพ่อผ่านลมหายใจ, และอยู่ในใจตลอดเวลา...

[End]`,
    love: `ชื่อเพลง: โต๊ะเดิมในร้านกาแฟวันฝนพรำ (Rainy Café First Light)
คำพาดหัวสะกิดใจ: ข้างนอกมีเม็ดฝนโปรยเย็น... แต่แค่เธอสบตา โลกทั้งใบก็อุ่นขึ้นมาทันที ☕✨
ประโยคหมุดทองคำ: ข้างนอกพายุฝนเทลงมา / แต่ข้างในอุ่นเมื่อได้สบตา (โอ้...) / จากคนแปลกหน้าในร้านกาแฟ / กลายเป็นคนเดียวที่หัวใจดูแล
Style of Music: Modern Thai Pop-R&B soul, warm rhodes, fingerstyle guitar, 808 sub, airy female vocal, catchy hook, 84 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Airy Warm Female Pop-R&B, Sparse Rhodes Entry -> Lush Groove, Stacked Hook, No Spoken]

[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Spoken]
แก้วลาเต้อุ่นวางข้างกระจกใส, เม็ดฝนข้างนอกโปรยไม่ขาดสาย,
คนเดินกางร่มผ่านไปเรียงราย, เหลือเพียงฉันนั่งมองอย่างเดียวดาย,
เสียงกระดิ่งหน้าประตูดังแผ่ว, เธอสะบัดร่มคันน้อยเดินเข้ามา,
พอมุมโต๊ะข้างฉันว่างพอดี, จังหวะใจเต้นแรงตอนสบตา,
รอยยิ้มอ่อนที่เธอส่งมาทัก, เหมือนแดดอุ่นละลายลมหนาวพลัน,
เสียงฝนที่เคยฟังดูเงียบเหงา, กลับกลายเป็นทำนองหวานข้างฉัน,
ไม่ต้องพูดคำคมให้มากมาย, แค่ได้สั่งเค้กจานเล็กข้างเธอ,
ความสบายใจก่อตัวง่ายดาย, เหมือนรู้จักกันก่อนจะได้เจอ

[Pre-Chorus 1: Rising Note Lift, Sustained Open Vowels]
จากคนแปลกหน้าที่หลบฝนพรำ,
กลายเป็นภาพจำที่เฝ้ารอคอย,
ประตูหัวใจที่เคยปิดล็อก,
ค่อยแง้มออกเมื่อได้ยิ้มให้เธอ

[Chorus 1: Stacked Harmony Anthem, Antithesis Flip Hook, Catchy]
ข้างนอกพายุฝนเทลงมา,
แต่ข้างในอุ่นเมื่อได้สบตา (โอ้...)
จากคนแปลกหน้าในร้านกาแฟ,
กลายเป็นคนเดียวที่หัวใจดูแล,
ไม่ต้องมีคำสัญญาใหญ่โต,
แค่เดินตากฝนไม่ทิ้งกันไป (ฮือ...)
โลกจะหมุนเปลี่ยนผันสักเพียงใด,
แค่มีเธอก็อุ่นทั้งหัวใจ!

[Verse 2: Gear-Shift Rhythmic Sing-Rap, Tight Internal Rhymes - No Spoken]
จากวันอังคารเราก็มักมาซ้ำ, เก้าอี้ไม้ตัวเดิมมุมประจำ,
เธอชอบกินโกโก้ไม่หวานนำ, ฉันแอบสั่งไว้รอทุกบ่ายค่ำ,
งานหนักแค่ไหนจนแทบหมดไฟ, แค่เธอเล่าเรื่องตลกเบาใจ,
เสียงหัวเราะของเธอช่วยซับแรง, เติมพลังให้พรุ่งนี้สดใส,
ไม่ต้องแต่งตัวหรูเพื่ออวดกัน, ไม่ต้องฝืนเป็นใครให้เหนื่อยใจ,
แค่นั่งดูฝนซาข้างหน้าต่าง, แค่นี้ก็อุ่นกว่าแสงไฟใด,
เปลี่ยนความบังเอิญที่ดูธรรมดา, ให้กลายเป็นวันพิเศษทุกเวลา,
จับมือฉันไว้ใต้ร่มคันเก่า, เดินเคียงกันตั้งแต่เช้าจรดค่ำ

[Pre-Chorus 2: Higher Tension Swell, Brand-New Lyrics]
ต่อให้ฤดูหมุนเวียนเปลี่ยนผ่านไป,
ความอ่อนโยนแรกไม่เคยจางหาย,
ทุกครั้งที่กลิ่นกาแฟลอยข้างทาง,
ยังนึกถึงเธอคนเดิมไม่เสื่อมคลาย

[Chorus 2: Returning Earworm Hook, Layered Ad-Libs & Deeper Payoff]
ข้างนอกพายุฝนเทลงมา,
แต่ข้างในอุ่นเมื่อได้สบตา (โอ้...)
จากคนแปลกหน้าในร้านกาแฟ,
กลายเป็นคนเดียวที่หัวใจดูแล,
วันพรุ่งนี้ฟ้าจะมืดหรือใส,
มือคู่นี้พร้อมจับไม่ห่างไกล (ฮือ...)
ความเรียบง่ายที่ไม่ต้องเติมใด,
คือความรักล้ำค่ากลางเมืองใหญ่!

[Bridge: Stripped-Back Confession Rising to Octave Climax]
ไม่เคยรู้เลยว่าความสุขแท้จริง, หน้าตาอบอุ่นเป็นเช่นไร,
จนวันที่เธอเอียงร่มบังลมฝน, ยอมให้ไหล่ตัวเองเปียกแทนฉันไป,
ไม่ต้องมองหาใครให้เสียเวลา, แค่มีเธอตรงหน้าก็อุ่นในใจ,
วินาทีนั้นหัวใจก็ตอบชัด, ว่านี่แหละคือคนที่รอคอยมานาน!

[Final Chorus: Full Band Goosebumps Anthem, Stacked Harmonies & Golden Punchline]
ข้างนอกพายุฝนเทลงมา,
แต่ข้างในอุ่นเมื่อได้สบตา (โอ้...)
จากคนแปลกหน้าในร้านกาแฟ,
กลายเป็นคนเดียวที่หัวใจดูแล,
กางร่มเดินไปด้วยกันทุกฤดู,
อยู่ดูแลกันจนผมเปลี่ยนสีไป (โอ้...)
รักเธอธรรมดาแต่ซื่อตรงในใจ,
ไม่มีวันไหนที่คิดจะเปลี่ยนเลย!

[Outro: Strip Beat, Bare Acoustic Echo & Fade Out - No Spoken]
เสียงกระดิ่งร้านดังแว่วในแสงอ่อน, เก้าอี้สองตัวเคียงข้างกันเสมอ,
ขอบคุณเม็ดฝนวันนั้นที่พาเจอ, ให้วันนี้มีคำว่าเราตลอดไป...

[End]`,
    rain: `ชื่อเพลง: ไฟนีออนกับซองบะหมี่ตอนตีสอง (Neon Rain & 2AM Reflection)
คำพาดหัวสะกิดใจ: นอนมองเพดานห้องเช่าตอนตีสอง... ไม่โกรธที่เธอไป แค่ภาวนาให้คนใหม่ใจดีกับเธอ 🌧️
ประโยคหมุดทองคำ: เมื่อก่อนร่มคันเล็กยังกันฝนไหว / แต่วันนี้ใต้ฟ้ากว้างกลับหนาวใจ (ฮือ...) / คืนฝนพรำที่หน้าต่างไร้เธอ / หัวใจยังเผลออวยพรอยู่เสมอ
Style of Music: Dark jazz boom-bap meets R&B, moody piano, crisp snare, baritone male rap & soul chorus, catchy hook, 86 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Dry Conversational Baritone Rap Verses, Soaring Soul R&B Chorus, No Spoken]

[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Spoken]
ตีสองห้องเช่าเปิดไฟนีออน, แก้วกาแฟขมเย็นชืดบนโต๊ะนอน,
ซองบะหมี่เปล่าวางข้างริมหน้าต่าง, เสียงฝนเคาะกระจกในความอ้างว้าง,
เคยเบียดไหล่ใต้ร่มคันเล็กด้วยกัน, หารค่ารถเมล์ตอนสิ้นเดือนทุกวัน,
หัวเราะท่ามกลางทางเท้าเปียกปอน, ไม่เคยคิดว่าจะมีวันที่ต้องซ่อน,
แต่วันนี้เดินลำพังใต้แสงไฟ, ไหล่ข้างซ้ายเปียกชื้นถึงข้างใน,
ไม่มีข้อความทักมาถามกินข้าว, เหลือแค่รูปเก่าในหน้าจอสีเทา,
ไม่คิดโทษชะตาหรือกล่าวหาใคร, แค่ยอมรับความจริงอย่างเข้าใจ,
เก็บคำอวยพรไว้ในมุมเงียบงัน, หวังเพียงเธอพบวันใหม่ที่สดใส

[Pre-Chorus 1: Rising Note Lift, Sustained Open Vowels]
วันเวลาพัดเราห่างกันสุดสายตา,
เหลือเพียงความหวังดีที่ไม่เลือนลา,
คืนที่ลมหนาวพัดหนักกว่าทุกคราว,
ได้แต่ถามดวงดาวว่าเธอสุขใจดีไหม

[Chorus 1: Stacked Harmony Anthem, Antithesis Flip Hook, Catchy]
เมื่อก่อนร่มคันเล็ก, ยังกันฝนได้ไหว,
แต่วันนี้ฟ้ากว้าง, กลับหนาวสั่นในใจ (ฮือ...)
คืนฝนพรำตรงหน้าต่าง, ที่ว่างไร้เธอ,
หัวใจยังเผลออวยพร, อยู่เสมอ (โอ้...)
ไม่เสียใจเลยที่เคย, รักเธอหมดใจ,
ขอบคุณทุกวันเวลา, ที่ผ่านมาด้วยกัน,
ขอให้ทางเดินใหม่, มีแต่คนจริงใจ,
ฝนซาเมื่อไร, ขอให้เธอยิ้มได้!

[Verse 2: Gear-Shift Rhythmic Sing-Rap, Tight Internal Rhymes - No Spoken]
เลื่อนดูรูปถ่ายเก่าริมทางเดิม, เปิดเพลงโปรดเก่ากล่อมใจให้เคลิ้ม,
เมืองใหญ่ยามค่ำคนต่างรีบเดิน, ต่างซ่อนแผลไว้ข้างในไม่ให้ประเมิน,
จดหมายไม่เคยส่งเก็บไว้ในลิ้นชัก, ปลอบใจตัวเองว่าคนเราย่อมรู้จัก,
รู้จักพบเจอเพื่อเรียนรู้การปล่อยวาง, ไม่ขวางความสุขคนที่เคยร่วมทาง,
น้ำขังริมฟุตบาทสะท้อนแสงนีออน, สอนให้ยืนแกร่งไม่หวนคืนคำงอน,
หากวันไหนเธอเหนื่อยจากโลกภายนอก, จำไว้ตรงนี้เคยมีคนคอยปลอบ,
ส่งแรงใจผ่านสายฝนแสนไกล, ให้เธอเจอคนคอยห่วงใยทุกวัน,
ส่วนคนตรงนี้ขอเดินต่อไป, เก่งขึ้นกว่าเดิมและไม่เสียใจกับมัน

[Pre-Chorus 2: Higher Tension Swell, Brand-New Lyrics]
หยดน้ำบนกระจกช่วยชะล้างน้ำตา,
ปล่อยความเหงาละลายไปกับห้วงเวลา,
เหลือเพียงรอยยิ้มจางให้ภาพจำเดิม,
พร้อมก้าวไปเผชิญเช้าวันใหม่ข้างหน้า

[Chorus 2: Returning Earworm Hook, Layered Ad-Libs & Deeper Payoff]
เมื่อก่อนร่มคันเล็ก, ยังกันฝนได้ไหว,
แต่วันนี้ฟ้ากว้าง, กลับหนาวสั่นในใจ (ฮือ...)
คืนฝนพรำตรงหน้าต่าง, ที่ว่างไร้เธอ,
หัวใจยังเผลออวยพร, อยู่เสมอ (โอ้...)
ขอให้ทุกเช้าเธอตื่น, อย่างสดใสกว่าเดิม,
เจอคนที่ดูแลใจ, ไม่ต้องทนซ้ำเติม,
แม้คืนนี้ต้องนั่งเหงา, เพียงคนเดียวลำพัง,
ยังภูมิใจในวันหนึ่ง, ที่เคยรักกัน!

[Bridge: Stripped-Back Confession Rising to Octave Climax]
อาจมีบางคืนที่เผลอนึกขึ้นมา,
ตอนฝนเทลงมาไม่ทันได้เตรียมใจ,
แต่พอรู้ว่าตรงนั้นเธอยิ้มได้เต็มที่,
แค่นี้ฉันก็ปล่อยวางลงได้อย่างดี!

[Final Chorus: Full Band Goosebumps Anthem, Stacked Harmonies & Golden Punchline]
เมื่อก่อนร่มคันเล็ก, ยังกันฝนได้ไหว,
แต่วันนี้ฟ้ากว้าง, กลับหนาวสั่นในใจ (ฮือ...)
คืนฝนพรำตรงหน้าต่าง, ที่ว่างไร้เธอ,
หัวใจยังเผลออวยพร, อยู่เสมอ (โอ้...)
เก็บเรื่องราวเราไว้เป็น, ภาพทรงจำแสนงาม,
เดินหน้าต่ออย่างมั่นคง, ข้ามคืนอันมืดครึ้ม (โอ้...)
โชคดีนะคนเคยรัก, ขอบคุณทุกนาที,
ฉันยังหวังดีเสมอ, แม้ฝนหยุดตกแล้ว!

[Outro: Strip Beat, Bare Acoustic Echo & Fade Out - No Spoken]
ไฟนีออนหน้าต่างค่อยหรี่แสงลง, แสงแดดเช้าสาดส่องผ่านม่านฝนบาง,
โชคดีนะคนไกล... จากคนที่ยังยิ้มให้เธอในความทรงจำ...

[End]`,
    rock: `ชื่อเพลง: แผลบนปลายนิ้วกับคอร์ดสุดท้าย (Calloused Fingers Anthem)
คำพาดหัวสะกิดใจ: คนหัวเราะเยาะหาว่าเพ้อฝัน... แต่เลือดบนสายกีตาร์เก่า จะพาเรายืนบนเวทีจริง ⚡🎸
ประโยคหมุดทองคำ: พวกเขาเห็นแค่คนแพ้ในห้องเช่าเก่า / แต่ไม่เห็นไฟที่เผาใจของพวกเรา (เฮ้!) / ต่อให้ล้มร้อยครั้ง ก็จะลุกขึ้นยืน / ต่อให้มืดทั้งคืน ก็จะฝืนเดินไป!
Style of Music: Thai clean-to-overdriven pop-rock, crisp guitar, tight drums, gritty male vocal, catchy chorus, 90 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Clean Intimate Rock Verse -> Overdriven Gritty Male Anthem Chorus, No Spoken]

[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Spoken]
ห้องเช่าสี่เหลี่ยมแคบ, กีตาร์โปร่งสายสนิมเกาะ,
ซ้อมจนปลายนิ้วด้าน, แต่ใจยังไม่เคยจะท้อ,
หน้าเวทีร้านเล็ก, คนคุยกันเสียงดังกลบเพลง,
ค่าแรงไม่กี่ร้อย, ยังกัดฟันยิ้มบอกตัวเอง,
เสียงหัวเราะโต๊ะข้าง, ถามเมื่อไรจะเลิกเพ้อเจ้อ,
เก็บคำหมิ่นเหล่านั้น, มาเป็นเชื้อเพลิงจุดประกายเสมอ,
รองเท้าขาดคู่เดิม, เดินตากฝนกลับห้องตอนเที่ยงคืน,
ไม่มีเส้นสายใด, มีแค่ฝันที่ไม่ยอมกลืน

[Pre-Chorus 1: Rising Note Lift, Sustained Open Vowels]
เมฆดำปกคลุมฟ้า, ไม่เคยขู่ให้ใจหวั่นไหว,
แผลเป็นบนปลายนิ้ว, ย้ำทุกก้าวที่แลกมาได้,
คนไม่เคยหกล้ม, ย่อมไม่ซึ้งรสของการลุกยืน,
คืนนี้ขอใส่สุดแรง, ไม่ยอมแพ้ความมืดทั้งคืน!

[Chorus 1: Stacked Harmony Anthem, Antithesis Flip Hook, Catchy]
เขาเห็นแค่คนแพ้, ในห้องเช่ามืดมัว,
แต่ไม่เห็นเปลวไฟ, ในใจคนไม่กลัว (เฮ้!)
ต่อให้ล้มร้อยครั้ง, ก็จะลุกขึ้นยืน,
ต่อให้มืดทั้งคืน, ก็จะฝืนเดินไป,
เลือดนักสู้ยังเต้น, แรงอยู่ในหัวใจ (โอ้...)
ไม่ถึงเส้นชัย, ไม่มีวันถอยกลับ,
ฟ้าคำรามขวางทาง, สองมือยันเอาไว้,
ขอเดิมพันด้วยฝัน, จนสุดปลายหัวใจ!

[Verse 2: Gear-Shift Rhythmic Sing-Rap, Tight Internal Rhymes - No Spoken]
จำคืนฝนตกซัด, นั่งกินบะหมี่คนละชาม,
แบ่งปิ๊กแบ่งคอร์ดซ้อม, ไม่กลัวคำคนคอยประณาม,
เพื่อนวนเวียนข้างกาย, ตบไหล่สู้เมื่อแสงไฟดับ,
ไม่มีตั๋วทางลัด, จับไมค์แน่นแล้วก้าวขยับ,
จากคนดูสามคน, หน้ามุมเสาที่เงียบเหงา,
จนสปอตไลต์สาดส่อง, เผยตัวตนในคืนของเรา,
ทุกหยาดเหงื่อร่วงพื้น, คืนกลับมาเป็นแรงกระแทกกลอง,
เสียงก้องจากห้องเช่า, พุ่งทะลุสู่เวทีทอง

[Pre-Chorus 2: Higher Tension Swell, Brand-New Lyrics]
ฟังสิเสียงหัวใจ, เต้นกระหน่ำสอดรับเสียงกลอง,
ความเหนื่อยล้าวันวาน, กลายเป็นเกราะคุ้มกันปกป้อง,
ข้ามกำแพงคำดูถูก, ที่คอยฉุดรั้งเรามาไกล,
วันนี้พร้อมขึ้นยืน, ตะโกนฝันกลางแสงไฟ!

[Chorus 2: Returning Earworm Hook, Layered Ad-Libs & Deeper Payoff]
เขาเห็นแค่คนแพ้, ในห้องเช่ามืดมัว,
แต่ไม่เห็นเปลวไฟ, ในใจคนไม่กลัว (เฮ้!)
ต่อให้ล้มร้อยครั้ง, ก็จะลุกขึ้นยืน,
ต่อให้มืดทั้งคืน, ก็จะฝืนเดินไป,
ไม่ยอมขายจิตวิญญาณ, แลกทางเดินแสนง่าย (โอ้...)
ยืนหยัดด้วยลายเซ็น, ที่ไม่มีใครเลียนได้,
ทุกคำดูถูกเมื่อวาน, เป็นเหมือนแรงผลักดัน,
ส่งเราพุ่งมาถึง, จุดที่ใครคาดไม่ทัน!

[Bridge: Stripped-Back Confession Rising to Octave Climax]
ในวันที่เหนื่อยล้า, จนแทบทรุดลงกลางเวที,
มองกลับไปหาเด็ก, ที่จับกีตาร์ในคืนวันนั้นอีกที,
อยากบอกเขาด้วยรอยยิ้ม, ขอบคุณนะที่ไม่เคยถอยหนี,
ความฝันวันนั้น, กำลังดังก้องโลกคืนนี้!

[Final Chorus: Full Band Goosebumps Anthem, Stacked Harmonies & Golden Punchline]
เขาเห็นแค่คนแพ้, ในห้องเช่ามืดมัว,
แต่ไม่เห็นเปลวไฟ, ในใจคนไม่กลัว (เฮ้!)
ต่อให้ล้มร้อยครั้ง, ก็จะลุกขึ้นยืน,
ต่อให้มืดทั้งคืน, ก็จะฝืนเดินไป,
ชูมือขึ้นฟ้ากว้าง, ตะโกนก้องออกไปให้ไกล (โอ้...)
บอกคนทั้งโลกว่าฝัน, คนธรรมดาเป็นจริงได้,
สองมือเปล่านี้แหละ, คว้าแสงดาวมาด้วยหัวใจ,
ชัยชนะเป็นของคน, ที่ไม่เคยถอยกลับไป!

[Outro: Strip Beat, Bare Acoustic Echo & Fade Out - No Spoken]
ปลายนิ้วด้านชาดีดคอร์ดเดิม, บนเวทีที่เคยได้แค่ฝัน,
เดินหน้าต่ออย่าหยุดฝัน, เส้นชัยรอคนจริงอยู่ตรงนั้น...

[End]`
  };

  // Export as Agent SKILL.md
  const handleExportSkill = () => {
    const skillContent = `---
name: suno-v6-mini-hit-songwriter
description: บรมครูนักแต่งเพลงฮิต Suno v6 - Mini (v129.0 True 3-Artist Trinity Auto-AI) เปลี่ยนเกียร์ 4 มิติ ไม่มีท่อน Intro/Solo และไร้ท่อนพูด 100% <= 4,500 ตัวอักษร
---

${SUNO_GRANDMASTER_SYSTEM_PROMPT}`;

    const blob = new Blob([skillContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SKILL.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    triggerBadge("skill", 2500);
  };

  // Live Forensic Audit Prompt (Stage 2 - 1st Audit)
  const liveAuditPrompt = useMemo(() => {
    const lyricsToUse = extractLyrics(outputResult) || outputResult.trim();
    return buildSunoAuditRefinePrompt({
      lyrics: lyricsToUse || undefined,
      focus: auditFocus,
      storyContext: story.trim(),
      vocalStyle: vocalStyle.trim(),
    });
  }, [outputResult, auditFocus, story, vocalStyle]);

  // Live Final Master Audit Prompt (Stage 3 - Final Master Audit)
  const liveFinalAuditPrompt = useMemo(() => {
    const lyricsToUse = extractLyrics(outputResult) || outputResult.trim();
    return buildSunoFinalMasterAuditPrompt({
      lyrics: lyricsToUse || undefined,
      storyContext: story.trim(),
      vocalStyle: vocalStyle.trim(),
    });
  }, [outputResult, story, vocalStyle]);

  // Live Hit Song Quality, Zero-Intro, Zero-Solo, Suno <= 5,000 Chars & Natural Thai Scanner (v126.0)
  const lyricAuditSummary = useMemo(() => {
    const rawLyrics = extractLyrics(outputResult);
    if (!rawLyrics) return null;

    const charCount = rawLyrics.length;
    const isWithinSunoLimit = charCount <= 5000;
    const isSafeUnderSunoLimit = charCount <= 4500;

    const rawLines = rawLyrics.split(/\r?\n/).map((l) => l.trim());
    const lines: string[] = [];
    const nonChorusLines: string[] = [];
    let inChorus = false;

    for (const line of rawLines) {
      if (!line || line.startsWith("#") || line.startsWith("*") || line.startsWith("-")) continue;
      if (line.startsWith("[")) {
        if (/^\[(Final\s+)?Chorus\b/i.test(line) && !/Pre-Chorus/i.test(line)) {
          inChorus = true;
        } else if (/^\[(Verse|Pre-Chorus|Bridge|Outro|Intro|Instrumental|Solo|Interlude|Beat\s+Switch|Transition|End)/i.test(line)) {
          inChorus = false;
        }
        continue;
      }
      lines.push(line);
      if (!inChorus) {
        nonChorusLines.push(line);
      }
    }

    const chorusCount = (rawLyrics.match(/\[(Final\s+)?Chorus/gi) || []).length;
    const hasIntroTag = /^\[Intro\b[^\]]*\]/im.test(rawLyrics);
    const hasSoloTag = /^\[(?!.*\b(?:no|without|zero)\s+(?:solo|interlude|instrumental\s+break))[^\]]*\b(?:solo|interlude|instrumental\s+break)\b[^\]]*\]/im.test(
      rawLyrics
    );
    const beatAlignedLines = lines.filter(isLineBeatAligned).length;
    const breathRatio = lines.length > 0 ? Math.round((beatAlignedLines / lines.length) * 100) : 100;

    // Duplicate line count inside Verses / Pre-Chorus / Bridge / Outro (Chorus Signature Hook repetition is preserved!)
    const seen = new Map<string, number>();
    let duplicateLineCount = 0;
    for (const line of nonChorusLines) {
      const norm = line.replace(/[,.\s!?"'…]/g, "");
      if (norm.length >= 6) {
        const c = (seen.get(norm) || 0) + 1;
        seen.set(norm, c);
        if (c > 1) duplicateLineCount++;
      }
    }

    // Spoken word tag check
    const spokenMatches = rawLyrics.match(/\[(Spoken|Narration|Monologue|Talking|Speech|Dialogue|พูด|บทพูด)[^\]]*\]/gi) || [];

    // Estimated duration in minutes:seconds (~3.7s per line + ~12s smooth transitions, no solo interlude)
    const estTotalSec = Math.round(lines.length * 3.7 + (lines.length >= 40 ? 12 : 8));
    const estMin = Math.floor(estTotalSec / 60);
    const estSec = (estTotalSec % 60).toString().padStart(2, "0");
    const estDurationStr = `${estMin}:${estSec} นาที`;

    const redupMatches =
      rawLyrics.match(
        /(เล็กเล็ก|เบาเบา|ซ้ำซ้ำ|ไกลไกล|นานนาน|ช้าช้า|เร็วเร็ว|ไปไป|มามา|ดีดี|ค่อยค่อย|เดินเดิน|มองมอง|คิดคิด|ทำทำ|วันวัน|ใครใคร|บางบาง|เงียบเงียบ|เปล่าเปล่า)/g
      ) || [];
    const bracketClutter = rawLyrics.match(/\((?:สัมผัส|เสียง|หมายเหตุ)[^)]*\)/g) || [];
    const weirdPhrases = detectWeirdOrForcedThaiPhrases(rawLyrics, story);

    return {
      totalLines: lines.length,
      charCount,
      isWithinSunoLimit,
      isSafeUnderSunoLimit,
      estDurationStr,
      isOptimalLength: lines.length >= 44,
      hasIntroTag,
      hasSoloTag,
      chorusCount,
      breathRatio,
      duplicateLineCount,
      spokenCount: spokenMatches.length,
      redupCount: redupMatches.length,
      clutterCount: bracketClutter.length,
      weirdPhrases,
      weirdCount: weirdPhrases.length,
      isClean:
        !hasIntroTag &&
        !hasSoloTag &&
        isWithinSunoLimit &&
        redupMatches.length === 0 &&
        bracketClutter.length === 0 &&
        weirdPhrases.length === 0 &&
        duplicateLineCount === 0 &&
        spokenMatches.length === 0,
    };
  }, [outputResult, story]);

  // 1-Click Auto-Clean & Polish Lyrics for Suno (Cleans Intro, Solo/Interlude tags, spoken tags, archaic clichés & double syllables!)
  const handleAutoCleanLyrics = () => {
    if (!outputResult) return;
    let cleaned = outputResult
      .replace(/\((?:สัมผัส|เสียง|หมายเหตุ|ไรม์)[^)]*\)/gi, "")
      .replace(/\[(เสียง|สัมผัส):[^\]]*\]/gi, "")
      .replace(/\[(Spoken|Narration|Monologue|Talking|Speech|Dialogue)[^\]]*\]/gi, "[Verse: 100% Sung Melodic Vocal - No Spoken]")
      .replace(
        /^[ \t]*\[(?!.*\b(?:no|without|zero)\s+(?:solo|interlude|instrumental\s+break))[^\]]*\b(?:solo|interlude|instrumental\s+break)\b[^\]]*\][ \t]*\r?\n?/gim,
        ""
      )
      .replace(/Soft Instrumental Fade(?:\s*Out)?/gi, "Soft Fade Out");

    if (/\[Verse\s*1\b/i.test(cleaned)) {
      cleaned = cleaned.replace(/^[ \t]*\[Intro\b[^\]]*\][ \t]*\r?\n?/gim, "");
    } else {
      cleaned = cleaned.replace(
        /^\[Intro\b[^\]]*\]/gim,
        "[Verse 1: 2-Bar Pick-up, Direct Melodic Entry - No Intro, No Spoken]"
      );
    }

    cleaned = cleaned
      .replace(/จิตตั้ง(?:มั่น)?/g, "ตั้งใจมั่น")
      .replace(/ใจหมาย/g, "มุ่งหวังในใจ")
      .replace(/หมายใจ/g, "ตั้งใจไว้")
      .replace(/(?<!บั่น)ทอนกำลัง(?!ใจ)/g, "บั่นทอนกำลังใจ")
      .replace(/คนหลอกมา/g, "คนที่เข้ามาหลอก")
      .replace(/คำจา|วจีจา/g, "คำพูดจา")
      .replace(/ลูกยา/g, "ลูกรัก")
      .replace(/วิญญาณ์/g, "หัวใจ")
      .replace(/ชีวิน/g, "ชีวิต")
      .replace(/อาจินต์/g, "ทุกวัน")
      .replace(/มโนมั่น/g, "ตั้งใจมั่น")
      .replace(/ชั่วนิรันดร์กาล/g, "ตลอดไป")
      .replace(/แอบอ้างบรรเทา,\s*เศร้าหมองบังใบ/g, "แอบอ้างค้ำจุน, เอาบุญบังหน้า")
      .replace(/แอบอ้างบรรเทา,\s*เอาบุญบังใบ/g, "แอบอ้างค้ำจุน, เอาบุญบังหน้า")
      .replace(/เศร้าหมองบังใบ|เอาบุญบังใบ/g, "เอาบุญบังหน้า")
      .replace(/บุญแท้สร้างคน,\s*บุญกลสร้างโจร/g, "บุญแท้ช่วยคน, บุญปลอมช่วยโจร")
      .replace(/บุญกล/g, "บุญปลอม")
      .replace(/ล่อมองเรี่ยไร/g, "ล่อลวงเรี่ยไร")
      .replace(/หว่านขานคำลวง/g, "หว่านล้อมคำลวง")
      .replace(/น้ำค้างเปรมปรีดิ์/g, "น้ำค้างใสพราว")
      .replace(/ชื่อมูลนิ,\s*บังตาผู้คน/g, "ป้ายการกุศล, บังตาผู้คน")
      .replace(/มูลนิ(?!ธิ)/g, "การกุศล")
      .replace(/เล็กเล็ก/g, "เล็กน้อย")
      .replace(/เบาเบา/g, "แผ่วเบา")
      .replace(/ซ้ำซ้ำ/g, "ตอกย้ำ")
      .replace(/ไกลไกล/g, "แสนไกล")
      .replace(/นานนาน/g, "เนิ่นนาน")
      .replace(/ช้าช้า/g, "เนิบนาบ")
      .replace(/ดีดี/g, "งดงาม")
      .replace(/ค่อยค่อย/g, "เริ่มจะ")
      .replace(/บางบาง/g, "อ่อนโยน")
      .replace(/เงียบเงียบ/g, "ลำพัง")
      .replace(/เปล่าเปล่า/g, "เพียงลำพัง")
      .replace(/(\r?\n){3,}/g, "\n\n");
    setOutputResult(cleaned);
  };

  // Extract lyrics and forward to next tab
  const handlePassToMv = () => {
    const extractedLyrics = extractLyrics(outputResult);
    let extractedTitle = "บทเพลงระดับตำนาน";

    if (/ชื่อเพลง[*_`]*\s*[:：]/i.test(outputResult)) {
      extractedTitle = extractTitle(outputResult);
    } else if (story.trim()) {
      const firstLine = stripMd(story.trim().split("\n")[0]);
      if (firstLine.length > 2) {
        extractedTitle = firstLine.slice(0, 24);
      }
    }

    onSendToMv({
      title: extractedTitle,
      lyrics: extractedLyrics || story,
      mood: mood,
      tempo: isAutoMusical ? "AUTO" : tempo,
      key: isAutoMusical ? "AUTO" : key,
      flowStyle,
      rhymeIntensity,
      credit: "megapoomz",
      hookHeadline: /คำพาดหัวสะกิดใจ[*_`]*\s*[:：]/i.test(outputResult) ? extractHook(outputResult) : undefined,
    });
  };

  return (
    <div className="space-y-8">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-slate-900/40 border border-fuchsia-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-fuchsia-600/20 rounded-xl border border-fuchsia-500/30 text-fuchsia-400">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  ขั้นตอนที่ 1: สกัดแม่แบบพรอพ (Suno v6 Mini Hit Engine)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Suno v6 - Mini Optimized</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  🚫 NO INTRO • NO SOLO • ZERO SPOKEN
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  📏 Suno &lt;= 4,500 / 5,000 ตัวอักษร
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-500/30">
                  🎼 ร้องเข้าทำนอง &amp; จังหวะ 4/4 เป๊ะ
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🔥 ฮิตติดหู (Earworm Hook)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ✨ ฟังลื่นหู &amp; สัมผัสสละสลวย
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  <span>🧠 Auto-AI ถอดจากเรื่องราว 100%</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-fuchsia-500/20 text-amber-200 border border-amber-500/40 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>🔥 ไตรภาคี 3 ศิลปินจริง (v129.0)</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1.5">
                ระบบสกัดพรอพแต่งเพลง Auto-AI ผสานวิญญาณ 3 ศิลปินจริง (v129.0 True 3-Artist Trinity)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                <strong>ถอดรหัสจาก 168 เพลงจริง (SD PMR × P9D × NS-A755)</strong> • <strong>เปลี่ยนเกียร์ 4 มิติแก้เพลงแบนจืดชืด</strong> • <strong>ไร้ [Intro]/[Solo]</strong> • <strong>&lt;= 4,500/5,000 ตัวอักษร &amp; ฮุคพลิกคมติดหู!</strong>
              </p>
            </div>
          </div>

          {/* Export as SKILL.md */}
          <button
            type="button"
            onClick={handleExportSkill}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-fuchsia-300 border border-fuchsia-500/30 transition-all whitespace-nowrap"
            title="ดาวน์โหลดไฟล์ SKILL.md เพื่อนำไปติดตั้งในระบบ Agent ได้ทันที"
          >
            {copiedKey === "skill" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedKey === "skill" ? "บันทึก SKILL.md แล้ว" : "บันทึกเป็นทักษะ (SKILL.md)"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
              <span>1. ป้อนเรื่องราวของคุณ & สไตล์เสียงร้อง</span>
            </h3>

            {/* Story */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200">
                เรื่องราวของเพลง (Story / Plot) *
              </label>
              <textarea
                rows={5}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="พิมพ์เรื่องราวชีวิต หรือแก่นเรื่องที่คุณต้องการถ่ายทอดออกมาเป็นบทเพลง (พรอพด้านขวาจะอัปเดตตามสดๆ ทันที)..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-all"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {storyPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStory(p.text)}
                    className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/50 transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood / Emotion Direction (Auto-AI by Default) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>อารมณ์และบรรยากาศเพลง (Mood &amp; Vibe)</span>
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  !mood.trim() || /^AUTO\b/i.test(mood.trim())
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}>
                  {!mood.trim() || /^AUTO\b/i.test(mood.trim()) ? "✨ Auto AI ตามเรื่อง" : "🎯 กำหนดอารมณ์เอง"}
                </span>
              </div>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="AUTO (ให้ AI ถอดอารมณ์แท้จริงจากเรื่องราวด้านบนเอง — แนะนำ) หรือพิมพ์อารมณ์เอง..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "✨ Auto AI (แนะนำ)", val: "AUTO" },
                  { label: "🌅 อบอุ่นซาบซึ้ง", val: "อบอุ่น ซาบซึ้ง กินใจ ลึกซึ้ง" },
                  { label: "💔 เศร้าลึกอาลัย", val: "เศร้าลึก โหยหา อาลัย ซึ้งจนน้ำตาซึม" },
                  { label: "🔥 ฮึกเหิมสู้ชีวิต", val: "ฮึกเหิม มีพลัง ไม่ยอมแพ้ ปลุกใจ" },
                  { label: "🌸 รักละมุนยิ้มได้", val: "โรแมนติก ละมุน อบอุ่นหัวใจ ยิ้มตามได้" },
                  { label: "⚡ สนุกสดใสโยกตาม", val: "สดใส สนุกสนาน จังหวะชวนโยกฟังเพลิน" },
                ].map((mOpt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMood(mOpt.val)}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                      (mOpt.val === "AUTO" && (!mood.trim() || /^AUTO\b/i.test(mood.trim()))) || mood === mOpt.val
                        ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold"
                        : "bg-slate-800/70 hover:bg-slate-700 text-slate-300 border-slate-700/50"
                    }`}
                  >
                    {mOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Flow & Rhyme Archetype Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>แนวเพลง &amp; ฉันทลักษณ์ (Genre &amp; Flow Architecture):</span>
                </label>
                <span className="text-[10px] text-fuchsia-300 font-bold">
                  {flowStyle === "auto"
                    ? "✨ Auto AI (แนะนำสูงสุด)"
                    : flowStyle === "trinity"
                    ? "👑 ไตรภาคี 3 ศิลปิน"
                    : flowStyle === "sdpmr-folk"
                    ? "🌾 เพื่อชีวิตสัจธรรม"
                    : flowStyle === "p9d-boombap"
                    ? "🎤 บูมแบ็ปสตรีท"
                    : "🎵 เมโลดี้แร็ป × โอลด์สคูล"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFlowStyle("auto")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    flowStyle === "auto"
                      ? "bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-emerald-300">✨ Auto AI (แนะนำ)</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    AI คิดแนวเพลง-จังหวะ-การร้องให้ตรงเรื่อง 100%
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlowStyle("trinity")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    flowStyle === "trinity"
                      ? "bg-fuchsia-950/50 border-fuchsia-500 text-fuchsia-200 ring-1 ring-fuchsia-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-fuchsia-300">👑 ไตรภาคี 3 ศิลปินจริง</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    เปิดชิดไมค์ + ฮุคพลิกคม + Verse 2 เกียร์เด้งลงสแนร์
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlowStyle("sdpmr-folk")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    flowStyle === "sdpmr-folk"
                      ? "bg-amber-950/50 border-amber-500 text-amber-200 ring-1 ring-amber-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-amber-300">🌾 สไตล์ SD PMR Hybrid</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    อะคูสติกผสมซับ 808 คู่ขัดแย้งพลิกคม ฮุคประสานเสียง
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlowStyle("p9d-boombap")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    flowStyle === "p9d-boombap"
                      ? "bg-cyan-950/50 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-cyan-300">🎤 สไตล์ P9D × NS-A755</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    แจ๊สบูมแบ็ป สัมผัสพวงภาษาพูด 2-4 พยางค์ + ฮุคโซล
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlowStyle("melodic-rap-oldschool")}
                  className={`p-2.5 rounded-xl border text-left transition-all col-span-2 ${
                    flowStyle === "melodic-rap-oldschool"
                      ? "bg-violet-950/60 border-violet-500 text-violet-200 ring-1 ring-violet-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold block text-violet-300">🎵 เมโลดี้แร็ป × โอลด์สคูล 90s</span>
                    <span className="text-[9px] bg-violet-900/60 text-violet-200 px-1.5 py-0.5 rounded border border-violet-700/50 font-semibold">สัมผัสพ้องเสียง</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    ร้องกึ่งแร็ปมีเมโลดี้ชัดเจน กรูฟ 4/4 บูมแบ็ป สัมผัสพ้องเสียงสระ-พยัญชนะรื่นหู ฮุคก้องกังวานติดหู
                  </span>
                </button>
              </div>
            </div>

            {/* Rhyme Intensity & Resonance Matrix */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ระดับความลงตัวของสัมผัส &amp; จังหวะร้อง:</span>
                </label>
                <span className="text-[10px] text-amber-300 font-bold">
                  {rhymeIntensity === "auto"
                    ? "✨ Auto AI สัมผัสพ้องเสียง & เข้าบีท"
                    : rhymeIntensity === "supreme"
                    ? "👑 สัมผัสพ้องเสียงขั้นสุด (Assonance)"
                    : rhymeIntensity === "sharp"
                    ? "⚡ คมชัดลงสแนร์ (Snare Bounce)"
                    : "🌸 ละมุนพริ้วไหว (Melodic Assonance)"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRhymeIntensity("auto")}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    rhymeIntensity === "auto"
                      ? "bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-emerald-300">✨ Auto AI (แนะนำ)</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    ปรับสัมผัสพ้องเสียงละมุนหรือคมตามเรื่องอัตโนมัติ
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRhymeIntensity("supreme")}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    rhymeIntensity === "supreme"
                      ? "bg-amber-950/50 border-amber-500 text-amber-200 ring-1 ring-amber-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-amber-300">👑 สัมผัสพ้องเสียงขั้นสุด</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    พ้องเสียงสระ-พยัญชนะ + สัมผัสพวง 2-4 พยางค์ รื่นหูไม่สะดุดลิ้น
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRhymeIntensity("sharp")}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    rhymeIntensity === "sharp"
                      ? "bg-fuchsia-950/50 border-fuchsia-500 text-fuchsia-200 ring-1 ring-fuchsia-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-fuchsia-300">⚡ คมชัดลงสแนร์</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    สัมผัสในเด้งลงสแนร์ ควบคู่สระพ้องเสียง ไม่ลิ้นพัน
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRhymeIntensity("melodic")}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    rhymeIntensity === "melodic"
                      ? "bg-rose-950/50 border-rose-500 text-rose-200 ring-1 ring-rose-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-rose-300">🌸 ละมุนพริ้วไหว</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    เน้นสระก้องกังวาน ลากเสียงเปิดท้ายวรรค ร้องลื่นหู
                  </span>
                </button>
              </div>
            </div>

            {/* Golden Rhyme & Punchline Vault (คลังคำสัมผัสพวง & หมุดทองคำ) */}
            <div className="pt-2 border-t border-slate-800">
              <div className="p-3 bg-gradient-to-r from-amber-950/30 via-purple-950/20 to-slate-950 border border-amber-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>คลังสัมผัสพวง & สะพานไรม์ลื่นหู (คลิกเพื่อเติมลงเรื่องราว):</span>
                  </span>
                  <span className="text-[10px] text-amber-300/80 font-mono">v129.0 Hit Vault</span>
                </div>

                {/* Multi-Syllable Rhyme Chains */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">⚡ สัมผัสพวงภาษาพูดจริง 2-3 พยางค์:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { pair: "เส้นทาง ➔ เคว้งคว้าง", text: " ยืนหยัดบนเส้นทาง, ฝ่าพายุเคว้งคว้าง" },
                      { pair: "รวงข้าว ➔ เรื่องราว", text: " รวงข้าวโน้มลงดิน, ผ่านร้อยพันเรื่องราว" },
                      { pair: "เวลา ➔ น้ำตา", text: " ผ่านวันและเวลา, เช็ดหยดน้ำตา" },
                      { pair: "ซื่อตรง ➔ มั่นคง", text: " ยืนหยัดด้วยซื่อตรง, สร้างชีวิตมั่นคง" },
                      { pair: "รากไม้ ➔ ยิ่งใหญ่", text: " หยาดเหงื่อรดรากไม้, เติบโตอย่างยิ่งใหญ่" },
                      { pair: "ก้าวไป ➔ สว่างไสว", text: " มุ่งหน้าก้าวเดินไป, สู่ใจสว่างไสว" },
                      { pair: "บาดแผล ➔ ไม่ยอมแพ้", text: " รอยยิ้มทับบาดแผล, หัวใจไม่ยอมแพ้" },
                      { pair: "มืดมน ➔ อดทน", text: " ผ่านคืนที่มืดมน, ด้วยหัวใจอดทน" },
                    ].map((r, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setStory((prev) => prev + r.text)}
                        className="text-[10px] bg-slate-900/90 hover:bg-amber-900/40 text-amber-200 px-2 py-1 rounded-lg border border-amber-500/20 hover:border-amber-400/50 transition-all"
                        title={`คลิกเพื่อเพิ่มสัมผัส "${r.pair}" ลงในเรื่องราว`}
                      >
                        + {r.pair}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Whip-Rhyme Internal Bridges */}
                <div className="pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] font-bold text-cyan-300/90 block mb-1">🌊 สะพานสัมผัสรับส่งลื่นหู & วลีเข้าถึงอารมณ์:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "กลองยิ่งกลวงยิ่งตีดัง, ยิ่งฟังยิ่งรู้ว่าข้างในว่าง", text: " กลองยิ่งกลวงยิ่งตีดัง, ยิ่งฟังยิ่งรู้ว่าข้างในว่าง" },
                      { label: "อย่าไปยืนในที่นั้น, ที่เขาไม่เคยเห็นค่าเรา", text: " อย่าไปยืนในที่นั้น, ที่เขาไม่เคยเห็นค่าเรา" },
                      { label: "บอกตัวเองว่าเพิ่งเริ่ม, เรายังมีฝันเอาไว้ให้วาด", text: " บอกตัวเองว่าเพิ่งเริ่ม, เรายังมีฝันเอาไว้ให้วาด" },
                      { label: "ผ่านคืนวันที่เหน็บหนาว, รอแสงเช้าของวันใหม่", text: " ผ่านคืนวันที่เหน็บหนาว, รอแสงเช้าของวันใหม่" },
                    ].map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setStory((prev) => prev + b.text)}
                        className="text-[10px] bg-slate-900/80 hover:bg-cyan-950/60 text-cyan-200 px-2 py-1 rounded-lg border border-cyan-500/20 hover:border-cyan-400/50 transition-all"
                      >
                        + {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Golden Punchline Hooks */}
                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] font-bold text-fuchsia-300/90 block">🌟 หมุดทองคำท่อนฮุคติดหู (Signature Earworm Hooks):</span>
                  {[
                    "กลองยิ่งกลวงยิ่งตีให้ก้องกว้าง / ยิ่งได้ฟังยิ่งรู้ว่าข้างในว่าง / ทองคำแท้ไม่เคยต้องอวดคน!",
                    "ให้ค่ากับคนเห็นค่า ดีกว่าทนเป็นส่วนเกิน / ไม่ต้องฝืนไม่ต้องเขิน เมื่อรู้ว่าเขาไม่รัก!",
                    "คนฉลาดไม่ต้องอวด คนที่รู้จริงยิ่งถ่อมตน / ให้เวลาและผลงานตอบแทนเอง!",
                    "ต่อให้ล้มสักร้อยครั้งก็จะลุกขึ้นยืน / ต่อให้มืดทั้งคืนก็จะฝืนเดินไป!",
                  ].map((hook, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStory((prev) => prev ? `${prev} (หมุดทองคำท่อนฮุก: ${hook})` : hook)}
                      className="w-full text-left text-[10px] bg-slate-900/60 hover:bg-slate-800 text-slate-300 p-1.5 rounded-lg border border-slate-700/30 truncate block transition-all"
                      title="คลิกเพื่อนำหมุดทองคำนี้ไปเป็นแก่นเรื่องท่อนฮุก"
                    >
                      🌟 {hook}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vocal Style */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <span>สไตล์เสียงร้อง (Vocal Style & Delivery)</span>
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center space-x-1 ${
                  !vocalStyle.trim() || /^AUTO\b/i.test(vocalStyle.trim())
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}>
                  <span>{!vocalStyle.trim() || /^AUTO\b/i.test(vocalStyle.trim()) ? "✨ Auto AI เลือกเข้าเรื่อง" : "🎯 กำหนดเสียงเอง"}</span>
                </span>
              </div>
              <input
                type="text"
                value={vocalStyle}
                onChange={(e) => setVocalStyle(e.target.value)}
                placeholder="AUTO (ให้ AI เลือกเสียงร้องเข้ากับเรื่องเอง) หรือพิมพ์แนวเสียงที่ต้องการ..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-all font-medium"
              />
              {/* Vocal Presets */}
              <div className="space-y-1 pt-1">
                {vocalPresets.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setVocalStyle(v)}
                    className={`w-full text-left text-[11px] p-2 rounded-lg border truncate block transition-all ${
                      vocalStyle === v
                        ? "bg-emerald-950/50 border-emerald-500/60 text-emerald-200 font-semibold"
                        : "bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700/30"
                    }`}
                  >
                    {v.startsWith("AUTO") ? `✨ ${v}` : v.startsWith("🔒") ? v : `🎤 ${v}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Key & BPM Selector */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Radio className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>คีย์เพลงและจังหวะ (Key & BPM)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAutoMusical(!isAutoMusical)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                >
                  {isAutoMusical ? "⚙️ ต้องการระบุเอง?" : "✨ ให้ AI เลือกให้อัตโนมัติ (แนะนำ)"}
                </button>
              </div>

              {isAutoMusical ? (
                <div className="p-3 bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-slate-950 border border-fuchsia-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-white">โหมดคำนวณอัจฉริยะ (AUTO Pitch & Tempo)</p>
                      <p className="text-[11px] text-slate-400">
                        AI จะเลือกคีย์เพลงและ BPM ที่เข้ากับอารมณ์เรื่องราวที่สุดโดยอัตโนมัติ (ไม่จำเจ ไม่ซ้ำทาง)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Smart Active
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 animate-fadeIn">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ความเร็ว (BPM)</label>
                    <input
                      type="text"
                      value={tempo === "AUTO" ? "78" : tempo}
                      onChange={(e) => setTempo(e.target.value)}
                      placeholder="เช่น 76-80"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">คีย์เพลง (Key)</label>
                    <input
                      type="text"
                      value={key === "AUTO" ? "D Minor" : key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="เช่น D Minor, G Major"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Big Action Copy Button on Left (Prompt Only for Web Chat) */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="w-full flex items-center justify-center space-x-2 py-4 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white shadow-xl shadow-fuchsia-600/30 transition-all hover:scale-[1.01] active:scale-95"
              >
                {copiedKey === "fullPrompt" ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-300" />
                    <span className="text-emerald-200">คัดลอกแม่แบบพรอพฉบับสมบูรณ์แล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 text-fuchsia-200" />
                    <span>📋 คัดลอกแม่แบบพรอพ (พร้อมนำไปวางในแชท AI)</span>
                  </>
                )}
              </button>
              {copyError && (
                <div
                  role="alert"
                  className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-[11px] text-amber-200 flex items-center space-x-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{copyError}</span>
                </div>
              )}

              {/* Quick AI Tool Links */}
              <div className="space-y-1.5 pt-3">
                <span className="text-[11px] font-bold text-slate-300 block text-center">
                  กดเปิดแชท AI เพื่อนำพรอพไปวางสั่งแต่งเพลงได้ทันที:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <a
                    href="https://chatgpt.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-[11px] font-semibold transition-all hover:border-emerald-500/50 truncate"
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">ChatGPT</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>

                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-[11px] font-semibold transition-all hover:border-cyan-500/50 truncate"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">Gemini</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>

                  <a
                    href="https://claude.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-[11px] font-semibold transition-all hover:border-amber-500/50 truncate"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Claude</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>

                  <a
                    href="https://suno.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-gradient-to-r from-fuchsia-900/60 to-purple-900/60 hover:from-fuchsia-800/80 hover:to-purple-800/80 text-fuchsia-200 rounded-xl border border-fuchsia-500/40 text-[11px] font-bold transition-all truncate"
                  >
                    <Music className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                    <span className="truncate">Suno AI</span>
                    <ExternalLink className="w-2.5 h-2.5 text-fuchsia-300" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Prompt Preview & Return Song Box */}
        <div className="lg:col-span-7 space-y-6">
          {/* Box 1: Dynamic Live Prompt Generated from Story */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-fuchsia-400" />
                <h3 className="text-sm font-bold text-white">
                  ระบบสายพาน 3 ขั้นตอน (v129.0 True 3-Artist Trinity • เปลี่ยนเกียร์ 4 มิติ • ไร้ Intro/Solo • &lt;= 5,000 ตัวอักษร)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-fuchsia-600/30 hover:bg-fuchsia-600 text-fuchsia-200 hover:text-white border border-fuchsia-500/40 transition-all font-semibold"
                  title="ขั้นที่ 1: คัดลอกพรอมต์แต่งเพลงฮิต (เข้าทำนอง จังหวะเป๊ะ ไม่มี Intro/Solo, <= 4,500 ตัวอักษร, สัมผัสสละสลวย, ฮุคติดหู)"
                >
                  {copiedKey === "fullPrompt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "fullPrompt" ? "คัดลอกขั้นที่ 1 แล้ว!" : "1. พรอมต์แต่งเพลง"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyAuditPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 transition-all font-semibold"
                  title="ขั้นที่ 2: คัดลอกพรอมต์ผ่าตัดรอบแรก (ปรับร้องเข้าทำนอง & จังหวะ 4/4, เอา Intro/Solo ออก, เกลาสัมผัสสละสลวย & ฮุคติดหู)"
                >
                  {copiedKey === "auditPrompt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Wand2 className="w-3.5 h-3.5 text-amber-300" />}
                  <span>{copiedKey === "auditPrompt" ? "คัดลอกรอบแรกแล้ว!" : "2. พรอมต์ตรวจสอบรอบแรก"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyFinalAuditPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 transition-all font-semibold"
                  title="ขั้นที่ 3: คัดลอกพรอมต์ขัดเกลารอบสุดท้าย (จำลองร้องคู่บีท 4/4 และเมโลดี้, คุม <= 4,500/5,000 ตัวอักษร & Gold Master)"
                >
                  {copiedKey === "finalAuditPrompt" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />}
                  <span>{copiedKey === "finalAuditPrompt" ? "คัดลอกรอบสุดท้ายแล้ว!" : "3. พรอมต์ตรวจสอบรอบสุดท้าย"}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              แม่แบบเพลงฮิตติดชาร์ต <strong>(v129.0 True 3-Artist Trinity • 8 ท่อนต่อเนื่อง 3:00–3:50 นาที)</strong>: <strong>AI ออกแบบแนวเพลง-อารมณ์-ไดนามิก 4 เกียร์ตามเรื่องจริง 100%</strong> • <strong>ไร้ [Intro]/[Solo]</strong> • <strong>&lt;= 4,500/5,000 ตัวอักษร Suno</strong> • <strong>ฮุคพลิกคม &amp; Verse 2 เด้งลงสแนร์</strong>:
            </p>

            {/* Scrollable Live Code Preview */}
            <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3.5 max-h-[220px] overflow-y-auto text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
              {fullMasterPrompt}
            </div>
          </div>

          {/* Box 2: Return Result / Paste Area */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  2. นำผลลัพธ์บทเพลงจากแชท AI มาวางที่นี่ (เพื่อทำปก &amp; MV ต่อ)
                </h3>
              </div>

              {outputResult && (
                <button
                  type="button"
                  onClick={() => void handleCopyText("all", outputResult, 2000)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white"
                >
                  {copiedKey === "all" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "all" ? "คัดลอกทั้งหมดแล้ว" : "คัดลอกทั้งหมด"}</span>
                </button>
              )}
            </div>

            {/* Paste Input Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>วางเนื้อเพลงที่แชท AI แต่งให้ตรงนี้:</span>
                <span className="text-[10px] text-slate-400">ระบบจะสกัดท่อนและแยกช่อง Suno ให้อัตโนมัติ</span>
              </label>
              <textarea
                rows={outputResult ? 4 : 5}
                value={outputResult}
                onChange={(e) => setOutputResult(e.target.value)}
                placeholder="วางผลลัพธ์จาก ChatGPT / Gemini / Claude ที่นี่ (เช่น ชื่อเพลง, สไตล์ดนตรี, เนื้อร้อง [Verse 1]...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-mono"
              />
            </div>

            {/* 3-Stage Audit & Final Master Polish Studio (Stage 2 & Stage 3) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-emerald-950/30 border border-amber-500/30 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Wand2 className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-200 flex items-center space-x-1.5">
                      <span>🔍 ระบบตรวจสอบ 2 ด่าน (รอบแรก: เปลี่ยนเกียร์ 4 มิติ, เอา Intro/Solo ออก &amp; ฮุคพลิกคม ➔ รอบสุดท้าย: จำลองร้องคู่บีท &amp; เมโลดี้ 100%)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        v129.0 3-Stage
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      แก้ปัญหาเพลงฟังแบนจืดชืดอย่างถาวร: <strong>ตรวจสอบรอบแรก</strong> (เปิดชิดไมค์ + Beat Drop + ฮุคพลิกคม + Verse 2 เกียร์เด้งลงสแนร์ + ไร้ Intro/Solo &amp; &lt;= 4,500 ตัวอักษร) ➔ <strong>ตรวจสอบรอบสุดท้าย</strong> (จำลองร้องจริง 4 เกียร์คู่บีท วรรณยุกต์เข้าปาก &amp; ล็อก Gold Master!)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAuditPreview(!showAuditPreview)}
                  className="text-[11px] text-amber-300 hover:text-amber-200 underline font-semibold shrink-0 self-start sm:self-center"
                >
                  {showAuditPreview ? "🙈 ซ่อนพรอพตรวจสอบ" : "👁️ ดูพรอพตรวจสอบสด (รอบแรก & รอบสุดท้าย)"}
                </button>
              </div>

              {/* Surgical Focus Filter Pills for Stage 2 */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-0.5">
                <span className="text-slate-400 font-semibold">โหมดเน้นพิเศษ (รอบแรก):</span>
                {[
                  { id: 'all', label: '🎯 ครบทุกมิติ (ไม่มี Intro/Solo • เข้าบีท 4/4 • สัมผัสสละสลวย)' },
                  { id: 'antirepeat', label: '🔥 เอา Intro/Solo ออก & ปั้นฮุคติดหู' },
                  { id: 'natural', label: '❤️ ภาษาสละสลวย & ความหมายดี Show Don’t Tell' },
                  { id: 'rhyme', label: '✨ สัมผัสสละสลวย ลื่นหูไม่ฝืนคำ' },
                  { id: 'flow', label: '🎼 ร้องเข้าทำนอง จังหวะ 4/4 & วรรณยุกต์เป๊ะ' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAuditFocus(item.id as AuditFocusMode)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      auditFocus === item.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* STAGE 2: 1st Audit Action Buttons */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300">
                    🛠️ ด่านที่ 1 (ขั้นที่ 2): พรอมต์ผ่าตัดรอบแรก — เอา Intro/Solo/พูดออก, คุม &lt;= 4,500 ตัวอักษร, ปั้นฮุคติดหู &amp; สัมผัสลงตัว
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">Stage 2: Zero-Intro, Zero-Solo &amp; Hit Surgery</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAuditPrompt}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-600/25 transition-all hover:scale-[1.01] active:scale-95"
                  >
                    {copiedKey === "auditPrompt" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span className="text-emerald-100 font-bold">คัดลอกพรอมต์ตรวจสอบรอบแรกแล้ว! (วางต่อในแชทเดิม)</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-200" />
                        <span>📋 ก๊อปพรอมต์ตรวจสอบรอบแรก (วางต่อในแชทเดิม)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyAuditWithLyrics}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition-all hover:scale-[1.01] active:scale-95"
                  >
                    {copiedKey === "auditWithLyrics" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">คัดลอกพรอมต์รอบแรก + เนื้อเพลงแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 text-amber-400" />
                        <span>
                          {outputResult ? "✨ ก๊อปพรอมต์รอบแรก + แนบเนื้อเพลง & ใบชันสูตร" : "✨ ก๊อปพรอมต์รอบแรกฉบับเต็ม (สำหรับเริ่มแชทใหม่)"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* STAGE 3: Final Master Audit Action Buttons */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-300">
                    👑 ด่านที่ 2 (ขั้นที่ 3): พรอมต์ขัดเกลารอบสุดท้าย — จำลองร้องจริงเข้าปาก 100%, วรรณยุกต์ลงตัว &amp; Gold Master
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">Stage 3: Studio Vocal Polish &amp; Gold Master</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyFinalAuditPrompt}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-500 hover:to-cyan-600 text-white shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-95"
                  >
                    {copiedKey === "finalAuditPrompt" ? (
                      <>
                        <Check className="w-4 h-4 text-amber-200" />
                        <span className="text-white font-bold">คัดลอกพรอมต์ตรวจสอบรอบสุดท้ายแล้ว! (วางต่อในแชทเดิม)</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-200" />
                        <span>👑 ก๊อปพรอมต์ตรวจสอบรอบสุดท้าย (วางต่อในแชทเดิม)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyFinalAuditWithLyrics}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-all hover:scale-[1.01] active:scale-95"
                  >
                    {copiedKey === "finalAuditWithLyrics" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">คัดลอกพรอมต์รอบสุดท้าย + เนื้อเพลงแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>
                          {outputResult ? "💎 ก๊อปพรอมต์รอบสุดท้าย + แนบเนื้อเพลงพร้อมล็อกมาสเตอร์" : "💎 ก๊อปพรอมต์รอบสุดท้ายฉบับเต็ม (สำหรับเริ่มแชทใหม่)"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Optional Live Preview of Stage 2 & Stage 3 Audit Prompts */}
              {showAuditPreview && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setAuditPreviewStage('stage2')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        auditPreviewStage === 'stage2'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      🛠️ ดูพรอมต์ตรวจสอบรอบแรก (Stage 2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditPreviewStage('stage3')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        auditPreviewStage === 'stage3'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      👑 ดูพรอมต์ตรวจสอบรอบสุดท้าย (Stage 3)
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 max-h-[240px] overflow-y-auto text-xs font-mono text-amber-100/90 whitespace-pre-wrap leading-relaxed select-all">
                    {auditPreviewStage === 'stage2' ? liveAuditPrompt : liveFinalAuditPrompt}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>💡 <strong>ทำไมต้องขัดเกลา 2 รอบ?:</strong> รอบแรกช่วยเปลี่ยนเกียร์ไดนามิก 4 ช่วงไม่ให้เพลงแบน เอา Intro/Solo ออก วางฮุคพลิกคม และเล่าเรื่องเห็นภาพจริง ➔ รอบสุดท้ายจำลองร้องจริงในห้องอัด เช็ก Verse 2 เด้งลงสแนร์ วรรณยุกต์ และสัมผัสพวงให้ลื่นหู 100%!</span>
              </div>
            </div>

            {/* If Output Exists: Quick-Copy Pills for Suno v6 Mini */}
            {outputResult ? (
              <div className="space-y-4 pt-1">
                {/* Real-Time Lyric Quality & Earworm Scanner */}
                {lyricAuditSummary && (
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">
                          ผลชันสูตรคุณภาพเพลงฮิต (ไร้ Intro/Solo • &lt;= 5,000 ตัวอักษร • เปลี่ยนเกียร์ 4 มิติ v129.0):
                        </span>
                      </div>
                      {!lyricAuditSummary.isClean && (
                        <button
                          type="button"
                          onClick={handleAutoCleanLyrics}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center space-x-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>✨ คลีน Intro, Solo &amp; คำแปลกอัตโนมัติ (1-Click Clean)</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">โควต้า Suno (&lt;= 5,000)</span>
                        <span
                          className={`font-bold ${
                            !lyricAuditSummary.isWithinSunoLimit
                              ? 'text-rose-400'
                              : lyricAuditSummary.isSafeUnderSunoLimit
                              ? 'text-emerald-400'
                              : 'text-amber-300'
                          }`}
                        >
                          {lyricAuditSummary.charCount.toLocaleString()} / 5,000 {!lyricAuditSummary.isWithinSunoLimit ? '🚨 เกิน!' : ''}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">ความยาวเพลงฮิต</span>
                        <span className={`font-bold ${lyricAuditSummary.isOptimalLength ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {lyricAuditSummary.totalLines} บรรทัด (~{lyricAuditSummary.estDurationStr})
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">Intro / Solo &amp; พูด</span>
                        <span className={`font-bold ${!lyricAuditSummary.hasIntroTag && !lyricAuditSummary.hasSoloTag && lyricAuditSummary.spokenCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {!lyricAuditSummary.hasIntroTag && !lyricAuditSummary.hasSoloTag && lyricAuditSummary.spokenCount === 0
                            ? '✅ ไร้ Intro/Solo 100%'
                            : `🚨 พบ ${lyricAuditSummary.hasIntroTag ? 'Intro ' : ''}${lyricAuditSummary.hasSoloTag ? 'Solo ' : ''}${lyricAuditSummary.spokenCount > 0 ? `พูด(${lyricAuditSummary.spokenCount})` : ''}`}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">Verse ไม่ซ้ำซาก</span>
                        <span className={`font-bold ${lyricAuditSummary.duplicateLineCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {lyricAuditSummary.duplicateLineCount === 0
                            ? `✅ สดใหม่ (ฮุค ${lyricAuditSummary.chorusCount} รอบ)`
                            : `🚨 ซ้ำ ${lyricAuditSummary.duplicateLineCount} บรรทัด`}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">เข้าทำนอง &amp; จังหวะ (,)</span>
                        <span className={`font-bold ${lyricAuditSummary.breathRatio >= 80 ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {lyricAuditSummary.breathRatio}% เข้าบีทลื่นหู
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">คำแปลก/ข้อสังเกต</span>
                        <span className={`font-bold ${lyricAuditSummary.weirdCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {lyricAuditSummary.weirdCount === 0
                            ? '✅ ธรรมชาติ 100%'
                            : `🚨 พบ ${lyricAuditSummary.weirdCount} รายการ`}
                        </span>
                      </div>
                    </div>

                    {lyricAuditSummary.weirdPhrases.length > 0 && (
                      <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200 space-y-1">
                        <span className="font-bold block">🚨 ตรวจพบจุดที่ควรขัดเกลา (กดปุ่ม 1-Click Clean ด้านบน หรือก๊อปพรอมต์ตรวจสอบไปให้ AI เกลาได้ทันที):</span>
                        {lyricAuditSummary.weirdPhrases.map((wp, i) => (
                          <div key={i} className="text-[10px] text-rose-300">• {wp}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Copy Lyrics */}
                  <button
                    type="button"
                    onClick={() => void handleCopyText("lyricsOnly", extractLyrics(outputResult), 2000)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-fuchsia-500/50 rounded-xl text-left transition-all group"
                  >
                    <span
                      className={`text-[10px] block uppercase font-mono ${
                        lyricAuditSummary && !lyricAuditSummary.isWithinSunoLimit ? "text-rose-400 font-bold" : "text-slate-400"
                      }`}
                    >
                      1. เนื้อเพลง Suno ({lyricAuditSummary ? `${lyricAuditSummary.charCount.toLocaleString()}/5,000` : "0/5,000"})
                    </span>
                    <span className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                      {copiedKey === "lyricsOnly" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
                      )}
                      <span>{copiedKey === "lyricsOnly" ? "คัดลอกแล้ว!" : "ก๊อป Lyrics (พร้อมวางใน Suno)"}</span>
                    </span>
                  </button>

                  {/* Copy Style */}
                  <button
                    type="button"
                    onClick={() => void handleCopyText("styleOnly", extractStyle(outputResult), 2000)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition-all group"
                  >
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">2. สไตล์ดนตรี Mini (&lt;120ตัว)</span>
                    <span className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                      {copiedKey === "styleOnly" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Sliders className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      )}
                      <span>{copiedKey === "styleOnly" ? "คัดลอกแล้ว!" : "ก๊อป Style of Music"}</span>
                    </span>
                  </button>

                  {/* Copy Song Title */}
                  <button
                    type="button"
                    onClick={() => void handleCopyText("titleOnly", extractTitle(outputResult), 2000)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
                  >
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">3. ชื่อเพลง Suno Mini</span>
                    <span className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                      {copiedKey === "titleOnly" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Music className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      )}
                      <span>{copiedKey === "titleOnly" ? "คัดลอกแล้ว!" : "ก๊อปชื่อเพลง"}</span>
                    </span>
                  </button>

                  {/* Copy Viral Hook */}
                  <button
                    type="button"
                    onClick={() => void handleCopyText("hookOnly", extractHook(outputResult), 2000)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all group"
                  >
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">4. คำพาดหัว TikTok</span>
                    <span className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                      {copiedKey === "hookOnly" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Flame className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      )}
                      <span>{copiedKey === "hookOnly" ? "คัดลอกแล้ว!" : "ก๊อป 3s Hook"}</span>
                    </span>
                  </button>
                </div>

                {/* Optional Exclude for Suno Web Full */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1 pt-0.5">
                  <span>💡 สำหรับ <strong>Suno v6 Mini</strong> ใช้แค่ปุ่ม 1 (Lyrics) และ 2 (Style) ได้เลย ไม่ต้องใส่ Exclude</span>
                  <button
                    type="button"
                    onClick={() => void handleCopyText("excludeOnly", extractExclude(outputResult), 2000)}
                    className="text-slate-300 hover:text-white underline flex items-center space-x-1"
                    title="สำหรับผู้ใช้ Suno Pro/Custom เวอร์ชันเต็มบนเว็บ"
                  >
                    <ShieldCheck className="w-3 h-3 text-rose-400" />
                    <span>{copiedKey === "excludeOnly" ? "คัดลอก Exclude แล้ว" : "ก๊อป Exclude (ถ้าใช้ Suno บนเว็บ)"}</span>
                  </button>
                </div>

                {/* Bottom Navigation */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>ข้อมูลเพลงพร้อมแล้ว!</span>
                  </span>
                  <button
                    type="button"
                    onClick={handlePassToMv}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-600/25 transition-all"
                  >
                    <span>ส่งไปทำปก & MV ต่อทันที (ขั้นตอนที่ 2 และ 3)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* If empty: Quick Preset Tester buttons */
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block text-center">
                  หรือคลิกเลือกตัวอย่างเพลงสำเร็จรูป (ไม่มี Intro • ไม่มี Solo • &lt;= 5,000 ตัวอักษร • ฮิตติดหู) เพื่อทดสอบทันที:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.tripartite)}
                    className="p-2.5 rounded-xl bg-gradient-to-b from-fuchsia-950/40 to-slate-950 border border-fuchsia-500/50 hover:border-amber-400 text-left transition-all group col-span-2 sm:col-span-1"
                  >
                    <span className="text-base block mb-0.5">🌾</span>
                    <span className="text-xs font-bold text-amber-300 block group-hover:text-amber-200">รวงข้าวไม่อวดตน</span>
                    <span className="text-[10px] text-slate-400 truncate block">ไตรภาคี R&amp;B × 90s ฮุคพลิกคม</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.phaw)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🪵</span>
                    <span className="text-xs font-bold text-white block group-hover:text-amber-400">กลิ่นขี้เลื่อย (&quot;พ่อ&quot;)</span>
                    <span className="text-[10px] text-slate-400 truncate block">โฟล์ค-808 เห็นภาพจริงน้ำตาซึม</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.love)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">☕</span>
                    <span className="text-xs font-bold text-white block group-hover:text-pink-400">รักหญิง (&quot;โต๊ะเดิม&quot;)</span>
                    <span className="text-[10px] text-slate-400 truncate block">Pop-R&amp;B หวานประสานเสียงติดหู</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.rain)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🌧️</span>
                    <span className="text-xs font-bold text-white block group-hover:text-cyan-400">สตรีท (&quot;ตีสอง&quot;)</span>
                    <span className="text-[10px] text-slate-400 truncate block">P9D × Jazz บูมแบ็ป ฮุคโซล</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.rock)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🎸</span>
                    <span className="text-xs font-bold text-white block group-hover:text-purple-400">ร็อก (&quot;ปลายนิ้ว&quot;)</span>
                    <span className="text-[10px] text-slate-400 truncate block">คลีน-โอเวอร์ไดรฟ์ พลังเต็มปอด</span>
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handlePassToMv}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                  >
                    <span>ข้ามไปออกแบบภาพปก (ขั้นตอนที่ 2)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
