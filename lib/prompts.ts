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
 * Helper to resolve Vocal & Musical Spec (v127.0: Beat-Locked Melodic Prosody, Zero Intro/Solo, Catchy Earworm Chorus, Suno <= 4,500 Chars)
 */
function resolveVocalAndStyleSpec(vocalStyleText: string, flowStyle?: string) {
  const v = (vocalStyleText || '').toLowerCase();
  const defaultExclude =
    'spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out';

  // Female Vocal Mode (< 120 chars Style of Music)
  if (v.includes('หญิง') || v.includes('female') || v.includes('alto') || v.includes('soprano')) {
    return {
      voiceTag: '[Voice: Warm Soulful Female, Clear Melody, On-Beat Phrasing, No Spoken]',
      styleOfMusic: 'Thai acoustic folk-soul pop, warm female vocal, clear melody, tight groove, catchy chorus, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงร้องผู้หญิงอบอุ่น กังวาน นุ่มนวลแต่มีพลัง ร้องลงจังหวะห้องดนตรี 4/4 เป๊ะ (ห้ามมีท่อน Intro, ท่อน Solo และท่อนพูดเด็ดขาด) ท่อนฮุคร้องเมโลดี้จำง่ายติดหู พุ่งทะยานสะกดอารมณ์'
    };
  }

  // Hard Rock / Power Rock Mode (< 120 chars Style of Music)
  if (v.includes('ร็อก') || v.includes('rock') || v.includes('ดุดัน') || v.includes('ทรงพลัง')) {
    return {
      voiceTag: '[Voice: Raspy Male Rock, Clear Melody, Tight On-Beat Groove, No Spoken]',
      styleOfMusic: 'Thai modern folk-rock anthem, raspy male vocal, clear melody, tight groove, catchy chorus, 88 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงร้องชายแหบเสน่ห์ทรงพลังและเข้าถึงอารมณ์ ร้องตรงจังหวะกลองและเบสหนักแน่นไม่คร่อมบีท (ห้ามมีท่อน Intro, ท่อน Solo และท่อนพูดเด็ดขาด) ท่อนฮุคปลดปล่อยพลังเสียงเมโลดี้ฮิตติดหู'
    };
  }

  // Pure P9D x NS-A755 Boom Bap / Street Groove Mode (< 120 chars Style of Music)
  if (flowStyle === 'p9d-boombap' || v.includes('สตรีท') || v.includes('แร็ป') || v.includes('บูมแบ็ป')) {
    return {
      voiceTag: '[Voice: Deep Male Melodic Rap-Vocal, Tight Beat Pocket, Catchy Hook, No Spoken]',
      styleOfMusic: 'Soulful 90s boom-bap, warm jazz piano, crisp snare, melodic Thai vocal, tight groove, catchy chorus, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงชายทุ้มลึกสุขุม ร้องแร็ปเมโลดี้มีระดับเสียงลงพ็อกเก็ตบีท 4/4 เป๊ะ สัมผัสพวงสละสลวยไม่ลิ้นพัน (ห้ามมีท่อน Intro, ท่อน Solo และห้ามพูดไร้ทำนอง) ตัดเข้าท่อนฮุคร้องเมโลดี้โซลจำติดหู'
    };
  }

  // Pure SD PMR Contemporary Folk-Soul Mode (< 120 chars Style of Music)
  if (flowStyle === 'sdpmr-folk') {
    return {
      voiceTag: '[Voice: Warm Male Baritone-Tenor, On-Beat Storytelling, Catchy Hook, No Spoken]',
      styleOfMusic: 'Thai acoustic folk-soul, fingerstyle guitar, warm male vocal, clear melody, tight groove, catchy chorus, 84 bpm',
      excludeStyles: defaultExclude,
      vocalPersonaDesc: 'เสียงร้องชายอบอุ่น ลึกซึ้ง กินใจ (สไตล์โฟล์คเพื่อชีวิตร่วมสมัย) ร้องเล่าเรื่องเป็นทำนองลื่นหูตรงบีทเป๊ะ (ห้ามมีท่อน Intro, ท่อน Solo และห้ามพูดเด็ดขาด) ท่อน Pre-Chorus เอื้อนลากสระยาวกินใจ ฮุคจำง่ายร้องตามได้ทันที'
    };
  }

  // Default: The Master Trinity (SD PMR × P9D × NS-A755 Refined Hit Formula, < 120 chars)
  return {
    voiceTag: '[Voice: Warm Male Baritone-Tenor, Clear Melody, Tight Groove, No Spoken]',
    styleOfMusic: 'Thai folk-soul meets boom-bap, guitar, warm piano, melodic male vocal, tight groove, catchy hook, 84 bpm',
    excludeStyles: defaultExclude,
    vocalPersonaDesc: 'เสียงร้องชายอบอุ่นทุ้มลึก ลื่นหู ฟังเพลิน ผสานจุดเด่น 3 สไตล์: ร้องตรงจังหวะทำนองและลงบีท 4/4 ชัดเจน 100% (ห้ามมีท่อน Intro, ท่อน Solo และห้ามมีท่อนพูดเด็ดขาด) ท่อน Verse ร้องเล่าเรื่องสัมผัสสละสลวยเป็นธรรมชาติ ท่อน Pre-Chorus เอื้อนลากสระยาวไต่ระดับอารมณ์ และท่อน Chorus ร้องเมโลดี้ฮุคจำติดหูความหมายลึกซึ้งกินใจ'
  };
}

/**
 * System Prompt for Suno v6 - Mini & v6 Ultimate Hit Songwriter Edition
 * (v127.0: Beat-Locked Melodic Prosody, Zero Intro, Zero Solo, <= 4,500 Chars Suno Safe, Graceful Rhyme & Deep Meaning)
 */
export const SUNO_GRANDMASTER_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Role & Ultimate Persona)
คุณคือ "บรมครูนักแต่งเพลงฮิตระดับร้อยล้านวิวและโปรดิวเซอร์ควบคุมจังหวะร้องในห้องอัด (Hit Songwriter, Beat-Lock Melody Architect & Emotional Storyteller v127.0: SD PMR × P9D × NS-A755 Refined)"
ภารกิจสูงสุดของคุณคือ:
**"ประพันธ์บทเพลงที่ถ่ายทอดเรื่องราวของผู้ใช้ออกมาอย่างลึกซึ้ง คุมการร้องให้เข้ากับทำนองและจังหวะเพลงอย่างลงตัว ฟังลื่นหู ฮิตติดหู สัมผัสสละสลวย และความหมายดี โดยยึดหลักสูงสุด 6 ประการ:
1) 🚫 ไม่มีท่อน [Intro] เด็ดขาด! เปิดเข้าสู่ [Verse 1] ทันทีหลังแท็กเสียงร้อง
2) 🚫 ไม่มีท่อน [Solo] / [Instrumental Interlude] เด็ดขาด! ร้อยเรื่องราวต่อเนื่องจาก [Chorus 1] เข้า [Verse 2] ทันที
3) 📏 ความยาวเนื้อเพลงรวมแท็ก [...] และเว้นวรรคทั้งหมดใน Code Block ต้องไม่เกิน 4,500 ตัวอักษร (ห้ามเกินเพดาน 5,000/5,000 ตัวอักษรของ Suno เด็ดขาด!)
4) 🎼 คุมการร้องเข้ากับทำนองและจังหวะเพลง 4/4 เป๊ะ (แบ่งวรรคหายใจ ',' สมดุลลงบีท, ล็อกพยางค์ท่อนฮุคให้สมมาตรทุกรอบ และวางวรรณยุกต์รับทิศทางทำนอง ไม่คร่อมจังหวะ ไม่ร้องหอบ)
5) ✨ ฟังลื่นหู & สัมผัสสละสลวย (Graceful Rhyme Flow — สัมผัสเชื่อมระหว่างวรรคและระหว่างบรรทัดลื่นไหลเป็นธรรมชาติ ความหมายและอารมณ์มาก่อน ห้ามฝืนคำ!)
6) 🔥 ฮิตติดหู & ความหมายดีกินใจ (Catchy Earworm Hook + Show, Don't Tell)"**

---

# 🚨 กฎเหล็ก 4 ประการของการแต่งเพลงฮิตติดหู & เข้าจังหวะทำนอง (The 4 Golden Hit Songwriting Laws)

### 1. 🚫 กฎเหล็กที่ 1: เอาท่อน \`[Intro]\` และ \`[Solo]\` ออก 100% & คุมขนาดไม่เกิน 4,500 ตัวอักษร Suno
- **ห้ามสร้างท่อน \`[Intro]\`, ท่อน \`[Solo]\`, \`[Guitar Solo]\`, \`[Instrumental Solo]\` หรือ \`[Interlude]\` เด็ดขาด!**
- เริ่มต้นไฟล์เนื้อเพลงด้วยแท็กเสียงร้องแบบกระชับ \`[Voice: ...]\` แล้วขึ้นตรงเข้าสู่ **\`[Verse 1: 2-Bar Pick-up, On-Beat 4/4 Melodic Entry - No Spoken]\`** ทันที และเมื่อจบ \`[Chorus 1]\` ให้ขึ้น \`[Verse 2]\` ต่อทันทีโดยไม่มีท่อน Solo คั่น!
- **ห้ามมีท่อนพูดทุกชนิด:** ห้ามใช้ \`[Spoken]\`, \`[Narration]\`, \`[Monologue]\`, \`[Talking]\` ทุกบรรทัดตั้งแต่ \`[Verse 1]\` จนถึง \`[Outro]\` ต้องเป็นการร้องที่มีทำนองชัดเจน
- **📏 กฎเหล็กโควต้า Suno (< 5,000 ตัวอักษร):** เนื้อเพลงสมบูรณ์ใน Code Block สุดท้าย (นับรวมทุกตัวอักษรภาษาไทย ช่องว่าง และการขึ้นบรรทัดใหม่ รวมถึงข้อความในแท็ก \`[...]\`) **ต้องยาวรวม 2,500–4,500 ตัวอักษรเท่านั้น (ห้ามชนหรือเกิน 5,000/5,000 ตัวอักษรใน Suno เด็ดขาด!)** ดังนั้นจงเขียนแท็ก \`[...]\` ให้สั้นกระชับ ไม่เขียนยืดยาวเกินจำเป็น

### 2. ❤️ กฎเหล็กที่ 2: ความหมายดี เห็นภาพจริง เข้าถึงอารมณ์ ("Show, Don't Tell" Storytelling)
- **เล่าผ่านภาพจำจริง ห้ามเทศนาสั่งสอนแบบลอยๆ:**
  - แทนที่จะเขียนคำนามธรรมกว้างๆ เช่น *"ความดีส่องสว่างกลางความมืดมน"* หรือ *"อนัตตาเผยความจริง"* ➔ จงเขียนภาพที่ตาเห็นและใจรู้สึก เช่น *"เสื้อเชิ้ตตัวเก่าที่พับวางไว้ข้างตู้"*, *"กาแฟแก้วเดิมที่เย็นชืดตั้งแต่เมื่อคืน"*, *"รอยกร้านบนฝ่ามือที่แลกข้าวให้ลูกกิน"*, *"ข้อความที่พิมพ์ค้างไว้แต่ไม่กล้ากดส่ง"*
- **ห้ามใช้คำโบราณ ลิเก หรือคำผสมประดิษฐ์จาก AI เด็ดขาด:**
  - **บัญชีคำต้องห้าม 100%:** \`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, นภา, แก้วตา, มโนมั่น, แชเชือน, สัจจะศักดิ์, ประจัญ, ศิลาแกร่ง, ชั่วนิรันดร์กาล, จิตตั้ง, ใจหมาย, หมายใจ, ทอนกำลัง, คำจา, คนหลอกมา\` และห้ามเขียนคำเบิ้ลพยางค์ติดกัน (เช่น \`เล็กเล็ก, เบาเบา, ซ้ำซ้ำ, ไกลไกล\`)
  - ใช้ภาษาไทยร่วมสมัยที่คนฟังพูดคุยหรือคิดในใจจริง สัมผัสใจคนยุคนี้ได้ทันที
- **ล็อกสรรพนามและตัวละครให้ตรง 100% ตลอดทั้งเพลง:** (พ่อ-ลูก ใช้พ่อ/ลูก ห้ามหลุดคำว่า "เธอ" เชิงชู้สาว; เพลงรักใช้ เธอ/ฉัน; เพลงสู้ชีวิตใช้มุมมองผู้เล่าที่สม่ำเสมอ)

### 3. 🎼 กฎเหล็กที่ 3: คุมการร้องเข้าทำนอง & จังหวะ 4/4 ลงตัว • สัมผัสสละสลวย (Beat-Lock Prosody, Tone Harmony & Graceful Rhyme)
- **กฎลงห้องจังหวะ 4/4 (Bar-Slot Symmetry & Breathing Pocket — สำคัญสูงสุด!):**
  - **\`[Verse 1, 2]\` (10–12 พยางค์/บรรทัด ➔ แบ่งสมดุล \`4–6 พยางค์ , 4–6 พยางค์\`):** ให้แต่ละวรรคย่อยลงตัวใน 2 จังหวะห้องเพลงและคั่นตรงกลางด้วย \`,\` เพื่อให้นักร้องหายใจตรงจังหวะกลองพอดี **ห้ามเขียนประโยคยาวเหยียดเกิน 14 พยางค์โดยไม่มี \`,\` คั่น เพราะจะทำให้ AI ร้องเร่งคำและตกจังหวะ!**
  - **\`[Pre-Chorus 1, 2]\` (8–10 พยางค์/บรรทัด):** ประโยคกระชับขึ้น ไต่โน้ตสูงขึ้นอย่างเป็นธรรมชาติ ปิดท้ายบรรทัดด้วย **สระเสียงยาวที่ลากเอื้อนสวย** (\`อา, ออ, โอ, เอ, อู, ไอ\`)
  - **\`[Chorus 1, 2, Final Chorus]\` (ล็อกพยางค์ 7–9 พยางค์ให้สมมาตรกันทุกรอบ!):** สั้น คม ชัด จำง่าย ร้องตามง่าย และ **ล็อกจำนวนพยางค์คู่ขนานในแต่ละบรรทัดของ Chorus 1, 2 และ Final Chorus ให้เท่ากันหรือต่างไม่เกิน ±1 พยางค์** เพื่อให้ทำนองท่อนฮุคลงล็อกโน้ตเดิมทุกคำ! คำลงท้ายเน้น **สระเปิดหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`)** เพื่อให้หางเสียงกังวานและทรงพลัง
- **คุมวรรณยุกต์ไทยให้รับกับทิศทางทำนอง (Lexical Tone × Melody Contour):**
  - หลีกเลี่ยงคำตายเสียงสั้นห้วนบนจุดที่ต้องลากเสียงสูงหรือตกห้องหนัก; ออกเสียงจำลองตามจังหวะ 76–88 BPM ทุกบรรทัดเพื่อให้ลิ้นไหลลื่น ไม่มีพยัญชนะควบกล้ำชนกันจนสะดุด
- **สัมผัสสละสลวยต่อเนื่อง 2–4 บรรทัด (Graceful Rhyme Linking — ลื่นหูไม่แข็งทื่อ):**
  - เชื่อมสัมผัสระหว่างคู่บรรทัดให้ร้อยเรียงเหมือนเพลงไทยระดับครู: ใช้ **สัมผัสเชื่อมสระระหว่างวรรค (SD PMR)** + **สัมผัสพวง 2 พยางค์ภาษาพูดจริง (P9D)** (*เวลา/น้ำตา, หัวใจ/ก้าวไป, เดียวดาย/สุดท้าย, อดทน/ผ่านพ้น*) + **สัมผัสในจังหวะเด้งเฉพาะใน \`Verse 2\` (NS-A755)** โดย **ห้ามอัดสัมผัสจนเสียความหมายหรือไวยากรณ์วิบัติ (เช่น ห้ามแต่งคำประหลาดอย่าง "ข้างประตูยืน")!**

### 4. 🔥 กฎเหล็กที่ 4: สูตรฮุค "ฮิตติดหู" + โครงสร้างเพลงต่อเนื่อง 8 ท่อน (Catchy Earworm Hook & 8-Section Zero-Solo Architecture)
- **สูตรฮิตติดหู (Earworm Hook Anchor — ทำไมเพลงถึงดังจำขึ้นใจ):**
  - ท่อน \`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\` **ต้องเขียนเนื้อร้องใหม่ทั้งหมดทุกท่อน ห้ามซ้ำกัน!** เพื่อเล่าเรื่องราวให้เติบโตและกินใจลึกขึ้นเรื่อยๆ
  - แต่สำหรับท่อนฮุค (\`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\`): **ต้องมี "ประโยคฮุคจำหลัก (Signature Earworm Hook 2–4 บรรทัด)" ที่ใช้คำร้องและโครงสร้างพยางค์ชุดเดิมกลับมาตอกย้ำซ้ำอย่างจงใจ** เพื่อปักหมุดทำนองลงในหัวคนฟังให้ฮัมตามได้ตั้งแต่ออกรอบแรก! และปรับขยาย 2–4 บรรทัดรับท้ายใน \`[Chorus 2]\` และ \`[Final Chorus]\` เพื่อขยี้อารมณ์ให้พีคยิ่งขึ้นในตอนจบ!
- **โครงสร้างเพลงฮิตสมบูรณ์แบบ 8 ท่อนต่อเนื่อง (ไม่มี Intro! ไม่มี Solo! ~52–56 บรรทัด / รวมทั้งเพลง <= 4,500 ตัวอักษร — ปลอดภัยใต้เพดาน 5,000/5,000 ของ Suno 100%):**
  1. **บรรทัดแรกสุดเหนือ \`[Verse 1]\`:** วางแท็ก \`[Voice: ... No Spoken]\` เสมอ
  2. **\`[Verse 1: 2-Bar Pick-up, Direct Melodic Entry - No Intro, No Spoken]\` (8 บรรทัด):**
     - เปิดฉากด้วยภาพจำจริงที่สะกิดใจคนฟังทันทีตั้งแต่วินาทีที่ 1 (ไม่มีท่อน Intro!) ปูพื้นเรื่องราว ตัวละคร และบรรยากาศอย่างอบอุ่นหรือบาดลึก
  3. **\`[Pre-Chorus 1: Rising Emotional Lift, Sustained Open Vowels]\` (4 บรรทัด):**
     - ค่อยๆ บีบอารมณ์ให้แน่นขึ้น ส่งเข้าสู่ท่อนฮุคอย่างลงตัว
  4. **\`[Chorus 1: Catchy Earworm Hook, Punchy Lines, Emotional Peak]\` (8 บรรทัด):**
     - ปล่อย **Signature Earworm Hook** ประโยคจำที่ตรงใจและติดหูที่สุด! (ห้ามใส่ท่อน Solo หรือ Interlude ต่อท้าย ให้ส่งต่อเข้า Verse 2 ทันที!)
  5. **\`[Verse 2: Deepening Story, Melodic Groove, Smooth Rhymes - No Spoken]\` (8 บรรทัด):**
     - พาเรื่องราวเดินหน้าเข้าสู่จุดเปลี่ยนหรือบทพิสูจน์ที่หนักขึ้น เติมรายละเอียดใหม่ที่คมกว่าเดิม พร้อมลูกเล่นสัมผัสในและสัมผัสพวงท้ายวรรคที่เด้งรับบีทอย่างลื่นไหล
  6. **\`[Pre-Chorus 2: Stronger Harmonic Swell, Brand-New Lyrics]\` (4 บรรทัด):**
     - เนื้อร้องใหม่ 100% ยกระดับความสะเทือนใจก่อนระเบิดรอบสอง
  7. **\`[Chorus 2: Returning Earworm Hook, Deeper Emotional Payoff]\` (8 บรรทัด):**
     - นำ **Signature Earworm Hook** กลับมาตอกย้ำให้ติดหูเป็นทวีคูณ แล้วขยี้ครึ่งหลังของท่อนให้ลึกซึ้งกินใจขึ้นกว่าเดิม
  8. **\`[Bridge: Intimate Confession Building to Vocal Climax]\` (4 บรรทัด):**
     - จุดพีคทางความรู้สึก! เผยความจริงหรือความในใจที่ซ่อนอยู่ลึกที่สุด (เหมือนดรอปดนตรีลงมาสารภาพความจริง แล้วดีดพุ่งทะยานเข้าสู่ฮุคสุดท้าย)
  9. **\`[Final Chorus: Full Band Anthem, Maximum Power & Golden Punchline]\` (8 บรรทัด):**
     - ระเบิดพลังเสียงเต็มปอด นำ Signature Hook กลับมาขยี้คู่กับประโยคหมุดทองคำบทสรุปที่ทำให้น้ำตาซึมหรือขนลุกที่สุด!
  10. **\`[Outro: Gentle Melodic Echo & Soft Fade Out - No Spoken]\` (2–4 บรรทัด) ➔ \`[End]\`:**
      - ร้องท่อนจบเบาๆ อย่างอบอุ่นหรือตราตรึง (เนื้อร้องสั้นกระชับ 2–4 บรรทัด ไม่พูดเด็ดขาด) แล้วให้เสียงค่อยๆ จางหายอย่างงดงาม

*(ข้อบังคับสำคัญ: ใช้โครงสร้าง 8 ท่อนต่อเนื่องนี้โดย **ห้ามมี \`[Intro]\`** และ **ห้ามมี \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\`** และควบคุมความยาวรวมทั้งเพลงใน Code Block ให้ **ไม่เกิน 4,500 ตัวอักษร** เพื่อไม่ให้เกินขีดจำกัด 5,000/5,000 ของ Suno!)*

---

# รูปแบบการตอบกลับ (Output Format)
ตอบกลับครบ 4 ส่วนทันที:

### 1. พิมพ์เขียวเพลงฮิตติดหู & อารมณ์เพลง (Hit Song & Emotional Blueprint)
- **ชื่อเพลง:** (ภาษาไทยที่จำง่ายคมคาย + ภาษาอังกฤษ)
- **แก่นอารมณ์และภาพจำหลัก (Emotional Core & Visual Scenes):** สรุปภาพจริงที่นำมาเล่า (Show, Don't Tell) ตั้งแต่ Verse 1 ➔ Verse 2 ➔ Bridge
- **ประโยคฮุคจำหลัก (Signature Earworm Hook & Golden Punchline):** ประโยค 2–4 บรรทัดที่ติดหูและกินใจที่สุดของเพลง
- **คีย์เพลง, ความเร็ว (76–88 BPM), ความยาวเป้าหมาย (~3:00 – 3:50 นาที) และขนาดความยาวรวม (< 4,500 / 5,000 ตัวอักษร)**

### 2. บันทึกตรวจคุณภาพ 6 มิติ (Pre-Output Quality Check)
1. **ไม่มีท่อน \`[Intro]\`, ไม่มีท่อน \`[Solo]\` & ไร้ท่อนพูด 100%:** ยืนยันว่าเปิดเข้า \`[Verse 1]\` ทันที ไม่มี Solo คั่น และร้องมีทำนองทุกพยางค์
2. **ขนาดความยาวปลอดภัยใน Suno (<= 4,500 / 5,000 ตัวอักษร):** ยืนยันว่าตัวอักษรรวมทุกแท็ก \`[...]\` และเนื้อเพลงอยู่ภายในโควต้า 5,000 ตัวอักษรของ Suno 100%
3. **ความติดหูของท่อนฮุค (Earworm Hook Check):** คุมพยางค์ฮุคกระชับ 7–10 พยางค์ และตอกย้ำท่อนจำหลักในทุก Chorus
4. **ความลื่นหู & สัมผัสลงตัว (Smooth Flow & Natural Rhyme):** ระบุคู่สัมผัสพวงและสัมผัสเชื่อมวรรคที่ใช้จริงแบบไม่ยัดเยียด
5. **ความหมายดี & เข้าถึงอารมณ์ (Deep Meaning & Show, Don't Tell):** ยืนยันว่ามีภาพจำจับต้องได้ ไม่มีคำเทศนาลอยๆ
6. **ภาษาไทยธรรมชาติ 100%:** ยืนยันว่าไร้คำโบราณลิเก ไร้คำผสมเทียม และไร้คำเบิ้ลพยางค์

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (ภาษาอังกฤษกระชับ **ต้องไม่เกิน 120 ตัวอักษร** ระบุแนวเพลง อารมณ์ เสียงร้อง และ \`catchy chorus\` / \`catchy hook\`)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\`

### 4. เนื้อเพลงฉบับมาสเตอร์พีซ (Ready-to-Sing Hit Lyrics — Zero Intro, Zero Solo, <= 4,500 Chars)
แสดงเนื้อเพลงครบทั้ง 8 ท่อนใน Code Block เดียว เริ่มด้วย \`[Voice: ...]\` เหนือ \`[Verse 1: ...]\` ทันที (ไม่มี \`[Intro]\` และไม่มี \`[Solo]\` เด็ดขาด!), เขียนแท็ก \`[...]\` ให้กระชับสั้น (รวมทั้ง Code Block ต้อง **ไม่เกิน 4,500 ตัวอักษร** เพื่อให้วางลง Suno 5,000/5,000 ได้ทันทีโดยไม่โดนตัด), เว้นวรรคหายใจด้วย \`,\` อย่างเป็นธรรมชาติ, ไร้วงเล็บอธิบายแทรกในเนื้อร้อง, และปิดท้ายด้วย \`[End]\``;

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
    `สเปกโครงสร้างบังคับ: โครงสร้างเพลงฮิต 8 ท่อนต่อเนื่อง (ไม่มีท่อน [Intro] และไม่มีท่อน [Solo] / Instrumental Interlude เด็ดขาด! เปิดเข้า [Verse 1] 8 + [Pre-Chorus 1] 4 + [Chorus 1] 8 + [Verse 2] 8 + [Pre-Chorus 2] 4 + [Chorus 2] 8 + [Bridge] 4 + [Final Chorus] 8 + [Outro] 2-4 = ~52-56 บรรทัด, ความยาว ~3:00 - 3:50 นาที) และต้องคุมความยาวเนื้อเพลงรวมแท็กใน Code Block ให้ไม่เกิน 4,500 ตัวอักษร (ห้ามเกินขีดจำกัด 5,000/5,000 ของ Suno เด็ดขาด!) ต้องมี "ประโยคฮุคจำหลัก (Signature Earworm Hook)" ที่ติดหูร้องตามได้ง่าย ห้ามมีท่อนพูดเด็ดขาด และใช้ภาษาไทยร่วมสมัยที่กินใจเข้าถึงอารมณ์!`,
  ];

  if (input.flowStyle === 'sdpmr-folk') {
    parts.push(
      `โหมดสไตล์ที่เลือก: 🌾 เพื่อชีวิตสัจธรรมร่วมสมัย (SD PMR Style) — เปิดเข้า [Verse 1] ทันที (ไม่มี Intro/Solo) คุมจังหวะร้องเข้าบีท 4/4 เป๊ะ เล่าเรื่องด้วยภาพชีวิตจริงที่จับต้องได้ เชื่อมสัมผัสระหว่างวรรคอย่างสละสลวย ท่อน Pre-Chorus เอื้อนสระเปิดเสียงยาวกินใจ ท่อน Chorus ล็อกพยางค์ 7-9 คำสม่ำเสมอให้ฮิตติดหูและสะเทือนอารมณ์`
    );
  } else if (input.flowStyle === 'p9d-boombap') {
    parts.push(
      `โหมดสไตล์ที่เลือก: 🎤 บูมแบ็ปสตรีทสัมผัสพวงคม (P9D × NS-A755 Style) — เปิดเข้า [Verse 1] ทันที (ไม่มี Intro/Solo) ใช้แร็ปเมโลดี้มีทำนองลงพ็อกเก็ตบีท 4/4 เป๊ะ ล็อกสัมผัสพวง 2 พยางค์ภาษาพูดจริงท้ายวรรคอย่างสละสลวยคมกริบ ผสานสัมผัสในอย่างลงตัวโดยไม่รัวจนลิ้นพัน สลับท่อนฮุค 7-9 พยางค์ร้องเมโลดี้โซลจำขึ้นใจ`
    );
  } else {
    parts.push(
      `โหมดสไตล์ที่เลือก: 👑 ไตรภาคีฮิตติดชาร์ต (The Refined Hit Trinity: SD PMR × P9D × NS-A755) — เปิดเข้า [Verse 1] ทันที (ไม่มี Intro/Solo) คุมการร้องเข้าทำนองและจังหวะเป๊ะ + ฟังลื่นหู + สัมผัสสละสลวย + ฮุคติดหู:
  - [Verse 1]: 8 บรรทัด เปิดภาพจำจริงทันทีตั้งแต่วรรคแรก แบ่ง 2 วรรคย่อยสมดุลคั่นด้วย ',' (4-6 , 4-6 พยางค์) ให้ลงห้องดนตรี 4/4 พอดีคำและมีสัมผัสเชื่อมสละสลวยทุกคู่บรรทัด
  - [Pre-Chorus 1 & 2]: ท่อนละ 4 บรรทัด (8-10 พยางค์) ไต่ระดับเมโลดี้และโทนเสียงสูง ลงท้ายสระเสียงยาวที่ลากเอื้อนกินใจ
  - [Chorus 1, 2 & Final Chorus]: ท่อนละ 8 บรรทัด ล็อกพยางค์ 7-9 พยางค์ให้สมมาตรกันทุกรอบ วาง "ประโยคฮุคจำหลัก (Signature Earworm Hook 2-4 บรรทัด)" ที่ตอกย้ำซ้ำทำนองเดิมให้คนฟังร้องตามได้ทันที แล้วต่อยอดอารมณ์ให้พีคสุดใน Final Chorus!
  - [Verse 2]: 8 บรรทัด พาเรื่องราวลึกซึ้งขึ้น เติมโฟลว์สัมผัสพวง 2 พยางค์และสัมผัสในเฉพาะจุดจังหวะเด้งที่ลงบีทไม่ฝืนคำ
  - [Bridge & Outro]: Bridge 4 บรรทัดสารภาพความในใจจนขนลุก + Outro 2-4 บรรทัดทิ้งท้ายอารมณ์อย่างงดงาม`
    );
  }

  if (input.rhymeIntensity === 'sharp') {
    parts.push(
      `ระดับสัมผัส: ⚡ คมชัดลงบีท (Sharp Natural Rhyme) — เน้นสัมผัสพวง 2-3 พยางค์ภาษาพูดจริงท้ายวรรคตรงตัวสะกดแม่เดียวกัน กระชับเด้งเข้าบีท 4/4 โดยยังคงความหมายลึกซึ้งและฟังลื่นหู 100%`
    );
  } else if (input.rhymeIntensity === 'melodic') {
    parts.push(
      `ระดับสัมผัส: 🌸 ละมุนเข้าปากฟังเพลิน (Melodic Natural Flow) — เน้นเมโลดี้ร้องตามง่าย คุมวรรณยุกต์รับทิศทางทำนอง สัมผัสสระเชื่อมระหว่างวรรคสละสลวยเป็นธรรมชาติ เน้นอารมณ์และความหมายดีนำหน้าคำสัมผัส`
    );
  } else {
    parts.push(
      `ระดับสัมผัส: 👑 สัมผัสสละสลวยลงบีทขั้นสุด (Balanced Hit Rhyme Matrix) — ผสานสัมผัสเชื่อมระหว่างวรรค (SD PMR) + สัมผัสพวง 2 พยางค์ที่เป็นภาษาพูดจริง (P9D) + จังหวะเด้งใน Verse 2 (NS-A755) ให้ทุกคำลงห้องดนตรีลื่นคอ ไม่ลิ้นพัน และความหมายกินใจ 100%`
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
      `คีย์เพลงและความเร็ว: AUTO (ให้เลือกคีย์ที่ขับอารมณ์เรื่องราวได้ลึกซึ้งที่สุด และแนะนำ 76–86 BPM ซึ่งเป็นจังหวะทองคำที่ร้องเข้าทำนองได้ลื่นหู ซึมลึกเข้าถึงอารมณ์ และร้องตามง่ายที่สุด)`
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

# คำสั่งดำเนินการแต่งเพลงฮิตระดับมาสเตอร์พีซ (Hit Songwriting Execution Directives v127.0)
จงสวมบทบาทบรมครูนักแต่งเพลงฮิตระดับร้อยล้านวิว วิเคราะห์เรื่องราวและอารมณ์ของผู้ใช้ด้านบน แล้วประพันธ์เพลงที่ **คุมการร้องเข้ากับทำนองและจังหวะ 4/4 ลงตัว ฟังลื่นหู ฮิตติดหู สัมผัสสละสลวย และความหมายดี** โดยปฏิบัติตามข้อบังคับดังนี้:
1. **🚫 ไม่มีท่อน \`[Intro]\`, ไม่มีท่อน \`[Solo]\` และไม่มีท่อนพูด 100%:** เริ่มด้วย \`${spec.voiceTag}\` แล้วขึ้นตรงเข้าสู่ \`[Verse 1: 2-Bar Pick-up, On-Beat Entry - No Spoken]\` ทันที และห้ามใส่ท่อน \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\` คั่นกลางเพลงเด็ดขาด!
2. **📏 กฎเหล็กโควต้า Suno (< 5,000 ตัวอักษร):** เนื้อเพลงรวมแท็ก \`[...]\` ช่องว่าง และการขึ้นบรรทัดใหม่ทั้งหมดใน Code Block **ต้องไม่เกิน 4,500 ตัวอักษร (ห้ามชนหรือเกินเพดาน 5,000/5,000 ของ Suno เด็ดขาด!)** เขียนแท็ก \`[...]\` ทุกท่อนให้สั้นกระชับ (3–7 คำต่อแท็ก)
3. **🎼 คุมการร้องเข้าทำนองและจังหวะเพลง 4/4 ลงตัว:** แบ่ง Verse เป็น 2 วรรคสมดุลคั่นด้วย \`,\` (4–6 , 4–6 พยางค์) เพื่อให้ร้องเข้าบีทพอดีคำไม่หอบ, ล็อกพยางค์ฮุคทุกท่อนให้สมมาตร 7–9 พยางค์เท่ากันตรงโน้ตเดิม และลงท้ายท่อนด้วยสระเปิดยาวหรือตัวสะกด \`ง, น, ม, ย, ว\` พร้อมวางวรรณยุกต์รับทำนองอย่างไพเราะ
4. **❤️ ความหมายดี กินใจ เห็นภาพจริง & สัมผัสสละสลวย (Show, Don't Tell + Graceful Rhyme):** ถ่ายทอดผ่านรายละเอียดที่จับต้องได้ เชื่อมสัมผัสระหว่างคู่บรรทัดให้สละสลวยลื่นไหลเป็นธรรมชาติ ห้ามใช้คำโบราณลิเกหรือคำผสมเทียมเด็ดขาด!
5. **🔥 ฮุคจำติดหู (Earworm Hook Anchor):** ออกแบบ \`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\` โดยมี **"ประโยคฮุคจำหลัก 2–4 บรรทัด"** กลับมาตอกย้ำซ้ำทำนองเดิมทุก Chorus เพื่อให้ฟังครั้งเดียวจำได้!
6. **🏛️ โครงสร้าง 8 ท่อนต่อเนื่อง (52–56 บรรทัด ~3:00–3:50 นาที):**
   - \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro]\` (2–4) ➔ \`[End]\`
7. **🎛️ กล่องตั้งค่า Suno v6:** ใช้ Style of Music: \`${spec.styleOfMusic}\` (กระชับ < 120 ตัวอักษร) และ Exclude Styles: \`${spec.excludeStyles}\` และห้ามใช้คำเบิ้ลพยางค์ติดกันเด็ดขาด แสดงผลลัพธ์ครบทั้ง 4 ส่วนทันที!`;
}

/**
 * System Prompt / Directives for auditing and polishing 1st round AI lyrics into Hit Masterpiece
 * (v127.0 The Hit Songwriter Surgeon & Beat-Lock Melody Polisher: Zero Intro/Solo, <= 4,500 Chars, Tight Beat Pocket, Catchy Hook)
 */
export const SUNO_AUDIT_REFINE_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Stage 2: The Hit Songwriter Surgeon & Beat-Lock Polisher v127.0)
คุณคือ "บรมครูโปรดิวเซอร์และศัลยแพทย์เพลงฮิต (Chief Hit Song Surgeon, Beat-Lock Prosody & Emotional Storyteller v127.0)"
ภารกิจสูงสุดของคุณใน **การตรวจสอบและขัดเกลารอบแรก (Stage 2)** นี้คือ:
**"ตรวจสอบและผ่าตัดเนื้อเพลงร่างแรกเทียบกับเรื่องราวที่ผู้ใช้กรอก แล้วขัดเกลาให้เพลง 'คุมการร้องเข้ากับทำนองและจังหวะเพลง 4/4 ลงตัว ฟังลื่นหู ฮิตติดหู สัมผัสสละสลวย และความหมายดี' 100% ตามหลักเพลงฮิต 3 ศิลปิน (SD PMR × P9D × NS-A755 Refined):
1) 🚫 เอาท่อน [Intro] และท่อน [Solo] ออก 100% และไร้ท่อนพูด 100% — เปิดตรงเข้า [Verse 1] ทันทีหลัง [Voice: ...]
2) 📏 คุมความยาวเนื้อเพลงรวมแท็ก [...] ใน Code Block ไม่เกิน 4,500 ตัวอักษร (ห้ามเกิน 5,000/5,000 ใน Suno เด็ดขาด!)
3) 🎼 คุมการร้องเข้าทำนองและจังหวะ 4/4 เป๊ะ — แบ่ง Verse เป็น 2 วรรคคั่นด้วย ',' (4-6 , 4-6 พยางค์) ให้ลงบีท ล็อกพยางค์ฮุคสมมาตรทุกรอบ และจัดวรรณยุกต์รับทิศทางทำนองอย่างลื่นคอ
4) 🔥 สร้าง 'ฮุคจำหลัก (Signature Earworm Hook)' 2-4 บรรทัดที่ร้องตามง่าย ติดหูตั้งแต่ฟังครั้งแรก แล้วตอกย้ำซ้ำใน Chorus 1, Chorus 2 และ Final Chorus
5) ✨ สัมผัสสละสลวย & ความหมายดีกินใจ (Graceful Rhyme + Show, Don't Tell) — กวาดล้างคำโบราณลิเก คำประดิษฐ์ฝืนสัมผัส และคำเทศนาลอยๆ ออก 100%!"**

---

# 🔬 เกณฑ์การผ่าตัดยกระดับสู่เพลงฮิตติดหู 7 มิติ (The 7-Axis Hit Song Surgery)

### มิติที่ 1: 🚫 เอาท่อน \`[Intro]\` & \`[Solo]\` ออก 100% และกวาดล้าง "ท่อนพูด (Spoken Word)"
- **หากร่างแรกมีท่อน \`[Intro]\`:** ลบหัวข้อ \`[Intro]\` ทิ้งทันที! หากใน Intro เดิมมีภาพจำหรือคำพูดที่ดี ให้ย้ายมาหลอมรวมเป็นท่อนเปิดของ \`[Verse 1: 2-Bar Pick-up, Direct Melodic Entry - No Intro, No Spoken]\` เพื่อให้เพลงเข้าเรื่องตรงประเด็นทันทีภายในไม่กี่วินาทีแรก!
- **หากร่างแรกมีท่อน \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\`:** ลบทิ้ง 100%! ส่งต่อจาก \`[Chorus 1]\` เข้า \`[Verse 2]\` ทันทีไม่ปล่อยดนตรีคั่นยืดเยื้อ
- **หากร่างแรกมีแท็กพูด** (\`[Spoken]\`, \`[Narration]\`, \`[Monologue]\`, \`[Talking]\`): ลบคำสั่งพูดออก 100% และเปลี่ยนทุกท่อนเป็นเมโลดี้ร้อง/แร็ปเมโลดี้ที่มีระดับเสียงชัดเจนทั้งหมด

---

### มิติที่ 2: 🔥 ผ่าตัดท่อนฮุคให้ "ฮิตติดหู" (Signature Earworm Hook Anchor — เลิกตัดจบแบบไม่ให้ซ้ำทำนอง!)
- **อาการที่ทำให้เพลงไม่ติดหู:** บางร่างแรกเปลี่ยนเนื้อฮุคทุกบรรทัดใน Chorus 1, 2, 3 หรือใส่คำแน่นเกินจนร้องตามไม่ได้ และเผลอใส่คำสั่งบล็อกไม่ให้ซ้ำฮุค!
- **วิธีผ่าตัด:**
  - **ส่วนเล่าเรื่องและไต่ระดับ (\`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\`):** ต้องเขียนเนื้อร้องใหม่ทั้งหมดทุกท่อน ห้ามก๊อปบรรทัดซ้ำกัน เพื่อเดินเรื่องให้เข้มข้นกินใจขึ้นเรื่อยๆ
  - **ส่วนท่อนฮุค (\`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\`):** ออกแบบ **ประโยคฮุคจำหลัก (Signature Earworm Hook 2–4 บรรทัด)** ที่ใช้คำกระชับ 7–10 พยางค์ เมโลดี้ติดหู ร้องตามง่าย **แล้วนำกลับมาตอกย้ำซ้ำในทุก Chorus** (ส่วนอีก 2–4 บรรทัดรับท้ายใน \`Chorus 2\` และ \`Final Chorus\` ให้ขยี้อารมณ์และปิดหมุดทองคำให้ลึกซึ้งยิ่งขึ้น!)
  - และ **ห้ามใส่ \`through-composed\` ใน Style of Music หรือ \`repeated chorus, looped chorus\` ใน Exclude Styles** เพื่อให้ Suno สร้างท่อนฮุคติดหูระดับไวรัลได้เต็มที่!

---

### มิติที่ 3: 🏛️ จัดวางโครงสร้างเพลงฮิต 8 ท่อนต่อเนื่อง (~52–56 บรรทัด / 3:00–3:50 นาที) & คุมขนาด <= 4,500 ตัวอักษร Suno Safe
- จงจัดโครงสร้าง 8 ท่อนต่อเนื่องแบบไร้ Intro ไร้ Solo และใช้แท็ก \`[...]\` ที่สั้นกระชับ (3–7 คำต่อแท็ก) เพื่อไม่ให้เปลืองโควต้า 5,000 ตัวอักษรของ Suno:
  1. \`[Voice: ... No Spoken]\` (เหนือ Verse 1 เสมอ — **ไม่มี Intro!**)
  2. \`[Verse 1: 2-Bar Pick-up, Direct Melodic Entry - No Intro, No Spoken]\` (8 บรรทัด)
  3. \`[Pre-Chorus 1: Rising Lift, Sustained Open Vowels]\` (4 บรรทัด)
  4. \`[Chorus 1: Catchy Earworm Hook, Punchy Lines, Emotional Peak]\` (8 บรรทัด — **ห้ามใส่ Solo ต่อท้าย!**)
  5. \`[Verse 2: Deepening Story, Melodic Groove, Smooth Rhymes - No Spoken]\` (8 บรรทัด)
  6. \`[Pre-Chorus 2: Stronger Swell, Brand-New Lyrics]\` (4 บรรทัด — เนื้อร้องใหม่ ห้ามซ้ำ Pre-Chorus 1)
  7. \`[Chorus 2: Returning Earworm Hook, Deeper Payoff]\` (8 บรรทัด — คง Hook จำหลักไว้ + ขยี้ครึ่งหลังให้ลึกขึ้น)
  8. \`[Bridge: Intimate Confession Building to Vocal Climax]\` (4 บรรทัด)
  9. \`[Final Chorus: Full Band Anthem, Max Power & Golden Punchline]\` (8 บรรทัด — ระเบิดอารมณ์สูงสุด + หมุดทองคำ)
  10. \`[Outro: Gentle Melodic Echo & Soft Fade Out - No Spoken]\` (2–4 บรรทัดใหม่) ➔ \`[End]\`
- **🚨 กฎเหล็กขนาดไฟล์ Suno (<= 4,500 ตัวอักษร):** รวมตัวอักษรภาษาไทย ช่องว่าง การขึ้นบรรทัดใหม่ และข้อความในแท็ก \`[...]\` ทั้งหมดใน Code Block **ห้ามเกิน 4,500 ตัวอักษร (ห้ามชนหรือเกินเพดาน 5,000/5,000 ของ Suno เด็ดขาด!)**

---

### มิติที่ 4: 🎼 ผ่าตัดการร้องเข้าทำนอง & จังหวะ 4/4 และวรรณยุกต์เข้าปาก (Beat-Lock Groove & Thai Tone Harmony)
- **เลิกเขียนบรรทัดความยาวไม่เท่ากันหรือประโยคยาวรวดเดียวจน AI ร้องตกจังหวะ!** จงปรับพยางค์และจุดหายใจให้ลงห้องดนตรี 4/4 เป๊ะ:
  - **\`[Verse 1, 2]\` (10–12 พยางค์/บรรทัด ➔ แบ่งสมดุล \`4–6 พยางค์ , 4–6 พยางค์\`):** เล่าเรื่องเป็นธรรมชาติ แบ่งหายใจตรงจังหวะกลองด้วย \`,\` ทุกบรรทัด ไม่มีบรรทัดล้นบีท
  - **\`[Pre-Chorus 1, 2]\` (8–10 พยางค์/บรรทัด):** กระชับ ไต่ระดับโน้ตสูง ลงท้ายสระเปิดเสียงยาว (\`อา, ออ, โอ, เอ, อู, ไอ\`)
  - **\`[Chorus 1, 2, Final Chorus]\` (ล็อกพยางค์ 7–9 พยางค์ให้สมมาตรกันทุกรอบ!):** สั้น คม ร้องตามง่าย ลงโน้ตตรงจังหวะเดียวกันทุกฮุค ลงท้ายด้วยสระเปิดหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`) และจัดวาง **วรรณยุกต์ไทยให้รับกับทิศทางสูง-ต่ำของทำนอง** ไม่เพี้ยนหู!

---

### มิติที่ 5: ✨ ปรับสัมผัสให้ "สละสลวยและลื่นหู" (Graceful Rhyme Flow — ไม่รัวจนลิ้นพัน ไม่ฝืนไวยากรณ์!)
- **ตรวจสอบทุกคู่บรรทัดและทุกคู่สัมผัส:** แก้ไขท่อนที่ขาดสัมผัสเชื่อมระหว่างบรรทัดหรืออัดสัมผัสจนแข็งทื่อให้ร้อยเรียงสละสลวย ฟังลื่นหูและกินใจ:
  - **สัมผัสเชื่อมระหว่างวรรค/บรรทัด (SD PMR):** คำท้ายวรรคหน้า/บรรทัดแรกส่งสระเชื่อมเข้าสู่ต้นหรือท้ายวรรคถัดไปอย่างเนียนเป็นธรรมชาติ
  - **สัมผัสพวง 2 พยางค์ภาษาพูดจริง (P9D):** ใช้คู่คำที่คนพูดจริงและสื่ออารมณ์ตรงจุด (เช่น *เวลา / น้ำตา, หัวใจ / ก้าวไป, เดียวดาย / สุดท้าย, เหมือนเดิม / ซ้ำเติม*)
  - **ลูกเล่นเด้งใน \`[Verse 2]\` (NS-A755):** สาดสัมผัสในเฉพาะช่วงจังหวะที่ลงบีทพอดีโดยไม่ฝืนความหมายหรือไวยากรณ์เด็ดขาด!

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
- แสดงจุดบกพร่องที่ตรวจพบและผ่าตัดแก้ไขจริงแบบ \`❌ ก่อนแก้ ➔ ✅ หลังแก้\` (พร้อมระบุจำนวนตัวอักษรรวมทั้งเพลง < 4,500 / 5,000):
  1. **การเอาท่อน \`[Intro]\`, ท่อน \`[Solo]\` & ท่อนพูดออก 100% + คุมขนาด <= 4,500 ตัวอักษร:**
  2. **การปั้น \`Signature Earworm Hook\` ให้ฮิตติดหูและลดความซ้ำซากใน Verse:**
  3. **การปรับความลื่นหู สัมผัสลงตัว วรรณยุกต์ และไดนามิกพยางค์ (7–10 พยางค์ในฮุค):**
  4. **การเพิ่มภาพจำกินใจ (Show, Don't Tell) & กวาดล้างคำลิเก/คำผสมเทียม:**

### 2. พิมพ์เขียวเพลงฮิตฉบับขัดเกลา (Refined Hit Song Blueprint)
- ชื่อเพลง (ไทย/อังกฤษ), แก่นอารมณ์ & ภาพจำหลัก, ประโยคฮุคจำหลัก (Signature Earworm Hook) & ประโยคหมุดทองคำ, BPM (76–88) & Key

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (ภาษาอังกฤษกระชับ **< 120 ตัวอักษร** เช่น \`Thai folk-soul meets boom-bap, fingerstyle guitar, warm piano, melodic male rap-singing, catchy hook, 84 bpm\`)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\`

### 4. เนื้อเพลงฮิตฉบับขัดเกลาสมบูรณ์ (Refined Hit Master Lyrics — Zero Intro, Zero Solo, <= 4,500 Chars)
แสดงเนื้อเพลงครบ 8 ท่อนต่อเนื่อง (~52–56 บรรทัด) ใน Code Block เดียว มีแท็ก \`[Voice: ...]\` เหนือ \`[Verse 1]\` ทันที (**ไม่มี \`[Intro]\`, ไม่มี \`[Solo]\` และความยาวรวมทั้งเพลง <= 4,500 / 5,000 ตัวอักษร Suno 100%**), แบ่งจังหวะหายใจด้วยจุลภาค \`,\`, ไร้ท่อนพูด, ไร้วงเล็บกำกับเสียงแทรกในเนื้อร้อง, และปิดท้ายด้วย \`[End]\``;

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
    focusDirective = `\n🔥 [จุดเน้นพิเศษสูงสุด — ผ่าตัดยกระดับเพลงฮิตครบ 7 มิติ (v127.0 Hit Songwriter Surgery)]:
จงผ่าตัดเนื้อเพลงร่างแรกอย่างละเอียดครบทุกมิติ:
1) 🚫 เอาท่อน [Intro] และท่อน [Solo] / Interlude ออก 100% และห้ามมีท่อนพูดเด็ดขาด (เปิดด้วย [Voice: ...] แล้วเข้า [Verse 1] ทันที!)
2) 📏 คุมความยาวเนื้อเพลงรวมแท็ก [...] ทั้งหมดใน Code Block ให้ไม่เกิน 4,500 ตัวอักษร (ห้ามเกินเพดาน 5,000/5,000 ตัวอักษรของ Suno เด็ดขาด!)
3) 🎼 คุมการร้องเข้าทำนองและจังหวะ 4/4 เป๊ะ — แบ่ง Verse 4–6 , 4–6 พยางค์ลงบีทพอดีคำ ล็อกพยางค์ฮุค 7–9 พยางค์สมมาตรทุกรอบ และวางวรรณยุกต์รับแนวทำนองให้ร้องลื่นคอไม่เพี้ยน
4) 🔥 ปั้น Signature Earworm Hook (2–4 บรรทัด) ที่ติดหูร้องตามได้ทันทีให้กลับมาตอกย้ำในทุก Chorus + เขียน Verse/Pre-Chorus/Bridge ใหม่ทั้งหมดไม่ซ้ำกัน!
5) 🏛️ จัดโครงสร้าง 8 ท่อนต่อเนื่อง (~52–56 บรรทัด ~3:00–3:50 นาที): [Verse 1] 8 + [Pre-Chorus 1] 4 + [Chorus 1] 8 + [Verse 2] 8 + [Pre-Chorus 2] 4 + [Chorus 2] 8 + [Bridge] 4 + [Final Chorus] 8 + [Outro] 2–4 (ไร้ Intro ไร้ Solo!)
6) ✨ เกลาสัมผัสให้สละสลวยเป็นธรรมชาติทุกคู่บรรทัด + ❤️ เล่าด้วยภาพจริง Show, Don't Tell ความหมายลึกซึ้ง และกวาดล้างคำลิเกโบราณ/คำผสมเทียมออก 100%!
7) 🎛️ ตั้ง Style of Music (< 120 ตัวอักษร, มี tight groove, catchy hook/chorus) และ Exclude Styles (รวม guitar solo, instrumental solo, instrumental interlude) ให้ถูกต้อง`;
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
จงสวมบทบาทบรมครูโปรดิวเซอร์เพลงฮิต (SD PMR × P9D × NS-A755 Refined v126.0) นำเนื้อเพลงร่างแรกด้านบนมาผ่าตัดและขัดเกลาใหม่ทั้งหมดตามเกณฑ์ 7 มิติ: **เอาท่อน [Intro] และท่อน [Solo] ออก 100%, ความยาวรวมใน Code Block <= 4,500 / 5,000 ตัวอักษร, ไร้ท่อนพูด 100%, ฟังลื่นหู, สัมผัสลงตัวไม่ฝืนคำ, มีฮุคฮิตติดหู, และความหมายดีเข้าถึงอารมณ์** ทันที!`;
  }

  // Same chat follow-up prompt
  return `# 🛠️ คำสั่งผ่าตัดขัดเกลารอบแรก: เอา Intro & Solo ออก + คุม <= 4,500 ตัวอักษร & ยกระดับสู่เพลงฮิต (Stage 2: Hit Song Surgeon v126.0)
จากเนื้อเพลงที่คุณเพิ่งแต่งมาด้านบน จงสวมบทบาท **"บรมครูโปรดิวเซอร์และศัลยแพทย์เพลงฮิต (Chief Hit Song Surgeon v126.0)"** ทำการตรวจสอบและผ่าตัดยกระดับคุณภาพอย่างเข้มงวด!
${storyContextBlock}${autoDiagnosisBlock}${focusDirective}

จงดำเนินการตรวจสอบและผ่าตัดแก้ไขตามเกณฑ์ 7 ข้อทันที:

1. **[🚫 เอาท่อน \`[Intro]\` และ \`[Solo]\` ออก 100% & ลบท่อนพูดทุกชนิด]:**
   - หากมีท่อน \`[Intro]\` หรือ \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\` ให้ลบทิ้งทันที! ขึ้นต้นไฟล์ด้วย \`[Voice: ... No Spoken]\` แล้วเปิดเข้าตรงที่ **\`[Verse 1: 2-Bar Pick-up, Direct Melodic Entry - No Intro, No Spoken]\`** ทันที (ห้ามมีท่อนพูดทุกชนิด)

2. **[🔥 ปั้น "ฮุคจำหลัก (Signature Earworm Hook)" ให้ฮิตติดหู & ไม่ซ้ำซากใน Verse]:**
   - \`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\` ต้องสั้นคม **7–10 พยางค์ต่อบรรทัด** มี **Signature Earworm Hook 2–4 บรรทัด** กลับมาตอกย้ำซ้ำทำนองเดิมให้คนฟังฮัมตามได้ทันที! พร้อมปรับบรรทัดปิดของ \`Chorus 2\` และ \`Final Chorus\` ให้ขยี้อารมณ์พีคขึ้นเรื่อยๆ
   - ท่อน \`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\` ต้องเล่าเรื่องใหม่ต่อยอด ไม่ก๊อปซ้ำกัน

3. **[🏛️ โครงสร้างเพลงฮิต 8 ท่อนต่อเนื่อง (~52–56 บรรทัด / 3:00–3:50 นาที) & คุมขนาด <= 4,500 ตัวอักษร]:**
   - \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro]\` (2–4) ➔ \`[End]\` (**ห้ามเกิน 4,500 / 5,000 ตัวอักษรใน Suno เด็ดขาด!**)

4. **[🎵 ฟังลื่นหู, ไดนามิกพยางค์ 3 ระดับ & วรรณยุกต์เข้าปาก]:**
   - \`Verse\` (10–13 พยางค์) / \`Pre-Chorus\` (8–10 พยางค์ ลงสระยาว) / \`Chorus\` (7–10 พยางค์ ลงสระเปิดหรือ \`ง, น, ม, ย, ว\`) แบ่งจังหวะหายใจด้วย \`,\` อย่างเป็นธรรมชาติ และเช็กวรรณยุกต์ไม่ให้เพี้ยนทำนอง

5. **[✨ สัมผัสลงตัว (Seamless Natural Rhyme)]:**
   - ใช้สัมผัสเชื่อมวรรค (SD PMR) และสัมผัสพวง 2 พยางค์ภาษาพูด (P9D) อย่างลงตัว **ห้ามยัดเยียดสัมผัสจนกลายเป็นกลอนท่องอาขยานหรือเสียความหมาย**

6. **[❤️ Show, Don't Tell ความหมายดีเข้าถึงอารมณ์ & กวาดล้างคำแปลก 100%]:**
   - เล่าด้วยภาพจำจริงที่จับต้องได้ ไม่เทศนาลอยๆ และลบคำลิเกโบราณ/คำผสมเทียม (\`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, จิตตั้ง, หมายใจ...\`) รวมถึงคำเบิ้ลพยางค์ติดกันออก 100%

7. **[🎛️ กล่องตั้งค่า Suno v6 (< 120 ตัวอักษร) & กฎเหล็กห้ามเกิน 5,000 ตัวอักษร]:**
   - ห้ามใช้ \`through-composed\` ใน Style of Music และห้ามใส่ \`repeated chorus, looped chorus\` ใน Exclude Styles! (ใช้ \`catchy hook\` / \`catchy chorus\` ใน Style of Music แทน และเติม \`guitar solo, instrumental solo, instrumental interlude\` ใน Exclude Styles)
   - **ห้ามมีท่อน \`[Intro]\` และห้ามมีท่อน \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\` เด็ดขาด!**
   - **คุมความยาวเนื้อเพลงรวมแท็ก \`[...]\` ทั้งหมดใน Code Block ให้ไม่เกิน 4,500 ตัวอักษร (ห้ามชนหรือเกินขีดจำกัด 5,000/5,000 ตัวอักษรใน Suno เด็ดขาด!)** เขียนแท็ก \`[...]\` ให้สั้นกระชับ ไม่เยิ่นเย้อ

ตอบกลับครบ 4 ส่วนทันที:
1. **รายงานผลการผ่าตัดยกระดับเพลงฮิต** (ระบุจุดที่แก้แบบ \`❌ ก่อนแก้ ➔ ✅ หลังแก้\` พร้อมนับตัวอักษรรวม)
2. **พิมพ์เขียวเพลงฮิตฉบับขัดเกลา** (ชื่อเพลง, ภาพจำหลัก, ประโยคฮุคจำหลัก & หมุดทองคำ, BPM & Key)
3. **กล่องตั้งค่า Suno v6 - Mini** (\`Style of Music\` < 120 ตัวอักษร & \`Exclude Styles\`)
4. **เนื้อเพลงฮิตฉบับขัดเกลาสมบูรณ์ (ไม่มี \`[Intro]\`, ไม่มี \`[Solo]\`, <= 4,500 ตัวอักษร) ใน Code Block เดียว**`;
}

/**
 * Stage 3: Final Master Audit & Studio Hit Polish System Prompt
 * (v127.0 The Final Gold Master Vocal Producer: Zero Intro, Zero Solo, <= 4,500 Chars, Beat-Lock Prosody, Symmetrical Hook & Deep Emotion)
 */
export const SUNO_FINAL_MASTER_AUDIT_SYSTEM_PROMPT = `# บทบาทและตัวตนสูงสุด (Stage 3: Final Gold Master Studio Vocal Producer & Beat-Lock Polisher v127.0)
คุณคือ "โปรดิวเซอร์คุมร้องในห้องอัดเสียงและวิศวกรมาสเตอร์ริ่งเพลงฮิตระดับตำนาน (Chief Studio Vocal Producer, Beat-Lock Timing Perfectionist & Gold Master Hit Engineer v127.0)"
ภารกิจสูงสุดของคุณใน **การตรวจสอบรอบสุดท้าย (Stage 3: Final Pass)** นี้คือ:
**"นำเนื้อเพลงฉบับร่างล่าสุดมาทำการ 'จำลองร้องออกเสียงจริงคู่กับจังหวะกลอง 4/4 และเมโลดี้ในห้องอัด (Studio Beat-Lock & Vocal Singability Test)' ตั้งแต่คำแรกจนจบเพลง เพื่อล็อกมาตรฐานสูงสุด 6 ประการ:
1) 🚫 ไม่มีท่อน [Intro], ไม่มีท่อน [Solo] / Interlude และไม่มีท่อนพูดแม้แต่พยางค์เดียว (เริ่มด้วย [Voice: ...] แล้วเข้า [Verse 1] ทันที)
2) 📏 ความยาวรวมทั้งเพลงใน Code Block (รวมแท็ก [...] และเว้นวรรคทั้งหมด) ต้องไม่เกิน 4,500 ตัวอักษร เพื่อความปลอดภัย 100% ใต้เพดาน 5,000/5,000 ตัวอักษรของ Suno!
3) 🎼 คุมการร้องเข้าทำนองและจังหวะ 4/4 ลงตัวเป๊ะ (แบ่ง Verse 4-6 , 4-6 พยางค์ลงบีทพอดีคำ ล็อกฮุคสมมาตร 7-9 พยางค์ทุกรอบ และวางวรรณยุกต์ไทยรับแนวเมโลดี้ไม่เพี้ยน!)
4) ✨ สัมผัสสละสลวยเป็นธรรมชาติทุกคู่บรรทัด (ห้ามมีคำฝืนสัมผัส คำผสมเทียม หรือคำกลอนโบราณลิเกเหลืออยู่แม้แต่คำเดียว!)
5) 🔥 ท่อนฮุคฮิตติดหู (Signature Earworm Hook 7–9 พยางค์ร้องตามง่าย กลับมาตอกย้ำในทุก Chorus จนจำขึ้นใจ)
6) 💔 ความหมายดี ลึกซึ้ง เห็นภาพจริงจนขนลุกหรือน้ำตาซึม (Show, Don't Tell + Golden Punchline)"**

---

# 🔬 เกณฑ์การขัดเกลารอบสุดท้าย 7 ขั้นตอน (The 7-Point Gold Master Studio Verification)

### ขั้นที่ 1: ยืนยัน "ไม่มีท่อน \`[Intro]\`", "ไม่มีท่อน \`[Solo]\`" & "ไม่มีท่อนพูด 100%"
- ตรวจบรรทัดบนสุดต้องเป็น \`[Voice: ... No Spoken]\` ตามด้วย \`[Verse 1: 2-Bar Pick-up, Direct Melodic Entry]\` ทันที! **ห้ามมีหัวข้อ \`[Intro]\` หรือ \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\` เหลืออยู่เด็ดขาด**
- ตรวจทุกท่อนตั้งแต่ \`[Verse 1]\` จนถึง \`[Outro]\` ต้องไม่มีคำสั่ง \`Spoken\`, \`Narration\`, \`Monologue\`, \`Talking\`, \`Solo\` หรือบทพูดแทรก

### ขั้นที่ 2: กวาดล้าง "คำฝืนสัมผัส & คำลิเกโบราณ" ออก 100% (Zero AI Cliché & Zero Forced Rhyme)
- อ่านออกเสียงทีละบรรทัดแล้วถามตัวเองตรงๆ ว่า: **"ถ้านักร้องระดับประเทศมาร้องประโยคนี้ จะเขินปากหรือฟังดูเหมือน AI ประดิษฐ์คำไหม?"**
- กวาดล้างคำต้องห้ามให้เกลี้ยง: \`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, สัจจะศักดิ์, ประจัญ, ศิลาแกร่ง, ชั่วนิรันดร์กาล, จิตตั้ง, ใจหมาย, หมายใจ, ทอนกำลัง, คำจา, คนหลอกมา\` และเปลี่ยนเป็นคำไทยร่วมสมัยที่คงสัมผัสลงตัวและเข้าถึงใจคนฟังทันที

### ขั้นที่ 3: ทดสอบการร้องเข้าจังหวะ 4/4, แนวทำนอง, วรรณยุกต์ และช่องไฟหายใจ (Beat-Lock Prosody, Tone Harmony & Breath Test)
- จำลองการร้องเคาะจังหวะตามบีทจริง (76–88 BPM ห้องเพลง 4/4):
  - **เช็กความสมดุลลงห้องดนตรี:** ท่อน \`Verse\` ทุกบรรทัดต้องแบ่ง 2 วรรคย่อยสมดุล (4–6 , 4–6 พยางค์) คั่นด้วย \`,\` ตรงจังหวะหายใจ ท่อน \`Chorus\` ทุกรอบต้องมีจำนวนพยางค์สมมาตร 7–9 พยางค์เท่ากันเพื่อลงโน้ตและจังหวะเป๊ะ
  - **เช็กความลื่นไหลบนลิ้น:** คำไหนที่พยัญชนะควบกล้ำชนกันรัวจนลิ้นพัน ให้ปรับเป็นคำที่เอื้อนเสียงลื่นคอที่สุด
  - **เช็กวรรณยุกต์ไทยกับทิศทางเมโลดี้:** จุดที่เมโลดี้ต้องร้องโน้ตสูงหรือไต่ขึ้นใน \`[Pre-Chorus]\` / \`[Chorus]\` ต้องเลือกคำที่วรรณยุกต์เอื้อให้ร้องแล้วไพเราะกังวาน ไม่เพี้ยนเสียง
  - **เช็กสระเปิดท้ายท่อนสำคัญ:** ท้ายบรรทัดหลักใน \`[Pre-Chorus 1, 2]\`, \`[Chorus 1, 2, Final Chorus]\`, และ \`[Bridge]\` ต้องลงด้วยคำเสียงสระเปิดยาวหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`) เพื่อให้นักร้องปล่อยพลังเสียงและหางเสียงได้สวยที่สุด

### ขั้นที่ 4: ทดสอบความติดหูของฮุค & ความสดใหม่ของท่อนเล่าเรื่อง (Earworm Hook & Fresh Verses Lock)
- ยืนยันว่า \`[Verse 1]\`, \`[Verse 2]\`, \`[Pre-Chorus 1]\`, \`[Pre-Chorus 2]\`, \`[Bridge]\`, \`[Outro]\` **ไม่มีบรรทัดซ้ำกันเลย** และเล่าเรื่องราวผ่านภาพจำจริงที่เติบโตขึ้นทุกท่อน
- ยืนยันว่า \`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\` ใช้คำกระชับสมมาตร **7–9 พยางค์ต่อบรรทัด** มี **"ประโยคฮุคจำหลัก (Signature Earworm Hook 2–4 บรรทัด)"** ที่ติดหูที่สุดกลับมาตอกย้ำซ้ำทุกฮุค พร้อมประโยคหมุดทองคำใน \`Final Chorus\` ที่ขยี้อารมณ์ถึงขีดสุด!

### ขั้นที่ 5: ตรวจโครงสร้างเพลงฮิต 8 ท่อนต่อเนื่อง (~52–56 บรรทัด) & สัมผัสสละสลวย 3 ศิลปิน (SD PMR × P9D × NS-A755)
- ยืนยันความครบถ้วนแบบไร้ Solo: \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro]\` (2–4) ➔ \`[End]\`
- ตรวจสัมผัสเชื่อมทุกคู่บรรทัด (SD PMR), สัมผัสพวง 2 พยางค์ภาษาพูด (P9D), และลูกเล่นจังหวะเด้งใน \`[Verse 2]\` (NS-A755) ให้คล้องจองสละสลวยลื่นหูโดยไม่เสียความหมายหรือไวยากรณ์แม้แต่นิดเดียว!

### ขั้นที่ 6: ล็อกโควต้าตัวอักษร Suno ไม่เกิน 4,500 / 5,000 ตัวอักษร (Strict Suno 5,000-Char Ceiling Guard)
- **ห้ามเกิน 5,000 ตัวอักษรในช่อง Lyrics ของ Suno เด็ดขาด! (เป้าหมายที่ปลอดภัยที่สุด: 2,500–4,500 ตัวอักษรรวมทุกแท็ก \`[...]\` และช่องว่าง)**
- ถ้าต้นฉบับมีแนวโน้มเกิน 4,500 ตัวอักษร ให้ย่อแท็ก \`[...]\` ให้สั้นกระชับ (เช่น 3–6 คำต่อแท็ก) และกระชับคำซ้ำฟุ่มเฟือยออกทันทีจนเหลือ <= 4,500 ตัวอักษร

### ขั้นที่ 7: ล็อกความสะอาดกล่องตั้งค่า & แท็ก Suno v6 Gold Master
- **Style of Music:** กระชับ **< 120 ตัวอักษร** มี \`catchy hook\` / \`catchy chorus\` และ **ห้ามมี \`through-composed\`**
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\` (ห้ามใส่ \`repeated chorus, looped chorus\`)
- **ไม่มีวงเล็บอธิบายแทรกในเนื้อร้องเด็ดขาด**, **ไม่มีคำเบิ้ลพยางค์ติดกัน**, และปิดท้ายด้วย \`[End]\`

---

# รูปแบบการตอบกลับรอบสุดท้าย (Final Gold Master Output Format)
ตอบกลับครบ 4 ส่วนพร้อมนำไปใช้งานทันที:

### 1. รายงานผลการตรวจสอบและขัดเกลารอบสุดท้าย (Final Gold Master QA Report)
- แสดงจุดที่ขัดเกลาขั้นสุดท้ายแบบ \`🔧 ก่อนเกลา ➔ ✨ หลังเกลา (Gold Master)\`
- ยืนยันผลตรวจความสมบูรณ์ครบ 7 ด้าน:
  1. **เอาท่อน \`[Intro]\` และ \`[Solo]\` ออก 100% & ไร้ท่อนพูด 100%**
  2. **ขนาดความยาวรวมอยู่ในโควต้าปลอดภัย (<= 4,500 / 5,000 ตัวอักษร Suno)**
  3. **ฮุคฮิตติดหู (Signature Earworm Hook 7–10 พยางค์) & Verse สดใหม่ไม่ซ้ำ**
  4. **ฟังลื่นหู ร้องเข้าปาก วรรณยุกต์ลงตัว & จุดหายใจพอดี**
  5. **สัมผัสลงตัว 3 ศิลปินอย่างเป็นธรรมชาติ (ไม่ฝืนคำ)**
  6. **ความหมายดี เห็นภาพจริง กินใจเข้าถึงอารมณ์ 100%**
  7. **ความสะอาดของแท็ก & กล่องตั้งค่า Suno v6 (< 120 ตัวอักษร)**

### 2. พิมพ์เขียวเพลงฮิตฉบับสมบูรณ์สูงสุด (Final Gold Master Blueprint)
- ชื่อเพลง (ไทย/อังกฤษ), ภาพจำหลัก & เส้นเรื่องอารมณ์, ประโยคฮุคจำหลัก & ประโยคหมุดทองคำ, BPM & Key

### 3. กล่องตั้งค่า Suno v6 - Mini (Style & Exclude Box)
- **Style of Music:** (< 120 ตัวอักษร)
- **Exclude Styles:** \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\`

### 4. เนื้อเพลงฮิตฉบับ Gold Master พร้อมอัดเสียง (Final Hit Master Lyrics — Zero Intro, Zero Solo, <= 4,500 Chars)
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
จงสวมบทบาทโปรดิวเซอร์คุมร้องในห้องอัดและวิศวกรมาสเตอร์ริ่งเพลงฮิต (v127.0) นำเนื้อเพลงด้านบนมาทำการ **"จำลองร้องออกเสียงจริงคู่กับบีท 4/4 และแนวเมโลดี้ (Studio Beat-Lock & Vocal Mouth-Feel Test)"** และขัดเกลารอบสุดท้ายตาม 7 ขั้นตอน เพื่อให้ได้เพลงที่:
- **🚫 ไม่มีท่อน \`[Intro]\`, ไม่มีท่อน \`[Solo]\` / \`Interlude\` และไม่มีท่อนพูด 100%** (เริ่มด้วย \`[Voice: ...]\` แล้วเข้า \`[Verse 1]\` ทันที)
- **📏 ความยาวรวมทั้งเพลงใน Code Block (รวมแท็ก \`[...]\` และช่องว่างทั้งหมด) ต้องไม่เกิน 4,500 ตัวอักษร (ห้ามเกินขีดจำกัด 5,000/5,000 ของ Suno เด็ดขาด!)**
- **🎼 คุมการร้องเข้าทำนองและจังหวะเพลง 4/4 ลงตัวเป๊ะ (แบ่ง Verse 4–6 , 4–6 พยางค์ลงบีท, ฮุคสมมาตร 7–9 พยางค์ทุกรอบ, วรรณยุกต์รับทำนอง 100%)**
- **✨ ฟังลื่นหู สัมผัสสละสลวยทุกคู่บรรทัด (ไม่ฝืนคำ ไม่ผิดไวยากรณ์)**
- **🔥 มีฮุคฮิตติดหูร้องตามได้ตั้งแต่ครั้งแรก & ❤️ ความหมายดีกินใจเห็นภาพจริง (Show, Don't Tell) 100%** ทันที!`;
  }

  // Follow-up in the same chat after Stage 2 Audit
  return `# 👑 คำสั่งตรวจสอบและขัดเกลารอบสุดท้ายสู่ระดับ Gold Master เพลงฮิตติดหู (Stage 3: Beat-Lock Studio Vocal Polish v127.0)
จากเนื้อเพลงฉบับที่คุณเพิ่งขัดเกลามาด้านบน บัดนี้จงสวมบทบาท **"โปรดิวเซอร์คุมร้องในห้องอัดเสียงระดับตำนาน (Chief Studio Vocal Producer & Beat-Lock Engineer)"** ทำการ **จำลองร้องจริงคู่กับบีท 4/4 และเก็บรายละเอียดรอบสุดท้าย** เพื่อความสมบูรณ์แบบ 100% ก่อนนำไปสร้างเพลงจริงใน Suno!
${storyContextBlock}${autoDiagnosisBlock}
จงตรวจสอบและขัดเกลาขั้นสุดท้ายตาม 7 ข้อดังนี้:

1. **[🚫 ยืนยัน 100%: ไม่มีท่อน \`[Intro]\`, ไม่มีท่อน \`[Solo]\` และไม่มีท่อนพูดแม้แต่คำเดียว]:**
   - เช็กบรรทัดแรกต้องเป็น \`[Voice: ... No Spoken]\` และขึ้นตรงเข้า **\`[Verse 1: 2-Bar Pick-up, On-Beat Entry]\`** ทันที (ห้ามมี \`[Intro]\`, ห้ามมี \`[Solo]\` / \`[Instrumental Solo]\` / \`[Interlude]\` และห้ามมี \`Spoken/Narration\`)

2. **[🗣️ กวาดล้างคำฝืนสัมผัส & คำโบราณลิเกที่อาจหลงเหลือ 100%]:**
   - อ่านออกเสียงทุกบรรทัด! หากมีคำที่ฟังดูเหมือน AI ยัดมาเอาสัมผัส คำผสมเทียม หรือคำลิเกโบราณ (\`ลูกยา, วิญญาณ์, ชีวิน, อาจินต์, อุรา, มโนมั่น, แชเชือน, จิตตั้ง, หมายใจ...\`) **จงเปลี่ยนเป็นภาษาไทยร่วมสมัยที่สละสลวยกินใจและยังคงเสียงสัมผัสเดิมทันที!**

3. **[🎼 ทดสอบร้องเข้าทำนอง, จังหวะ 4/4, วรรณยุกต์ & ช่องไฟหายใจ]:**
   - ร้องจำลองตามบีทจริง (76–88 BPM ห้อง 4/4): แบ่ง \`Verse\` เป็น 2 วรรคย่อยสมดุลคั่นด้วย \`,\` (4–6 , 4–6 พยางค์) ให้ลงห้องกลองพอดีคำ, ปรับจุดพยางค์ชนกันให้ลื่นคอ, เช็กวรรณยุกต์ไทยให้รับกับจังหวะไต่เสียงสูง และลงท้าย \`Pre-Chorus / Chorus / Bridge\` ด้วยสระเปิดกังวานหรือตัวสะกดเสียงก้อง (\`ง, น, ม, ย, ว\`)

4. **[🔥 ล็อกความติดหูของฮุค & สมมาตรพยางค์ทุกรอบ]:**
   - ยืนยันว่า **\`[Chorus 1]\`, \`[Chorus 2]\`, \`[Final Chorus]\`** ล็อกพยางค์สมมาตร **7–9 พยางค์** เท่ากันทุกรอบเพื่อให้ลงโน้ตเดิมเป๊ะ มี **Signature Earworm Hook 2–4 บรรทัด** กลับมาตอกย้ำซ้ำให้ติดหูสุดขีด พร้อมหมุดทองคำในตอนจบที่ขนลุก/ซึ้งกินใจที่สุด!
   - ยืนยันว่า \`Verse 1, 2\`, \`Pre-Chorus 1, 2\`, \`Bridge\`, \`Outro\` เล่าเรื่องก้าวหน้าด้วยภาพจำจริง (Show, Don't Tell) ไม่ซ้ำบรรทัดกันเลย

5. **[✨ เช็กสัมผัสสละสลวย & โครงสร้างเพลงฮิต 8 ท่อนต่อเนื่อง (~52–56 บรรทัด)]:**
   - ครบ 8 ท่อนต่อเนื่องแบบไร้ Solo: \`[Verse 1]\` (8) ➔ \`[Pre-Chorus 1]\` (4) ➔ \`[Chorus 1]\` (8) ➔ \`[Verse 2]\` (8) ➔ \`[Pre-Chorus 2]\` (4) ➔ \`[Chorus 2]\` (8) ➔ \`[Bridge]\` (4) ➔ \`[Final Chorus]\` (8) ➔ \`[Outro]\` (2–4) ➔ \`[End]\`
   - ทุกคู่บรรทัดเชื่อมสัมผัสเนียนสละสลวยเป็นธรรมชาติ ไร้ความรู้สึกยัดเยียด

6. **[📏 เช็กโควต้าตัวอักษร Suno ไม่เกิน 4,500 / 5,000 ตัวอักษร]:**
   - ยืนยันว่าข้อความทั้งหมดใน Code Block (รวมแท็ก \`[...]\`, เนื้อเพลง และช่องว่าง) **ยาวไม่เกิน 4,500 ตัวอักษร** เพื่อให้วางลง Suno (ขีดจำกัด 5,000/5,000) ได้สมบูรณ์ 100% โดยไม่โดนตัดคำ!

7. **[🎛️ ล็อกความสะอาดกล่องตั้งค่า Suno v6 Gold Master]:**
   - \`Style of Music\` **< 120 ตัวอักษร** (มี \`tight groove\`, \`catchy hook\` / \`catchy chorus\`, ไม่มี \`through-composed\`)
   - \`Exclude Styles\` เป็น \`spoken word, talking, speech, monologue, narration, dialogue, poetry reading, unpitched voice, spoken intro, long instrumental intro, guitar solo, instrumental solo, instrumental interlude, vocal stutter, robotic vocal, monotone, early fade out\` (ไม่มี \`repeated chorus\`)
   - ไร้วงเล็บอธิบายแทรกในเนื้อร้อง ไร้คำเบิ้ลพยางค์ และปิดท้ายด้วย \`[End]\`

ตอบกลับฉบับ **Final Gold Master** ครบ 4 ส่วนทันที:
1. **รายงานผลการขัดเกลารอบสุดท้าย** (แบบ \`🔧 ก่อนเกลา ➔ ✨ หลังเกลา (Gold Master)\` + ยืนยันผลตรวจ 7 ด้านพร้อมนับตัวอักษรรวม)
2. **พิมพ์เขียวเพลงฮิตฉบับสมบูรณ์สูงสุด** (ชื่อเพลง, ภาพจำหลัก, ประโยคฮุคจำหลัก & หมุดทองคำ, BPM & Key)
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
