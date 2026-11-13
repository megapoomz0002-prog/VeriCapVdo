"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import {
  buildSunoSongPrompt,
  buildFullSunoMegaPrompt,
  buildSunoAuditRefinePrompt,
  buildSunoFinalMasterAuditPrompt,
  SUNO_GRANDMASTER_SYSTEM_PROMPT,
  AuditFocusMode,
  extractCleanLyricBody,
  detectWeirdOrForcedThaiPhrases,
} from "@/lib/prompts";

interface SongStudioProps {
  apiKey?: string;
  onSendToMv: (songData: {
    title: string;
    lyrics: string;
    mood: string;
    credit?: string;
    hookHeadline?: string;
  }) => void;
}

export default function SongStudio({ apiKey, onSendToMv }: SongStudioProps) {
  const [story, setStory] = useState(
    "เรื่องราวของคนสู้ชีวิตที่ผ่านความยากลำบาก เปรียบดั่งรวงข้าวที่ยิ่งมีค่ายิ่งโน้มตัวลงหาดิน ไม่โอ้อวดตน ยืนหยัดด้วยความจริงใจและความดีจนประสบความสำเร็จ"
  );
  const [vocalStyle, setVocalStyle] = useState(
    "🔒 ล็อกเสียงร้องโฟลว์ลื่นหูติดชาร์ต (Catchy Melodic Rap-Soul Flow): เสียงผู้ชายอบอุ่นทุ้มลึก ร้องควบแร็ปเมโลดี้สับไรม์คล้องเสียงเด้งรับบีท ท่อนฮุกร้องเมโลดี้จำขึ้นใจ ลื่นหู ไม่บาดหู"
  );
  const [mood, setMood] = useState("บีทเด้งฟังสนุก โฟลว์สัมผัสคล้องเสียงลื่นหู ความหมายลึกซึ้งกินใจ ฮิตติดหูฟังวนซ้ำได้เรื่อยๆ ไม่เบื่อ");
  const [tempo, setTempo] = useState("AUTO");
  const [key, setKey] = useState("AUTO");
  const [isAutoMusical, setIsAutoMusical] = useState(true);
  const [flowStyle, setFlowStyle] = useState<'trinity' | 'sdpmr-folk' | 'p9d-boombap'>('trinity');
  const [rhymeIntensity, setRhymeIntensity] = useState<'supreme' | 'sharp' | 'melodic'>('supreme');

  const [outputResult, setOutputResult] = useState<string>("");
  const [copiedFullPrompt, setCopiedFullPrompt] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLyricsOnly, setCopiedLyricsOnly] = useState(false);
  const [copiedStyleOnly, setCopiedStyleOnly] = useState(false);
  const [copiedExcludeOnly, setCopiedExcludeOnly] = useState(false);
  const [copiedHookOnly, setCopiedHookOnly] = useState(false);
  const [copiedTitleOnly, setCopiedTitleOnly] = useState(false);
  const [copiedSkill, setCopiedSkill] = useState(false);

  // Stage 2 (1st Audit) & Stage 3 (Final Master Audit) State (v115.0 3-Stage Pipeline)
  const [auditFocus, setAuditFocus] = useState<AuditFocusMode>('all');
  const [copiedAuditPrompt, setCopiedAuditPrompt] = useState(false);
  const [copiedAuditWithLyrics, setCopiedAuditWithLyrics] = useState(false);
  const [copiedFinalAuditPrompt, setCopiedFinalAuditPrompt] = useState(false);
  const [copiedFinalAuditWithLyrics, setCopiedFinalAuditWithLyrics] = useState(false);
  const [showAuditPreview, setShowAuditPreview] = useState(false);
  const [auditPreviewStage, setAuditPreviewStage] = useState<'stage2' | 'stage3'>('stage2');

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
    navigator.clipboard.writeText(fullMasterPrompt);
    setCopiedFullPrompt(true);
    setTimeout(() => setCopiedFullPrompt(false), 2500);
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
    navigator.clipboard.writeText(prompt);
    setCopiedAuditPrompt(true);
    setTimeout(() => setCopiedAuditPrompt(false), 2500);
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
    navigator.clipboard.writeText(prompt);
    setCopiedAuditWithLyrics(true);
    setTimeout(() => setCopiedAuditWithLyrics(false), 2500);
  };

  // Stage 3: Copy Final Master Audit Prompt (Follow-up in Same Chat after Stage 2)
  const handleCopyFinalAuditPrompt = () => {
    const draftToScan = extractLyrics(outputResult) || outputResult.trim();
    const prompt = buildSunoFinalMasterAuditPrompt({
      draftForDiagnosis: draftToScan || undefined,
      storyContext: story.trim(),
      vocalStyle: vocalStyle.trim(),
    });
    navigator.clipboard.writeText(prompt);
    setCopiedFinalAuditPrompt(true);
    setTimeout(() => setCopiedFinalAuditPrompt(false), 2500);
  };

  // Stage 3: Copy Final Master Audit Prompt (With Embedded Lyrics for New Chat)
  const handleCopyFinalAuditWithLyrics = () => {
    const lyricsToUse = extractLyrics(outputResult) || outputResult.trim();
    const prompt = buildSunoFinalMasterAuditPrompt({
      lyrics: lyricsToUse,
      storyContext: story.trim(),
      vocalStyle: vocalStyle.trim(),
    });
    navigator.clipboard.writeText(prompt);
    setCopiedFinalAuditWithLyrics(true);
    setTimeout(() => setCopiedFinalAuditWithLyrics(false), 2500);
  };

  // Helper functions to parse parts of the output (stops cleanly at [End], never leaks trailing AI chat questions)
  const extractLyrics = (raw: string): string => {
    return extractCleanLyricBody(raw);
  };

  const extractTitle = (raw: string): string => {
    const m = raw.match(/ชื่อเพลง[:\s*]+([^\n\r]+)/i);
    if (m && m[1]) return m[1].replace(/[*_#]/g, "").trim();
    return "บทเพลงระดับตำนาน";
  };

  const extractStyle = (raw: string): string => {
    const m = raw.match(/Style of Music\)?[:\s*]+([^\n\r]+)/i);
    if (m && m[1]) return m[1].replace(/[*_]/g, "").trim();
    return "Thai folk-soul meets boom-bap, fingerstyle guitar, warm piano, melodic male rap-singing, catchy hook, 84 bpm";
  };

  const extractExclude = (raw: string): string => {
    const m = raw.match(/Exclude Styles\)?[:\s*]+([^\n\r]+)/i);
    if (m && m[1]) return m[1].replace(/[*_]/g, "").trim();
    return "spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out";
  };

  const extractHook = (raw: string): string => {
    const m = raw.match(/คำพาดหัวสะกิดใจ[:\s*]+([^\n\r]+)/i);
    if (m && m[1]) return m[1].replace(/[*_]/g, "").trim();
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
    "🔒 [แนะนำสูงสุด - ไตรภาคี 3 ศิลปิน] เสียงชายอบอุ่นทุ้มลึก (SD PMR × P9D × NS-A755): ท่อน Verse ร้องกึ่งแร็ปเมโลดี้ลื่นไหล x สับไรม์สัมผัสพวงคมกริบ x ท่อนฮุกร้องเมโลดี้เต็มปอดจำขึ้นใจ",
    "🔒 [สไตล์ SD PMR ต้นฉบับ] โฟล์คร็อก-แร็ปเมโลดี้เพื่อชีวิตร่วมสมัย: เกากีตาร์โปร่งใสๆ ร้องเล่าเรื่องเปรียบเทียบคู่ขนาน ท่อน Pre-Chorus ลากเสียงยาวกินใจ ฮุกพุ่งทะยานสะกดอารมณ์",
    "🔒 [สไตล์ P9D × NS-A755] บูมแบ็ปสตรีท 90s สับไรม์คมกริบ: เสียงชายทุ้มสุขุม ล็อกสัมผัสพวงท้ายบาร์ 2-4 พยางค์ตรงกันยกชุด สาดสัมผัสในรัวทุกจังหวะสแนร์",
    "🔒 [สไตล์ SD PMR Female Version] เสียงหญิงอบอุ่นกังวานลึก: ร้องกึ่งแร็ปเมโลดี้ลื่นหู ถ่ายทอดอารมณ์ลึกซึ้ง ท่อนฮุกพุ่งทะยานสะกดใจ",
    "🔒 [สไตล์ร็อกเพื่อชีวิตร่วมสมัย] เสียงชายแหบเสน่ห์ทรงพลัง (Raspy Soul-Rock Anthem): กลองเบสแน่น กีตาร์โซโล่บาดใจ ฮุกระเบิดพลังเสียงเต็มปอด",
  ];

  // 100% Sung Hit Outputs (v125.0: Zero Intro Section, Seamless Natural Rhyme & Flow, Catchy Earworm Hook, Show Don't Tell)
  const sampleSongs = {
    tripartite: `ชื่อเพลง: รวงข้าวที่ไม่เคยอวดตน (Golden Grain in Silence)
คำพาดหัวสะกิดใจ: กลองยิ่งกลวงยิ่งตีดัง... ทองแท้ไม่เคยต้องอวดใคร ให้เวลาและผลงานตอบแทนเอง 🌾
ประโยคหมุดทองคำ: กลองยิ่งกลวงยิ่งตีให้ก้องกว้าง / ยิ่งได้ฟังยิ่งรู้ว่าข้างในว่าง / ทองคำแท้ไม่เคยต้องอวดคน / ยิ่งนานวันยิ่งเห็นค่าในตน
Style of Music: Thai folk-soul meets boom-bap, fingerstyle guitar, warm piano, melodic male rap-singing, catchy hook, 84 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Warm Soulful Male Baritone-Tenor, Smooth Melodic Rap-Folk Groove, Catchy Anthemic Chorus, No Spoken Word]

[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]
มองรวงข้าวสีทองกลางทุ่งนา, ยิ่งมีค่าเท่าไรยิ่งโน้มลง
ผ่านแดดฝนพัดซัดอย่างมั่นคง, ไม่เคยอวดทรนงว่าเหนือใคร
ต้นหญ้าข้างคันนาที่ว่างเปล่า, ชูยอดสูงท้าลมในฟ้าใส
พอลมแรงพัดโหมซัดลงไป, ก็หักโค่นพับหายไปกับตา
เห็นบางคนพูดเก่งอยู่เสมอ, ดีแต่เพ้ออวดตัวให้คนมอง
พอถึงคราวลำบากต้องประคอง, กลับหลบหายหน้าหมองไม่เห็นเงา
แต่คนจริงทำงานอยู่หลังเงา, ยอมเหน็ดเหนื่อยสร้างทางด้วยสองมือ
ให้ผลงานเป็นคำร่ำลือ, ไม่ต้องชูป้ายอวดให้วุ่นวาย

[Pre-Chorus 1: Rising Emotional Lift, Smooth Sustained Open Vowels]
ราคาคนไม่เคยวัดที่คำคุย,
วัดกันยามลมลุยไม่เหลือใคร,
ทองคำแท้ต่อให้ตกอยู่กลางดิน,
ยังเป็นทองส่องสว่างตลอดไป

[Chorus 1: Catchy Anthemic Hook, Punchy 7-10 Syllable Lines, Emotional Peak]
กลองยิ่งกลวงยิ่งตีให้ก้องกว้าง,
ยิ่งได้ฟังยิ่งรู้ว่าข้างในว่าง,
ทองคำแท้ไม่เคยต้องอวดคน,
ยิ่งนานวันยิ่งเห็นค่าในตน,
เหมือนรวงข้าวเต็มรวงยอมโน้มลง,
ด้วยศรัทธามั่นคงไม่เคยหลง,
ให้ผลงานตอบแทนทุกคำถาม,
ดีกว่าคำสวยงามแต่ไม่ทำตาม

[Instrumental Solo Interlude: Expressive Acoustic & Clean Electric Guitar Solo - 4-8 Bars]

[Verse 2: Deepening Story & Dynamic Melodic Groove, Smooth Internal & Tail Rhymes - No Spoken Word]
เริ่มจากศูนย์ไม่มีทุนติดตัว, เดินฝ่าความมืดมัวเพียงลำพัง
เสื้อตัวเก่าซักซ้ำจนสีจาง, ยังก้มหน้าสร้างทางด้วยความหวัง
โดนดูถูกเหยียบซ้ำมานับครั้ง, เก็บเป็นแรงผลักดันไว้ข้างใน
คำนินทารอบข้างไม่เก็บมา, ใช้สองมือฟันฝ่าข้ามผ่านไป
หนังสือดีไม่วัดกันที่หน้าปก, ทองแท้ไม่สะทกเมื่อลองไฟ
คนพูดน้อยมักจริงจังกว่าคำใคร, รอวันฟ้าเปิดใจให้เห็นจริง
ไม่ต้องแข่งเสียงดังกับใครเขา, ยืนบนขาของเราอย่างแน่นิ่ง
ความซื่อตรงไม่เคยทรยศใคร, เป็นเข็มทิศนำใจทุกก้าวเดิน

[Pre-Chorus 2: Stronger Harmonic Swell, Brand-New Escalating Lyrics]
เหรียญหล่นพื้นย่อมส่งเสียงดังไกล,
แต่ใบพันหล่นลงกลับเงียบงัน,
คนที่รู้จริงจังไม่คุยโว,
ก้มหน้าทำตามฝันทุกคืนวัน

[Chorus 2: Returning Signature Earworm Hook + Evolving Emotional Payoff]
กลองยิ่งกลวงยิ่งตีให้ก้องกว้าง,
ยิ่งได้ฟังยิ่งรู้ว่าข้างในว่าง,
ทองคำแท้ไม่เคยต้องอวดคน,
ยิ่งนานวันยิ่งเห็นค่าในตน,
ลมปากคนผ่านมาแล้วก็ผ่าน,
เหลือเพียงใจกล้าหาญที่คงทน,
หยาดเหงื่อรินสร้างค่าให้ผู้คน,
ไม่ต้องพูดสักคำคนก็จำ!

[Bridge: Stripped-Back Intimate Confession Building to Soaring Vocal Climax]
แม่น้ำสายที่ลึกที่สุดนั้น,
ไหลผ่านกาลเวลาอย่างเงียบงัน,
ยิ่งชีวิตก้าวสูงขึ้นเท่าไร,
ยิ่งถ่อมตัวลงไปในทุกวัน!

[Final Chorus: Full Band Goosebumps Anthem, Maximum Vocal Power & Golden Punchline]
กลองยิ่งกลวงยิ่งตีให้ก้องกว้าง,
ยิ่งได้ฟังยิ่งรู้ว่าข้างในว่าง,
ทองคำแท้ไม่เคยต้องอวดคน,
ยิ่งนานวันยิ่งเห็นค่าในตน,
เหมือนรวงข้าวค้อมรวงลงหาดิน,
เลี้ยงผู้คนให้ได้กินทุกถิ่นฐาน,
ให้เวลาเป็นเครื่องพิสูจน์งาน,
คือตำนานที่งดงามตลอดกาล!

[Outro: Gentle Lingering Melodic Echo & Soft Instrumental Fade - No Spoken Word]
รวงข้าวโน้มลงดินอย่างอ่อนโยน,
ทิ้งความดีไว้แทนเสียงตะโกน...

[End]`,
    phaw: `ชื่อเพลง: กอดพ่อได้แค่ในฝัน (Holding Father Only in Dreams)
คำพาดหัวสะกิดใจ: ซองเงินเดือนก้อนแรกพร้อมแล้ว... แต่เพิงไม้เก่าไม่มีพ่อรอรับ 💔
ประโยคหมุดทองคำ: วันนี้ได้กอดพ่อเพียงแค่ในฝัน / เหลือแค่เสื้อเปื้อนเหงื่อที่ผูกพัน / ซองเงินเดือนก้อนแรกที่ตั้งใจมา / ทำได้เพียงวางไว้หน้ารูปพ่อทั้งน้ำตา
Style of Music: Thai acoustic folk-soul, warm fingerstyle guitar, soft isan phin, emotional male vocal, catchy chorus, 78 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Warm Soulful Male Baritone-Tenor, Deeply Emotional Storytelling, Catchy Heartfelt Chorus, No Spoken Word]

[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]
เสียงกบไสไม้ในเพิงเก่าเงียบลง, ตลับเมตรยังวางตรงข้างประตู
เสื้อยืดตัวเก่าซักแขวนรอพ่ออยู่, มีกลิ่นไม้ที่ลูกคุ้นมาแสนนาน
ฝ่ามือกร้านที่เคยจับมือลูกเดิน, แลกค่าเทอมด้วยรอยแผลในวันวาน
พ่อไม่เคยบ่นเหนื่อยยากตอนทำงาน, ยอมอดมื้อเพื่อให้ลูกได้เรียนไกล
คืนฝนสาดเพิงไม้เก่าจนเกือบเช้า, พ่อนั่งกอดลูกเอาไว้กันลมหนาว
บอกลูกเพียงขอให้สู้และก้าวต่อ, ขอแค่ลูกตั้งใจเรียนให้ถึงดาว
วันนี้ลูกหอบเงินเดือนก้อนแรกมา, หวังให้พ่อได้พักสายตาไม่ห่วงใย
แต่พ่อกลับหลับตาลงไปแสนไกล, ไม่ทันได้ยินคำขอบคุณจากใจเลย

[Pre-Chorus 1: Rising Emotional Lift, Smooth Sustained Open Vowels]
ซองเงินขาวอยู่ในมือสั่นเทา,
หน้าประตูเพิงไม้เงียบเหงาเกินทน,
อยากตะโกนเรียกพ่อให้ตื่นมา,
แต่มีเพียงสายลมที่พัดวน

[Chorus 1: Catchy Anthemic Hook, Punchy 7-10 Syllable Lines, Emotional Peak]
วันนี้ได้กอดพ่อเพียงแค่ในฝัน,
เหลือแค่เสื้อเปื้อนเหงื่อที่ผูกพัน,
เสียงตอกไม้ยังดังก้องในใจ,
แต่ไม่มีใครอยู่ให้ลูกกราบไหว้,
สองมือกร้านสร้างบ้านให้คนมานอน,
สอนให้ลูกซื่อตรงกว่าเงินทุกก้อน,
ซองเงินเดือนก้อนแรกที่ลูกหอบมา,
ทำได้เพียงวางไว้หน้ารูปพ่อทั้งน้ำตา!

[Instrumental Solo Interlude: Emotional Acoustic Guitar & Soft Isan Phin Solo - 4-8 Bars]

[Verse 2: Deepening Story & Dynamic Melodic Groove, Smooth Internal & Tail Rhymes - No Spoken Word]
เปิดกล่องเครื่องมือที่พ่อรักนักหนา, หยิบสิ่วเก่าขึ้นมาลูบเบาด้วยมือสั่น
รอยถากไม้ยังชัดเจนอยู่ทุกอัน, เหมือนคำสอนที่พ่อพูดอยู่ทุกวัน
พ่อสร้างบ้านหลังงามให้คนอื่นอยู่, แต่เพิงเรากลับมีรอยรั่วมาเนิ่นนาน
ไม่เคยมีทองกองโตไว้ในบ้าน, แต่พ่อฝากเกียรติศักดิ์ศรีให้ลูกชาย
รูปข้างฝาที่ยิ้มอ่อนอย่างใจดี, คอยมองลูกคนนี้ไม่ห่างหาย
เหนื่อยแค่ไหนไม่เคยทำให้ใจคลาย, เมื่อคิดถึงแผ่นหลังพ่อที่ฝ่าฟัน
ขอสัญญาจากหัวใจลูกคนนี้, จะใช้ชีวิตเป็นคนดีไม่แปรผัน
ให้สมกับหยาดเหงื่อพ่อที่สร้างทาง, แม้วันนี้จะเดินคนละฟากฝั่งฟ้า

[Pre-Chorus 2: Stronger Harmonic Swell, Brand-New Escalating Lyrics]
จุดธูปหนึ่งดอกต่อหน้ารูปถ่าย,
ก้มกราบลงข้างเท้าในความทรงจำ,
คำสัญญาของลูกยังชัดเจนอยู่,
จะทำดีตามคำที่พ่อเคยย้ำ

[Chorus 2: Returning Signature Earworm Hook + Evolving Emotional Payoff]
วันนี้ได้กอดพ่อเพียงแค่ในฝัน,
เหลือแค่เสื้อเปื้อนเหงื่อที่ผูกพัน,
เสียงตอกไม้ยังดังก้องในใจ,
แต่ไม่มีใครอยู่ให้ลูกกราบไหว้,
กอดพ่อผ่านภาพจำในทุกคืนวัน,
ความรักพ่อยิ่งใหญ่เกินฟ้ากางกั้น,
ขอบคุณมือสองข้างที่สร้างตัวลูกมา,
ไม่เคยลืมพระคุณตลอดเวลา!

[Bridge: Stripped-Back Intimate Confession Building to Soaring Vocal Climax]
ถ้าวันนั้นลูกกอดพ่อให้นานกว่าเดิม,
คงไม่เจ็บปวดใจมากขนาดนี้,
แต่ลูกโตพอแล้วพ่อไม่ต้องห่วง,
หลับตาพักผ่อนให้สบายเถิดคนดี!

[Final Chorus: Full Band Goosebumps Anthem, Maximum Vocal Power & Golden Punchline]
วันนี้ได้กอดพ่อเพียงแค่ในฝัน,
เหลือแค่เสื้อเปื้อนเหงื่อที่ผูกพัน,
เสียงตอกไม้ยังดังก้องในใจ,
แต่ไม่มีใครอยู่ให้ลูกกราบไหว้,
จากเด็กน้อยในเพิงไม้ที่พ่อประคอง,
วันนี้ลูกยืนได้ด้วยใจซื่อตรง,
ส่งรักขึ้นไปหาพ่อบนฟากฟ้า,
หลับให้สบายเถิดพ่อ... ลูกดูแลตัวเองได้แล้วนะ!

[Outro: Gentle Lingering Melodic Echo & Soft Instrumental Fade - No Spoken Word]
หลับให้สบายนะพ่อในคืนนี้,
คำสอนพ่อจะอยู่กับลูกชั่วนิรันดร์...

[End]`,
    love: `ชื่อเพลง: แสงแรกกลางวันฝนพรำ (First Light in the Rain)
คำพาดหัวสะกิดใจ: แค่รอยยิ้มข้างโต๊ะกาแฟวันฝนตก... โลกที่เคยเหงาก็อุ่นขึ้นมาทันที ☕✨
ประโยคหมุดทองคำ: ขอบคุณสายฝนที่พาเธอเดินเข้ามา / เติมความอุ่นในวันที่โลกเย็นชา / แค่ได้มองตากันก็เข้าใจ / เธอคือแสงเช้าในใจตลอดไป
Style of Music: Thai warm acoustic pop-soul, nylon guitar, mellow piano, smooth warm male vocal, catchy chorus, 80 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Smooth Warm Male Pop-Soul Vocal, Intimate Acoustic Groove, Catchy Sweet Chorus, No Spoken Word]

[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]
กาแฟร้อนวางอยู่ข้างหน้าต่างใส, เม็ดฝนเย็นร่วงลงมาไม่ขาดสาย
ผู้คนเดินกางร่มผ่านไปมากมาย, มีเพียงฉันนั่งมองฟ้าอย่างเดียวดาย
จนเสียงกระดิ่งหน้าประตูดังเบา, เธอสะบัดร่มคันเล็กเดินเข้ามา
พอเผลอหันมาประสานกันทางสายตา, กลับทำให้ใจเต้นแรงอย่างไม่รู้ตัว
รอยยิ้มอ่อนโยนที่เธอส่งคืนให้, ละลายความเหงาในอกจนหมดสิ้น
โลกที่เคยเงียบเหงาเหมือนหยุดหมุนเวียน, กลายเป็นเพลงอุ่นละมุนอยู่รอบตัว
ไม่ต้องพูดคำหวานให้ดูสวยหรู, แค่ได้นั่งฟังเสียงฝนอยู่ใกล้เธอ
ความสบายใจเกิดขึ้นอย่างง่ายดาย, เหมือนรู้จักกันมานานก่อนได้เจอ

[Pre-Chorus 1: Rising Emotional Lift, Smooth Sustained Open Vowels]
จากคนแปลกหน้าในบ่ายวันฝนพรำ,
กลายเป็นเรื่องงดงามที่เฝ้ารอเจอ,
หัวใจที่เคยปิดประตูไว้แน่น,
ก็เริ่มเปิดออกกว้างเพียงเพราะเธอ

[Chorus 1: Catchy Anthemic Hook, Punchy 7-10 Syllable Lines, Emotional Peak]
ขอบคุณสายฝนที่พาเธอเดินเข้ามา,
เติมความอุ่นในวันที่โลกเย็นชา,
แค่ได้มองตากันก็เข้าใจ,
เธอคือแสงเช้าในใจตลอดไป,
ไม่ต้องการคำสัญญาที่ยิ่งใหญ่,
ขอแค่เดินกางร่มเคียงข้างกันไป,
โลกจะหมุนเปลี่ยนผันสักเท่าไร,
แค่มีเธอก็อุ่นใจทุกเวลา!

[Instrumental Solo Interlude: Sweet Acoustic Nylon Guitar & Soft Piano Melody - 4-8 Bars]

[Verse 2: Deepening Story & Dynamic Melodic Groove, Smooth Internal & Tail Rhymes - No Spoken Word]
จากวันนั้นเราก็มักเจอกันบ่อย, เก้าอี้เดิมโต๊ะไม้ตัวข้างกระจก
เล่าเรื่องเล็กน้อยให้กันฟังไม่ตลก, แค่เธอหัวเราะโลกทั้งใบก็สดใส
วันไหนงานหนักจนฉันเกือบหมดแรง, เธอไม่ถามมากแค่จับมือกันไว้
ความเงียบที่ไม่ต้องอธิบายสิ่งใด, แต่กลับซึ้งลึกซึ้งกว่าคำพูดเป็นพัน
ไม่ต้องแต่งเติมอะไรให้วุ่นวาย, เราต่างเป็นพื้นที่พักใจของกัน
ฝนตกแดดออกก็ยังเดินเคียงข้าง, ทุกเช้าตื่นมามีความหมายทุกวัน
จากความบังเอิญเล็กน้อยในร้านเดิม, กลายเป็นความจริงที่งดงามที่สุด
อยากดูแลเธอให้นานที่สุดเท่าทำได้, ให้รอยยิ้มนี้ไม่จางหายไปไหน

[Pre-Chorus 2: Stronger Harmonic Swell, Brand-New Escalating Lyrics]
ต่อให้ฤดูเปลี่ยนเวียนวนผ่านไป,
ความรู้สึกแรกไม่เคยลดน้อยลง,
ทุกครั้งที่ฝนโปรยลงมาข้างทาง,
ยังนึกถึงวันแรกที่เรามองตาตรง

[Chorus 2: Returning Signature Earworm Hook + Evolving Emotional Payoff]
ขอบคุณสายฝนที่พาเธอเดินเข้ามา,
เติมความอุ่นในวันที่โลกเย็นชา,
แค่ได้มองตากันก็เข้าใจ,
เธอคือแสงเช้าในใจตลอดไป,
จะจับมือเธอเดินผ่านทุกฤดู,
เป็นคนข้างกายที่ไม่ปล่อยให้เหงาใจ,
ความรักเรียบง่ายแต่ซื่อตรงข้างใน,
คือของขวัญล้ำค่าที่สุดในชีวิต!

[Bridge: Stripped-Back Intimate Confession Building to Soaring Vocal Climax]
ไม่เคยคิดว่าความรักแท้หน้าตาแบบไหน,
จนวันที่เธอเอียงร่มบังฝนให้ฉัน,
เพิ่งเข้าใจว่าความสุขที่ไม่ต้องตามหา,
คือการได้ตื่นมาเจอเธอทุกวัน!

[Final Chorus: Full Band Goosebumps Anthem, Maximum Vocal Power & Golden Punchline]
ขอบคุณสายฝนที่พาเธอเดินเข้ามา,
เติมความอุ่นในวันที่โลกเย็นชา,
แค่ได้มองตากันก็เข้าใจ,
เธอคือแสงเช้าในใจตลอดไป,
ต่อให้วันข้างหน้าฟ้าไม่เป็นใจ,
ฉันจะกางร่มคอยปกป้องเธอเอง,
อยู่ด้วยกันไปจนวันผมเปลี่ยนสี,
รักเธอแบบนี้ไม่มีวันเปลี่ยนแปลง!

[Outro: Gentle Lingering Melodic Echo & Soft Instrumental Fade - No Spoken Word]
แสงแดดอ่อนส่องลงกลางสายฝนพรำ,
ตั้งแต่มีเธออยู่ข้างกันก็อุ่นใจ...

[End]`,
    rain: `ชื่อเพลง: คืนฝนพรำที่ยังหวังดี (Midnight Rain Reflection)
คำพาดหัวสะกิดใจ: ฝนตกทีไรก็แอบคิดถึงเธอ... ไม่โกรธเลยสักนิด แค่ขอให้เธอมีความสุข 🌧️
ประโยคหมุดทองคำ: คืนฝนพรำตรงหน้าต่างที่ไร้เธอ / ใจยังเผลอคิดถึงอยู่เสมอ / ขอให้ทางเดินใหม่มีแต่คนใจดี / ฝนซาเมื่อไรขอให้เธอยิ้มสักที
Style of Music: Melancholic Thai city pop-soul, vintage rhodes piano, smooth rainy groove, warm male vocal, catchy hook, 78 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Warm Melancholic Male Vocal, Intimate Rhodes Groove, Catchy Emotional Chorus, No Spoken Word]

[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]
แสงไฟนีออนสะท้อนบนกระจกเปียก, เสียงเม็ดฝนเคาะหน้าต่างยามดึกดื่น
ร่มคันเดิมยังวางพิงข้างประตูยืน, เหมือนรอคนที่เคยเดินกลับพร้อมกัน
ถนนข้างล่างรถวิ่งผ่านเชื่องช้า, น้ำขังสะท้อนแสงเมืองที่แสนเงียบงัน
แก้วกาแฟว่างเปล่าบนโต๊ะข้างฉัน, ชวนให้นึกถึงเรื่องราววันวานของเรา
เคยเดินเบียดใต้ร่มเล็กคันเดียวกัน, หัวเราะอย่างอุ่นใจกลางซอยมืดตอนฝนตก
วันนี้เดินคนเดียวท่ามกลางลมหนาว, ไหล่ข้างซ้ายเปียกปอนกว่าที่เคยเป็น
แต่พอหลับตานึกถึงรอยยิ้มเธอ, ความเหงากลับกลายเป็นความห่วงใยที่ชัดเจน
แค่เธอไปเจอวันพรุ่งนี้ที่ดีกว่า, ฉันก็พร้อมยอมรับทุกอย่างด้วยเต็มใจ

[Pre-Chorus 1: Rising Emotional Lift, Smooth Sustained Open Vowels]
กาลเวลาพัดพาเราห่างกันไปไกล,
แต่ความหวังดีไม่เคยลบเลือนหาย,
คืนที่ฝนตกหนักกว่าทุกค่ำคืน,
ยังแอบถามฟ้าว่าเธอสบายดีไหม

[Chorus 1: Catchy Anthemic Hook, Punchy 7-10 Syllable Lines, Emotional Peak]
คืนฝนพรำตรงหน้าต่างที่ไร้เธอ,
ใจยังเผลอคิดถึงอยู่เสมอ,
ขอให้ทางเดินใหม่มีแต่คนใจดี,
ฝนซาเมื่อไรขอให้เธอยิ้มสักที,
ไม่เคยเสียใจที่ได้รักเธอวันนั้น,
ขอบคุณทุกความทรงจำที่แสนดี,
ต่อให้วันนี้เราไม่ได้เดินร่วมทาง,
แค่เธอปลอดภัยฉันก็สบายใจแล้ว!

[Instrumental Solo Interlude: Moody Vintage Rhodes Piano & Clean Guitar Solo - 4-8 Bars]

[Verse 2: Deepening Story & Dynamic Melodic Groove, Smooth Internal & Tail Rhymes - No Spoken Word]
เลื่อนดูรูปเก่าในมือถือเพียงลำพัง, ยังจำได้ทุกมุมร้านที่เราเคยไป
ข้อความสุดท้ายไม่ได้ลบออกจากใจ, เก็บไว้เตือนว่าครั้งหนึ่งเคยรักมากเพียงใด
เมืองใหญ่ยามค่ำผู้คนต่างรีบเร่ง, ซ่อนความเหนื่อยล้าไว้ใต้ร่มคนละคัน
ฉันยืนมองแสงไฟริมทางจางลง, ปล่อยความคิดถึงลอยไปกับสายลมเย็น
ไม่มีคำต่อว่าหรือความโกรธเคือง, มีเพียงความเข้าใจในสิ่งที่ผ่านพ้น
เราต่างเติบโตคนละเส้นทางของตน, เก็บบทเรียนงดงามไว้ในหัวใจ
หากวันไหนเธอเหนื่อยจากโลกภายนอก, จำไว้ว่าเคยมีคนนี้คอยเอาใจช่วย
ส่งกำลังใจผ่านคืนฝนพรำแสนไกล, ให้ท้องฟ้าเปิดรับเธอด้วยความอบอุ่น

[Pre-Chorus 2: Stronger Harmonic Swell, Brand-New Escalating Lyrics]
เสียงหยดฝนกระทบพื้นถนนดังเบา,
ช่วยชะล้างความเจ็บให้เจือจาง,
เหลือไว้เพียงคำอวยพรที่จริงใจ,
ส่งไปให้คนไกลบนเส้นทางของเธอ

[Chorus 2: Returning Signature Earworm Hook + Evolving Emotional Payoff]
คืนฝนพรำตรงหน้าต่างที่ไร้เธอ,
ใจยังเผลอคิดถึงอยู่เสมอ,
ขอให้ทางเดินใหม่มีแต่คนใจดี,
ฝนซาเมื่อไรขอให้เธอยิ้มสักที,
ขอให้ทุกเช้าของเธอสดใสกว่าเดิม,
เจอคนที่พร้อมดูแลไม่ทำให้เสียน้ำตา,
คืนฝนพรำนี้แม้ต้องเหงาลำพัง,
ยังดีใจที่ครั้งหนึ่งเคยได้รักกัน!

[Bridge: Stripped-Back Intimate Confession Building to Soaring Vocal Climax]
อาจมีบางคืนที่เผลอเหงาขึ้นมา,
เวลาที่ฝนโปรยลงมาไม่ทันตั้งตัว,
แต่แค่รู้ว่าตรงนั้นเธอมีความสุขดี,
เท่านี้หัวใจฉันก็หายห่วงแล้ว!

[Final Chorus: Full Band Goosebumps Anthem, Maximum Vocal Power & Golden Punchline]
คืนฝนพรำตรงหน้าต่างที่ไร้เธอ,
ใจยังเผลอคิดถึงอยู่เสมอ,
ขอให้ทางเดินใหม่มีแต่คนใจดี,
ฝนซาเมื่อไรขอให้เธอยิ้มสักที,
เก็บรอยยิ้มเธอไว้เป็นความทรงจำงาม,
ก้าวต่อไปข้างหน้าอย่างเข้มแข็งกว่าเดิม,
ขอให้โชคดีนะคนเคยร่วมทาง,
รักและหวังดีเสมอแม้ฝนซาแล้ว...

[Outro: Gentle Lingering Melodic Echo & Soft Instrumental Fade - No Spoken Word]
คืนฝนพรำผ่านพ้นไปในราตรี,
โชคดีนะ... จากคนที่ยังหวังดีเสมอ...

[End]`,
    rock: `ชื่อเพลง: สุดทางฝันที่ไม่เคยถอย (No Turning Back)
คำพาดหัวสะกิดใจ: ล้มกี่ครั้งก็ไม่ถอย... ปลายนิ้วที่ด้านชาจากสายกีตาร์ จะพาเราไปยืนบนเวทีจริง ⚡🎸
ประโยคหมุดทองคำ: ต่อให้ล้มสักร้อยครั้งก็จะลุกขึ้นยืน / ต่อให้มืดทั้งคืนก็จะฝืนเดินไป / เลือดนักสู้ยังเต้นแรงอยู่ในหัวใจ / ไม่ถึงเส้นชัยไม่มีวันถอยกลับ!
Style of Music: Thai modern folk-rock anthem, driving electric guitars, punchy drums, raspy male rock vocal, catchy chorus, 88 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out

[Voice: Raspy Emotional Male Rock Vocal, 100% Pitched Melodic Verse, Soaring Catchy Power Chorus, No Spoken Word]

[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]
ห้องเช่าห้องเล็กกับกีตาร์ตัวเก่า, ซ้อมจนสายขาดและปลายนิ้วด้านชา
เล่นหน้าเวทีที่ไร้คนเงยหน้ามอง, แลกค่าแรงน้อยนิดพอประทังเวลา
เสียงหัวเราะเยาะจากคนที่ไม่เข้าใจ, ถามว่าเมื่อไรจะตื่นจากความฝัน
เก็บคำดูถูกมาเป็นเชื้อไฟทุกวัน, ก้มหน้าซ้อมซ้ำจนเที่ยงคืนทุกคืน
รองเท้าคู่เดิมที่พื้นใกล้หลุดรุ่ย, เดินแบกความหวังฝ่าถนนสายเดิม
ไม่มีเส้นสายไม่มีใครคอยผลักดัน, มีเพียงหัวใจที่ไม่รู้จักยอมแพ้
แผลเป็นบนมือบอกเล่าทุกก้าวที่ผ่านมา, ว่าราคาความฝันต้องแลกด้วยน้ำตา
แต่วินาทีที่จับไมค์และดีดคอร์ด, ทั้งโลกก็รู้ว่าใจนี้ยังสู้ไหว

[Pre-Chorus 1: Rising Emotional Lift, Smooth Sustained Open Vowels]
ท้องฟ้ามืดครึ้มไม่เคยทำให้กลัว,
รอยแผลตามตัวเป็นเครื่องหมายเตือนใจ,
คนที่ไม่เคยล้มไม่รู้จักการลุก,
คืนนี้ขอลุยสุดแรงที่มีข้างใน!

[Chorus 1: Catchy Anthemic Hook, Punchy 7-10 Syllable Lines, Emotional Peak]
ต่อให้ล้มสักร้อยครั้งก็จะลุกขึ้นยืน,
ต่อให้มืดทั้งคืนก็จะฝืนเดินไป,
เลือดนักสู้ยังเต้นแรงอยู่ในหัวใจ,
ไม่ถึงเส้นชัยไม่มีวันถอยกลับ!
เสียงฟ้าคำรามก็ไม่อาจขวางทาง,
สองมือสองเท้ายันโลกไว้ไม่หวั่น,
เกิดมาหนึ่งครั้งขอเดิมพันด้วยฝัน,
จนกว่าจะถึงวันที่ฟ้าเป็นของเรา!

[Instrumental Solo Interlude: Soaring Overdriven Electric Guitar Solo & Driving Drum Fill - 4-8 Bars]

[Verse 2: Deepening Story & Dynamic Melodic Groove, Smooth Internal & Tail Rhymes - No Spoken Word]
จำคืนฝนตกต้องนั่งกินบะหมี่ถ้วย, นั่งปรับเสียงร้องอยู่ข้างหน้าต่างบานเดิม
บอกกับตัวเองว่าอย่าเพิ่งท้อเลยนะ, พรุ่งนี้อาจเป็นวันของเราเริ่มต้นใหม่
เพื่อนร่วมวงที่กอดคอสู้ข้างกัน, แบ่งกันกินแบ่งกันฝันไม่เคยทิ้งหนี
จากคนดูสามคนหน้าเวทีแคบเล็ก, วันนี้แสงไฟสาดส่องสว่างเต็มเวที
ทุกหยาดเหงื่อที่เคยหยดลงพื้นซ้อม, กลายเป็นพลังให้ร้องก้องออกไป
ไม่มีทางลัดสำหรับคนธรรมดา, มีเพียงวินัยและความกล้าในหัวใจ
ใครจะมองว่าบ้าก็ปล่อยเขาพูดไป, เพราะคนที่ชนะคือคนที่ไม่หยุดเดิน
แม้ลมจะแรงพัดซัดใส่หน้าเท่าไร, จะก้าวต่อไปจนสุดปลายเส้นขอบฟ้า!

[Pre-Chorus 2: Stronger Harmonic Swell, Brand-New Escalating Lyrics]
ได้ยินไหมเสียงหัวใจที่เต้นดัง,
เสียงกลองปลุกพลังข้างในให้ลุกโชน,
จากเด็กหลังห้องที่ใครเคยมองข้าม,
วันนี้พร้อมก้าวขึ้นยืนกลางแสงไฟ!

[Chorus 2: Returning Signature Earworm Hook + Evolving Emotional Payoff]
ต่อให้ล้มสักร้อยครั้งก็จะลุกขึ้นยืน,
ต่อให้มืดทั้งคืนก็จะฝืนเดินไป,
เลือดนักสู้ยังเต้นแรงอยู่ในหัวใจ,
ไม่ถึงเส้นชัยไม่มีวันถอยกลับ!
ไม่ยอมขายฝันเพื่อแลกทางสบาย,
ยืนหยัดด้วยลายเซ็นจริงที่ไม่เปลี่ยน,
ทุกคำดูถูกในวันวานเป็นบทเรียน,
ผลักให้เราก้าวมาไกลเกินใครคิด!

[Bridge: Stripped-Back Intimate Confession Building to Soaring Vocal Climax]
ตอนที่เหนื่อยจนแทบไม่มีแรงหายใจ,
มองกลับไปหาเด็กคนเดิมในกระจก,
บอกเขาว่าขอบคุณที่ไม่ยอมแพ้วันนั้น,
วันนี้ความฝันของเรากำลังเป็นจริงแล้ว!

[Final Chorus: Full Band Goosebumps Anthem, Maximum Vocal Power & Golden Punchline]
ต่อให้ล้มสักร้อยครั้งก็จะลุกขึ้นยืน,
ต่อให้มืดทั้งคืนก็จะฝืนเดินไป,
เลือดนักสู้ยังเต้นแรงอยู่ในหัวใจ,
ไม่ถึงเส้นชัยไม่มีวันถอยกลับ!
ชูมือขึ้นฟ้าตะโกนก้องไปให้ไกล,
บอกคนทั้งโลกว่าความฝันเป็นจริงได้,
สองมือของฉันคว้าดาวมาด้วยหัวใจ,
และนี่คือชัยชนะของคนไม่ยอมแพ้!

[Outro: Gentle Lingering Melodic Echo & Soft Instrumental Fade - No Spoken Word]
เดินหน้าต่อไป... อย่าหยุดฝัน,
ปลายทางรอคนที่ไม่ยอมแพ้อยู่เสมอ!

[End]`
  };

  // Export as Agent SKILL.md
  const handleExportSkill = () => {
    const skillContent = `---
name: suno-v6-mini-hit-songwriter
description: บรมครูนักแต่งเพลงฮิต Suno v6 - Mini (v125.0) ไม่มีท่อน Intro และไร้ท่อนพูด 100% ฟังลื่นหู สัมผัสลงตัว ฮิตติดหู ความหมายดีเข้าถึงอารมณ์
---

${SUNO_GRANDMASTER_SYSTEM_PROMPT}`;

    const blob = new Blob([skillContent], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "SKILL.md";
    a.click();
    setCopiedSkill(true);
    setTimeout(() => setCopiedSkill(false), 2500);
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

  // Live Hit Song Quality, Zero-Intro, Zero-Spoken & Natural Thai Scanner (v125.0)
  const lyricAuditSummary = useMemo(() => {
    const rawLyrics = extractLyrics(outputResult);
    if (!rawLyrics) return null;

    const rawLines = rawLyrics.split(/\r?\n/).map((l) => l.trim());
    const lines: string[] = [];
    const nonChorusLines: string[] = [];
    let inChorus = false;

    for (const line of rawLines) {
      if (!line || line.startsWith("#") || line.startsWith("*") || line.startsWith("-")) continue;
      if (line.startsWith("[")) {
        if (/^\[(Final\s+)?Chorus\b/i.test(line) && !/Pre-Chorus/i.test(line)) {
          inChorus = true;
        } else if (/^\[(Verse|Pre-Chorus|Bridge|Outro|Intro|Instrumental|Beat\s+Switch|Transition|End)/i.test(line)) {
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
    const breathPocketLines = lines.filter((l) => l.includes(",") || l.includes(" ")).length;
    const breathRatio = lines.length > 0 ? Math.round((breathPocketLines / lines.length) * 100) : 100;

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

    // Estimated duration in minutes:seconds (~3.7s per line + ~22s solo interlude & transitions)
    const estTotalSec = Math.round(lines.length * 3.7 + (lines.length >= 40 ? 22 : 10));
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
      estDurationStr,
      isOptimalLength: lines.length >= 44,
      hasIntroTag,
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
        redupMatches.length === 0 &&
        bracketClutter.length === 0 &&
        weirdPhrases.length === 0 &&
        duplicateLineCount === 0 &&
        spokenMatches.length === 0,
    };
  }, [outputResult, story]);

  // 1-Click Auto-Clean & Polish Lyrics for Suno (Also cleans Intro tag, spoken tags, archaic clichés & double syllables!)
  const handleAutoCleanLyrics = () => {
    if (!outputResult) return;
    let cleaned = outputResult
      .replace(/\((?:สัมผัส|เสียง|หมายเหตุ|ไรม์)[^)]*\)/gi, "")
      .replace(/\[(เสียง|สัมผัส):[^\]]*\]/gi, "")
      .replace(/\[(Spoken|Narration|Monologue|Talking|Speech|Dialogue)[^\]]*\]/gi, "[Verse: 100% Sung Melodic Vocal - No Spoken Word]");

    if (/\[Verse\s*1\b/i.test(cleaned)) {
      cleaned = cleaned.replace(/^[ \t]*\[Intro\b[^\]]*\][ \t]*\r?\n?/gim, "");
    } else {
      cleaned = cleaned.replace(
        /^\[Intro\b[^\]]*\]/gim,
        "[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]"
      );
    }

    cleaned = cleaned
      .replace(/จิตตั้ง/g, "ตั้งใจมั่น")
      .replace(/ใจหมาย/g, "มุ่งหวังในใจ")
      .replace(/หมายใจ/g, "ตั้งใจไว้")
      .replace(/ทอนกำลัง/g, "บั่นทอนกำลังใจ")
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
      .replace(/เล็กเล็ก/g, "หลังน้อย")
      .replace(/เบาเบา/g, "แผ่วเบา")
      .replace(/ซ้ำซ้ำ/g, "ตอกย้ำ")
      .replace(/ไกลไกล/g, "แสนไกล")
      .replace(/นานนาน/g, "เนิ่นนาน")
      .replace(/ช้าช้า/g, "เนิบนาบ")
      .replace(/ดีดี/g, "งดงาม")
      .replace(/ค่อยค่อย/g, "เริ่มจะ")
      .replace(/บางบาง/g, "อ่อนโยน")
      .replace(/เงียบเงียบ/g, "ลำพัง")
      .replace(/เปล่าเปล่า/g, "เพียงลำพัง");
    setOutputResult(cleaned);
  };

  // Extract lyrics and forward to next tab
  const handlePassToMv = () => {
    let extractedLyrics = extractLyrics(outputResult);
    let extractedTitle = "บทเพลงระดับตำนาน";

    const titleMatch = outputResult.match(/ชื่อเพลง[:\s*]+([^\n\r]+)/i);
    if (titleMatch && titleMatch[1]) {
      extractedTitle = titleMatch[1].replace(/[*#]/g, "").trim();
    } else if (story.trim()) {
      const firstLine = story.trim().split("\n")[0].replace(/[*#]/g, "").trim();
      if (firstLine.length > 2) {
        extractedTitle = firstLine.slice(0, 24);
      }
    }

    onSendToMv({
      title: extractedTitle,
      lyrics: extractedLyrics || story,
      mood: mood,
      credit: "megapoomz",
      hookHeadline: outputResult ? extractHook(outputResult) : undefined,
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
                  🚫 NO INTRO & ZERO SPOKEN WORD
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🔥 CATCHY EARWORM HOOK (ฮิตติดหู)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  🎵 ฟังลื่นหู & สัมผัสลงตัว
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  <span>👑 ไตรภาคี 3 ศิลปิน (SD PMR × P9D × NS-A755)</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-fuchsia-500/20 text-amber-200 border border-amber-500/40 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>❤️ ความหมายดีเข้าถึงอารมณ์ (v125.0)</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1.5">
                ระบบสกัดพรอพแต่งเพลงฮิตติดหู ฟังลื่นหู กินใจ (SD PMR × P9D × NS-A755 Refined v125.0)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                <strong>เอาท่อน [Intro] ออก 100% เปิดเข้า [Verse 1] ทันที</strong> • <strong>ไร้ท่อนพูด 100%</strong> • <strong>สร้างประโยคฮุคจำหลัก (Signature Earworm Hook) ฮิตติดหู</strong> + <strong>ฟังลื่นหู สัมผัสลงตัวไม่ฝืนคำ</strong> + <strong>เล่าเรื่องด้วยภาพจำจริง (Show, Don&apos;t Tell) เข้าถึงอารมณ์คนฟัง!</strong>
              </p>
            </div>
          </div>

          {/* Export as SKILL.md */}
          <button
            onClick={handleExportSkill}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-fuchsia-300 border border-fuchsia-500/30 transition-all whitespace-nowrap"
            title="ดาวน์โหลดไฟล์ SKILL.md เพื่อนำไปติดตั้งในระบบ Agent ได้ทันที"
          >
            {copiedSkill ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedSkill ? "บันทึก SKILL.md แล้ว" : "บันทึกเป็นทักษะ (SKILL.md)"}</span>
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

            {/* Flow & Rhyme Archetype Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>สูตรฉันทลักษณ์ & ไรม์สัมผัส (Rhyme & Flow Architecture):</span>
                </label>
                <span className="text-[10px] text-fuchsia-300 font-bold">
                  {flowStyle === "trinity" ? "👑 ไตรภาคี 3 ศิลปิน" : flowStyle === "sdpmr-folk" ? "🌾 เพื่อชีวิตสัจธรรม" : "🎤 บูมแบ็ปสตรีท"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFlowStyle("trinity")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    flowStyle === "trinity"
                      ? "bg-fuchsia-950/50 border-fuchsia-500 text-fuchsia-200 ring-1 ring-fuchsia-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-fuchsia-300">👑 ไตรภาคีฮิตติดชาร์ต</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    เปิดเข้า Verse ทันที ลื่นหู สัมผัสลงตัว + ฮุคจำติดหู
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
                  <span className="text-xs font-bold block text-amber-300">🌾 สไตล์ SD PMR</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    เพื่อชีวิตร่วมสมัย เห็นภาพจริง ลากสระกินใจ ฮุคติดหู
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
                    บูมแบ็ปสตรีท สัมผัสพวงภาษาพูดเด้งรับบีท 84 BPM
                  </span>
                </button>
              </div>
            </div>

            {/* Rhyme Intensity & Resonance Matrix */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ระดับความลงตัวของสัมผัส & จังหวะร้อง:</span>
                </label>
                <span className="text-[10px] text-amber-300 font-bold">
                  {rhymeIntensity === "supreme"
                    ? "👑 สัมผัสลงตัวลื่นหู (Balanced Hit)"
                    : rhymeIntensity === "sharp"
                    ? "⚡ คมชัดลงบีท (Sharp Natural)"
                    : "🌸 ละมุนเข้าปาก (Melodic Flow)"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRhymeIntensity("supreme")}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    rhymeIntensity === "supreme"
                      ? "bg-amber-950/50 border-amber-500 text-amber-200 ring-1 ring-amber-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-amber-300">👑 ลงตัวลื่นหูขั้นสุด</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    สัมผัสพวงธรรมชาติ + เชื่อมวรรคเนียน ไม่ลิ้นพัน
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
                  <span className="text-xs font-bold block text-fuchsia-300">⚡ คมชัดลงบีท</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    สัมผัสพวง 2-3 พยางค์ภาษาพูดจริง เด้งติดหู
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRhymeIntensity("melodic")}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    rhymeIntensity === "melodic"
                      ? "bg-cyan-950/50 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block text-cyan-300">🌸 ละมุนเข้าปาก</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    อารมณ์นำสัมผัส เมโลดี้ร้องตามง่าย ซึ้งกินใจ
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
                  <span className="text-[10px] text-amber-300/80 font-mono">v125.0 Hit Vault</span>
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
                  <span>สไตล์เสียงร้อง (Vocal Style & Delivery) *</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <span>🔒 ล็อคเสียงสะกดใจ (Active)</span>
                </span>
              </div>
              <input
                type="text"
                value={vocalStyle}
                onChange={(e) => setVocalStyle(e.target.value)}
                placeholder="เช่น ขอเสียงผู้ชายอบอุ่นซึ้งกินใจ..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-all font-medium"
              />
              {/* Vocal Presets */}
              <div className="space-y-1 pt-1">
                {vocalPresets.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setVocalStyle(v)}
                    className="w-full text-left text-[11px] bg-slate-800/50 hover:bg-slate-800 text-slate-300 p-2 rounded-lg border border-slate-700/30 truncate block transition-all"
                  >
                    {v.startsWith("🔒") ? v : `🎤 ${v}`}
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
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="w-full flex items-center justify-center space-x-2 py-4 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white shadow-xl shadow-fuchsia-600/30 transition-all hover:scale-[1.01] active:scale-95"
              >
                {copiedFullPrompt ? (
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
                  ระบบสายพาน 3 ขั้นตอน (v125.0 ไม่มี Intro • ลื่นหู • สัมผัสลงตัว • ฮิตติดหู)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-fuchsia-600/30 hover:bg-fuchsia-600 text-fuchsia-200 hover:text-white border border-fuchsia-500/40 transition-all font-semibold"
                  title="ขั้นที่ 1: คัดลอกพรอมต์แต่งเพลงฮิต (ไม่มีท่อน Intro, ฟังลื่นหู, สัมผัสลงตัว, ฮุคติดหู & กินใจ)"
                >
                  {copiedFullPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFullPrompt ? "คัดลอกขั้นที่ 1 แล้ว!" : "1. พรอมต์แต่งเพลง"}</span>
                </button>
                <button
                  onClick={handleCopyAuditPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 transition-all font-semibold"
                  title="ขั้นที่ 2: คัดลอกพรอมต์ผ่าตัดรอบแรก (เอา Intro/ท่อนพูดออก, เกลาคำลื่นหู, ปั้นฮุคติดหู & สัมผัสลงตัว)"
                >
                  {copiedAuditPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Wand2 className="w-3.5 h-3.5 text-amber-300" />}
                  <span>{copiedAuditPrompt ? "คัดลอกรอบแรกแล้ว!" : "2. พรอมต์ตรวจสอบรอบแรก"}</span>
                </button>
                <button
                  onClick={handleCopyFinalAuditPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 transition-all font-semibold"
                  title="ขั้นที่ 3: คัดลอกพรอมต์ขัดเกลารอบสุดท้าย (จำลองร้องจริงในห้องอัด, วรรณยุกต์เข้าปาก & Gold Master)"
                >
                  {copiedFinalAuditPrompt ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />}
                  <span>{copiedFinalAuditPrompt ? "คัดลอกรอบสุดท้ายแล้ว!" : "3. พรอมต์ตรวจสอบรอบสุดท้าย"}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              แม่แบบเพลงฮิตติดชาร์ต <strong>(9 ท่อน ~54–56 บรรทัด / 3:20–4:10 นาที v125.0)</strong>: <strong>เอาท่อน [Intro] ออก 100% เปิดเข้า [Verse 1] ทันที</strong> • <strong>ไร้ท่อนพูด</strong> • <strong>ฟังลื่นหู สัมผัสลงตัว &amp; วรรณยุกต์เข้าปาก</strong> • <strong>มีฮุคจำติดหู (Earworm Hook)</strong> • <strong>ความหมายดีเข้าถึงอารมณ์ (Show, Don&apos;t Tell)</strong>:
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
                  onClick={() => {
                    navigator.clipboard.writeText(outputResult);
                    setCopiedAll(true);
                    setTimeout(() => setCopiedAll(false), 2000);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? "คัดลอกทั้งหมดแล้ว" : "คัดลอกทั้งหมด"}</span>
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
                      <span>🔍 ระบบตรวจสอบ 2 ด่าน (รอบแรก: เอา Intro ออก, ปั้นฮุคติดหู &amp; ลื่นหู ➔ รอบสุดท้าย: จำลองร้องในห้องอัด, วรรณยุกต์เข้าปาก 100%)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        v125.0 3-Stage
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      แยกภารกิจชัดเจนเพื่อให้เพลงสมบูรณ์ที่สุด: <strong>ตรวจสอบรอบแรก</strong> (เอา [Intro]/ท่อนพูดออก ปั้นฮุคฮิตติดหู สัมผัสลงตัว &amp; ภาพจำกินใจ) ➔ <strong>ตรวจสอบรอบสุดท้าย</strong> (จำลองร้องออกเสียงจริง วรรณยุกต์ลงตัว ร้องเข้าปาก &amp; ล็อก Gold Master!)
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
                  { id: 'all', label: '🎯 ครบทุกมิติ (ไม่มี Intro • ลื่นหู • ฮุคติดหู • กินใจ)' },
                  { id: 'antirepeat', label: '🔥 เอา Intro/พูดออก & ปั้นฮุคติดหู' },
                  { id: 'natural', label: '❤️ ภาษาธรรมชาติ & ภาพจำ Show Don’t Tell' },
                  { id: 'rhyme', label: '✨ สัมผัสลงตัว ลื่นไหลไม่ฝืนคำ' },
                  { id: 'flow', label: '🎵 ไดนามิกพยางค์ & วรรณยุกต์เข้าปาก' },
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
                    🛠️ ด่านที่ 1 (ขั้นที่ 2): พรอมต์ผ่าตัดรอบแรก — เอา Intro/พูดออก, ปั้นฮุคติดหู, เกลาสัมผัสลงตัว &amp; ภาพจำกินใจ
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">Stage 2: Zero-Intro &amp; Hit Hook Surgery</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAuditPrompt}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-600/25 transition-all hover:scale-[1.01] active:scale-95"
                  >
                    {copiedAuditPrompt ? (
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
                    {copiedAuditWithLyrics ? (
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
                    {copiedFinalAuditPrompt ? (
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
                    {copiedFinalAuditWithLyrics ? (
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
                <span>💡 <strong>ทำไมต้องขัดเกลา 2 รอบ?:</strong> รอบแรกช่วยตัดท่อน [Intro] ที่ยืดเยื้อออก วางฮุคติดหู และเล่าเรื่องเห็นภาพจริง ➔ รอบสุดท้ายสวมบทโปรดิวเซอร์คุมร้องจริงในห้องอัด เช็กวรรณยุกต์ จังหวะหายใจ และล้างคำฝืนสัมผัสให้ร้องเข้าปากลื่นหู 100%!</span>
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
                          ผลชันสูตรคุณภาพเพลงฮิต (ไม่มี Intro • ไร้ท่อนพูด • ลื่นหู • ฮุคติดหู v125.0):
                        </span>
                      </div>
                      {!lyricAuditSummary.isClean && (
                        <button
                          type="button"
                          onClick={handleAutoCleanLyrics}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center space-x-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>✨ คลีน Intro, คำแปลก &amp; แท็กพูดอัตโนมัติ (1-Click Clean)</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">ความยาวเพลงฮิต</span>
                        <span className={`font-bold ${lyricAuditSummary.isOptimalLength ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {lyricAuditSummary.totalLines} บรรทัด (~{lyricAuditSummary.estDurationStr})
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">ท่อน Intro &amp; พูด</span>
                        <span className={`font-bold ${!lyricAuditSummary.hasIntroTag && lyricAuditSummary.spokenCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {!lyricAuditSummary.hasIntroTag && lyricAuditSummary.spokenCount === 0
                            ? '✅ ไม่มี Intro/พูด 100%'
                            : `🚨 พบ ${lyricAuditSummary.hasIntroTag ? 'Intro ' : ''}${lyricAuditSummary.spokenCount > 0 ? `พูด(${lyricAuditSummary.spokenCount})` : ''}`}
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
                        <span className="text-slate-400 block text-[10px]">จังหวะหายใจ (,)</span>
                        <span className={`font-bold ${lyricAuditSummary.breathRatio >= 70 ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {lyricAuditSummary.breathRatio}% ลื่นหู
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">คำแปลก/ภาษาลิเก</span>
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
                    onClick={() => {
                      navigator.clipboard.writeText(extractLyrics(outputResult));
                      setCopiedLyricsOnly(true);
                      setTimeout(() => setCopiedLyricsOnly(false), 2000);
                    }}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-fuchsia-500/50 rounded-xl text-left transition-all group"
                  >
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">1. เนื้อเพลง Suno Mini</span>
                    <span className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                      {copiedLyricsOnly ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
                      )}
                      <span>{copiedLyricsOnly ? "คัดลอกแล้ว!" : "ก๊อป Lyrics (พร้อมวางใน Suno)"}</span>
                    </span>
                  </button>

                  {/* Copy Style */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(extractStyle(outputResult));
                      setCopiedStyleOnly(true);
                      setTimeout(() => setCopiedStyleOnly(false), 2000);
                    }}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition-all group"
                  >
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">2. สไตล์ดนตรี Mini (&lt;120ตัว)</span>
                    <span className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                      {copiedStyleOnly ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Sliders className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      )}
                      <span>{copiedStyleOnly ? "คัดลอกแล้ว!" : "ก๊อป Style of Music"}</span>
                    </span>
                  </button>

                  {/* Copy Song Title */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(extractTitle(outputResult));
                      setCopiedTitleOnly(true);
                      setTimeout(() => setCopiedTitleOnly(false), 2000);
                    }}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
                  >
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">3. ชื่อเพลง Suno Mini</span>
                    <span className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                      {copiedTitleOnly ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Music className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      )}
                      <span>{copiedTitleOnly ? "คัดลอกแล้ว!" : "ก๊อปชื่อเพลง"}</span>
                    </span>
                  </button>

                  {/* Copy Viral Hook */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(extractHook(outputResult));
                      setCopiedHookOnly(true);
                      setTimeout(() => setCopiedHookOnly(false), 2000);
                    }}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all group"
                  >
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">4. คำพาดหัว TikTok</span>
                    <span className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                      {copiedHookOnly ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Flame className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      )}
                      <span>{copiedHookOnly ? "คัดลอกแล้ว!" : "ก๊อป 3s Hook"}</span>
                    </span>
                  </button>
                </div>

                {/* Optional Exclude for Suno Web Full */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
                  <span>💡 สำหรับ <strong>Suno v6 Mini</strong> ใช้แค่ปุ่ม 1 (Lyrics) และ 2 (Style) ได้เลย ไม่ต้องใส่ Exclude</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(extractExclude(outputResult));
                      setCopiedExcludeOnly(true);
                      setTimeout(() => setCopiedExcludeOnly(false), 2000);
                    }}
                    className="text-slate-400 hover:text-slate-200 underline flex items-center space-x-1"
                    title="สำหรับผู้ใช้ Suno Pro/Custom เวอร์ชันเต็มบนเว็บ"
                  >
                    <ShieldCheck className="w-3 h-3 text-rose-400" />
                    <span>{copiedExcludeOnly ? "คัดลอก Exclude แล้ว" : "ก๊อป Exclude (ถ้าใช้ Suno บนเว็บ)"}</span>
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
                  หรือคลิกเลือกตัวอย่างเพลงสำเร็จรูป (ไม่มี Intro • ฟังลื่นหู • ฮิตติดหู • กินใจ) เพื่อทดสอบทันที:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.tripartite)}
                    className="p-2.5 rounded-xl bg-gradient-to-b from-fuchsia-950/40 to-slate-950 border border-fuchsia-500/50 hover:border-amber-400 text-left transition-all group col-span-2 sm:col-span-1"
                  >
                    <span className="text-base block mb-0.5">🌾</span>
                    <span className="text-xs font-bold text-amber-300 block group-hover:text-amber-200">รวงข้าวไม่อวดตน</span>
                    <span className="text-[10px] text-slate-400 truncate block">สัมผัสลงตัว ฮุคติดหู</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.phaw)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🌾</span>
                    <span className="text-xs font-bold text-white block group-hover:text-amber-400">เพื่อชีวิต (&quot;พ่อ&quot;)</span>
                    <span className="text-[10px] text-slate-400 truncate block">กินใจ น้ำตาซึม ไม่มี Intro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.love)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🌸</span>
                    <span className="text-xs font-bold text-white block group-hover:text-pink-400">เพลงรัก (&quot;แสงแรก&quot;)</span>
                    <span className="text-[10px] text-slate-400 truncate block">อบอุ่น ลื่นหู ฮุคหวาน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.rain)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🌧️</span>
                    <span className="text-xs font-bold text-white block group-hover:text-cyan-400">อกหัก (&quot;คืนฝนพรำ&quot;)</span>
                    <span className="text-[10px] text-slate-400 truncate block">ซิตี้ป๊อป ลึกซึ้งหวังดี</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.rock)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🎸</span>
                    <span className="text-xs font-bold text-white block group-hover:text-purple-400">ร็อก (&quot;สุดทางฝัน&quot;)</span>
                    <span className="text-[10px] text-slate-400 truncate block">พลังใจ ฮุคติดหู ไม่มี Intro</span>
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
