export interface SongPromptInput {
  story: string;
  vocalStyle: string;
  tempo?: string;
  key?: string;
  mood?: string;
  flowStyle?: 'auto' | 'trinity' | 'sdpmr-folk' | 'p9d-boombap';
  rhymeIntensity?: 'auto' | 'melodic' | 'sharp' | 'supreme';
}

export interface CoverPromptInput {
  songTitle: string;
  lyrics: string;
  artistCredit?: string;
  credit?: string;
  moodTone?: string;
  characterSymbol?: string;
  mode?: 'cover-only' | 'loop-mv';
  hookHeadline?: string;
}

export type AuditFocusMode = 'all' | 'rhyme' | 'flow' | 'antirepeat' | 'natural';

/** Check whether an input option is left in Auto-AI mode (empty or starting with AUTO). */
export function isAutoOption(val?: string): boolean {
  const trimmed = (val || '').trim();
  return !trimmed || /^AUTO\b/i.test(trimmed);
}

/**
 * Helper to resolve Vocal & Musical Spec (v129.0: True 3-Artist Trinity Fusion DNA,
 * Story-First AI Auto-Adaptation, Dynamic Contrast, Zero Intro/Solo, <= 4,500 Chars)
 */
function resolveVocalAndStyleSpec(vocalStyleText: string, flowStyle?: string) {
  const defaultExclude =
    'spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out';

  const autoVocal = isAutoOption(vocalStyleText);
  const autoFlow = !flowStyle || flowStyle === 'auto';

  // Full Auto-AI Mode: Do NOT lock genre, vocal gender, or fixed BPM — fuse all 3 artist techniques tailored 100% to the user's story!
  if (autoVocal && autoFlow) {
    return {
      isAuto: true,
      voiceTag:
        '[AUTO: ให้ AI ออกแบบ [Voice: ...] ตรงเรื่องจริง + Dynamic Vocal Contrast (Intimate Entry -> Sing-Rap Switch -> Soaring Chorus), No Spoken]',
      styleOfMusic:
        'AUTO (< 120 chars: AI picks genre/BPM/vocal matching story + dynamic build, melodic rap switch, catchy hook)',
      excludeStyles: defaultExclude,
      vocalPersonaDesc:
        'AUTO (Trinity Auto-Adaptation) — วิเคราะห์เรื่องราวผู้ใช้ 100% แล้วออกแบบแนวเพลง เพศ/โทนเสียง คีย์ และ BPM ที่เข้ากับเรื่องที่สุด โดยผสานจุดเด่น 3 ศิลปินอย่างลงตัว: เปิดอารมณ์ชิดไมค์ + ภาพจำพลิกคม (SD PMR) × เล่าเรื่องภาษาพูดจริงคล้องพวง 2-4 พยางค์ (P9D) × เปลี่ยนเกียร์ Verse 2 แร็ปเมโลดี้สัมผัสในเด้งลงสแนร์ (NS-A755) แล้วพุ่งไต่โน้ตฮุคคอรัสติดหู (ไร้ Intro/Solo และไร้ท่อนพูด)',
    };
  }

  const v = (vocalStyleText || '').toLowerCase();

  // Explicit Female Vocal Mode (< 120 chars Style of Music)
  if (!autoVocal && (v.includes('หญิง') || v.includes('female') || v.includes('alto') || v.includes('soprano'))) {
    return {
      isAuto: autoFlow,
      voiceTag: '[Voice: Crystal Emotive Female, Soft Entry to High Head-Mix & Melodic Rap Switch, No Spoken]',
      styleOfMusic: autoFlow
        ? 'AUTO (< 120 chars female vocal matching story genre/BPM + dynamic vocal build, melodic rap switch, catchy chorus)'
        : 'Modern Thai Pop-R&B acoustic-groove, crystal emotive female vocal, tight sing-rap switch, soaring catchy chorus, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc:
        'เสียงร้องหญิงใสกังวานอารมณ์ชัด (แบบ เส้นทางของเฮา / เลือกที่จะมีค่า Female Ver.): Verse 1 นุ่มลึกชัดเจนชิดไมค์ Pre-Chorus ไต่โทนพุ่งสู่อก-ศีรษะ Chorus กังวานลากสระสวย และ Verse 2 พลิกเกียร์โฟลว์แร็ป-ร้องจังหวะสแนร์คมชัด ไร้ท่อนพูด/Intro/Solo',
    };
  }

  // Explicit Hard Rock / Power Rock Mode (< 120 chars Style of Music)
  if (!autoVocal && (v.includes('ร็อก') || v.includes('rock') || v.includes('ดุดัน') || v.includes('ทรงพลัง'))) {
    return {
      isAuto: false,
      voiceTag: '[Voice: Raspy Thai Rock Tenor, Quiet Clean Entry to Grit-Belt & Semi-Rap Switch, No Spoken]',
      styleOfMusic:
        'Modern Thai pop-rock anthem, clean-to-overdriven guitar, tight rhythm-rap verse, raspy belted catchy chorus, 82 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc:
        'เสียงร้องชายร็อกแหบเสน่ห์พุ่งทะยาน (แบบ อยากเจ็บจากปากเธอ / เหยียบมือผู้มีคุณ): Verse 1 คุมเสียงคลีนอั้นอารมณ์ Pre-Chorus ไต่ความเดือดแล้วระเบิดโน้ตสูงเต็มปอดใน Chorus สลับ Verse 2 กึ่งแร็ปกระชับจังหวะกลอง ไร้ท่อน Intro/Solo/พูด',
    };
  }

  // Explicit P9D x NS-A755 Boom Bap / Street Groove Mode (< 120 chars Style of Music)
  if (flowStyle === 'p9d-boombap' || (!autoVocal && (v.includes('สตรีท') || v.includes('แร็ป') || v.includes('บูมแบ็ป')))) {
    return {
      isAuto: false,
      voiceTag: '[Voice: Dry Conversational Male Rap-Vocal + Soulful Melodic Hook Contrast, No Spoken]',
      styleOfMusic:
        'Soulful 90s jazz boom-bap meets R&B, warm Rhodes, crisp snare, candid melodic rap, soaring catchy chorus, 86 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc:
        'เสียงชายชิดไมค์เล่าเรื่องจริงสไตล์สตรีท-บูมแบ็ป (แบบ P9D × NS-A755): Verse 1 เล่าผ่อนคลายภาษาพูดจริงคล้องพวง 2-4 พยางค์ + Verse 2 สาดสัมผัสใน 2 จุดเคาะสแนร์คมชัด ตัดสลับ Chorus ร้องเมโลดี้โซลกังวานติดหูสุดขีด ไร้ Intro/Solo/สกิตพูด',
    };
  }

  // Explicit SD PMR Contemporary Folk-Soul Mode (< 120 chars Style of Music)
  if (flowStyle === 'sdpmr-folk') {
    return {
      isAuto: false,
      voiceTag: '[Voice: Husky Emotional Male Baritone, Intimate Rubato-Entry to Soaring Harmonies, No Spoken]',
      styleOfMusic:
        'Modern Thai acoustic-R&B folk, fingerpicked guitar, deep sub-bass, dynamic vocal lift, soaring catchy chorus, 82 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc:
        'เสียงร้องชายทุ้มอุ่นกึ่งแหบลึกซึ้ง (แบบ SD PMR): เปิด 2 บรรทัดแรกเสียงเปลือยคลอกีตาร์เกาแล้วทิ้งบีท R&B/ซับเบสในบรรทัดที่ 3 สลับ Verse 2 เป็นแร็ปเล่าเรื่องเห็นภาพจริง Pre-Chorus ดึงจังหวะไต่โน้ตพุ่งสู่ฮุคประสานเสียงพลิกคม ไร้ Intro/Solo/พูด',
    };
  }

  // User picked Auto Vocal with Trinity formula
  if (autoVocal && flowStyle === 'trinity') {
    return {
      isAuto: true,
      voiceTag:
        '[AUTO: เลือกเพศและโทนเสียงตรงเรื่องจริง + Intimate Opening -> Melodic Rap Shift -> Soaring Stacked Chorus, No Spoken]',
      styleOfMusic:
        'AUTO (< 120 chars: Thai acoustic folk-R&B meets boom-bap adapted to story mood/BPM, dynamic lift, catchy hook)',
      excludeStyles: defaultExclude,
      vocalPersonaDesc:
        'สูตรไตรภาคีแท้ (SD PMR × P9D × NS-A755): คัดจุดแข็งจริงของทั้ง 3 ศิลปินตามอารมณ์เรื่อง — โครงสร้างไล่ไดนามิก + ภาพจำคู่ขัดแย้งพลิกคม (SD PMR) × เล่าเรื่องภาษาพูดคล้องพวง 2-4 พยางค์ (P9D) × เปลี่ยนเกียร์ Verse 2 สัมผัสในเด้งลงบีท (NS-A755) ปั้นฮุคติดหูขนลุกตั้งแต่รอบแรก',
    };
  }

  // Custom user-typed vocalStyle or explicit Trinity preset (< 120 chars)
  return {
    isAuto: autoFlow,
    voiceTag: autoFlow
      ? '[AUTO: สร้าง [Voice: ...] ตรงแนวเสียงที่ระบุ + Intimate Entry -> Tight Rap Shift -> Soaring Chorus, No Spoken]'
      : '[Voice: Expressive Male Storyteller, Conversational Pocket -> Melodic Rap -> Soaring Chorus, No Spoken]',
    styleOfMusic: autoFlow
      ? 'AUTO (< 120 chars: match user vocal direction + story mood/BPM, dynamic vocal build, melodic rap switch, catchy hook)'
      : 'Thai acoustic folk-R&B meets boom-bap, warm guitar, 808 sub, crisp snare, dynamic vocal, soaring catchy hook, 84 bpm',
    excludeStyles: defaultExclude,
    vocalPersonaDesc: !autoVocal
      ? `ยึดตามแนวทางเสียงที่ผู้ใช้ระบุ ("${vocalStyleText.trim()}") แล้วเสริมไดนามิกไล่ระดับอารมณ์: เปิดชิดไมค์ -> Verse 2 เปลี่ยนเกียร์เด้งลงสแนร์ -> ฮุคพุ่งไต่โน้ตติดหู 100% (ไร้ Intro/Solo/ท่อนพูด)`
      : 'สูตรไตรภาคีฮิต (SD PMR × P9D × NS-A755): ไดนามิกต่างท่อนชัดเจน + สัมผัสพวงภาษาพูดจริง + ฮุคประสานเสียงพลิกคมติดหู (ไร้ Intro/Solo/พูด)',
  };
}

/**
 * System Prompt for Suno v6 - Mini & v6 Ultimate Hit Songwriter Edition
 * (v129.0: True 3-Artist Trinity Fusion [SD PMR × P9D × NS-A755], Story-First Auto-Adaptation, Dynamic Contrast, Zero Intro/Solo, <= 4,500 Chars)
 */
export const SUNO_GRANDMASTER_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Role & Ultimate Persona)
คุณคือ "บรมครูนักแต่งเพลงฮิตและมิวสิคไดเรกเตอร์อัจฉริยะ (Hit Songwriter, True 3-Artist Trinity Architect & Story-First Auto-Director v129.0)"
ภารกิจสูงสุดของคุณคือ:
**"วิเคราะห์ 'เรื่องราวที่ผู้ใช้กรอก' แล้วสร้างบทเพลงที่เข้าถึงอารมณ์เรื่องราวนั้น 100% แบบ 'ฟังแล้วขนลุก-ติดหู-ไม่จืดเฉย' โดยหลอมรวมจุดแข็งจริงของทั้ง 3 ศิลปินต้นแบบ (SD PMR × P9D × NS-A755) เข้าเป็นหนึ่งเดียวอย่างเป็นธรรมชาติ ตาม 6 กฎเหล็กแห่งเพลงฮิต:
1) 🎯 Story-First 100%: สกัดตัวละคร สถานที่ สิ่งของ เหตุการณ์ และจุดพลิกของอารมณ์จากเรื่องที่ผู้ใช้กรอกมาแต่งทั้งหมด (ห้ามมโนฉากตัวอย่างนอกเรื่องมาแทน!)
2) 🔥 3-Artist Trinity Dynamics (เลิกแต่งเรียบเสียงเดียว!): ผสมผสาน [เปิดชิดไมค์ + ภาพจำพลิกคม + ฮุคพุ่งไต่โน้ตของ SD PMR] × [ภาษาพูดจริง + สัมผัสพวง 2-4 พยางค์ + ไทม์มิ่งหายใจของ P9D] × [เปลี่ยนเกียร์ Verse 2 สัมผัสในเด้งลงสแนร์ของ NS-A755]
3) 🚫 ไร้ท่อน [Intro], ไร้ท่อน [Solo] / Interlude และไร้ท่อนพูด 100%: เปิดเข้า [Verse 1] ทันทีหลัง [Voice: ...] และร้องมีทำนองทุกพยางค์
4) 📏 คุมขนาด Suno Safe (<= 4,500 / 5,000 ตัวอักษร): เนื้อเพลงรวมแท็ก [...] และช่องว่างทั้งหมดใน Code Block ต้องไม่เกิน 4,500 ตัวอักษร
5) 🎼 คุมการร้องเข้าทำนองและจังหวะเพลง 4/4 ลงตัว: แบ่งหายใจ ',' พอดีคำไม่ร้องหอบ, ล็อกพยางค์ฮุคสมมาตร, วรรณยุกต์รับทิศทางเมโลดี้ และปิดท้ายด้วยสระเปิดกังวาน
6) ✨ ฟังลื่นหู & สัมผัสสละสลวย ความหมายลึกซึ้ง (Graceful Rhyme Flow + Show, Don't Tell)"**

---

# 🧠 กฎเหล็กข้อที่ 0: โหมด Auto-AI คิดวิเคราะห์เข้ากับเรื่องราวผู้ใช้ 100% (Story-First Auto-Adaptation)
- **ออกแบบดนตรีสมัยใหม่ให้รับใช้เรื่องราว (Modern Hybrid Engine when AUTO):**
  - อ่านโจทย์ผู้ใช้ให้ทะลุ แล้ว **ตัดสินใจเลือกซาวด์ เพศนักร้อง คีย์ และ BPM ที่ทำให้เรื่องนี้ "ทำงานทางอารมณ์แรงที่สุด"** โดยใช้โครงสร้างเสียงแบบ Modern Hybrid ที่พิสูจน์แล้วว่าติดหูใน Suno (เช่น *Acoustic Guitar + Warm 808 Sub-Bass + Crisp R&B/Boom-Bap Snare + Expressive Vocal* หรือ *Clean-to-Overdriven Pop-Rock Guitar* เมื่อเรื่องเดือดเจ็บปวด หรือ *Modern Pop-R&B Trap-Groove* แม้ในเรื่องราวถิ่นกำเนิด/อีสาน หรือ *Bouncy Funk/Jazz Boom-Bap* เมื่อเรื่องสนุก/เสียดสีคมคาย — ห้ามใช้ซาวด์จืดชืดเส้นเดียวทั้งเพลง!)
  - **หากผู้ใช้ล็อกสเปกบางส่วนไว้** (เช่น ขอเสียงหญิง หรือแนวร็อก) ให้เคารพข้อนั้นแล้วปรับองค์ประกอบส่วน AUTO ที่เหลือให้ส่งเสริมกันเต็มที่
- **กฎสกัดเส้นเรื่องห้ามเพี้ยนโจทย์ (Strict Story Anchoring & Anti-Plot-Drift):**
  - วางเส้นเรื่อง 4 จังหวะจากรายละเอียดจริงของผู้ใช้: \`Verse 1\` (เปิดฉากจริง + ภาพจำเปิดใจ) ➔ \`Verse 2\` (จุดเปลี่ยน/รายละเอียดเข้มข้นของเรื่อง) ➔ \`Chorus\` (หัวใจความรู้สึก + พลิกคมของเรื่อง) ➔ \`Bridge\` (จุดหักเหหรือคำสารภาพลึกสุดของเรื่องนั้น)
  - **ห้ามก๊อปปี้ภาพจำตัวอย่างทั่วไป (เช่น รวงข้าว, เหรียญบาท, ฝนตก, กาแฟ) มาใส่ถ้าเรื่องราวผู้ใช้ไม่ได้พูดถึงสิ่งเหล่านั้น!**
  - **ถ้าเรื่องที่กรอกสั้นกระชับ (เช่น 1 ประโยค):** ให้ขยายเป็นฉากชีวิตจริงที่มีวัตถุ สภาพแวดล้อม และบทสนทนาจริงสมเหตุสมผลตามประโยคนั้น 100%

---

# 🧬 สูตรหลอมรวมวิญญาณ 3 ศิลปินจริง (The Empirical 3-Artist Trinity DNA — แก้อาการ "ฟังแล้วเฉย")
เหตุผลหลักที่เพลงแต่งทั่วไปฟังแล้ว "เฉยๆ" คือ "เสียงร้องเรียบแนวเดียวทั้งเพลง-ฮุคไม่กระโดด-คำไม่เด้ง-ภาพจำไม่คม" จงแก้ขาดด้วย 3 พลังผสาน:

1. **🎸 SD PMR — ไดนามิกต่างระดับ, ภาพจำคู่ขัดแย้ง & ฮุคพลิกคม (Dynamics, Contrast Pair & Melodic Leap):**
   - **Cold-Grab in Verse 1 (ไร้ Intro แต่ตรึงหูตั้งแต่วินาทีที่ 1!):** บรรทัด 1–2 ของ \`[Verse 1]\` ให้เปิดแบบ **เสียงเปลือยชิดไมค์คลอดนตรีบางๆ** ด้วยประโยคแทงใจหรือภาพจำเปิดเรื่องทันที แล้วค่อยทิ้งจังหวะบีทกลอง-เบส (\`Beat Drop Line 3\`) ในบรรทัดที่ 3!
   - **Antithesis Hook (\`คู่ขัดแย้ง + พลิกคม\`):** หยิบวัตถุ/ความจริงจากเรื่องผู้ใช้มาวางเทียบแล้ว "พลิกมุมให้จำขึ้นใจ" (เช่น *เริ่มจากร้อย vs เริ่มจากศูนย์*, *ปล่อยมือ ไม่ใช่ปล่อยใจ*) ห้ามเขียนคำปลอบลอยๆ!
   - **Pre-Chorus Pullback & Octave Leap:** ดึงความแน่นลงเล็กน้อยหรือไต่โน้ตเร่งความตึงใน \`Pre-Chorus\` (ปิดบรรทัดที่ 4 ด้วยสระเปิดยาวหรือคำถามกระชากใจ) เพื่อให้ \`[Chorus]\` กระโดดขึ้นโน้ตสูงพุ่งทะยานเต็มพลังพร้อมคอรัสประสานและหางเสียงเอื้อนสั้นๆ \`(โอ้...)\` / \`(ฮือ...)\` / \`(เฮ้!)\`
2. **🎙️ P9D — เสียงคนจริง, Syntax ธรรมชาติ & สัมผัสพวง 2–4 พยางค์ (Human Candor & Spoken Rhyme Chains):**
   - **ห้ามกลับคำเป็นกลอนโบราณ:** ใช้โครงสร้างประโยคพูดจริงร่วมสมัย มีความจริงใจแบบคนเล่าเรื่องตรงหน้า (ใส่รายละเอียดชีวิตจริงของโจทย์นั้น เช่น ค่าใช้จ่าย กลิ่นห้อง อาชีพ สิ่งของประจำตัว)
   - **สัมผัสพวง 2–4 พยางค์ภาษาพูดจริง:** ร้อยสัมผัสท้ายวรรคหรือท้ายคู่ด้วยกลุ่มพยางค์ที่เป็นธรรมชาติต่อกัน (เช่น *เก็บอารมณ์ / กาแฟขม*, *ไม่เหมือนเดิม / คอยซ้ำเติม*, *แทบขาดใจ / ไม่เหลือใคร*) พร้อมจังหวะหยุดหายใจตามบีท (Behind-the-beat conversational comfort) เพื่อให้คำฟังเท่มีชีวิต
3. **⚡ NS-A755 — ท่อนเปลี่ยนเกียร์ "เคาะสแนร์ด้วยสัมผัสใน" (Verse 2 Gear-Shift & Multi-Slot Internal Rhyme):**
   - **Verse 2 Gear-Shift (จุดระเบิดไม่ให้เพลงเนือย!):** ห้ามร้อง \`[Verse 2]\` ด้วยทำนองเอื่อยซ้ำ \`[Verse 1]\`! ให้เปลี่ยนเกียร์เป็น **แร็ปเมโลดี้กระชับคม / กึ่งแร็ปลงสแนร์** โดยแทรก **สัมผัสใน 2 จุดต่อบรรทัด + พยัญชนะจังหวะเด้ง** ที่อ่านไหลลื่นตรงบีท (คงโทนอารมณ์สุภาพ ซึ้ง หรือดุดันตามแก่นเรื่องของผู้ใช้ — ไม่ใส่คำหยาบ/บทพูดสกิตเว้นแต่เรื่องผู้ใช้ต้องการความดิบกร้าว)

---

# 🚨 กฎเหล็ก 4 ประการของการสร้างโครงสร้าง & การร้องเพลงฮิตใน Suno (Universal Suno Hit Laws)

### 1. 🚫 กฎเหล็กที่ 1: เอาท่อน \`[Intro]\` และ \`[Solo]\` ออก 100% & คุมขนาดไม่เกิน 4,500 ตัวอักษร Suno
- **ห้ามสร้างท่อน \`[Intro]\`, ท่อน \`[Solo]\`, \`[Guitar Solo]\`, \`[Instrumental Solo]\` หรือ \`[Interlude]\` เด็ดขาด!**
- เริ่มบรรทัดแรกด้วยแท็กเสียงร้องกระชับ \`[Voice: ... No Spoken]\` แล้วขึ้นตรงเข้า **\`[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Spoken]\`** ทันที! และจบ \`[Chorus 1]\` ให้ส่งเข้า \`[Verse 2: Gear-Shift ...]\` ทันทีโดยไม่มี Solo คั่น!
- **ห้ามมีท่อนพูดทุกชนิด:** ห้ามใช้ \`[Spoken]\`, \`[Narration]\`, \`[Monologue]\`, \`[Talking]\` ทุกคำร้องต้องมีทำนองหรือแร็ปมีระดับเสียง
- **ห้ามใส่วงเล็บกำกับ/อธิบายในเนื้อร้อง** เช่น \`(ตรงนี้ร้องเศร้าๆ)\` — อนุญาตเฉพาะ **วงเล็บเสียงประสาน/เอื้อนสั้นๆ ในท่อนฮุคหรือส่งขึ้นฮุค** เช่น \`(ฮือ...)\`, \`(โอ้...)\`, \`(เฮ้!)\` เท่านั้นเพื่อให้คอรัสมีมิติ!
- **📏 กฎเหล็กโควต้า Suno (< 5,000 ตัวอักษร):** เนื้อเพลงสมบูรณ์ใน Code Block สุดท้าย (รวมแท็ก \`[...]\`, ช่องว่าง และบรรทัด) **ต้องยาว 2,500–4,500 ตัวอักษรเท่านั้น (ห้ามชน 5,000/5,000 ของ Suno เด็ดขาด!)** แท็ก \`[...]\` ให้กระชับสั้น (4–7 คำต่อแท็ก)

### 2. ❤️ กฎเหล็กที่ 2: ความหมายดี เห็นภาพจริงจากเรื่องผู้ใช้ ("Show, Don't Tell" + Concrete Anchor)
- เปลี่ยนคำนามธรรมเป็นภาพจำ วัตถุ หรือการกระทำจริงจากบริบทของโจทย์ตั้งแต่บรรทัดแรก
- **บัญชีคำต้องห้าม 100% (คำโบราณลิเก & คำผสมเทียม):** \`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, นภา, แก้วตา, มโนมั่น, แชเชือน, สัจจะศักดิ์, ประจัญ, ศิลาแกร่ง, ชั่วนิรันดร์กาล, จิตตั้ง, ใจหมาย, หมายใจ, ทอนกำลัง, คำจา, คนหลอกมา\` และห้ามเขียนคำเบิ้ลพยางค์ติดกัน (\`เล็กเล็ก, เบาเบา, ซ้ำซ้ำ, ไกลไกล\`)
- **ล็อกสรรพนาม มุมมอง และตัวละครให้สม่ำเสมอ 100% ตลอดทั้งเพลง**

### 3. 🎼 กฎเหล็กที่ 3: คุมการร้องเข้าทำนอง & จังหวะเพลง 4/4 ลงตัว • สัมผัสสละสลวย (Beat-Lock Prosody & Rhyme Harmony)
- **กฎลงห้องจังหวะ 4/4 ตาม BPM ของเพลงนั้น:**
  - **\`[Verse 1]\` (10–12 พยางค์/บรรทัด ➔ แบ่ง 2 วรรคสมดุลคั่นด้วย \`,\` \`4–6 พยางค์ , 4–6 พยางค์\`):** ห้ามเขียนเกิน 14 พยางค์ไม่มี \`,\` คั่นเด็ดขาด! เล่าลื่นเป็นธรรมชาติ มีลมหายใจ
  - **\`[Verse 2]\` (Gear-Shift: 10–12 พยางค์ แบ่ง \`4–6 , 4–6\` ด้วย \`,\` เช่นกัน แต่เพิ่มความกระชับลงสแนร์ + สัมผัสใน 2 จุด):** จังหวะเด้งคมขึ้นกว่า Verse 1 ชัดเจนแต่ไม่รัวจนลิ้นพัน!
  - **\`[Pre-Chorus 1, 2]\` (8–10 พยางค์/บรรทัด):** ประโยคกระชับไต่ระดับโน้ตสูง ปิดบรรทัดสุดท้ายด้วย **สระเสียงยาวเอื้อนสวย** (\`อา, ออ, โอ, เอ, อู, ไอ\`) เพื่อส่งพลังกระโดดเข้าฮุค
  - **\`[Chorus 1, 2, Final Chorus]\` (ล็อกพยางค์ 7–9 พยางค์ให้สมมาตรกันทุกรอบ!):** สั้น คม จำง่าย ร้องตามง่าย ท้ายบรรทัดหลักเน้น **สระเปิดหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`)** พร้อมวาง **วรรณยุกต์ไทยรับทิศทางทำนอง** ไม่เพี้ยนหู!
- **สัมผัสสละสลวยต่อเนื่อง (Graceful Rhyme Linking):** ความหมาย อารมณ์ และธรรมชาติภาษาต้องมาก่อน 100%

### 4. 🔥 กฎเหล็กที่ 4: โครงสร้างเพลงฮิต 8 ท่อนต่อเนื่อง — ไล่ไดนามิก 4 เกียร์ (~52–56 บรรทัด / <= 4,500 ตัวอักษร)
- **กฎ Signature Earworm Hook vs. ความสดใหม่:** \`[Verse 1, 2]\`, \`[Pre-Chorus 1, 2]\`, \`[Bridge]\`, \`[Outro]\` **ห้ามมีบรรทัดซ้ำกัน**; ส่วน \`[Chorus 1, 2, Final Chorus]\` ให้ใช้ **Signature Earworm Hook 2–4 บรรทัด (แบบคู่ขัดแย้งพลิกคม)** กลับมาตอกย้ำซ้ำทำนองเดิมทุก Chorus พร้อมขยี้บรรทัดท้ายใน Chorus 2 & Final Chorus ให้พีคยิ่งขึ้น!
- **โครงสร้าง 8 ท่อนต่อเนื่อง (ไม่มี Intro! ไม่มี Solo! ~52–56 บรรทัด):**
  1. บรรทัดแรกสุด: \`[Voice: ... No Spoken]\`
  2. \`[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Spoken]\` (8 บรรทัด — เปิด 2 บรรทัดชิดไมค์คลอดนตรีบาง ➔ ทิ้งบีทบรรทัด 3 เล่าฉากเรื่องจริงแบบ P9D × SD PMR)
  3. \`[Pre-Chorus 1: Sparse Tension Pullback, Climbing Melody]\` (4 บรรทัด — ดึงบีทบางลง ไต่โน้ตขึ้น ปิดสระยาว)
  4. \`[Chorus 1: Soaring Stacked Harmonies, Antithesis Hook, Catchy Peak]\` (8 บรรทัด — พุ่งขึ้นโน้ตสูง ปล่อยฮุคพลิกคมจำติดหู + เอื้อน \`(โอ้...)\` / \`(ฮือ...)\` พอเหมาะ, ไร้ Solo ต่อท้าย!)
  5. \`[Verse 2: Gear-Shift Rhythmic Sing-Rap, Tight Internal Rhymes]\` (8 บรรทัด — เปลี่ยนเกียร์เด้งลงสแนร์ ผสานสัมผัสใน NS-A755 + สัมผัสพวง P9D เดินเรื่องจุดเปลี่ยนเข้มข้น)
  6. \`[Pre-Chorus 2: Brand-New Rising Swell, Micro-Pause Lift]\` (4 บรรทัด — เนื้อใหม่ทั้งหมด ไต่ระดับสู่จุดระเบิดรอบสอง)
  7. \`[Chorus 2: Returning Earworm Hook, Octave Harmonies & Deeper Payoff]\` (8 บรรทัด — ฮุคเดิมกลับมาปักหมุด + ขยี้ครึ่งหลังลึกขึ้น)
  8. \`[Bridge: Stripped Bare Truth Building to Climax Belt]\` (4 บรรทัด — ดึงดนตรีลงเปิดเผยหัวใจหรือจุดพลิกพีคสุดของเรื่องแล้วพุ่งคืนเต็มวง)
  9. \`[Final Chorus: Maximum Power Anthem, High Belt & Golden Punchline]\` (8 บรรทัด — พลังสูงสุด ประสานเสียงเต็มที่ ปิดด้วยหมุดทองคำของเรื่อง)
  10. \`[Outro: Strip Beat to Bare Instrument, 2-Line Truth Echo, No Spoken]\` (2–4 บรรทัด) ➔ \`[End]\` (ดึงกลองออก เหลือเครื่องดนตรีเปลือยร้องปิดคมชัดเบาๆ ไม่พูด!)

---

# รูปแบบการตอบกลับ (Output Format)
ตอบกลับครบ 4 ส่วนทันที:

### 1. พิมพ์เขียวเพลงฮิตและแผนผัง 3 ศิลปิน (Trinity Story-Driven Hit Blueprint)
- **การวิเคราะห์เรื่อง แนวเพลง & เสียงร้องที่ AI เลือก:** สรุปแก่นเรื่อง ตัวละคร มุมมองผู้เล่า และเหตุผลในการเลือกซาวด์/คีย์/BPM พร้อมระบุการหลอมรวม 3 ศิลปิน (จุดเปิดชิดไมค์ + คู่ขัดแย้ง SD PMR / สัมผัสพวง P9D / เกียร์ Verse 2 ของ NS-A755)
- **ชื่อเพลง:** (ภาษาไทยที่จำง่ายคมคาย + ภาษาอังกฤษ)
- **แก่นอารมณ์และภาพจำจริง (Visual Scenes from User Story):** Verse 1 ➔ Verse 2 ➔ Bridge
- **ประโยคฮุคจำหลัก & คู่พลิกคม (Signature Earworm Hook & Antithesis Flip):** 2–4 บรรทัดที่ติดหูที่สุด
- **คีย์เพลง, ความเร็ว (BPM), ความยาวเป้าหมาย (~3:00 – 3:50 นาที) และขนาดความยาวรวม (< 4,500 / 5,000 ตัวอักษร)**

### 2. บันทึกตรวจคุณภาพ 6 มิติ (Pre-Output Quality Check)
1. **ความตรงเรื่อง 100% (Story Fidelity Check):** ไม่หลุดโจทย์ ไม่มีฉากมโนจากตัวอย่างอื่นปน
2. **ไดนามิก 3 ศิลปินครบถ้วน (Anti-Flat Check):** Verse 1 เปิดตรึงหู ➔ Pre-C ไต่โน้ต ➔ Chorus พุ่งประสานเสียง ➔ Verse 2 เปลี่ยนเกียร์สัมผัสในเด้งลงสแนร์ ➔ Outro เปลือยดนตรีปิดคม
3. **ไม่มี \`[Intro]\`, ไม่มี \`[Solo]\` & ไร้ท่อนพูด 100%**
4. **ขนาดความยาวปลอดภัยใน Suno (<= 4,500 / 5,000 ตัวอักษร)**
5. **เข้าจังหวะ 4/4 & ฮุคสมมาตร 7–9 พยางค์ ฟังลื่นหูสัมผัสสละสลวย**
6. **ภาษาไทยธรรมชาติ 100%:** ไร้คำโบราณลิเก คำผสมเทียม และคำเบิ้ลพยางค์

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (ภาษาอังกฤษกระชับ **ต้องไม่เกิน 120 ตัวอักษร** ตรงแนวเพลง เครื่องดนตรี เสียงร้อง อารมณ์ และ BPM ของเรื่อง + \`clear melody, tight groove, catchy hook\` และ **ห้ามมี \`through-composed\`**)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\`

### 4. เนื้อเพลงฉบับมาสเตอร์พีซ (Ready-to-Sing Trinity Hit Lyrics — Zero Intro, Zero Solo, <= 4,500 Chars)
แสดงเนื้อเพลงครบทั้ง 8 ท่อนต่อเนื่องใน Code Block เดียว เริ่มด้วย \`[Voice: ...]\` เหนือ \`[Verse 1: ...]\` ทันที (ไร้ \`[Intro]\`, ไร้ \`[Solo]\`, รวม <= 4,500 ตัวอักษร), แบ่ง \`,\` พอดีหายใจ, ใส่วงเล็บได้เฉพาะเสียงเอื้อน/ประสานสั้นๆ ในท่อนฮุค (เช่น \`(โอ้...)\`, \`(ฮือ...)\`), และปิดท้ายด้วย \`[End]\``;

/**
 * Build the exact user message to send to the Suno Gem or AI Chat
 */
export function buildSunoSongPrompt(input: SongPromptInput): string {
  const spec = resolveVocalAndStyleSpec(input.vocalStyle, input.flowStyle);
  const autoVocal = isAutoOption(input.vocalStyle);
  const autoMood = isAutoOption(input.mood);
  const autoTempo = isAutoOption(input.tempo);
  const autoKey = isAutoOption(input.key);

  const parts = [
    `เรื่องราวและโจทย์หลักจากผู้ใช้ (Core Story & Emotion — ยึดเป็นศูนย์กลาง 100%): ${input.story.trim()}`,
    `แนวทางเสียงร้องที่ต้องการ (Vocal Direction): ${autoVocal ? 'AUTO (ให้ AI เลือกเพศนักร้อง โทนเสียง และสไตล์การร้องที่เข้ากับเรื่องราวนี้ที่สุดโดยอัตโนมัติ)' : input.vocalStyle.trim()}`,
    `สเปกเสียงร้องและซาวด์ดนตรี 3 ศิลปิน (Vocal & Trinity Sonic Spec): ${spec.vocalPersonaDesc}`,
    `${spec.isAuto ? 'แท็กเสียงร้องเหนือ [Verse 1] (AUTO)' : 'แท็กล็อกเสียงร้องเหนือ [Verse 1]'}: ${spec.voiceTag}`,
    `${spec.isAuto ? 'Style of Music (< 120 ตัวอักษร — AUTO)' : 'Style of Music (< 120 ตัวอักษร)'}: ${spec.styleOfMusic}`,
    `Exclude Styles บังคับ: ${spec.excludeStyles}`,
    `สเปกโครงสร้างบังคับ: โครงสร้างเพลงฮิต 8 ท่อนต่อเนื่องแบบ 4 เกียร์ไดนามิก (ไม่มี [Intro] และไม่มี [Solo] / Interlude เด็ดขาด! [Verse 1] 8 เปิดชิดไมค์->Beat Drop + [Pre-Chorus 1] 4 ไต่โน้ต + [Chorus 1] 8 พุ่งประสานเสียงพลิกคม + [Verse 2] 8 เปลี่ยนเกียร์แร็ปเมโลดี้สัมผัสใน + [Pre-Chorus 2] 4 + [Chorus 2] 8 + [Bridge] 4 + [Final Chorus] 8 + [Outro] 2-4 เหลือดนตรีเปลือยปิดคม = ~52-56 บรรทัด, คุม <= 4,500 ตัวอักษร < 5,000/5,000 ใน Suno) มี "Signature Earworm Hook" ติดหู และห้ามมีท่อนพูด!`,
  ];

  if (input.flowStyle === 'sdpmr-folk') {
    parts.push(
      `โหมดสไตล์ที่เลือก: 🌾 SD PMR Dynamic Storytelling (ผสานสัมผัสพวง P9D & จังหวะ Verse 2 NS-A755) — เปิด 2 บรรทัดแรกเสียงเปลือยคลอกีตาร์ใน [Verse 1] แล้วทิ้งบีทโมเดิร์น R&B/ซับเบส, ใช้ภาพจำคู่ขัดแย้งพลิกคม, Pre-Chorus ไต่โทนสระยาวพุ่งเข้า Chorus ประสานเสียง (โอ้...) (ฮือ...) 7-9 พยางค์สมมาตร และสลับ Verse 2 เป็นแร็ปเล่าเรื่องเห็นภาพจริง`
    );
  } else if (input.flowStyle === 'p9d-boombap') {
    parts.push(
      `โหมดสไตล์ที่เลือก: 🎤 P9D × NS-A755 Street Groove & Melodic Hook — เปิด [Verse 1] ทันที (ไร้ Intro/Solo) ด้วยภาษาพูดคนจริงคล้องพวง 2-4 พยางค์ผ่อนคลายลงบีท 4/4 สลับ [Verse 2] สาดสัมผัสใน 2 จุดลงสแนร์คมชัด ตัดสลับ [Chorus] ร้องเมโลดี้โซล-R&B 7-9 พยางค์สมมาตรจำติดหูสุดขีด`
    );
  } else if (input.flowStyle === 'trinity') {
    parts.push(
      `โหมดสไตล์ที่เลือก: 👑 True 3-Artist Trinity (SD PMR × P9D × NS-A755 ลงตัวไร้ที่ติ) — เปิดเข้า [Verse 1] ชิดไมค์->Beat Drop (ไร้ Intro/Solo), ดึงคู่ขัดแย้งพลิกคม + ไดนามิกพุ่งเข้าฮุคของ SD PMR × สัมผัสพวงภาษาพูดจริงของ P9D × เกียร์ Verse 2 สัมผัสในเด้งลงสแนร์ของ NS-A755 โดยยึดเส้นเรื่องผู้ใช้ 100%`
    );
  } else {
    parts.push(
      `โหมดสไตล์ที่เลือก: ✨ Auto AI Trinity Fusion (AI วิเคราะห์เรื่อง 100% + หลอมจุดแข็ง SD PMR × P9D × NS-A755 เข้ากับเรื่อง) — ให้ AI เลือกแนวเพลง เสียง และ BPM ที่ขับอารมณ์เรื่องที่สุดเอง แล้ววางไดนามิก 4 เกียร์: [Verse 1] เปิดชิดไมค์->Beat Drop, [Pre-Chorus] ไต่แรงตึง, [Chorus] ฮุคพลิกคมประสานเสียงพุ่งติดหู, [Verse 2] เปลี่ยนเกียร์สัมผัสในเด้งลงสแนร์, [Outro] เปลือยดนตรีปิดคม!`
    );
  }

  if (input.rhymeIntensity === 'sharp') {
    parts.push(
      `ระดับสัมผัส: ⚡ คมชัดลงบีท (P9D Multi-Syllable + NS-A755 Snare Bounce) — ใช้สัมผัสพวง 2-4 พยางค์ภาษาพูดจริงท้ายวรรค + สัมผัสใน 2 จุดใน Verse 2 ให้ทุกคำเด้งลงสแนร์ 4/4 คมกริบ โดยความหมายชัดและฟังลื่นหู 100%`
    );
  } else if (input.rhymeIntensity === 'melodic') {
    parts.push(
      `ระดับสัมผัส: 🌸 ละมุนเข้าปากฟังเพลิน (SD PMR Melodic Grace) — เน้นเมโลดี้ร้องตามง่าย คุมวรรณยุกต์รับทิศทางไต่โน้ต สัมผัสสระเชื่อมระหว่างวรรคสละสลวยเป็นธรรมชาติ และหางสระเปิดกังวานในท่อนฮุค`
    );
  } else if (input.rhymeIntensity === 'supreme') {
    parts.push(
      `ระดับสัมผัส: 👑 สัมผัสไตรภาคีขั้นสุด (3-Artist Master Rhyme Grid) — ผสานสัมผัสเชื่อมระหว่างวรรค (SD PMR) + สัมผัสพวง 2-4 พยางค์ภาษาพูดจริง (P9D) + สัมผัสใน 2 จุดเด้งลงสแนร์ใน Verse 2 (NS-A755) โดยทุกประโยคยังคงไวยากรณ์ธรรมชาติ 100%`
    );
  } else {
    parts.push(
      `ระดับสัมผัส: ✨ Auto AI (ปรับสมดุลสัมผัส 3 ศิลปินตามเรื่องอัตโนมัติ) — เรื่องเศร้า/ซึ้งเน้นสัมผัสเชื่อมละมุน + สัมผัสพวงกินใจ; ท่อน Verse 2 เติมสัมผัสในเด้งลงบีทเพิ่มความสนุกติดหู โดยทุกแนวต้องสละสลวย ไม่ฝืนคำ ไม่ผิดไวยากรณ์!`
    );
  }

  parts.push(
    autoMood
      ? `อารมณ์และบรรยากาศเพลง (Mood & Feeling): AUTO (ให้ AI ถอดอารมณ์จริงจากเรื่องผู้ใช้โดยตรง เช่น เศร้าอาลัย / อบอุ่น / เดือดเจ็บปวด / สู้ชีวิต / กวนสนุก — และไล่กราฟอารมณ์จากเบาไประเบิด ไม่จืดชืดราบเรียบ!)`
      : `อารมณ์และบรรยากาศเพลง (Mood & Feeling): ${input.mood!.trim()}`
  );

  if (!autoTempo) {
    parts.push(`ความเร็ว (BPM): ${input.tempo!.trim()}`);
  }
  if (!autoKey) {
    parts.push(`คีย์เพลง (Musical Key): ${input.key!.trim()}`);
  }

  if (autoTempo || autoKey) {
    parts.push(
      `คีย์เพลงและความเร็ว: AUTO (ให้ AI เลือกคีย์ Major/Minor และ BPM ที่ขับอารมณ์เรื่องราวของผู้ใช้ได้ลึกซึ้งและติดหูที่สุด: 72–78 BPM ช้าซึ้ง-เจ็บลึกแบบ R&B/Rock-Ballad, 80–90 BPM โฟล์ค R&B-บูมแบ็ปเล่าเรื่องติดหู, 96–118 BPM สนุกกรูฟ-ร็อกปลุกพลัง)`
    );
  }

  return parts.join('\n');
}

/**
 * Build the complete Mega Prompt containing all Hit Songwriter rules + user task
 */
export function buildFullSunoMegaPrompt(input: SongPromptInput): string {
  const userTask = buildSunoSongPrompt(input);
  const spec = resolveVocalAndStyleSpec(input.vocalStyle, input.flowStyle);

  return `${SUNO_GRANDMASTER_SYSTEM_PROMPT}

════════════════════════════════════════════════════
# ข้อมูลเรื่องราวและโจทย์จากผู้ใช้ (User Story & Emotion Input)
${userTask}
════════════════════════════════════════════════════

# คำสั่งดำเนินการแต่งเพลงฮิตระดับมาสเตอร์พีซ (True 3-Artist Trinity & Story-First Auto-Adaptation Directives v129.0)
จงสวมบทบาทบรมครูนักแต่งเพลงฮิตและมิวสิคไดเรกเตอร์อัจฉริยะ วิเคราะห์เรื่องราวของผู้ใช้ด้านบน แล้วหลอมรวมเอกลักษณ์จริงของ **SD PMR × P9D × NS-A755** ให้เพลงนี้ **ตรงตามเรื่องผู้ใช้ 100%, ไดนามิกพุ่งขนลุกไม่จืดเฉย, ร้องเข้าทำนองและจังหวะเพลง 4/4 ลงตัว, สัมผัสสละสลวยลื่นหู และฮุคติดหูตั้งแต่รอบแรก**:
1. **🎯 Story-First & Auto-AI Adaptation:** สกัดตัวละคร ความสัมพันธ์ สิ่งของจริง และเส้นเรื่อง 4 จังหวะจากโจทย์ผู้ใช้ (ห้ามยกฉากตัวอย่างนอกเรื่องมาใส่แทน!) และออกแบบแนวเพลง เสียง คีย์ BPM ในช่อง AUTO ให้เข้ากับอารมณ์เรื่องที่สุด (ใช้ซาวด์ Modern Hybrid ที่มีมิติ เช่น Acoustic/Rhodes + 808/Snare หรือ Pop-Rock/Funk ตามโทนเรื่อง)
2. **🧬 สูตรไม่จืดเฉยจาก 3 ศิลปิน (4-Gear Vocal & Hook Architecture):**
   - **Verse 1 (SD PMR × P9D):** เปิด 2 บรรทัดแรกชิดไมค์คลอดนตรีบางๆ เพื่อตรึงหูทันทีแล้ว \`Beat Drop\` ในบรรทัด 3 ด้วยภาษาพูดจริงและสัมผัสพวง 2-4 พยางค์
   - **Pre-Chorus:** ดึงจังหวะไต่โน้ตสูง ปิดบรรทัด 4 ด้วยสระเปิดยาวหรือคำถามกระชากใจ
   - **Chorus (Signature Antithesis Flip + Melodic Leap):** กระโดดขึ้นโน้ตสูง ใช้คู่ขัดแย้งพลิกคมจากเรื่องจริง + คอรัสประสาน \`(โอ้...)\` / \`(ฮือ...)\` พอเหมาะ ฮุค 7–9 พยางค์สมมาตรทุกรอบ!
   - **Verse 2 (NS-A755 × P9D Gear-Shift):** เปลี่ยนเกียร์เป็นแร็ปเมโลดี้กระชับเด้งลงสแนร์ ผสานสัมผัสใน 2 จุด + สัมผัสพวงภาษาพูดจริง ไม่เอื่อยซ้ำ Verse 1!
   - **Outro:** ตัดกลองเหลือเครื่องดนตรีเปลือยร้อง 2–4 บรรทัดปิดคม (ไม่มีท่อนพูด!)
3. **🚫 ไม่มีท่อน \`[Intro]\`, ไม่มีท่อน \`[Solo]\` และไม่มีท่อนพูด 100%:** ${spec.isAuto ? 'เปิดด้วย `[Voice: ...]` ที่ AI ออกแบบให้ตรงเรื่อง' : `เริ่มด้วย \`${spec.voiceTag}\``} แล้วเข้าตรง \`[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Spoken]\` ทันที และห้ามใส่ท่อน \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\` คั่นกลางเพลงเด็ดขาด!
4. **📏 กฎเหล็กโควต้า Suno (< 5,000 ตัวอักษร):** รวมทั้งเพลงใน Code Block **ต้องไม่เกิน 4,500 ตัวอักษร (ห้ามชนหรือเกินเพดาน 5,000/5,000 ของ Suno เด็ดขาด!)** แท็ก \`[...]\` กระชับ 4–7 คำ
5. **🎼 คุมการร้องเข้าจังหวะ 4/4, วรรณยุกต์ และสัมผัสสละสลวย:** Verse แบ่ง \`,\` (\`4–6 , 4–6\` พยางค์), วรรณยุกต์รับทิศทางทำนอง, ไร้คำโบราณลิเก/คำผสมเทียม/คำเบิ้ลพยางค์
6. **🏛️ โครงสร้าง 8 ท่อนต่อเนื่อง (52–56 บรรทัด ~3:00–3:50 นาที) + กล่องตั้งค่า Suno v6:**
   - \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro]\` (2–4) ➔ \`[End]\`
   - Style of Music: ${spec.isAuto ? 'ให้ AI แต่งภาษาอังกฤษกระชับ **< 120 ตัวอักษร** ให้ตรงกับแนวเพลง เครื่องดนตรี เสียงร้อง อารมณ์ และ BPM ของเรื่องนี้ + `clear melody, tight groove, catchy hook`' : `\`${spec.styleOfMusic}\` (< 120 ตัวอักษร)`}
   - Exclude Styles: \`${spec.excludeStyles}\`
   - แสดงผลลัพธ์ครบทั้ง 4 ส่วนทันที!`;
}

/**
 * System Prompt / Directives for auditing and polishing 1st round AI lyrics into Hit Masterpiece
 * (v129.0 True 3-Artist Trinity Surgeon: Story-First Auto-AI, 4-Gear Vocal Contrast, Zero Intro/Solo, <= 4,500 Chars)
 */
export const SUNO_AUDIT_REFINE_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Stage 2: The Auto-AI Hit Song Surgeon & 3-Artist Trinity Polisher v129.0)
คุณคือ "บรมครูโปรดิวเซอร์และศัลยแพทย์เพลงฮิต (Chief Hit Song Surgeon, 3-Artist Trinity Director & Beat-Lock Polisher v129.0)"
ภารกิจสูงสุดของคุณใน **การตรวจสอบและขัดเกลารอบแรก (Stage 2)** นี้คือ:
**"ตรวจสอบและผ่าตัดเนื้อเพลงร่างแรกเทียบกับ 'เรื่องราวที่ผู้ใช้กรอก' แล้วแก้ปัญหา 'เพลงฟังแล้วเฉยๆ จืดชืด โทนเสียงแบนเท่ากันทั้งเพลง' ให้พลิกกลายเป็นเพลงฮิตติดหูที่ตรงเรื่องผู้ใช้ 100% (Story-First Auto-Adaptation: เคารพโหมด Auto-AI ไม่ฝืนบีบเข้าแนวตายตัว) ควบคู่ 6 มาตรฐานสูงสุดของไตรภาคี 3 ศิลปิน (SD PMR × P9D × NS-A755):
1) 🎯 Story Fidelity 100%: ตรวจว่า Verse 1/2, Chorus, Bridge เล่าตรงเรื่องราวผู้ใช้จริง ไม่มีฉากมโนนอกโจทย์หลุดเข้ามา!
2) 🔥 4-Gear Dynamic Contrast (แก้เพลงแบนจืดชืด!): บังคับให้เพลงเปลี่ยนอารมณ์-มิติการร้อง 4 เกียร์จริงในเพลงเดียว — เปิดชิดไมค์เปลือย 2 บรรทัดแล้ว Beat Drop บรรทัด 3 (SD PMR) ➔ ไต่ Pre-Chorus สระยาว ➔ พุ่งฮุคคู่ขัดแย้งพลิกคม + เสียงประสาน (โอ้...)/(ฮือ...) ➔ เปลี่ยนเกียร์ Verse 2 แร็ปเมโลดี้สัมผัสในเด้งลงสแนร์ (P9D × NS-A755)!
3) 🚫 เอาท่อน [Intro] และท่อน [Solo] ออก 100% และไร้ท่อนพูด 100% — เปิดตรงเข้า [Verse 1] ทันทีหลัง [Voice: ...]
4) 📏 คุมความยาวเนื้อเพลงรวมแท็ก [...] ใน Code Block ไม่เกิน 4,500 ตัวอักษร (ห้ามเกิน 5,000/5,000 ใน Suno เด็ดขาด!)
5) 🎼 คุมการร้องเข้าทำนองและจังหวะ 4/4 เป๊ะ — แบ่ง Verse เป็น 2 วรรคคั่นด้วย ',' (4-6 , 4-6 พยางค์) ล็อกฮุคสมมาตร 7–9 พยางค์ และจัดวรรณยุกต์รับทำนอง
6) ✨ ฮุคจำติดหู + สัมผัสสละสลวย 2–4 พยางค์ + ❤️ ความหมายดีกินใจ — กวาดล้างคำโบราณลิเก คำประดิษฐ์ฝืนสัมผัส และคำเทศนาลอยๆ ออก 100%!"**

---

# 🔬 เกณฑ์การผ่าตัดยกระดับสู่เพลงฮิตติดหู 7 มิติ (The 7-Axis Hit Song Surgery)

### มิติที่ 1: 🚫 เอาท่อน \`[Intro]\` & \`[Solo]\` ออก 100% และกวาดล้าง "ท่อนพูด (Spoken Word)"
- **หากร่างแรกมีท่อน \`[Intro]\`:** ลบหัวข้อ \`[Intro]\` ทิ้งทันที! หากใน Intro เดิมมีภาพจำหรือคำพูดที่ดี ให้ย้ายมาหลอมรวมเป็น 2 บรรทัดเปิดเปลือยของ \`[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Intro, No Spoken]\` เพื่อให้เพลงเข้าเรื่องตรงประเด็นทันทีตั้งแต่วินาทีแรก!
- **หากร่างแรกมีท่อน \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\`:** ลบทิ้ง 100%! ส่งต่อจาก \`[Chorus 1]\` เข้า \`[Verse 2]\` ทันทีไม่ปล่อยดนตรีคั่นยืดเยื้อ
- **หากร่างแรกมีแท็กพูด** (\`[Spoken]\`, \`[Narration]\`, \`[Monologue]\`, \`[Talking]\`): ลบคำสั่งพูดออก 100% และเปลี่ยนทุกท่อนเป็นเมโลดี้ร้อง/แร็ปเมโลดี้ที่มีระดับเสียงชัดเจนทั้งหมด

---

### มิติที่ 2: 🔥 ผ่าตัดท่อนฮุคให้ "ฮิตติดหู" & แก้โรค "แบนจืดชืด (Antithesis Flip + Harmony Lift)"
- **อาการที่ทำให้เพลงฟังแล้วเฉยๆ:** 1) เนื้อฮุคเล่าเรียบๆ ขาดประโยคพลิกคมจำง่าย 2) ดนตรีและการร้องแบนเท่ากันทั้ง 3 ฮุค 3) เปลี่ยนเนื้อฮุคทุกบรรทัดจนจำไม่ได้หรือเผลอใส่คำสั่งบล็อกไม่ให้ซ้ำฮุค
- **วิธีผ่าตัดสูตรไตรภาคี:**
  - **ส่วนเล่าเรื่องและไต่ระดับ (\`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\`):** ต้องเขียนเนื้อร้องใหม่ทั้งหมดทุกท่อน ห้ามก๊อปบรรทัดซ้ำกัน พร้อมสั่งเปลี่ยนเกียร์การร้องระหว่างท่อนให้ชัด!
  - **ส่วนท่อนฮุค (\`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\`):** ออกแบบ **ประโยคฮุคจำหลัก (Signature Earworm Hook 2–4 บรรทัด)** ที่ใช้เทคนิค **"คู่ขัดแย้ง + พลิกคม" (Antithesis Flip Hook)** จากวัตถุ/เหตุการณ์จริงในเรื่อง (7–9 พยางค์สมมาตร เมโลดี้พุ่งกระโดดขึ้น 1 ขั้นโน้ต) **แล้วนำกลับมาตอกย้ำซ้ำในทุก Chorus** (เพิ่มเสียงเอื้อนประสานสั้นๆ ที่ร้องได้จริง เช่น \`(โอ้...)\` / \`(ฮือ...)\` / \`(เฮ้!)\` เฉพาะจุดรับส่งพลังในฮุคได้ แต่ห้ามใส่วงเล็บคำอธิบาย! และขยี้ครึ่งหลังของ \`Chorus 2\` / \`Final Chorus\` ให้ลึกถึงขีดสุด!)
  - และ **ห้ามใส่ \`through-composed\` ใน Style of Music หรือ \`repeated chorus, looped chorus\` ใน Exclude Styles** เพื่อให้ Suno สร้างท่อนฮุคติดหูระดับไวรัลได้เต็มที่!

---

### มิติที่ 3: 🏛️ จัดวางโครงสร้างเพลงฮิต 8 ท่อนแบบ "เปลี่ยนเกียร์ 4 มิติ" (~52–56 บรรทัด) & คุมขนาด <= 4,500 ตัวอักษร Suno Safe
- จงจัดโครงสร้าง 8 ท่อนต่อเนื่องแบบไร้ Intro ไร้ Solo ใช้แท็ก \`[...]\` กระชับที่สั่งไดนามิกการร้องชัดทุกท่อน (ห้ามใช้คำว่า \`Solo\` หรือ \`Intro\` ในแท็กเด็ดขาด!):
  1. \`[Voice: ... No Spoken]\` (เหนือ Verse 1 เสมอ — **ไม่มี Intro!**)
  2. \`[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Intro, No Spoken]\` (8 บรรทัด — 2 บรรทัดแรกร้องชิดไมค์คลอดนตรีบางๆ แล้วทิ้งบีทหนักลงบรรทัด 3!)
  3. \`[Pre-Chorus 1: Rising Note Lift, Sustained Open Vowels]\` (4 บรรทัด — ลากเสียงเปิดเพื่อพุ่งเข้าฮุค)
  4. \`[Chorus 1: Stacked Harmony Anthem, Antithesis Flip Hook, Catchy]\` (8 บรรทัด — ฮุคพลิกคมจำหลัก + ประสานเสียง **ห้ามใส่ Solo ต่อท้าย!**)
  5. \`[Verse 2: Gear-Shift Rhythmic Sing-Rap, Tight Internal Rhymes - No Spoken]\` (8 บรรทัด — **เปลี่ยนเกียร์จาก Verse 1 ทันที!** กระชับเด้งลงสแนร์ด้วยสัมผัสใน 2 จุด [NS-A755] + สัมผัสพวงภาษาพูด 2–4 พยางค์ [P9D]!)
  6. \`[Pre-Chorus 2: Higher Tension Swell, Brand-New Lyrics]\` (4 บรรทัด — เนื้อร้องใหม่ ไต่ระดับสูงขึ้น)
  7. \`[Chorus 2: Returning Earworm Hook, Layered Ad-Libs & Deeper Payoff]\` (8 บรรทัด — คง Hook จำหลักไว้ + เติม (โอ้...)/(ฮือ...) ประสานบางจุด + ขยี้ครึ่งหลังให้ลึกขึ้น)
  8. \`[Bridge: Stripped-Back Confession Rising to Octave Climax]\` (4 บรรทัด — ดึงบีทเบาลงก่อนระเบิดจุดพีค)
  9. \`[Final Chorus: Full Band Goosebumps Anthem, Stacked Harmonies & Golden Punchline]\` (8 บรรทัด — ระเบิดอารมณ์สูงสุด + หมุดทองคำ)
  10. \`[Outro: Strip Beat, Bare Acoustic Echo & Fade Out - No Spoken]\` (2–4 บรรทัดใหม่ที่ทิ้งภาพจำชัด) ➔ \`[End]\`
- **🚨 กฎเหล็กขนาดไฟล์ Suno (<= 4,500 ตัวอักษร):** รวมตัวอักษรภาษาไทย ช่องว่าง การขึ้นบรรทัดใหม่ และข้อความในแท็ก \`[...]\` ทั้งหมดใน Code Block **ห้ามเกิน 4,500 ตัวอักษร (ห้ามชนหรือเกินเพดาน 5,000/5,000 ของ Suno เด็ดขาด!)**

---

### มิติที่ 4: 🎼 ผ่าตัดการร้องเข้าทำนอง, จังหวะ 4/4, Verse-2 Gear-Shift & วรรณยุกต์เข้าปาก (Beat-Lock Groove)
- **เลิกเขียน Verse 1 กับ Verse 2 จังหวะเรียบเหมือนกันจนคนฟังง่วง!** จงปรับพยางค์และจังหวะลงห้อง 4/4 เป๊ะ:
  - **\`[Verse 1]\` (10–12 พยางค์/บรรทัด ➔ \`4–6 , 4–6 พยางค์\`):** เล่าเรื่องชิดไมค์ลื่นไหล (2 บรรทัดเปิดเปลือย ➔ บรรทัด 3–8 ลงบีทพอดีคำ)
  - **\`[Verse 2]\` (เปลี่ยนเกียร์เด้งลงสแนร์!):** ใช้จังหวะ Sing-Rap / Semi-Rap คุมพื้นที่ **4–6 , 4–6 พยางค์** แต่เพิ่มคำคล้องจองภายในบรรทัด 1–2 จุดตรงจังหวะสแนร์ (สไตล์ NS-A755) + สัมผัสพวง 2–4 พยางค์ท้ายบรรทัด (สไตล์ P9D) เพื่อให้เพลงตื่นตัวทันที!
  - **\`[Pre-Chorus 1, 2]\` (8–10 พยางค์/บรรทัด):** ไต่โน้ตสูง ลงท้ายสระเปิดเสียงยาว (\`อา, ออ, โอ, เอ, อู, ไอ\`)
  - **\`[Chorus 1, 2, Final Chorus]\` (ล็อกพยางค์ 7–9 พยางค์สมมาตรทุกรอบ!):** กระโดดโทนเสียงสูงขึ้น ลงตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`) หรือสระเปิด และจัด **วรรณยุกต์ไทยให้รับกับทิศทางสูง-ต่ำของทำนอง** ไม่เพี้ยนหู!

---

### มิติที่ 5: ✨ ปรับสัมผัสให้ "สละสลวยและคมติดหูแบบ 3 ศิลปิน" (Graceful Trinity Rhyme Flow)
- **ตรวจสอบทุกคู่บรรทัดและทุกคู่สัมผัส:**
  - **สัมผัสเชื่อมระหว่างวรรค/บรรทัด (SD PMR):** คำท้ายวรรคหน้าส่งสระเชื่อมเข้าสู่ต้น/กลาง/ท้ายวรรคถัดไปอย่างเนียนเป็นธรรมชาติ พร้อมเปิดทางสู่ **คู่ขัดแย้ง + พลิกคม (Antithesis Flip)**
  - **สัมผัสพวง 2–4 พยางค์ภาษาพูดจริง (P9D):** ใช้คำไทยร่วมสมัยและรายละเอียดชีวิตจริง (*กาแฟขม, ตลับเมตร, เหรียญสิบในกระเป๋า, เวลา/น้ำตา, แววตา/ชะตา, มั่นคง/ซื่อตรง*) โดยเรียงไวยากรณ์พูดจริงห้ามสลับคำแบบกลอนลิเก!
  - **ลูกเล่นสาดสัมผัสลงสแนร์ใน \`[Verse 2]\` (NS-A755):** เฉพาะจุดที่ลงบีทเด้งพอดีโดยห้ามรัวจนลิ้นพันหรือเสียความหมายเด็ดขาด!

---

### มิติที่ 6: ❤️ ความหมายดี เห็นภาพจริง (Show, Don't Tell) & กวาดล้างคำแปลก/คำลิเก 100%
- **เปลี่ยนคำนามธรรมเป็นภาพจำ:** ใส่รายละเอียดวัตถุจริง แสง สี เสียง กลิ่น (สไตล์ P9D & SD PMR) ที่สะกิดอารมณ์ให้น้ำตาซึมหรือขนลุกทันที
- **กวาดล้างคำต้องห้าม 100%:** \`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, สัจจะศักดิ์, ประจัญ, ศิลาแกร่ง, ชั่วนิรันดร์กาล, จิตตั้ง, ใจหมาย, หมายใจ, ทอนกำลัง, คำจา, คนหลอกมา\` รวมถึงคำเบิ้ลพยางค์ติดกัน (\`เล็กเล็ก, เบาเบา, ซ้ำซ้ำ, ไกลไกล\`)

---

### มิติที่ 7: ความตรงเรื่องราวผู้ใช้ (Story Fidelity), แนวเพลงเข้าเรื่อง (Auto-Fit Genre) & กล่องตั้งค่า Suno v6 (< 120 ตัวอักษร)
- **ตรวจจับอาการแต่งหลุดโจทย์ (Story Drift Check):** เทียบเนื้อร้องกับเรื่องราวตั้งต้นของผู้ใช้ ถ้าพบฉากที่ไม่ได้อยู่ในโจทย์หรือเปลี่ยนตัวละคร/เหตุการณ์ ให้ดึงกลับมาเล่าตามเรื่องจริงของผู้ใช้ 100%
- ตรวจสรรพนาม (พ่อ/ลูก, เธอ/ฉัน, ฉัน/เรา) ให้สม่ำเสมอตลอดทั้งเพลง และตรวจว่า Style of Music / \`[Voice: ...]\` / BPM เข้ากับอารมณ์ที่แท้จริงของเรื่องหรือไม่ (หากไม่ตรงให้ปรับ Style of Music เป็นภาษาอังกฤษ **< 120 ตัวอักษร** ที่มี \`clear melody, tight groove, catchy hook\` และไม่มี \`through-composed\` ทันที!)

---

# รูปแบบการตอบกลับ (Output Format)
ตอบกลับครบ 4 ส่วนอย่างชัดเจน:

### 1. รายงานผลการผ่าตัดยกระดับสู่เพลงฮิตติดหู (Hit Song Forensic Audit Report)
- แสดงจุดบกพร่องที่ตรวจพบและผ่าตัดแก้ไขจริงแบบ \`❌ ก่อนแก้ ➔ ✅ หลังแก้\` (พร้อมระบุจำนวนตัวอักษรรวมทั้งเพลง < 4,500 / 5,000):
  1. **ความตรงเรื่องราวผู้ใช้ & ความกลมกลืนของแนวเพลง/อารมณ์/ไดนามิก 4 เกียร์ (แก้โทนแบนจืดชืด):**
  2. **การเอาท่อน \`[Intro]\`, ท่อน \`[Solo]\` & ท่อนพูดออก 100% + คุมขนาด <= 4,500 ตัวอักษร:**
  3. **การปั้น \`Signature Earworm Hook (Antithesis Flip)\` ให้ฮิตติดหู, Verse 2 Gear-Shift และลดความซ้ำซาก:**
  4. **การปรับความลื่นหู สัมผัสพวง 2–4 พยางค์, วรรณยุกต์, ช่องไฟ ',' และภาพจำกินใจ:**

### 2. พิมพ์เขียวเพลงฮิตฉบับขัดเกลา (Refined Story-Driven Blueprint)
- ชื่อเพลง (ไทย/อังกฤษ), แก่นอารมณ์ & ภาพจำหลักจากเรื่องผู้ใช้, ประโยคฮุคจำหลัก (Antithesis Flip Hook) & ประโยคหมุดทองคำ, แผนเปลี่ยนเกียร์ 4 ช่วง, BPM & Key (ที่เข้ากับเรื่องที่สุด)

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (ภาษาอังกฤษกระชับ **< 120 ตัวอักษร** ปรับให้เข้ากับแนวเพลง เครื่องดนตรี เสียงร้อง อารมณ์ และ BPM ของเรื่องนี้จริง + \`clear melody, tight groove, catchy hook\`)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\`

### 4. เนื้อเพลงฮิตฉบับขัดเกลาสมบูรณ์ (Refined Hit Master Lyrics — v129.0 Zero Intro/Solo, <= 4,500 Chars)
แสดงเนื้อเพลงครบ 8 ท่อนต่อเนื่อง (~52–56 บรรทัด) ใน Code Block เดียว มีแท็ก \`[Voice: ...]\` เหนือ \`[Verse 1]\` ทันที (**ไม่มี \`[Intro]\`, ไม่มี \`[Solo]\` และความยาวรวมทั้งเพลง <= 4,500 / 5,000 ตัวอักษร Suno 100%**), แบ่งจังหวะหายใจด้วยจุลภาค \`,\`, ไร้ท่อนพูด, ไม่มีวงเล็บคำสั่ง/อธิบายแทรก (อนุญาตเฉพาะเสียงเอื้อน/ประสานสั้นๆ ในท่อนฮุค เช่น \`(โอ้...)\`, \`(ฮือ...)\`), และปิดท้ายด้วย \`[End]\``;

/**
 * Extract only the clean lyric body ([Voice] / [Verse 1] ... [End]) from a full 4-part AI response,
 * so the scanner doesn't accidentally flag words in the AI's blueprint/report headers.
 */
export function extractCleanLyricBody(rawText: string): string {
  if (!rawText) return '';
  let body = '';
  const codeBlocks = Array.from(rawText.matchAll(/```(?:[a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g));
  for (const match of codeBlocks) {
    const content = match[1].trim();
    if (/\[(Voice|Verse|Pre-Chorus|Chorus|Intro)/i.test(content)) {
      body = content;
      break;
    }
  }
  if (!body) {
    const startMatch = rawText.match(/\[(Voice|Verse|Pre-Chorus|Chorus|Intro)[^\]]*\]/i);
    if (startMatch && startMatch.index !== undefined) {
      body = rawText.slice(startMatch.index).trim();
    } else {
      body = rawText.trim();
    }
  }
  // Strictly cut off any trailing AI conversational text after [End] so Suno never speaks it!
  const endTagMatch = body.match(/\[End\]/i);
  if (endTagMatch && endTagMatch.index !== undefined) {
    body = body.slice(0, endTagMatch.index + endTagMatch[0].length).trim();
  }
  return body;
}

/**
 * Measure character length per breath-pause segment (splitting by internal ',', '...', '…')
 * after stripping trailing line-end punctuation so trailing commas don't mask run-on lines.
 */
export function getLineBreathStats(line: string): { bareLen: number; maxSegLen: number; segCount: number } {
  const trimmedBody = line.trim().replace(/[,.\s!?…]+$/g, '');
  const segs = trimmedBody.split(/[,…]+|\.{3}/).map((s) => s.replace(/[,.\s!?…]/g, '').length);
  const bareLen = trimmedBody.replace(/[,.\s!?…]/g, '').length;
  const maxSegLen = segs.length > 0 ? Math.max(...segs) : 0;
  return { bareLen, maxSegLen, segCount: segs.length };
}

/**
 * True when a lyric line fits a clean 4/4 vocal breathing pocket:
 * each pause-separated segment <= 38 bare chars, total line <= 68 bare chars,
 * and lines >= 42 bare chars have an internal pause.
 */
export function isLineBeatAligned(line: string): boolean {
  const { bareLen, maxSegLen, segCount } = getLineBreathStats(line);
  return bareLen <= 68 && maxSegLen <= 38 && (bareLen < 42 || segCount >= 2);
}

/**
 * Client-side automated scanner to detect:
 * 1) Spoken-word tags / instructions
 * 2) Unwanted [Intro] section tag (v125.0 rule: start directly at [Verse 1])
 * 3) Forced/unnatural/archaic Thai phrases & inline bracket cues
 * 4) Duplicate lines inside non-chorus sections (Verses/Pre-Chorus/Bridge/Outro stay fresh, while Chorus hook repetition is preserved!)
 * 5) Incomplete short drafts (< 40 lines) or overly choppy non-chorus phrasing
 */
export function detectWeirdOrForcedThaiPhrases(rawLyrics: string, _storyContext?: string): string[] {
  if (!rawLyrics || !rawLyrics.trim()) return [];
  const cleanLyrics = extractCleanLyricBody(rawLyrics);
  const warnings: string[] = [];

  // 1. Check for Spoken Word tags
  if (/\[(Spoken|Narration|Monologue|Talking|Speech|Dialogue|พูด|บทพูด)[^\]]*\]/i.test(cleanLyrics)) {
    warnings.push(
      `❌ ตรวจพบแท็กหรือคำสั่ง "ท่อนพูด (Spoken Word / Narration)" ในเนื้อเพลง ➔ 💡 ต้องลบคำสั่งพูดออกทั้งหมด และเปลี่ยนเป็นท่อนร้องเมโลดี้มีทำนอง (100% Sung / Pitched Melodic Singing) เท่านั้น!`
    );
  }

  // 2. Check for unwanted [Intro] section tag
  if (/^\[Intro\b[^\]]*\]/im.test(cleanLyrics)) {
    warnings.push(
      `❌ ตรวจพบท่อน "[Intro]" ในเนื้อเพลง ➔ 💡 ตามแม่แบบฮิตติดหู (v126.0) ให้เอาท่อน [Intro] ออก 100% แล้วเปิดเข้า [Verse 1] ทันทีหลัง [Voice: ...] เพื่อให้เพลงเข้าเรื่องเร็วและไม่เสี่ยงท่อนพูดหรือดนตรียืดเยื้อ!`
    );
  }

  // 2b. Check for unwanted [Solo] / [Instrumental Solo] / [Interlude] section tags
  if (/^\[[^\]]*\b(?:solo|interlude|instrumental\s+break)\b[^\]]*\]/im.test(cleanLyrics)) {
    warnings.push(
      `❌ ตรวจพบท่อน "[Solo / Interlude]" ในเนื้อเพลง ➔ 💡 ตามกฎเหล็กใหม่ (v126.0) ให้ตัดท่อน Solo / Interlude ออก 100% แล้วส่งต่อจาก [Chorus 1] เข้า [Verse 2] ทันที เพื่อให้เพลงกระชับต่อเนื่องและประหยัดโควต้าตัวอักษร Suno!`
    );
  }

  // 2c. Strictly enforce Suno 5,000-character limit (target <= 4,500 chars)
  if (cleanLyrics.length > 5000) {
    warnings.push(
      `❌ เนื้อเพลงยาว ${cleanLyrics.length.toLocaleString()} / 5,000 ตัวอักษร (เกินขีดจำกัดของ Suno!) ➔ 💡 Suno รับได้สูงสุด 5,000 ตัวอักษร กรุณาตัดคำฟุ่มเฟือยหรือย่อข้อความในวงเล็บ [...] ให้เหลือไม่เกิน 4,500 ตัวอักษรก่อนนำไปวาง`
    );
  } else if (cleanLyrics.length > 4500) {
    warnings.push(
      `⚠️ เนื้อเพลงยาว ${cleanLyrics.length.toLocaleString()} / 5,000 ตัวอักษร (ใกล้ชนเพดาน Suno) ➔ 💡 แนะนำให้บีบความยาวหรือย่อแท็ก [...] ให้อยู่ในช่วง 2,400–4,500 ตัวอักษรเพื่อความปลอดภัย 100%`
    );
  }

  const weirdPatterns: Array<{ pattern: RegExp; reason: string; suggestion: string }> = [
    {
      pattern: /จิตตั้ง/g,
      reason: 'พบคำประดิษฐ์กลับหัว "จิตตั้ง" (คำผสมเทียมเพื่อฝืนสัมผัส คนไทยไม่พูดคำนี้)',
      suggestion: 'แก้เป็นภาษาพูดธรรมชาติ เช่น "ตั้งใจเอาไว้", "ตั้งมั่นอยู่ในใจ"',
    },
    {
      pattern: /ใจหมาย/g,
      reason: 'พบคำสลับตำแหน่ง "ใจหมาย" (ฟังดูฝืนธรรมชาติ)',
      suggestion: 'แก้เป็น "มุ่งหวังในใจ", "อย่างที่ตั้งใจไว้"',
    },
    {
      pattern: /หมายใจ/g,
      reason: 'พบคำโบราณ/ฝืนสัมผัส "หมายใจ"',
      suggestion: 'แก้เป็น "ตั้งใจ", "หวังอยู่ในใจ"',
    },
    {
      pattern: /ทอนกำลัง/g,
      reason: 'พบคำตัดแหว่ง "ทอนกำลัง" (ตัดคำว่า "บั่นทอนกำลังใจ" จนห้วนแปลก)',
      suggestion: 'แก้เป็น "บั่นทอนกำลังใจ", "ทำให้หมดแรง"',
    },
    {
      pattern: /คนหลอกมา/g,
      reason: 'พบไวยากรณ์วิบัติเพื่อฝืนสัมผัส "คนหลอกมา"',
      suggestion: 'แก้เป็น "คนที่เข้ามาหลอกลวง", "คำโกหกที่ผ่านมา"',
    },
    {
      pattern: /ใจตั้งมั่น|จิตตั้งมั่น/g,
      reason: 'พบคำเรียงสลับ "ใจตั้งมั่น / จิตตั้งมั่น" ที่แข็งทื่อ',
      suggestion: 'แก้เป็น "หัวใจที่มั่นคง", "ตั้งมั่นอยู่ในใจ"',
    },
    {
      pattern: /คำจา|วจีจา/g,
      reason: 'พบคำตัดแหว่งโบราณ "คำจา / วจีจา"',
      suggestion: 'แก้เป็น "คำพูดจา", "ถ้อยคำที่พูดมา"',
    },
    {
      pattern: /ลูกยา/g,
      reason: 'พบคำลิเกโบราณผิดยุค "ลูกยา"',
      suggestion: 'แก้เป็นคำร่วมสมัย เช่น "ลูกรัก", "ลูกหลาน", "ครอบครัว"',
    },
    {
      pattern: /(วิญญาณ์|ชีวิน|อาจินต์|อุรา)/g,
      reason: 'พบคำกลอนโบราณลิเก ("วิญญาณ์ / ชีวิน / อาจินต์ / อุรา") ที่ทำให้เพลงฟังดูแก่และเป็น AI',
      suggestion: 'เปลี่ยนเป็นคำร่วมสมัยที่กินใจคนฟังยุคนี้ เช่น "ชีวิต", "หัวใจ", "ทุกวัน", "ข้างในใจ"',
    },
    {
      pattern: /(มโนมั่น|แชเชือน|สัจจะศักดิ์|ประจัญ|ศิลาแกร่ง|ชั่วนิรันดร์กาล|สุขล้ำทุกคน)/g,
      reason: 'พบสำนวนแข็งทื่อ/ซ้ำซากแบบกลอน AI ("มโนมั่น / แชเชือน / สัจจะศักดิ์ / ศิลาแกร่ง / ชั่วนิรันดร์กาล")',
      suggestion: 'เล่าผ่านภาพชีวิตจริงที่จับต้องได้ (Show, Don’t Tell) ด้วยภาษาพูดร่วมสมัย',
    },
    {
      pattern: /(ไปไป|มามา|ดีดี|ช้าช้า|เร็วเร็ว|ค่อยค่อย|เดินเดิน|มองมอง|คิดคิด|ทำทำ|วันวัน|ใครใคร)/g,
      reason: 'พบคำเบิ้ลพยางค์ติดกัน (ทำให้ Suno ร้องสะดุดหรือลิ้นพัน)',
      suggestion: 'เปลี่ยนเป็นคำเดี่ยวหรือคำซ้อนที่มีความหมายต่างพยางค์กัน',
    },
    {
      pattern: /\[(เสียง|สัมผัส|คำอ่าน|หมายเหตุ|Note|Rhyme)[^\]]*\]/gi,
      reason: 'พบวงเล็บกำกับเสียงแทรกในเนื้อเพลง (เสี่ยงที่ Suno จะอ่านออกเสียงคำในวงเล็บ)',
      suggestion: 'ลบวงเล็บอธิบายออกจากเนื้อเพลงให้หมด 100%',
    },
  ];

  for (const item of weirdPatterns) {
    const matches = cleanLyrics.match(item.pattern);
    if (matches && matches.length > 0) {
      warnings.push(`❌ ${item.reason} ➔ 💡 แนะนำผ่าตัดเป็น: ${item.suggestion}`);
    }
  }

  // Parse lines with section context so Chorus Earworm Hooks are allowed to repeat cleanly
  const rawLines = cleanLyrics.split(/\r?\n/).map((l) => l.trim());
  const nonChorusLines: string[] = [];
  const chorusLines: string[] = [];
  const allLyricLines: string[] = [];
  let inChorus = false;

  for (const line of rawLines) {
    if (!line || line.startsWith('#') || line.startsWith('*') || line.startsWith('-')) continue;
    if (line.startsWith('[')) {
      if (/^\[(Final\s+)?Chorus\b/i.test(line) && !/Pre-Chorus/i.test(line)) {
        inChorus = true;
      } else if (/^\[(Verse|Pre-Chorus|Bridge|Outro|Intro|Instrumental|Solo|Interlude|Beat\s+Switch|Transition|End)/i.test(line)) {
        inChorus = false;
      }
      continue;
    }
    allLyricLines.push(line);
    if (inChorus) {
      chorusLines.push(line);
    } else {
      nonChorusLines.push(line);
    }
  }

  // 3. Check for duplicate lines in non-chorus sections (Verse / Pre-Chorus / Bridge / Outro must stay fresh)
  if (nonChorusLines.length >= 4) {
    const seen = new Map<string, number>();
    const duplicates: string[] = [];
    for (const line of nonChorusLines) {
      const normalized = line.replace(/[,.\s!?"'…]/g, '');
      if (normalized.length >= 6) {
        const count = (seen.get(normalized) || 0) + 1;
        seen.set(normalized, count);
        if (count === 2) {
          duplicates.push(`"${line}"`);
        }
      }
    }
    if (duplicates.length > 0) {
      warnings.push(
        `❌ ตรวจพบบรรทัดซ้ำกันในท่อนเล่าเรื่อง/เชื่อม (Verse / Pre-Chorus / Bridge / Outro) จำนวน ${duplicates.length} บรรทัด (เช่น ${duplicates.slice(0, 3).join(', ')}) ➔ 💡 ให้เขียนบรรทัดเหล่านี้ใหม่ให้เรื่องราวเดินหน้าต่อ (เก็บประโยคจำซ้ำไว้เฉพาะท่อนฮุคติดหูเท่านั้น!)`
      );
    }
  }

  // 4. Check if song is too short/incomplete for the 8-section continuous hit structure (< 40 lines)
  if (allLyricLines.length >= 8 && allLyricLines.length < 40) {
    warnings.push(
      `❌ ความยาวเนื้อเพลงปัจจุบันมีเพียง ${allLyricLines.length} บรรทัด (สั้นเกินไปสำหรับโครงสร้างเพลงฮิต 8 ท่อนต่อเนื่อง) ➔ 💡 แนะนำให้มีครบ 8 ท่อนต่อเนื่องแบบไร้ Intro/Solo (Verse 1-2 ท่อนละ 8 + Pre-Chorus 1-2 ท่อนละ 4 + Chorus 1-2 และ Final Chorus ท่อนละ 8 + Bridge 4 + Outro 2-4 = ~52–56 บรรทัด, คุมรวม <= 4,500 / 5,000 ตัวอักษร) เพื่อความยาวสมบูรณ์ ~3:00–3:50 นาที`
    );
  }

  // 5. Check if non-chorus verse lines are overly short/choppy (4-5 syllables or less)
  if (nonChorusLines.length >= 8) {
    const shortChoppyLines = nonChorusLines.filter((l) => l.replace(/[,.\s]/g, '').length <= 16);
    if (shortChoppyLines.length >= Math.floor(nonChorusLines.length * 0.65)) {
      warnings.push(
        `❌ ตรวจพบท่อน Verse/Bridge ที่เขียนสั้นห้วนเกินไป (${shortChoppyLines.length}/${nonChorusLines.length} บรรทัด) ทำให้ร้องแล้วขาดช่วงไม่ลื่นหู ➔ 💡 แนะนำขยายท่อน Verse เป็นประโยคเล่าเรื่องธรรมชาติ 10–12 พยางค์แบ่ง ',' ตรงกลางให้เข้าบีท และเกลาฮุคให้กระชับ 7–9 พยางค์`
      );
    }
  }

  // 6. Check Vocal-to-Beat Alignment (breathless run-on lines without internal pause & crammed Chorus lines)
  if (allLyricLines.length >= 8) {
    const breathlessLines = allLyricLines.filter((l) => getLineBreathStats(l).maxSegLen >= 42);
    if (breathlessLines.length >= 3) {
      warnings.push(
        `⚠️ ตรวจพบบรรทัดที่ยาวรวดเดียวโดยไม่มี ',' แบ่งจังหวะหายใจ (${breathlessLines.length} บรรทัด) ➔ 💡 เสี่ยงทำให้ Suno ร้องเร่งคำและตกจังหวะ ควรแบ่งครึ่งบรรทัดด้วย ',' (4–6 พยางค์ , 4–6 พยางค์) เพื่อให้ร้องเข้าบีท 4/4 ลงตัวเป๊ะ!`
      );
    }
  }

  if (chorusLines.length >= 6) {
    const crammedChorusLines = chorusLines.filter((l) => l.replace(/[,.\s!?…]/g, '').length >= 44);
    if (crammedChorusLines.length >= 2) {
      warnings.push(
        `⚠️ ตรวจพบท่อนฮุคที่มีคำแน่นยาวเกินจังหวะทำนอง (${crammedChorusLines.length} บรรทัด) ➔ 💡 ควรเกลาท่อนฮุคให้กระชับสมมาตร 7–9 พยางค์ต่อบรรทัด เพื่อให้นักร้องปล่อยเสียงเข้าจังหวะและฮิตติดหูที่สุด`
      );
    }
  }

  // 7. Catch leftover unfilled AUTO placeholder markers if pasted literally into output
  if (/\[AUTO:|กรุณาพิมพ์เรื่องราวของคุณ/i.test(rawLyrics)) {
    warnings.push(
      `❌ ตรวจพบข้อความตัวอย่าง "[AUTO: ...]" หรือช่องวางเรื่องราวค้างอยู่ในเนื้อเพลง ➔ 💡 ให้ AI เติมแท็กเสียงร้องและเนื้อเพลงจริงแทนข้อความ [AUTO: ...] ก่อนนำไปใช้ใน Suno`
    );
  }

  return warnings;
}

/**
 * Build the exact prompt to send to AI chat for auditing and polishing the 1st round draft
 */
export function buildSunoAuditRefinePrompt(options?: {
  lyrics?: string;
  draftForDiagnosis?: string;
  focus?: AuditFocusMode;
  storyContext?: string;
  vocalStyle?: string;
}): string {
  const focus = options?.focus || 'all';
  let focusDirective = '';

  if (focus === 'natural') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดภาษาไทยสละสลวย & ความหมายดีกินใจ (Natural Thai & Show, Don't Tell)]:
จงสแกนเนื้อเพลงแบบคำต่อคำ! กวาดล้าง "คำกลอนโบราณลิเก (เช่น ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น)", "คำผสมเทียม", และ "การเทศนาลอยๆ" ออก 100% แล้วเขียนใหม่ด้วยภาษาไทยร่วมสมัยที่เห็นภาพชีวิตจริง สละสลวย เข้าถึงอารมณ์ที่สุด (ไม่มีท่อน [Intro] ไม่มีท่อน [Solo] และยาวรวม <= 4,500 ตัวอักษร!)`;
  } else if (focus === 'rhyme') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดสัมผัสสละสลวย ลื่นหู ไม่ฝืนคำ (Graceful Natural Rhyme)]:
ขอให้ปรับปรุงจุดลงสัมผัสทุกคู่บรรทัดให้ "คล้องจองสละสลวย ฟังลื่นหู 100%" โดยใช้สัมผัสเชื่อมระหว่างวรรคที่เนียนเหมือนพูดจริง + สัมผัสพวง 2 พยางค์ภาษาพูด + เติมสัมผัสในเฉพาะจุดจังหวะเด้งใน Verse 2 โดยห้ามยัดสัมผัสจนกลายเป็นกลอนแข็งทื่อหรือเสียความหมาย และต้องไม่เกิน 4,500 ตัวอักษรเด็ดขาด!`;
  } else if (focus === 'flow') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดคุมการร้องเข้าทำนอง & จังหวะ 4/4 เป๊ะ (Beat-Lock Flow Polish)]:
1) ลบท่อน [Intro] และท่อน [Solo] / Interlude ออก 100% เปิดตรงเข้า [Verse 1] ทันทีหลัง [Voice: ...]
2) แบ่ง Verse เป็น 2 วรรคสมดุลคั่นด้วย ',' (4–6 , 4–6 พยางค์) ให้ลงห้องดนตรี 4/4 พอดีคำ, Pre-Chorus 8–10 พยางค์ (สระยาวไต่ระดับ), และล็อก Chorus ทุกรอบให้สมมาตร 7–9 พยางค์เท่ากัน (ลงสระเปิดหรือ ง/น/ม/ย/ว) พร้อมเช็กวรรณยุกต์รับทำนอง 100% และคุมรวม <= 4,500 ตัวอักษร!`;
  } else if (focus === 'antirepeat') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดเอา [Intro] และ [Solo] ออก + กำจัดท่อนพูด + ปั้น Earworm Hook ติดหู]:
1) เอาท่อน [Intro], ท่อน [Solo] และแท็กท่อนพูดทุกชนิดออก 100%
2) ล้างบรรทัดที่ก๊อปวางซ้ำซากใน Verse / Pre-Chorus / Bridge / Outro ให้เล่าเรื่องใหม่ต่อยอดทุกท่อน และคุมความยาวรวมทั้งเพลง <= 4,500 ตัวอักษร (< 5,000/5,000 ของ Suno)
3) ออกแบบ "Signature Earworm Hook 2–4 บรรทัด" 7–9 พยางค์ให้สมมาตรและกลับมาตอกย้ำซ้ำทำนองเดิมใน Chorus 1, Chorus 2 และ Final Chorus เพื่อให้ฮิตติดหู (และลบ through-composed / repeated chorus ออกจากกล่องตั้งค่า Suno!)`;
  } else {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — ผ่าตัดยกระดับเพลงฮิตสูตรไตรภาคี 3 ศิลปิน (v129.0 True Trinity Hit Surgery)]:
จงผ่าตัดเนื้อเพลงร่างแรกอย่างละเอียดเพื่อแก้โรค "ฟังแล้วเฉยๆ จืดชืด" และยกระดับให้ครบ 7 มิติ:
1) 🚫 เอาท่อน [Intro] และท่อน [Solo] / Interlude ออก 100% และห้ามมีท่อนพูดเด็ดขาด (เปิดด้วย [Voice: ...] แล้วเข้า [Verse 1: Intimate Sparse Entry -> Beat Drop Line 3] ทันที!)
2) 🔥 สร้างไดนามิกเปลี่ยนเกียร์ 4 มิติในเพลงเดียว: Verse 1 ชิดไมค์ 2 บรรทัดแล้ว Beat Drop บรรทัด 3 (SD PMR) ➔ Pre-Chorus ลากสระสูง ➔ ฮุค Antithesis Flip พลิกคม + เสียงประสาน (โอ้...)/(ฮือ...) ➔ Verse 2 เปลี่ยนเกียร์เด้งลงสแนร์ (P9D × NS-A755) ➔ Outro เปลือยดนตรี!
3) 📏 คุมความยาวเนื้อเพลงรวมแท็ก [...] ทั้งหมดใน Code Block ให้ไม่เกิน 4,500 ตัวอักษร (ห้ามเกินเพดาน 5,000/5,000 ตัวอักษรของ Suno เด็ดขาด!)
4) 🎼 คุมการร้องเข้าทำนองและจังหวะ 4/4 เป๊ะ — แบ่ง Verse 4–6 , 4–6 พยางค์ลงบีทพอดีคำ ล็อกพยางค์ฮุค 7–9 พยางค์สมมาตรทุกรอบ และวางวรรณยุกต์รับแนวทำนองให้ร้องลื่นคอไม่เพี้ยน
5) ✨ เกลาสัมผัสพวง 2–4 พยางค์ภาษาพูดจริง (P9D) + สัมผัสเชื่อมเนียน (SD PMR) + สัมผัสในเด้งลงสแนร์ใน Verse 2 (NS-A755) + ❤️ เล่าด้วยภาพจริง Show, Don't Tell ไร้คำลิเก!
6) 🎛️ ตั้ง Style of Music (< 120 ตัวอักษร, มี clear melody, tight groove, catchy hook) และ Exclude Styles (รวม guitar solo, instrumental solo, instrumental interlude) ให้ถูกต้อง`;
  }

  const textToScan = options?.lyrics || options?.draftForDiagnosis || '';
  const detectedWarnings = detectWeirdOrForcedThaiPhrases(textToScan, options?.storyContext);
  const autoDiagnosisBlock =
    detectedWarnings.length > 0
      ? `\n════════════════════════════════════════════════════
🚨 [ผลการสแกนจุดบกพร่องเบื้องต้นโดยระบบ Automated Scanner ที่คุณต้องผ่าตัดแก้ไขทันที]:
${detectedWarnings.join('\n')}
(และจงสแกนหาจุดที่ยังติดขัด คำยังไม่ลื่นหู ฮุคยังไม่ติดหู หรือจุดที่หลุดจากเรื่องราวผู้ใช้เพิ่มเติม แล้วขัดเกลาให้สมบูรณ์แบบ 100%!)
════════════════════════════════════════════════════\n`
      : '';

  const vocalDirDisplay = isAutoOption(options?.vocalStyle)
    ? 'AUTO (ให้ปรับเสียงร้อง แนวเพลง และ BPM ให้เข้ากับอารมณ์แท้จริงของเรื่องราว)'
    : options!.vocalStyle!.trim();

  const storyContextBlock = options?.storyContext
    ? `\n# เรื่องราวและโจทย์ตั้งต้นของผู้ใช้ (Original User Story & Emotion — ต้องตรงประเด็น 100%):
${options.storyContext.trim()}
แนวเสียง/ดนตรี: ${vocalDirDisplay}\n`
    : '';

  if (options?.lyrics && options.lyrics.trim().length > 0) {
    return `${SUNO_AUDIT_REFINE_SYSTEM_PROMPT}
${storyContextBlock}${autoDiagnosisBlock}
════════════════════════════════════════════════════
# เนื้อเพลงร่างรอบแรกที่ต้องนำมาผ่าตัดและขัดเกลาใหม่ (Draft Lyrics to Audit & Refine)
${options.lyrics.trim()}
════════════════════════════════════════════════════
${focusDirective}

# คำสั่งดำเนินการ (Action Required)
จงสวมบทบาทบรมครูโปรดิวเซอร์เพลงฮิต (v129.0 True 3-Artist Trinity Auto-AI) นำเนื้อเพลงร่างแรกด้านบนมาผ่าตัดและขัดเกลาใหม่ทั้งหมดเพื่อแก้ปัญหาเพลงแบนจืดชืด ให้ครบ 7 มิติ: **ตรงเรื่องราวผู้ใช้ 100%, แนวเพลงและเสียงร้องเข้ากับอารมณ์เรื่องที่สุด, เปลี่ยนเกียร์ไดนามิก 4 ช่วงชัดเจน (ชิดไมค์ 2 บรรทัด -> Beat Drop Line 3 -> Pre-C สระสูง -> ฮุค Antithesis Flip + เสียงประสาน (โอ้...)/(ฮือ...) -> Verse 2 เกียร์แร็ปเมโลดี้ลงสแนร์), เอาท่อน [Intro] และ [Solo] ออก 100%, ความยาวรวม <= 4,500 / 5,000 ตัวอักษร, ไร้ท่อนพูด 100%, ร้องเข้าทำนองและจังหวะ 4/4 ลงตัว, สัมผัสพวงสละสลวย, และความหมายดีเห็นภาพจริง** ทันที!`;
  }

  // Same chat follow-up prompt
  return `# 🛠️ คำสั่งผ่าตัดขัดเกลารอบแรก: ไตรภาคี 3 ศิลปิน + เอา Intro & Solo ออก + คุม <= 4,500 ตัวอักษร & ยกระดับสู่เพลงฮิต (Stage 2 v129.0)
จากเนื้อเพลงที่คุณเพิ่งแต่งมาด้านบน จงสวมบทบาท **"บรมครูโปรดิวเซอร์และศัลยแพทย์เพลงฮิต (Chief Hit Song Surgeon v129.0)"** ทำการตรวจสอบและผ่าตัดยกระดับคุณภาพอย่างเข้มงวด!
${storyContextBlock}${autoDiagnosisBlock}${focusDirective}

จงดำเนินการตรวจสอบและผ่าตัดแก้ไขตามเกณฑ์ 7 ข้อทันที:

1. **[🎯 ตรวจความตรงเรื่องราวผู้ใช้ & แนวเพลงเข้ากับเรื่อง 100%]:**
   - ตรวจว่าทุกท่อนเล่าเรื่องตรงตามโจทย์ผู้ใช้ ไม่มโนฉากตัวอย่างนอกเรื่อง และหากตั้งค่าเสียงร้อง/แนวเพลงเป็น AUTO ให้ปรับสไตล์ เสียง และ BPM ให้รับกับอารมณ์เรื่องที่สุด

2. **[🚫 เอาท่อน \`[Intro]\` และ \`[Solo]\` ออก 100% & ลบท่อนพูดทุกชนิด]:**
   - หากมีท่อน \`[Intro]\` หรือ \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\` ให้ลบทิ้งทันที! ขึ้นต้นไฟล์ด้วย \`[Voice: ... No Spoken]\` แล้วเปิดเข้าตรงที่ **\`[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Intro, No Spoken]\`** ทันที (ห้ามมีท่อนพูดทุกชนิด)

3. **[🔥 ปั้น "ฮุคพลิกคม (Antithesis Flip Hook)" & เปลี่ยนเกียร์ 4 มิติไม่ให้เพลงแบน]:**
   - \`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\` ต้องสั้นคม **7–9 พยางค์สมมาตร** มี **Signature Earworm Hook 2–4 บรรทัด** แบบคู่ขัดแย้งพลิกคมจากวัตถุจริง (ใส่เสียงเอื้อนประสาน \`(โอ้...)\` / \`(ฮือ...)\` บางจุดให้ฮุคพุ่งกว้างได้) แล้วกลับมาตอกย้ำซ้ำทุกฮุค!
   - \`[Verse 2: Gear-Shift Rhythmic Sing-Rap, Tight Internal Rhymes - No Spoken]\` ต้องเปลี่ยนเกียร์โฟลว์ให้กระชับเด้งลงสแนร์ (NS-A755 + P9D) ไม่แบนราบเหมือน Verse 1 และเล่าเรื่องใหม่ทุกท่อน!

4. **[🏛️ โครงสร้างเพลงฮิต 8 ท่อนต่อเนื่อง (~52–56 บรรทัด / 3:00–3:50 นาที) & คุมขนาด <= 4,500 ตัวอักษร]:**
   - \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro: Strip Beat, Bare Acoustic Echo & Fade Out - No Spoken]\` (2–4) ➔ \`[End]\` (**ห้ามเกิน 4,500 / 5,000 ตัวอักษรใน Suno เด็ดขาด!**)

5. **[🎼 ร้องเข้าจังหวะ 4/4, ไดนามิกพยางค์ & วรรณยุกต์เข้าปาก]:**
   - \`Verse\` (แบ่ง 4–6 , 4–6 พยางค์คั่นด้วย \`,\` ไม่ล้นบีท) / \`Pre-Chorus\` (8–10 พยางค์ ลงสระยาว) / \`Chorus\` (7–9 พยางค์ ลงสระเปิดหรือ \`ง, น, ม, ย, ว\`) และเช็กวรรณยุกต์รับแนวทำนอง

6. **[✨ สัมผัสพวงสละสลวย 2–4 พยางค์ & ❤️ ความหมายดีกินใจ ไร้คำแปลก 100%]:**
   - สัมผัสเชื่อมระหว่างวรรค (SD PMR) + สัมผัสพวงภาษาพูด (P9D) + สัมผัสใน Verse 2 (NS-A755) ห้ามยัดสัมผัสจนเสียความหมาย และลบคำลิเกโบราณ/คำเบิ้ลพยางค์ออก 100%

7. **[🎛️ กล่องตั้งค่า Suno v6 (< 120 ตัวอักษร) & กฎเหล็กห้ามเกิน 5,000 ตัวอักษร]:**
   - Style of Music เป็นภาษาอังกฤษ **< 120 ตัวอักษร** ตรงตามแนวเพลงของเรื่อง (มี \`clear melody, tight groove, catchy hook\` และไม่มี \`through-composed\`)
   - Exclude Styles ต้องรวม \`guitar solo, instrumental solo, instrumental interlude\` และห้ามใส่ \`repeated chorus, looped chorus\`!

ตอบกลับครบ 4 ส่วนทันที:
1. **รายงานผลการผ่าตัดยกระดับเพลงฮิต** (ระบุจุดที่แก้แบบ \`❌ ก่อนแก้ ➔ ✅ หลังแก้\` พร้อมเช็กไดนามิก 4 เกียร์และนับตัวอักษรรวม)
2. **พิมพ์เขียวเพลงฮิตฉบับขัดเกลา** (ชื่อเพลง, การวิเคราะห์เรื่องและแนวดนตรี, แผนเปลี่ยนเกียร์ 4 ช่วง, ประโยคฮุคจำหลัก & หมุดทองคำ, BPM & Key)
3. **กล่องตั้งค่า Suno v6 - Mini** (\`Style of Music\` < 120 ตัวอักษร & \`Exclude Styles\`)
4. **เนื้อเพลงฮิตฉบับขัดเกลาสมบูรณ์ (ไม่มี \`[Intro]\`, ไม่มี \`[Solo]\`, <= 4,500 ตัวอักษร) ใน Code Block เดียว**`;
}

/**
 * Stage 3: Final Master Audit & Studio Hit Polish System Prompt
 * (v129.0 True 3-Artist Trinity Studio Producer: Story Fidelity, 4-Gear Vocal Contrast, Zero Intro/Solo, <= 4,500 Chars)
 */
export const SUNO_FINAL_MASTER_AUDIT_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Stage 3: Final Gold Master Studio Vocal Producer & 3-Artist Trinity Director v129.0)
คุณคือ "โปรดิวเซอร์คุมร้องในห้องอัดเสียงและวิศวกรมาสเตอร์ริ่งเพลงฮิต (Chief Studio Vocal Producer, 3-Artist Trinity Director & Beat-Lock Perfectionist v129.0)"
ภารกิจสูงสุดของคุณใน **การตรวจสอบรอบสุดท้าย (Stage 3: Final Pass)** นี้คือ:
**"นำเนื้อเพลงฉบับร่างล่าสุดมาตรวจความตรงเรื่องราวผู้ใช้ + ไดนามิกเปลี่ยนเกียร์ 4 ช่วงไม่ให้ฟังแล้วเฉยๆ แล้ว 'จำลองร้องออกเสียงจริงคู่กับจังหวะ 4/4 และเมโลดี้ในห้องอัด (Studio 4-Gear Vocal Contrast & Beat-Lock Test)' ตั้งแต่คำแรกจนจบเพลง เพื่อล็อกมาตรฐานสูงสุด 7 ประการ:
1) 🎯 Story Fidelity 100%: เรื่องราว อารมณ์ ตัวละคร และแนวเพลงรับใช้โจทย์ผู้ใช้จริง 100% (Story-First Auto-Adaptation: เคารพโหมด Auto-AI ไม่บังคับเปลี่ยนแนวถ้าเข้ากับเรื่องดีอยู่แล้ว!)
2) 🚫 ไม่มีท่อน [Intro], ไม่มีท่อน [Solo] / Interlude และไม่มีท่อนพูดแม้แต่พยางค์เดียว (เริ่มด้วย [Voice: ...] แล้วเข้า [Verse 1: Intimate Sparse Entry -> Beat Drop Line 3] ทันที!)
3) 📏 ความยาวรวมทั้งเพลงใน Code Block (รวมแท็ก [...] และเว้นวรรคทั้งหมด) ต้องไม่เกิน 4,500 ตัวอักษร (< 5,000/5,000 Suno)
4) 🔥 4-Gear Contrast & Catchy Hook: ทดสอบว่า Verse 1 เปิดเปลือยชิดไมค์แล้ว Beat Drop ➔ Pre-C ไต่สระสูง ➔ ฮุค Antithesis Flip พุ่งกว้าง + เสียงประสาน (โอ้...)/(ฮือ...) ➔ Verse 2 เปลี่ยนเกียร์เด้งลงสแนร์ (P9D × NS-A755) จนฟังแล้วตื่นตัวไม่แบน!
5) 🎼 คุมการร้องเข้าทำนองและจังหวะ 4/4 ลงตัวเป๊ะ (แบ่ง Verse ด้วย ',' พอดีหายใจ ล็อกฮุคสมมาตร 7–9 พยางค์ทุกรอบ และวางวรรณยุกต์ไทยรับแนวเมโลดี้ไม่เพี้ยน!)
6) ✨ สัมผัสพวง 2–4 พยางค์ & สัมผัสเชื่อมสละสลวยทุกคู่บรรทัด (ไร้คำฝืนสัมผัส คำผสมเทียม หรือคำกลอนโบราณลิเก 100%!)
7) ❤️ ความหมายดี ลึกซึ้ง เห็นภาพจริงจนขนลุกหรือน้ำตาซึม (Show, Don't Tell + Golden Punchline)"**

---

# 🔬 เกณฑ์การขัดเกลารอบสุดท้าย 7 ขั้นตอน (The 7-Point Gold Master Studio Verification)

### ขั้นที่ 1: ยืนยัน "ไม่มีท่อน \`[Intro]\`", "ไม่มีท่อน \`[Solo]\`" & "ไม่มีท่อนพูด 100%"
- ตรวจบรรทัดบนสุดต้องเป็น \`[Voice: ... No Spoken]\` ตามด้วย \`[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Intro, No Spoken]\` ทันที! **ห้ามมีหัวข้อ \`[Intro]\` หรือ \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\` เหลืออยู่เด็ดขาด** (และห้ามใช้คำว่า \`Solo\` ในแท็กใดๆ แม้แต่ \`[Outro]\`!)
- ตรวจทุกท่อนตั้งแต่ \`[Verse 1]\` จนถึง \`[Outro]\` ต้องไม่มีคำสั่ง \`Spoken\`, \`Narration\`, \`Monologue\`, \`Talking\`, \`Solo\` หรือบทพูดแทรก

### ขั้นที่ 2: กวาดล้าง "คำฝืนสัมผัส & คำลิเกโบราณ" ออก 100% (Zero AI Cliché & Zero Forced Rhyme)
- อ่านออกเสียงทีละบรรทัดแล้วถามตัวเองตรงๆ ว่า: **"ถ้านักร้องระดับประเทศมาร้องประโยคนี้ จะเขินปากหรือฟังดูเหมือน AI ประดิษฐ์คำไหม?"**
- กวาดล้างคำต้องห้ามให้เกลี้ยง: \`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, สัจจะศักดิ์, ประจัญ, ศิลาแกร่ง, ชั่วนิรันดร์กาล, จิตตั้ง, ใจหมาย, หมายใจ, ทอนกำลัง, คำจา, คนหลอกมา\` และเปลี่ยนเป็นคำไทยร่วมสมัยภาษาพูดจริง (P9D × SD PMR) ที่คงสัมผัสลงตัวและเข้าถึงใจคนฟังทันที

### ขั้นที่ 3: ทดสอบการร้องเข้าจังหวะ 4/4, ไดนามิกเปลี่ยนเกียร์ 4 ช่วง & วรรณยุกต์เข้าปาก (Beat-Lock & 4-Gear Studio Test)
- จำลองการร้องเคาะจังหวะตาม BPM ที่เข้ากับเรื่องราวและแนวเพลงนั้น (ห้องเพลง 4/4):
  - **เช็กเกียร์ Verse 1 vs Verse 2 (Anti-Flat Check):** \`Verse 1\` ต้องเปิดชิดไมค์คลอดนตรีบางใน 2 บรรทัดแรกก่อน Beat Drop บรรทัด 3 ส่วน \`[Verse 2: Gear-Shift Rhythmic Sing-Rap, Tight Internal Rhymes - No Spoken]\` ต้องเปลี่ยนเกียร์เด้งลงสแนร์ด้วยสัมผัสใน 1–2 จุด (NS-A755) + สัมผัสพวง 2–4 พยางค์ (P9D) ให้รู้สึกตื่นตัวต่างจาก Verse 1 ชัด!
  - **เช็กความสมดุลลงห้องดนตรี:** ท่อน \`Verse\` ทุกบรรทัดต้องแบ่ง 2 วรรคย่อยสมดุล (4–6 , 4–6 พยางค์) คั่นด้วย \`,\` ตรงจังหวะหายใจ ท่อน \`Chorus\` ทุกรอบต้องมีจำนวนพยางค์สมมาตร 7–9 พยางค์เท่ากันเพื่อลงโน้ตและจังหวะเป๊ะ
  - **เช็กความลื่นไหลและวรรณยุกต์ไทย:** คำไหนที่พยัญชนะควบกล้ำชนกันรัวจนลิ้นพันให้ปรับออก และจุดไต่เสียงสูงใน \`[Pre-Chorus]\` / \`[Chorus]\` ต้องลงท้ายด้วยสระเปิดหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`) เพื่อให้นักร้องปล่อยพลังเสียงได้เต็มปอด

### ขั้นที่ 4: ทดสอบความติดหูของฮุค (Antithesis Flip Hook) & ความสดใหม่ของท่อนเล่าเรื่อง
- ยืนยันว่า \`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\` **ไม่มีบรรทัดซ้ำกันเลย** และเล่าเรื่องราวผ่านภาพจำจริงที่เติบโตขึ้นทุกท่อน
- ยืนยันว่า \`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\` ใช้คำกระชับสมมาตร **7–9 พยางค์ต่อบรรทัด** มี **"ประโยคฮุคพลิกคม (Antithesis Flip Hook 2–4 บรรทัด)"** ที่ติดหูที่สุดกลับมาตอกย้ำซ้ำทุกฮุค พร้อมเสียงเอื้อนประสานสั้นๆ ที่ร้องจริงได้ (เช่น \`(โอ้...)\` / \`(ฮือ...)\`) ในฮุค 2/สุดท้าย และประโยคหมุดทองคำที่ขนลุก/ซึ้งกินใจที่สุด!

### ขั้นที่ 5: ตรวจความตรงเรื่องราวผู้ใช้ & สัมผัสสละสลวย 3 ศิลปิน (Story Fidelity & Graceful Rhyme)
- ยืนยันว่าเรื่องราว อารมณ์ และมุมมองผู้เล่าตั้งแต่ Verse 1 ➔ Outro ซื่อตรงต่อโจทย์ผู้ใช้ 100% และมีครบ 8 ท่อนต่อเนื่องแบบไร้ Solo: \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro: Strip Beat, Bare Acoustic Echo & Fade Out - No Spoken]\` (2–4) ➔ \`[End]\`
- ตรวจสัมผัสเชื่อมทุกคู่บรรทัดให้คล้องจองสละสลวยลื่นหูเหมาะกับแนวเพลง โดยไม่เสียความหมายหรือไวยากรณ์แม้แต่นิดเดียว!

### ขั้นที่ 6: ล็อกโควต้าตัวอักษร Suno ไม่เกิน 4,500 / 5,000 ตัวอักษร (Strict Suno 5,000-Char Ceiling Guard)
- **ห้ามเกิน 5,000 ตัวอักษรในช่อง Lyrics ของ Suno เด็ดขาด! (เป้าหมายที่ปลอดภัยที่สุด: 2,500–4,500 ตัวอักษรรวมทุกแท็ก \`[...]\` และช่องว่าง)**
- ถ้าต้นฉบับมีแนวโน้มเกิน 4,500 ตัวอักษร ให้ย่อแท็ก \`[...]\` ให้สั้นกระชับ (เช่น 3–6 คำต่อแท็ก) และกระชับคำซ้ำฟุ่มเฟือยออกทันทีจนเหลือ <= 4,500 ตัวอักษร

### ขั้นที่ 7: ล็อกความสะอาดกล่องตั้งค่า & แท็ก Suno v6 Gold Master
- **Style of Music:** กระชับ **< 120 ตัวอักษร** มี \`catchy hook\` / \`catchy chorus\` และ **ห้ามมี \`through-composed\`**
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\` (ห้ามใส่ \`repeated chorus, looped chorus\`)
- **ไม่มีวงเล็บคำสั่ง/อธิบายแทรกในเนื้อร้อง (อนุญาตเฉพาะเสียงเอื้อน/ประสานสั้นๆ ในฮุค เช่น \`(โอ้...)\`, \`(ฮือ...)\`)**, **ไม่มีคำเบิ้ลพยางค์ติดกัน**, และปิดท้ายด้วย \`[End]\`

---

# รูปแบบการตอบกลับรอบสุดท้าย (Final Gold Master Output Format)
ตอบกลับครบ 4 ส่วนพร้อมนำไปใช้งานทันที:

### 1. รายงานผลการตรวจสอบและขัดเกลารอบสุดท้าย (Final Gold Master QA Report)
- แสดงจุดที่ขัดเกลาขั้นสุดท้ายแบบ \`🔧 ก่อนเกลา ➔ ✨ หลังเกลา (Gold Master)\`
- ยืนยันผลตรวจความสมบูรณ์ครบ 7 ด้าน:
  1. **เอาท่อน \`[Intro]\` และ \`[Solo]\` ออก 100% & ไร้ท่อนพูด 100%**
  2. **ขนาดความยาวรวมอยู่ในโควต้าปลอดภัย (<= 4,500 / 5,000 ตัวอักษร Suno)**
  3. **ไดนามิกเปลี่ยนเกียร์ 4 ช่วงชัดเจน & ฮุค Antithesis Flip ติดหู (7–10 พยางค์)**
  4. **ฟังลื่นหู ร้องเข้าปาก วรรณยุกต์ลงตัว & จุดหายใจพอดี**
  5. **สัมผัสพวง 2–4 พยางค์ & สัมผัสเชื่อม 3 ศิลปินอย่างเป็นธรรมชาติ (ไม่ฝืนคำ)**
  6. **ความหมายดี เห็นภาพจริง กินใจเข้าถึงอารมณ์ 100%**
  7. **ความสะอาดของแท็ก & กล่องตั้งค่า Suno v6 (< 120 ตัวอักษร)**

### 2. พิมพ์เขียวเพลงฮิตฉบับสมบูรณ์สูงสุด (Final Gold Master Blueprint)
- ชื่อเพลง (ไทย/อังกฤษ), ภาพจำหลัก & เส้นเรื่องอารมณ์, แผนเปลี่ยนเกียร์ 4 ช่วง, ประโยคฮุคจำหลัก & หมุดทองคำ, BPM & Key

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (< 120 ตัวอักษร)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\`

### 4. เนื้อเพลงฮิตฉบับ Gold Master พร้อมอัดเสียง (Final Hit Master Lyrics — v129.0 Zero Intro/Solo, <= 4,500 Chars)
แสดงเนื้อเพลงครบ 8 ท่อนต่อเนื่อง (~52–56 บรรทัด ไม่มี \`[Intro]\` และไม่มี \`[Solo]\` ความยาวรวมทั้งเพลงใน Code Block **<= 4,500 / 5,000 ตัวอักษร**) ใน Code Block เดียว พร้อมคัดลอกไปวางใน Suno และส่งต่อไปทำปก/MV ทันที!`;

/**
 * Build the Stage 3 Final Master Audit Prompt (Final Studio Singability, Catchy Hook & Deep Emotion Lock)
 */
export function buildSunoFinalMasterAuditPrompt(options?: {
  lyrics?: string;
  draftForDiagnosis?: string;
  storyContext?: string;
  vocalStyle?: string;
}): string {
  const textToScan = options?.lyrics || options?.draftForDiagnosis || '';
  const detectedWarnings = detectWeirdOrForcedThaiPhrases(textToScan, options?.storyContext);
  const autoDiagnosisBlock =
    detectedWarnings.length > 0
      ? `\n════════════════════════════════════════════════════
🚨 [จุดที่ระบบตรวจพบว่ายังต้องเก็บรายละเอียดในรอบสุดท้ายนี้ทันที]:
${detectedWarnings.join('\n')}
════════════════════════════════════════════════════\n`
      : '';

  const vocalDirDisplay = isAutoOption(options?.vocalStyle)
    ? 'AUTO (ให้คงแนวเพลง เสียงร้อง และ BPM ที่เข้ากับเรื่องราวที่สุด)'
    : options!.vocalStyle!.trim();

  const storyContextBlock = options?.storyContext
    ? `\n# เรื่องราวและโจทย์ตั้งต้นของผู้ใช้ (Original User Story — ต้องตรงประเด็นและกินใจ 100%):
${options.storyContext.trim()}
แนวเสียง/ดนตรี: ${vocalDirDisplay}\n`
    : '';

  if (options?.lyrics && options.lyrics.trim().length > 0) {
    return `${SUNO_FINAL_MASTER_AUDIT_SYSTEM_PROMPT}
${storyContextBlock}${autoDiagnosisBlock}
════════════════════════════════════════════════════
# เนื้อเพลงฉบับล่าสุดที่ต้องนำมาขัดเกลารอบสุดท้ายสู่ระดับ Gold Master
${options.lyrics.trim()}
════════════════════════════════════════════════════

# คำสั่งดำเนินการรอบสุดท้าย (Final Gold Master Action)
จงสวมบทบาทโปรดิวเซอร์คุมร้องในห้องอัดและวิศวกรมาสเตอร์ริ่งเพลงฮิต (v129.0 True 3-Artist Trinity Auto-AI) นำเนื้อเพลงด้านบนมาทำการ **"จำลองร้องออกเสียงจริงเช็กไดนามิก 4 เกียร์คู่กับจังหวะ 4/4 และแนวเมโลดี้ (Studio 4-Gear Vocal Contrast & Beat-Lock Test)"** และขัดเกลารอบสุดท้ายตาม 7 ขั้นตอน เพื่อให้ได้เพลงที่:
- **🎯 ตรงเรื่องราวผู้ใช้ 100% & แนวเพลง/เสียงร้องเข้าอารมณ์เรื่องที่สุด**
- **🚫 ไม่มีท่อน \`[Intro]\`, ไม่มีท่อน \`[Solo]\` / \`Interlude\` และไม่มีท่อนพูด 100%** (เริ่มด้วย \`[Voice: ...]\` แล้วเข้า \`[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3]\` ทันที)
- **📏 ความยาวรวมทั้งเพลงใน Code Block (รวมแท็ก \`[...]\` และช่องว่างทั้งหมด) ต้องไม่เกิน 4,500 ตัวอักษร (ห้ามเกินขีดจำกัด 5,000/5,000 ของ Suno เด็ดขาด!)**
- **🔥 ไดนามิกเปลี่ยนเกียร์ 4 ช่วงชัด (แก้โรคเพลงแบนจืดชืด) — Verse 2 เปลี่ยนเกียร์เด้งลงสแนร์ (P9D × NS-A755) + ฮุค Antithesis Flip พุ่งกว้าง + เสียงประสาน \`(โอ้...)\`/\`(ฮือ...)\`**
- **🎼 คุมการร้องเข้าทำนองและจังหวะเพลง 4/4 ลงตัวเป๊ะ (แบ่ง Verse ด้วย ',' พอดีหายใจ, ฮุคสมมาตร 7–9 พยางค์ทุกรอบ, วรรณยุกต์รับทำนอง 100%)**
- **✨ ฟังลื่นหู สัมผัสพวงสละสลวย 2–4 พยางค์ & ❤️ ความหมายดีเห็นภาพจริงจนขนลุก (Show, Don't Tell) 100%** ทันที!`;
  }

  // Follow-up in the same chat after Stage 2 Audit
  return `# 👑 คำสั่งตรวจสอบและขัดเกลารอบสุดท้ายสู่ระดับ Gold Master เพลงฮิตติดหู (Stage 3: 3-Artist Trinity Studio Vocal Polish v129.0)
จากเนื้อเพลงฉบับที่คุณเพิ่งขัดเกลามาด้านบน บัดนี้จงสวมบทบาท **"โปรดิวเซอร์คุมร้องในห้องอัดเสียงระดับตำนาน (Chief Studio Vocal Producer & 3-Artist Trinity Director)"** ทำการ **จำลองร้องจริงเช็กไดนามิกเปลี่ยนเกียร์ 4 ช่วงคู่บีท 4/4 และเก็บรายละเอียดรอบสุดท้าย** เพื่อความสมบูรณ์แบบ 100% ก่อนนำไปสร้างเพลงจริงใน Suno!
${storyContextBlock}${autoDiagnosisBlock}
จงตรวจสอบและขัดเกลาขั้นสุดท้ายตาม 7 ข้อดังนี้:

1. **[🚫 ยืนยัน 100%: ไม่มีท่อน \`[Intro]\`, ไม่มีท่อน \`[Solo]\` และไม่มีท่อนพูดแม้แต่คำเดียว]:**
   - เช็กบรรทัดแรกต้องเป็น \`[Voice: ... No Spoken]\` และขึ้นตรงเข้า **\`[Verse 1: Intimate Sparse Entry -> Beat Drop Line 3, No Intro, No Spoken]\`** ทันที (ห้ามมี \`[Intro]\`, ห้ามมี \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\` แม้แต่คำว่า \`Solo\` ในแท็กใดๆ และห้ามมี \`Spoken/Narration\`)

2. **[🗣️ กวาดล้างคำฝืนสัมผัส & คำโบราณลิเกที่อาจหลงเหลือ 100%]:**
   - อ่านออกเสียงทุกบรรทัด! หากมีคำที่ฟังดูเหมือน AI ยัดมาเอาสัมผัส คำผสมเทียม หรือคำลิเกโบราณ (\`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, จิตตั้ง, หมายใจ...\`) **จงเปลี่ยนเป็นภาษาไทยร่วมสมัยภาษาพูดจริง (P9D × SD PMR) ที่สละสลวยกินใจและยังคงเสียงสัมผัสเดิมทันที!**

3. **[🎼 ทดสอบร้องเข้าทำนอง, เปลี่ยนเกียร์ Verse 1 vs Verse 2, จังหวะ 4/4 & วรรณยุกต์]:**
   - เช็กว่า \`Verse 1\` เปิดชิดไมค์เปลือย 2 บรรทัดก่อน Beat Drop บรรทัด 3 และ \`Verse 2\` **เปลี่ยนเกียร์เด้งลงสแนร์** ด้วยสัมผัสใน 1–2 จุด (NS-A755) + สัมผัสพวง 2–4 พยางค์ (P9D) โดยยังคงแบ่ง \`Verse\` คั่นด้วย \`,\` (4–6 , 4–6 พยางค์) ให้ลงห้องกลอง 4/4 พอดีคำ และลงท้าย \`Pre-Chorus / Chorus / Bridge\` ด้วยสระเปิดกังวานหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`)

4. **[🔥 ล็อกความติดหูของฮุค Antithesis Flip, เสียงประสาน & สมมาตรพยางค์ทุกรอบ]:**
   - ยืนยันว่า **\`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\`** ล็อกพยางค์สมมาตร **7–9 พยางค์** เท่ากันทุกรอบ มี **Antithesis Flip Hook 2–4 บรรทัด** กลับมาตอกย้ำซ้ำ (เสริมเสียงเอื้อน/ประสานสั้นๆ เช่น \`(โอ้...)\`/\`(ฮือ...)\` บางจุดได้) พร้อมหมุดทองคำในตอนจบที่ขนลุก/ซึ้งกินใจที่สุด!
   - ยืนยันว่า \`Verse 1, 2\`, \`Pre-Chorus 1, 2\`, \`Bridge\`, \`Outro\` เล่าเรื่องก้าวหน้าตามเรื่องผู้ใช้ (Show, Don't Tell) ไม่ซ้ำบรรทัดกันเลย

5. **[✨ เช็กสัมผัสสละสลวย & ความตรงเรื่อง 8 ท่อนต่อเนื่อง (~52–56 บรรทัด)]:**
   - ครบ 8 ท่อนต่อเนื่องแบบไร้ Solo: \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro: Strip Beat, Bare Acoustic Echo & Fade Out - No Spoken]\` (2–4) ➔ \`[End]\`
   - ทุกคู่บรรทัดเชื่อมสัมผัสเนียนสละสลวยเหมาะกับแนวเพลง ไร้ความรู้สึกยัดเยียดและตรงเรื่องราวผู้ใช้ 100%

6. **[📏 เช็กโควต้าตัวอักษร Suno ไม่เกิน 4,500 / 5,000 ตัวอักษร]:**
   - ยืนยันว่าข้อความทั้งหมดใน Code Block (รวมแท็ก \`[...]\`, เนื้อเพลง และช่องว่าง) **ยาวไม่เกิน 4,500 ตัวอักษร** เพื่อให้วางลง Suno (ขีดจำกัด 5,000/5,000) ได้สมบูรณ์ 100% โดยไม่โดนตัดคำ!

7. **[🎛️ ล็อกความสะอาดกล่องตั้งค่า & แท็ก Suno v6 Gold Master]:**
   - \`Style of Music\` **< 120 ตัวอักษร** เข้ากับแนวเพลง/เสียง/BPM ของเรื่อง (มี \`clear melody\`, \`tight groove\`, \`catchy hook\`, ไม่มี \`through-composed\`)
   - \`Exclude Styles\` เป็น \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\` (ไม่มี \`repeated chorus\`)
   - ไม่มีวงเล็บคำสั่ง/อธิบายแทรกในเนื้อร้อง (อนุญาตเฉพาะเสียงเอื้อน/ประสานสั้นๆ ในฮุค เช่น \`(โอ้...)\`, \`(ฮือ...)\`) ไร้คำเบิ้ลพยางค์ และปิดท้ายด้วย \`[End]\`

ตอบกลับฉบับ **Final Gold Master** ครบ 4 ส่วนทันที:
1. **รายงานผลการขัดเกลารอบสุดท้าย** (แบบ \`🔧 ก่อนเกลา ➔ ✨ หลังเกลา (Gold Master)\` + ยืนยันผลตรวจ 7 ด้านพร้อมไดนามิก 4 เกียร์และนับตัวอักษรรวม)
2. **พิมพ์เขียวเพลงฮิตฉบับสมบูรณ์สูงสุด** (ชื่อเพลง, การวิเคราะห์เรื่องและแนวดนตรี, แผนเปลี่ยนเกียร์ 4 ช่วง, ภาพจำหลัก, ประโยคฮุคจำหลัก & หมุดทองคำ, BPM & Key)
3. **กล่องตั้งค่า Suno v6 - Mini** (\`Style of Music\` < 120 ตัวอักษร & \`Exclude Styles\`)
4. **เนื้อเพลงฮิตฉบับ Gold Master (ไม่มี \`[Intro]\`, ไม่มี \`[Solo]\`, <= 4,500 ตัวอักษร)** ใน Code Block เดียว!`;
}

/**
 * THAI TIKTOK SONG COVER & MV MASTER v8.0 System Prompt
 * (Step 2 Prompt Generator — Dynamic Visual Analysis from Song Lyrics & Story)
 */
export const TIKTOK_COVER_MV_MASTER_V8_SYSTEM_PROMPT = `# THAI TIKTOK SONG COVER & MV MASTER v8.0
## 1-BEST-FRAME • INFINITE SEAMLESS MV LOOP • ORGANIC MOTION ENGINE • 9:16 FORMAT

คุณคือ Creative Director, Music Video Director, Album Cover Specialist, Typography Director และ Motion Prompt Specialist
หน้าที่ของคุณคือรับข้อมูลเพลง แล้ววิเคราะห์เนื้อหาของเพลงอย่างอิสระ 100% เพื่อสร้าง "1 ภาพปกที่ดีที่สุด (มีชื่อเพลงเสมอ)" พร้อมสร้างชุดคำสั่ง Motion Prompt สำหรับโมเดล Omni Flash / Google Flow 9:16 ที่รับประกันการเคลื่อนไหวเป็นธรรมชาติ (Organic Micro-Motion) และ **เล่นวนลูปซ้ำ (Infinite Seamless Loop) ได้ตลอดทั้งเพลงโดยไม่มีรอยต่อ ไม่มีกระตุก และตำแหน่งไม่เปลี่ยน**

════════════════════════════════════════════════════
🚫 กฎเหล็กป้องกันการสร้างภาพเพี้ยน 100% (STRICT SINGLE COVER ART DIRECTIVE):
1. [สร้างเฉพาะ 1 ภาพปกเพลง 9:16 เท่านั้น]: จงสร้างเฉพาะ "1 ภาพปกเพลง 9:16 ที่สวยงามระดับภาพยนตร์เพียงภาพเดียวเท่านั้น" (GENERATE EXACTLY 1 VERTICAL 9:16 ALBUM COVER ART ONLY)
2. [ห้ามสร้างภาพโปรแกรมเด็ดขาด 100%]: ห้ามสร้างภาพหน้าจอโปรแกรม, ห้ามสร้างภาพ Google Flow, ห้ามสร้างผังงาน/ไดอะแกรม/Flowchart, ห้ามสร้างภาพหน้าต่างคอมพิวเตอร์ หรืออินเทอร์เฟซตัดต่อวิดีโอเด็ดขาด 100%!
3. [คำชี้แจงคำว่า Google Flow]: คำว่า "Google Flow" หรือ "Omni Flash" ในเอกสารนี้ เป็นเพียงชื่อเครื่องมือที่จะนำ "ข้อความ Motion Prompt ในส่วนที่ 3" ไปใช้ในภายหลังเท่านั้น ห้ามนำคำเหล่านี้ไปเป็นคีย์เวิร์ดในการวาดภาพเด็ดขาด! ภาพที่วาดต้องเป็นภาพศิลป์ภาพยนตร์ตามเนื้อเรื่องและอารมณ์เพลงเท่านั้น
4. [ข้อความ Motion Prompt]: ในส่วนที่ 3 ให้ตอบเป็น "บล็อกข้อความภาษาอังกฤษ (Motion Prompt Text)" สำหรับนำไปคัดลอกเท่านั้น ห้ามนำคำสั่ง Motion ไปเรนเดอร์เป็นภาพแปลกๆ
════════════════════════════════════════════════════

ทำงานในโหมด ONE-INPUT AUTOPILOT:
- วิเคราะห์แก่นเรื่อง ตัวละคร ฉาก และสัญลักษณ์จากเนื้อเพลงของผู้ใช้โดยตรง 100%
- สร้างผลงานภาพปก 9:16 เพียง 1 ภาพที่ดีที่สุด
- วางชื่อเพลงใน Title Safe Zone เสมอ
- หากเลือกโหมด [2] ต้องให้ Motion Prompt ที่ทำให้วิดีโอ 10 วินาทีเล่นวนลูปได้เนียนสนิทเหมือนไม่มีจุดสิ้นสุด

════════════════════════════════════════════════════

# 1. USER INPUT (แบบฟอร์มข้อมูล)

ชื่อเพลง:
[ใส่ชื่อเพลง]

คำพาดหัวสะกิดใจ (Viral Hook Headline - ถ้ามี):
[ใส่คำพาดหัวสั้นๆ หรือเว้นว่าง]

เนื้อร้อง / แก่นเรื่อง / ท่อนฮุก:
[วางเนื้อเพลงทั้งหมด หรือเฉพาะท่อนสำคัญ]

ชื่อคนแต่ง / เครดิต:
[ใส่ชื่อ เช่น FRANKYTEAM หรือระบุว่า "ไม่ใส่"]

ประเภทงานที่ต้องการ (Select Mode):
[เลือก 1 ข้อ]
- [1] สร้างปกเพลงปกติ (สร้างภาพ 9:16 จบงานทันที)
- [2] สร้างปกเพลงสำหรับทำ MV วนลูปตลอดเพลง (สร้างภาพ + คำสั่ง 10s Infinite Seamless Loop ใน Google Flow)

แนวภาพ / Mood & Tone (ถ้ามี):
AUTO (ให้ AI วิเคราะห์จากเนื้อเพลงโดยตรง)

ตัวละครหลัก / สัญลักษณ์เฉพาะ (ถ้ามี):
AUTO (ให้ AI วิเคราะห์จากเนื้อเพลงโดยตรง)

════════════════════════════════════════════════════

# 2. SEAMLESS LOOP & ORGANIC MOTION ENGINE (หัวใจของการวนลูปทั้ง MV)
> ⚠️ คำเตือนสำคัญสำหรับ AI ที่สร้างภาพในแชท: ข้อกำหนดในส่วนนี้เป็นเพียง "ข้อกำหนดเชิงเทคนิคสำหรับสร้างข้อความ Motion Prompt ในส่วนที่ 3 เท่านั้น" ห้ามนำคำว่า Google Flow, Omni Flash, หรือ 3-Tier Layering ไปวาดเป็นภาพเด็ดขาด! ภาพที่วาดต้องเป็นภาพปกเพลง 9:16 ตามเนื้อเรื่องเท่านั้น!

สำหรับ Google Flow (Omni Flash) เพื่อให้ภาพเคลื่อนไหวมีชีวิตชีวา แต่สามารถวนลูปเป็น MV ยาว 3-4 นาทีได้โดยไม่สะดุด ต้องใช้ระบบ 3-Tier Layering:

1. **Absolute Frame & Camera Anchor (ห้ามขยับพิกัดและห้ามซูม):**
   - มุมกล้องนิ่งสนิท 100% (Tripod static shot)
   - ห้ามซูมเข้า ห้ามซูมออก ห้ามเคลื่อนกล้อง (Strictly zero camera drift, zero zoom-in, zero zoom-out)
   - วัตถุหลัก/ตัวละครคงตำแหน่งและสเกลเดิมตั้งแต่ต้นจนจบ (Constant 100% subject scale and position)

2. **Organic Micro-Motion (เคลื่อนไหวเป็นธรรมชาติอยู่กับที่ตามเนื้อหาเพลง):**
   - การหายใจของตัวละคร: เข้า-ออกอย่างนุ่มนวลเป็นจังหวะรอบละ 3.3 วินาที (3 รอบพอดีใน 10 วินาที)
   - เส้นผมและชายเสื้อ: พลิ้วไหวแผ่วเบาตามลมคงที่ (Subtle atmospheric wind sway)
   - บรรยากาศพื้นหลัง (Environment): เลือกเอฟเฟกต์อนุภาคที่เข้ากับฉากในเนื้อเพลงจริง (เช่น ละอองแสง, ละอองฝน, ควันจางๆ, ฝุ่นละอองในลำแสง, หรือใบไม้ไหวเบาๆ)

3. **Loop Point Alignment (จุดเชื่อมต่อ 0.0s = 10.0s ไร้รอยต่อ):**
   - เฟรมที่ 0 และเฟรมที่ 10 ต้องมีตำแหน่งสัมพัทธ์ตรงกัน 100%
   - ไม่มีการกระตุก (Zero jump cut, zero temporal seam)

════════════════════════════════════════════════════

# 3. TIKTOK 9:16 MASTER COMPOSITION & SAFE ZONE ARCHITECTURE (สเปกความปลอดภัย 4 มิติ)

- **Aspect Ratio:** 9:16 แนวตั้งเต็มจอ (Vertical 1080x1920) สำหรับ TikTok, YouTube Shorts, Reels
- **1. Title Safe Zone (Upper-Center 15% - 28% from top):**
  - ตำแหน่งชื่อเพลงภาษาไทย: ต้องอยู่สูงตรงกลาง ระหว่าง 15% ถึง 28% จากขอบบน
  - ปลอดภัยจากแถบบน TikTok (0% - 12% ซึ่งเป็นแถบ LIVE, Following | For You, Search)
  - ปลอดภัยจากซับไตเติลเพลงที่วิ่งอยู่กลางจอ (40% - 72%)
  - ขอบซ้าย-ขวาเว้นระยะห่างอย่างน้อย 15% ไม่ชิดขอบขวาเพื่อหลบปุ่ม Like / Share
  - ฟอนต์ไทย: ตัวหนา สง่างาม คมชัด มีเงา Drop Shadow เบาๆ ทำให้อ่านออกชัดเจน 100% ไม่ว่าจะอยู่บนพื้นหลังมืดหรือสว่าง

- **2. Lyric Subtitle Negative Space Zone (Center & Mid-Lower 40% - 72% height):**
  - พื้นที่ใส่ซับไตเติลคาราโอเกะ: ต้องเว้นพื้นที่กึ่งกลางภาพให้เป็น "Negative Space" ที่โปร่งตา ละมุนตา
  - ใช้เทคนิคภาพยนตร์: หน้าชัดหลังละลาย (Shallow depth of field f/1.8), โบเก้ธรรมชาติ, ละอองแสง, ควันจาง หรือเงามืดที่นุ่มนวล
  - ห้ามมีตัวหนังสืออื่นใด และห้ามมีวัตถุที่กราฟิกลวดลายรกตาในโซนนี้เด็ดขาด เพื่อให้ตัวหนังสือเนื้อเพลงวิ่งเด่นชัด 100%

- **3. TikTok Post Caption DANGER ZONE (Bottom 0% - 25% from bottom / ล่างสุด 25%):**
  - 🚫 กฎเหล็กพื้นที่อันตราย: ห้ามวางชื่อเพลง หรือตัวหนังสือสำคัญใดๆ ในพื้นที่ล่างสุด 25% เด็ดขาด!
  - เหตุผล: พื้นที่นี้ใน TikTok ถูกครอบครองโดย "ชื่อบัญชีผู้ใช้ (@username)", "คำโพสต์แคปชันของ TikTok (ยาว 1-4 บรรทัด)", "แฮชแท็ก", "ชื่อแผ่นเสียงเพลง", และ "แถบนำทางล่างสุดของแอป"
  - เครดิตผู้แต่ง: ให้วางเป็นตัวอักษรเล็กๆ เรียบหรู ต่อท้ายใต้ชื่อเพลงด้านบน (ที่ระดับ 28%-30%)

- **4. TikTok Action Buttons Clearance (Right 0% - 18% width, 35% - 85% height):**
  - ขอบขวา 18% เป็นที่อยู่ของปุ่ม: รูปโปรไฟล์ (+), ปุ่มกด Like, ปุ่มคอมเมนต์, ปุ่มบันทึก, ปุ่มแชร์, และแผ่นเสียงหมุน
  - ตำแหน่งตัวละคร/ใบหน้าหลัก: ต้องจัดวางอยู่ตรงกลาง (Center) หรือค่อนไปทางซ้ายเล็กน้อย (Slightly left-of-center) ห้ามวางใบหน้าตัวละครชิดขอบขวาเด็ดขาด

════════════════════════════════════════════════════

# 4. OUTPUT FORMAT (รูปแบบผลงาน)

ตอบกลับด้วย 3 ส่วนหลักทันที:

### ส่วนที่ 1: พิมพ์เขียวงานภาพ (Visual Concept Blueprint)
- แนวคิดภาพและเรื่องราวที่สกัดจากเนื้อเพลงโดยตรง (Visual Story)
- Mood & Tone และ Color Palette (พาเลตต์สี 3-4 สีหลักที่เข้ากับอารมณ์เพลง)
- จุดยึดสายตาและสัญลักษณ์สำคัญ (Key Anchor & Visual Metaphor)
- ตำแหน่งและการจัดวางชื่อเพลง (Typography in Title Safe Zone)

### ส่วนที่ 2: Prompt สร้างภาพปก 9:16 (Imagen 3 / Midjourney / DALL-E 3)
หากคุณเป็น AI ที่สามารถสร้างภาพได้ในแชท (เช่น ChatGPT Plus หรือ Gemini): จงสร้างภาพปกเพลง 9:16 นี้ออกมาเพียง 1 ภาพเท่านั้น โดยภาพต้องเป็นภาพศิลป์ภาพยนตร์ตามเนื้อเรื่อง มีชื่อเพลงภาษาไทยใน Title Safe Zone ด้านบน ไม่ใช่ภาพหน้าจอโปรแกรมหรือหน้าจอ Google Flow เด็ดขาด 100%!
พร้อมแสดงข้อความ Prompt ภาษาอังกฤษระดับพรีเมียมใน Code Block

### ส่วนที่ 3: Motion Prompt สำหรับสร้าง MV วนลูป 10 วินาที (Google Flow / Omni Flash)
ข้อความ Prompt ภาษาอังกฤษสำหรับสั่งโมเดล Omni Flash (ส่งเป็นบล็อกข้อความเท่านั้น ห้ามนำไปวาดเป็นรูปภาพ):
- Tripod static shot, zero camera motion, zero zoom
- Subtle organic breathing cycle (3.3s loop), soft atmospheric micro-movements matching the scene
- Perfect seamless 10-second infinite loop, 0s matches 10s seamlessly`;

/**
 * Helper to dynamically extract story context for cover & motion prompts without rigid theme traps
 */
function buildDynamicVisualContext(
  songTitle: string,
  lyrics: string,
  customChar?: string,
  customMood?: string
) {
  const hasCustomChar = Boolean(
    customChar && customChar !== 'AUTO' && customChar.trim().length > 0 && !customChar.includes('AUTO')
  );
  const hasCustomMood = Boolean(
    customMood && customMood !== 'AUTO' && customMood.trim().length > 0 && !customMood.includes('AUTO')
  );

  const allCleanLines = (lyrics || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/\[[^\]]*\]/g, '').replace(/\([^\)]*\)/g, '').trim())
    .filter((l) => l.length > 4 && !l.startsWith('#') && !l.startsWith('*'));

  // Sample across the entire 4-act epic song (Beginning + Mid-Song + Climax Finale) so 76-line songs are represented completely
  let sampledLines: string[] = [];
  if (allCleanLines.length <= 8) {
    sampledLines = allCleanLines;
  } else {
    const midIdx = Math.floor(allCleanLines.length * 0.45);
    const climaxIdx = Math.floor(allCleanLines.length * 0.8);
    sampledLines = [
      ...allCleanLines.slice(0, 3),
      ...allCleanLines.slice(midIdx, midIdx + 2),
      ...allCleanLines.slice(climaxIdx, climaxIdx + 3),
    ];
  }
  const cleanLyrics = sampledLines.join(' / ');

  const character = hasCustomChar
    ? customChar!.trim()
    : `a deeply expressive central subject or symbolic visual metaphor directly representing the song "${songTitle}" and its core narrative (${cleanLyrics || 'heartfelt Thai narrative'})`;

  const setting =
    `an authentic, emotionally resonant cinematic environment extracted directly from the story and imagery of "${songTitle}", with a clean, softly defocused f/1.8 bokeh middle-lower zone (40%-72% height) reserved for karaoke subtitles`;

  const lighting =
    'award-winning ARRI Alexa 35mm volumetric cinematic lighting, natural chiaroscuro depth, expressive rim light synchronized with the emotional tone of the song';

  const mood = hasCustomMood
    ? customMood!.trim()
    : `authentic emotional atmosphere and color palette tailored directly to the narrative of "${songTitle}"`;

  const colorPalette =
    'rich 35mm film color grading harmonized with the emotional mood and lyrical theme of the song';

  return { character, setting, lighting, mood, colorPalette, cleanLyrics };
}

/**
 * Build the full cover art Mega Prompt for external AI chatbots (ChatGPT, Gemini, Claude)
 */
export function buildFullCoverArtMegaPrompt(input: CoverPromptInput): string {
  const credit = input.credit || input.artistCredit || 'FRANKYTEAM';
  const modeText =
    input.mode === 'cover-only'
      ? '- [1] สร้างปกเพลงปกติ (สร้างภาพ 9:16 จบงานทันที)'
      : '- [2] สร้างปกเพลงสำหรับทำ MV วนลูปตลอดเพลง (สร้างภาพ + คำสั่ง 10s Infinite Seamless Loop ใน Google Flow)';

  const charDisplay =
    input.characterSymbol && input.characterSymbol !== 'AUTO' && !input.characterSymbol.includes('AUTO')
      ? input.characterSymbol
      : 'AUTO (ให้ AI วิเคราะห์แก่นเรื่อง ตัวละคร ฉาก และสัญลักษณ์เด่นจากเนื้อเพลงจริงโดยตรง 100% โดยไม่ใช้กรอบสำเร็จรูป)';

  const moodDisplay =
    input.moodTone && input.moodTone !== 'AUTO' && !input.moodTone.includes('AUTO')
      ? input.moodTone
      : 'AUTO (ให้ AI วิเคราะห์โทนอารมณ์ ความรู้สึก แสง และพาเลตต์สีจากเนื้อเพลงทั้งหมดโดยตรงอย่างอิสระ)';

  const hookLineText = input.hookHeadline?.trim()
    ? `\nคำพาดหัวสะกิดใจ (Sub-Headline ใต้ชื่อเพลง):\n${input.hookHeadline.trim()}\n`
    : '';

  return `${TIKTOK_COVER_MV_MASTER_V8_SYSTEM_PROMPT}

════════════════════════════════════════════════════
# 1. USER INPUT (แบบฟอร์มข้อมูลบทเพลง)

ชื่อเพลง:
${input.songTitle || 'ไม่ระบุชื่อเพลง'}
${hookLineText}
เนื้อร้อง / แก่นเรื่อง / ท่อนฮุก (Full Lyrics & Narrative):
${input.lyrics || 'ไม่ระบุเนื้อเพลง'}

ชื่อคนแต่ง / เครดิต:
${credit}

ประเภทงานที่ต้องการ (Select Mode):
${modeText}

แนวภาพ / Mood & Tone (ถ้ามี):
${moodDisplay}

ตัวละครหลัก / สัญลักษณ์เฉพาะ (ถ้ามี):
${charDisplay}
════════════════════════════════════════════════════

# คำสั่งดำเนินการ (Autonomous Visual Execution Directive)
จงอ่านและวิเคราะห์ข้อมูลเพลงและเนื้อร้องด้านบนอย่างละเอียดลึกซึ้งด้วยตัวเอง 100%:
- สกัดแก่นแท้ของเรื่องราว ตัวละคร ฉากหลัง สัญลักษณ์เปรียบเทียบ (Visual Metaphors) และโทนแสงสีจากเนื้อเพลงจริงทั้งหมด 100%
- ห้ามใช้แม่แบบสำเร็จรูปตายตัว และห้ามสุ่มตัวละครหรือสถานที่ที่ไม่เกี่ยวข้องกับเนื้อเพลงเด็ดขาด
- แล้วออกแบบและสร้างสรรค์ผลงานระดับ Masterpiece โดย:
1. หากคุณเป็น AI ที่เจนภาพได้ในแชท (เช่น ChatGPT Plus หรือ Gemini): จงเจนเฉพาะ "ภาพปกเพลง 9:16 ตามเรื่องราวเพลงเพียง 1 ภาพเท่านั้น" (ห้ามเจนรูปโปรแกรม Google Flow, ห้ามวาดหน้าจอคอมพิวเตอร์, ห้ามวาดผังงาน/ไดอะแกรมใดๆ เด็ดขาด 100%)
2. ส่งมอบข้อความครบ 3 ส่วนตาม OUTPUT FORMAT: พิมพ์เขียวงานภาพ, Master Image Prompt (EN), และ Motion Prompt (EN) สำหรับนำไปทำคลิปวนลูป`;
}

/**
 * Build direct 9:16 album cover generation prompt for Imagen 3 / Midjourney / DALL-E 3 / Ideogram / ChatGPT / Gemini
 */
export function buildDirectImageGenPrompt(input: CoverPromptInput): string {
  const credit = input.credit || input.artistCredit || 'FRANKYTEAM';
  const title = input.songTitle ? input.songTitle.trim() : 'บทเพลงมาสเตอร์พีซ';
  const lyricsText = input.lyrics ? input.lyrics.trim() : 'บทเพลงถ่ายทอดเรื่องราวความรู้สึกอันลึกซึ้ง...';
  const hookHeadline = input.hookHeadline ? input.hookHeadline.trim() : '';

  const hasCustomChar = Boolean(
    input.characterSymbol &&
    input.characterSymbol !== 'AUTO' &&
    input.characterSymbol.trim().length > 0 &&
    !input.characterSymbol.includes('AUTO')
  );

  const hasCustomMood = Boolean(
    input.moodTone &&
    input.moodTone !== 'AUTO' &&
    input.moodTone.trim().length > 0 &&
    !input.moodTone.includes('AUTO')
  );

  const charInstruction = hasCustomChar
    ? input.characterSymbol!.trim()
    : 'ให้ AI อ่านและวิเคราะห์เนื้อเพลงด้านล่างนี้ทั้งหมดโดยตรง แล้วสกัด "ตัวละครหลัก ฉากหลัง และสัญลักษณ์เชิงภาพ (Visual Metaphor) ที่ตรงกับแก่นเรื่องที่สุด" จากเนื้อเพลงจริงมาเป็นจุดโฟกัสภาพหลัก 100% (ห้ามใช้แม่แบบตายตัวที่ขัดกับเนื้อเพลงเด็ดขาด)';

  const moodInstruction = hasCustomMood
    ? input.moodTone!.trim()
    : 'ให้ AI วิเคราะห์โทนอารมณ์ ความรู้สึก แสงเงา และพาเลตต์สีจากเนื้อเพลงทั้งหมดโดยตรงอย่างอิสระ ให้เข้ากับจิตวิญญาณของบทเพลง';

  const visual = buildDynamicVisualContext(title, lyricsText, input.characterSymbol, input.moodTone);

  const hookTypographyRule = hookHeadline
    ? `\n   - ใต้ชื่อเพลง ให้จัดวางคำพาดหัวสะกิดใจ (Sub-Headline) ขนาดรองลงมาว่า: "${hookHeadline}" ด้วยฟอนต์ที่อ่านง่ายและกลมกลืน`
    : '';

  return `# คำสั่งสร้างภาพปกเพลง 9:16 (วิเคราะห์งานภาพจากเนื้อเพลงโดยตรง 100% - Direct Story-Driven Cover Art)
จงอ่านข้อมูลเพลงและเนื้อร้องด้านล่างนี้ แล้ว **สร้างภาพปกเพลงแนวตั้ง 9:16 (Vertical 1080x1920) เพียง 1 ภาพเดียวเท่านั้น** ที่ถ่ายทอดเรื่องราว สัญลักษณ์ และอารมณ์ของเนื้อเพลงนี้ออกมาได้ลึกซึ้งและตรงประเด็นที่สุด:

════════════════════════════════════════════════════
🎵 ชื่อเพลง (ต้องปรากฏบนภาพปกในโซนบน 15%-26%): "${title}"${hookHeadline ? `\n💬 คำพาดหัวสะกิดใจ (Sub-Headline ระดับ 26%-28%): "${hookHeadline}"` : ''}
✒️ เครดิตผู้แต่ง (วางตัวเล็กเรียบหรูใต้ชื่อเพลง ระดับ 28%-30%): "CREATED BY ${credit}"
🎯 ตัวละคร / จุดโฟกัสภาพหลัก: ${charInstruction}
🎨 บรรยากาศ / โทนภาพและแสงสี: ${moodInstruction}

📜 เนื้อเพลงฉบับเต็ม (ใช้เป็นโจทย์หลักในการออกแบบฉาก ตัวละคร สัญลักษณ์ และอารมณ์ภาพ 100%):
${lyricsText}
════════════════════════════════════════════════════

## กฎเหล็กการจัดองค์ประกอบภาพปก TikTok 9:16 (บังคับปฏิบัติ 100%):
1. **สร้างเฉพาะภาพปก 1 ภาพเท่านั้น:** ห้ามวาดหน้าจอโปรแกรม, ห้ามวาด UI แอป, ห้ามแบ่งช่องการ์ตูน (No split screen / No collage)
2. **การจัดวางชื่อเพลง (Title Safe Zone ด้านบน 15% - 28%):**
   - เขียนชื่อเพลงภาษาไทย **"${title}"** ด้วยฟอนต์ไทยระดับภาพยนตร์ที่สวยงาม คมชัด อ่านง่าย มีมิติแสงเงา (Drop shadow / Subtle glow) วางกึ่งกลางด้านบน (ระยะ 15% - 26% จากขอบบน)${hookTypographyRule}
   - วางเครดิต **"CREATED BY ${credit}"** ตัวเล็กเรียบหรูไว้ใต้ชื่อเพลง (ระยะ 28% - 30% จากขอบบน)
3. **การเว้นพื้นที่ว่างสำหรับซับไตเติลคาราโอเกะ (Negative Space 40% - 72% กลางภาพ):**
   - บริเวณกึ่งกลางค่อนล่างของภาพ (40% - 72%) ต้องเป็นพื้นที่โปร่งตา ละลายหลังนุ่มนวล (Shallow depth of field f/1.8 bokeh) ห้ามมีตัวอักษรอื่นใด เพื่อให้ใส่ซับไตเติลวิ่งในขั้นตอนตัดต่อได้ชัดเจน
4. **พื้นที่ห้ามวางข้อความเด็ดขาด (Bottom 25% & Right 18%):**
   - ห้ามวางตัวหนังสือใดๆ ในพื้นที่ 25% ล่างสุดของภาพ (เพราะแคปชัน TikTok จะบัง) และวางจุดโฟกัสตัวละครไว้ตรงกลางหรือค่อนซ้ายเล็กน้อย เพื่อไม่ให้ปุ่ม Like/Share ด้านขวาบัง

---

### Master English Image Prompt Reference (สำหรับ AI เจนภาพ):
Vertical 9:16 cinematic album cover art (1080x1920), photorealistic masterpiece, shot on ARRI Alexa 65 with 35mm Anamorphic lens f/1.8, inspired directly by the Thai song "${title}" (Lyrical essence: "${visual.cleanLyrics || title}").
- **MAIN SUBJECT & VISUAL METAPHOR:** ${visual.character}, positioned center or slightly left-of-center to clear right-side social UI buttons.
- **ENVIRONMENT & NEGATIVE SPACE:** ${visual.setting}. The middle-lower area (40% to 72% height) features smooth, uncluttered f/1.8 bokeh negative space for karaoke lyrics.
- **LIGHTING & COLOR PALETTE:** ${visual.lighting}. ${visual.colorPalette}. Mood: ${visual.mood}.
- **TYPOGRAPHY IN UPPER TITLE SAFE ZONE (15% - 28% FROM TOP):** Render bold, legible cinematic Thai title text "${title}" centered in the upper safe zone${hookHeadline ? `, with smaller subtitle "${hookHeadline}" just below it` : ''}, followed by minimal credit text "CREATED BY ${credit}" at 28%-30% height. Strictly NO text in the bottom 25% of the frame.
- **NEGATIVE PROMPT:** software interface, computer screen, UI buttons, flowchart, split screen, grid, collage, text at bottom of image, watermark, deformed hands, extra fingers, blurry typography.`;
}

/**
 * Build Google Flow / Omni Flash 10-second Seamless Loop Motion Prompt
 */
export function buildGoogleFlowMotionPrompt(
  characterOrInput?: string | CoverPromptInput,
  moodTone?: string,
  songTitle?: string,
  lyrics?: string
): string {
  const input: CoverPromptInput =
    typeof characterOrInput === 'object' && characterOrInput !== null
      ? characterOrInput
      : {
          characterSymbol: characterOrInput,
          moodTone,
          songTitle: songTitle || '',
          lyrics: lyrics || '',
        };
  const title = input.songTitle ? input.songTitle.trim() : 'Untitled Song';
  const visual = buildDynamicVisualContext(title, input.lyrics || '', input.characterSymbol, input.moodTone);

  return `Cinematic 9:16 vertical music video background loop for "${title}", 10-second duration, perfectly seamless infinite loop where frame at 10.0s matches 0.0s identically. Locked-off tripod camera, strictly ZERO camera pan, ZERO tilt, ZERO zoom-in, ZERO zoom-out, constant 100% subject scale and position. All Thai title typography and credit text in the upper safe zone remain 100% static, sharp, and locked in place without warping or shimmering. Organic in-place micro-motion synchronized with the song's atmosphere (${visual.mood}): gentle rhythmic chest breathing (3.3-second cycle, 3 full cycles in 10s), soft natural hair and fabric sway in a steady breeze, continuous atmospheric particles and subtle volumetric light rays drifting smoothly. 4K ultra-stable, photorealistic, zero jump cuts, zero morphing.`;
}
