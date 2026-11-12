export interface SubtitleCue {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
  words?: string[];
}

/**
 * Converts timestamp string (e.g., "00:01:23,456" or "01:23.45") into seconds
 */
export function parseTimestamp(timeStr: string): number {
  const clean = timeStr.trim().replace(',', '.');
  const parts = clean.split(':');

  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else {
    return parseFloat(clean) || 0;
  }
}

export function cleanSubtitleText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\.{2,}|…/g, " ")
    .replace(/,/g, " ")
    .replace(/[\[\(\{].*?[\]\)\}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Intelligently balances and formats a Thai lyric line into 1 or 2 clean, natural lines.
 * Guarantees that compound words are never split, and orphan words are never left stranded.
 */
export function balanceThaiLyric(rawText: string): string[] {
  let clean = cleanSubtitleText(rawText);
  if (!clean) return [];

  // Fix accidentally split Thai compound words / syllables
  clean = clean
    .replace(/ไร้\s+คำ\s*ร่ำลา/g, "ไร้คำร่ำลา")
    .replace(/คำ\s+ร่ำลา/g, "คำร่ำลา")
    .replace(/ความ\s+ทรงจำ/g, "ความทรงจำ")
    .replace(/กอด\s+พ่อ/g, "กอดพ่อ")
    .replace(/หลับ\s+ตา/g, "หลับตา")
    .replace(/จาก\s+ลา/g, "จากลา")
    .replace(/สาย\s+ใย/g, "สายใย")
    .replace(/ขี้\s+เลื่อย/g, "ขี้เลื่อย")
    .replace(/ตลับ\s+เมตร/g, "ตลับเมตร");

  // If text already has explicit newline, respect it
  if (clean.includes("\n")) {
    return clean.split("\n").map((l) => l.trim()).filter(Boolean);
  }

  // If text has spaces (natural caesuras), split by spaces
  const rawParts = clean.split(" ").filter(Boolean);

  // Re-join orphan prepositions or short prefixes (e.g. single-letter/1-syllable stranded words)
  const parts: string[] = [];
  for (let i = 0; i < rawParts.length; i++) {
    const cur = rawParts[i];
    if (i > 0 && (cur === "คำ" || cur === "ที่" || cur === "ใน" || cur === "และ" || cur === "กับ" || cur === "ให้" || cur === "ไร้") && i + 1 < rawParts.length) {
      // Connect to the next word instead of being stranded
      rawParts[i + 1] = cur + rawParts[i + 1];
    } else if (i > 0 && cur.length <= 2 && (cur === "ลา" || cur === "ตา" || cur === "ใจ")) {
      // Re-attach trailing syllable to previous word
      parts[parts.length - 1] = parts[parts.length - 1] + cur;
    } else {
      parts.push(cur);
    }
  }

  if (parts.length === 2) {
    // 2 natural phrases (e.g. "แต่วันนี้ลูกกลับไร้" and "คำร่ำลา", or "กอดพ่อได้เพียง" and "แค่ในความทรงจำ")
    return [parts[0], parts[1]];
  }

  if (parts.length === 3) {
    // 3 phrases (e.g. "ภาพวัยเยาว์", "นั่งข้างแคร่", "ในม่านตา")
    const len01 = (parts[0] + " " + parts[1]).length;
    const len12 = (parts[1] + " " + parts[2]).length;
    if (Math.abs(len01 - parts[2].length) <= Math.abs(parts[0].length - len12)) {
      return [parts[0] + " " + parts[1], parts[2]];
    } else {
      return [parts[0], parts[1] + " " + parts[2]];
    }
  }

  if (parts.length > 3) {
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
  }

  // Single chunk with no spaces: if short (<= 22 chars), keep on 1 line
  if (clean.length <= 22) {
    return [clean];
  }

  // Long single chunk with no spaces: look for natural semantic Thai connectors
  const connectors = [
    "แค่ในความทรงจำ",
    "ในความทรงจำ",
    "ไม่หวนกลับ",
    "จนหลับใหล",
    "แทบขาดใจ",
    "ด้วยศรัทธา",
    "อยู่ในใจ",
    "ที่คุ้นตา",
    "พรากพ่อไป",
    "เครื่องมือลง",
    "บนปลายฟ้า",
    "คืนความหวัง",
    "ไม่เคยบ่น",
    "แม้แต่",
    "จากห้องนอน",
    "ชั่วนิรันดร์",
  ];

  for (const conn of connectors) {
    if (clean.includes(conn) && clean !== conn) {
      const idx = clean.indexOf(conn);
      const p1 = clean.substring(0, idx).trim();
      const p2 = clean.substring(idx).trim();
      if (p1.length >= 6 && p2.length >= 6) {
        return [p1, p2];
      }
    }
  }

  // Generic Thai phrase splitters
  const phraseSplitters = ["เพราะ", "แต่", "และ", "เมื่อ", "เพื่อ", "ก่อน", "หลัง", "ให้", "ได้", "ก็", "จึง"];
  for (const sp of phraseSplitters) {
    const idx = clean.lastIndexOf(sp);
    if (idx >= 8 && idx <= clean.length - 6) {
      return [clean.substring(0, idx).trim(), clean.substring(idx).trim()];
    }
  }

  return [clean];
}

/**
 * Format seconds into mm:ss
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse an SRT subtitle content string
 */
export function parseSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);

  let idCounter = 1;

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // Check if line 0 is ID number or time string
    let timeLineIndex = 0;
    if (/^\d+$/.test(lines[0].trim()) && lines.length >= 3) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    const match = timeLine.match(/(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/);

    if (match) {
      const startTime = parseTimestamp(match[1]);
      const endTime = parseTimestamp(match[2]);
      const textLines = lines.slice(timeLineIndex + 1).join(' ').trim();

      // Clean HTML tags and ellipses
      const cleanText = cleanSubtitleText(textLines.replace(/<[^>]+>/g, ''));

      if (cleanText) {
        cues.push({
          id: idCounter++,
          startTime,
          endTime,
          text: cleanText,
          words: splitThaiWords(cleanText)
        });
      }
    }
  }

  return cues;
}

/**
 * Parse an LRC (Lyric) content string
 */
export function parseLRC(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const rawEntries: { time: number; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Matches [00:15.30] or [01:23.456]
    const matches = [...trimmed.matchAll(/\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]/g)];
    if (matches.length > 0) {
      const text = cleanSubtitleText(trimmed.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, ''));
      if (!text) continue;

      for (const m of matches) {
        const time = parseTimestamp(m[1]);
        rawEntries.push({ time, text });
      }
    }
  }

  // Sort by time
  rawEntries.sort((a, b) => a.time - b.time);

  // Derive end times: each cue ends when the next cue starts (or default +4s)
  for (let i = 0; i < rawEntries.length; i++) {
    const current = rawEntries[i];
    const nextTime = i + 1 < rawEntries.length ? rawEntries[i + 1].time : current.time + 4.0;
    const duration = Math.min(Math.max(nextTime - current.time, 1.0), 6.0);

    cues.push({
      id: i + 1,
      startTime: current.time,
      endTime: current.time + duration,
      text: current.text,
      words: splitThaiWords(current.text)
    });
  }

  return cues;
}

/**
 * Universal Subtitle/LRC parser
 */
export function parseSubtitleFile(content: string, fileName?: string): SubtitleCue[] {
  const isLrc = fileName?.toLowerCase().endsWith('.lrc') || content.includes('[00:');
  if (isLrc) {
    const parsed = parseLRC(content);
    if (parsed.length > 0) return parsed;
  }
  return parseSRT(content);
}

/**
 * Simple Thai/English word segmenter for bouncy karaoke animation
 */
export function splitThaiWords(text: string): string[] {
  // If text contains ellipses, spaces, or punctuation, split by them first
  const chunks = text.split(/(\s+|\.{2,}|…|-)/).filter(Boolean);
  const result: string[] = [];

  for (const chunk of chunks) {
    if (chunk.trim()) {
      result.push(chunk.trim());
    }
  }

  return result.length > 0 ? result : [text];
}

/**
 * Automatically generate timed SubtitleCue list from raw lyrics text
 * Uses natural musical phrasing (3.5s - 4.5s per line) rather than blindly dividing 5-minute songs into huge gaps.
 */
export function autoGenerateCuesFromLyrics(
  lyrics: string,
  totalDuration: number = 30,
  introOffset: number = 2.0,
  pacePerLine: number = 4.0
): SubtitleCue[] {
  if (!lyrics) return [];

  // 1. Split raw text into lines and clean out tags like [Verse], [Chorus], etc.
  const rawLines = lyrics
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));

  const cleanLines: string[] = [];
  for (const line of rawLines) {
    const stripped = line.replace(/\[[^\]]*\]/g, "").replace(/\([^\)]*\)/g, "").trim();
    if (stripped.length >= 2) {
      cleanLines.push(stripped);
    }
  }

  if (cleanLines.length === 0) return [];

  const cues: SubtitleCue[] = [];
  const startOffset = Math.max(0, introOffset);

  // Natural singing pace: usually 3.2s to 4.8s per line.
  // If the audio is short (e.g. 30s preview), we fit within duration.
  // If the audio is a full song (e.g. 3-5 mins), we pace lines naturally (3.5 - 4.5s) instead of stranding them 60s apart!
  let timePerLine = pacePerLine;
  if (totalDuration > 0 && totalDuration < 45) {
    const usable = Math.max(totalDuration - startOffset - 1.0, cleanLines.length * 2.0);
    timePerLine = usable / cleanLines.length;
  }

  for (let i = 0; i < cleanLines.length; i++) {
    const text = cleanLines[i];
    const startTime = Number((startOffset + i * timePerLine).toFixed(2));
    const duration = Math.min(Math.max(timePerLine * 0.92, 2.2), 6.0);
    const endTime = Number((startTime + duration).toFixed(2));

    cues.push({
      id: i + 1,
      startTime,
      endTime,
      text,
      words: splitThaiWords(text),
    });
  }

  return cues;
}

/**
 * Shifts all cues by a given offset in seconds (positive or negative)
 */
export function offsetCues(cues: SubtitleCue[], offsetSeconds: number): SubtitleCue[] {
  return cues.map((cue) => {
    const newStart = Math.max(0, Number((cue.startTime + offsetSeconds).toFixed(2)));
    const duration = Math.max(0.5, cue.endTime - cue.startTime);
    const newEnd = Number((newStart + duration).toFixed(2));
    return {
      ...cue,
      startTime: newStart,
      endTime: newEnd,
    };
  });
}

/**
 * Extracts clean lyric lines ready for karaoke stamping
 */
export function cleanLyricsToLines(rawLyrics: string): string[] {
  if (!rawLyrics) return [];
  const lines = rawLyrics
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !/^\[.*\]$/.test(l) &&
        !/^\(.*\)$/.test(l) &&
        !l.startsWith("Style of Music") &&
        !l.startsWith("Exclude Styles")
    );

  const result: string[] = [];
  for (const line of lines) {
    const clean = line.replace(/\[[^\]]*\]/g, "").replace(/\([^\)]*\)/g, "").trim();
    if (clean.length >= 2) {
      result.push(clean);
    }
  }
  return result;
}

/**
 * Export SubtitleCues to standard SRT string
 */
export function exportCuesToSRT(cues: SubtitleCue[]): string {
  const formatSrtTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${millis.toString().padStart(3, "0")}`;
  };

  return cues
    .map((cue, idx) => {
      return `${idx + 1}\n${formatSrtTime(cue.startTime)} --> ${formatSrtTime(cue.endTime)}\n${cue.text}\n`;
    })
    .join("\n");
}

/**
 * Exports cues to LRC (Karaoke Synced Lyrics format for Suno, Spotify, Apple Music, and mobile players)
 */
export function exportCuesToLRC(cues: SubtitleCue[]): string {
  const formatLrcTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `[${mins.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}]`;
  };

  return cues
    .map((cue) => `${formatLrcTime(cue.startTime)}${cue.text}`)
    .join("\n");
}

/**
 * Exports cues to WebVTT (Universal format for HTML5 video, TikTok, CapCut, and modern web players)
 */
export function exportCuesToVTT(cues: SubtitleCue[]): string {
  const formatVttTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
  };

  return (
    `WEBVTT\n\n` +
    cues
      .map((cue, idx) => {
        return `${idx + 1}\n${formatVttTime(cue.startTime)} --> ${formatVttTime(cue.endTime)}\n${cue.text}\n`;
      })
      .join("\n")
  );
}

export const DEFAULT_KOD_PHOR_LRC = `[00:19.37]กอดพ่อได้เพียง แค่ในความทรงจำ
[00:25.87]การจากลาครั้งนี้ ไม่มีวันหวนกลับ
[00:34.76]เดินเข้ามาในเพิงไม้ ที่คุ้นตา
[00:38.00]เสื้อเปื้อนฝุ่นแขวนข้างฝา ชวนใจหาย
[00:41.63]กบไสไม้วางนิ่งงัน อย่างเดียวดาย
[00:45.05]กลิ่นขี้เลื่อยยังไม่คลาย จากห้องนอน
[00:48.39]ตลับเมตรที่พ่อใช้ วัดแผ่นไม้
[00:51.72]สร้างอนาคตให้ลูก ได้ศึกษา
[00:55.43]แต่วันนี้ลูกกลับไร้ คำร่ำลา
[00:58.79]ฟ้าพรากพ่อไปลับตา ชั่วนิรันดร์
[01:04.40]คนบนฟ้าพรากพ่อไป ไม่หวนกลับ
[01:08.78]พ่อเหนื่อยล้ามาเนิ่นนาน จนหลับใหล
[01:11.66]ลูกเอ่ยถ้อยคำร่ำลา แทบขาดใจ
[01:15.15]กอดพ่อได้เพียง แค่ในความทรงจำ
[01:21.61]ภาพวัยเยาว์ นั่งข้างแคร่ ในม่านตา
[01:28.46]พ่อจับค้อน ตอกตะปู ใต้ชายคา
[01:34.79]รอยเสี้ยนตำ เต็มฝ่ามือ ไม่นำพา
[01:42.15]ประกอบโต๊ะ แลกเงินตรา ส่งลูกเรียน
[01:48.95]ลูกเพิ่งรู้ว่าพ่อซ่อน ความปวดร้าว
[01:52.40]แบกเรื่องราวหนักเกินใคร ไว้ลำพัง
[01:55.78]วันที่ลูกพร้อมตอบแทน คืนความหวัง
[01:59.35]พ่อกลับวางเครื่องมือลง ตลอดกาล
[02:07.84]คนบนฟ้าพรากพ่อไป ไม่หวนกลับ
[02:11.79]เหลือเพียงรอยตลับเมตร ที่คุ้นตา
[02:15.10]ลูกก้มกราบคำสอนพ่อ ด้วยศรัทธา
[02:18.59]กอดพ่อได้เพียง แค่ในความทรงจำ
[02:25.06]มือกระจ้อยเคยช่วยปัด เศษขี้เลื่อย
[02:31.82]เสียงอ้อนถามยามพ่อเหนื่อย อยู่ข้างฝา
[02:39.06]วันนี้ลูกกอดแผ่นไม้ เปื้อนน้ำตา
[02:45.95]หลับให้สบายเถิดหนา บนปลายฟ้า
[02:52.43]คนบนฟ้าพรากพ่อไป ไม่หวนกลับ
[02:56.77]พ่อเหนื่อยล้ามาเนิ่นนาน จนหลับใหล
[03:00.09]กลิ่นขี้เลื่อยยังอบอวล อยู่ในใจ
[03:03.16]กอดพ่อได้เพียง แค่ในความทรงจำ
[03:09.10]เสียงกบไสไม้ ค่อยจางหายไป
[03:16.01]กอดพ่อได้เพียง แค่ในความทรงจำ`;

export function getDefaultKodPhorCues(): SubtitleCue[] {
  return parseLRC(DEFAULT_KOD_PHOR_LRC);
}

