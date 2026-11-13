# VeriCapVdo AI Studio 🎵🎬
> **ระบบแต่งเพลง สร้างปก AI และตัดต่อ MV วิดีโอคาราโอเกะ (ฟรี 100% ไม่เสียเงิน ไม่ต้องผูกบัตร)**

![VeriCapVdo Studio](public/covers/phaw_carpenter_cover.jpg)

## 🌟 ฟีเจอร์เด่น (Key Features)

1. **ขั้นตอนที่ 1: แต่งเพลง Suno (Song Studio v129.0 • Auto AI 3-Artist Trinity)**
   - **3-Artist Trinity Fusion (เสก โลโซ × พงษ์สิทธิ์ คำภีร์ × ก้อง ห้วยไร่):** อัตโนมัติวิเคราะห์เรื่องราวจากผู้ใช้ แล้วเลือกผสมสัดส่วนการร้อง โครงสร้าง และอารมณ์ให้ลื่นหู ติดหู และคงความยาวต่ำกว่า 4,500 ตัวอักษร (ไม่เกินขีดจำกัด 5,000 ตัวอักษรของ Suno)
   - **Pure Singing Focus:** ตัด `[Intro]` และ `[Solo]` ออกทั้งหมดเพื่อให้เปิดมาร้องเข้าเรื่องทันที
   - **Through-Composed & Natural Thai Rhyme:** สัมผัสสระสละสลวย ฉันทลักษณ์ลื่นหู ไม่ซ้ำบรรทัดซ้ำซาก ปราศจากท่อนพูด
   - **Real-time Hit Scanner:** สแกนความยาวตัวอักษร, สัดส่วนคำร้อง, ความตรงจังหวะ (Beat Sync), และกำจัดแท็กที่ขัดจังหวะอัตโนมัติในคลิกเดียว
   - **ระบบพรอพ 3 ชั้น:** พรอพแต่งเพลงหลัก ➔ พรอพตรวจสอบชั้นที่ 1 ➔ พรอพขัดเกลารอบสุดท้าย (Pure Prompt Generator ไม่เรียก API เสียค่าใช้จ่าย)

2. **ขั้นตอนที่ 2: สร้างปก AI (Cover & Motion Studio)**
   - สกัดชื่อเพลง, ท่อนฮุก, และเครดิตอัตโนมัติจากเพลง พร้อมแม่แบบปก 9:16 และ Motion Prompt แบบ Seamless 10-Second Loop สำหรับ Google Flow / Omni Flash
   - รองรับการเปิด/ปิดเครดิต (ตั้ง `"ไม่ใส่"` ได้), Mockup Safe Zone ของ TikTok แบบเรียลไทม์, และดาวน์โหลดภาพปก PNG ความละเอียด 1080×1920 พร้อมใช้งานทันที
   - Pure Client Prompt Generator ฟรี 100%

3. **ขั้นตอนที่ 3: ตัดต่อ MV วิดีโอคาราโอเกะ (MV Studio Pro)**
   - **AI Precision Vocal Sync (`Gemini 3.8 Flash`):** ฟังไฟล์เสียงจริงพร้อมเนื้อเพลงเพื่อคำนวณไทม์มิ่งคำร้องแม่นยำ (มี fallback อัตโนมัติเมื่อ AI ไม่ตอบสนอง)
   - **60fps Preview & Client-Side Rendering (`.mp4` / `.webm`):** ใช้เอนจินภาพกลางร่วมกันระหว่างพรีวิวและตอนเรนเดอร์ พร้อม Trim ตัดท่อนฮุก, Tap-to-Sync สดด้วยปุ่ม Space, สไตล์ซับหลากหลาย, และ Clean MV Mode (ไม่ใส่ซับ)
   - รองรับทั้ง **แนวตั้ง 9:16** (TikTok/Reels/Shorts) และ **แนวนอน 16:9** (YouTube)
   - ส่งออกไฟล์ซับมาตรฐาน `.srt`, `.lrc` และ `.vtt` ได้ทันที

---

## 👑 ระบบจัดการและตรวจสอบ License Key ผ่าน Google Sheets

ระบบเชื่อมต่อกับ **Google Sheets (Serverless API ผ่าน Google Apps Script)** เพื่อตรวจสอบสิทธิ์เข้าใช้งาน:
- **สร้างคีย์ง่ายใน 1 คลิก:** มีเมนูใน Google Sheets สุ่มสร้างคีย์รูปแบบ `VCV-XXXX-XXXX-XXXX-XXXX` ครั้งละ 20, 50 หรือ 100 คีย์
- **ผูก 1 คีย์ต่อ 1 อุปกรณ์:** เมื่อลูกค้ากรอกคีย์ครั้งแรก ระบบจะบันทึก Device ID และวันที่เปิดใช้งานลงตาราง Google Sheets อัตโนมัติ ป้องกันการแชร์คีย์ซ้ำ
- **ระงับสิทธิ์ได้ทันที:** หากต้องการตัดสิทธิ์ เพียงเปลี่ยนสถานะใน Google Sheet เป็น "ระงับการใช้งาน"
- **คู่มือและโค้ดติดตั้ง:** ดูได้ที่ [`tools/google-sheets-licensing/SETUP_GUIDE.md`](file:///tools/google-sheets-licensing/SETUP_GUIDE.md)

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
