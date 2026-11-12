# กฎเหล็กสถาปัตยกรรมระบบ VeriCapVdo (CRITICAL ARCHITECTURE RULES)

> [!IMPORTANT]
> **กฎเหล็กการใช้ AI API (AI API Scope Rule - 100% Strict):**
> 1. **ขั้นตอนที่ 1 (SongStudio - สกัดพรอพแต่งเพลง):** เป็น **ระบบสร้างแม่แบบพรอพ (Prompt Generator) 100%** ห้ามเรียกใช้ AI API เด็ดขาด! ผู้ใช้จะกดปุ่ม **"คัดลอกแม่แบบพรอพ"** เพื่อนำไปวางสั่งในเว็บแชท AI ภายนอกเอง (ChatGPT, Gemini Web, Claude) แล้วนำเนื้อเพลงที่ได้กลับมาวางในระบบ
> 2. **ขั้นตอนที่ 2 (CoverMotionStudio - สร้างพรอพปกและ MV):** เป็น **ระบบสร้างแม่แบบพรอพ (Prompt Generator) 100%** ห้ามเรียกใช้ AI API เด็ดขาด! ผู้ใช้จะคัดลอกพรอพไปสั่งสร้างภาพ/วิดีโอลูปใน Imagen 3, Midjourney, หรือ Google Flow (Omni Flash) ภายนอกเอง
> 3. **ขั้นตอนที่ 3 (MvStudio - ตัดต่อ MV และซิงก์คาราโอเกะ):** เป็น **ขั้นตอนเดียวเท่านั้นที่ใช้ Gemini API** เพื่อถอดเสียงคำร้องและคำนวณไทม์มิ่งคำต่อคำ (Word-level Subtitle Sync)
