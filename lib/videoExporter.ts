import { SubtitleCue } from "./srtParser";
import {
  MVCameraMotion,
  MVVisualEffect,
  MV_COLOR_THEMES,
  SubtitleColorTheme,
  computeCameraTransform,
  createMvParticles,
  createMvSprites,
  drawHookHeadlineBanner,
  drawMvBackground,
  drawMvEffects,
  drawSubtitleCueOnCanvas,
  drawTopTitleOverlay,
  drawWaveformVisualizer,
} from "./mvVisuals";

export interface ExportVideoOptions {
  audioElement?: HTMLAudioElement;
  audioUrl?: string;
  backgroundImageUrl?: string;
  isVideoBg?: boolean;
  songTitle: string;
  credit: string;
  subtitles?: SubtitleCue[];
  showSubtitles?: boolean;
  aspectRatio: "9:16" | "16:9";
  subtitleStyle: SubtitleColorTheme;
  fontSize?: "normal" | "large" | "mega";
  visualEffect?: MVVisualEffect;
  cameraMotion?: MVCameraMotion;
  subtitleTransition?: "slide-up" | "bounce-pop" | "glow-fade";
  enableKenBurns?: boolean;
  subtitlePosY?: number;
  showTopTitle?: boolean;
  showHookHeadline?: boolean;
  hookHeadline?: string;
  showVinylDisc?: boolean;
  showWaveform?: boolean;
  visualizerStyle?: "bars" | "wave" | "circle";
  trimStartTime?: number;
  trimEndTime?: number;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
  onComplete?: (blobUrl: string, fileExtension?: string) => void;
  onError?: (err: Error) => void;
}

const MAX_UINT32 = 0xffffffff;

/**
 * Patches MP4 ISOBMFF metadata (mvhd, mvex->mehd, tkhd, mdhd) with accurate duration
 * so both standard MP4 and Chromium fMP4 streams seek accurately in all players.
 */
export function patchMp4Metadata(buffer: Uint8Array, durationSec: number): Uint8Array {
  if (!Number.isFinite(durationSec) || durationSec <= 0 || buffer.byteLength < 16) {
    return buffer;
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let pos = 0;
  let timescale = 1000;

  function readBox(offset: number): { size: number; type: string; offset: number; headerSize: number } | null {
    if (offset + 8 > buffer.byteLength) return null;
    let size = view.getUint32(offset);
    let headerSize = 8;
    const type = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7]
    );
    if (size === 1) {
      if (offset + 16 > buffer.byteLength) return null;
      const big = view.getBigUint64(offset + 8);
      if (big > BigInt(buffer.byteLength - offset)) return null;
      size = Number(big);
      headerSize = 16;
    } else if (size === 0) {
      size = buffer.byteLength - offset;
    }
    if (size < headerSize) return null;
    return { size, type, offset, headerSize };
  }

  const clampUint32Duration = (seconds: number, ts: number) =>
    Math.min(Math.max(0, Math.round(seconds * ts)), MAX_UINT32);

  while (pos < buffer.byteLength) {
    const box = readBox(pos);
    if (!box || box.offset + box.size > buffer.byteLength) break;

    if (box.type === "moov") {
      let subPos = box.offset + box.headerSize;
      const moovEnd = box.offset + box.size;

      while (subPos < moovEnd) {
        const subBox = readBox(subPos);
        if (!subBox || subBox.offset + subBox.size > moovEnd) break;
        const p = subBox.offset + subBox.headerSize;

        if (subBox.type === "mvhd" && p + 4 <= subBox.offset + subBox.size) {
          const version = view.getUint8(p);
          if (version === 0 && p + 20 <= subBox.offset + subBox.size) {
            timescale = view.getUint32(p + 12) || 1000;
            view.setUint32(p + 16, clampUint32Duration(durationSec, timescale));
          } else if (version === 1 && p + 32 <= subBox.offset + subBox.size) {
            timescale = view.getUint32(p + 20) || 1000;
            view.setBigUint64(p + 24, BigInt(Math.round(durationSec * timescale)));
          }
        } else if (subBox.type === "mvex") {
          let mvexSub = subBox.offset + subBox.headerSize;
          const mvexEnd = subBox.offset + subBox.size;
          while (mvexSub < mvexEnd) {
            const xBox = readBox(mvexSub);
            if (!xBox || xBox.offset + xBox.size > mvexEnd) break;
            if (xBox.type === "mehd") {
              const mp = xBox.offset + xBox.headerSize;
              const ver = view.getUint8(mp);
              if (ver === 0 && mp + 8 <= xBox.offset + xBox.size) {
                view.setUint32(mp + 4, clampUint32Duration(durationSec, timescale));
              } else if (ver === 1 && mp + 12 <= xBox.offset + xBox.size) {
                view.setBigUint64(mp + 4, BigInt(Math.round(durationSec * timescale)));
              }
            }
            mvexSub += xBox.size;
          }
        } else if (subBox.type === "trak") {
          let trakSub = subBox.offset + subBox.headerSize;
          const trakEnd = subBox.offset + subBox.size;

          while (trakSub < trakEnd) {
            const tBox = readBox(trakSub);
            if (!tBox || tBox.offset + tBox.size > trakEnd) break;
            const tp = tBox.offset + tBox.headerSize;

            if (tBox.type === "tkhd") {
              const version = view.getUint8(tp);
              if (version === 0 && tp + 24 <= tBox.offset + tBox.size) {
                view.setUint32(tp + 20, clampUint32Duration(durationSec, timescale));
              } else if (version === 1 && tp + 36 <= tBox.offset + tBox.size) {
                view.setBigUint64(tp + 28, BigInt(Math.round(durationSec * timescale)));
              }
            } else if (tBox.type === "mdia") {
              let mdiaSub = tBox.offset + tBox.headerSize;
              const mdiaEnd = tBox.offset + tBox.size;
              while (mdiaSub < mdiaEnd) {
                const mBox = readBox(mdiaSub);
                if (!mBox || mBox.offset + mBox.size > mdiaEnd) break;
                if (mBox.type === "mdhd") {
                  const mp = mBox.offset + mBox.headerSize;
                  const version = view.getUint8(mp);
                  if (version === 0 && mp + 20 <= mBox.offset + mBox.size) {
                    const trackTs = view.getUint32(mp + 12) || 1000;
                    view.setUint32(mp + 16, clampUint32Duration(durationSec, trackTs));
                  } else if (version === 1 && mp + 32 <= mBox.offset + mBox.size) {
                    const trackTs = view.getUint32(mp + 20) || 1000;
                    view.setBigUint64(mp + 24, BigInt(Math.round(durationSec * trackTs)));
                  }
                }
                mdiaSub += mBox.size;
              }
            }
            trakSub += tBox.size;
          }
        }
        subPos += subBox.size;
      }
    }
    pos += box.size;
  }
  return buffer;
}

function readEbmlVint(bytes: Uint8Array, offset: number): { width: number; value: number; isUnknown: boolean } | null {
  if (offset >= bytes.length) return null;
  const first = bytes[offset];
  if (first === 0) return null;

  let width = 1;
  let mask = 0x80;
  while (width <= 8 && (first & mask) === 0) {
    width++;
    mask >>= 1;
  }
  if (width > 8 || offset + width > bytes.length) return null;

  let val = BigInt(first & ~mask);
  let allOnes = BigInt(first & ~mask) === BigInt((1 << (8 - width)) - 1);
  for (let i = 1; i < width; i++) {
    val = (val << 8n) | BigInt(bytes[offset + i]);
    if (bytes[offset + i] !== 0xff) allOnes = false;
  }

  return { width, value: Number(val), isUnknown: allOnes };
}

function writeEbmlVintSameWidth(bytes: Uint8Array, offset: number, width: number, newValue: number): boolean {
  const maxAllowed = Math.pow(2, 7 * width) - 2;
  if (newValue < 0 || newValue > maxAllowed || offset + width > bytes.length) {
    return false;
  }

  let val = BigInt(newValue);
  for (let i = width - 1; i >= 1; i--) {
    bytes[offset + i] = Number(val & 0xffn);
    val >>= 8n;
  }
  const marker = 0x80 >> (width - 1);
  bytes[offset] = marker | Number(val);
  return true;
}

/**
 * Patches WebM EBML metadata with accurate duration, keeping Info & Segment VINT sizes consistent.
 */
export function patchWebmMetadata(buffer: Uint8Array, durationMs: number): Uint8Array {
  if (!Number.isFinite(durationMs) || durationMs <= 0 || buffer.byteLength < 16) {
    return buffer;
  }

  const bytes = buffer;
  const searchHeaderLimit = Math.min(bytes.length - 8, 16384);

  // Locate Segment element (0x18 0x53 0x80 0x67) if present
  let segSizeOffset = -1;
  let segVint: ReturnType<typeof readEbmlVint> = null;
  for (let i = 0; i < searchHeaderLimit; i++) {
    if (bytes[i] === 0x18 && bytes[i + 1] === 0x53 && bytes[i + 2] === 0x80 && bytes[i + 3] === 0x67) {
      segSizeOffset = i + 4;
      segVint = readEbmlVint(bytes, segSizeOffset);
      break;
    }
  }

  // Locate Segment Info element (0x15 0x49 0xA9 0x66)
  let infoIndex = -1;
  for (let i = 0; i < searchHeaderLimit; i++) {
    if (bytes[i] === 0x15 && bytes[i + 1] === 0x49 && bytes[i + 2] === 0xa9 && bytes[i + 3] === 0x66) {
      infoIndex = i;
      break;
    }
  }
  if (infoIndex === -1) return buffer;

  const infoSizeOffset = infoIndex + 4;
  const infoVint = readEbmlVint(bytes, infoSizeOffset);
  if (!infoVint) return buffer;

  const infoPayloadStart = infoSizeOffset + infoVint.width;
  const infoEnd = infoVint.isUnknown
    ? Math.min(infoPayloadStart + 512, bytes.length)
    : Math.min(infoPayloadStart + infoVint.value, bytes.length);

  // Search strictly inside Info bounds for Duration tag (0x44 0x89) and TimecodeScale (0x2A 0xD7 0xB1)
  let durationTagIndex = -1;
  let tcIndex = -1;
  for (let i = infoPayloadStart; i + 3 <= infoEnd; i++) {
    if (durationTagIndex === -1 && bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
      durationTagIndex = i;
    }
    if (tcIndex === -1 && bytes[i] === 0x2a && bytes[i + 1] === 0xd7 && bytes[i + 2] === 0xb1) {
      tcIndex = i;
    }
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  if (durationTagIndex !== -1 && durationTagIndex + 7 <= infoEnd) {
    const lenVint = readEbmlVint(bytes, durationTagIndex + 2);
    if (lenVint && lenVint.value === 4 && durationTagIndex + 2 + lenVint.width + 4 <= bytes.length) {
      view.setFloat32(durationTagIndex + 2 + lenVint.width, durationMs, false);
      return buffer;
    }
    if (lenVint && lenVint.value === 8 && durationTagIndex + 2 + lenVint.width + 8 <= bytes.length) {
      view.setFloat64(durationTagIndex + 2 + lenVint.width, durationMs, false);
      return buffer;
    }
  }

  // Missing Duration tag -> insert 11-byte [0x44, 0x89, 0x88, ...float64] right after TimecodeScale (or start of Info payload)
  let insertPos = infoPayloadStart;
  if (tcIndex !== -1 && tcIndex + 3 < infoEnd) {
    const tcLenVint = readEbmlVint(bytes, tcIndex + 3);
    if (tcLenVint && tcIndex + 3 + tcLenVint.width + tcLenVint.value <= infoEnd) {
      insertPos = tcIndex + 3 + tcLenVint.width + tcLenVint.value;
    }
  }

  if (insertPos < infoPayloadStart || insertPos > bytes.length) {
    return buffer;
  }

  const newBuf = new Uint8Array(bytes.length + 11);
  newBuf.set(bytes.subarray(0, insertPos), 0);
  newBuf[insertPos] = 0x44;
  newBuf[insertPos + 1] = 0x89;
  newBuf[insertPos + 2] = 0x88;
  new DataView(newBuf.buffer, newBuf.byteOffset, newBuf.byteLength).setFloat64(insertPos + 3, durationMs, false);
  newBuf.set(bytes.subarray(insertPos), insertPos + 11);

  if (!infoVint.isUnknown) {
    const updatedInfoOk = writeEbmlVintSameWidth(newBuf, infoSizeOffset, infoVint.width, infoVint.value + 11);
    if (!updatedInfoOk) {
      // Do not emit corrupted container sizes if fixed Info VINT cannot grow in-place
      return buffer;
    }
  }

  if (segSizeOffset !== -1 && segVint && !segVint.isUnknown) {
    writeEbmlVintSameWidth(newBuf, segSizeOffset, segVint.width, segVint.value + 11);
  }

  return newBuf;
}

/**
 * Universal Seekability Injector for MP4 / WebM
 */
export async function makeVideoSeekable(blob: Blob, durationSeconds: number): Promise<Blob> {
  if (!blob || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return blob;

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    if (
      uint8.length > 8 &&
      String.fromCharCode(uint8[4], uint8[5], uint8[6], uint8[7]) === "ftyp"
    ) {
      const patched = patchMp4Metadata(uint8, durationSeconds);
      return new Blob([patched as BlobPart], { type: blob.type || "video/mp4" });
    }

    if (
      uint8.length > 4 &&
      uint8[0] === 0x1a &&
      uint8[1] === 0x45 &&
      uint8[2] === 0xdf &&
      uint8[3] === 0xa3
    ) {
      const patched = patchWebmMetadata(uint8, durationSeconds * 1000);
      return new Blob([patched as BlobPart], { type: blob.type || "video/webm" });
    }

    return blob;
  } catch (err) {
    console.warn("Could not patch video duration metadata:", err);
    return blob;
  }
}

export async function exportMusicVideo(options: ExportVideoOptions): Promise<void> {
  const {
    audioElement,
    audioUrl,
    backgroundImageUrl,
    isVideoBg = false,
    songTitle,
    subtitles = [],
    aspectRatio,
    subtitleStyle,
    fontSize = "large",
    visualEffect = "golden-dust",
    cameraMotion = "zoom-pulse",
    subtitleTransition = "slide-up",
    enableKenBurns = true,
    subtitlePosY = 0.64,
    showTopTitle = false,
    showHookHeadline = false,
    hookHeadline = "",
    showVinylDisc = false,
    showWaveform = true,
    visualizerStyle = "bars",
    showSubtitles = true,
    trimStartTime = 0,
    trimEndTime,
    signal,
    onProgress,
    onComplete,
    onError,
  } = options;

  let audioCtx: AudioContext | null = null;
  let exportAudio: HTMLAudioElement | null = null;
  let bgVideo: HTMLVideoElement | null = null;
  let bufferSource: AudioBufferSourceNode | null = null;
  let canvasStream: MediaStream | null = null;
  let combinedStream: MediaStream | null = null;
  let destNode: MediaStreamAudioDestinationNode | null = null;
  let isRecording = true;
  let isCleanedUp = false;
  let isAborted = false;
  let animFrameId: number | null = null;
  let watchdogTimer: ReturnType<typeof setInterval> | null = null;
  let recorder: MediaRecorder | null = null;

  const cleanupResources = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    isRecording = false;

    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (watchdogTimer !== null) {
      clearInterval(watchdogTimer);
      watchdogTimer = null;
    }

    try {
      canvasStream?.getTracks().forEach((t) => t.stop());
      combinedStream?.getTracks().forEach((t) => t.stop());
      destNode?.stream.getTracks().forEach((t) => t.stop());
    } catch {}

    try {
      if (bufferSource) {
        bufferSource.onended = null;
        bufferSource.stop();
        bufferSource.disconnect();
      }
      if (exportAudio) {
        exportAudio.pause();
        exportAudio.src = "";
        exportAudio.load();
      }
      if (bgVideo) {
        bgVideo.pause();
        bgVideo.src = "";
        bgVideo.load();
      }
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    } catch {}
  };

  const handleAbort = () => {
    isAborted = true;
    isRecording = false;
    try {
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
    } catch {}
    cleanupResources();
  };

  if (signal) {
    if (signal.aborted) {
      cleanupResources();
      return;
    }
    signal.addEventListener("abort", handleAbort, { once: true });
  }

  try {
    if (typeof MediaRecorder === "undefined") {
      throw new Error("เบราว์เซอร์นี้ไม่รองรับการบันทึกวิดีโอ (MediaRecorder API) กรุณาใช้ Chrome หรือ Edge เวอร์ชันล่าสุด");
    }

    const width = aspectRatio === "9:16" ? 720 : 1280;
    const height = aspectRatio === "9:16" ? 1280 : 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    if (typeof canvas.captureStream !== "function") {
      throw new Error("เบราว์เซอร์นี้ไม่รองรับการจับภาพจาก Canvas (captureStream)");
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) throw new Error("ไม่สามารถเปิดใช้งาน 2D Canvas Context ได้");

    if (typeof document !== "undefined" && document.fonts?.ready) {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
    }

    // Load background video or image
    let bgImg: HTMLImageElement | null = null;
    const isVideo =
      isVideoBg ||
      Boolean(
        backgroundImageUrl &&
          (backgroundImageUrl.includes(".mp4") ||
            backgroundImageUrl.includes(".webm") ||
            backgroundImageUrl.startsWith("data:video/"))
      );

    if (isVideo && backgroundImageUrl) {
      bgVideo = document.createElement("video");
      if (!backgroundImageUrl.startsWith("blob:") && !backgroundImageUrl.startsWith("data:")) {
        bgVideo.crossOrigin = "anonymous";
      }
      bgVideo.src = backgroundImageUrl;
      bgVideo.muted = true;
      bgVideo.loop = true;
      bgVideo.playsInline = true;
      await new Promise<void>((resolve) => {
        bgVideo!.onloadeddata = () => resolve();
        bgVideo!.onerror = () => resolve();
        bgVideo!.load();
        setTimeout(resolve, 2500);
      });
    } else if (backgroundImageUrl) {
      bgImg = new Image();
      if (!backgroundImageUrl.startsWith("blob:") && !backgroundImageUrl.startsWith("data:")) {
        bgImg.crossOrigin = "anonymous";
      }
      const isExternal =
        backgroundImageUrl.startsWith("http://") || backgroundImageUrl.startsWith("https://");
      const safeSrc = isExternal
        ? `/api/proxy-image?url=${encodeURIComponent(backgroundImageUrl)}`
        : backgroundImageUrl;

      await new Promise<void>((resolve) => {
        bgImg!.onload = () => resolve();
        bgImg!.onerror = () => {
          const fallbackImg = new Image();
          if (!backgroundImageUrl.startsWith("blob:") && !backgroundImageUrl.startsWith("data:")) {
            fallbackImg.crossOrigin = "anonymous";
          }
          fallbackImg.onload = () => {
            bgImg = fallbackImg;
            resolve();
          };
          fallbackImg.onerror = () => resolve();
          fallbackImg.src = backgroundImageUrl;
        };
        bgImg!.src = safeSrc;
        setTimeout(resolve, 3500);
      });
    }

    if (isAborted) return;

    const audioSrc = audioUrl || audioElement?.src || audioElement?.currentSrc;
    if (!audioSrc) throw new Error("ไม่พบไฟล์เสียงสำหรับสร้างวิดีโอ");

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtx();
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    destNode = audioCtx.createMediaStreamDestination();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.connect(destNode);
    analyser.connect(audioCtx.destination);

    let audioBuffer: AudioBuffer | null = null;
    try {
      const resp = await fetch(audioSrc);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arrayBuffer = await resp.arrayBuffer();
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.warn("Direct buffer decoding failed, falling back to MediaElement:", e);
    }

    if (isAborted) return;

    const fallbackDur = Number.isFinite(audioElement?.duration) && (audioElement?.duration || 0) > 0 ? audioElement!.duration : 10;
    const fullAudioDuration = audioBuffer ? audioBuffer.duration : fallbackDur;
    const effectiveTrimStart = Math.max(0, Math.min(trimStartTime, fullAudioDuration));
    const effectiveTrimEnd =
      trimEndTime !== undefined && trimEndTime > effectiveTrimStart
        ? Math.min(trimEndTime, fullAudioDuration)
        : fullAudioDuration;
    const effectiveClipDuration = Math.max(effectiveTrimEnd - effectiveTrimStart, 0.5);

    if (audioBuffer) {
      bufferSource = audioCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(analyser);
    } else {
      exportAudio = new Audio();
      exportAudio.crossOrigin = "anonymous";
      exportAudio.src = audioSrc;
      await new Promise<void>((resolve, reject) => {
        exportAudio!.onloadedmetadata = () => resolve();
        exportAudio!.onerror = () => reject(new Error("ไม่สามารถโหลดไฟล์เสียงเพื่อเรนเดอร์ได้"));
        setTimeout(resolve, 3000);
      });
      const sourceNode = audioCtx.createMediaElementSource(exportAudio);
      sourceNode.connect(analyser);
    }

    if (isAborted) return;

    canvasStream = canvas.captureStream(30);
    combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...destNode.stream.getAudioTracks(),
    ]);

    let mimeType = "";
    let fileExtension = "mp4";
    const candidateTypes = [
      { mime: "video/mp4;codecs=avc1,mp4a.40.2", ext: "mp4" },
      { mime: "video/mp4;codecs=avc1", ext: "mp4" },
      { mime: "video/mp4", ext: "mp4" },
      { mime: "video/webm;codecs=vp8,opus", ext: "webm" },
      { mime: "video/webm;codecs=h264,opus", ext: "webm" },
      { mime: "video/webm", ext: "webm" },
    ];

    for (const c of candidateTypes) {
      if (MediaRecorder.isTypeSupported(c.mime)) {
        mimeType = c.mime;
        fileExtension = c.ext;
        break;
      }
    }
    if (!mimeType) {
      mimeType = "video/webm";
      fileExtension = "webm";
    }

    try {
      recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
        videoKeyFrameIntervalDuration: 1000,
      } as MediaRecorderOptions);
    } catch {
      recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
      });
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onerror = (event: any) => {
      cleanupResources();
      if (!isAborted && onError) {
        onError(new Error(event?.error?.message || "MediaRecorder error during video encoding"));
      }
    };

    recorder.onstop = async () => {
      cleanupResources();
      if (isAborted) return;
      const rawBlob = new Blob(chunks, { type: mimeType });
      const seekableBlob = await makeVideoSeekable(rawBlob, effectiveClipDuration);
      const downloadUrl = URL.createObjectURL(seekableBlob);
      if (onComplete) onComplete(downloadUrl, fileExtension);
    };

    const sprites = createMvSprites();
    const particles = createMvParticles(width, height, 45);
    const theme = MV_COLOR_THEMES[subtitleStyle] || MV_COLOR_THEMES["neon-yellow"];

    const vignetteGradient = ctx.createLinearGradient(0, 0, 0, height);
    vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0.30)");
    vignetteGradient.addColorStop(0.2, "rgba(0, 0, 0, 0.10)");
    vignetteGradient.addColorStop(0.55, "rgba(0, 0, 0, 0.25)");
    vignetteGradient.addColorStop(0.8, "rgba(0, 0, 0, 0.60)");
    vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.85)");

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#080912");
    bgGradient.addColorStop(0.5, "#150d24");
    bgGradient.addColorStop(1, "#040508");

    const mistGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
    mistGradient.addColorStop(0, "rgba(200, 225, 255, 0)");
    mistGradient.addColorStop(1, "rgba(180, 215, 245, 0.18)");

    let startAudioCtxTime = 0;

    const drawFrame = () => {
      if (!isRecording || isAborted) return;

      let currentTime = effectiveTrimStart;
      let clipElapsed = 0;

      if (bufferSource && audioCtx) {
        clipElapsed = Math.max(0, audioCtx.currentTime - startAudioCtxTime);
        currentTime = effectiveTrimStart + clipElapsed;

        if (clipElapsed >= effectiveClipDuration) {
          isRecording = false;
          if (recorder && recorder.state !== "inactive") recorder.stop();
          return;
        }
      } else if (exportAudio) {
        currentTime = exportAudio.currentTime;
        clipElapsed = Math.max(0, currentTime - effectiveTrimStart);

        if (exportAudio.ended || (effectiveTrimEnd > 0 && currentTime >= effectiveTrimEnd - 0.05)) {
          isRecording = false;
          if (recorder && recorder.state !== "inactive") recorder.stop();
          return;
        }
      }

      if (onProgress) {
        onProgress(Math.min(Math.round((clipElapsed / effectiveClipDuration) * 100), 100));
      }

      analyser.getByteFrequencyData(dataArray);
      const bassEnergy = (dataArray[0] + dataArray[1] + dataArray[2] + dataArray[3]) / (4 * 255);
      const progress01 = Math.min(Math.max(clipElapsed / effectiveClipDuration, 0), 1);

      const { scale, panX, panY } = computeCameraTransform(
        currentTime,
        progress01,
        bassEnergy,
        enableKenBurns,
        cameraMotion,
        width,
        height
      );

      // Keep background video playing smoothly without seeking on every frame
      if (bgVideo && bgVideo.readyState >= 2) {
        if (bgVideo.paused) bgVideo.play().catch(() => {});
        const loopDur = Number.isFinite(bgVideo.duration) && bgVideo.duration > 0 ? bgVideo.duration : 10;
        const targetBgTime = clipElapsed % loopDur;
        if (Math.abs(bgVideo.currentTime - targetBgTime) > 0.25) {
          try {
            bgVideo.currentTime = targetBgTime;
          } catch {}
        }
      }

      drawMvBackground(ctx, {
        width,
        height,
        aspectRatio,
        bgVideo,
        bgImg,
        scale,
        panX,
        panY,
        currentTime,
        showVinylDisc,
        vignetteGradient,
        bgGradient,
      });

      drawMvEffects(ctx, {
        width,
        height,
        currentTime,
        bassEnergy,
        visualEffect,
        particles,
        sprites,
        mistGradient,
        dtScale: 1,
      });

      const hasHookBanner = Boolean(showHookHeadline && hookHeadline.trim());
      if (hasHookBanner) {
        drawHookHeadlineBanner(ctx, width, height, hookHeadline, aspectRatio);
      }

      if (showTopTitle && songTitle) {
        drawTopTitleOverlay(ctx, width, height, songTitle, hasHookBanner, aspectRatio);
      }

      if (showSubtitles) {
        const activeCue = subtitles.find((c) => currentTime >= c.startTime && currentTime <= c.endTime);
        if (activeCue) {
          drawSubtitleCueOnCanvas(ctx, {
            width,
            height,
            currentTime,
            activeCue,
            subtitlePosY,
            fontSize,
            subtitleTransition,
            theme,
          });
        }
      }

      if (showWaveform) {
        drawWaveformVisualizer(
          ctx,
          width,
          height,
          dataArray,
          bufferLength,
          theme,
          visualizerStyle,
          currentTime
        );
      }

      try {
        const vTrack = canvasStream?.getVideoTracks()[0];
        if (vTrack && "requestFrame" in vTrack && typeof (vTrack as { requestFrame?: () => void }).requestFrame === "function") {
          (vTrack as { requestFrame: () => void }).requestFrame();
        }
      } catch {}
    };

    const TARGET_FPS = 30;
    const FRAME_STEP_MS = 1000 / TARGET_FPS;
    let lastRenderTime = 0;

    const renderTick = () => {
      if (!isRecording || isAborted) return;
      const now = performance.now();
      if (now - lastRenderTime >= FRAME_STEP_MS - 2) {
        lastRenderTime = now;
        drawFrame();
      }
      if (isRecording && !isAborted) {
        animFrameId = requestAnimationFrame(renderTick);
      }
    };

    watchdogTimer = setInterval(() => {
      if (!isRecording || isAborted) {
        if (watchdogTimer !== null) {
          clearInterval(watchdogTimer);
          watchdogTimer = null;
        }
        return;
      }
      const now = performance.now();
      if (now - lastRenderTime >= FRAME_STEP_MS * 1.5) {
        lastRenderTime = now;
        drawFrame();
      }
    }, 20);

    recorder.start(100);

    if (bufferSource && audioCtx) {
      startAudioCtxTime = audioCtx.currentTime;
      lastRenderTime = performance.now();
      bufferSource.start(0, effectiveTrimStart, effectiveClipDuration);
      renderTick();

      bufferSource.onended = () => {
        if (isRecording) {
          isRecording = false;
          if (recorder && recorder.state !== "inactive") recorder.stop();
        }
      };
    } else if (exportAudio) {
      if (effectiveTrimStart > 0) {
        try {
          exportAudio.currentTime = effectiveTrimStart;
        } catch {}
      }
      lastRenderTime = performance.now();
      renderTick();
      await exportAudio.play();

      exportAudio.onended = () => {
        if (isRecording) {
          isRecording = false;
          if (recorder && recorder.state !== "inactive") recorder.stop();
        }
      };
    }
  } catch (err: any) {
    console.error("Video export error:", err);
    cleanupResources();
    if (!isAborted && onError) {
      onError(err instanceof Error ? err : new Error(String(err || "Export failed")));
    }
  } finally {
    signal?.removeEventListener("abort", handleAbort);
  }
}
