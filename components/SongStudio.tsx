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
    const m = raw.match(/Style of Music[:\s*]+([^\n\r]+)/i);
    if (m && m[1]) return m[1].replace(/[*_]/g, "").trim();
    return "Thai epic acoustic folk-rock meets soulful boom-bap, fingerstyle guitar, warm piano, punchy drums, soulful male melodic rap-singing, guitar solo, through-composed, 84 bpm";
  };

  const extractExclude = (raw: string): string => {
    const m = raw.match(/Exclude Styles[:\s*]+([^\n\r]+)/i);
    if (m && m[1]) return m[1].replace(/[*_]/g, "").trim();
    return "spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, repeated chorus, looped chorus, repeating lines, duplicate verse, short song, early fade out";
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

  // 100% Sung and Rapped Outputs (v120.0: 4+ Min Epic 12-Movement Marathon, Zero Spoken Word, 100% Unique Lines across all 76 lines)
  const sampleSongs = {
    tripartite: `ชื่อเพลง: รวงข้าวไม่เคยอวดรวง (The Humble Golden Grain - 4+ Min Epic Marathon)
การถอดรหัสแก่นเรื่องและคู่ตรงข้ามเปรียบเทียบ (SD PMR Parallel Contrast): รวงข้าวที่ยิ่งมีเมล็ดทองยิ่งโน้มลงต่ำ & ทองคำแท้ที่ไม่ต้องส่งเสียง VS ต้นหญ้าที่ไร้รวงแต่ชูยอดผยอง & กลองที่กลวงข้างในแต่ตีเสียงดัง
คำพาดหัวสะกิดใจ: กลองที่กลวงยิ่งตีดัง... ยิ่งฟังยิ่งรู้ว่าข้างในว่าง! คนจริงไม่ต้องอวด ให้ผลงานพูดแทนตัวเอง 🌾
ประโยคหมุดทองคำ: กลองที่กลวงยิ่งตีดัง ยิ่งฟังยิ่งรู้ว่าข้างในว่าง / ทองคำแท้ไม่ส่งเสียงพราง ยังมีค่าต่อให้ไร้คนชม!
Style of Music: Thai epic acoustic folk-rock meets soulful boom-bap, fingerstyle guitar, warm piano, punchy drums, soulful male melodic rap-singing, guitar solo, through-composed, 84 bpm
Exclude Styles: spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, repeated chorus, looped chorus, repeating lines, duplicate verse, short song, early fade out

[Voice: Locked Warm Soulful Male Baritone-Tenor, 100% Pitched Melodic Rap-Folk Groove, Multi-Syllable Chopper Bounce, Soaring Anthemic Chorus, Strictly Zero Spoken Word]

[Intro: Fingerstyle Acoustic Guitar & Clean Electric Lead, 100% Sung Melodic Vocal Hook - No Spoken Word]
เคยเห็นไหมเล่าคนหนึ่ง, ที่พูดเหมือนรู้ทุกอย่าง
เดินคุยโวไปทุกทาง, ว่าตนนั้นเหนือกว่าใคร
ชี้นิ้วคอยสอนคนอื่น, เหมือนยืนอยู่บนยอดเขา
แต่ยามต้องก้าวด้วยเท้า, กลับเหลือเพียงเงาว่างเปล่า

[Verse 1: Act I - Sung Melodic Rap-Folk Storytelling, Smooth 6-8+6-8 Groove - No Spoken Word]
รวงข้าวคราวออกรวง, ยิ่งหนักยิ่งก้มลงต่ำ
มิได้ร้องบอกใครซ้ำ, ว่าตนนั้นมีเมล็ดทอง
ต้นหญ้ากลับชูยอด, ลมพัดกอดก็ยังผยอง
ไร้รวงแต่เสียงก้อง, เหมือนตนสูงกว่าพื้นดิน
ภูเขาสูงสงบนิ่ง, ไม่เคยวิ่งประกาศตน
ไม่ต้องเรียกผู้คน, ให้แหงนหน้ามองขึ้นไป
แต่เนินดินก้อนเล็ก, กลับอยากเบ่งให้ยิ่งใหญ่
ยืนเขย่งสักเท่าไร, ก็ยังต่ำกว่าภูผา

[Pre-Chorus 1: Emotional Sung Melodic Lift, Sustained Long Vowels]
ความรู้ไม่ใช่ถ้อยคำ, มิใช่เพียงจำมาเล่า
ของจริงอยู่ยามเงียบเหงา, เมื่อไม่มีใครเฝ้ามอง
คุณค่าที่แท้ข้างใน, ไม่ต้องให้ใครรับรอง
เวลาจะช่วยคัดกรอง, ว่าสิ่งใดคือทองแท้จริง

[Chorus 1: Act I Anthemic Sung Hook, 8 Unique Lines, Single Pass, Do Not Repeat]
กลองที่กลวงยิ่งตีดัง, ยิ่งฟังยิ่งรู้ว่าข้างในว่าง
ทองคำแท้ไม่ส่งเสียงพราง, ยังมีค่าต่อให้ไร้คนชม
คนฉลาดไม่ต้องอวด, คนที่รู้จริงยิ่งถ่อมตน
คนบางคนพูดเสียจน, เหมือนเก่งล้นโลกทั้งใบ
อย่าดูคนจากเสียงดัง, อย่าฟังเพียงคำที่เขาพูดไว้
ให้ดูคราวต้องลงมือทำ, แล้วความจริงจะตอบแทนเอง
แม่น้ำสายที่ลึกสุด, ย่อมไหลรุดไปอย่างเงียบงัน
มีเพียงลำธารตื้นเขินเท่านั้น, ที่ส่งเสียงครึกโครมก้องป่า!

[Instrumental Solo Interlude: Melodic Acoustic & Clean Electric Guitar Solo - 8 Bars, Direct to Verse 2]

[Verse 2: Act II - Flip-Flow Pitched Melodic Rap Bounce, 4-Pocket Internal Rhyme Cascade - No Spoken Word]
บอกตัวเองว่าเพิ่งเริ่ม, ยังมีฝันเอาไว้ให้วาด
ตั้งใจทำโดยไม่พล่าม, และไม่มีเวลาให้พลาด
มโนมั่นสลักจิต, ตรึงสนิทไม่บิดเบือน
สัจจะศักดิ์ซัดสะเทือน, เหนือกระแสไม่แชเชือน
หนังสือปกงามเด่น, อาจซ่อนเล่มที่ว่างเปล่า
ถ้อยคำดูแพรวพราว, แต่เปิดอ่านไร้ความหมาย
หนังสือปกเก่าคร่ำ, อาจเก็บคำสอนมากมาย
มิจำเป็นต้องเร่ขาย, ว่าทุกหน้าของตนนั้นดี

[Pre-Chorus 2: Rising Soulful Harmonic Swell, Sustained Melodic Notes - 4 Brand-New Lines]
เหรียญบาทที่ตกกระทบพื้น, ส่งเสียงสะท้อนกังวานไกล
แต่ธนบัตรใบพันใบใหญ่, ร่วงหล่นลงไปไร้เสียงดัง
คนมีของจริงอยู่ในอก, ไม่ตื่นตระหนกยามลำพัง
ให้การกระทำเป็นพลัง, ส่องทางสว่างด้วยตัวเอง

[Chorus 2: Act II Evolving Anthemic Sung Hook, 8 Brand-New Lines, Single Pass, Do Not Repeat]
เปลือกนอกที่ฉาบสีทอง, อาจปกคลุมเนื้อไม้ผุพัง
คำเยินยอที่เคยได้ฟัง, เป็นเพียงลมที่พัดผ่านเลย
เพชรแท้แม้จมโคลนตม, ยังคงคมและงามดั่งเคย
ไม่ต้องเอ่ยคำพูดเฉลย, แสงในตัวย่อมส่องประกาย
คนลวงโลกชอบสร้างภาพ, ใช้คำหวานอาบไว้ทั้งกาย
แต่พอถึงวันต้องพิสูจน์ชาย, กลับละลายหายไปกับตา
คนจริงยืนหยัดด้วยงาน, ก้าวข้ามผ่านทุกคำนินทา
ให้หยาดเหงื่อและกาลเวลา, เป็นผู้ตัดสินคุณค่าคน!

[Beat Switch: Direct Transition to Verse 3, Zero Chorus Repeat]

[Verse 3: Act III - Deep Melodic Rap-Soul Cadence & Multi-Syllable Rhyme Lock - No Spoken Word]
เงาไม่เคยสูงกว่าคน, ยามแดดร่มลมตกก็จางหาย
แต่คนหลงเงาของตน, กลับคิดว่าตัวสูงกว่าใคร
เงาใหญ่เพราะแสงอาทิตย์, หาใช่เพราะฤทธิ์ที่ยิ่งใหญ่
เมื่อตะวันลับขอบฟ้าไป, เงาทั้งหลายก็มืดมิดลง
อนัตตาเผยความจริง, ทุกสิ่งล้วนไม่ยั่งยืน
ปล่อยวางความยึดมั่น, แม้ต้องกลืนก็ต้องฝืน
ดวงจันทร์ไม่เคยบอก, ว่าตัวเองส่องโลกทั้งคืน
มีแต่จิตที่รู้ตื่น, จึงหยัดยืนเหนือกาลเวลา

[Bridge: Soaring High-Note Soul-Rock Melodic Climax, Full Vocal Belt]
คนมีปัญญาแท้จริง, ย่อมรู้ว่ายังมีสิ่งไม่รู้
ยิ่งเดินยิ่งเห็นโลกกว้าง, ยิ่งเข้าใจยิ่งถ่อมตัวลง
วันหนึ่งเมื่อพายุโหมกระหน่ำ, ต้นไม้ที่หยั่งรากลึกมั่นคง
จะยังคงยืนหยัดทะนง, ท่ามกลางสายฝนที่โปรยปราย!

[Verse 4: Act IV - Final Melodic Chopper Surge & Philosophical Triumph - No Spoken Word]
เริ่มต้นจากศูนย์ด้วยสองมือ, ยึดถือความซื่อสัตย์เป็นที่ตั้ง
ก้าวเดินทีละก้าวอย่างระวัง, สร้างพลังจากความพากเพียร
ไม่เคยเหยียบไหล่ใครขึ้นไป, ไม่เคยใช้เล่ห์กลหมุนเวียน
ใช้ชีวิตเป็นดั่งบทเรียน, เขียนตำนานด้วยหยาดเหงื่อจริง
ใครจะอวดอ้างช่างเขาไป, เราเพียงตั้งใจทำทุกสิ่ง
ความสำเร็จที่แท้จริง, ไม่ต้องวิ่งไปป่าวประกาศ
เมื่อรากฐานมั่นคงแข็งแกร่ง, ย่อมทอแสงสว่างใสสะอาด
เป็นเกียรติยศที่ไม่เคยขาด, อยู่คู่แผ่นดินอย่างภาคภูมิ!

[Chorus 3: Act IV Grand Finale Anthemic Sung Hook, 8 Brand-New Climax Lines, Do Not Repeat]
เสียงตบมือจากคำลวงหลอก, อยู่ได้ไม่นานก็จางหายไป
แต่ผลงานที่สร้างด้วยใจ, จะจารึกไว้ในแผ่นดิน
ทองแท้ไม่กลัวไฟหลอม, คนจริงไม่ยอมเสียสัตย์สิ้น
ก้มหน้าสร้างค่าอาจินต์, ให้แผ่นดินได้จดจำชื่อ
ไม่ต้องแข่งกับเสียงตะโกน, ไม่ต้องโยนคำพูดอื้ออึง
ความจริงใจเพียงหนึ่งคำนึง, จะตราตรึงอยู่ในหัวใจ
รวงข้าวสีทองค้อมลงดิน, จึงหล่อเลี้ยงชีวินผู้คนได้
คุณค่าของคนอยู่ที่ใจ, และผลงานที่ทิ้งไว้ให้โลกจำ!

[Transition: Direct to Melodic Outro, Zero Chorus Repeat]

[Outro: Intimate Sung Melodic Finale & Long Instrumental Acoustic Fade - No Spoken Word]
รวงข้าวโน้มกิ่งลงหาดิน, เพราะเมล็ดเต็มรวงเปี่ยมคุณค่า...
ขุนเขาตั้งตระหง่านคู่ฟ้า, โดยไม่ต้องเอ่ยคำพูดใด...
จงเป็นดั่งทองคำเนื้อแท้, ที่ส่องแสงสว่างในหัวใจ...
ให้ความดีและผลงานยิ่งใหญ่, พูดแทนตัวเราตลอดกาล...

[End]`,
    phaw: `ชื่อเพลง: กอดพ่อได้เพียง (Only in Dreams)
ภาพเปรียบเทียบสัจธรรม (Central Metaphor): ตลับเมตรและรอยถากไม้ของพ่อ (สัจธรรมคนสร้างบ้านงามให้คนอื่น แต่สร้างใจลูกให้ซื่อตรงดั่งทองแท้)
คำพาดหัวสะกิดใจ: ถ้าวันนั้นรู้ว่าเป็นกอดสุดท้าย... คงไม่ปล่อยมือ 💔
ประโยคหมุดทองคำ: กอดพ่อได้เพียง, แค่ในความฝัน / สองมือกร้านหยาบ, ค้ำจุนลูกยา
สไตล์ดนตรี (Style of Music): Thai modern acoustic folk, soulful boom-bap, warm hypnotic male vocal, acoustic guitar, soft isan phin, smooth melodic singing, crisp rhythm, single-pass choruses, zero repeat, 84 bpm

[Voice: Locked Hypnotic Warm Baritone-Tenor, Silky Smooth Singing, Magnetic Resonance]

[Intro: Acoustic Guitar Fingerpicking, Soft Melancholic Phin Riff]
กอดพ่อได้เพียง, แค่ในความฝัน...

[Verse 1: Laid-back Storytelling, Silk-Flow Rhymes, 4+4 Symmetry]
เสียงกบไสไม้, จางหายไปลับ
ความเงียบเข้ามา, พัดพาใจสั่น
เพิงเก่าสังกะสี, ที่ผ่านคืนวัน
สองมือผูกพัน, กรำงานอดทน
เสื้อเก่าตัวเดิม, ชุ่มเหงื่อรินหลั่ง
สร้างลูกยืนหยัด, ดั่งใจมุ่งหวัง
ถากไม้สร้างเรือน, เตือนจิตจริงจัง
สอนให้ระวัง, ตั้งใจทำดี

[Pre-Chorus: Melodic Soul Ballad, Emotional Swell]
ลูกก้าวกลับมา, น้ำตารินไหล
เงินเดือนก้อนแรก, แลกความหวังไว้
หวังให้พ่อพัก, จากงานเหนื่อยใจ
แต่พ่อหลับไป, ไม่หวนคืนมา

[Chorus 1: Full 8-Line Continuous Hook, Single Pass, Do Not Repeat]
กอดพ่อได้เพียง, แค่ในความฝัน
กลิ่นเหงื่อเสื้อเก่า, เฝ้าร้อยผูกพัน
สองมือกร้านหยาบ, ค้ำจุนลูกยา
พระคุณล้นฟ้า, ตราตรึงวิญญาณ์!
คำสอนพ่อยัง, ฝังแน่นในใจ
นำทางก้าวไป, ไม่หวั่นสิ่งใด
สัจจะลูกชาย, ไม่คลายศรัทธา
กอดพ่อในฝัน, ตราบวันลับลา!

[Beat Switch: Direct Transition to Verse 2, Zero Chorus Repeat]

[Verse 2: Smooth Chopper Flow, Multi-Syllable Rhymes]
ตลับเมตรเก่า, ที่เคยวัดไม้
ถากถางทางกว้าง, สร้างลูกเติบใหญ่
หยดเหงื่อรินรด, หยดลงผืนดิน
แลกข้าวให้กิน, สู้จนคุ้นชิน
วันนี้เหลือเพียง, เสียงรอยสะท้อน
ลึกซึ้งตรึงใจ, ในคำสั่งสอน
สร้างคนสร้างใจ, ไม่ไหวไม่คลอน
ซื่อตรงดั่งทอง, ผ่องพ้นเวลา

[Chorus 2: Full 8-Line Continuous Hook, Single Pass, Do Not Repeat, Evolving Lyrics]
คำสอนของพ่อ, ยังก้องในใจ
ส่องทางก้าวเดิน, เผชิญโลกกว้าง
ลูกจะยืนหยัด, สู้บนเส้นทาง
ความดีส่องสว่าง, กลางความมืดมน!
สร้างคนสร้างใจ, ให้ซื่อตรงแท้
ไม่เคยยอมแพ้, แม้มีขวากหนาม
เดินตามรอยพ่อ, ทุกช่วงโมงยาม
ฝากชื่อคนงาม, ค้ำฟ้าดินเอย!

[Beat Switch: Direct Transition to Verse 3, Zero Chorus Repeat]

[Verse 3: Philosophical Street Cadence, Deep Reflection]
มองเครื่องมือช่าง, ที่วางข้างฝา
ทุกรอยถากไม้, ล้ำค่ายิ่งกว่า
พ่อสร้างบ้านงาม, ให้คนพักพิง
สอนลูกให้จริง, ยิ่งในความดี
ไม่มีกองทอง, ปองไว้ให้เห็น
แต่มีเกียรติยศ, ปรากฏชัดเจน
จิตใจผ่องใส, ไกลความลำเค็ญ
เป็นคนซื่อตรง, มั่นคงศรัทธา

[Bridge: Soaring Soul Melodic Climax, Emotional Peak]
มองรูปข้างฝา, น้ำตารินไหล
คำสอนของพ่อ, คลอเคล้าข้างใจ
สัจจะลูกชาย, มุ่งหน้าก้าวไป
เพื่อพ่อคนดี, ที่ลูกบูชา!

[Chorus 3: Full 8-Line Continuous Hook, Single Pass, Do Not Repeat, Grand Climax]
กอดพ่อในใจ, ตราบสิ้นชีวา
พระคุณนำพา, สว่างกลางใจ
ลูกจะไม่ลืม, สัจจะให้ไว้
เป็นคนดีให้ได้, ดั่งใจพ่อหวัง!
ลูกยืนตรงนี้, ด้วยความภูมิใจ
ส่งรักขึ้นไป, สู่ฟ้าแดนไกล
ลูกโตพอแล้ว, ไม่ต้องห่วงใย
หลับตาพักใจ, ในฟ้าครามเอย!

[Transition: Direct to Outro, Zero Chorus Repeat]

[Outro: Warm Harmonic Singing, Lonely Acoustic Guitar Fade]
หลับตาเถิดพ่อ, พักผ่อนให้สบาย...
คำสอนของพ่อ, จะอยู่กับลูกตลอดไป...

[End]`,
    love: `ชื่อเพลง: รักแรกพบ (First Light)
ภาพเปรียบเทียบสัจธรรม (Central Metaphor): แสงแดดอุ่นกลางสายฝนพรำ (ความรักบริสุทธิ์ที่เข้ามาเติมเต็มหัวใจอย่างเรียบง่าย)
คำพาดหัวสะกิดใจ: ตั้งแต่วันที่ได้พบเธอ โลกใบเดิมก็เปลี่ยนไป ✨
ประโยคหมุดทองคำ: รักแรกพบใจ, ไม่เคยคาดฝัน / ขอบคุณทุกวัน, ที่ผ่านเข้ามา
สไตล์ดนตรี (Style of Music): Thai warm acoustic pop, soulful melody, hypnotic warm male vocal, nylon string guitar, gentle percussion, crisp rhythm, single-pass choruses, zero repeat, 80 bpm

[Voice: Locked Hypnotic Warm Baritone-Tenor, Silky Smooth Singing, Magnetic Resonance]

[Intro: Acoustic Guitar Fingerpicking, Sweet Warm Hum]
สบตาคราแรก, ก็แทรกซึมใจ...

[Verse 1: Laid-back Storytelling, Silk-Flow Rhymes, 4+4 Symmetry]
วันฝนโปรยปราย, สายลมพัดพรม
มุมร้านกาแฟ, แลดูรื่นรมย์
ผู้คนมากมาย, ก้าวผ่านสายตา
ยังไม่เคยพบ, สบใครมีค่า
จนเธอเดินมา, พาสดใสเยือน
รอยยิ้มละมุน, อุ่นใจติดเตือน
ดั่งแสงตะวัน, พลันส่องสว่าง
ปัดเป่าความเหงา, ให้จางหมดไป

[Pre-Chorus: Melodic Soul Ballad, Sweet & Rising]
หัวใจดวงนี้, ที่เคยเหน็บหนาว
เริ่มมองเห็นดาว, สกาวสดใส
ก้าวเข้ามาเติม, เสริมความมั่นใจ
พร้อมเดินเคียงคู่, สู่ฝันงดงาม

[Chorus 1: Full 8-Line Continuous Hook, Single Pass, Do Not Repeat]
รักแรกพบใจ, ไม่เคยคาดฝัน
ขอบคุณทุกวัน, ที่ผ่านเข้ามา
สบตาคู่นั้น, มั่นใจสัญญา
รักเธอแก้วตา, ตราบชั่วชีวัน!
แววตาคู่นั้น, สดใสจับใจ
ละลายความเหงา, ให้หายหมดไป
อยู่เคียงข้างเธอ, ไม่คิดเปลี่ยนใจ
ของขวัญล้ำค่า, ตลอดชีวัน!

[Beat Switch: Direct Transition to Verse 2, Zero Chorus Repeat]

[Verse 2: Smooth Chopper Flow, Multi-Syllable Rhymes]
ร้อยเรียงเรื่องราว, ยามเราพูดคุย
ความสุขล้นเอ่อ, เลอค่าเคียงกาย
ไม่ต้องประดิษฐ์, จิตใจผ่อนคลาย
รอยยิ้มเธอพราย, คลายความกังวล
ผ่านวันคืนเหงา, เข้าสู่แสงทอง
จับมือเคียงข้าง, สองเรามั่นคง
ร่วมสร้างทางรัก, ปักใจซื่อตรง
ไม่เคยลืมหลง, คงมั่นศรัทธา

[Chorus 2: Full 8-Line Continuous Hook, Single Pass, Do Not Repeat, Evolving Lyrics]
รักแรกพบใจ, ยิ่งใหญ่ลึกซึ้ง
รอยยิ้มตราตรึง, ซาบซึ้งอุรา
โลกใบนี้สดใส, เมื่อได้พบตา
ร่วมทางฟันฝ่า, คว้าฝันด้วยกัน!
ขอบคุณฟากฟ้า, นำพามาพบ
รักแท้บรรจบ, สบความสุขสันต์
จะดูแลเธอ, เสมอผูกพัน
รักเรานิรันดร์, ตราบสิ้นดินฟ้า!

[Transition: Direct to Outro, Zero Chorus Repeat]

[Outro: Soft Acoustic Guitar & Warm Hum Fade]
ขอบคุณโชคชะตา, ที่พาเรามาพบกัน...
รักเธอเสมอไป...

[End]`,
    rain: `ชื่อเพลง: คืนฝนพรำ (Midnight Rain Reflection)
ภาพเปรียบเทียบสัจธรรม (Central Metaphor): แสงไฟนีออนสะท้อนน้ำฝน (กาลเวลาที่ชะล้างความเจ็บปวด เหลือเพียงความหวังดีในความทรงจำ)
คำพาดหัวสะกิดใจ: ฝนตกทีไร หัวใจก็แอบคิดถึงเธอทุกที 🌧️
ประโยคหมุดทองคำ: คืนฝนพรำนี้, ที่ไร้เงาเธอ / เก็บความทรงจำ, สุขล้ำทุกคน
สไตล์ดนตรี (Style of Music): Melancholic Thai city pop, warm vintage rhodes piano, rainy jazz groove, soft breath vocal, single-pass choruses, zero repeat, 78 bpm

[Voice: Locked Hypnotic Warm Baritone-Tenor, Silky Smooth Singing, Magnetic Resonance]

[Intro: Electric Rhodes & Soft Rainy Street Ambience]
สายฝนโปรยปราย, ใจยังคิดถึง...

[Verse 1: Laid-back Storytelling, Silk-Flow Rhymes, 4+4 Symmetry]
มองออกนอกหน้าต่าง, สว่างแสงไฟ
นีออนสะท้อน, ซอกซอยเปียกปอน
หยดน้ำฝนริน, ถวิลอาวรณ์
คิดถึงวันก่อน, อ่อนหวานในใจ
ร่มคันเก่าเดิม, เคยเดินเคียงกัน
วันนี้เหลือเพียง, เงาฉันก้าวไป
สายฝนพัดพา, หยาดน้ำรินไหล
ความคิดถึงไกล, ลอยไปตามลม

[Pre-Chorus: Melodic Soul Ballad, Melancholic Swell]
แม้กาลเวลา, พัดพาเปลี่ยนผัน
แต่เรื่องราวนั้น, ไม่เคยลบเลือน
มองสายฝนพรำ, ย้ำเตือนในใจ
ขอให้เธอได้, พบสิ่งสวยงาม

[Chorus 1: Full 8-Line Continuous Hook, Single Pass, Do Not Repeat]
คืนฝนพรำนี้, ที่ไร้เงาเธอ
ใจยังละเมอ, เหม่อมองนภา
ฝากลมกระซิบ, ผ่านหยาดน้ำตา
ขอให้แก้วตา, มีสุขทุกวัน!
เสียงหยดน้ำริน, ตกดินสลาย
ความเจ็บคลี่คลาย, หายไปกับฝน
เก็บความทรงจำ, สุขล้ำทุกคน
ก้าวข้ามผ่านพ้น, บนทางของเธอ!

[Beat Switch: Direct Transition to Verse 2, Zero Chorus Repeat]

[Verse 2: Smooth Chopper Flow, City Lights Cadence]
เมืองใหญ่ยามค่ำ, น้ำฝนพร่างพรม
คนเร่งรีบกลับ, ลับตาสายลม
ฉันยืนเดียวดาย, ไม่คลายชื่นชม
ยินดีกับเธอ, เจอะเจอสิ่งดี
ไม่มีโกรธเคือง, เรื่องราววันวาน
ปล่อยผ่านเลยไป, ให้ใจสงบ
ยินดีที่รัก, เคยได้บรรจบ
แม้ต้องพลัดพราก, จากกันแสนไกล

[Chorus 2: Full 8-Line Continuous Hook, Single Pass, Do Not Repeat, Evolving Lyrics]
ฝนยังโปรยปราย, ในคืนเงียบเหงา
ลมพัดเรื่องเก่า, บรรเทาใจลง
ไม่มีน้ำตา, พาระทมตรม
มีเพียงความสุข, ที่เคยได้รัก!
ขอให้เธอสุข, ทุกก้าวเดินไป
พบคนจริงใจ, ในทางข้างหน้า
คืนฝนพรำนี้, มีเพียงเมตตา
ฝากดาวบนฟ้า, นำทางให้เธอ!

[Transition: Direct to Outro, Zero Chorus Repeat]

[Outro: Fading Rhodes & Rainy Ambience]
ยังคิดถึงเธอเสมอ... แม้ในวันที่ฝนซา...
โชคดีนะคนไกล...

[End]`,
    rock: `ชื่อเพลง: สุดทางฝัน (Chasing the Horizon)
ภาพเปรียบเทียบสัจธรรม (Central Metaphor): หินผาแกร่งต้านแรงคลื่นซัด (ความมุ่งมั่นที่ไม่ยอมสยบต่ออุปสรรค)
คำพาดหัวสะกิดใจ: ล้มกี่ครั้งก็ไม่ถอย ถ้าหัวใจยังเต้นอยู่! ⚡
ประโยคหมุดทองคำ: จะวิ่งไปให้ถึง, ปลายทางสายฝัน / สองมือฟันฝ่า, คว้าชัยกลับมา
สไตล์ดนตรี (Style of Music): High energy Thai rock anthem, driving electric guitars, punchy drums, powerful hypnotic vocals, single-pass choruses, zero repeat, 138 bpm

[Voice: Locked Hypnotic Powerful Rock Vocal, Dynamic Grit, High Energy Projection]

[Intro: High Energy Guitar Riff & Punchy Drum Fill]
จะวิ่งสุดใจ, ไปให้ถึงฝัน!

[Verse 1: Driving Bass & Drums, Punchy Flow, 4+4 Symmetry]
หยาดเหงื่อรินหลั่ง, ยังสู้ไม่ถอย
ก้าวผ่านรอยช้ำ, กรำงานอดทน
ทางชันข้างหน้า, ฝ่าฟันทุกคน
ก้าวข้ามความจน, บนลำแข้งตน
เสียงคนรอบข้าง, ช่างบอกให้หยุด
แต่ใจไม่สุด, ไม่หยุดก้าวไป
เปลวไฟความหวัง, สั่งใจให้ลุย
ไม่ขอถอยหนี, ก้มหน้าสู้ตาย

[Pre-Chorus: Melodic Rock Ballad, Rising Power]
ล้มกี่ร้อยครั้ง, ยังลุกขึ้นใหม่
บาดแผลในใจ, กลายเป็นพลัง
เลือดนักสู้เดือด, ปลุกจิตจริงจัง
พร้อมพุ่งทะยาน, สู่แดนเส้นชัย!

[Chorus 1: Full 8-Line Continuous Hook, Single Pass, Do Not Repeat]
จะวิ่งไปให้ถึง, ปลายทางสายฝัน
จะไม่ยอมหยุดยั้ง, ฟาดฟันคว้าชัย
เลือดนักสู้เดือด, ร้อนแรงในใจ
ตราบชีพมลาย, ก้าวไปคว้าฝัน!
ล้มลงกี่ครั้ง, พร้อมลุกประชัน
ให้โลกรู้กัน, ว่าคนอย่างเรา
ไม่เคยยอมก้ม, ให้โชคชะตา
สองมือฟันฝ่า, คว้าชัยกลับมา!

[Beat Switch: Direct Transition to Verse 2, Zero Chorus Repeat]

[Verse 2: High Energy Flip-Flow Rock Rhythm]
รอยแผลที่ได้, คือบทเรียนล้ำ
ตราความทรงจำ, นำทางชีวี
ขวากหนามขวางกั้น, ประจัญทันที
ทะยานเต็มที่, ไม่มีลังเล
โลกอาจท้าทาย, พายุโหมกระหน่ำ
กัดฟันก้าวซ้ำ, ลุยพายุฝน
ศิลาแกร่งกล้า, ท้าคลื่นประจัญ
ไม่เคยหวั่นไหว, สู้ใจสุดแรง

[Chorus 2: Full 8-Line Continuous Hook, Single Pass, Do Not Repeat, Grand Climax]
จะวิ่งไปให้ถึง, สุดขอบฟ้ากว้าง
ส่องประกายสว่าง, บนทางสายฝัน
เสียงเชียร์กึกก้อง, ปลุกเร้าพลัง
ก้าวสู่เส้นชัย, ด้วยใจศรัทธา!
คนจริงไม่ถอย, สู้รอยพายุ
พลังใจทะลุ, สู่ฟ้าแดนไกล
สองมือสองเท้า, ก้าวคว้าชัยมา
เกียรติยศค้ำฟ้า, ชั่วนิรันดร์กาล!

[Transition: Direct to Outro, Zero Chorus Repeat]

[Outro: Driving Electric Guitar Solo Fade]
วิ่งไปข้างหน้า... จนกว่าจะถึงเส้นชัย!
อย่ายอมแพ้!

[End]`
  };

  // Export as Agent SKILL.md
  const handleExportSkill = () => {
    const skillContent = `---
name: suno-v6-mini-epic-magnum-opus
description: บรมครูสถาปนิกเพลงมหากาพย์ Suno v6 - Mini รองรับการแร็ปบูมแบ็ปคมกริบ x สับไรม์สัมผัสในถี่จัด x ร้องโซลร่วมสมัย ไร้ท่อนพูด 100% ไร้ดราม่า
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

  // Live Lyric Quality, Zero-Repeat, Zero-Spoken & 4+ Min Marathon Scanner (v120.0)
  const lyricAuditSummary = useMemo(() => {
    const rawLyrics = extractLyrics(outputResult);
    if (!rawLyrics) return null;

    const lines = rawLyrics
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("[") && !l.endsWith("]") && !l.startsWith("#") && !l.startsWith("*"));

    const chorusCount = (rawLyrics.match(/\[Chorus/gi) || []).length;
    const breathPocketLines = lines.filter((l) => l.includes(",") || l.includes(" ")).length;
    const breathRatio = lines.length > 0 ? Math.round((breathPocketLines / lines.length) * 100) : 100;

    // Duplicate line count check
    const seen = new Map<string, number>();
    let duplicateLineCount = 0;
    for (const line of lines) {
      const norm = line.replace(/[,.\s!?"'…]/g, "");
      if (norm.length >= 6) {
        const c = (seen.get(norm) || 0) + 1;
        seen.set(norm, c);
        if (c > 1) duplicateLineCount++;
      }
    }

    // Spoken word tag check
    const spokenMatches = rawLyrics.match(/\[(Spoken|Narration|Monologue|Talking|Speech|Dialogue|พูด|บทพูด)[^\]]*\]/gi) || [];

    // Estimated duration in minutes:seconds (~3.35s per 14-syllable line + ~18s intro/interlude/outro)
    const estTotalSec = Math.round(lines.length * 3.35 + (lines.length >= 40 ? 20 : 8));
    const estMin = Math.floor(estTotalSec / 60);
    const estSec = (estTotalSec % 60).toString().padStart(2, "0");
    const estDurationStr = `${estMin}:${estSec} นาที`;

    const redupMatches = rawLyrics.match(/(เล็กเล็ก|เบาเบา|ซ้ำซ้ำ|ไกลไกล|นานนาน|ช้าช้า|เร็วเร็ว)/g) || [];
    const bracketClutter = rawLyrics.match(/\((?:สัมผัส|เสียง|หมายเหตุ)[^)]*\)/g) || [];
    const weirdPhrases = detectWeirdOrForcedThaiPhrases(rawLyrics, story);

    return {
      totalLines: lines.length,
      estDurationStr,
      isMarathonLength: lines.length >= 68,
      chorusCount,
      breathRatio,
      duplicateLineCount,
      spokenCount: spokenMatches.length,
      redupCount: redupMatches.length,
      clutterCount: bracketClutter.length,
      weirdPhrases,
      weirdCount: weirdPhrases.length,
      isClean:
        redupMatches.length === 0 &&
        bracketClutter.length === 0 &&
        weirdPhrases.length === 0 &&
        duplicateLineCount === 0 &&
        spokenMatches.length === 0,
    };
  }, [outputResult, story]);

  // 1-Click Auto-Clean & Polish Lyrics for Suno (Also cleans known weird forced idioms, spoken tags & truncated words!)
  const handleAutoCleanLyrics = () => {
    if (!outputResult) return;
    const cleaned = outputResult
      .replace(/\((?:สัมผัส|เสียง|หมายเหตุ|ไรม์)[^)]*\)/gi, "")
      .replace(/\[(เสียง|สัมผัส):[^\]]*\]/gi, "")
      .replace(/\[(Spoken|Narration|Monologue|Talking|Speech|Dialogue)[^\]]*\]/gi, "[Verse: 100% Sung Melodic Vocal - No Spoken Word]")
      .replace(/จิตตั้ง/g, "ตั้งจิตมั่น")
      .replace(/ใจหมาย/g, "มุ่งหมายในใจ")
      .replace(/หมายใจ/g, "ตั้งใจมั่น")
      .replace(/ทอนกำลัง/g, "บั่นทอนกำลังใจ")
      .replace(/คนหลอกมา/g, "คนที่เข้ามาหลอก")
      .replace(/คำจา|วจีจา/g, "คำพูดจา")
      .replace(/ลูกยา/g, "ลูกหลาน")
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
      .replace(/เล็กเล็ก/g, "กระจ้อย")
      .replace(/เบาเบา/g, "แผ่วเบา")
      .replace(/ซ้ำซ้ำ/g, "ตอกย้ำ")
      .replace(/ไกลไกล/g, "แสนไกล")
      .replace(/นานนาน/g, "เนิ่นนาน")
      .replace(/ช้าช้า/g, "เนิบช้า");
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
                  ขั้นตอนที่ 1: สกัดแม่แบบพรอพ (Suno v6 Mini Engine)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Suno v6 - Mini Optimized</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  🚫 ZERO SPOKEN WORD (ไม่มีท่อนพูด 100%)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🔒 ZERO DUPLICATE LINES (ไม่ซ้ำท่อน & ไม่ซ้ำบรรทัดตลอดเพลง 100%)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ⏱️ 4+ MIN EPIC MARATHON (12 ท่อนมหากาพย์ / 76 บรรทัดเต็ม)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  <span>👑 ไตรภาคี 3 ศิลปิน (SD PMR × P9D × NS-A755)</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-fuchsia-500/20 text-amber-200 border border-amber-500/40 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>🎯 โฟลว์ 6-8+6-8 & ไรม์พวง 2-4 พยางค์ (v120.0)</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1.5">
                ระบบสกัดพรอพเพลงมหากาพย์ 4 นาที+ จาก DNA 3 ศิลปิน (SD PMR × P9D × NS-A755 Engine v120.0)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                บังคับโครงสร้าง <strong>มหากาพย์ 12 ท่อน 4 องก์ (76 บรรทัดเต็ม สำหรับความยาว 4.00 - 4.50+ นาที)</strong>: <strong>ไร้ท่อนพูด 100%</strong> + <strong>ไร้ท่อนซ้ำและไร้บรรทัดซ้ำตลอดทั้งเพลง 100% (แม้แต่ Chorus 1, 2, 3 ก็เขียนเนื้อร้องใหม่ทุกท่อน!)</strong> + <strong>โฟลว์ 6-8+6-8 (SD PMR)</strong> + <strong>ล็อกสัมผัสพวง 2-4 พยางค์ (P9D)</strong> + <strong>สาดสัมผัสในรัว (NS-A755)</strong>!
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
                  <span className="text-xs font-bold block text-fuchsia-300">👑 ไตรภาคี 3 ศิลปิน</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    SD PMR × P9D × NS-A755 โฟลว์ 6-8+6-8 ลื่นหู + ฮุกพุ่งทะยาน
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
                    โฟล์คร็อก-แร็ปเมโลดี้ คู่ตรงข้ามเปรียบเทียบ ฮุกจำขึ้นใจ
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
                    ล็อกสัมผัสพวงท้ายบาร์ 2-4 คำ + สาดสัมผัสในรัว 86 BPM
                  </span>
                </button>
              </div>
            </div>

            {/* Rhyme Intensity & Resonance Matrix */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ระดับความเข้มข้นของสัมผัส & พลังสะกดใจ:</span>
                </label>
                <span className="text-[10px] text-amber-300 font-bold">
                  {rhymeIntensity === "supreme"
                    ? "👑 ไรม์ขั้นสุดยอด (Supreme)"
                    : rhymeIntensity === "sharp"
                    ? "⚡ คมกริบสตรีท (Sharp)"
                    : "🌸 ละมุนฟังเพลิน (Melodic)"}
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
                  <span className="text-xs font-bold block text-amber-300">👑 ไรม์ขั้นสุดยอด</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    สัมผัสพวง 2-4 คำ + สัมผัสอักษรคู่ตรี + เชื่อมสระกลางวรรค
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
                  <span className="text-xs font-bold block text-fuchsia-300">⚡ คมกริบสตรีท</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    ล็อคสัมผัสพวง 2-3 คำท้ายบาร์ + ไรม์คู่บาร์ หมัดฮุกกระตุกใจ
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
                  <span className="text-xs font-bold block text-cyan-300">🌸 ละมุนฟังเพลิน</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    สัมผัสในพริ้วไหว เมโลดี้กลอนธรรมชาติ ร้องตามง่ายติดหู
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
                  <span className="text-[10px] text-amber-300/80 font-mono">v50.0 Earworm Vault</span>
                </div>

                {/* Multi-Syllable Rhyme Chains */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">⚡ สัมผัสพวง 2-4 พยางค์คมกริบ:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { pair: "เส้นทาง ➔ เคว้งคว้าง", text: " ยืนหยัดบนเส้นทาง, ฝ่าพายุเคว้งคว้าง" },
                      { pair: "รวงข้าว ➔ เรื่องราว", text: " รวงข้าวโน้มลงดิน, ผ่านร้อยพันเรื่องราว" },
                      { pair: "สะท้อน ➔ คำสั่งสอน", text: " เสียงก้องรอยสะท้อน, จำลึกคำสั่งสอน" },
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
                  <span className="text-[10px] font-bold text-cyan-300/90 block mb-1">🌊 สะพานสัมผัสรับส่งกลางบรรทัด 6-8+6-8 (สไตล์ SD PMR × NS-A755):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "กลองที่กลวงยิ่งตีดัง, ยิ่งฟังยิ่งรู้ว่าข้างในว่าง", text: " กลองที่กลวงยิ่งตีดัง, ยิ่งฟังยิ่งรู้ว่าข้างในว่าง" },
                      { label: "อย่าไปยืนในที่นั้น, ที่เขาไม่เคยเห็นค่าเรา", text: " อย่าไปยืนในที่นั้น, ที่เขาไม่เคยเห็นค่าเรา" },
                      { label: "บอกตัวเองว่าเพิ่งเริ่ม, กูยังมีฝันเอาไว้ให้วาด", text: " บอกตัวเองว่าเพิ่งเริ่ม, กูยังมีฝันเอาไว้ให้วาด" },
                      { label: "มโนมั่นสลักจิต, ตรึงสนิทไม่บิดเบือน", text: " มโนมั่นสลักจิต, ตรึงสนิทไม่บิดเบือน" },
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
                  <span className="text-[10px] font-bold text-fuchsia-300/90 block">🌟 หมุดทองคำคู่ขนานติดหู (SD PMR × P9D Parallel Hooks):</span>
                  {[
                    "กลองที่กลวงยิ่งตีดัง ยิ่งฟังยิ่งรู้ว่าข้างในว่าง / ทองคำแท้ไม่ส่งเสียงพราง ยังมีค่าต่อให้ไร้คนชม!",
                    "ให้ค่ากับคนเห็นค่า ดีกว่าทนส่วนเกิน / ไม่ต้องฝืนไม่ต้องเขิน เมื่อรู้ว่าเขาไม่รัก!",
                    "คนฉลาดไม่ต้องอวด คนที่รู้จริงยิ่งถ่อมตน / ให้ดูคราวต้องลงมือทำ แล้วความจริงจะตอบแทนเอง!",
                    "บอกตัวเองว่ามันเพิ่งเริ่ม กูยังมีฝันเอาไว้ให้วาด / ไม่มีเวลาให้พล่าม และกูไม่มีเวลาให้พลาด!",
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
                  ระบบสายพาน 3 ขั้นตอน (v120.0 มหากาพย์ 4 นาที+ • ไร้ท่อนพูด • ไร้ท่อนซ้ำ 100%)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-fuchsia-600/30 hover:bg-fuchsia-600 text-fuchsia-200 hover:text-white border border-fuchsia-500/40 transition-all font-semibold"
                  title="ขั้นที่ 1: คัดลอกพรอมต์แต่งเพลงมหากาพย์ 4 นาที+ (12 ท่อน 76 บรรทัด ไร้ท่อนพูด ไร้ท่อนซ้ำ)"
                >
                  {copiedFullPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFullPrompt ? "คัดลอกขั้นที่ 1 แล้ว!" : "1. พรอมต์แต่งเพลง"}</span>
                </button>
                <button
                  onClick={handleCopyAuditPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 transition-all font-semibold"
                  title="ขั้นที่ 2: คัดลอกพรอมต์ตรวจสอบรอบแรก (ผ่าตัดขยายครบ 76 บรรทัด ล้างท่อนพูด/ท่อนซ้ำ & อัดไรม์ 3 ศิลปิน)"
                >
                  {copiedAuditPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Wand2 className="w-3.5 h-3.5 text-amber-300" />}
                  <span>{copiedAuditPrompt ? "คัดลอกรอบแรกแล้ว!" : "2. พรอมต์ตรวจสอบรอบแรก"}</span>
                </button>
                <button
                  onClick={handleCopyFinalAuditPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 transition-all font-semibold"
                  title="ขั้นที่ 3: คัดลอกพรอมต์ตรวจสอบรอบสุดท้าย (เกลาคำร้องเข้าปาก 100% ยืนยันไร้บรรทัดซ้ำ/ไร้ท่อนพูด & ล็อก Gold Master)"
                >
                  {copiedFinalAuditPrompt ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />}
                  <span>{copiedFinalAuditPrompt ? "คัดลอกรอบสุดท้ายแล้ว!" : "3. พรอมต์ตรวจสอบรอบสุดท้าย"}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              แม่แบบมหากาพย์ 4 นาทีขึ้นไป <strong>(12 ท่อน 4 องก์ / 76 บรรทัดเต็ม v120.0)</strong>: บังคับ <strong>ไร้ท่อนพูด 100% (100% Sung / Melodic Rap)</strong> + <strong>ไร้ท่อนซ้ำและไร้บรรทัดซ้ำตลอดทั้งเพลง 100% (แม้แต่ Chorus 1, 2, 3 ก็เขียนเนื้อร้องใหม่ทั้งหมด!)</strong> + <strong>โฟลว์ 6-8+6-8 & ไรม์ 3 ศิลปิน (SD PMR × P9D × NS-A755)</strong>:
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
                  2. นำผลลัพธ์บทเพลงจากแชท AI มาวางที่นี่ (เพื่อทำปก & MV ต่อ)
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
                placeholder="วางผลลัพธ์จาก ChatGPT / Gemini / Claude ที่นี่ (เช่น ชื่อเพลง, สไตล์ดนตรี, เนื้อร้อง [Intro]...)"
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
                      <span>🔍 ระบบตรวจสอบ 2 ด่าน (รอบแรก: ผ่าตัดมหากาพย์ 76 บรรทัด ไร้ท่อนซ้ำ/ท่อนพูด ➔ รอบสุดท้าย: เกลาคำร้องเข้าปาก ไร้คำแปลก 100%)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        v120.0 3-Stage
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      แยกภารกิจชัดเจนเพื่อให้ AI โฟกัสได้เต็ม 100%: <strong>ตรวจสอบรอบแรก</strong> (ขยายครบ 12 ท่อน 76 บรรทัด สำหรับเพลงยาว 4 นาที+ ล้างท่อนพูด/ท่อนซ้ำ & อัดไรม์ 3 ศิลปิน) ➔ <strong>ตรวจสอบรอบสุดท้าย</strong> (จำลองการร้องออกเสียงจริง ล้างคำฝืนไรม์ ยืนยันไร้บรรทัดซ้ำ 100% & ล็อก Gold Master!)
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
                  { id: 'all', label: '🎯 ครบทุกมิติ (มหากาพย์ 4 นาที+ ไร้ท่อนพูด/ไร้ท่อนซ้ำ)' },
                  { id: 'antirepeat', label: '🚫 ล้างท่อนซ้ำ & ล้างท่อนพูด 100% (76 บรรทัดใหม่ล้วน)' },
                  { id: 'natural', label: '🗣️ กวาดล้างคำแปลก & คำฝืนไรม์ 100%' },
                  { id: 'rhyme', label: '⚡ ไรม์พวง P9D 2-4 คำ & สาดสัมผัส NS-A755' },
                  { id: 'flow', label: '⏱️ ขยายครบ 12 ท่อน (76 บรรทัด) & โฟลว์ 6-8+6-8' },
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
                    🛠️ ด่านที่ 1 (ขั้นที่ 2): พรอมต์ตรวจสอบรอบแรก — ขยายครบ 76 บรรทัด (4 นาที+) ล้างท่อนพูด/ท่อนซ้ำ & อัดไรม์ 3 ศิลปิน
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">Stage 2: 4+ Min Epic & Zero-Repeat Surgery</span>
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
                    👑 ด่านที่ 2 (ขั้นที่ 3): พรอมต์ตรวจสอบรอบสุดท้าย — เกลาคำร้องเข้าปาก 100% ล้างคำฝืนไรม์ & ล็อก Gold Master
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">Stage 3: Final Vocal Mouth-Feel & Gold Master</span>
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
                <span>💡 <strong>ทำไมต้องแยกตรวจสอบ 2 รอบ?:</strong> รอบแรก AI จะทุ่มสมองผ่าตัดโครงสร้างและอัดไรม์ 3 ศิลปินให้แน่น (ซึ่งบางครั้ง AI อาจเผลอหยิบคำแปลกมาเพื่อให้ลงสัมผัส) ➔ รอบสุดท้ายจึงทำหน้าที่เป็น <strong>"โปรดิวเซอร์คุมร้อง"</strong> กวาดล้างคำฝืนไรม์ให้เป็นภาษาพูดธรรมชาติ 100% โดยที่ไรม์ไม่หลุด!</span>
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
                          ผลชันสูตรคุณภาพเพลงมหากาพย์ 4 นาที+ (ไร้ท่อนพูด • ไร้บรรทัดซ้ำ • ไร้คำแปลก v120.0):
                        </span>
                      </div>
                      {!lyricAuditSummary.isClean && (
                        <button
                          type="button"
                          onClick={handleAutoCleanLyrics}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 transition-all flex items-center space-x-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>✨ คลีนคำแปลก & แท็กพูดอัตโนมัติ (1-Click Clean)</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">ความยาวมหากาพย์</span>
                        <span className={`font-bold ${lyricAuditSummary.isMarathonLength ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {lyricAuditSummary.totalLines} บรรทัด (~{lyricAuditSummary.estDurationStr})
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">เช็กท่อนซ้ำ/บรรทัดซ้ำ</span>
                        <span className={`font-bold ${lyricAuditSummary.duplicateLineCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {lyricAuditSummary.duplicateLineCount === 0
                            ? '✅ ไม่ซ้ำเลย 100%'
                            : `🚨 ซ้ำ ${lyricAuditSummary.duplicateLineCount} บรรทัด`}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">เช็กท่อนพูด (Spoken)</span>
                        <span className={`font-bold ${lyricAuditSummary.spokenCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {lyricAuditSummary.spokenCount === 0 ? '✅ ไร้ท่อนพูด 100%' : `🚨 พบแท็กพูด ${lyricAuditSummary.spokenCount} จุด`}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">จังหวะ 6-8+6-8 (,)</span>
                        <span className={`font-bold ${lyricAuditSummary.breathRatio >= 70 ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {lyricAuditSummary.breathRatio}% ลื่นหู
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">คำแปลก/สำนวนฝืน</span>
                        <span className={`font-bold ${lyricAuditSummary.weirdCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {lyricAuditSummary.weirdCount === 0
                            ? '✅ ธรรมชาติ 100%'
                            : `🚨 พบ ${lyricAuditSummary.weirdCount} รายการ`}
                        </span>
                      </div>
                    </div>

                    {lyricAuditSummary.weirdPhrases.length > 0 && (
                      <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200 space-y-1">
                        <span className="font-bold block">🚨 ตรวจพบคำแปลก/สำนวนฝืนสัมผัส (กดปุ่ม 1-Click Clean ด้านบน หรือก๊อปพรอพผ่าตัดไปสั่ง AI แก้ได้ทันที):</span>
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
                      <span>{copiedLyricsOnly ? "คัดลอกแล้ว!" : "ก๊อป Lyrics (ฮุก 8 บาร์เต็ม)"}</span>
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
                  หรือคลิกเลือกตัวอย่างเพลงสำเร็จรูป (100% ร้อง & แร็ป ไร้ท่อนพูด) เพื่อทดสอบทันที:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.tripartite)}
                    className="p-2.5 rounded-xl bg-gradient-to-b from-fuchsia-950/40 to-slate-950 border border-fuchsia-500/50 hover:border-amber-400 text-left transition-all group col-span-2 sm:col-span-1"
                  >
                    <span className="text-base block mb-0.5">🌾</span>
                    <span className="text-xs font-bold text-amber-300 block group-hover:text-amber-200">รวงข้าวในสายลม</span>
                    <span className="text-[10px] text-slate-400 truncate block">สัมผัสคม ลื่นหู ติดหู</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.phaw)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🌾</span>
                    <span className="text-xs font-bold text-white block group-hover:text-amber-400">เพื่อชีวิต ("พ่อ")</span>
                    <span className="text-[10px] text-slate-400 truncate block">ไม่มีท่อนพูด</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.love)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🌸</span>
                    <span className="text-xs font-bold text-white block group-hover:text-pink-400">เพลงรัก ("รักแรกพบ")</span>
                    <span className="text-[10px] text-slate-400 truncate block">ป๊อปอะคูสติกหวาน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.rain)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🌧️</span>
                    <span className="text-xs font-bold text-white block group-hover:text-cyan-400">อกหัก ("คืนฝนพรำ")</span>
                    <span className="text-[10px] text-slate-400 truncate block">ซิตี้ป๊อปยามค่ำคืน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputResult(sampleSongs.rock)}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 text-left transition-all group"
                  >
                    <span className="text-base block mb-0.5">🎸</span>
                    <span className="text-xs font-bold text-white block group-hover:text-purple-400">ร็อก ("สุดทางฝัน")</span>
                    <span className="text-[10px] text-slate-400 truncate block">ร็อกทรงพลัง มีพลัง</span>
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
