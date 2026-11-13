import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { requireLicenseSession } from "@/lib/licenseSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 18 * 1024 * 1024; // 18 MB safe inlineData limit
const MAX_LYRICS_CHARS = 50000;
const CANDIDATE_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"] as const;

const SYNC_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    detectedIntro: { type: "number" },
    recommendedHook: { type: "string" },
    recommendedStyle: {
      type: "string",
      enum: ["neon-yellow", "cyber-cyan", "sunset-gold", "ruby-red", "pure-white"],
    },
    vocalInsight: { type: "string" },
    subtitles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          text: { type: "string" },
        },
        required: ["id", "startTime", "endTime", "text"],
      },
    },
  },
  required: ["detectedIntro", "recommendedHook", "recommendedStyle", "vocalInsight", "subtitles"],
};

function normalizeAudioMimeType(rawMime: string): string {
  const lower = rawMime.trim().toLowerCase().split(";")[0];
  if (lower === "audio/mpeg" || lower === "audio/mp3") return "audio/mp3";
  if (lower === "audio/mp4" || lower === "audio/x-m4a" || lower === "audio/m4a") return "audio/mp4";
  if (lower === "audio/webm") return "audio/webm";
  if (lower === "audio/wav" || lower === "audio/x-wav" || lower === "audio/wave") return "audio/wav";
  if (lower === "audio/aac") return "audio/aac";
  if (lower === "audio/ogg") return "audio/ogg";
  if (lower === "audio/flac" || lower === "audio/x-flac") return "audio/flac";
  return "audio/mp3";
}

function classifyGeminiError(err: any): { fatal: boolean; status: number; userMessage: string } {
  const raw = String(err?.message || "");
  const code = Number(err?.status || err?.code || 0);

  if (code === 401 || raw.includes("API_KEY_INVALID") || raw.includes("API key not valid")) {
    return {
      fatal: true,
      status: 401,
      userMessage: "Gemini API Key ไม่ถูกต้อง กรุณาคัดลอกคีย์ใหม่จาก Google AI Studio แล้วลองอีกครั้งครับ",
    };
  }
  if (code === 403 || raw.includes("PERMISSION_DENIED")) {
    return {
      fatal: true,
      status: 403,
      userMessage: "API Key ถูกจำกัดสิทธิ์ หรือยังไม่ได้เปิดใช้งาน Generative Language API ครับ",
    };
  }
  if (code === 429 || raw.includes("RESOURCE_EXHAUSTED")) {
    return {
      fatal: true,
      status: 429,
      userMessage: "โควต้าการใช้งาน Gemini API เต็มชั่วคราว กรุณารอ 1-2 นาทีแล้วลองใหม่อีกครั้งครับ",
    };
  }
  return {
    fatal: false,
    status: 502,
    userMessage: "ไม่สามารถเชื่อมต่อ Gemini AI ได้ชั่วคราว",
  };
}

function sanitizeSubtitles(rawSubs: any[], duration: number) {
  const prepared = rawSubs
    .map((cue: any) => {
      const cleanText = String(cue?.text || "")
        .replace(/\.{2,}|…/g, " ")
        .replace(/\[.*?\]/g, "")
        .replace(/,/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const rawStart = Number(cue?.startTime);
      const start = Number.isFinite(rawStart) ? Math.max(0, Math.min(rawStart, Math.max(0, duration - 0.5))) : 0;
      const rawEnd = Number(cue?.endTime);
      let end = Number.isFinite(rawEnd) ? rawEnd : start + 3.0;
      if (end <= start + 0.4) end = start + 2.6;
      if (end - start > 5.2) end = start + 4.5;
      end = Math.min(end, duration);

      return {
        startTime: start,
        endTime: Math.max(start + 0.35, end),
        text: cleanText,
      };
    })
    .filter((cue) => cue.text.length > 0 && cue.startTime < duration);

  prepared.sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime);

  const normalized: Array<{ id: number; startTime: number; endTime: number; text: string }> = [];
  let minAllowedStart = 0;

  for (const cue of prepared) {
    const start = Math.max(cue.startTime, minAllowedStart);
    if (start >= duration - 0.15) break;

    let end = Math.min(Math.max(cue.endTime, start + 0.5), duration);
    if (end <= start) end = Math.min(duration, start + 0.5);

    normalized.push({
      id: normalized.length + 1,
      startTime: parseFloat(start.toFixed(2)),
      endTime: parseFloat(end.toFixed(2)),
      text: cue.text,
    });
    minAllowedStart = start + 0.25;
  }

  for (let i = 0; i < normalized.length - 1; i++) {
    const nextStart = normalized[i + 1].startTime;
    if (normalized[i].endTime > nextStart - 0.05) {
      normalized[i].endTime = parseFloat(
        Math.max(normalized[i].startTime + 0.35, nextStart - 0.05).toFixed(2)
      );
      if (normalized[i].endTime > normalized[i + 1].startTime) {
        normalized[i + 1].startTime = parseFloat(Math.min(duration - 0.2, normalized[i].endTime + 0.03).toFixed(2));
        if (normalized[i + 1].endTime <= normalized[i + 1].startTime) {
          normalized[i + 1].endTime = parseFloat(Math.min(duration, normalized[i + 1].startTime + 0.4).toFixed(2));
        }
      }
    }
  }

  return normalized;
}

export async function POST(req: NextRequest) {
  const auth = requireLicenseSession(req);
  if (!auth.ok) return auth.response;

  try {
    let lyrics = "";
    let songTitle = "";
    let duration = 60;
    let apiKey = "";
    let audioBase64: string | null = null;
    let mimeType = "audio/mp3";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      let formData: FormData;
      try {
        formData = await req.formData();
      } catch {
        return NextResponse.json({ error: "ไม่สามารถอ่านข้อมูลอัปโหลดได้" }, { status: 400 });
      }

      lyrics = String(formData.get("lyrics") || "");
      songTitle = String(formData.get("songTitle") || "").slice(0, 200);
      const parsedDur = parseFloat(String(formData.get("duration") || "60"));
      duration = Number.isFinite(parsedDur) && parsedDur > 0 ? Math.min(parsedDur, 3600) : 60;
      apiKey = String(formData.get("apiKey") || "");

      const audioFile = formData.get("audio") as File | null;
      if (audioFile && audioFile.size > 0) {
        if (audioFile.size > MAX_AUDIO_BYTES) {
          return NextResponse.json(
            {
              error: `ไฟล์เสียงใหญ่เกินไป (${(audioFile.size / (1024 * 1024)).toFixed(1)} MB) กรุณาบีบอัดเป็น MP3/M4A ขนาดไม่เกิน 18 MB เพื่อให้ AI ฟังได้เต็มเพลงครับ`,
            },
            { status: 413 }
          );
        }
        mimeType = normalizeAudioMimeType(audioFile.type || "audio/mp3");
        const arrayBuf = await audioFile.arrayBuffer();
        audioBase64 = Buffer.from(arrayBuf).toString("base64");
      }
    } else {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: "รูปแบบข้อมูล JSON ไม่ถูกต้อง" }, { status: 400 });
      }

      lyrics = typeof body?.lyrics === "string" ? body.lyrics : "";
      songTitle = typeof body?.songTitle === "string" ? body.songTitle.slice(0, 200) : "";
      const parsedDur = Number(body?.duration);
      duration = Number.isFinite(parsedDur) && parsedDur > 0 ? Math.min(parsedDur, 3600) : 60;
      apiKey = typeof body?.apiKey === "string" ? body.apiKey : "";
      mimeType = normalizeAudioMimeType(typeof body?.mimeType === "string" ? body.mimeType : "audio/mp3");

      if (typeof body?.audioBase64 === "string" && body.audioBase64.trim()) {
        const cleanedB64 = body.audioBase64.replace(/^data:[^;]+;base64,/, "").trim();
        const estimatedBytes = Math.floor((cleanedB64.length * 3) / 4);
        if (estimatedBytes > MAX_AUDIO_BYTES) {
          return NextResponse.json(
            { error: "ไฟล์เสียงใหญ่เกิน 18 MB กรุณาใช้ไฟล์ MP3/M4A ขนาดเล็กลงครับ" },
            { status: 413 }
          );
        }
        audioBase64 = cleanedB64;
      }
    }

    const token =
      (apiKey && apiKey.trim()) ||
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) ||
      (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim()) ||
      "";

    if (!token) {
      return NextResponse.json(
        {
          error: "กรุณาระบุ Gemini API Key (ฟรีจาก Google AI Studio) ในช่องตั้งค่าด้านบนก่อนใช้งานฟีเจอร์นี้ครับ",
        },
        { status: 400 }
      );
    }

    if (!lyrics.trim()) {
      return NextResponse.json(
        { error: "กรุณากรอกหรือวางเนื้อเพลงก่อนให้ AI วิเคราะห์ครับ" },
        { status: 400 }
      );
    }

    if (lyrics.length > MAX_LYRICS_CHARS) {
      return NextResponse.json(
        { error: "ความยาวเนื้อเพลงเกินขีดจำกัด (50,000 ตัวอักษร)" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: token });

    const systemInstruction = `You are an elite music video audio engineer, master karaoke timing producer, and viral TikTok creative director.
Your job is to analyze the audio track and lyrics of a song, precisely segment the lyrics into natural singing phrases, align each subtitle cue with the singer's actual vocals, and optimize formatting for vertical 9:16 TikTok safe zones.

CRITICAL SUBTITLE SEGMENTATION & TIMING RULES:
1. Vocal Intro Detection: Accurately detect the exact second when the instrumental intro ends and the first singing vocal begins. Record this in "detectedIntro".
2. Intelligent Phrase Segmentation & 6-8+6-8 Comma Phrasing:
   - Replace any comma "," with a single clean space so the two halves balance cleanly (or split into two sequential cues if vocal pause > 1.2s).
   - Optimal cue length is 14 to 30 Thai characters. Never split Thai compound words in half or strand an orphan syllable.
3. Clean Text Only:
   - DO NOT include ellipses ("...", "…"), commas (","), chord notes, or bracketed section labels ([Verse], [Chorus], [Outro]) in subtitle text or hook headline.
4. Precise Singing Vocal Alignment & Instrumental Gap Respect:
   - "startTime" matches when the singer begins that phrase; "endTime" matches when they finish singing or breathe.
   - Leave clean silent gaps during instrumental interludes. All timestamps MUST lie within 0 and ${duration.toFixed(2)} seconds.
5. TikTok Viral Hook:
   - Craft 1 punchy 3-second hook headline in Thai relevant to the song title/story (WITHOUT "..." or "…").
6. Return ONLY valid JSON matching the schema.`;

    const cleanLines = lyrics
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/\.{2,}|…/g, " ").replace(/,/g, " ").replace(/\s+/g, " "))
      .filter((l) => l.length > 0 && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));

    const formattedLines = cleanLines.map((l, i) => `${i + 1}. ${l}`).join("\n");

    const userPrompt = `Song Title: "${songTitle || "เพลงไม่มีชื่อ"}"
Total Audio Duration: ${duration.toFixed(2)} seconds

Original Song Lyrics:
${formattedLines}

Task: Analyze timing, detect vocal start ("detectedIntro"), segment phrases cleanly, craft a Thai TikTok hook headline tailored to "${songTitle || "บทเพลงนี้"}", select recommendedStyle, and summarize segmentation strategy in Thai ("vocalInsight").`;

    const parts: any[] = [];
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      });
    }
    parts.push({ text: userPrompt });

    let jsonResult: any = null;
    let modelUsed = "";
    let mode: "ai" | "fallback" = "ai";
    let fatalError: { status: number; userMessage: string } | null = null;
    const deadlineMs = Date.now() + 50000;

    // 1. Audio + Lyrics multimodal pass
    if (audioBase64) {
      for (const model of CANDIDATE_MODELS) {
        const remaining = deadlineMs - Date.now();
        if (remaining < 4000) break;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), Math.min(20000, remaining - 500));
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts }],
            config: {
              abortSignal: controller.signal,
              systemInstruction: { parts: [{ text: systemInstruction }] },
              responseMimeType: "application/json",
              responseJsonSchema: SYNC_RESPONSE_SCHEMA,
              temperature: 0.1,
              maxOutputTokens: 8192,
            },
          });

          const text = response.text || "";
          if (text) {
            const cleanedText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
            jsonResult = JSON.parse(cleanedText);
            modelUsed = model;
            break;
          }
        } catch (err: any) {
          const classified = classifyGeminiError(err);
          if (classified.fatal) {
            fatalError = { status: classified.status, userMessage: classified.userMessage };
            break;
          }
          console.warn(`Model ${model} audio analysis skipped:`, err?.message);
        } finally {
          clearTimeout(timer);
        }
      }
    }

    if (fatalError) {
      return NextResponse.json({ error: fatalError.userMessage }, { status: fatalError.status });
    }

    // 2. Text-only timing analysis pass if audio pass couldn't complete
    if (!jsonResult) {
      for (const model of CANDIDATE_MODELS) {
        const remaining = deadlineMs - Date.now();
        if (remaining < 3000) break;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), Math.min(12000, remaining - 500));
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            config: {
              abortSignal: controller.signal,
              systemInstruction: { parts: [{ text: systemInstruction }] },
              responseMimeType: "application/json",
              responseJsonSchema: SYNC_RESPONSE_SCHEMA,
              temperature: 0.1,
              maxOutputTokens: 8192,
            },
          });

          const text = response.text || "";
          if (text) {
            const cleanedText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
            jsonResult = JSON.parse(cleanedText);
            modelUsed = `${model}-text`;
            break;
          }
        } catch (err: any) {
          const classified = classifyGeminiError(err);
          if (classified.fatal) {
            fatalError = { status: classified.status, userMessage: classified.userMessage };
            break;
          }
          console.warn(`Model ${model} text analysis skipped:`, err?.message);
        } finally {
          clearTimeout(timer);
        }
      }
    }

    if (fatalError) {
      return NextResponse.json({ error: fatalError.userMessage }, { status: fatalError.status });
    }

    // 3. Deterministic fallback only for transient upstream unavailability (marked mode="fallback")
    if (!jsonResult) {
      mode = "fallback";
      const segmentedLines: string[] = [];
      for (const line of cleanLines) {
        if (line.length > 30 && line.includes(" ")) {
          const words = line.split(" ");
          let cur = "";
          for (const w of words) {
            if ((cur + " " + w).trim().length > 25 && cur) {
              segmentedLines.push(cur.trim());
              cur = w;
            } else {
              cur = cur ? `${cur} ${w}` : w;
            }
          }
          if (cur.trim()) segmentedLines.push(cur.trim());
        } else {
          segmentedLines.push(line);
        }
      }

      const detectedIntro = Math.min(duration * 0.15, duration >= 180 ? 12.0 : 6.0);
      const outroReserve = Math.min(duration * 0.1, duration >= 180 ? 10.0 : 4.0);
      const usableSpan = Math.max(duration - detectedIntro - outroReserve, segmentedLines.length * 1.4);
      const slotPerCue = usableSpan / Math.max(segmentedLines.length, 1);

      let curr = detectedIntro;
      const fallbackSubtitles = segmentedLines.map((line, idx) => {
        const start = curr;
        const dur = Math.max(Math.min(slotPerCue * 0.88, 4.5), 1.4);
        curr += slotPerCue;
        return {
          id: idx + 1,
          startTime: parseFloat(start.toFixed(2)),
          endTime: parseFloat(Math.min(duration, start + dur).toFixed(2)),
          text: line,
        };
      });

      const titleHook = songTitle ? `เปิดฟังเพลง “${songTitle}” ฟังจบมีน้ำตาซึม 🎧` : "เปิดฟังเพลงนี้แล้วอินจนหยุดไม่ได้ 🎧";

      jsonResult = {
        detectedIntro: parseFloat(detectedIntro.toFixed(2)),
        recommendedHook: titleHook,
        recommendedStyle: "neon-yellow",
        vocalInsight:
          "โหมดสำรองอัจฉริยะ (ชั่วคราว): คำนวณจังหวะคำร้องตามสัดส่วนความยาวเพลงอัตโนมัติ แนะนำกด Tap-to-Sync ปรับละเอียดหากต้องการความแม่นยำระดับเสี้ยววินาที",
        subtitles: fallbackSubtitles,
      };
    }

    if (jsonResult && Array.isArray(jsonResult.subtitles)) {
      jsonResult.subtitles = sanitizeSubtitles(jsonResult.subtitles, duration);
    }

    if (typeof jsonResult.detectedIntro === "number") {
      jsonResult.detectedIntro = parseFloat(Math.max(0, Math.min(jsonResult.detectedIntro, duration)).toFixed(2));
    }

    return NextResponse.json({
      success: true,
      mode,
      model: modelUsed || (mode === "fallback" ? "deterministic-fallback" : CANDIDATE_MODELS[0]),
      data: jsonResult,
    });
  } catch (error) {
    console.error("Gemini Audio Sync API Error:", error);
    return NextResponse.json(
      {
        error: "เกิดข้อผิดพลาดในการวิเคราะห์ด้วย Gemini API กรุณาตรวจสอบ API Key หรือลองใหม่อีกครั้ง",
      },
      { status: 500 }
    );
  }
}
