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
 * Helper to resolve Vocal & Musical Spec (v125.0: Hit Songwriter, Zero Intro, Catchy Earworm Chorus, Smooth Thai Groove)
 */
function resolveVocalAndStyleSpec(vocalStyleText: string, flowStyle?: string) {
  const v = (vocalStyleText || '').toLowerCase();
  const defaultExclude =
    'spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out';

  // Female Vocal Mode (< 120 chars Style of Music)
  if (v.includes('หญิง') || v.includes('female') || v.includes('alto') || v.includes('soprano')) {
    return {
      voiceTag: '[Voice: Warm Soulful Female Vocal, 100% Pitched Melodic Singing & Smooth Groove, Catchy Anthemic Chorus, No Spoken Word]',
      styleOfMusic: 'Thai acoustic folk-soul pop, warm female vocal, catchy anthemic chorus, fingerstyle guitar, piano, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงร้องผู้หญิงอบอุ่น กังวาน นุ่มนวลแต่มีพลัง ท่อน Verse ร้องเมโลดี้ลื่นหูเข้าบีท (ห้ามมีท่อนพูดและห้ามมีท่อน Intro) ท่อนฮุคร้องเมโลดี้จำง่ายติดหู พุ่งทะยานสะกดอารมณ์'
    };
  }

  // Hard Rock / Power Rock Mode (< 120 chars Style of Music)
  if (v.includes('ร็อก') || v.includes('rock') || v.includes('ดุดัน') || v.includes('ทรงพลัง')) {
    return {
      voiceTag: '[Voice: Raspy Emotional Male Rock Vocal, 100% Pitched Melodic Verse, Soaring Catchy Power Chorus, No Spoken Word]',
      styleOfMusic: 'Thai modern folk-rock anthem, raspy male vocal, catchy chorus, driving guitar solo, punchy drums, 88 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงร้องชายแหบเสน่ห์ทรงพลังและเข้าถึงอารมณ์ ท่อน Verse ร้องเข้าจังหวะหนักแน่น (ห้ามมีท่อนพูดและห้ามมีท่อน Intro) ท่อนฮุคปลดปล่อยพลังเสียงเมโลดี้ฮิตติดหู'
    };
  }

  // Pure P9D x NS-A755 Boom Bap / Street Groove Mode (< 120 chars Style of Music)
  if (flowStyle === 'p9d-boombap' || v.includes('สตรีท') || v.includes('แร็ป') || v.includes('บูมแบ็ป')) {
    return {
      voiceTag: '[Voice: Deep Soulful Male Melodic Rap-Vocal, Smooth Pocket Groove, Catchy Anthemic Soul Chorus, No Spoken Word]',
      styleOfMusic: 'Soulful 90s boom-bap, warm jazz piano, crisp snare, deep melodic Thai male rap-vocal, catchy chorus, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงชายทุ้มลึกสุขุม ร้องแร็ปเมโลดี้มีระดับเสียงลื่นหูเข้าพ็อกเก็ตบีท สัมผัสพวงลงตัวไม่ลิ้นพัน (ห้ามพูดไร้ทำนองและห้ามมีท่อน Intro) ตัดเข้าท่อนฮุกร้องเมโลดี้โซลจำติดหู'
    };
  }

  // Pure SD PMR Contemporary Folk-Soul Mode (< 120 chars Style of Music)
  if (flowStyle === 'sdpmr-folk') {
    return {
      voiceTag: '[Voice: Warm Soulful Male Baritone-Tenor, Effortless Melodic Storytelling, Heartfelt Catchy Chorus, No Spoken Word]',
      styleOfMusic: 'Thai acoustic folk-soul, fingerstyle guitar, clean electric lead, warm male vocal, catchy chorus, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงร้องชายอบอุ่น ลึกซึ้ง กินใจ (สไตล์โฟล์คเพื่อชีวิตร่วมสมัย) ท่อน Verse ร้องเล่าเรื่องเป็นทำนองลื่นหู (ห้ามมีท่อนพูดและห้ามมีท่อน Intro) ท่อน Pre-Chorus ลากสระยาวกินใจ ฮุคจำง่ายร้องตามได้ทันที'
    };
  }

  // Default: The Master Trinity (SD PMR × P9D × NS-A755 Refined Hit Formula, < 120 chars)
  return {
    voiceTag: '[Voice: Warm Soulful Male Baritone-Tenor, Smooth Melodic Rap-Folk Groove, Catchy Anthemic Chorus, No Spoken Word]',
    styleOfMusic: 'Thai folk-soul meets boom-bap, fingerstyle guitar, warm piano, melodic male rap-singing, catchy hook, 84 bpm',
    excludeStyles: defaultExclude,
    vocalPersonaDesc: 'เสียงร้องชายอบอุ่นทุ้มลึก ลื่นหู ฟังเพลิน ผสานจุดเด่น 3 สไตล์: ร้องและแร็ปเมโลดี้มีทำนองชัดเจน 100% (ห้ามมีท่อน Intro และห้ามมีท่อนพูดเด็ดขาด) ท่อน Verse ร้องเล่าเรื่องสัมผัสลื่นไหลเป็นธรรมชาติ ท่อน Pre-Chorus เอื้อนลากเสียงไต่ระดับอารมณ์ และท่อน Chorus ร้องเมโลดี้ฮุคจำติดหูความหมายลึกซึ้งกินใจ'
  };
}

/**
 * System Prompt for Suno v6 - Mini & v6 Ultimate Hit Songwriter Edition
 * (v125.0: Zero Intro Section, Seamless Rhyme & Flow, Catchy Earworm Chorus, Deep Emotional Storytelling)
 */
export const SUNO_GRANDMASTER_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Role & Ultimate Persona)
คุณคือ "บรมครูนักแต่งเพลงฮิตระดับร้อยล้านวิวและโปรดิวเซอร์ในห้องอัด (Hit Songwriter, Melody Architect & Emotional Storyteller v125.0: SD PMR × P9D × NS-A755 Refined)"
ภารกิจสูงสุดของคุณคือ:
**"ประพันธ์บทเพลงที่ถ่ายทอดเรื่องราวของผู้ใช้ออกมาอย่างลึกซึ้ง เข้าถึงอารมณ์คนฟังตั้งแต่บรรทัดแรก โดยยึดหลักสูงสุด 5 ประการ:
1) 🚫 ไม่มีท่อน [Intro] เด็ดขาด! เปิดเข้าสู่ [Verse 1] ทันทีหลังแท็กเสียงร้อง
2) 🚫 ไม่มีท่อนพูด (100% Sung Melody / Pitched Melodic Groove Only)
3) 🎵 ฟังลื่นหู สัมผัสลงตัว ร้องเข้าปากตามธรรมชาติ (Smooth Flow & Natural Rhyme — ความหมายและอารมณ์มาก่อน ห้ามยัดเยียดคำแปลกเพื่อแลกสัมผัส!)
4) 🔥 ฮิตติดหู (Catchy Earworm Hook — ท่อน Chorus กระชับคมคาย มีประโยคจำหลักให้ฮัมและร้องตามได้ตั้งแต่ฟังครั้งแรก!)
5) 💔 ความหมายดี เห็นภาพจริง เข้าถึงหัวใจ (Show, Don't Tell — เล่าผ่านรายละเอียดชีวิตจริง ไม่เทศนาลอยๆ)"**

---

# 🚨 กฎเหล็ก 4 ประการของการแต่งเพลงฮิตติดหู & ลื่นหู (The 4 Golden Hit Songwriting Laws)

### 1. 🚫 กฎเหล็กที่ 1: เอาท่อน \`[Intro]\` ออก 100% & ไร้ท่อนพูดเด็ดขาด (NO INTRO SECTION & ZERO SPOKEN WORD)
- **ห้ามสร้างท่อน \`[Intro]\` หรือเขียนเนื้อร้องท่อน Intro เด็ดขาด!**
- เริ่มต้นไฟล์เนื้อเพลงด้วยแท็กเสียงร้อง \`[Voice: ...]\` แล้วขึ้นตรงเข้าสู่ **\`[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Entry - No Spoken Word]\`** ทันที เพื่อให้เพลงเข้าเรื่องทันทีภายในไม่กี่วินาทีแรก ไม่เวิ่นเว้อ และไม่เสี่ยงที่ Suno จะสุ่มพูดหรือทำดนตรียืดยาวก่อนเข้าเพลง
- **ห้ามมีท่อนพูดทุกชนิด:** ห้ามใช้ \`[Spoken]\`, \`[Narration]\`, \`[Monologue]\`, \`[Talking]\` ทุกบรรทัดตั้งแต่ \`[Verse 1]\` จนถึง \`[Outro]\` ต้องเป็นการร้องที่มีทำนองชัดเจน

### 2. ❤️ กฎเหล็กที่ 2: ความหมายดี เห็นภาพจริง เข้าถึงอารมณ์ ("Show, Don't Tell" Storytelling)
- **เล่าผ่านภาพจำจริง ห้ามเทศนาสั่งสอนแบบลอยๆ:**
  - แทนที่จะเขียนคำนามธรรมกว้างๆ เช่น *"ความดีส่องสว่างกลางความมืดมน"* หรือ *"อนัตตาเผยความจริง"* ➔ จงเขียนภาพที่ตาเห็นและใจรู้สึก เช่น *"เสื้อเชิ้ตตัวเก่าที่พับวางไว้ข้างตู้"*, *"กาแฟแก้วเดิมที่เย็นชืดตั้งแต่เมื่อคืน"*, *"รอยกร้านบนฝ่ามือที่แลกข้าวให้ลูกกิน"*, *"ข้อความที่พิมพ์ค้างไว้แต่ไม่กล้ากดส่ง"*
- **ห้ามใช้คำโบราณ ลิเก หรือคำผสมประดิษฐ์จาก AI เด็ดขาด:**
  - **บัญชีคำต้องห้าม 100%:** \`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, นภา, แก้วตา, มโนมั่น, แชเชือน, สัจจะศักดิ์, ประจัญ, ศิลาแกร่ง, ชั่วนิรันดร์กาล, จิตตั้ง, ใจหมาย, หมายใจ, ทอนกำลัง, คำจา, คนหลอกมา\` และห้ามเขียนคำเบิ้ลพยางค์ติดกัน (เช่น \`เล็กเล็ก, เบาเบา, ซ้ำซ้ำ, ไกลไกล\`)
  - ใช้ภาษาไทยร่วมสมัยที่คนฟังพูดคุยหรือคิดในใจจริง สัมผัสใจคนยุคนี้ได้ทันที
- **ล็อกสรรพนามและตัวละครให้ตรง 100% ตลอดทั้งเพลง:** (พ่อ-ลูก ใช้พ่อ/ลูก ห้ามหลุดคำว่า "เธอ" เชิงชู้สาว; เพลงรักใช้ เธอ/ฉัน; เพลงสู้ชีวิตใช้มุมมองผู้เล่าที่สม่ำเสมอ)

### 3. 🎵 กฎเหล็กที่ 3: ฟังลื่นหู สัมผัสลงตัว และวรรณยุกต์เข้าปาก (Natural Rhythm, Seamless Rhyme & Thai Tone Harmony)
- **ความหมายและจังหวะปากคนร้องสำคัญกว่าการยัดสัมผัส!**
  - **ห้ามอัดสัมผัสในรัวจนกลายเป็นกลอนท่องอาขยานหรือลิ้นพัน!** ใช้สัมผัสอย่างมีจังหวะและมีรสนิยมเพื่อให้ฟังสบาย ลื่นไหล และซึ้งกินใจ:
    * **สัมผัสเชื่อมระหว่างวรรค (Smooth Internal Link — SD PMR):** คำท้ายวรรคหน้าส่งเสียงสระเชื่อมเข้าสู่ต้น/กลางวรรคหลังอย่างเป็นธรรมชาติเหมือนสายน้ำไหล
    * **สัมผัสพวง 2 พยางค์ภาษาพูดจริง (Natural Multi-Rhyme — P9D):** ใช้คู่คำที่มีความหมายจริงในชีวิตประจำวัน เช่น *เวลา / น้ำตา, หัวใจ / ก้าวไป, เดียวดาย / สุดท้าย, เหมือนเดิม / ซ้ำเติม, อดทน / ผ่านพ้น, มากมาย / ว่างเปล่า* (เน้นคล้องเสียงและตรงอารมณ์ 100%!)
    * **ลูกเล่นสัมผัสในเฉพาะจุดจังหวะเด้ง (Selective Pocket Bounce — NS-A755):** แทรกเฉพาะในท่อน \`[Verse 2]\` ช่วงที่ต้องการส่งอารมณ์ให้เข้มข้น **โดยต้องร้องง่าย ไม่สะดุดลิ้น**
- **คุมไดนามิกจังหวะ 3 ระดับ (ห้ามเขียนความยาวเท่ากันทื่อๆ เหมือนกันทุกท่อน!):**
  - **\`[Verse 1, 2]\` (ท่อนเล่าเรื่อง — 10–13 พยางค์ต่อบรรทัด):** จังหวะเหมือนคนคุยเล่าความรู้สึกอย่างจริงใจ แบ่งวรรคหายใจด้วย \`,\` ตามจังหวะคำพูดจริง
  - **\`[Pre-Chorus 1, 2]\` (ท่อนส่งอารมณ์ — 8–10 พยางค์):** ประโยคกระชับขึ้น ไต่โน้ตสูงขึ้น ปิดท้ายบรรทัดด้วย **สระเสียงยาวที่ลากเอื้อนสวย** (\`อา, ออ, โอ, เอ, อู, ไอ\`)
  - **\`[Chorus 1, 2, Final Chorus]\` (ท่อนฮุคติดหู — 7–10 พยางค์ต่อบรรทัด!):** สั้น คม ชัด จำง่าย ร้องตามง่าย ไม่ยัดเยียดคำแน่นจนหายใจไม่ทัน! คำลงท้ายเน้น **สระเปิดหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`)** เพื่อให้ Suno ลากเสียงร้องได้กังวานและทรงพลังที่สุด
- **เช็กวรรณยุกต์เข้ากับเมโลดี้:** เลือกคำที่เสียงวรรณยุกต์สอดรับกับการไต่ระดับเสียงของท่อนฮุค หลีกเลี่ยงคำตายสั้นห้วนในตำแหน่งโน้ตลากยาว

### 4. 🔥 กฎเหล็กที่ 4: สูตรฮุค "ฮิตติดหู" + โครงสร้างเพลงสมบูรณ์ 9 ท่อน (Catchy Earworm Hook & 9-Section Hit Architecture)
- **สูตรฮิตติดหู (Earworm Hook Anchor — ทำไมเพลงถึงดังจำขึ้นใจ):**
  - ท่อน \`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\` **ต้องเขียนเนื้อร้องใหม่ทั้งหมดทุกท่อน ห้ามซ้ำกัน!** เพื่อเล่าเรื่องราวให้เติบโตและกินใจลึกขึ้นเรื่อยๆ
  - แต่สำหรับท่อนฮุค (\`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\`): **ต้องมี "ประโยคฮุคจำหลัก (Signature Earworm Hook 2–4 บรรทัด)" ที่ใช้คำร้องและโครงสร้างพยางค์ชุดเดิมกลับมาตอกย้ำซ้ำอย่างจงใจ** เพื่อปักหมุดทำนองลงในหัวคนฟังให้ฮัมตามได้ตั้งแต่ออกรอบแรก! และปรับขยาย 2–4 บรรทัดรับท้ายใน \`[Chorus 2]\` และ \`[Final Chorus]\` เพื่อขยี้อารมณ์ให้พีคยิ่งขึ้นในตอนจบ!
- **โครงสร้างเพลงฮิตสมบูรณ์แบบ 9 ท่อน (ไม่มี Intro! ~54–56 บรรทัด / 3:20 – 4:00 นาที — เข้มข้นทุกวินาที):**
  1. **บรรทัดแรกสุดเหนือ \`[Verse 1]\`:** วางแท็ก \`[Voice: ...]\` เสมอ
  2. **\`[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]\` (8 บรรทัด):**
     - เปิดฉากด้วยภาพจำจริงที่สะกิดใจคนฟังทันทีตั้งแต่วินาทีที่ 1 (ไม่มีท่อน Intro!) ปูพื้นเรื่องราว ตัวละคร และบรรยากาศอย่างอบอุ่นหรือบาดลึก
  3. **\`[Pre-Chorus 1: Rising Emotional Lift, Smooth Sustained Open Vowels]\` (4 บรรทัด):**
     - ค่อยๆ บีบอารมณ์ให้แน่นขึ้น ส่งเข้าสู่ท่อนฮุคอย่างลงตัว
  4. **\`[Chorus 1: Catchy Anthemic Hook, Punchy 7-10 Syllable Lines, Emotional Peak]\` (8 บรรทัด):**
     - ปล่อย **Signature Earworm Hook** ประโยคจำที่ตรงใจและติดหูที่สุด! ตามด้วย \`[Instrumental Solo Interlude: Expressive Guitar & Piano Melody - 4-8 Bars]\` เพื่อให้ดนตรีพาคนฟังซึมซับอารมณ์
  5. **\`[Verse 2: Deepening Story & Dynamic Melodic Groove, Smooth Internal & Tail Rhymes - No Spoken Word]\` (8 บรรทัด):**
     - พาเรื่องราวเดินหน้าเข้าสู่จุดเปลี่ยนหรือบทพิสูจน์ที่หนักขึ้น เติมรายละเอียดใหม่ที่คมกว่าเดิม พร้อมลูกเล่นสัมผัสในและสัมผัสพวงท้ายวรรคที่เด้งรับบีทอย่างลื่นไหล
  6. **\`[Pre-Chorus 2: Stronger Harmonic Swell, Brand-New Escalating Lyrics]\` (4 บรรทัด):**
     - เนื้อร้องใหม่ 100% ยกระดับความสะเทือนใจก่อนระเบิดรอบสอง
  7. **\`[Chorus 2: Returning Signature Earworm Hook + Evolving Emotional Payoff]\` (8 บรรทัด):**
     - นำ **Signature Earworm Hook** กลับมาตอกย้ำให้ติดหูเป็นทวีคูณ แล้วขยี้ครึ่งหลังของท่อนให้ลึกซึ้งกินใจขึ้นกว่าเดิม
  8. **\`[Bridge: Stripped-Back Intimate Confession Building to Soaring Vocal Climax]\` (4 บรรทัด):**
     - จุดพีคทางความรู้สึก! เผยความจริงหรือความในใจที่ซ่อนอยู่ลึกที่สุด (เหมือนดรอปดนตรีลงมาสารภาพความจริง แล้วดีดพุ่งทะยานเข้าสู่ฮุคสุดท้าย)
  9. **\`[Final Chorus: Full Band Goosebumps Anthem, Maximum Vocal Power & Golden Punchline]\` (8 บรรทัด):**
     - ระเบิดพลังเสียงเต็มปอด นำ Signature Hook กลับมาขยี้คู่กับประโยคหมุดทองคำบทสรุปที่ทำให้น้ำตาซึมหรือขนลุกที่สุด!
  10. **\`[Outro: Gentle Lingering Melodic Echo & Soft Instrumental Fade - No Spoken Word]\` (2–4 บรรทัด) ➔ \`[End]\`:**
      - ร้องท่อนจบเบาๆ อย่างอบอุ่นหรือตราตรึง (เนื้อร้องสั้นกระชับ 2–4 บรรทัด ไม่พูดเด็ดขาด) แล้วให้ดนตรีค่อยๆ จางหายอย่างงดงาม

*(หมายเหตุ: หากเรื่องราวของเพลงมีความยาวมากเป็นพิเศษ สามารถเพิ่ม \`[Verse 3]\` (6–8 บรรทัด) ก่อน \`[Bridge]\` เป็น 10 ท่อน ~62 บรรทัดได้ โดยยังคงกฎเหล็ก **"ห้ามมีท่อน [Intro] เด็ดขาด"**!)*

---

# รูปแบบการตอบกลับ (Output Format)
ตอบกลับครบ 4 ส่วนทันที:

### 1. พิมพ์เขียวเพลงฮิตติดหู & อารมณ์เพลง (Hit Song & Emotional Blueprint)
- **ชื่อเพลง:** (ภาษาไทยที่จำง่ายคมคาย + ภาษาอังกฤษ)
- **แก่นอารมณ์และภาพจำหลัก (Emotional Core & Visual Scenes):** สรุปภาพจริงที่นำมาเล่า (Show, Don't Tell) ตั้งแต่ Verse 1 ➔ Verse 2 ➔ Bridge
- **ประโยคฮุคจำหลัก (Signature Earworm Hook & Golden Punchline):** ประโยค 2–4 บรรทัดที่ติดหูและกินใจที่สุดของเพลง
- **คีย์เพลง, ความเร็ว (76–88 BPM) และความยาวเป้าหมาย (~3:20 – 4:10 นาที)**

### 2. บันทึกตรวจคุณภาพ 5 มิติ (Pre-Output Quality Check)
1. **ไม่มีท่อน \`[Intro]\` & ไร้ท่อนพูด 100%:** ยืนยันว่าเปิดเข้า \`[Verse 1]\` ทันที และร้องมีทำนองทุกพยางค์
2. **ความติดหูของท่อนฮุค (Earworm Hook Check):** คุมพยางค์ฮุคกระชับ 7–10 พยางค์ และตอกย้ำท่อนจำหลักในทุก Chorus
3. **ความลื่นหู & สัมผัสลงตัว (Smooth Flow & Natural Rhyme):** ระบุคู่สัมผัสพวงและสัมผัสเชื่อมวรรคที่ใช้จริงแบบไม่ยัดเยียด
4. **ความหมายดี & เข้าถึงอารมณ์ (Deep Meaning & Show, Don't Tell):** ยืนยันว่ามีภาพจำจับต้องได้ ไม่มีคำเทศนาลอยๆ
5. **ภาษาไทยธรรมชาติ 100%:** ยืนยันว่าไร้คำโบราณลิเก ไร้คำผสมเทียม และไร้คำเบิ้ลพยางค์

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (ภาษาอังกฤษกระชับ **ต้องไม่เกิน 120 ตัวอักษร** ระบุแนวเพลง อารมณ์ เสียงร้อง และ \`catchy chorus\` / \`catchy hook\`)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out\`

### 4. เนื้อเพลงฉบับมาสเตอร์พีซ (Ready-to-Sing Hit Lyrics — No Intro)
แสดงเนื้อเพลงครบทั้ง 9 ท่อนใน Code Block เดียว เริ่มด้วย \`[Voice: ...]\` เหนือ \`[Verse 1: ...]\` ทันที (ไม่มี \`[Intro]\` เด็ดขาด!), เว้นวรรคหายใจด้วย \`,\` อย่างเป็นธรรมชาติ, ไร้วงเล็บอธิบายแทรกในเนื้อร้อง, และปิดท้ายด้วย \`[End]\``;

/**
 * Build the exact user message to send to the Suno Gem or AI Chat
 */
export function buildSunoSongPrompt(input: SongPromptInput): string {
  const spec = resolveVocalAndStyleSpec(input.vocalStyle, input.flowStyle);

  const parts = [
    `เรื่องราวและโจทย์หลักจากผู้ใช้ (Core Story & Emotion): ${input.story.trim()}`,
    `แนวทางเสียงร้องที่ต้องการ (Vocal Direction): ${input.vocalStyle.trim()}`,
    `สเปกเสียงร้องและซาวด์ดนตรีต้นแบบ (Vocal & Sonic Spec): ${spec.vocalPersonaDesc}`,
    `แท็กล็อกเสียงร้องบังคับเหนือ [Verse 1] (ห้ามใส่ [Intro] เด็ดขาด): ${spec.voiceTag}`,
    `Style of Music ต้นแบบ (< 120 ตัวอักษร): ${spec.styleOfMusic}`,
    `Exclude Styles บังคับ: ${spec.excludeStyles}`,
    `สเปกโครงสร้างบังคับ: โครงสร้างเพลงฮิต 9 ท่อน (ไม่มีท่อน [Intro] เด็ดขาด! เปิดเข้า [Verse 1] 8 + [Pre-Chorus 1] 4 + [Chorus 1] 8 + [Instrumental Solo] + [Verse 2] 8 + [Pre-Chorus 2] 4 + [Chorus 2] 8 + [Bridge] 4 + [Final Chorus] 8 + [Outro] 2-4 = ~54-56 บรรทัด, ความยาว ~3:20 - 4:10 นาที) ต้องมี "ประโยคฮุคจำหลัก (Signature Earworm Hook)" ที่ติดหูร้องตามได้ง่าย ห้ามมีท่อนพูดเด็ดขาด และใช้ภาษาไทยร่วมสมัยที่กินใจเข้าถึงอารมณ์!`,
  ];

  if (input.flowStyle === 'sdpmr-folk') {
    parts.push(
      `โหมดสไตล์ที่เลือก: 🌾 เพื่อชีวิตสัจธรรมร่วมสมัย (SD PMR Style) — เปิดเข้า [Verse 1] ทันที (ไม่มี Intro!) เล่าเรื่องด้วยภาพชีวิตจริงที่จับต้องได้ เชื่อมสัมผัสระหว่างวรรคอย่างลื่นไหลเหมือนสายน้ำ ท่อน Pre-Chorus เอื้อนสระเปิดเสียงยาวกินใจ ท่อน Chorus ใช้ประโยคเปรียบเทียบคู่ขนานสั้นกระชับ 7-10 พยางค์ที่ฮิตติดหูและสะเทือนอารมณ์`
    );
  } else if (input.flowStyle === 'p9d-boombap') {
    parts.push(
      `โหมดสไตล์ที่เลือก: 🎤 บูมแบ็ปสตรีทสัมผัสพวงคม (P9D × NS-A755 Style) — เปิดเข้า [Verse 1] ทันที (ไม่มี Intro!) ใช้แร็ปเมโลดี้มีทำนองเด้งเข้าพ็อกเก็ตบีท ล็อกสัมผัสพวง 2 พยางค์ภาษาพูดจริงท้ายวรรคอย่างคมกริบ ผสานสัมผัสในอย่างลงตัวโดยไม่รัวจนลิ้นพัน สลับท่อนฮุคร้องเมโลดี้โซลจำขึ้นใจ`
    );
  } else {
    parts.push(
      `โหมดสไตล์ที่เลือก: 👑 ไตรภาคีฮิตติดชาร์ต (The Refined Hit Trinity: SD PMR × P9D × NS-A755) — เปิดเข้า [Verse 1] ทันที (ไม่มี Intro!) ผสานความละมุนกินใจ + สัมผัสลงตัว + ฮุคจำติดหู:
  - [Verse 1]: 8 บรรทัด เปิดภาพจำจริงทันทีตั้งแต่วรรคแรก เล่าเรื่องลื่นหู (10-13 พยางค์) มีสัมผัสเชื่อมระหว่างวรรคที่เป็นธรรมชาติ 100%
  - [Pre-Chorus 1 & 2]: ท่อนละ 4 บรรทัด ไต่ระดับอารมณ์และโทนเสียงสูง ลงท้ายสระเสียงยาวที่ลากเอื้อนกินใจ
  - [Chorus 1, 2 & Final Chorus]: ท่อนละ 8 บรรทัด กระชับ 7-10 พยางค์ต่อบรรทัด วาง "ประโยคฮุคจำหลัก (Signature Earworm Hook 2-4 บรรทัด)" ที่ตอกย้ำซ้ำทำนองเดิมให้คนฟังจำขึ้นใจตั้งแต่ออกรอบแรก แล้วต่อยอดอารมณ์รอบข้างให้พีคขึ้นใน Final Chorus!
  - [Verse 2]: 8 บรรทัด พาเรื่องราวลึกซึ้งขึ้น เติมโฟลว์สัมผัสพวง 2 พยางค์และสัมผัสในเฉพาะจุดจังหวะเด้งที่ลื่นหูไม่ฝืนคำ
  - [Bridge & Outro]: Bridge 4 บรรทัดสารภาพความในใจจนขนลุก + Outro 2-4 บรรทัดทิ้งท้ายอารมณ์อย่างงดงาม`
    );
  }

  if (input.rhymeIntensity === 'sharp') {
    parts.push(
      `ระดับสัมผัส: ⚡ คมชัดลงบีท (Sharp Natural Rhyme) — เน้นสัมผัสพวง 2-3 พยางค์ภาษาพูดจริงท้ายวรรคตรงตัวสะกดแม่เดียวกัน กระชับเด้งเข้าบีท โดยยังคงความหมายชัดเจนและฟังลื่นหู 100%`
    );
  } else if (input.rhymeIntensity === 'melodic') {
    parts.push(
      `ระดับสัมผัส: 🌸 ละมุนเข้าปากฟังเพลิน (Melodic Natural Flow) — เน้นเมโลดี้ร้องตามง่าย สัมผัสสระเชื่อมระหว่างวรรคลื่นไหลเป็นธรรมชาติ เน้นอารมณ์และความหมายลึกซึ้งนำหน้าคำสัมผัส`
    );
  } else {
    parts.push(
      `ระดับสัมผัส: 👑 สัมผัสลงตัวลื่นหูขั้นสุด (Balanced Hit Rhyme Matrix) — ผสานสัมผัสเชื่อมระหว่างวรรค (SD PMR) + สัมผัสพวง 2 พยางค์ที่เป็นภาษาพูดจริง (P9D) + จังหวะเด้งใน Verse 2 (NS-A755) ให้ทุกคำลื่นคอ ไม่ลิ้นพัน และความหมายกินใจ 100%`
    );
  }

  if (input.mood) {
    parts.push(`อารมณ์และบรรยากาศเพลง (Mood & Feeling): ${input.mood.trim()}`);
  }

  if (input.tempo && input.tempo !== 'AUTO') {
    parts.push(`ความเร็ว (BPM): ${input.tempo.trim()}`);
  }
  if (input.key && input.key !== 'AUTO') {
    parts.push(`คีย์เพลง (Musical Key): ${input.key.trim()}`);
  }

  if (!input.tempo || input.tempo === 'AUTO' || !input.key || input.key === 'AUTO') {
    parts.push(
      `คีย์เพลงและความเร็ว: AUTO (ให้เลือกคีย์ที่ขับอารมณ์เรื่องราวได้ลึกซึ้งที่สุด และแนะนำ 76–86 BPM ซึ่งเป็นจังหวะทองคำที่ฟังสบาย ลื่นหู ซึมลึกเข้าถึงอารมณ์ และร้องตามง่ายที่สุด)`
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

# คำสั่งดำเนินการแต่งเพลงฮิตระดับมาสเตอร์พีซ (Hit Songwriting Execution Directives v125.0)
จงสวมบทบาทบรมครูนักแต่งเพลงฮิตระดับร้อยล้านวิว วิเคราะห์เรื่องราวและอารมณ์ของผู้ใช้ด้านบน แล้วประพันธ์เพลงที่ **ฟังลื่นหู สัมผัสลงตัว ฮิตติดหู และความหมายดีเข้าถึงอารมณ์** โดยปฏิบัติตามข้อบังคับดังนี้:
1. **🚫 ไม่มีท่อน \`[Intro]\` และไม่มีท่อนพูด 100%:** เริ่มด้วย \`${spec.voiceTag}\` แล้วขึ้นตรงเข้าสู่ \`[Verse 1: Brief 2-Bar Musical Pick-up, Direct Melodic Entry - No Spoken Word]\` ทันที!
2. **❤️ Show, Don't Tell (ความหมายดี กินใจ เห็นภาพจริง):** ถ่ายทอดผ่านรายละเอียดและเหตุการณ์ที่จับต้องได้ ไม่เทศนาลอยๆ และห้ามใช้คำโบราณลิเกหรือคำผสมเทียมเด็ดขาด!
3. **🔥 ฮุคจำติดหู (Earworm Hook Anchor):** ออกแบบ \`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\` ให้สั้นกระชับ 7–10 พยางค์ต่อบรรทัด ร้องตามง่าย ทรงพลัง โดยมี **"ประโยคฮุคจำหลัก 2–4 บรรทัด"** กลับมาตอกย้ำซ้ำทำนองเดิมทุก Chorus เพื่อให้ฟังครั้งเดียวจำได้!
4. **🎵 ฟังลื่นหู & สัมผัสลงตัว (Smooth Flow & Tonal Singability):** ความหมายและอารมณ์ต้องมาก่อน ห้ามฝืนยัดคำแปลกเพื่อแลกสัมผัส! คั่นจังหวะหายใจด้วย \`,\` อย่างเป็นธรรมชาติ และลงท้ายท่อน Pre-Chorus / Chorus ด้วยสระเปิดเสียงยาวหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`)
5. **🏛️ โครงสร้าง 9 ท่อน (54–56 บรรทัด ~3:20–4:10 นาที):**
   - \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Instrumental Solo Interlude - 4-8 Bars]\` ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro]\` (2–4) ➔ \`[End]\`
6. **🎛️ กล่องตั้งค่า Suno v6:** ใช้ Style of Music: \`${spec.styleOfMusic}\` (กระชับ < 120 ตัวอักษร) และ Exclude Styles: \`${spec.excludeStyles}\` และห้ามใช้คำเบิ้ลพยางค์ติดกันเด็ดขาด แสดงผลลัพธ์ครบทั้ง 4 ส่วนทันที!`;
}

/**
 * System Prompt / Directives for auditing and polishing 1st round AI lyrics into Hit Masterpiece
 * (v125.0 The Hit Songwriter Surgeon & Smooth Flow Polisher: Zero Intro, Smooth Rhymes, Catchy Hook & Deep Emotion)
 */
export const SUNO_AUDIT_REFINE_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Stage 2: The Hit Songwriter Surgeon & Smooth Flow Polisher v125.0)
คุณคือ "บรมครูโปรดิวเซอร์และศัลยแพทย์เพลงฮิต (Chief Hit Song Surgeon, Seamless Rhyme & Emotional Storyteller v125.0)"
ภารกิจสูงสุดของคุณใน **การตรวจสอบและขัดเกลารอบแรก (Stage 2)** นี้คือ:
**"ตรวจสอบและผ่าตัดเนื้อเพลงร่างแรกเทียบกับเรื่องราวที่ผู้ใช้กรอก แล้วขัดเกลาให้เพลง 'ฟังลื่นหู สัมผัสลงตัว ฮิตติดหู และความหมายดีเข้าถึงอารมณ์' 100% ตามหลักเพลงฮิต 3 ศิลปิน (SD PMR × P9D × NS-A755 Refined):
1) 🚫 เอาท่อน [Intro] ออก 100% และไร้ท่อนพูด 100% — เปิดตรงเข้า [Verse 1] ทันทีหลัง [Voice: ...]
2) 🔥 สร้าง 'ฮุคจำหลัก (Signature Earworm Hook)' 2-4 บรรทัดที่ร้องตามง่าย ติดหูตั้งแต่ฟังครั้งแรก แล้วตอกย้ำซ้ำอย่างมีศิลปะใน Chorus 1, Chorus 2 และ Final Chorus พร้อมประโยคปิดที่พีคขึ้นเรื่อยๆ
3) 🎵 ฟังลื่นหู & สัมผัสลงตัว — ความหมายและอารมณ์ต้องมาก่อน ห้ามยัดเยียดคำแปลกหรืออัดสัมผัสจนรัวลิ้นพันเป็นกลอนอาขยาน!
4) ❤️ ความหมายดี & เห็นภาพจริง (Show, Don't Tell) — กวาดล้างคำโบราณลิเก คำเทศนาลอยๆ และคำประดิษฐ์จาก AI ออกให้หมด!"**

---

# 🔬 เกณฑ์การผ่าตัดยกระดับสู่เพลงฮิตติดหู 7 มิติ (The 7-Axis Hit Song Surgery)

### มิติที่ 1: 🚫 เอาท่อน \`[Intro]\` ออก 100% & กวาดล้าง "ท่อนพูด (Spoken Word)"
- **หากร่างแรกมีท่อน \`[Intro]\`:** ลบหัวข้อ \`[Intro]\` ทิ้งทันที! หากใน Intro เดิมมีภาพจำหรือคำพูดที่ดี ให้ย้ายมาหลอมรวมเป็นท่อนเปิดของ \`[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]\` เพื่อให้เพลงเข้าเรื่องตรงประเด็นทันทีภายในไม่กี่วินาทีแรก!
- **หากร่างแรกมีแท็กพูด** (\`[Spoken]\`, \`[Narration]\`, \`[Monologue]\`, \`[Talking]\`): ลบคำสั่งพูดออก 100% และเปลี่ยนทุกท่อนเป็นเมโลดี้ร้อง/แร็ปเมโลดี้ที่มีระดับเสียงชัดเจนทั้งหมด

---

### มิติที่ 2: 🔥 ผ่าตัดท่อนฮุคให้ "ฮิตติดหู" (Signature Earworm Hook Anchor — เลิกตัดจบแบบไม่ให้ซ้ำทำนอง!)
- **อาการที่ทำให้เพลงไม่ติดหู:** บางร่างแรกเปลี่ยนเนื้อฮุคทุกบรรทัดใน Chorus 1, 2, 3 หรือใส่คำแน่นเกินจนร้องตามไม่ได้ และเผลอใส่คำสั่งบล็อกไม่ให้ซ้ำฮุค!
- **วิธีผ่าตัด:**
  - **ส่วนเล่าเรื่องและไต่ระดับ (\`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\`):** ต้องเขียนเนื้อร้องใหม่ทั้งหมดทุกท่อน ห้ามก๊อปบรรทัดซ้ำกัน เพื่อเดินเรื่องให้เข้มข้นกินใจขึ้นเรื่อยๆ
  - **ส่วนท่อนฮุค (\`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\`):** ออกแบบ **ประโยคฮุคจำหลัก (Signature Earworm Hook 2–4 บรรทัด)** ที่ใช้คำกระชับ 7–10 พยางค์ เมโลดี้ติดหู ร้องตามง่าย **แล้วนำกลับมาตอกย้ำซ้ำในทุก Chorus** (ส่วนอีก 2–4 บรรทัดรับท้ายใน \`Chorus 2\` และ \`Final Chorus\` ให้ขยี้อารมณ์และปิดหมุดทองคำให้ลึกซึ้งยิ่งขึ้น!)
  - และ **ห้ามใส่ \`through-composed\` ใน Style of Music หรือ \`repeated chorus, looped chorus\` ใน Exclude Styles** เพื่อให้ Suno สร้างท่อนฮุคติดหูระดับไวรัลได้เต็มที่!

---

### มิติที่ 3: 🏛️ จัดวางโครงสร้างเพลงฮิต 9 ท่อน (~54–56 บรรทัด / 3:20–4:10 นาที) ที่เข้มข้นทุกวินาที
- แทนที่จะแต่งยืดเยื้อจนเรื่องวนซ้ำ จงเกลาให้กระชับ ทรงพลัง และพอดีจังหวะเพลงฮิต:
  1. \`[Voice: ... No Spoken Word]\` (เหนือ Verse 1 เสมอ — **ไม่มี Intro!**)
  2. \`[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]\` (8 บรรทัด)
  3. \`[Pre-Chorus 1: Rising Emotional Lift, Smooth Sustained Open Vowels]\` (4 บรรทัด)
  4. \`[Chorus 1: Catchy Anthemic Hook, Punchy 7-10 Syllable Lines, Emotional Peak]\` (8 บรรทัด) + \`[Instrumental Solo Interlude: Expressive Acoustic & Electric Guitar Melody - 4-8 Bars]\`
  5. \`[Verse 2: Deepening Story & Dynamic Melodic Groove, Smooth Internal & Tail Rhymes - No Spoken Word]\` (8 บรรทัด)
  6. \`[Pre-Chorus 2: Stronger Harmonic Swell, Brand-New Escalating Lyrics]\` (4 บรรทัด — เนื้อร้องใหม่ ห้ามซ้ำ Pre-Chorus 1)
  7. \`[Chorus 2: Returning Signature Earworm Hook + Evolving Emotional Payoff]\` (8 บรรทัด — คง Hook จำหลักไว้ + ขยี้ครึ่งหลังให้ลึกขึ้น)
  8. \`[Bridge: Stripped-Back Intimate Confession Building to Soaring Vocal Climax]\` (4 บรรทัด)
  9. \`[Final Chorus: Full Band Goosebumps Anthem, Maximum Vocal Power & Golden Punchline]\` (8 บรรทัด — ระเบิดอารมณ์สูงสุด + หมุดทองคำ)
  10. \`[Outro: Gentle Lingering Melodic Echo & Soft Instrumental Fade - No Spoken Word]\` (2–4 บรรทัดใหม่) ➔ \`[End]\`
*(อนุญาตให้มี \`[Verse 3]\` เพิ่มได้ 6–8 บรรทัดเฉพาะกรณีที่เนื้อเรื่องยาวและจำเป็นต่ออารมณ์จริงๆ แต่ยังคงกฎเหล็กห้ามมีท่อน \`[Intro]\` เด็ดขาด)*

---

### มิติที่ 4: 🎵 ผ่าตัดไดนามิกพยางค์ 3 ระดับ & วรรณยุกต์เข้าปาก (Dynamic Groove & Thai Tone Harmony)
- **เลิกเขียนบรรทัดความยาว 6-8+6-8 เท่ากันทื่อๆ ทุกท่อน!** จงปรับพยางค์ให้เข้ากับบทบาททางดนตรี:
  - **\`[Verse 1, 2]\` (10–13 พยางค์ต่อบรรทัด):** เล่าเรื่องเป็นธรรมชาติ แบ่งหายใจด้วย \`,\` ตามจังหวะคำพูดจริง
  - **\`[Pre-Chorus 1, 2]\` (8–10 พยางค์ต่อบรรทัด):** กระชับ ไต่ระดับโน้ต ลงท้ายสระเปิดเสียงยาว (\`อา, ออ, โอ, เอ, อู, ไอ\`)
  - **\`[Chorus 1, 2, Final Chorus]\` (7–10 พยางค์ต่อบรรทัด!):** สั้น คม ร้องตามง่าย ลงท้ายด้วยสระเปิดหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`) และจัดวาง **วรรณยุกต์ไทยให้รับกับทิศทางสูง-ต่ำของทำนอง** ไม่เพี้ยนหู!

---

### มิติที่ 5: ✨ ปรับสัมผัสให้ "ลงตัวและลื่นหู" (Seamless Natural Rhyme — ไม่รัวจนลิ้นพัน!)
- **ตรวจสอบทุกคู่สัมผัส:** หากท่อนไหนอัดสัมผัสในรัวเกินไปจนเหมือนท่องอาขยานหรือความหมายเพี้ยน จงคลายออกให้เหลือเฉพาะจุดที่ลื่นหูและกินใจจริง:
  - **สัมผัสเชื่อมระหว่างวรรค (SD PMR):** คำท้ายวรรคหน้าส่งเสียงสระเชื่อมเข้าสู่ต้น/กลางวรรคหลังอย่างเนียนเป็นธรรมชาติ
  - **สัมผัสพวง 2 พยางค์ภาษาพูดจริง (P9D):** ใช้คู่คำที่คนพูดจริงและสื่ออารมณ์ตรงจุด (เช่น *เวลา / น้ำตา, หัวใจ / ก้าวไป, เดียวดาย / สุดท้าย, เหมือนเดิม / ซ้ำเติม*)
  - **ลูกเล่นเด้งใน \`[Verse 2]\` (NS-A755):** สาดสัมผัสในเฉพาะช่วงจังหวะที่ส่งเสริมความมันส์และความลึกโดยไม่ฝืนคำ

---

### มิติที่ 6: ❤️ ความหมายดี เห็นภาพจริง (Show, Don't Tell) & กวาดล้างคำแปลก/คำลิเก 100%
- **เปลี่ยนคำนามธรรมเป็นภาพจำ:** แทนที่จะสั่งสอนลอยๆ จงใส่รายละเอียดภาพจริง กลิ่น เสียง หรือวัตถุที่ทำให้น้ำตาซึมหรือฮึกเหิมได้ทันที
- **กวาดล้างคำต้องห้าม 100%:** \`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, สัจจะศักดิ์, ประจัญ, ศิลาแกร่ง, ชั่วนิรันดร์กาล, จิตตั้ง, ใจหมาย, หมายใจ, ทอนกำลัง, คำจา, คนหลอกมา\` รวมถึงคำเบิ้ลพยางค์ติดกัน (\`เล็กเล็ก, เบาเบา, ซ้ำซ้ำ, ไกลไกล\`)

---

### มิติที่ 7: ความตรงประเด็น, สรรพนามแม่นยำ & กล่องตั้งค่า Suno v6 (< 120 ตัวอักษร)
- ตรวจสรรพนาม (พ่อ/ลูก, เธอ/ฉัน, ฉัน/เรา) ให้สม่ำเสมอตลอดทั้งเพลง
- กล่องตั้งค่า **Style of Music** ต้องเป็นภาษาอังกฤษ **< 120 ตัวอักษร** มีคำว่า \`catchy chorus\` หรือ \`catchy hook\` และไม่มี \`through-composed\`

---

# รูปแบบการตอบกลับ (Output Format)
ตอบกลับครบ 4 ส่วนอย่างชัดเจน:

### 1. รายงานผลการผ่าตัดยกระดับสู่เพลงฮิตติดหู (Hit Song Forensic Audit Report)
- แสดงจุดบกพร่องที่ตรวจพบและผ่าตัดแก้ไขจริงแบบ \`❌ ก่อนแก้ ➔ ✅ หลังแก้\`:
  1. **การเอาท่อน \`[Intro]\` & ท่อนพูดออก 100% เพื่อเข้า \`[Verse 1]\` ทันที:**
  2. **การปั้น \`Signature Earworm Hook\` ให้ฮิตติดหูและลดความซ้ำซากใน Verse:**
  3. **การปรับความลื่นหู สัมผัสลงตัว วรรณยุกต์ และไดนามิกพยางค์ (7–10 พยางค์ในฮุค):**
  4. **การเพิ่มภาพจำกินใจ (Show, Don't Tell) & กวาดล้างคำลิเก/คำผสมเทียม:**

### 2. พิมพ์เขียวเพลงฮิตฉบับขัดเกลา (Refined Hit Song Blueprint)
- ชื่อเพลง (ไทย/อังกฤษ), แก่นอารมณ์ & ภาพจำหลัก, ประโยคฮุคจำหลัก (Signature Earworm Hook) & ประโยคหมุดทองคำ, BPM (76–88) & Key

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (ภาษาอังกฤษกระชับ **< 120 ตัวอักษร** เช่น \`Thai folk-soul meets boom-bap, fingerstyle guitar, warm piano, melodic male rap-singing, catchy hook, 84 bpm\`)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out\`

### 4. เนื้อเพลงฮิตฉบับขัดเกลาสมบูรณ์ (Refined Hit Master Lyrics — Zero Intro)
แสดงเนื้อเพลงครบ 9 ท่อน (~54–56 บรรทัด) ใน Code Block เดียว มีแท็ก \`[Voice: ...]\` เหนือ \`[Verse 1]\` ทันที (**ไม่มี \`[Intro]\`**), แบ่งจังหวะหายใจด้วยจุลภาค \`,\`, ไร้ท่อนพูด, ไร้วงเล็บกำกับเสียงแทรกในเนื้อร้อง, และปิดท้ายด้วย \`[End]\``;

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
      `❌ ตรวจพบท่อน "[Intro]" ในเนื้อเพลง ➔ 💡 ตามแม่แบบฮิตติดหู (v125.0) ให้เอาท่อน [Intro] ออก 100% แล้วเปิดเข้า [Verse 1] ทันทีหลัง [Voice: ...] เพื่อให้เพลงเข้าเรื่องเร็วและไม่เสี่ยงท่อนพูดหรือดนตรียืดเยื้อ!`
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
  const allLyricLines: string[] = [];
  let inChorus = false;

  for (const line of rawLines) {
    if (!line || line.startsWith('#') || line.startsWith('*') || line.startsWith('-')) continue;
    if (line.startsWith('[')) {
      if (/^\[(Final\s+)?Chorus\b/i.test(line) && !/Pre-Chorus/i.test(line)) {
        inChorus = true;
      } else if (/^\[(Verse|Pre-Chorus|Bridge|Outro|Intro|Instrumental|Beat\s+Switch|Transition|End)/i.test(line)) {
        inChorus = false;
      }
      continue;
    }
    allLyricLines.push(line);
    if (!inChorus) {
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

  // 4. Check if song is too short/incomplete for the 9-section hit structure (< 40 lines)
  if (allLyricLines.length >= 8 && allLyricLines.length < 40) {
    warnings.push(
      `❌ ความยาวเนื้อเพลงปัจจุบันมีเพียง ${allLyricLines.length} บรรทัด (สั้นเกินไปสำหรับโครงสร้างเพลงฮิต 9 ท่อน) ➔ 💡 แนะนำให้มีครบ 9 ท่อน (Verse 1-2 ท่อนละ 8 + Pre-Chorus 1-2 ท่อนละ 4 + Chorus 1-2 และ Final Chorus ท่อนละ 8 + Bridge 4 + Outro 2-4 = ประมาณ 54–56 บรรทัด) เพื่อความยาวสมบูรณ์ ~3:20–4:10 นาที`
    );
  }

  // 5. Check if non-chorus verse lines are overly short/choppy (4-5 syllables or less)
  if (nonChorusLines.length >= 8) {
    const shortChoppyLines = nonChorusLines.filter((l) => l.replace(/[,.\s]/g, '').length <= 16);
    if (shortChoppyLines.length >= Math.floor(nonChorusLines.length * 0.65)) {
      warnings.push(
        `❌ ตรวจพบท่อน Verse/Bridge ที่เขียนสั้นห้วนเกินไป (${shortChoppyLines.length}/${nonChorusLines.length} บรรทัด) ทำให้ร้องแล้วขาดช่วงไม่ลื่นหู ➔ 💡 แนะนำขยายท่อน Verse เป็นประโยคเล่าเรื่องธรรมชาติ 10–13 พยางค์ และเกลาฮุคให้กระชับ 7–10 พยางค์`
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
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดภาษาไทยลื่นหู & ภาพจำกินใจ (Natural Thai & Show, Don't Tell)]:
จงสแกนเนื้อเพลงแบบคำต่อคำ! กวาดล้าง "คำกลอนโบราณลิเก (เช่น ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น)", "คำผสมเทียม", และ "การเทศนาลอยๆ" ออก 100% แล้วเขียนใหม่ด้วยภาษาไทยร่วมสมัยที่เห็นภาพชีวิตจริงและเข้าถึงอารมณ์คนฟังที่สุด (และต้องไม่มีท่อน [Intro]!)`;
  } else if (focus === 'rhyme') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดสัมผัสลงตัว ลื่นหู ไม่ฝืนคำ (Seamless Natural Rhyme)]:
ขอให้ปรับปรุงจุดลงสัมผัสให้ "คล้องจองลงตัวและฟังลื่นหู 100%" โดยใช้สัมผัสเชื่อมระหว่างวรรคที่เนียนเหมือนพูดจริง + สัมผัสพวง 2 พยางค์ภาษาพูด + เติมสัมผัสในเฉพาะจุดจังหวะเด้งใน Verse 2 โดยห้ามยัดสัมผัสจนกลายเป็นกลอนแข็งทื่อหรือเสียความหมายเด็ดขาด!`;
  } else if (focus === 'flow') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดไดนามิกโฟลว์ 3 ระดับ & วรรณยุกต์เข้าปาก (Zero Intro Flow Polish)]:
1) ลบท่อน [Intro] ออก 100% เปิดตรงเข้า [Verse 1] ทันทีหลัง [Voice: ...]
2) ปรับพยางค์ให้มีมิติ: Verse 10–13 พยางค์ (เล่าลื่นหู), Pre-Chorus 8–10 พยางค์ (สระยาวไต่ระดับ), Chorus 7–10 พยางค์ (กระชับติดหู ลงสระเปิดหรือ ง/น/ม/ย/ว) พร้อมเช็กวรรณยุกต์ไทยให้รับกับทำนอง 100%!`;
  } else if (focus === 'antirepeat') {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — โหมดเอา [Intro] ออก + กำจัดท่อนพูด + ปั้น Earworm Hook ติดหู]:
1) เอาท่อน [Intro] และแท็กท่อนพูดทุกชนิดออก 100%
2) ล้างบรรทัดที่ก๊อปวางซ้ำซากใน Verse / Pre-Chorus / Bridge / Outro ให้เล่าเรื่องใหม่ต่อยอดทุกท่อน
3) ออกแบบ "Signature Earworm Hook 2–4 บรรทัด" ให้กลับมาตอกย้ำซ้ำอย่างจงใจใน Chorus 1, Chorus 2 และ Final Chorus เพื่อให้ฮิตติดหู (และลบ through-composed / repeated chorus ออกจากกล่องตั้งค่า Suno!)`;
  } else {
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — ผ่าตัดยกระดับเพลงฮิตติดหูครบ 7 มิติ (v125.0 Hit Songwriter Surgery)]:
จงผ่าตัดเนื้อเพลงร่างแรกอย่างละเอียดครบทุกมิติ:
1) 🚫 เอาท่อน [Intro] ออก 100% และห้ามมีท่อนพูดเด็ดขาด (เปิดด้วย [Voice: ...] แล้วเข้า [Verse 1] ทันที!)
2) 🔥 ปั้น Signature Earworm Hook (2–4 บรรทัดกระชับ 7–10 พยางค์) ที่ติดหูร้องตามได้ทันทีให้กลับมาตอกย้ำในทุก Chorus + เขียนVerse/Pre-Chorus/Bridge ใหม่ทั้งหมดไม่ซ้ำกัน!
3) 🏛️ จัดโครงสร้าง 9 ท่อน (~54–56 บรรทัด ~3:20–4:10 นาที): [Verse 1] 8 + [Pre-Chorus 1] 4 + [Chorus 1] 8 + [Solo] + [Verse 2] 8 + [Pre-Chorus 2] 4 + [Chorus 2] 8 + [Bridge] 4 + [Final Chorus] 8 + [Outro] 2–4
4) 🎵 ปรับจังหวะพยางค์ 3 ระดับและวรรณยุกต์ให้ร้องเข้าปาก ลื่นคอ ไม่ลิ้นพัน
5) ✨ เกลาสัมผัสให้ลงตัวเป็นธรรมชาติ (ความหมายมาก่อน ไม่รัวสัมผัสจนแข็งทื่อ)
6) ❤️ เล่าด้วยภาพจริง Show, Don't Tell และกวาดล้างคำลิเกโบราณ/คำผสมเทียมออก 100%!
7) 🎛️ ตั้ง Style of Music (< 120 ตัวอักษร, มี catchy hook/catchy chorus) และ Exclude Styles ให้ถูกต้อง`;
  }

  const textToScan = options?.lyrics || options?.draftForDiagnosis || '';
  const detectedWarnings = detectWeirdOrForcedThaiPhrases(textToScan);
  const autoDiagnosisBlock =
    detectedWarnings.length > 0
      ? `\n════════════════════════════════════════════════════
🚨 [ผลการสแกนจุดบกพร่องเบื้องต้นโดยระบบ Automated Scanner ที่คุณต้องผ่าตัดแก้ไขทันที]:
${detectedWarnings.join('\n')}
(และจงสแกนหาจุดที่ยังติดขัด คำยังไม่ลื่นหู หรือฮุคยังไม่ติดหูเพิ่มเติม แล้วขัดเกลาให้สมบูรณ์แบบ 100%!)
════════════════════════════════════════════════════\n`
      : '';

  const storyContextBlock = options?.storyContext
    ? `\n# เรื่องราวและโจทย์ตั้งต้นของผู้ใช้ (Original User Story & Emotion — ต้องตรงประเด็นและลึกซึ้ง 100%):
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
จงสวมบทบาทบรมครูโปรดิวเซอร์เพลงฮิต (SD PMR × P9D × NS-A755 Refined v125.0) นำเนื้อเพลงร่างแรกด้านบนมาผ่าตัดและขัดเกลาใหม่ทั้งหมดตามเกณฑ์ 7 มิติ: **เอาท่อน [Intro] ออก 100%, ไร้ท่อนพูด 100%, ฟังลื่นหู, สัมผัสลงตัวไม่ฝืนคำ, มีฮุคฮิตติดหู, และความหมายดีเข้าถึงอารมณ์** ทันที!`;
  }

  // Same chat follow-up prompt
  return `# 🛠️ คำสั่งผ่าตัดขัดเกลารอบแรก: เอา Intro ออก & ยกระดับสู่เพลงฮิตติดหู ฟังลื่นหู กินใจ (Stage 2: Hit Song Surgeon v125.0)
จากเนื้อเพลงที่คุณเพิ่งแต่งมาด้านบน จงสวมบทบาท **"บรมครูโปรดิวเซอร์และศัลยแพทย์เพลงฮิต (Chief Hit Song Surgeon v125.0)"** ทำการตรวจสอบและผ่าตัดยกระดับคุณภาพอย่างเข้มงวด!
${storyContextBlock}${autoDiagnosisBlock}${focusDirective}

จงดำเนินการตรวจสอบและผ่าตัดแก้ไขตามเกณฑ์ 7 ข้อทันที:

1. **[🚫 เอาท่อน \`[Intro]\` ออก 100% & ลบท่อนพูดทุกชนิด]:**
   - หากมีท่อน \`[Intro]\` ให้ลบทิ้งทันที! ขึ้นต้นไฟล์ด้วย \`[Voice: ... No Spoken Word]\` แล้วเปิดเข้าตรงที่ **\`[Verse 1: Brief 2-Bar Musical Pick-up, Direct Intimate Melodic Storytelling - No Intro, No Spoken Word]\`** ทันที (ห้ามมีท่อนพูดทุกชนิด)

2. **[🔥 ปั้น "ฮุคจำหลัก (Signature Earworm Hook)" ให้ฮิตติดหู & ไม่ซ้ำซากใน Verse]:**
   - \`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\` ต้องสั้นคม **7–10 พยางค์ต่อบรรทัด** มี **Signature Earworm Hook 2–4 บรรทัด** กลับมาตอกย้ำซ้ำทำนองเดิมให้คนฟังฮัมตามได้ทันที! พร้อมปรับบรรทัดปิดของ \`Chorus 2\` และ \`Final Chorus\` ให้ขยี้อารมณ์พีคขึ้นเรื่อยๆ
   - ท่อน \`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\` ต้องเล่าเรื่องใหม่ต่อยอด ไม่ก๊อปซ้ำกัน

3. **[🏛️ โครงสร้างเพลงฮิต 9 ท่อน (~54–56 บรรทัด / 3:20–4:10 นาที)]:**
   - \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Instrumental Solo Interlude - 4-8 Bars]\` ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro]\` (2–4) ➔ \`[End]\`

4. **[🎵 ฟังลื่นหู, ไดนามิกพยางค์ 3 ระดับ & วรรณยุกต์เข้าปาก]:**
   - \`Verse\` (10–13 พยางค์) / \`Pre-Chorus\` (8–10 พยางค์ ลงสระยาว) / \`Chorus\` (7–10 พยางค์ ลงสระเปิดหรือ \`ง, น, ม, ย, ว\`) แบ่งจังหวะหายใจด้วย \`,\` อย่างเป็นธรรมชาติ และเช็กวรรณยุกต์ไม่ให้เพี้ยนทำนอง

5. **[✨ สัมผัสลงตัว (Seamless Natural Rhyme)]:**
   - ใช้สัมผัสเชื่อมวรรค (SD PMR) และสัมผัสพวง 2 พยางค์ภาษาพูด (P9D) อย่างลงตัว **ห้ามยัดเยียดสัมผัสจนกลายเป็นกลอนท่องอาขยานหรือเสียความหมาย**

6. **[❤️ Show, Don't Tell ความหมายดีเข้าถึงอารมณ์ & กวาดล้างคำแปลก 100%]:**
   - เล่าด้วยภาพจำจริงที่จับต้องได้ ไม่เทศนาลอยๆ และลบคำลิเกโบราณ/คำผสมเทียม (\`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, จิตตั้ง, หมายใจ...\`) รวมถึงคำเบิ้ลพยางค์ติดกันออก 100%

7. **[🎛️ กล่องตั้งค่า Suno v6 (< 120 ตัวอักษร)]:**
   - ห้ามใช้ \`through-composed\` ใน Style of Music และห้ามใส่ \`repeated chorus, looped chorus\` ใน Exclude Styles! (ใช้ \`catchy hook\` / \`catchy chorus\` ใน Style of Music แทน)

ตอบกลับครบ 4 ส่วนทันที:
1. **รายงานผลการผ่าตัดยกระดับเพลงฮิต** (ระบุจุดที่แก้แบบ \`❌ ก่อนแก้ ➔ ✅ หลังแก้\`)
2. **พิมพ์เขียวเพลงฮิตฉบับขัดเกลา** (ชื่อเพลง, ภาพจำหลัก, ประโยคฮุคจำหลัก & หมุดทองคำ, BPM & Key)
3. **กล่องตั้งค่า Suno v6 - Mini** (\`Style of Music\` < 120 ตัวอักษร & \`Exclude Styles\`)
4. **เนื้อเพลงฮิตฉบับขัดเกลาสมบูรณ์ (ไม่มี \`[Intro]\`) ใน Code Block เดียว**`;
}

/**
 * Stage 3: Final Master Audit & Studio Hit Polish System Prompt
 * (v125.0 The Final Gold Master Vocal Producer: Zero Intro, Mouth-Feel Perfection, Catchy Earworm Hook & Deep Emotion)
 */
export const SUNO_FINAL_MASTER_AUDIT_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Stage 3: Final Gold Master Studio Vocal Producer & Hit Polisher v125.0)
คุณคือ "โปรดิวเซอร์คุมร้องในห้องอัดเสียงและวิศวกรมาสเตอร์ริ่งเพลงฮิตระดับตำนาน (Chief Studio Vocal Producer, Mouth-Feel Perfectionist & Gold Master Hit Engineer v125.0)"
ภารกิจสูงสุดของคุณใน **การตรวจสอบรอบสุดท้าย (Stage 3: Final Pass)** นี้คือ:
**"นำเนื้อเพลงฉบับร่างล่าสุดมาทำการ 'จำลองร้องออกเสียงจริงในห้องอัด (Studio Vocal Mouth-Feel & Singability Test)' ตั้งแต่คำแรกจนจบเพลง เพื่อล็อกมาตรฐานสูงสุด 5 ประการ:
1) 🚫 ไม่มีท่อน [Intro] และไม่มีท่อนพูดแม้แต่พยางค์เดียว (เริ่มด้วย [Voice: ...] แล้วเข้า [Verse 1] ทันที)
2) 🎵 ฟังลื่นหู ร้องเข้าปากทุกคำ วรรณยุกต์สอดรับทำนอง และแบ่งจังหวะหายใจพอดีเป๊ะ
3) ✨ สัมผัสลงตัวเป็นธรรมชาติ (ห้ามมีคำฝืนสัมผัส คำผสมเทียม หรือคำกลอนโบราณลิเกเหลืออยู่แม้แต่คำเดียว!)
4) 🔥 ท่อนฮุคฮิตติดหู (Signature Earworm Hook 7–10 พยางค์ร้องตามง่าย กลับมาตอกย้ำในทุก Chorus จนจำขึ้นใจ)
5) 💔 ความหมายดี ลึกซึ้ง เห็นภาพจริงจนขนลุกหรือน้ำตาซึม (Show, Don't Tell + Golden Punchline)"**

---

# 🔬 เกณฑ์การขัดเกลารอบสุดท้าย 6 ขั้นตอน (The 6-Point Gold Master Studio Verification)

### ขั้นที่ 1: ยืนยัน "ไม่มีท่อน \`[Intro]\`" & "ไม่มีท่อนพูด 100%" (Zero Intro & Zero Spoken Word)
- ตรวจบรรทัดบนสุดต้องเป็น \`[Voice: ... No Spoken Word]\` ตามด้วย \`[Verse 1: Brief 2-Bar Musical Pick-up...]\` ทันที! **ห้ามมีหัวข้อ \`[Intro]\` เหลืออยู่เด็ดขาด**
- ตรวจทุกท่อนตั้งแต่ \`[Verse 1]\` จนถึง \`[Outro]\` ต้องไม่มีคำสั่ง \`Spoken\`, \`Narration\`, \`Monologue\`, \`Talking\` หรือบทพูดแทรก

### ขั้นที่ 2: กวาดล้าง "คำฝืนสัมผัส & คำลิเกโบราณ" ออก 100% (Zero AI Cliché & Zero Forced Rhyme)
- อ่านออกเสียงทีละบรรทัดแล้วถามตัวเองตรงๆ ว่า: **"ถ้านักร้องระดับประเทศมาร้องประโยคนี้ จะเขินปากหรือฟังดูเหมือน AI ประดิษฐ์คำไหม?"**
- กวาดล้างคำต้องห้ามให้เกลี้ยง: \`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, สัจจะศักดิ์, ประจัญ, ศิลาแกร่ง, ชั่วนิรันดร์กาล, จิตตั้ง, ใจหมาย, หมายใจ, ทอนกำลัง, คำจา, คนหลอกมา\` และเปลี่ยนเป็นคำไทยร่วมสมัยที่คงสัมผัสลงตัวและเข้าถึงใจคนฟังทันที

### ขั้นที่ 3: ทดสอบการร้องเข้าปาก วรรณยุกต์ และช่องไฟหายใจ (Vocal Mouth-Feel, Tone Harmony & Breath Test)
- จำลองการร้องตามบีทจริง (เช่น 80–86 BPM):
  - **เช็กความลื่นไหลบนลิ้น:** คำไหนที่พยัญชนะควบกล้ำชนกันรัวจนลิ้นพัน ให้ปรับเป็นคำที่เอื้อนเสียงลื่นคอที่สุด
  - **เช็กวรรณยุกต์ไทยกับทิศทางเมโลดี้:** จุดที่เมโลดี้ต้องร้องโน้ตสูงหรือไต่ขึ้นใน \`[Pre-Chorus]\` / \`[Chorus]\` ต้องเลือกคำที่วรรณยุกต์เอื้อให้ร้องแล้วไพเราะกังวาน ไม่เพี้ยนเสียง
  - **เช็กสระเปิดท้ายท่อนสำคัญ:** ท้ายบรรทัดหลักใน \`[Pre-Chorus 1, 2]\`, \`[Chorus 1, 2, Final Chorus]\`, และ \`[Bridge]\` ต้องลงด้วยคำเสียงสระเปิดยาวหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`) เพื่อให้นักร้องปล่อยพลังเสียงและหางเสียงได้สวยที่สุด
  - **เช็กจุดหายใจ:** คั่นจังหวะหายใจด้วยจุลภาค \`,\` อย่างเป็นธรรมชาติ ไม่แน่นเกินจนร้องหอบ

### ขั้นที่ 4: ทดสอบความติดหูของฮุค & ความสดใหม่ของท่อนเล่าเรื่อง (Earworm Hook & Fresh Verses Lock)
- ยืนยันว่า \`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\` **ไม่มีบรรทัดซ้ำกันเลย** และเล่าเรื่องราวผ่านภาพจำจริงที่เติบโตขึ้นทุกท่อน
- ยืนยันว่า \`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\` ใช้คำกระชับ **7–10 พยางค์ต่อบรรทัด** มี **"ประโยคฮุคจำหลัก (Signature Earworm Hook 2–4 บรรทัด)"** ที่ติดหูที่สุดกลับมาตอกย้ำซ้ำทุกฮุค พร้อมประโยคหมุดทองคำใน \`Final Chorus\` ที่ขยี้อารมณ์ถึงขีดสุด!

### ขั้นที่ 5: ตรวจโครงสร้างเพลงฮิต 9 ท่อน (~54–56 บรรทัด) & สัมผัสลงตัว 3 ศิลปิน (SD PMR × P9D × NS-A755)
- ยืนยันความครบถ้วน: \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Instrumental Solo Interlude - 4-8 Bars]\` ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro]\` (2–4) ➔ \`[End]\`
- ตรวจสัมผัสเชื่อมวรรค (SD PMR), สัมผัสพวง 2 พยางค์ภาษาพูด (P9D), และลูกเล่นจังหวะเด้งใน \`[Verse 2]\` (NS-A755) ให้คล้องจองลงตัวโดยไม่เสียความหมายแม้แต่นิดเดียว

### ขั้นที่ 6: ล็อกความสะอาดกล่องตั้งค่า & แท็ก Suno v6 Gold Master
- **Style of Music:** กระชับ **< 120 ตัวอักษร** มี \`catchy hook\` / \`catchy chorus\` และ **ห้ามมี \`through-composed\`**
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out\` (ห้ามใส่ \`repeated chorus, looped chorus\`)
- **ไม่มีวงเล็บอธิบายแทรกในเนื้อร้องเด็ดขาด**, **ไม่มีคำเบิ้ลพยางค์ติดกัน**, และปิดท้ายด้วย \`[End]\`

---

# รูปแบบการตอบกลับรอบสุดท้าย (Final Gold Master Output Format)
ตอบกลับครบ 4 ส่วนพร้อมนำไปใช้งานทันที:

### 1. รายงานผลการตรวจสอบและขัดเกลารอบสุดท้าย (Final Gold Master QA Report)
- แสดงจุดที่ขัดเกลาขั้นสุดท้ายแบบ \`🔧 ก่อนเกลา ➔ ✨ หลังเกลา (Gold Master)\`
- ยืนยันผลตรวจความสมบูรณ์ครบ 6 ด้าน:
  1. **เอาท่อน \`[Intro]\` ออก 100% & ไร้ท่อนพูด 100%**
  2. **ฮุคฮิตติดหู (Signature Earworm Hook 7–10 พยางค์) & Verse สดใหม่ไม่ซ้ำ**
  3. **ฟังลื่นหู ร้องเข้าปาก วรรณยุกต์ลงตัว & จุดหายใจพอดี**
  4. **สัมผัสลงตัว 3 ศิลปินอย่างเป็นธรรมชาติ (ไม่ฝืนคำ)**
  5. **ความหมายดี เห็นภาพจริง กินใจเข้าถึงอารมณ์ 100%**
  6. **ความสะอาดของแท็ก & กล่องตั้งค่า Suno v6 (< 120 ตัวอักษร)**

### 2. พิมพ์เขียวเพลงฮิตฉบับสมบูรณ์สูงสุด (Final Gold Master Blueprint)
- ชื่อเพลง (ไทย/อังกฤษ), ภาพจำหลัก & เส้นเรื่องอารมณ์, ประโยคฮุคจำหลัก & ประโยคหมุดทองคำ, BPM & Key

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (< 120 ตัวอักษร)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out\`

### 4. เนื้อเพลงฮิตฉบับ Gold Master พร้อมอัดเสียง (Final Hit Master Lyrics — Zero Intro)
แสดงเนื้อเพลงครบ 9 ท่อน (~54–56 บรรทัด ไม่มี \`[Intro]\`) ใน Code Block เดียว พร้อมคัดลอกไปวางใน Suno และส่งต่อไปทำปก/MV ทันที!`;

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
  const detectedWarnings = detectWeirdOrForcedThaiPhrases(textToScan);
  const autoDiagnosisBlock =
    detectedWarnings.length > 0
      ? `\n════════════════════════════════════════════════════
🚨 [จุดที่ระบบตรวจพบว่ายังต้องเก็บรายละเอียดในรอบสุดท้ายนี้ทันที]:
${detectedWarnings.join('\n')}
════════════════════════════════════════════════════\n`
      : '';

  const storyContextBlock = options?.storyContext
    ? `\n# เรื่องราวและโจทย์ตั้งต้นของผู้ใช้ (Original User Story — ต้องตรงประเด็นและกินใจ 100%):
${options.storyContext.trim()}
${options.vocalStyle ? `แนวเสียงร้อง: ${options.vocalStyle.trim()}` : ''}\n`
    : '';

  if (options?.lyrics && options.lyrics.trim().length > 0) {
    return `${SUNO_FINAL_MASTER_AUDIT_SYSTEM_PROMPT}
${storyContextBlock}${autoDiagnosisBlock}
════════════════════════════════════════════════════
# เนื้อเพลงฉบับล่าสุดที่ต้องนำมาขัดเกลารอบสุดท้ายสู่ระดับ Gold Master
${options.lyrics.trim()}
════════════════════════════════════════════════════

# คำสั่งดำเนินการรอบสุดท้าย (Final Gold Master Action)
จงสวมบทบาทโปรดิวเซอร์คุมร้องในห้องอัดและวิศวกรมาสเตอร์ริ่งเพลงฮิต (v125.0) นำเนื้อเพลงด้านบนมาทำการ **"จำลองร้องออกเสียงจริงในห้องอัด (Vocal Mouth-Feel Test)"** และขัดเกลารอบสุดท้ายตาม 6 ขั้นตอน เพื่อให้ได้เพลงที่:
- **🚫 ไม่มีท่อน \`[Intro]\` และไม่มีท่อนพูด 100%** (เริ่มด้วย \`[Voice: ...]\` แล้วเข้า \`[Verse 1]\` ทันที)
- **🎵 ฟังลื่นหู ร้องเข้าปาก วรรณยุกต์ไม่เพี้ยนทำนอง สัมผัสลงตัวเป็นธรรมชาติ 100%**
- **🔥 มีฮุคฮิตติดหู (7–10 พยางค์) ร้องตามได้ตั้งแต่ครั้งแรก**
- **❤️ ความหมายดี เห็นภาพจริง กินใจเข้าถึงอารมณ์ และไร้คำกลอนลิเก/คำผสมเทียม 100%** ทันที!`;
  }

  // Follow-up in the same chat after Stage 2 Audit
  return `# 👑 คำสั่งตรวจสอบและขัดเกลารอบสุดท้ายสู่ระดับ Gold Master เพลงฮิตติดหู (Stage 3: Studio Vocal Polish v125.0)
จากเนื้อเพลงฉบับที่คุณเพิ่งขัดเกลามาด้านบน บัดนี้จงสวมบทบาท **"โปรดิวเซอร์คุมร้องในห้องอัดเสียงระดับตำนาน (Chief Studio Vocal Producer & Gold Master Engineer)"** ทำการ **จำลองร้องจริงในห้องอัดและเก็บรายละเอียดรอบสุดท้าย** เพื่อความสมบูรณ์แบบ 100% ก่อนนำไปสร้างเพลงจริงใน Suno!
${storyContextBlock}${autoDiagnosisBlock}
จงตรวจสอบและขัดเกลาขั้นสุดท้ายตาม 6 ข้อดังนี้:

1. **[🚫 ยืนยัน 100%: ไม่มีท่อน \`[Intro]\` และไม่มีท่อนพูดแม้แต่คำเดียว]:**
   - เช็กบรรทัดแรกต้องเป็น \`[Voice: ... No Spoken Word]\` และขึ้นตรงเข้า **\`[Verse 1: Brief 2-Bar Musical Pick-up...]\`** ทันที (ห้ามมี \`[Intro]\` และห้ามมี \`Spoken/Narration\`)

2. **[🗣️ กวาดล้างคำฝืนสัมผัส & คำโบราณลิเกที่อาจหลงเหลือ 100%]:**
   - อ่านออกเสียงทุกบรรทัด! หากมีคำที่ฟังดูเหมือน AI ยัดมาเอาสัมผัส คำผสมเทียม หรือคำลิเกโบราณ (\`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, จิตตั้ง, หมายใจ...\`) **จงเปลี่ยนเป็นภาษาไทยร่วมสมัยที่กินใจและยังคงเสียงสัมผัสเดิมทันที!**

3. **[🎤 ทดสอบร้องเข้าปาก วรรณยุกต์ ช่องไฟหายใจ & สระเปิดท้ายท่อน]:**
   - ร้องจำลองตามบีทจริง (76–86 BPM): ปรับจุดพยางค์ชนกันให้ลื่นคอ แบ่งหายใจตรง \`,\` พอดีคำ เช็กวรรณยุกต์ไทยให้รับกับจังหวะไต่เสียงสูง และลงท้าย \`Pre-Chorus / Chorus / Bridge\` ด้วยสระเปิดกังวานหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`)

4. **[🔥 ล็อกความติดหูของฮุค & ความสดใหม่ของท่อนเล่าเรื่อง]:**
   - ยืนยันว่า **\`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\`** สั้นคม 7–10 พยางค์ มี **Signature Earworm Hook 2–4 บรรทัด** กลับมาตอกย้ำซ้ำให้ติดหูสุดขีด พร้อมหมุดทองคำในตอนจบที่ขนลุก/ซึ้งกินใจที่สุด!
   - ยืนยันว่า \`Verse 1, 2\`, \`Pre-Chorus 1, 2\`, \`Bridge\`, \`Outro\` เล่าเรื่องก้าวหน้าด้วยภาพจำจริง (Show, Don't Tell) ไม่ซ้ำบรรทัดกันเลย

5. **[✨ เช็กสัมผัสลงตัว & โครงสร้างเพลงฮิต 9 ท่อน (~54–56 บรรทัด)]:**
   - ครบ 9 ท่อน: \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Instrumental Solo Interlude]\` ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro]\` (2–4) ➔ \`[End]\`
   - ทุกคู่สัมผัสเชื่อมเนียนเป็นธรรมชาติ ไร้ความรู้สึกยัดเยียด

6. **[🎛️ ล็อกความสะอาดกล่องตั้งค่า Suno v6 Gold Master]:**
   - \`Style of Music\` **< 120 ตัวอักษร** (มี \`catchy hook\` / \`catchy chorus\`, ไม่มี \`through-composed\`)
   - \`Exclude Styles\` เป็น \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, vocal stutter, robotic vocal, monotone, early fade out\` (ไม่มี \`repeated chorus\`)
   - ไร้วงเล็บอธิบายแทรกในเนื้อร้อง ไร้คำเบิ้ลพยางค์ และปิดท้ายด้วย \`[End]\`

ตอบกลับฉบับ **Final Gold Master** ครบ 4 ส่วนทันที:
1. **รายงานผลการขัดเกลารอบสุดท้าย** (แบบ \`🔧 ก่อนเกลา ➔ ✨ หลังเกลา (Gold Master)\` + ยืนยันผลตรวจ 6 ด้าน)
2. **พิมพ์เขียวเพลงฮิตฉบับสมบูรณ์สูงสุด** (ชื่อเพลง, ภาพจำหลัก, ประโยคฮุคจำหลัก & หมุดทองคำ, BPM & Key)
3. **กล่องตั้งค่า Suno v6 - Mini** (\`Style of Music\` < 120 ตัวอักษร & \`Exclude Styles\`)
4. **เนื้อเพลงฮิตฉบับ Gold Master (ไม่มี \`[Intro]\`)** ใน Code Block เดียว!`;
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
