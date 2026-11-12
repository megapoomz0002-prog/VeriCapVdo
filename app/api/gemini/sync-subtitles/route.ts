import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for audio analysis

export async function POST(req: NextRequest) {
  try {
    let lyrics = "";
    let songTitle = "";
    let duration = 60;
    let apiKey = "";
    let audioBase64: string | null = null;
    let mimeType = "audio/mp3";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      lyrics = (formData.get("lyrics") as string) || "";
      songTitle = (formData.get("songTitle") as string) || "";
      duration = parseFloat((formData.get("duration") as string) || "60");
      apiKey = (formData.get("apiKey") as string) || "";

      const audioFile = formData.get("audio") as File | null;
      if (audioFile && audioFile.size > 0) {
        mimeType = audioFile.type || "audio/mp3";
        const arrayBuf = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const maxBytes = 18 * 1024 * 1024;
        const isStreamSliceSafe = mimeType.toLowerCase().includes("mp3") || mimeType.toLowerCase().includes("mpeg");
        const safeBuffer =
          buffer.length > maxBytes && isStreamSliceSafe
            ? buffer.subarray(0, maxBytes)
            : buffer;
        audioBase64 = safeBuffer.toString("base64");
      }
    } else {
      const body = await req.json();
      lyrics = body.lyrics || "";
      songTitle = body.songTitle || "";
      duration = body.duration || 60;
      apiKey = body.apiKey || "";
      audioBase64 = body.audioBase64 || null;
      mimeType = body.mimeType || "audio/mp3";
    }

    const token = (apiKey && apiKey.trim()) || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

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

    const ai = new GoogleGenAI({ apiKey: token });

    const systemInstruction = `You are an elite music video audio engineer, master karaoke timing producer, and viral TikTok creative director.
Your job is to analyze the audio track and lyrics of a song (including 4-to-5-minute epic through-composed 76-line songs), precisely segment the lyrics into natural singing phrases, align each subtitle cue with the singer's actual vocals, and optimize formatting for vertical 9:16 TikTok safe zones.

CRITICAL SUBTITLE SEGMENTATION & TIMING RULES:
1. Vocal Intro Detection: Accurately detect the exact second when the instrumental intro ends and the first singing vocal begins. Record this in "detectedIntro".
2. Intelligent Phrase Segmentation & 6-8+6-8 Comma Phrasing (การตัดแบ่งวรรคซับตามจังหวะ 6-8+6-8 และห้ามตัดคำขาด):
   - Many input lines follow the "[วรรคหน้า 6-8 พยางค์], [วรรคหลัง 6-8 พยางค์]" format separated by a comma ",".
   - Replace any comma "," with a single clean space so the two halves render as two balanced karaoke lines on screen (or split into two sequential cues if the vocal pause between halves is > 1.2s).
   - Optimal cue length is 14 to 30 Thai characters.
   - NEVER break compound words or syllables in half (e.g. keep "ความทรงจำ", "กอดพ่อ", "หยาดเหงื่อ", "หลับใหล", "คำร่ำลา" intact).
   - Never leave a single orphan word stranded alone.
3. Zero Ellipses, Zero Commas & Clean Text (ลบจุดไข่ปลา ... และลูกน้ำ , ออกจากข้อความซับทั้งหมด):
   - DO NOT include any ellipses ("...", "…"), commas (","), or trailing dots in subtitle text or hook headline.
   - Remove parenthetical notes, chord markers, or bracketed instructions (e.g. [Verse], [Chorus], [Instrumental Solo Interlude]).
4. Precise Singing Vocal Alignment & Instrumental Gap Respect:
   - Each cue's "startTime" must match the exact millisecond/second when the singer utters the first syllable of that phrase.
   - "endTime" must match when the vocal note ends or the singer breathes.
   - When there is an "[Instrumental Solo Interlude]" or guitar solo bridge between sections, leave a clean time gap with NO subtitle hanging on screen during the instrumental solo.
5. TikTok Viral Hook:
   - Craft 1 punchy 3-second hook headline in Thai with an emoji (WITHOUT any "..." or "…").
6. Color Styling:
   - Recommend one kinetic color theme: "neon-yellow" | "cyber-cyan" | "sunset-gold" | "ruby-red" | "pure-white".
7. Return ONLY a valid JSON object matching the requested schema. No markdown backticks or commentary outside JSON.`;

    const cleanLines = lyrics
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/\.{2,}|…/g, " ").replace(/,/g, " ").replace(/\s+/g, " "))
      .filter((l) => l.length > 0 && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));

    const formattedLines = cleanLines.map((l, i) => `${i + 1}. ${l}`).join("\n");

    const userPrompt = `Song Title: "${songTitle || "เพลงไม่มีชื่อ"}"
Total Audio Duration: ${duration} seconds

Original Song Lyrics:
${formattedLines}

CRITICAL AUDIO ANALYSIS & SUBTITLE SEGMENTATION TASK:
1. Listen to the entire audio clip provided.
2. Detect the exact timestamp where the musical intro ends and the singer begins singing. Set "detectedIntro" to this second.
3. Intelligently segment and format the lyrics into balanced, singable subtitle cues for TikTok 9:16 vertical video:
   - Each cue must be a complete musical phrase (15-28 Thai characters).
   - DO NOT cut words mid-syllable.
   - Strip all "..." and "…" completely.
   - Assign exact "startTime" and "endTime" corresponding to when the singer vocalizes that exact phrase.
4. Provide a viral 3-second hook headline (without ellipses) and recommend a color theme.
5. Provide "vocalInsight" in Thai describing your vocal analysis, tempo, and how the phrases were segmented to fit the TikTok safe zone.

Output ONLY valid JSON matching this schema:
{
  "detectedIntro": number,
  "recommendedHook": string,
  "recommendedStyle": "neon-yellow" | "cyber-cyan" | "sunset-gold" | "ruby-red" | "pure-white",
  "vocalInsight": string,
  "subtitles": [
    {
      "id": number,
      "startTime": number,
      "endTime": number,
      "text": string
    }
  ]
}`;

    let safeMime = "audio/mp3";
    if (mimeType.toLowerCase().includes("wav")) safeMime = "audio/wav";
    else if (mimeType.toLowerCase().includes("aac")) safeMime = "audio/aac";
    else if (mimeType.toLowerCase().includes("ogg")) safeMime = "audio/ogg";
    else if (mimeType.toLowerCase().includes("flac")) safeMime = "audio/flac";
    else safeMime = "audio/mp3";

    const parts: any[] = [];
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: safeMime,
          data: audioBase64,
        },
      });
    }
    parts.push({ text: userPrompt });

    // Try current models in order of capability
    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.8-flash"];
    let lastError: any = null;
    let jsonResult: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts,
            },
          ],
          config: {
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        });

        const text = response.text || "";
        if (text) {
          const cleanedText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          jsonResult = JSON.parse(cleanedText);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} audio-based failed, trying next candidate:`, err.message);
      }
    }

    // If audio-based analysis failed (e.g. audio payload too large or unsupported audio codec),
    // fallback gracefully to intelligent text-musical analysis
    if (!jsonResult) {
      console.warn("Audio-based analysis failed, falling back to intelligent text-musical analysis...");
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [{ text: userPrompt }],
              },
            ],
            config: {
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              responseMimeType: "application/json",
              temperature: 0.1,
              maxOutputTokens: 8192,
            },
          });

          const text = response.text || "";
          if (text) {
            const cleanedText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
            jsonResult = JSON.parse(cleanedText);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${model} text-based failed:`, err.message);
        }
      }
    }

    // Ultimate safety net: Deterministic intelligent timing calculation
    if (!jsonResult) {
      console.warn("All Gemini models failed, using deterministic musical timing engine...");
      const rawLines = lyrics
        .split(/\r?\n/)
        .map((l) => l.replace(/\.{2,}|…/g, " ").replace(/\s+/g, " ").trim())
        .filter((l) => l.length > 0 && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));

      const segmentedLines: string[] = [];
      for (const line of rawLines) {
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

      const detectedIntro = duration >= 180 ? 12.0 : 8.0;
      const outroReserve = duration >= 180 ? 12.0 : 5.0;
      const availableSingTime = Math.max(duration - detectedIntro - outroReserve, segmentedLines.length * 2.6);
      const slotPerCue = availableSingTime / Math.max(segmentedLines.length, 1);

      let curr = detectedIntro;
      const fallbackSubtitles = segmentedLines.map((line, idx) => {
        const start = curr;
        const dur = Math.max(Math.min(slotPerCue * 0.88, 4.8), 2.0);
        curr += slotPerCue;
        return {
          id: idx + 1,
          startTime: parseFloat(start.toFixed(2)),
          endTime: parseFloat((start + dur).toFixed(2)),
          text: line.replace(/,/g, " ").replace(/\s+/g, " ").trim(),
        };
      });

      jsonResult = {
        detectedIntro,
        recommendedHook: "ใครที่กำลังเหนื่อย ฟังเพลงนี้เถอะนะ 💔",
        recommendedStyle: "neon-yellow",
        vocalInsight: "คำนวณจังหวะเพลงไทยและตัดแบ่งท่อนร้อง: ท่อนละ 2-4 วินาที พอดีกับพื้นที่ปลอดภัย TikTok ไม่ชนคำโพสต์",
        subtitles: fallbackSubtitles,
      };
    }

    // Post-process & sanitize subtitles so cues never overlap or hang over instrumental bridges
    if (jsonResult && Array.isArray(jsonResult.subtitles)) {
      const rawSubs = jsonResult.subtitles;
      const sanitizedSubs = rawSubs
        .map((cue: any, idx: number) => {
          const cleanText = String(cue.text || "")
            .replace(/\.{2,}|…/g, " ")
            .replace(/\[.*?\]/g, "")
            .replace(/\s+/g, " ")
            .trim();
          const start = Math.max(0, Number(cue.startTime) || 0);
          let end = Number(cue.endTime) || start + 3.2;
          if (end <= start + 0.4) end = start + 2.8;
          // Prevent subtitle from hanging more than 5.2s across instrumental gaps
          if (end - start > 5.2) end = start + 4.5;
          return {
            id: idx + 1,
            startTime: parseFloat(start.toFixed(2)),
            endTime: parseFloat(end.toFixed(2)),
            text: cleanText,
          };
        })
        .filter((cue: any) => cue.text.length > 0);

      for (let i = 0; i < sanitizedSubs.length - 1; i++) {
        if (sanitizedSubs[i].endTime > sanitizedSubs[i + 1].startTime) {
          sanitizedSubs[i].endTime = parseFloat(
            Math.max(sanitizedSubs[i].startTime + 0.5, sanitizedSubs[i + 1].startTime - 0.05).toFixed(2)
          );
        }
      }
      jsonResult.subtitles = sanitizedSubs;
    }

    return NextResponse.json({
      success: true,
      data: jsonResult,
    });
  } catch (error: any) {
    console.error("Gemini Audio Sync API Error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "เกิดข้อผิดพลาดในการวิเคราะห์ด้วย Gemini API กรุณาตรวจสอบ API Key หรือลองใหม่อีกครั้ง",
      },
      { status: 500 }
    );
  }
}
