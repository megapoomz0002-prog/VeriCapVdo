# VeriCapVdo AI Studio 🎵🎬
> **ระบบแต่งเพลง สร้างปก AI และตัดต่อ MV วิดีโอคาราโอเกะ (ฟรี 100% ไม่เสียเงิน ไม่ต้องผูกบัตร)**

![VeriCapVdo Studio](public/covers/phaw_carpenter_cover.jpg)

## 🌟 ฟีเจอร์เด่น (Key Features)

1. **ขั้นตอนที่ 1: แต่งเพลง Suno (Song Studio v120.0)**
   - **SD PMR × P9D × NS-A755 Engine:** แต่งเพลงมหากาฬความยาว 4+ นาที (76 บรรทัดต่อเนื่อง)
   - **Through-Composed Structure:** ท่อนฮุก ท่อนเวิร์ส ไม่ซ้ำคำกันแม้แต่บรรทัดเดียว ไรม์คำสัมผัสสละสลวยตามฉันทลักษณ์ไทย
   - **Zero Spoken Word:** กำจัดท่อนพูด 100% ปรับเป็นเมโลดี้การร้องที่ทรงพลัง
   - **เครื่องสแกนคำและจังหวะแบบ Real-time:** ตรวจสอบความยาวเพลง, คำซ้ำ, จังหวะเคาะลมหายใจ 6-8+6-8, และคำฝืนธรรมชาติ
   - **ระบบพรอพ 3 ชั้น:** พรอพแต่งเพลงหลัก ➔ พรอพตรวจสอบชั้นที่ 1 ➔ พรอพขัดเกลารอบสุดท้าย

2. **ขั้นตอนที่ 2: สร้างปก AI (Cover & Motion Studio)**
   - สกัดพรอพสร้างภาพปกอัตโนมัติ สัดส่วน 9:16 สไตล์ภาพยนตร์ (Cinematic 8K)
   - แม่แบบสร้าง Motion Video / Video Loop สำหรับเป็นแบ็คกราวด์ MV
   - คัดลอกไปสั่งใน Imagen 3, Midjourney หรือ AI Studio ได้ฟรี

3. **ขั้นตอนที่ 3: ตัดต่อ MV วิดีโอคาราโอเกะ (MV Studio)**
   - **AI Precision Vocal Sync:** ฟังไฟล์เสียงจริงและคำนวณไทม์มิ่งคำต่อคำแม่นยำ 100% ด้วย Google Gemini API
   - รองรับเพลงยาว 4-5 นาที ไม่หลุดซิงก์ พร้อมระบบเว้นช่องไฟช่วง Solo กีตาร์
   - ไทม์ไลน์ตัดต่อแบบ CapCut / TikTok พร้อมระบบพรีวิวสด 60fps
   - สไตล์ซับคาราโอเกะหลากหลาย (Neon Yellow, Cyber Cyan, Sunset Gold, ฯลฯ)
   - ส่งออกวิดีโอ MP4 / WebM คมชัดระดับ 1080p ไม่ติดลายน้ำ
   - ส่งออกไฟล์ซับไตเติล `.srt` และ `.lrc` มาตรฐานสำหรับนำไปใช้ต่อใน CapCut หรือ Premiere Pro

---

## 🔑 การตั้งค่า Google Gemini API Key (ฟรี 100%)

- ขั้นตอนที่ 1 & 2 เป็นระบบสร้างพรอพ (Prompt Generator) ใช้งานฟรี 100% ไม่ต้องใช้ API Key
- ขั้นตอนที่ 3 ใช้ API Key เพื่อให้ AI ฟังเพลงและคำนวณเวลาซับร้อง
- รับ API Key ฟรี (ไม่ต้องผูกบัตร) ได้ที่: [Google AI Studio](https://aistudio.google.com/app/apikey)
- สามารถกรอก Key ในหน้าเว็บได้โดยตรง (ระบบบันทึกในเบราว์เซอร์ของคุณอย่างปลอดภัย) หรือตั้งค่า Environment Variable `GEMINI_API_KEY` บน Vercel

---

## 🚀 เริ่มต้นใช้งานบนเครื่องของคุณ (Local Development)

```bash
# ติดตั้ง dependencies
npm install

# รัน Development Server
npm run dev

# เปิดเบราว์เซอร์เข้าใช้งาน
http://localhost:3000
```

---

## 🌐 การนำขึ้น Vercel (Deployment)

1. Fork หรือ Push โค้ดนี้ขึ้น GitHub: `https://github.com/megapoomz0001-collab/VeriCapVdo.git`
2. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard) แล้วกด **Add New Project**
3. เลือกคลัง GitHub `VeriCapVdo`
4. ในช่อง **Environment Variables** (ระบุหรือไม่ระบุก็ได้):
   - `GEMINI_API_KEY`: ใส่ Google AI Studio Key ของคุณ (หากระบุ ระบบจะมีคีย์ส่วนกลางให้ผู้ใช้ทันที)
5. กด **Deploy** ใช้งานได้ทันที ภายใน 1 นาที!

---

## 🛠️ สแต็กเทคโนโลยี (Tech Stack)

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **AI Engine:** Google GenAI SDK (`@google/genai`)
- **Video & Audio:** Canvas API, Web Audio API, MediaRecorder API

---

## 📄 ใบอนุญาต (License)

MIT License - พัฒนาเพื่อการศึกษาและใช้งานเชิงสร้างสรรค์โดย megapoomz
