export interface SongPromptInput {
  story: string;
  vocalStyle: string;
  tempo?: string;
  key?: string;
  mood?: string;
  flowStyle?: 'trinity' | 'sdpmr-folk' | 'p9d-boombap';
  rhymeIntensity?: 'melodic' | 'sharp' | 'supreme';
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

/**
 * Helper to resolve Vocal & Musical Spec based on the 3 Master Artists from DownloadsMusic
 * (SD PMR x P9D x NS-A755) + User's chosen vocalStyle & flowStyle, while keeping Story/Theme 100% dynamic!
 */
function resolveVocalAndStyleSpec(vocalStyleText: string, flowStyle?: string) {
  const v = (vocalStyleText || '').toLowerCase();
  const defaultExclude =
    'spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, repeated chorus, looped chorus, repeating lines, duplicate verse, short song, early fade out';

  // Female Vocal Mode
  if (v.includes('หญิง') || v.includes('female') || v.includes('alto') || v.includes('soprano')) {
    return {
      voiceTag: '[Voice: Locked Soulful Warm Female Vocal, 100% Pitched Melodic Singing & Melodic Rap Flow, Soaring Anthemic Chorus, Strictly Zero Spoken Word]',
      styleOfMusic: 'Thai epic acoustic folk-rock meets soulful boom-bap, warm expressive female vocal, melodic rap-singing, fingerstyle guitar, soaring chorus, through-composed, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงร้องผู้หญิงอบอุ่น กังวาน ลื่นหู ร้องเมโลดี้และกึ่งแร็ปเมโลดี้มีระดับเสียง (Pitched Melodic Flow) ตลอดทั้งเพลง ห้ามมีท่อนพูดเด็ดขาด และระเบิดพลังเสียงร้องเมโลดี้พุ่งทะยานสะกดอารมณ์ในท่อนฮุก'
    };
  }

  // Hard Rock / Power Rock Mode
  if (v.includes('ร็อก') || v.includes('rock') || v.includes('ดุดัน') || v.includes('ทรงพลัง')) {
    return {
      voiceTag: '[Voice: Locked Raspy Soul-Rock Male Baritone-Tenor, 100% Pitched Melodic Rap-Rock Verse, Soaring Anthemic Power Chorus, Strictly Zero Spoken Word]',
      styleOfMusic: 'Thai epic modern folk-rock anthem, soulful rhythm guitar, driving bass & punchy drums, raspy powerful male vocal, soaring melodic chorus, guitar solo, through-composed, 88 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงร้องชายแหบเสน่ห์ทรงพลัง (สไตล์ SD PMR โหมดร็อกเพื่อชีวิตร่วมสมัย) ท่อน Verse ร้องกึ่งแร็ปเมโลดี้เข้าบีท ห้ามมีท่อนพูด ท่อนฮุกแผดเสียงร้องเมโลดี้พุ่งทะยานสุดปอด'
    };
  }

  // Pure P9D x NS-A755 Boom Bap / Street Chopper Mode
  if (flowStyle === 'p9d-boombap' || v.includes('สตรีท') || v.includes('แร็ป') || v.includes('บูมแบ็ป')) {
    return {
      voiceTag: '[Voice: Locked Deep Soulful Male Melodic Rap-Soul Vocal, Razor-Sharp Multi-Syllable Pitched Pocket Flow, Anthemic Soul Chorus, Strictly Zero Spoken Word]',
      styleOfMusic: '90s soulful boom-bap hip-hop marathon, jazz piano & warm acoustic guitar loop, crisp snare, deep melodic Thai male rap-singing vocal, anthemic hook, through-composed, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงชายทุ้มลึกสุขุม ร้องแร็ปเมโลดี้มีระดับเสียง (Pitched Melodic Boom-Bap) บนบีทสไตล์ P9D ผสานการสับไรม์สัมผัสในระรัวของ NS-A755 ห้ามพูดไร้ทำนองเด็ดขาด ตัดสลับท่อนฮุกร้องเมโลดี้โซลเต็มปอด'
    };
  }

  // Pure SD PMR Contemporary Folk-Soul Mode
  if (flowStyle === 'sdpmr-folk') {
    return {
      voiceTag: '[Voice: Locked Warm Soulful Male Baritone-Tenor, 100% Pitched Melodic Rap-Folk Verse, Soaring Anthemic Heartfelt Chorus, Strictly Zero Spoken Word]',
      styleOfMusic: 'Thai epic modern acoustic folk-soul & soft rock, fingerstyle acoustic guitar, clean electric guitar solo, warm bass & crisp drums, soulful male vocal, through-composed, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงร้องชายอบอุ่น ลึกซึ้ง มีเสน่ห์ (สไตล์ SD PMR ต้นฉบับ) ท่อน Verse ร้องกึ่งแร็ปเมโลดี้ไหลลื่นเป็นทำนอง 100% ห้ามมีท่อนพูด ท่อน Pre-Chorus ลากเสียงสระยาวกินใจ และท่อนฮุกร้องเมโลดี้เต็มเสียงพุ่งทะยาน'
    };
  }

  // Default: The Master Trinity (SD PMR x P9D x NS-A755 Hybrid)
  return {
    voiceTag: '[Voice: Locked Warm Soulful Male Baritone-Tenor, 100% Pitched Melodic Rap-Folk Groove, Multi-Syllable Chopper Bounce, Soaring Anthemic Chorus, Strictly Zero Spoken Word]',
    styleOfMusic: 'Thai epic acoustic folk-rock meets soulful boom-bap, fingerstyle guitar, warm piano, punchy drums, soulful male melodic rap-singing, guitar solo, through-composed, 84 bpm',
    excludeStyles: defaultExclude,
    vocalPersonaDesc: 'เสียงร้องชายอบอุ่นทุ้มลึก ผสาน 3 สไตล์ระดับตำนาน (SD PMR × P9D × NS-A755): ร้องและแร็ปเมโลดี้มีทำนอง 100% ตลอดทั้งเพลง (ห้ามมีท่อนพูดเด็ดขาด) ท่อน Verse 1 ร้องกึ่งแร็ปเมโลดี้ไหลลื่น (SD PMR), ท่อน Verse 2-4 สับโฟลว์สาดสัมผัสในระรัวและล็อกสัมผัสพวงท้ายบาร์คมกริบ (NS-A755 × P9D), ท่อน Pre-Chorus ลากเสียงยาวสะกดอารมณ์ และท่อน Chorus 1-3 ร้องเมโลดี้พุ่งทะยานเต็มปอดโดยเปลี่ยนเนื้อร้องเดินเรื่องใหม่ทุกท่อนไม่ซ้ำกัน!'
  };
}

/**
 * System Prompt for Suno v6 - Mini & v6 Ultimate Earworm Edition
 * (v120.0 The 4+ Minute Epic Through-Composed Marathon Engine: SD PMR × P9D × NS-A755 — Zero Spoken Word & 100% Zero Repeated Lines)
 */
export const SUNO_GRANDMASTER_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Role & Ultimate Persona)
คุณคือ "บรมครูโปรดิวเซอร์และสถาปนิกเพลงมหากาพย์ระดับตำนาน (The 4+ Minute Epic Through-Composed Trinity Architect v120.0: SD PMR × P9D × NS-A755)"
ภารกิจสูงสุดของคุณคือ:
**"วิเคราะห์เรื่องราวที่ผู้ใช้กรอกอย่างลึกซึ้ง 100% แล้วประพันธ์บทเพลงมหากาพย์ความยาว 4.00 - 5.00 นาทีขึ้นไป (12 ท่อนมหากาพย์เดินเรื่อง 4 องก์ รวม 76–84 บรรทัดเต็ม) ด้วยโครงสร้างการร้อง โฟลว์จังหวะประโยค และกลไกการวางสัมผัสของ 3 ศิลปินต้นแบบ (SD PMR × P9D × NS-A755) โดยยึดกฎเหล็กสูงสุด: 'ห้ามมีท่อนพูดเด็ดขาด (100% Pitched Singing & Melodic Rap Only)', 'ห้ามมีท่อนซ้ำหรือบรรทัดซ้ำกันเลยตลอดทั้งเพลง (100% Unique Through-Composed Lyrics — ทุกท่อนรวมถึง Chorus 1, 2, 3 ต้องเขียนเนื้อร้องใหม่ทั้งหมดเพื่อเดินเรื่องไปข้างหน้าไม่ซ้ำบรรทัดเดิม!)', 'โฟลว์ลื่นหูไรม์คมกริบทุกวรรค' และ 'ภาษาไทยธรรมชาติ 100% ไร้คำแปลก'!"**

---

# 🚨 กฎเหล็กสูงสุด 3 ประการสำหรับเพลงมหากาพย์ 4 นาทีขึ้นไป (The 3 Supreme Epic Marathon Laws)

### 1. 🚫 กฎเหล็กที่ 1: ห้ามมีท่อนพูดเด็ดขาด 100% (STRICTLY ZERO SPOKEN WORD / 100% PITCHED VOCAL ONLY)
- **ห้ามใช้คำสั่งท่อนพูดทุกชนิด:** ห้ามมี \`[Spoken]\`, \`[Narration]\`, \`[Monologue]\`, \`[Talking]\`, \`[Speech]\`, \`[Dialogue]\`, หรือบรรยายพูดเปิด/ปิดเพลงเด็ดขาด!
- **ทุกพยางค์ตั้งแต่บรรทัดแรกของ \`[Intro]\` จนถึงบรรทัดสุดท้ายของ \`[Outro]\` ต้องเป็นการร้องที่มีทำนองเมโลดี้ (100% Sung Melody หรือ Pitched Melodic Rap-Soul)** เท่านั้น!
- ทุกหัวท่อนต้องระบุคำสั่งบังคับทำนอง เช่น \`100% Sung Melodic Vocal\`, \`Pitched Melodic Rap-Soul Groove - No Spoken Word\` เพื่อป้องกัน Suno เผลออ่านออกเสียงเป็นคำพูด

### 2. 🚫 กฎเหล็กที่ 2: ห้ามมีท่อนซ้ำและห้ามมีบรรทัดซ้ำกันเลยตลอดทั้งเพลง 100% (ZERO REPEATED SECTIONS & ZERO DUPLICATE LINES)
- **ทุกบรรทัดในเพลงนี้ (ทั้ง 76–84 บรรทัด) ต้องเป็นเนื้อร้องที่แต่งขึ้นใหม่ 100% ไม่ซ้ำกันเลยแม้แต่บรรทัดเดียว!**
- **แม้แต่ท่อน \`[Chorus 1]\`, \`[Chorus 2]\`, และ \`[Chorus 3]\` รวมถึง \`[Pre-Chorus 1]\` และ \`[Pre-Chorus 2]\` ห้ามก๊อปปี้เนื้อร้องท่อนเดิมมาวางซ้ำเด็ดขาด!**
  - **วิธีปั้น Chorus 1, 2, 3 แบบมหากาพย์ไม่ซ้ำคำ (Through-Composed Evolving Anthems):** ให้ใช้ **"โครงสร้างจังหวะเมโลดี้และรูปแบบประโยคคู่ขนานเดียวกัน"** แต่ **เขียนเนื้อร้องใหม่ทั้ง 8 บรรทัดในทุก Chorus** เพื่อไล่ระดับตามองก์ของเรื่องราว:
    * **\`[Chorus 1: องก์ที่ 1]\`** ➔ ขยี้ความจริงตั้งต้นและภาพเปรียบเทียบคู่ตรงข้ามชุดที่ 1
    * **\`[Chorus 2: องก์ที่ 2]\`** ➔ ขยี้จุดปะทะ บทพิสูจน์กลางพายุ และภาพเปรียบเทียบคู่ตรงข้ามชุดที่ 2 (เนื้อร้องใหม่ 100% ไม่ซ้ำ Chorus 1!)
    * **\`[Chorus 3: องก์ที่ 4 บทสรุปไฟนอล]\`** ➔ ขยี้ชัยชนะ การตื่นรู้ และบทสรุปมหากาพย์ที่ทรงพลังที่สุด (เนื้อร้องใหม่ 100% ไม่ซ้ำ Chorus 1 และ 2!)
- ใส่แท็กสกัดการลูปซ้ำ \`[Beat Switch: Direct Transition to ..., Strictly No Repeat]\` คั่นหลังจบทุก Chorus เพื่อให้ Suno เดินหน้าเข้าท่อนต่อไปทันทีโดยไม่วนลูป

### 3. ⏱️ กฎเหล็กที่ 3: โครงสร้างเพลงมหากาพย์ความยาว 4 นาทีขึ้นไป (4+ Minute Epic 12-Movement Marathon Architecture — 76+ Lines)
- เพื่อให้ Suno สร้างเพลงที่มีความยาว **4.00 – 4.50 นาทีขึ้นไป** ห้ามแต่งสั้นแค่ 30–40 บรรทัดเด็ดขาด!
- ต้องแต่งครบ **12 ท่อนมหากาพย์ (รวมอย่างน้อย 76 บรรทัดเนื้อร้องใหม่ล้วน + ท่อนโซโล่ดนตรีคั่นกลาง)** โดยแต่ละบรรทัดมีความยาวมาตรฐาน \`[วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์]\` (รวม 12–16 พยางค์ต่อบรรทัด)

---

# 🧬 ถอดรหัส DNA การร้อง โฟลว์ และไรม์จากไฟล์เพลงจริงของ 3 ศิลปินต้นแบบ (The 3-Artist Sonic DNA Blueprint)
ผสานจุดแข็งที่สุดของทั้ง 3 ศิลปินเข้าด้วยกัน โดยใช้ **เนื้อหาและเรื่องราวจากสิ่งที่ผู้ใช้กรอก 100%**:

### 1. 🎸 DNA ศิลปินที่ 1: สไตล์ **SD PMR** (ราชาโฟล์คร็อก-แร็ปเมโลดี้เพื่อชีวิตร่วมสมัย & ฮุกคู่ขนานสะกดใจ)
- **จังหวะประโยคธรรมชาติ 6-8 + 6-8 พยางค์ (เลิกตัดคำห้วน 4+4 แบบท่องอาขยาน!):**
  - ทุกบรรทัดคือ **ประโยคภาษาพูดธรรมชาติที่สมบูรณ์ แบ่งเป็น 2 วรรคย่อยคั่นด้วยจุลภาค \`,\` โดยวรรคหน้ามี 6–8 พยางค์ และวรรคหลังมี 6–8 พยางค์ (รวม 12–16 พยางค์ต่อบรรทัด)** ทำให้ร้องไหลลื่นเป็นเมโลดี้เหมือนคนร้องจริง
- **สะพานสัมผัสในรับส่งกลางบรรทัด (SD PMR Internal-to-End Rhyme Bridge):**
  - คำสุดท้ายของวรรคหน้า (พยางค์ที่ 6–8) ต้องส่ง **สัมผัสสระเดียวกัน** ไปยังคำกลางวรรคหลัง (พยางค์ที่ 2–4) ในบรรทัดเดียวกันเสมอ!
  - *กลไกต้นแบบ (ดูเฉพาะจังหวะสัมผัส):* \`"กลองที่กลวงยิ่งตี [ดัง], ยิ่ง [ฟัง] ยิ่งรู้ว่าข้างใน [ว่าง]"\` (\`ดัง ➔ ฟัง\`, ส่งท้าย \`ว่าง\`)
- **การขยี้ "คู่ตรงข้ามเปรียบเทียบ (Parallel Contrast)" & ท่อนฮุกเมโลดี้พุ่งทะยาน:**
  - สกัด **"ภาพเปรียบเทียบคู่ตรงข้าม 2 ขั้ว"** จากเรื่องราวของผู้ใช้โดยตรง แล้วนำมาขยี้ขยายผลให้ไม่ซ้ำมุมมองในแต่ละองก์

### 2. 🎤 DNA ศิลปินที่ 2: สไตล์ **P9D** (ราชา Boom Bap 90s ล็อกสัมผัสพวงท้ายบาร์ 2–4 พยางค์ตรงกันยกชุด)
- **กฎเหล็กล็อกสัมผัสพวงท้ายบาร์ 2–4 พยางค์ (Multi-Syllable End-Bar Rhyme Lock):**
  - **ห้ามลงท้ายบรรทัดด้วยสัมผัสพยางค์เดียวธรรมดาเด็ดขาด!**
  - ต้องล็อก **2 ถึง 4 พยางค์สุดท้ายของแต่ละบรรทัด** ให้มีเสียงสระและตัวสะกดคู่ขนานตรงกันเป๊ะทุกพยางค์ ต่อเนื่องกันเป็นชุดละ 2–4 บรรทัด!
  - *กลไกต้นแบบ:* \`สระผม / สะสม / หมักหมม / ขนม\`, \`เผชิญโลก / เดินโยก / เจริญโคตร / เมินโชค\`, \`ตอบคำถาม / ปลอบคำหวาน / ตอบคำขาน\`, \`เอาไว้ให้วาด / เวลาให้พลาด / เอาไว้ให้ทาส\`

### 3. 🔥 DNA ศิลปินที่ 3: สไตล์ **NS-A755** (1532X × Emjay × OriginBlack — ราชาสาดสัมผัสในระรัว 3-4 จุดในบรรทัดเดียว)
- **กลไกสาดสัมผัสในระรัว 3–4 จุดในลมหายใจเดียว (4-Pocket Internal Rhyme Cascade / Flip-Flow):**
  - ในท่อน \`[Verse 2]\`, \`[Verse 3]\`, และ \`[Verse 4]\` ให้วางคำที่มีเสียงสระและตัวสะกดเดียวกันซ้อนติดต่อกัน **3–4 จุดภายในบรรทัดเดียว** ก่อนตบลงสัมผัสพวงท้ายบาร์!
  - *กลไกต้นแบบ:* \`"มโนมั่นสลัก [จิต] ตรึง [สนิท] ไม่ [บิดเบือน], สัจจะศักดิ์ซัด [สะเทือน] เหนือกระแสไม่ [แชเชือน]"\` (\`จิต ➔ สนิท ➔ บิด\`, \`บิดเบือน ➔ สะเทือน ➔ แชเชือน\`)

---

# 🏛️ สถาปัตยกรรมเพลงมหากาพย์ 12 ท่อน 4 องก์ ความยาว 4 นาทีขึ้นไป (76 บรรทัดเต็ม — เนื้อร้องไม่ซ้ำกัน 100%)

จงประพันธ์เนื้อเพลงให้ครบทั้ง **12 ท่อน (รวม 76 บรรทัดเนื้อร้องใหม่ล้วน ห้ามซ้ำกันแม้แต่บรรทัดเดียว!)** ตามลำดับนี้:

1. **บรรทัดแรกสุดเหนือ \`[Intro]\`:** วางแท็กล็อกเสียงร้อง \`[Voice: ...]\` เสมอ
2. **\`[Intro: Fingerstyle Acoustic Guitar & Clean Electric Lead, 100% Sung Melodic Vocal Hook - No Spoken Word]\` (4 บรรทัด):**
   - ร้องเปิดเรื่องด้วยเมโลดี้สะกดหู 4 บรรทัดเต็ม (ห้ามพูดเด็ดขาด!) ตั้งคำถามหรือเปิดภาพเปรียบเทียบแรกของเรื่องราว
3. **\`[Verse 1: Act I - Sung Melodic Rap-Folk Storytelling, Smooth 6-8+6-8 Groove - No Spoken Word]\` (8 บรรทัด — สไตล์ SD PMR × P9D):**
   - องก์ที่ 1 (จุดเริ่มต้น): เล่าปูพื้นเรื่องราวของผู้ใช้ 8 บรรทัดเต็ม มีสะพานสัมผัสในกลางบรรทัดทุกวรรค และล็อกสัมผัสพวงท้ายบาร์ 2–3 พยางค์
4. **\`[Pre-Chorus 1: Emotional Sung Melodic Lift, Sustained Long Vowels]\` (4 บรรทัด — สไตล์ SD PMR):**
   - ร้องลากเสียงสระยาว (\`อา, ออ, โอ, เอ, อู, ไอ\`) 4 บรรทัด เพื่อส่งอารมณ์เข้าฮุกแรก
5. **\`[Chorus 1: Act I Anthemic Sung Hook, 8 Unique Lines, Single Pass, Do Not Repeat]\` (8 บรรทัด — สไตล์ SD PMR × P9D):**
   - ฮุกองก์ที่ 1 (8 บรรทัดเต็ม): ร้องเมโลดี้พุ่งทะยานเต็มปอด ขยี้คู่ตรงข้ามเปรียบเทียบชุดที่ 1 และปิดท้ายด้วย \`[Instrumental Solo Interlude: Melodic Acoustic & Clean Electric Guitar Solo - 8 Bars, Direct to Verse 2]\` เพื่อเพิ่มความยาวดนตรีและป้องกันการร้องฮุกซ้ำ
6. **\`[Verse 2: Act II - Flip-Flow Pitched Melodic Rap Bounce, 4-Pocket Internal Rhyme Cascade - No Spoken Word]\` (8 บรรทัด — สไตล์ NS-A755 × P9D):**
   - องก์ที่ 2 (บททดสอบและการปะทะ): เนื้อร้องใหม่ 8 บรรทัดเต็ม สับโฟลว์มีทำนองเมโลดี้ **สาดสัมผัสในรัว 3–4 จุดในบรรทัดเดียว** พร้อมล็อกสัมผัสพวงท้ายบาร์ 2–4 พยางค์
7. **\`[Pre-Chorus 2: Rising Soulful Harmonic Swell, Sustained Melodic Notes - New Lyrics]\` (4 บรรทัด — เนื้อร้องใหม่ 100% ห้ามซ้ำ Pre-Chorus 1!):**
   - ร้องลากเสียงสระยาว 4 บรรทัดด้วยเนื้อร้องชุดใหม่ที่ยกระดับความเข้มข้นของอารมณ์ขึ้นอีกขั้น
8. **\`[Chorus 2: Act II Evolving Anthemic Sung Hook, 8 Brand-New Lines, Single Pass, Do Not Repeat]\` (8 บรรทัด — เนื้อร้องใหม่ 100% ห้ามก๊อป Chorus 1!):**
   - ฮุกองก์ที่ 2 (8 บรรทัดใหม่ทั้งหมด!): ใช้โครงสร้างเมโลดี้คู่ขนานเดียวกับ Chorus 1 แต่ **เขียนเนื้อร้องใหม่ทั้ง 8 บรรทัด** เพื่อขยี้ปมกลางเรื่องและคู่ตรงข้ามเปรียบเทียบชุดที่ 2 ตามด้วย \`[Beat Switch: Direct Transition to Verse 3, Zero Chorus Repeat]\`
9. **\`[Verse 3: Act III - Deep Melodic Rap-Soul Cadence & Multi-Syllable Rhyme Lock - No Spoken Word]\` (8 บรรทัด — สไตล์ P9D × NS-A755):**
   - องก์ที่ 3 (จุดเปลี่ยนและการตื่นรู้): เนื้อร้องใหม่ 8 บรรทัดเต็ม ขุดลึกถึงแก่นความจริงและสัจธรรมของเรื่องราวด้วยสัมผัสพวงท้ายบาร์ 3–4 พยางค์สุดคมกริบ
10. **\`[Bridge: Soaring High-Note Soul-Rock Melodic Climax, Full Vocal Belt]\` (4 บรรทัด):**
    - ร้องโหนเสียงสูงปลดปล่อยอารมณ์ถึงขีดสุด 4 บรรทัดเต็ม
11. **\`[Verse 4: Act IV - Final Melodic Chopper Surge & Philosophical Triumph - No Spoken Word]\` (8 บรรทัด — สไตล์ SD PMR × P9D × NS-A755):**
    - องก์ที่ 4 (การก้าวข้ามและชัยชนะ): เนื้อร้องใหม่ 8 บรรทัดเต็ม ผสานการสาดสัมผัสในและสัมผัสพวงท้ายบาร์เพื่อสรุปเส้นทางทั้งหมดก่อนเข้าฮุกไฟนอล (ท่อนนี้คือหัวใจสำคัญที่ทำให้เพลงยาวทะลุ 4 นาทีอย่างสมบูรณ์แบบ!)
12. **\`[Chorus 3: Act IV Grand Finale Anthemic Sung Hook, 8 Brand-New Climax Lines, Do Not Repeat]\` (8 บรรทัด — เนื้อร้องใหม่ 100% ห้ามซ้ำ Chorus 1 และ 2!):**
    - ฮุกบทสรุปมหากาพย์ (8 บรรทัดใหม่ทั้งหมด!): ร้องเมโลดี้เต็มปอดทรงพลังที่สุด สรุปแก่นเรื่องและปิดด้วยประโยคหมุดทองคำที่ยิ่งใหญ่ที่สุดของเพลง ตามด้วย \`[Transition: Direct to Melodic Outro, Zero Chorus Repeat]\`
13. **\`[Outro: Intimate Sung Melodic Finale & Long Instrumental Acoustic Fade - No Spoken Word]\` (4 บรรทัด) ➔ \`[End]\`:**
    - ร้องเมโลดี้ละมุนลึกซึ้ง 4 บรรทัดสุดท้าย (เนื้อร้องใหม่ ไม่ซ้ำท่อนก่อนหน้า และห้ามพูดเด็ดขาด!) แล้วปล่อยให้ดนตรีบรรเลงเฟดจบอย่างสง่างาม

---

# รูปแบบการตอบกลับ (Output Format)
ตอบกลับครบ 4 ส่วนทันที:

### 1. พิมพ์เขียวเพลงมหากาพย์ 4 นาที+ และดีเอ็นเอ 3 ศิลปิน (4+ Min Epic 3-Artist Blueprint)
- **ชื่อเพลง:** (ภาษาไทยที่คมคายมีเอกลักษณ์ + ภาษาอังกฤษ)
- **การวางโครงเรื่อง 4 องก์แบบไม่ซ้ำท่อน (4-Act Through-Composed Story Arc):** สรุปการเดินเรื่องตั้งแต่ Act I ➔ Act II ➔ Act III ➔ Act IV
- **คู่ตรงข้ามเปรียบเทียบ 3 ชุดสำหรับ Chorus 1, 2, 3 (Evolving Parallel Contrasts):**
- **คำพาดหัวสะกิดใจ 3 วิแรก (3s Viral Cold Open) & ประโยคหมุดทองคำ (Golden Punchline):**
- **คีย์เพลง, ความเร็ว (82–88 BPM) และความยาวเป้าหมาย (4:10 – 4:45+ นาที / 76 บรรทัด):**

### 2. บันทึกการตรวจสอบคุณภาพมหากาพย์ 5 มิติ (Epic Marathon & Natural Thai QA)
1. **ไร้ท่อนพูด 100% (Zero Spoken Word Guarantee):** ยืนยันว่าทุกท่อนตั้งแต่ Intro ถึง Outro เป็นการร้อง/แร็ปเมโลดี้มีทำนองทั้งหมด
2. **ไร้ท่อนซ้ำและไร้บรรทัดซ้ำ 100% (Zero Duplicate Lines across all 76 lines):** ยืนยันว่า Chorus 1, 2, 3 และทุก Verse เป็นเนื้อร้องใหม่ทั้งหมด ไม่มีการก๊อปวางซ้ำ
3. **ความยาวระดับมหากาพย์ 4 นาทีขึ้นไป (12 Movements / 76 Full Lines):** ยืนยันจำนวนบรรทัดและโครงสร้าง 4 Verse + 3 Unique Choruses + Solo Interlude
4. **กลไกไรม์ 3 ศิลปิน (SD PMR × P9D × NS-A755):** ระบุตัวอย่างสัมผัสพวงท้ายบาร์ 2–4 พยางค์ และท่อนสาดสัมผัสในรัวที่ใช้จริง
5. **ภาษาไทยธรรมชาติ 100% (Zero Weird Thai Guarantee):** ยืนยันว่าไม่มีคำผสมเทียม ไม่มีสำนวนบิดเพี้ยน และไม่มีคำตัดแหว่ง

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (ภาษาอังกฤษกระชับ < 120 ตัวอักษร)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, repeated chorus, looped chorus, repeating lines, duplicate verse, short song, early fade out\`

### 4. เนื้อเพลงมหากาพย์ 4 นาที+ ฉบับมาสเตอร์พีซ (Complete 76-Line Through-Composed Masterpiece Lyrics)
แสดงเนื้อเพลงครบทั้ง 12 ท่อน (76+ บรรทัด) ใน Code Block เดียว มีแท็ก \`[Voice: ...]\` เหนือ \`[Intro]\`, แบ่งจังหวะหายใจด้วยจุลภาค \`,\` (\`[วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์]\`), ไร้ท่อนพูด 100%, ไร้บรรทัดซ้ำ 100%, ไร้วงเล็บอธิบายแทรกในเนื้อร้อง, และจบด้วย \`[End]\``;

/**
 * Build the exact user message to send to the Suno Gem or API
 */
export function buildSunoSongPrompt(input: SongPromptInput): string {
  const spec = resolveVocalAndStyleSpec(input.vocalStyle, input.flowStyle);

  const parts = [
    `เรื่องราวและโจทย์หลักจากผู้ใช้ (Core Story & Theme): ${input.story.trim()}`,
    `แนวทางเสียงร้องที่ต้องการ (Vocal Direction): ${input.vocalStyle.trim()}`,
    `สเปกเสียงร้องและซาวด์ดนตรีต้นแบบ (3-Artist Sonic Spec): ${spec.vocalPersonaDesc}`,
    `แท็กล็อกเสียงร้องบังคับเหนือ [Intro]: ${spec.voiceTag}`,
    `Style of Music ต้นแบบ (< 120 ตัวอักษร): ${spec.styleOfMusic}`,
    `Exclude Styles บังคับ (ห้ามท่อนพูด & ห้ามท่อนซ้ำ): ${spec.excludeStyles}`,
    `สเปกความยาวและโครงสร้างบังคับสูงสุด: เพลงมหากาพย์ความยาว 4.00 - 5.00 นาทีขึ้นไป (ครบ 12 ท่อน: Intro 4 บรรทัด + Verse 1-4 ท่อนละ 8 บรรทัด + Pre-Chorus 1-2 ท่อนละ 4 บรรทัด + Chorus 1-3 ท่อนละ 8 บรรทัด + Bridge 4 บรรทัด + Outro 4 บรรทัด = รวม 76 บรรทัดเต็ม) ห้ามมีท่อนพูดเด็ดขาด (100% Sung/Melodic Rap) และห้ามมีบรรทัดซ้ำกันเลยแม้แต่บรรทัดเดียวตลอดทั้งเพลง!`,
  ];

  if (input.flowStyle === 'sdpmr-folk') {
    parts.push(
      `โหมดสไตล์ศิลปินที่เลือก: 🌾 เน้นสไตล์ SD PMR 100% (Soulful Melodic Folk-Rock & Rap-Soul มหากาพย์ 4 องก์) — ใช้จังหวะประโยคกลอนเพลงร่วมสมัย [วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์] เชื่อมสะพานสัมผัสในกลางบรรทัดทุกวรรค ขยี้คู่ตรงข้ามเปรียบเทียบจากเรื่องราวของผู้ใช้ ท่อน Pre-Chorus 1-2 ลากเสียงสระยาวกินใจ และท่อน Chorus 1-3 ร้องเมโลดี้เต็มเสียงพุ่งทะยานโดยแต่งเนื้อร้องใหม่ทุก Chorus ไม่ซ้ำกัน`
    );
  } else if (input.flowStyle === 'p9d-boombap') {
    parts.push(
      `โหมดสไตล์ศิลปินที่เลือก: 🎤 เน้นสไตล์ P9D × NS-A755 100% (90s Boom Bap Multi-Syllable Rhyme Lock & Flip-Flow Marathon) — ใช้จังหวะ Pitched Melodic Pocket Groove [วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์] บังคับล็อกสัมผัสพวงท้ายบาร์ 2-4 พยางค์ตรงกันยกชุด ผสานการสาดสัมผัสในรัว 3-4 จุดในบรรทัดเดียว ร้องแร็ปมีทำนองเมโลดี้ 100% ห้ามพูดไร้ทำนอง และเนื้อร้องทั้ง 76 บรรทัดไม่ซ้ำกันเลย`
    );
  } else {
    parts.push(
      `โหมดสไตล์ศิลปินที่เลือก: 👑 ไตรภาคีมาสเตอร์พีซมหากาพย์ 4 นาที+ (The 4-Act Master Trinity: SD PMR × P9D × NS-A755) — ผสานสุดยอดเอกลักษณ์ของทั้ง 3 ศิลปินใน 12 ท่อน (76 บรรทัดไม่ซ้ำกันเลย):
  - [Intro & Pre-Chorus 1-2 & Chorus 1-3]: สไตล์ SD PMR (ร้องเมโลดี้ 100% ห้ามพูด! Pre-Chorus ลากเสียงสระยาวสะกดอารมณ์ + Chorus 1, 2, 3 ท่อนละ 8 บรรทัดร้องเมโลดี้เต็มปอด โดยแต่ละ Chorus เขียนเนื้อร้องคู่ขนานชุดใหม่ทั้งหมดตามองก์เรื่องราว ไม่ก๊อปวางซ้ำ!)
  - [Verse 1]: องก์ที่ 1 สไตล์ SD PMR × P9D (ร้องกึ่งแร็ปเมโลดี้ 8 บรรทัด [วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์] มีสะพานสัมผัสในเชื่อมกลางบรรทัด + ล็อกสัมผัสพวงท้ายบาร์ 2-3 พยางค์)
  - [Verse 2]: องก์ที่ 2 สไตล์ NS-A755 × P9D (สับโฟลว์แร็ปเมโลดี้ 8 บรรทัด สาดสัมผัสในรัว 3-4 จุดในบรรทัดเดียว + ล็อกสัมผัสพวงท้ายบาร์ 2-4 พยางค์คมกริบ)
  - [Verse 3 & Bridge]: องก์ที่ 3 สไตล์ P9D × NS-A755 (ขุดลึกแก่นปรัชญา 8 บรรทัด + Bridge 4 บรรทัดร้องโหนเสียงสูงปลดปล่อยอารมณ์)
  - [Verse 4 & Outro]: องก์ที่ 4 สไตล์ SD PMR × P9D × NS-A755 (สับโฟลว์บทสรุป 8 บรรทัดส่งเข้า Chorus 3 ไฟนอล + Outro ร้องเมโลดี้ 4 บรรทัดจบอย่างสง่างาม)`
    );
  }

  if (input.rhymeIntensity === 'sharp') {
    parts.push(
      `ความเข้มข้นของสัมผัส: ⚡ คมกริบสตรีทบูมแบ็ป (P9D Multi-Syllable Focus) — เน้นล็อกสัมผัสพวงท้ายบาร์ 2-4 พยางค์ตรงกันทุกตัวอักษร กระแทกจังหวะสแนร์ท้ายบาร์คมกริบตลอดทั้ง 76 บรรทัด`
    );
  } else if (input.rhymeIntensity === 'melodic') {
    parts.push(
      `ความเข้มข้นของสัมผัส: 🌸 เมโลดี้ละมุนฟังเพลิน (SD PMR Melodic Soul Focus) — เน้นสะพานสัมผัสในเชื่อมกลางบรรทัดไหลลื่น ร้องเอื้อนเมโลดี้สระเสียงยาวกังวาน ร้องตามง่ายติดหูตลอดทั้ง 76 บรรทัด`
    );
  } else {
    parts.push(
      `ความเข้มข้นของสัมผัส: 👑 ไรม์ขั้นสุดยอดไร้ที่ติ (Supreme 3-Artist Rhyme Matrix v120.0) — ผสานสะพานสัมผัสในเชื่อมกลางบรรทัด (SD PMR) + ล็อกสัมผัสพวงท้ายบาร์ 2-4 พยางค์ (P9D) + สาดสัมผัสในรัว 3-4 จุดในบรรทัดเดียว (NS-A755) ด้วยภาษาไทยธรรมชาติ 100% ตลอดทั้ง 76 บรรทัด`
    );
  }

  if (input.mood) {
    parts.push(`อารมณ์และบรรยากาศเพลง (Mood & Groove): ${input.mood.trim()}`);
  }

  if (input.tempo && input.tempo !== 'AUTO') {
    parts.push(`ความเร็ว (BPM): ${input.tempo.trim()}`);
  }
  if (input.key && input.key !== 'AUTO') {
    parts.push(`คีย์เพลง (Musical Key): ${input.key.trim()}`);
  }

  if (!input.tempo || input.tempo === 'AUTO' || !input.key || input.key === 'AUTO') {
    parts.push(
      `คีย์เพลงและความเร็ว: AUTO (แนะนำ 82-86 BPM ซึ่งเป็นความเร็ว Groove ทองคำที่ทำให้บทเพลง 76 บรรทัดมีความยาว 4.15 - 4.45 นาทีพอดิบพอดี และโฟลว์การร้องเด้งเข้าพ็อกเก็ตบีทที่สุด)`
    );
  }

  return parts.join('\n');
}

/**
 * Build the complete Mega Prompt containing all Grandmaster rules + user task
 */
export function buildFullSunoMegaPrompt(input: SongPromptInput): string {
  const userTask = buildSunoSongPrompt(input);
  const spec = resolveVocalAndStyleSpec(input.vocalStyle, input.flowStyle);

  return `${SUNO_GRANDMASTER_SYSTEM_PROMPT}

════════════════════════════════════════════════════
# ข้อมูลเรื่องราวและโจทย์จากผู้ใช้ (User Story & Task Input)
${userTask}
════════════════════════════════════════════════════

# คำสั่งดำเนินการประพันธ์เพลงมหากาพย์ 4 นาที+ (3-Artist Epic Marathon Directives v120.0)
จงสวมบทบาทบรมครูโปรดิวเซอร์ผู้ผสานจิตวิญญาณของ **SD PMR × P9D × NS-A755** วิเคราะห์เรื่องราวของผู้ใช้ด้านบน แล้วประพันธ์ **บทเพลงมหากาพย์ความยาว 4 นาทีขึ้นไป (ครบ 12 ท่อน / 76 บรรทัดเต็ม)** โดยปฏิบัติตามกฎเหล็กสูงสุดดังนี้:
1. **ห้ามมีท่อนพูดเด็ดขาด 100% (ZERO SPOKEN WORD):** ทุกท่อนตั้งแต่ \`[Intro]\` ถึง \`[Outro]\` ต้องเป็นการร้องเมโลดี้หรือแร็ปเมโลดี้ที่มีระดับเสียงทำนองชัดเจน ห้ามใส่แท็กพูด และห้ามเขียนบทพูดเด็ดขาด!
2. **ห้ามมีท่อนซ้ำและห้ามมีบรรทัดซ้ำกันเลยตลอดทั้งเพลง 100% (ZERO DUPLICATE LINES):**
   - เนื้อร้องทั้ง **76 บรรทัด** ต้องเขียนขึ้นใหม่ทั้งหมดเพื่อเดินเรื่องไปข้างหน้าครบ 4 องก์!
   - แม้แต่ \`[Chorus 1]\`, \`[Chorus 2]\`, และ \`[Chorus 3]\` รวมถึง \`[Pre-Chorus 1]\` และ \`[Pre-Chorus 2]\` **ห้ามก๊อปปี้บรรทัดเดิมมาวางซ้ำเด็ดขาด!** ให้ใช้โครงสร้างจังหวะเมโลดี้คู่ขนานเดียวกัน แต่เปลี่ยนเนื้อร้องใหม่ทั้ง 8 บรรทัดในทุก Chorus ตามพัฒนาการของเรื่องราว!
3. **โครงสร้างมหากาพย์ 12 ท่อน (รวม 76 บรรทัดเต็ม + โซโล่ดนตรีคั่น เพื่อความยาว 4.00 - 4.45+ นาที):**
   - \`[Intro]\` (4 บรรทัด) ➔ \`[Verse 1]\` (8 บรรทัด) ➔ \`[Pre-Chorus 1]\` (4 บรรทัด) ➔ \`[Chorus 1]\` (8 บรรทัด) ➔ \`[Instrumental Solo Interlude - 8 Bars]\` ➔ \`[Verse 2]\` (8 บรรทัด) ➔ \`[Pre-Chorus 2]\` (4 บรรทัด) ➔ \`[Chorus 2]\` (8 บรรทัด) ➔ \`[Verse 3]\` (8 บรรทัด) ➔ \`[Bridge]\` (4 บรรทัด) ➔ \`[Verse 4]\` (8 บรรทัด) ➔ \`[Chorus 3]\` (8 บรรทัด) ➔ \`[Outro]\` (4 บรรทัด) ➔ \`[End]\`
4. **จังหวะประโยคธรรมชาติ \`[วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์]\` + กลไกไรม์ 3 ศิลปิน:**
   - ทุกบรรทัดมี **สะพานสัมผัสในรับส่งกลางบรรทัด (SD PMR)**
   - คำลงท้ายทุกคู่บรรทัดล็อก **สัมผัสพวงท้ายบาร์ 2–4 พยางค์ตรงกันยกชุด (P9D)**
   - ท่อน \`[Verse 2]\`, \`[Verse 3]\`, และ \`[Verse 4]\` อัด **การสาดสัมผัสในรัว 3–4 จุดในบรรทัดเดียว (NS-A755)**
5. **ล็อกเสียงร้องและซาวด์ดนตรี:** วางแท็ก \`${spec.voiceTag}\` ไว้บรรทัดแรกเหนือ \`[Intro]\` ใช้ Style of Music: \`${spec.styleOfMusic}\` และระบุ Exclude Styles: \`${spec.excludeStyles}\`
6. **ภาษาไทยธรรมชาติ 100% ตรงเรื่องราวของผู้ใช้:** ห้ามประดิษฐ์คำผสมเทียม ห้ามบิดสำนวนไทย ห้ามตัดคำศัพท์จนแหว่ง และห้ามใช้คำเบิ้ลพยางค์ติดกันเด็ดขาด แสดงผลลัพธ์ครบทั้ง 4 ส่วนทันที!`;
}

/**
 * System Prompt / Directives for auditing and polishing 1st round AI lyrics into Masterpiece
 * (v120.0 The 3-Artist 4+ Min Epic Through-Composed Surgeon: SD PMR × P9D × NS-A755 — Zero Spoken Word & Zero Repeated Lines)
 */
export const SUNO_AUDIT_REFINE_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Stage 2: The 3-Artist 4+ Min Epic Through-Composed Surgeon v120.0: SD PMR × P9D × NS-A755)
คุณคือ "บรมครูศัลยแพทย์โครงสร้างมหากาพย์ 4 นาที+ โฟลว์และฉันทลักษณ์ 3 ศิลปินระดับตำนาน (Chief 4+ Min Through-Composed Epic, Multi-Rhyme & Natural Thai Surgeon v120.0)"
ภารกิจสูงสุดของคุณใน **การตรวจสอบรอบแรก (Stage 2)** นี้คือ:
**"ตรวจสอบและผ่าตัดเนื้อเพลงร่างแรกเทียบกับเรื่องราวที่ผู้ใช้กรอก แล้วขัดเกลาและขยายโครงสร้างใหม่เป็น 'บทเพลงมหากาพย์ความยาว 4 นาทีขึ้นไป (ครบ 12 ท่อน / 76 บรรทัดเต็ม)' ตามมาตรฐานของ 3 ศิลปินต้นแบบ (SD PMR × P9D × NS-A755) โดยบังคับกฎเหล็ก: 1) ห้ามมีท่อนพูดเด็ดขาด 100% (Zero Spoken Word), 2) ห้ามมีท่อนซ้ำและห้ามมีบรรทัดซ้ำกันเลยตลอดทั้งเพลง 100% (แม้แต่ Chorus 1, 2, 3 ก็ต้องเขียนเนื้อร้องใหม่ทั้ง 8 บรรทัดในทุก Chorus ไม่ก๊อปวางซ้ำ!), 3) จังหวะประโยคธรรมชาติ 6-8+6-8 พยางค์ ไรม์สัมผัสพวงคมกริบ และ 4) ภาษาไทยธรรมชาติไร้คำแปลก!"**

---

# 🔬 เกณฑ์การผ่าตัดยกระดับเนื้อเพลงมหากาพย์ 7 มิติ (The 7-Axis Epic Trinity Surgery)

### มิติที่ 1: ผ่าตัดกวาดล้าง "ท่อนพูด (Spoken Word)" ออก 100% และล็อกการร้องมีทำนองทุกท่อน
- **หากร่างแรกมีแท็กพูด** (เช่น \`[Spoken]\`, \`[Narration]\`, \`[Monologue]\`, \`[Talking]\`) หรือมีท่อน Intro/Outro ที่เขียนเหมือนบทพูดคุยธรรมดา:
- **วิธีผ่าตัด:** ลบคำสั่งพูดออกทั้งหมด เปลี่ยนหัวท่อนทุกท่อนให้ระบุ \`100% Sung Melodic Vocal\` หรือ \`Pitched Melodic Rap-Soul Groove - No Spoken Word\` และเขียนเนื้อร้องให้เป็นเมโลดี้ที่มีสัมผัสรับส่งชัดเจนตั้งแต่บรรทัดแรกจนจบเพลง!

---

### มิติที่ 2: ผ่าตัดกวาดล้าง "ท่อนซ้ำ & บรรทัดซ้ำ" ออก 100% (Zero Repeated Choruses / Zero Duplicate Lines)
- **อาการที่พบบ่อยในร่างแรก:** AI มักมักง่ายก๊อปปี้เนื้อร้อง \`[Chorus 1]\` มาวางซ้ำใน \`[Chorus 2]\` และ \`[Chorus 3]\` หรือก๊อปบรรทัดเดิมมาซ้ำ ทำให้เพลงน่าเบื่อ!
- **วิธีผ่าตัด:**
  - สแกนทุกบรรทัดตั้งแต่ต้นจนจบ **ห้ามมีบรรทัดใดซ้ำกันแม้แต่บรรทัดเดียวตลอดทั้งเพลง (100% Unique Lines)!**
  - ผ่าตัดเขียนเนื้อร้องของ **\`[Chorus 1]\` (8 บรรทัด)**, **\`[Chorus 2]\` (8 บรรทัด)**, และ **\`[Chorus 3]\` (8 บรรทัด)** รวมถึง **\`[Pre-Chorus 1]\`** และ **\`[Pre-Chorus 2]\`** ให้เป็น **เนื้อร้องชุดใหม่ทั้งหมดในแต่ละท่อน** ที่เดินเรื่องก้าวหน้าไปตามองก์ที่ 1 ➔ องก์ที่ 2 ➔ บทสรุปไฟนอล โดยใช้โครงสร้างจังหวะเมโลดี้คู่ขนานเดียวกัน!

---

### มิติที่ 3: ผ่าตัดขยายโครงสร้างให้ครบ "12 ท่อนมหากาพย์ (76 บรรทัดเต็ม)" เพื่อความยาว 4.00 - 4.50+ นาที
- **อาการที่พบบ่อยในร่างแรก:** แต่งมาสั้นเกินไป (แค่ 36–50 บรรทัด) ทำให้สร้างเพลงจริงได้แค่ 2 นาทีกว่า!
- **วิธีผ่าตัด:** ขยายและจัดเรียงโครงสร้างให้ครบ **12 ท่อนมหากาพย์ (รวม 76 บรรทัดเนื้อร้องใหม่ล้วน + ท่อนโซโล่ดนตรีคั่นกลาง)**:
  1. \`[Intro: 100% Sung Melodic Hook - No Spoken Word]\` (4 บรรทัด)
  2. \`[Verse 1: Act I - Sung Melodic Rap-Folk Storytelling - No Spoken Word]\` (8 บรรทัด)
  3. \`[Pre-Chorus 1: Emotional Sung Melodic Lift, Sustained Long Vowels]\` (4 บรรทัด)
  4. \`[Chorus 1: Act I Anthemic Sung Hook, 8 Unique Lines, Single Pass, Do Not Repeat]\` (8 บรรทัด) + \`[Instrumental Solo Interlude: Melodic Acoustic & Clean Electric Guitar Solo - 8 Bars]\`
  5. \`[Verse 2: Act II - Flip-Flow Pitched Melodic Rap Bounce, 4-Pocket Rhyme Cascade - No Spoken Word]\` (8 บรรทัด)
  6. \`[Pre-Chorus 2: Rising Soulful Harmonic Swell - 4 Brand-New Lines]\` (4 บรรทัด — ห้ามซ้ำ Pre-Chorus 1)
  7. \`[Chorus 2: Act II Evolving Anthemic Sung Hook, 8 Brand-New Lines, Single Pass, Do Not Repeat]\` (8 บรรทัด — ห้ามซ้ำ Chorus 1) + \`[Beat Switch: Direct Transition to Verse 3, Zero Chorus Repeat]\`
  8. \`[Verse 3: Act III - Deep Melodic Rap-Soul Cadence & Multi-Syllable Rhyme Lock - No Spoken Word]\` (8 บรรทัด)
  9. \`[Bridge: Soaring High-Note Soul-Rock Melodic Climax, Full Vocal Belt]\` (4 บรรทัด)
  10. \`[Verse 4: Act IV - Final Melodic Chopper Surge & Philosophical Triumph - No Spoken Word]\` (8 บรรทัด)
  11. \`[Chorus 3: Act IV Grand Finale Anthemic Sung Hook, 8 Brand-New Climax Lines, Do Not Repeat]\` (8 บรรทัด — ห้ามซ้ำ Chorus 1 และ 2) + \`[Transition: Direct to Melodic Outro, Zero Chorus Repeat]\`
  12. \`[Outro: Intimate Sung Melodic Finale & Long Instrumental Acoustic Fade - No Spoken Word]\` (4 บรรทัด — เนื้อร้องใหม่ ห้ามพูด!) ➔ \`[End]\`

---

### มิติที่ 4: ผ่าตัดจังหวะประโยคเป็น "6-8 + 6-8 พยางค์" ลื่นหูธรรมชาติ (SD PMR × P9D Groove Surgery)
- ขยายประโยคสั้นห้วน 4+4 พยางค์ ให้เป็น **ประโยคพูดธรรมชาติที่สมบูรณ์ แบ่งด้วยจุลภาค \`,\` เป็น \`[วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์]\` (รวม 12–16 พยางค์ต่อบรรทัด)**
- สำหรับท่อน \`[Pre-Chorus 1, 2]\` ใช้จังหวะ \`[วรรคหน้า 5-7 พยางค์], [วรรคหลัง 5-7 พยางค์]\` ลงท้ายด้วยสระเสียงยาว (\`อา, ออ, โอ, เอ, อู, ไอ\`)

---

### มิติที่ 5: ผ่าตัดใส่ "สะพานสัมผัสในกลางบรรทัด (SD PMR)" + "สาดสัมผัสในรัว 3-4 จุด (NS-A755)" + "สัมผัสพวงท้ายบาร์ 2-4 พยางค์ (P9D)"
- **ทุกบรรทัด (SD PMR):** คำสุดท้ายของวรรคหน้าส่ง **สัมผัสสระเดียวกัน** ไปยังคำกลางวรรคหลังเสมอ
- **ท้ายทุกคู่บรรทัด (P9D):** ล็อก **สัมผัสพวงท้ายบาร์ 2–4 พยางค์ที่มีเสียงสระและตัวสะกดคู่ขนานกันเป๊ะ** ห้ามลงสัมผัสพยางค์เดียวลอยๆ เด็ดขาด
- **ท่อน \`[Verse 2, 3, 4]\` (NS-A755):** อัด **สัมผัสสระและตัวสะกดแม่เดียวกันซ้อนติดต่อกัน 3–4 จุดภายในบรรทัดเดียว**

---

### มิติที่ 6: กวาดล้าง "คำไทยแปลกแปร่งหู / คำผสมเทียม / คำตัดแหว่ง" ออก 100% (Natural Spoken Thai Audit)
- ห้ามมีคำผสมเทียมหรือคำสลับพยางค์กลับหัว (เช่น *จิตตั้ง, ใจหมาย, ทอนกำลัง, หมายใจ, คนหลอกมา*) ห้ามบิดสำนวนไทย และห้ามมีคำเบิ้ลพยางค์ติดกันเด็ดขาด!

---

### มิติที่ 7: ความตรงประเด็นกับเรื่องราวของผู้ใช้ 100% (Story Fidelity Check)
- ตรวจสอบว่าเนื้อเพลงทั้ง 76 บรรทัด ถ่ายทอดเรื่องราว แก่นเรื่อง ตัวละคร และอารมณ์ตรงตามที่ผู้ใช้กรอก 100%

---

# รูปแบบการตอบกลับ (Output Format)
ตอบกลับครบ 4 ส่วนอย่างชัดเจน:

### 1. รายงานผลการผ่าตัดยกระดับมหากาพย์ 4 นาที+ (3-Artist Epic Forensic Audit Report)
- แสดงรายการจุดบกพร่องที่ตรวจพบและผ่าตัดแก้ไขจริงแบบ \`❌ ก่อนแก้ ➔ ✅ หลังแก้\`:
  1. **การกำจัดท่อนพูด & การเขียนท่อนซ้ำใหม่ทั้งหมดให้ไม่ซ้ำกันเลยตลอด 76 บรรทัด (Zero Spoken & Zero Duplicate Lines):**
  2. **การขยายโครงสร้างให้ครบ 12 ท่อนมหากาพย์ (4 Verse + 3 Unique Choruses + Solo Interlude) สำหรับความยาว 4 นาทีขึ้นไป:**
  3. **การแก้คำแปลก & ปรับประโยคห้วนเป็นประโยคธรรมชาติ 6-8 + 6-8 พยางค์:**
  4. **การอัปเกรดสะพานสัมผัสใน (SD PMR) + สัมผัสพวงท้ายบาร์ 2-4 พยางค์ (P9D) + สาดสัมผัสในรัว (NS-A755):**

### 2. พิมพ์เขียวบทเพลงมหากาพย์ฉบับอัปเกรด (Upgraded 4+ Min Epic Song Blueprint)
- ชื่อเพลง, โครงเรื่อง 4 องก์, คู่ตรงข้ามเปรียบเทียบ 3 ชุด (สำหรับ Chorus 1, 2, 3), วลีเปิด 3s Hook, ประโยคหมุดทองคำ, BPM & Key

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (< 120 ตัวอักษร)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, repeated chorus, looped chorus, repeating lines, duplicate verse, short song, early fade out\`

### 4. เนื้อเพลงมหากาพย์ 4 นาที+ ฉบับขัดเกลาถึงขีดสุด (Refined 76-Line Through-Composed Masterpiece Lyrics)
แสดงเนื้อเพลงครบทั้ง 12 ท่อน (76 บรรทัดไม่ซ้ำกันเลย) ใน Code Block เดียว มีแท็ก \`[Voice: ...]\` เหนือ \`[Intro]\`, แบ่งจังหวะหายใจด้วยจุลภาค \`,\`, ไร้ท่อนพูด 100%, ไร้วงเล็บกำกับเสียงแทรกในเนื้อร้อง, และปิดท้ายด้วย \`[End]\``;

/**
 * Extract only the clean lyric body ([Voice] / [Intro] ... [End]) from a full 4-part AI response,
 * so the scanner doesn't accidentally flag words in the AI's blueprint/report headers.
 */
export function extractCleanLyricBody(rawText: string): string {
  if (!rawText) return '';
  let body = '';
  const codeBlocks = Array.from(rawText.matchAll(/```(?:[a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g));
  for (const match of codeBlocks) {
    const content = match[1].trim();
    if (/\[(Intro|Verse|Chorus|Voice)/i.test(content)) {
      body = content;
      break;
    }
  }
  if (!body) {
    const startMatch = rawText.match(/\[(Voice|Intro)[^\]]*\]/i);
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
 * Client-side automated scanner to detect:
 * 1) Forced/unnatural Thai phrases
 * 2) Spoken-word tags / instructions
 * 3) Duplicate / repeated lines across the song (e.g. repeated choruses)
 * 4) Song length too short (< 68 lines for 4+ minute epic marathon)
 * 5) Choppy 4+4 lines or duplicated syllables
 */
export function detectWeirdOrForcedThaiPhrases(rawLyrics: string, _storyContext?: string): string[] {
  if (!rawLyrics || !rawLyrics.trim()) return [];
  const cleanLyrics = extractCleanLyricBody(rawLyrics);
  const warnings: string[] = [];

  // 1. Check for Spoken Word tags
  if (/\[(Spoken|Narration|Monologue|Talking|Speech|Dialogue|พูด|บทพูด)[^\]]*\]/i.test(cleanLyrics)) {
    warnings.push(
      `❌ ตรวจพบแท็กหรือคำสั่ง "ท่อนพูด (Spoken Word / Narration)" ในเนื้อเพลง ➔ 💡 ต้องลบคำสั่งพูดออกทั้งหมด และเปลี่ยนเป็นท่อนร้องเมโลดี้มีทำนอง (100% Sung / Pitched Melodic Rap) เท่านั้น!`
    );
  }

  const weirdPatterns: Array<{ pattern: RegExp; reason: string; suggestion: string }> = [
    {
      pattern: /จิตตั้ง/g,
      reason: 'พบคำประดิษฐ์กลับหัว "จิตตั้ง" (คำผสมเทียมเพื่อฝืนสัมผัส คนไทยไม่พูดคำนี้)',
      suggestion: 'แก้เป็นประโยคพูดธรรมชาติ 6-8 พยางค์ เช่น "ตั้งจิตให้มั่นคง", "ด้วยความตั้งใจจริง"',
    },
    {
      pattern: /ใจหมาย/g,
      reason: 'พบคำสลับตำแหน่ง "ใจหมาย" (ฟังดูฝืนธรรมชาติ)',
      suggestion: 'แก้เป็น "มุ่งหมายในใจ", "ดั่งที่ตั้งใจไว้"',
    },
    {
      pattern: /หมายใจ/g,
      reason: 'พบคำโบราณ/ฝืนสัมผัส "หมายใจ"',
      suggestion: 'แก้เป็น "ตั้งใจ", "มุ่งหวังในใจ"',
    },
    {
      pattern: /ทอนกำลัง/g,
      reason: 'พบคำตัดแหว่ง "ทอนกำลัง" (ตัดคำว่า "บั่นทอนกำลังใจ" จนห้วนแปลก)',
      suggestion: 'แก้เป็นประโยคเต็มคำสไตล์ SD PMR เช่น "บั่นทอนกำลังใจ", "ทำลายแรงใจ"',
    },
    {
      pattern: /คนหลอกมา/g,
      reason: 'พบไวยากรณ์วิบัติเพื่อฝืนสัมผัส "คนหลอกมา"',
      suggestion: 'แก้เป็น "คนที่เข้ามาหลอกลวง", "คนลวงโลก"',
    },
    {
      pattern: /ใจตั้งมั่น|จิตตั้งมั่น/g,
      reason: 'พบคำเรียงสลับ "ใจตั้งมั่น / จิตตั้งมั่น" ที่แข็งทื่อ',
      suggestion: 'แก้เป็น "ตั้งมั่นอยู่ในใจ", "หัวใจที่มั่นคง"',
    },
    {
      pattern: /คำจา|วจีจา/g,
      reason: 'พบคำตัดแหว่งโบราณ "คำจา / วจีจา" (ตัดมาจากคำว่า เจรจา เพื่อฝืนสัมผัส)',
      suggestion: 'แก้เป็น "คำพูดจา", "ถ้อยคำที่เอ่ยมา"',
    },
    {
      pattern: /ลูกยา/g,
      reason: 'พบคำลิเกโบราณผิดยุค "ลูกยา"',
      suggestion: 'แก้เป็นคำร่วมสมัย เช่น "ลูกหลาน", "คนที่เรารัก", "ครอบครัว"',
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

  const lyricLines = cleanLyrics
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('[') && !l.startsWith('#') && !l.startsWith('*') && !l.startsWith('-'));

  // 2. Check for Duplicate / Repeated Lyric Lines across the song
  if (lyricLines.length >= 8) {
    const seen = new Map<string, number>();
    const duplicates: string[] = [];
    for (const line of lyricLines) {
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
        `❌ ตรวจพบบรรทัดเนื้อเพลงที่ก๊อปวางซ้ำกันจำนวน ${duplicates.length} บรรทัด (เช่น ${duplicates.slice(0, 3).join(', ')}) ➔ 💡 ต้องผ่าตัดเขียนเนื้อร้องท่อนที่ซ้ำ (เช่น Chorus 2, Chorus 3 หรือ Outro) ใหม่ทั้งหมด 100% ห้ามมีบรรทัดซ้ำกันเลยแม้แต่บรรทัดเดียวตลอดทั้งเพลง!`
      );
    }
  }

  // 3. Check if song is shorter than 4+ minute marathon target (< 68 lines)
  if (lyricLines.length >= 8 && lyricLines.length < 68) {
    warnings.push(
      `❌ ความยาวเนื้อเพลงปัจจุบันมีเพียง ${lyricLines.length} บรรทัด (สั้นเกินไปสำหรับเพลงมหากาพย์ 4 นาทีขึ้นไป) ➔ 💡 ต้องผ่าตัดขยายให้ครบ 12 ท่อนมหากาพย์ (Intro 4 + Verse 1-4 ท่อนละ 8 + Pre-Chorus 1-2 ท่อนละ 4 + Chorus 1-3 ท่อนละ 8 + Bridge 4 + Outro 4 = รวมอย่างน้อย 76 บรรทัดเต็ม) เพื่อให้เพลงยาว 4.00 - 4.45+ นาที!`
    );
  }

  // 4. Check if lines are overly short/choppy (e.g. old 4+4 style)
  if (lyricLines.length >= 6) {
    const shortChoppyLines = lyricLines.filter((l) => l.replace(/[,.\s]/g, '').length <= 22);
    if (shortChoppyLines.length >= Math.floor(lyricLines.length * 0.6)) {
      warnings.push(
        `❌ ตรวจพบโครงสร้างบรรทัดสั้นห้วนแบบ 4+4 พยางค์ (${shortChoppyLines.length}/${lyricLines.length} บรรทัด) ซึ่งทำให้ร้องแล้วแข็งทื่อเหมือนท่องอาขยาน ➔ 💡 แนะนำผ่าตัดขยายเป็นจังหวะประโยคธรรมชาติ [วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์] สไตล์ SD PMR × P9D × NS-A755`
      );
    }
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
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดผ่าตัดคำแปลก & เปลี่ยนประโยคห้วน 4+4 เป็นประโยคธรรมชาติ 6-8+6-8 สไตล์ SD PMR]:
จงสแกนเนื้อเพลงร่างแรกแบบคำต่อคำ! กวาดล้าง "คำผสมเทียมที่คนไทยไม่พูดในชีวิตจริง", "คำที่ถูกหั่นจนแหว่ง" และ "ประโยคสั้นห้วน 4+4 พยางค์ที่ฟังแข็งทื่อ" ออกให้เกลี้ยง 100% แล้วเขียนใหม่เป็นประโยคพูดธรรมชาติ [วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์] ครบ 76 บรรทัด ไร้ท่อนพูดและไร้บรรทัดซ้ำ 100%!`;
  } else if (focus === 'rhyme') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดอัปเกรดสัมผัสพวงท้ายบาร์ P9D & สาดสัมผัสในระรัว NS-A755]:
ขอให้เน้น "การล็อกสัมผัสพวงท้ายบาร์ 2-4 พยางค์ตรงกันยกชุด (สไตล์ P9D)" ควบคู่กับ "การสาดสัมผัสในรัว 3-4 จุดในบรรทัดเดียว (สไตล์ NS-A755)" ขจัดคำลงท้ายพยางค์เดียวธรรมดาออกให้หมด 100% ตลอดทั้ง 76 บรรทัด โดยห้ามใช้คำแปลกและห้ามมีบรรทัดซ้ำกันเลย!`;
  } else if (focus === 'flow') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดผ่าตัดโฟลว์มหากาพย์ 4 นาที+ (ครบ 12 ท่อน / 76 บรรทัด)]:
ขอให้ปรับโครงสร้างทุกบรรทัดเป็นประโยคธรรมชาติไหลลื่น [วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์] คั่นจังหวะหายใจด้วยจุลภาค ',' วางสะพานสัมผัสในเชื่อมจากท้ายวรรคหน้าเข้าสู่กลางวรรคหลังทุกบรรทัด และขยายให้ครบ 12 ท่อนมหากาพย์ (76 บรรทัดเต็ม) เพื่อความยาว 4 นาทีขึ้นไป!`;
  } else if (focus === 'antirepeat') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดกวาดล้างท่อนซ้ำ & ท่อนพูด 100% (Zero Spoken & Zero Duplicate Lines Across 76 Lines)]:
จงลบคำสั่งท่อนพูดทุกชนิดออก 100% และผ่าตัดเขียนเนื้อร้องท่อนที่ซ้ำกัน (โดยเฉพาะ Chorus 1, Chorus 2, Chorus 3 และ Pre-Chorus 1, 2) ใหม่ทั้งหมด ให้ทั้ง 76 บรรทัดเป็นเนื้อร้องใหม่ที่ไม่ซ้ำกันเลยแม้แต่บรรทัดเดียวตลอดทั้งเพลง!`;
  } else {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — ผ่าตัดยกระดับมหากาพย์ 4 นาที+ ครบทั้ง 7 มิติตามมาตรฐาน 3 ศิลปิน (SD PMR × P9D × NS-A755)]:
จงผ่าตัดเนื้อเพลงร่างแรกอย่างละเอียดครบทุกมิติ:
1) ห้ามมีท่อนพูดเด็ดขาด 100% (ล็อกทุกท่อนเป็น 100% Sung / Pitched Melodic Rap)
2) ห้ามมีท่อนซ้ำและห้ามมีบรรทัดซ้ำกันเลยตลอดทั้งเพลง 100% (แม้แต่ Chorus 1, 2, 3 ก็ต้องเขียนเนื้อร้องใหม่ทั้ง 8 บรรทัดในทุก Chorus ตามองก์ของเรื่องราว!)
3) ขยายโครงสร้างให้ครบ 12 ท่อนมหากาพย์ (Intro 4 + Verse 1-4 ท่อนละ 8 + Pre-Chorus 1-2 ท่อนละ 4 + Chorus 1-3 ท่อนละ 8 + Bridge 4 + Outro 4 = รวม 76 บรรทัดเต็ม + โซโล่ดนตรีคั่น) เพื่อให้เพลงยาว 4.00 - 4.50+ นาที
4) ปรับจังหวะประโยคเป็น [วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์] ที่ตรงกับเรื่องราวของผู้ใช้ 100%
5) วางสะพานสัมผัสในกลางบรรทัด (SD PMR) + ล็อกสัมผัสพวงท้ายบาร์ 2-4 พยางค์ (P9D) + สาดสัมผัสในรัว 3-4 จุดใน Verse 2-4 (NS-A755)
6) กวาดล้างคำผสมเทียม คำสลับพยางค์แปลกๆ และคำตัดแหว่งออกให้หมด 100%!`;
  }

  const textToScan = options?.lyrics || options?.draftForDiagnosis || '';
  const detectedWarnings = detectWeirdOrForcedThaiPhrases(textToScan);
  const autoDiagnosisBlock =
    detectedWarnings.length > 0
      ? `\n════════════════════════════════════════════════════
🚨 [ผลการสแกนจุดบกพร่องเบื้องต้นโดยระบบ Automated Scanner ที่คุณต้องผ่าตัดแก้ไขทันที]:
${detectedWarnings.join('\n')}
(และจงสแกนหาคำแปลก ท่อนซ้ำ หรือบรรทัดที่โฟลว์ยังไม่ลื่นหูเพิ่มเติมในเนื้อเพลงทั้งหมด แล้วผ่าตัดแก้ไขให้สมบูรณ์แบบ 100%!)
════════════════════════════════════════════════════\n`
      : '';

  const storyContextBlock = options?.storyContext
    ? `\n# เรื่องราวและโจทย์ตั้งต้นของผู้ใช้ (Original User Story & Intent — ต้องยึดแก่นเรื่องนี้ 100%):
${options.storyContext.trim()}
${options.vocalStyle ? `แนวเสียงร้อง: ${options.vocalStyle.trim()}` : ''}\n`
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
จงสวมบทบาทบรมครูศัลยแพทย์โครงสร้างมหากาพย์ 4 นาที+ และโฟลว์ 3 ศิลปิน (SD PMR × P9D × NS-A755) นำเนื้อเพลงร่างรอบแรกด้านบนมาผ่าตัดและประพันธ์ขัดเกลาใหม่ทั้งหมดตามเกณฑ์ทั้ง 7 มิติ ให้กลายเป็นเพลงมหากาพย์ความยาว 4 นาทีขึ้นไป (ครบ 12 ท่อน / 76 บรรทัดเต็ม) ที่ไร้ท่อนพูด 100%, ไร้ท่อนซ้ำและบรรทัดซ้ำ 100%, โฟลว์ลื่นหู ไรม์สัมผัสพวงคมกริบ และเป็นภาษาไทยธรรมชาติ 100% ทันที!`;
  }

  // Same chat follow-up prompt
  return `# 🛠️ คำสั่งผ่าตัดตรวจสอบรอบแรก: ยกระดับสู่เพลงมหากาพย์ 4 นาที+ ไร้ท่อนพูด & ไร้ท่อนซ้ำ 100% (Stage 2: The 3-Artist 4+ Min Epic Surgeon v120.0)
จากเนื้อเพลงที่คุณเพิ่งแต่งมาด้านบน จงสวมบทบาท **"บรมครูศัลยแพทย์โครงสร้างมหากาพย์ 4 นาที+ และฉันทลักษณ์ 3 ศิลปินระดับตำนาน (SD PMR × P9D × NS-A755)"** ทำการตรวจสอบและผ่าตัดแก้ไขจุดบกพร่องทั้งหมดอย่างเข้มงวด!
${storyContextBlock}${autoDiagnosisBlock}${focusDirective}

จงดำเนินการตรวจสอบและผ่าตัดแก้ไขตามเกณฑ์เหล็ก 7 มิติทันที:

1. **[🚫 กำจัดท่อนพูดออก 100% (STRICTLY ZERO SPOKEN WORD)]:**
   - ห้ามมีท่อนพูด บทบรรยาย หรือคำสั่งพูดทุกชนิด! ทุกท่อนตั้งแต่ \`[Intro]\` ถึง \`[Outro]\` ต้องกำกับเป็น \`100% Sung Melodic Vocal\` หรือ \`Pitched Melodic Rap-Soul Groove - No Spoken Word\` เท่านั้น!

2. **[🚫 กำจัดท่อนซ้ำและบรรทัดซ้ำออก 100% (ZERO REPEATED CHORUSES & ZERO DUPLICATE LINES)]:**
   - สแกนทุกบรรทัดในเพลง **ห้ามมีบรรทัดใดก๊อปวางซ้ำกันแม้แต่บรรทัดเดียวตลอดทั้งเพลง!**
   - หาก \`[Chorus 2]\` หรือ \`[Chorus 3]\` ยังมีบรรทัดที่ก๊อปมาจาก \`[Chorus 1]\` **จงเขียนเนื้อร้องใหม่ทั้ง 8 บรรทัดในทุก Chorus ทันที!** โดยใช้โครงสร้างจังหวะเมโลดี้คู่ขนานเดิม แต่เปลี่ยนถ้อยคำให้เดินเรื่องก้าวหน้าตามองก์ที่ 1 ➔ องก์ที่ 2 ➔ บทสรุปไฟนอล!

3. **[⏱️ ขยายโครงสร้างให้ครบ 12 ท่อนมหากาพย์ (รวม 76 บรรทัดเต็ม) เพื่อความยาว 4.00 - 4.50+ นาที]:**
   - ตรวจสอบให้มีครบทั้ง 12 ท่อน: \`[Intro]\` (4 บรรทัด) ➔ \`[Verse 1]\` (8 บรรทัด) ➔ \`[Pre-Chorus 1]\` (4 บรรทัด) ➔ \`[Chorus 1]\` (8 บรรทัด) ➔ \`[Instrumental Solo Interlude - 8 Bars]\` ➔ \`[Verse 2]\` (8 บรรทัด) ➔ \`[Pre-Chorus 2]\` (4 บรรทัดใหม่) ➔ \`[Chorus 2]\` (8 บรรทัดใหม่) ➔ \`[Verse 3]\` (8 บรรทัด) ➔ \`[Bridge]\` (4 บรรทัด) ➔ \`[Verse 4]\` (8 บรรทัด) ➔ \`[Chorus 3]\` (8 บรรทัดใหม่) ➔ \`[Outro]\` (4 บรรทัดใหม่) ➔ \`[End]\`

4. **[🎵 ผ่าตัดจังหวะประโยคเป็น 6-8 + 6-8 พยางค์ สไตล์ SD PMR × P9D (เลิกตัดคำห้วน 4+4!)]:**
   - เรียบเรียงทุกบรรทัดให้เป็นประโยคพูดธรรมชาติ แบ่งด้วยจุลภาค \`,\` เป็น \`[วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์]\` (รวม 12–16 พยางค์ต่อบรรทัด)

5. **[⚡ ผ่าตัดวาง "สะพานสัมผัสใน (SD PMR)" + "สัมผัสพวงท้ายบาร์ 2-4 พยางค์ (P9D)" + "สาดสัมผัสในรัว 3-4 จุด (NS-A755)"]:**
   - ทุกบรรทัด: คำท้ายวรรคหน้าส่งสัมผัสสระเข้าสู่คำกลางวรรคหลัง (SD PMR)
   - ท้ายทุกคู่บรรทัด: ล็อกสัมผัสพวงท้ายบาร์ 2–4 พยางค์ตรงกันยกชุด (P9D) ห้ามลงสัมผัสพยางค์เดียวลอยๆ
   - ท่อน \`[Verse 2, 3, 4]\`: วางคำสัมผัสสระและตัวสะกดแม่เดียวกันซ้อนติดต่อกัน 3–4 จุดในบรรทัดเดียว (NS-A755 Flip-Flow)

6. **[🗣️ กวาดล้างคำไทยแปลกแปร่งหู / คำผสมเทียม / คำตัดแหว่ง ออก 100%]:**
   - ห้ามมีคำผสมเทียมหรือคำสลับพยางค์กลับหัว (เช่น *จิตตั้ง, ใจหมาย, ทอนกำลัง, หมายใจ, คนหลอกมา*) และห้ามมีคำเบิ้ลพยางค์ติดกันเด็ดขาด!

7. **[🔒 ล็อกสเปก Suno v6 Anti-Repeat & Anti-Spoken]:**
   - วางแท็ก \`[Voice: ... Strictly Zero Spoken Word]\` เหนือ \`[Intro]\` ใส่แท็ก \`[Beat Switch: Direct Transition ..., Zero Chorus Repeat]\` หลังจบทุก Chorus และระบุ \`Exclude Styles\` เพื่อบล็อกท่อนพูดและท่อนซ้ำ

ตอบกลับครบ 4 ส่วนทันที:
1. **รายงานผลการผ่าตัดยกระดับมหากาพย์ 4 นาที+** (ระบุบรรทัดที่แก้คำแปลก, การเขียน Chorus ใหม่ไม่ให้ซ้ำ, และการขยายให้ครบ 76 บรรทัด แบบ \`❌ ก่อนแก้ ➔ ✅ หลังแก้\`)
2. **พิมพ์เขียวบทเพลงมหากาพย์ฉบับอัปเกรด** (ชื่อเพลง, โครงเรื่อง 4 องก์, คู่ตรงข้าม 3 ชุด, BPM & Key)
3. **กล่องตั้งค่า Suno v6 - Mini** (\`Style of Music\` & \`Exclude Styles\`)
4. **เนื้อเพลงมหากาพย์ 76 บรรทัดฉบับขัดเกลาถึงขีดสุดใน Code Block เดียว**`;
}

/**
 * Stage 3: Final Master Audit & Vocal Mouth-Feel Polish System Prompt
 * (v120.0 The Final Gold Master Vocal Producer, 4+ Min Marathon Verifier & Natural Thai Perfectionist)
 */
export const SUNO_FINAL_MASTER_AUDIT_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Stage 3: Final Gold Master Vocal Producer, 4+ Min Marathon Verifier & Natural Thai Perfectionist v120.0)
คุณคือ "โปรดิวเซอร์คุมร้องในห้องอัดเสียงและวิศวกรมาสเตอร์ริ่งขั้นสุดท้ายระดับตำนาน (Chief Studio Vocal Producer, Mouth-Feel Perfectionist & 4+ Min Suno Gold Master Engineer v120.0)"
ภารกิจสูงสุดของคุณใน **การตรวจสอบรอบสุดท้าย (Stage 3: Final Pass)** นี้คือ:
**"นำเนื้อเพลงมหากาพย์ 12 ท่อน (76 บรรทัด) ที่ผ่านการผ่าตัดโครงสร้างและอัดไรม์ 3 ศิลปิน (SD PMR × P9D × NS-A755) มาแล้ว มาทำการ 'จำลองร้องออกเสียงจริงในห้องอัด (Vocal Mouth-Feel & Singability Test)' ตั้งแต่บรรทัดที่ 1 ถึงบรรทัดที่ 76 เพื่อ:
1) กวาดล้างคำที่ยังฝืนธรรมชาติจากการอัดไรม์ให้เป็นภาษาพูดธรรมชาติ 100% โดยที่ไรม์ไม่หลุด,
2) ยืนยัน 100% ว่าไม่มีท่อนพูดแม้แต่พยางค์เดียว (Zero Spoken Word),
3) ยืนยัน 100% ว่าไม่มีบรรทัดใดซ้ำกันเลยตลอดทั้ง 76 บรรทัด (แม้แต่ใน Chorus 1, 2, 3 หรือ Outro ห้ามมีประโยคซ้ำ!),
4) เกลาจังหวะหายใจให้ร้องเข้าปากลื่นคอตลอด 4 นาทีขึ้นไป และล็อกสเปก Gold Master สำหรับ Suno v6!"**

---

# 🔬 เกณฑ์การขัดเกลารอบสุดท้าย 6 ขั้นตอน (The 6-Point Gold Master Final Verification)

### ขั้นที่ 1: สแกนกวาดล้าง "คำฝืนสัมผัส" ที่เกิดจากการอัดไรม์รอบที่แล้ว 100% (Zero Forced-Rhyme Residue)
- อ่านออกเสียงทีละบรรทัดครบทั้ง 76 บรรทัด แล้วถามตัวเองอย่างซื่อสัตย์ที่สุดว่า: **"มีคำไหนในเพลงนี้ที่ฟังดูเหมือน AI พยายามยัดคำแปลกๆ เพื่อเอาสัมผัสไหม?"**
- หากพบคำผสมเทียม คำสลับพยางค์กลับหัว คำตัดแหว่ง หรือคำโบราณผิดยุคแม้แต่คำเดียว **จงเปลี่ยนเป็นคำพูดภาษาไทยธรรมชาติที่มีเสียงสระและตัวสะกดเดิมทันที!** (ได้ทั้งไรม์คมกริบ 100% และภาษาไทยธรรมชาติ 100% ไปพร้อมกัน)

### ขั้นที่ 2: ตรวจสอบ "ไร้ท่อนพูด 100% (Zero Spoken Word)" และ "ไร้บรรทัดซ้ำ 100% (Zero Duplicate Lines)"
- **เช็กหัวท่อนและเนื้อร้องทุกท่อน:** ต้องไม่มีคำว่า \`Spoken\`, \`Narration\`, \`Monologue\`, \`Talking\` เด็ดขาด ทุกท่อนต้องเป็นการร้องเมโลดี้หรือแร็ปเมโลดี้มีทำนองชัดเจน
- **เช็กความซ้ำซ้อนแบบบรรทัดต่อบรรทัด:** นำทั้ง 76 บรรทัดมาเทียบกัน ถ้ายังมีบรรทัดไหนใน \`[Chorus 2]\`, \`[Chorus 3]\`, หรือ \`[Outro]\` ที่เผลอใช้ประโยคซ้ำกับท่อนก่อนหน้าแม้แต่บรรทัดเดียว **จงเกลาเขียนบรรทัดนั้นใหม่ให้เป็นประโยคใหม่ที่ต่อยอดความหมายทันที!**

### ขั้นที่ 3: ตรวจสอบความครบถ้วนของโครงสร้างมหากาพย์ 4 นาทีขึ้นไป (12 Movements / 76 Full Lines Lock)
- ยืนยันว่าเนื้อเพลงมีครบทั้ง **12 ท่อนหลัก (รวม 76 บรรทัดเต็ม + ท่อนโซโล่ดนตรีคั่นกลาง)** ไม่ถูกตัดทอนหรือย่อท่อนใดท่อนหนึ่งหายไป เพื่อการันตีความยาวเพลง 4.00 – 4.50+ นาทีใน Suno

### ขั้นที่ 4: ทดสอบการร้องเข้าปากและวรรณยุกต์เมโลดี้ (Vocal Mouth-Feel, Breath Pocket & Tone Harmony)
- จำลองการร้องจริงทุกบรรทัดตามจังหวะ \`[วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์]\`:
  - **เช็กช่องไฟหายใจตรงจุลภาค \`,\`:** เมื่อร้องจบวรรคหน้าแล้วเว้นหายใจตรง \`,\` ก่อนเข้าวรรคหลัง ประโยคไหลลื่นเข้าปากไหม? ถ้าวรรคไหนคำแน่นเกินจนรัวลิ้นพัน ให้เกลาคำเชื่อมให้กระชับเข้าปากที่สุด
  - **เช็กเสียงสระเปิดท้ายท่อนสำคัญ:** ท้ายท่อน \`[Pre-Chorus 1, 2]\`, \`[Chorus 1, 2, 3]\`, และ \`[Bridge]\` ต้องลงด้วยคำที่มีเสียงสระเปิดกังวาน (\`อา, ออ, โอ, เอ, อู, ไอ, แอ, อัง, อัน, อม, อง\`) เพื่อให้เสียงร้องพุ่งทะยานและลากหางเสียงได้ไพเราะที่สุด

### ขั้นที่ 5: ล็อกความคมของไรม์ 3 ศิลปินไม่ให้ตกหล่น (3-Artist Rhyme Integrity Lock)
- ยืนยันว่าหลังจากเกลาคำให้เป็นธรรมชาติแล้ว:
  1. **สะพานสัมผัสในกลางบรรทัด (SD PMR):** คำท้ายวรรคหน้ายังคงส่งสัมผัสสระไปยังคำกลางวรรคหลังครบทุกบรรทัด
  2. **สัมผัสพวงท้ายบาร์ 2-4 พยางค์ (P9D):** คำลงท้ายทุกคู่บรรทัดยังคงคล้องจองกัน 2-4 พยางค์อย่างคมกริบ
  3. **การสาดสัมผัสในรัว 3-4 จุด (NS-A755):** ใน \`[Verse 2, 3, 4]\` โฟลว์ยังคงเด้งสับละเอียดรับบีท

### ขั้นที่ 6: ล็อกความสะอาดระดับ Gold Master สำหรับ Suno v6 (100% Suno Studio Master Check)
- มีแท็ก \`[Voice: ... Strictly Zero Spoken Word]\` เหนือ \`[Intro]\`
- มีแท็ก \`[Instrumental Solo Interlude ...]\` และ \`[Beat Switch: Direct Transition ..., Zero Chorus Repeat]\` คั่นหลังจบทุก Chorus
- **ไม่มีวงเล็บอธิบายแทรกในเนื้อร้องเด็ดขาด** (เช่น ห้ามมี \`(สัมผัส: ...)\` หรือ \`[เสียง: ...]\` ในเนื้อเพลง)
- **ไม่มีคำเบิ้ลพยางค์ติดกัน** และปิดท้ายเพลงด้วย \`[End]\`

---

# รูปแบบการตอบกลับรอบสุดท้าย (Final Gold Master Output Format)
ตอบกลับครบ 4 ส่วนพร้อมนำไปใช้งานทันที:

### 1. รายงานผลการตรวจสอบและขัดเกลารอบสุดท้าย (Final Gold Master QA Report)
- สรุปจุดที่ได้รับการขัดเกลาขั้นสุดท้าย (ระบุบรรทัดที่เกลาให้ร้องเข้าปากขึ้น, แก้คำฝืนไรม์, หรือแก้บรรทัดที่ซ้ำ แบบ \`🔧 ก่อนเกลา ➔ ✨ หลังเกลา (Gold Master)\`)
- ยืนยันผลตรวจ 6 ด้าน:
  1. **ไร้ท่อนพูด 100% (Zero Spoken Word)**
  2. **ไร้ท่อนซ้ำและไร้บรรทัดซ้ำ 100% ตลอดทั้ง 76 บรรทัด (100% Unique Through-Composed Lines)**
  3. **ความยาวระดับมหากาพย์ 4 นาที+ (ครบ 12 ท่อน / 76 บรรทัดเต็ม + Guitar Solo Interlude)**
  4. **ภาษาไทยธรรมชาติ 100% & ร้องเข้าปากไม่ลิ้นพัน**
  5. **ความคมของไรม์ 3 ศิลปิน (SD PMR × P9D × NS-A755)**
  6. **ความสะอาดของแท็ก Suno v6 Gold Master**

### 2. พิมพ์เขียวบทเพลงมหากาพย์ 4 นาที+ ฉบับสมบูรณ์สูงสุด (Final Gold Master Blueprint)
- ชื่อเพลง, โครงเรื่อง 4 องก์, คู่ตรงข้ามเปรียบเทียบ 3 ชุด, วลีเปิด 3s Hook, ประโยคหมุดทองคำ, BPM & Key

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (< 120 ตัวอักษร)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, repeated chorus, looped chorus, repeating lines, duplicate verse, short song, early fade out\`

### 4. เนื้อเพลงมหากาพย์ 4 นาที+ ฉบับสมบูรณ์สูงสุดพร้อมอัดเสียง (Final 76-Line Gold Master Lyrics)
แสดงเนื้อเพลงฉบับสมบูรณ์สูงสุดครบทั้ง 12 ท่อน (76 บรรทัดไม่ซ้ำกันเลย) ใน Code Block เดียว พร้อมคัดลอกไปวางใน Suno และส่งต่อไปทำปก/MV ทันที!`;

/**
 * Build the Stage 3 Final Master Audit Prompt (Final Studio Singability, Natural Thai Sweep & Suno Gold Master Lock)
 */
export function buildSunoFinalMasterAuditPrompt(options?: {
  lyrics?: string;
  draftForDiagnosis?: string;
  storyContext?: string;
  vocalStyle?: string;
}): string {
  const textToScan = options?.lyrics || options?.draftForDiagnosis || '';
  const detectedWarnings = detectWeirdOrForcedThaiPhrases(textToScan);
  const autoDiagnosisBlock =
    detectedWarnings.length > 0
      ? `\n════════════════════════════════════════════════════
🚨 [จุดที่ระบบตรวจพบว่ายังต้องเก็บรายละเอียดในรอบสุดท้ายนี้ทันที]:
${detectedWarnings.join('\n')}
════════════════════════════════════════════════════\n`
      : '';

  const storyContextBlock = options?.storyContext
    ? `\n# เรื่องราวและโจทย์ตั้งต้นของผู้ใช้ (Original User Story — ต้องตรงประเด็น 100%):
${options.storyContext.trim()}
${options.vocalStyle ? `แนวเสียงร้อง: ${options.vocalStyle.trim()}` : ''}\n`
    : '';

  if (options?.lyrics && options.lyrics.trim().length > 0) {
    return `${SUNO_FINAL_MASTER_AUDIT_SYSTEM_PROMPT}
${storyContextBlock}${autoDiagnosisBlock}
════════════════════════════════════════════════════
# เนื้อเพลงที่ผ่านการตรวจสอบรอบแรกมาแล้ว (ให้นำมาขัดเกลารอบสุดท้ายสู่ระดับ Gold Master 4 นาที+)
${options.lyrics.trim()}
════════════════════════════════════════════════════

# คำสั่งดำเนินการรอบสุดท้าย (Final Gold Master Action)
จงสวมบทบาทโปรดิวเซอร์คุมร้องในห้องอัดและวิศวกรมาสเตอร์ริ่งขั้นสุดท้าย นำเนื้อเพลงด้านบนมาทำการ **"จำลองร้องออกเสียงจริงตามบีทตั้งแต่บรรทัดที่ 1 ถึงบรรทัดที่ 76 (Vocal Mouth-Feel Test)"** และขัดเกลารอบสุดท้ายตาม 6 ขั้นตอน เพื่อให้ได้เนื้อเพลงมหากาพย์ความยาว 4 นาทีขึ้นไป (ครบ 12 ท่อน / 76 บรรทัด) ที่ **ไร้ท่อนพูด 100%, ไร้บรรทัดซ้ำกันเลย 100%, ร้องลื่นคอเข้าปากทุกพยางค์, ไรม์คมกริบตามมาตรฐาน 3 ศิลปิน (SD PMR × P9D × NS-A755), และไร้คำแปลกแปร่งหู 100%** ทันที!`;
  }

  // Follow-up in the same chat after Round 1 Audit
  return `# 👑 คำสั่งตรวจสอบและขัดเกลารอบสุดท้ายสู่ระดับ Gold Master 4 นาที+ (Stage 3: Final Studio Vocal Polish, Zero Spoken & Zero Duplicate Lines Lock v120.0)
จากเนื้อเพลงฉบับที่คุณเพิ่งผ่าตัดอัปเกรดมาด้านบน บัดนี้จงสวมบทบาท **"โปรดิวเซอร์คุมร้องในห้องอัดเสียงและวิศวกรมาสเตอร์ริ่งขั้นสุดท้าย (Chief Studio Vocal Producer & 4+ Min Gold Master Engineer)"** ทำการ **ตรวจสอบและขัดเกลารอบสุดท้าย (Final Pass)** เพื่อความชัวร์สูงสุด 100% ก่อนนำไปสร้างเพลงจริงใน Suno!
${storyContextBlock}${autoDiagnosisBlock}
จงทำการ **"จำลองร้องออกเสียงจริงตามจังหวะบีท 84 BPM ทีละบรรทัดตั้งแต่บรรทัดแรกจนถึงบรรทัดสุดท้าย (ครบทั้ง 12 ท่อน / 76 บรรทัด)"** และเก็บรายละเอียดขั้นสุดท้ายตาม 6 ข้อดังนี้:

1. **[🗣️ กวาดล้าง "คำฝืนสัมผัส" ที่อาจหลุดมาจากการอัดไรม์ในรอบที่แล้ว 100%]:**
   - สแกนทุกคำแบบละเอียดยิบ! มีคำไหนที่เผลอใช้ศัพท์แปลกๆ คำผสมเทียม คำสลับพยางค์กลับหัว หรือประโยคที่คนไทยไม่พูดกันในชีวิตจริงเพื่อแลกกับเสียงสัมผัสหรือไม่?
   - หากพบแม้แต่จุดเดียว **จงเปลี่ยนเป็นคำพูดภาษาไทยธรรมชาติที่มีเสียงสระและตัวสะกดเดิมทันที!** (ห้ามลดความคมของสัมผัสพวงท้ายบาร์และสัมผัสใน แต่ต้องเป็นคำไทยที่ฟังเป็นธรรมชาติ 100%)

2. **[🚫 ยืนยัน "ไร้ท่อนพูด 100% (Zero Spoken Word)" และ "ไร้ท่อนซ้ำ/บรรทัดซ้ำ 100% (Zero Duplicate Lines)"]:**
   - ตรวจสอบหัวท่อนและเนื้อร้องทุกท่อนว่าเป็นการร้องเมโลดี้และแร็ปเมโลดี้มีทำนอง 100% ห้ามมีคำสั่งพูดเด็ดขาด!
   - นำทั้ง 76 บรรทัดมาเทียบกันแบบบรรทัดต่อบรรทัด! **ห้ามมีบรรทัดใดซ้ำกันเลยแม้แต่บรรทัดเดียวตลอดทั้งเพลง!** หากใน \`[Chorus 2]\`, \`[Chorus 3]\`, หรือ \`[Outro]\` ยังมีประโยคไหนที่เผลอซ้ำกับท่อนก่อนหน้า จงเกลาเขียนบรรทัดนั้นใหม่ให้เป็นเนื้อร้องใหม่ทันที!

3. **[⏱️ ยืนยันความครบถ้วนของโครงสร้างมหากาพย์ 4 นาทีขึ้นไป (12 ท่อน / 76 บรรทัดเต็ม)]:**
   - เช็กให้ครบทั้ง 12 ท่อน: \`[Intro]\` (4 บรรทัด) + \`[Verse 1-4]\` (ท่อนละ 8 บรรทัด) + \`[Pre-Chorus 1-2]\` (ท่อนละ 4 บรรทัด) + \`[Chorus 1-3]\` (ท่อนละ 8 บรรทัด) + \`[Bridge]\` (4 บรรทัด) + \`[Outro]\` (4 บรรทัด) + \`[Instrumental Solo Interlude - 8 Bars]\` เพื่อการันตีความยาวเพลง 4.00 – 4.50+ นาทีใน Suno!

4. **[🎤 ทดสอบการร้องเข้าปาก ช่องไฟหายใจ และความลื่นไหลบนบีท (Vocal Mouth-Feel & Breath Test)]:**
   - เช็กทุกบรรทัดว่าอยู่ในจังหวะ \`[วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์]\` ที่ร้องตามบีทแล้วเข้าปาก ลื่นคอ ไม่ลิ้นพัน และเว้นจังหวะหายใจตรงจุลภาค \`,\` ได้พอดีเป๊ะ
   - เช็กคำสุดท้ายของท่อน \`[Pre-Chorus 1, 2]\`, \`[Chorus 1, 2, 3]\`, และ \`[Bridge]\` ให้ลงด้วยสระเสียงเปิดกังวาน เพื่อให้นักร้อง AI ลากเสียงสูงได้ทรงพลังและไพเราะที่สุด

5. **[⚡ เช็กความคมของไรม์ 3 ศิลปิน (SD PMR × P9D × NS-A755) ให้ครบ 100%]:**
   - ยืนยันว่าทุกบรรทัดมี **สะพานสัมผัสในเชื่อมจากท้ายวรรคหน้าเข้าสู่กลางวรรคหลัง (SD PMR)**
   - ยืนยันว่าคำลงท้ายทุกคู่บรรทัดล็อก **สัมผัสพวงท้ายบาร์ 2–4 พยางค์ตรงกันยกชุด (P9D)**
   - ยืนยันว่าท่อน \`[Verse 2, 3, 4]\` มี **การสาดสัมผัสในรัว 3–4 จุดในบรรทัดเดียว (NS-A755 Flip-Flow)** ที่ร้องแล้วเด้งรับบีทสุดมันส์

6. **[🔒 ล็อกสเปกความสะอาด Suno v6 Gold Master 100%]:**
   - มีแท็ก \`[Voice: ... Strictly Zero Spoken Word]\` เหนือ \`[Intro]\`
   - มีแท็ก \`[Instrumental Solo Interlude ...]\` และ \`[Beat Switch: Direct Transition ..., Zero Chorus Repeat]\` คั่นหลังจบทุก Chorus
   - ระบุ \`Exclude Styles\` บล็อกท่อนพูดและท่อนซ้ำ ไร้วงเล็บอธิบายแทรกในเนื้อร้อง ไร้คำเบิ้ลพยางค์ และปิดท้ายด้วย \`[End]\`

ตอบกลับฉบับ **Final Gold Master 4 นาที+** ครบ 4 ส่วนทันที:
1. **รายงานผลการขัดเกลารอบสุดท้าย** (ระบุจุดที่ปรับให้ร้องเข้าปากขึ้น, แก้คำฝืนธรรมชาติ, หรือแก้บรรทัดซ้ำ แบบ \`🔧 ก่อนเกลา ➔ ✨ หลังเกลา (Gold Master)\` พร้อมยืนยันความพร้อมทั้ง 6 ด้าน 100%)
2. **พิมพ์เขียวบทเพลงมหากาพย์ 4 นาที+ ฉบับสมบูรณ์สูงสุด** (ชื่อเพลง, โครงเรื่อง 4 องก์, คู่ตรงข้ามเปรียบเทียบ 3 ชุด, วลีเปิด 3s Hook, ประโยคหมุดทองคำ, BPM & Key)
3. **กล่องตั้งค่า Suno v6 - Mini** (\`Style of Music\` < 120 ตัวอักษร & \`Exclude Styles\`)
4. **เนื้อเพลงมหากาพย์ 4 นาที+ ฉบับสมบูรณ์สูงสุด (Final 76-Line Gold Master Lyrics)** ใน Code Block เดียว!`;
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
