export interface SubtitleCue {
  id: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  words?: string[];
}

function stripBom(content: string): string {
  return content ? content.replace(/^\uFEFF/, "") : "";
}

/**
 * Converts timestamp string (e.g., "00:01:23,456" or "01:23.45") into seconds
 */
export function parseTimestamp(timeStr: string): number {
  const clean = timeStr.trim().replace(",", ".");
  const parts = clean.split(":");

  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  return parseFloat(clean) || 0;
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

function segmentThaiWordsIntl(text: string): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    try {
      const segmenter = new Intl.Segmenter("th", { granularity: "word" });
      return Array.from(segmenter.segment(text), (seg) => seg.segment).filter(Boolean);
    } catch {
      // Fallback below
    }
  }
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Intelligently balances a Thai/English lyric line into 1 or 2 natural lines
 * using Intl.Segmenter("th") word boundaries so compound words are never torn apart.
 */
export function balanceThaiLyric(rawText: string): string[] {
  if (!rawText) return [];

  if (rawText.includes("\n")) {
    const explicit = rawText
      .split(/\r?\n/)
      .map((line) => cleanSubtitleText(line))
      .filter(Boolean);
    if (explicit.length > 0) return explicit.slice(0, 2);
  }

  const clean = cleanSubtitleText(rawText);
  if (!clean) return [];

  const parts = clean.split(" ").filter(Boolean);

  if (parts.length === 2) {
    return [parts[0], parts[1]];
  }

  if (parts.length === 3) {
    const len01 = (parts[0] + " " + parts[1]).length;
    const len12 = (parts[1] + " " + parts[2]).length;
    return Math.abs(len01 - parts[2].length) <= Math.abs(parts[0].length - len12)
      ? [parts[0] + " " + parts[1], parts[2]]
      : [parts[0], parts[1] + " " + parts[2]];
  }

  if (parts.length > 3) {
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
  }

  if (clean.length <= 22) {
    return [clean];
  }

  // Spaceless Thai string > 22 chars: pick the word boundary nearest to midpoint
  const tokens = segmentThaiWordsIntl(clean);
  if (tokens.length >= 2) {
    const totalLen = clean.length;
    let bestIdx = -1;
    let bestDiff = Infinity;
    let runningLen = 0;

    for (let i = 0; i < tokens.length - 1; i++) {
      runningLen += tokens[i].length;
      const rightLen = totalLen - runningLen;
      if (runningLen >= 6 && rightLen >= 6) {
        const diff = Math.abs(runningLen - totalLen / 2);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = i + 1;
        }
      }
    }

    if (bestIdx > 0) {
      const p1 = tokens.slice(0, bestIdx).join("").trim();
      const p2 = tokens.slice(bestIdx).join("").trim();
      if (p1 && p2) return [p1, p2];
    }
  }

  return [clean];
}

/**
 * Format seconds into mm:ss
 */
export function formatTime(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Parse an SRT subtitle content string
 */
export function parseSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = stripBom(content).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.trim().split(/\n\s*\n/);

  let idCounter = 1;

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    let timeLineIndex = 0;
    if (/^\d+$/.test(lines[0].trim()) && lines.length >= 3) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    const match = timeLine.match(
      /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}|\d{1,2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}|\d{1,2}:\d{2}[,.]\d{1,3})/
    );

    if (match) {
      const startTime = parseTimestamp(match[1]);
      const endTime = Math.max(parseTimestamp(match[2]), startTime + 0.3);
      const textLines = lines.slice(timeLineIndex + 1).join(" ").trim();
      const cleanText = cleanSubtitleText(textLines.replace(/<[^>]+>/g, ""));

      if (cleanText) {
        cues.push({
          id: idCounter++,
          startTime,
          endTime,
          text: cleanText,
          words: splitThaiWords(cleanText),
        });
      }
    }
  }

  return cues;
}

/**
 * Parse a WebVTT subtitle content string
 */
export function parseVTT(content: string): SubtitleCue[] {
  const cleaned = stripBom(content)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/^WEBVTT[^\n]*\n?/i, "");
  const blocks = cleaned.trim().split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];
  let idCounter = 1;

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length === 0) continue;
    const first = lines[0].trim().toUpperCase();
    if (first.startsWith("NOTE") || first.startsWith("STYLE") || first.startsWith("REGION")) {
      continue;
    }

    const timeIdx = lines.findIndex((line) => line.includes("-->"));
    if (timeIdx === -1 || timeIdx >= lines.length - 1) continue;

    const match = lines[timeIdx].match(
      /((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3})/
    );
    if (!match) continue;

    const startTime = parseTimestamp(match[1]);
    const endTime = Math.max(parseTimestamp(match[2]), startTime + 0.3);
    const textLines = lines.slice(timeIdx + 1).join(" ").trim();
    const cleanText = cleanSubtitleText(textLines.replace(/<[^>]+>/g, ""));

    if (cleanText) {
      cues.push({
        id: idCounter++,
        startTime,
        endTime,
        text: cleanText,
        words: splitThaiWords(cleanText),
      });
    }
  }

  return cues;
}

/**
 * Parse an LRC (Lyric) content string without forced overlaps
 */
export function parseLRC(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = stripBom(content).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const rawEntries: { time: number; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const matches = [...trimmed.matchAll(/\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]/g)];
    if (matches.length > 0) {
      const text = cleanSubtitleText(trimmed.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, ""));
      if (!text) continue;

      for (const m of matches) {
        const time = parseTimestamp(m[1]);
        rawEntries.push({ time, text });
      }
    }
  }

  rawEntries.sort((a, b) => a.time - b.time);

  for (let i = 0; i < rawEntries.length; i++) {
    const current = rawEntries[i];
    const nextTime = i + 1 < rawEntries.length ? rawEntries[i + 1].time : current.time + 4.0;
    const gap = nextTime - current.time;
    const boundedEnd =
      gap > 0.1
        ? Math.min(current.time + Math.min(Math.max(gap - 0.03, 0.1), 6.0), nextTime)
        : current.time + 0.5;

    cues.push({
      id: i + 1,
      startTime: Number(current.time.toFixed(2)),
      endTime: Number(boundedEnd.toFixed(2)),
      text: current.text,
      words: splitThaiWords(current.text),
    });
  }

  return cues;
}

/**
 * Universal Subtitle/LRC/VTT parser
 */
export function parseSubtitleFile(content: string, fileName?: string): SubtitleCue[] {
  const cleanContent = stripBom(content);
  const lowerName = fileName?.toLowerCase() || "";

  if (lowerName.endsWith(".vtt") || /^\s*WEBVTT\b/i.test(cleanContent)) {
    const parsedVtt = parseVTT(cleanContent);
    if (parsedVtt.length > 0) return parsedVtt;
  }

  const isLrc = lowerName.endsWith(".lrc") || /\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/.test(cleanContent);
  if (isLrc) {
    const parsedLrc = parseLRC(cleanContent);
    if (parsedLrc.length > 0) return parsedLrc;
  }

  return parseSRT(cleanContent);
}

/**
 * Simple Thai/English word segmenter for bouncy karaoke animation
 */
export function splitThaiWords(text: string): string[] {
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
 */
export function autoGenerateCuesFromLyrics(
  lyrics: string,
  totalDuration: number = 30,
  introOffset: number = 2.0,
  pacePerLine: number = 4.0
): SubtitleCue[] {
  if (!lyrics) return [];

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

function formatHmsMillis(seconds: number, separator: "," | "."): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const totalMillis = Math.round(safe * 1000);
  const hrs = Math.floor(totalMillis / 3_600_000);
  const mins = Math.floor((totalMillis % 3_600_000) / 60_000);
  const secs = Math.floor((totalMillis % 60_000) / 1000);
  const millis = totalMillis % 1000;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}${separator}${millis.toString().padStart(3, "0")}`;
}

/**
 * Export SubtitleCues to standard UTF-8 SRT (with BOM for Windows/CapCut Thai support)
 */
export function exportCuesToSRT(cues: SubtitleCue[]): string {
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);
  const body = sorted
    .map(
      (cue, idx) =>
        `${idx + 1}\n${formatHmsMillis(cue.startTime, ",")} --> ${formatHmsMillis(cue.endTime, ",")}\n${cue.text}\n`
    )
    .join("\n");
  return `\uFEFF${body}`;
}

/**
 * Exports cues to LRC without [00:60.00] rounding overflow
 */
export function exportCuesToLRC(cues: SubtitleCue[]): string {
  const formatLrcTime = (seconds: number): string => {
    const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
    const totalCentis = Math.round(safe * 100);
    const mins = Math.floor(totalCentis / 6000);
    const remCentis = totalCentis % 6000;
    const secs = Math.floor(remCentis / 100);
    const cs = remCentis % 100;
    return `[${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}]`;
  };

  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);
  return sorted.map((cue) => `${formatLrcTime(cue.startTime)}${cue.text}`).join("\n");
}

/**
 * Exports cues to WebVTT
 */
export function exportCuesToVTT(cues: SubtitleCue[]): string {
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);
  return (
    `WEBVTT\n\n` +
    sorted
      .map(
        (cue, idx) =>
          `${idx + 1}\n${formatHmsMillis(cue.startTime, ".")} --> ${formatHmsMillis(cue.endTime, ".")}\n${cue.text}\n`
      )
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
