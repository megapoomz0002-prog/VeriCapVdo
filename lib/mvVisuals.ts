import { SubtitleCue, balanceThaiLyric } from "./srtParser";

export type SubtitleColorTheme =
  | "neon-yellow"
  | "cyber-cyan"
  | "pure-white"
  | "sunset-gold"
  | "ruby-red";

export type MVVisualEffect =
  | "bokeh-glow"
  | "golden-hour"
  | "rain-drops"
  | "stage-spotlight"
  | "cyber-neon"
  | "vintage-film"
  | "snow-drift"
  | "golden-dust"
  | "sunbeam"
  | "lantern-glow"
  | "gentle-rain"
  | "none";

export type MVCameraMotion =
  | "organic-breath"
  | "slow-zoom-in"
  | "slow-pan"
  | "beat-pulse"
  | "zoom-pulse"
  | "pan-drift"
  | "dramatic-pulse"
  | "static";

export interface MVParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  alpha: number;
  baseAlpha: number;
}

export interface MvSprites {
  warmBokeh: HTMLCanvasElement;
  coolBokeh: HTMLCanvasElement;
  goldenEmbers: HTMLCanvasElement;
}

export interface ColorThemeSpec {
  primary: string;
  glow: string;
}

export const MV_COLOR_THEMES: Record<SubtitleColorTheme, ColorThemeSpec> = {
  "neon-yellow": { primary: "#facc15", glow: "rgba(250, 204, 21, 0.9)" },
  "cyber-cyan": { primary: "#22d3ee", glow: "rgba(34, 211, 238, 0.9)" },
  "sunset-gold": { primary: "#fbbf24", glow: "rgba(251, 191, 36, 0.9)" },
  "ruby-red": { primary: "#f43f5e", glow: "rgba(244, 63, 94, 0.9)" },
  "pure-white": { primary: "#ffffff", glow: "rgba(255, 255, 255, 0.65)" },
};

export function createRadialSprite(
  size: number,
  innerColor: string,
  midColor: string
): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const sCtx = sprite.getContext("2d");
  if (sCtx) {
    const center = size / 2;
    const g = sCtx.createRadialGradient(center, center, 0, center, center, center);
    g.addColorStop(0, innerColor);
    g.addColorStop(0.4, midColor);
    g.addColorStop(1, "rgba(0,0,0,0)");
    sCtx.fillStyle = g;
    sCtx.fillRect(0, 0, size, size);
  }
  return sprite;
}

export function createMvSprites(): MvSprites {
  return {
    warmBokeh: createRadialSprite(64, "rgba(255, 215, 120, 0.95)", "rgba(255, 180, 70, 0.4)"),
    coolBokeh: createRadialSprite(64, "rgba(180, 230, 255, 0.95)", "rgba(100, 180, 255, 0.4)"),
    goldenEmbers: createRadialSprite(32, "rgba(255, 230, 150, 1.0)", "rgba(255, 170, 60, 0.4)"),
  };
}

export function createMvParticles(width: number, height: number, count = 45): MVParticle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2.8 + 1.2,
    speedY: -(Math.random() * 0.7 + 0.25),
    speedX: (Math.random() - 0.5) * 0.5,
    alpha: Math.random() * 0.7 + 0.3,
    baseAlpha: Math.random() * 0.6 + 0.3,
  }));
}

export function computeCameraTransform(
  currentTime: number,
  progress01: number,
  bassEnergy: number,
  enableKenBurns: boolean,
  cameraMotion: MVCameraMotion,
  width: number,
  height: number
): { scale: number; panX: number; panY: number } {
  if (!enableKenBurns || cameraMotion === "static") {
    return { scale: 1.0, panX: 0, panY: 0 };
  }

  const cycle = (2 * Math.PI) / 3.3;
  const clampedProgress = Math.min(Math.max(progress01, 0), 1);
  const smoothProgress = 0.5 - 0.5 * Math.cos(clampedProgress * Math.PI);
  const bassPulse = bassEnergy * 0.015;

  switch (cameraMotion) {
    case "organic-breath":
    case "zoom-pulse":
      return {
        scale: 1.03 + 0.02 * Math.sin(currentTime * cycle) + bassPulse,
        panX: 0,
        panY: -height * 0.005 * Math.sin(currentTime * cycle),
      };
    case "slow-zoom-in":
      return {
        scale: 1.01 + 0.08 * smoothProgress + bassPulse,
        panX: 0,
        panY: -height * 0.012 * smoothProgress,
      };
    case "slow-pan":
    case "pan-drift":
      return {
        scale: 1.04 + bassPulse,
        panX: width * 0.025 * Math.sin(currentTime * 0.22),
        panY: -height * 0.006,
      };
    case "beat-pulse":
    case "dramatic-pulse": {
      const pulseWave = Math.pow(Math.max(Math.sin(currentTime * 2.8), 0), 3);
      return {
        scale: 1.03 + 0.02 * pulseWave + bassEnergy * 0.035,
        panX: 0,
        panY: -height * 0.006 - height * 0.004 * pulseWave,
      };
    }
    default:
      return { scale: 1.0, panX: 0, panY: 0 };
  }
}

export function drawVinylDisc(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  discRadius: number,
  angle: number,
  accentColor = "#e11d48",
  globalAlpha = 1
) {
  ctx.save();
  ctx.globalAlpha = globalAlpha;
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#111115";
  ctx.beginPath();
  ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 1;
  const ringStep = Math.max(4, Math.round(discRadius * 0.04));
  for (let r = discRadius * 0.45; r < discRadius * 0.95; r += ringStep) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(0, 0, discRadius * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(0, 0, discRadius * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawMvBackground(
  ctx: CanvasRenderingContext2D,
  opts: {
    width: number;
    height: number;
    aspectRatio: "9:16" | "16:9";
    bgVideo: HTMLVideoElement | null;
    bgImg: HTMLImageElement | null;
    scale: number;
    panX: number;
    panY: number;
    currentTime: number;
    showVinylDisc: boolean;
    vignetteGradient: CanvasGradient;
    bgGradient: CanvasGradient;
  }
) {
  const {
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
  } = opts;

  if (bgVideo && bgVideo.readyState >= 2) {
    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    const vW = bgVideo.videoWidth || 16;
    const vH = bgVideo.videoHeight || 9;
    const vAspect = vW / vH;
    const canvasAspect = width / height;
    let sx = 0,
      sy = 0,
      sw = vW,
      sh = vH;

    if (vAspect > canvasAspect) {
      sw = vH * canvasAspect;
      sx = (vW - sw) / 2;
    } else {
      sh = vW / canvasAspect;
      sy = (vH - sh) / 2;
    }

    ctx.drawImage(bgVideo, sx, sy, sw, sh, 0, 0, width, height);
    ctx.restore();

    if (showVinylDisc) {
      const discRadius = aspectRatio === "9:16" ? width * 0.16 : height * 0.14;
      const discX = aspectRatio === "9:16" ? width * 0.8 : width * 0.88;
      const discY = aspectRatio === "9:16" ? height * 0.34 : height * 0.25;
      drawVinylDisc(ctx, discX, discY, discRadius, currentTime * 1.8, "#f43f5e", 0.88);
    }

    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    const imgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
    const canvasAspect = width / height;

    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // Handle portrait (< 0.85) or square (<= 1.05) covers on 16:9 widescreen with floating cover + vinyl disc
    if (aspectRatio === "16:9" && imgAspect <= 1.05) {
      let sx = 0,
        sy = 0,
        sw = bgImg.naturalWidth,
        sh = bgImg.naturalHeight;
      if (imgAspect > canvasAspect) {
        sw = bgImg.naturalHeight * canvasAspect;
        sx = (bgImg.naturalWidth - sw) / 2;
      } else {
        sh = bgImg.naturalWidth / canvasAspect;
        sy = (bgImg.naturalHeight - sh) / 2;
      }
      ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
      ctx.fillRect(0, 0, width, height);

      const coverH = height * 0.78;
      const coverW = coverH * imgAspect;
      const coverX = showVinylDisc ? width * 0.38 - coverW / 2 : (width - coverW) / 2;
      const coverY = (height - coverH) / 2;

      if (showVinylDisc) {
        const discRadius = coverH * 0.45;
        const discCenterX = coverX + coverW * 0.84;
        const discCenterY = coverY + coverH * 0.5;
        drawVinylDisc(ctx, discCenterX, discCenterY, discRadius, currentTime * 1.8, "#e11d48", 0.96);
      }

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(coverX, coverY, coverW, coverH, 14);
      else ctx.rect(coverX, coverY, coverW, coverH);
      ctx.clip();
      ctx.drawImage(bgImg, coverX, coverY, coverW, coverH);
      ctx.restore();
    } else {
      let sx = 0,
        sy = 0,
        sw = bgImg.naturalWidth,
        sh = bgImg.naturalHeight;
      if (imgAspect > canvasAspect) {
        sw = bgImg.naturalHeight * canvasAspect;
        sx = (bgImg.naturalWidth - sw) / 2;
      } else {
        sh = bgImg.naturalWidth / canvasAspect;
        sy = (bgImg.naturalHeight - sh) / 2;
      }
      ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height);
    }
    ctx.restore();

    // Draw 9:16 vinyl disc outside the zoom transform so it never crops off screen
    if (showVinylDisc && (aspectRatio === "9:16" || imgAspect > 1.05)) {
      const discRadius = aspectRatio === "9:16" ? width * 0.17 : height * 0.14;
      const discCenterX = aspectRatio === "9:16" ? width * 0.79 : width * 0.88;
      const discCenterY = aspectRatio === "9:16" ? height * 0.34 : height * 0.25;
      drawVinylDisc(ctx, discCenterX, discCenterY, discRadius, currentTime * 1.8, "#f43f5e", 0.9);
    }

    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  if (showVinylDisc) {
    const discRadius = aspectRatio === "9:16" ? width * 0.17 : height * 0.15;
    drawVinylDisc(ctx, width * 0.78, height * 0.34, discRadius, currentTime * 1.8, "#f43f5e", 0.85);
  }
}

export function drawMvEffects(
  ctx: CanvasRenderingContext2D,
  opts: {
    width: number;
    height: number;
    currentTime: number;
    bassEnergy: number;
    visualEffect: MVVisualEffect;
    particles: MVParticle[];
    sprites: MvSprites;
    mistGradient: CanvasGradient;
    dtScale?: number;
  }
) {
  const {
    width,
    height,
    currentTime,
    bassEnergy,
    visualEffect,
    particles,
    sprites,
    mistGradient,
    dtScale = 1,
  } = opts;

  if (visualEffect === "none") return;

  if (visualEffect === "bokeh-glow" || visualEffect === "lantern-glow") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY * (1 + bassEnergy * 0.4) * dtScale;
      p.x += Math.sin(currentTime * 0.8 + i) * 0.4 * dtScale;
      if (p.y < -30) p.y = height + 30;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      const alpha = p.alpha * (0.6 + 0.35 * Math.sin(currentTime * 2 + i) + bassEnergy * 0.3);
      const bRad = p.radius * 3.5;
      const sprite = i % 2 === 0 ? sprites.warmBokeh : sprites.coolBokeh;
      ctx.globalAlpha = Math.min(Math.max(alpha, 0), 1);
      ctx.drawImage(sprite, p.x - bRad, p.y - bRad, bRad * 2, bRad * 2);
    }
    ctx.restore();
    return;
  }

  if (visualEffect === "golden-hour" || visualEffect === "golden-dust" || visualEffect === "sunbeam") {
    ctx.save();
    const pulse = 0.14 + 0.05 * Math.sin(currentTime * 1.8) + bassEnergy * 0.1;
    const sunGrad = ctx.createRadialGradient(width * 0.5, 0, 10, width * 0.5, height * 0.25, width * 0.8);
    sunGrad.addColorStop(0, `rgba(255, 220, 130, ${Math.min(pulse * 1.4, 0.45)})`);
    sunGrad.addColorStop(1, "rgba(255, 190, 90, 0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height * 0.55);

    for (const p of particles) {
      p.y += p.speedY * (1 + bassEnergy * 0.3) * dtScale;
      p.x += Math.sin(currentTime * 1.2 + p.radius) * 0.35 * dtScale;
      if (p.y < -10) p.y = height + 10;
      const flicker = p.alpha * (0.7 + 0.25 * Math.sin(currentTime * 3 + p.radius));
      const eRad = p.radius * 2.2;
      ctx.globalAlpha = Math.min(Math.max(flicker, 0), 0.95);
      ctx.drawImage(sprites.goldenEmbers, p.x - eRad, p.y - eRad, eRad * 2, eRad * 2);
    }
    ctx.restore();
    return;
  }

  if (visualEffect === "rain-drops" || visualEffect === "gentle-rain") {
    ctx.save();
    ctx.strokeStyle = "rgba(210, 235, 255, 0.38)";
    ctx.lineWidth = 1.8;
    for (const p of particles) {
      p.y += (p.speedY * 6 + 16) * dtScale;
      p.x -= 2.8 * dtScale;
      if (p.y > height) p.y = -20;
      if (p.x < 0) p.x = width + 20;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 6, p.y + 26);
      ctx.stroke();
    }
    ctx.fillStyle = mistGradient;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    ctx.restore();
    return;
  }

  if (visualEffect === "stage-spotlight") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const beamX = width * 0.5 + width * 0.35 * Math.sin(currentTime * 0.85);
    const beamGrad = ctx.createRadialGradient(beamX, 0, 10, beamX, height * 0.5, width * 0.65);
    beamGrad.addColorStop(0, "rgba(255, 245, 220, 0.35)");
    beamGrad.addColorStop(0.3, "rgba(140, 210, 255, 0.20)");
    beamGrad.addColorStop(1, "rgba(80, 150, 255, 0)");
    ctx.fillStyle = beamGrad;
    ctx.fillRect(0, 0, width, height);

    for (const p of particles) {
      p.y += p.speedY * 0.8 * dtScale;
      if (p.y < -10) p.y = height + 10;
      ctx.fillStyle = `rgba(220, 240, 255, ${p.alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (visualEffect === "cyber-neon") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const neonPulse = 0.16 + 0.06 * Math.sin(currentTime * 2.2) + bassEnergy * 0.12;

    const cyanGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, width * 0.65);
    cyanGrad.addColorStop(0, `rgba(34, 211, 238, ${neonPulse * 1.5})`);
    cyanGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = cyanGrad;
    ctx.fillRect(0, 0, width, height);

    const magGrad = ctx.createRadialGradient(width, height, 10, width, height, width * 0.65);
    magGrad.addColorStop(0, `rgba(236, 72, 153, ${neonPulse * 1.5})`);
    magGrad.addColorStop(1, "rgba(236, 72, 153, 0)");
    ctx.fillStyle = magGrad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY * 1.2 * dtScale;
      if (p.y < -10) p.y = height + 10;
      const cColor = i % 2 === 0 ? "34, 211, 238" : "244, 114, 182";
      ctx.fillStyle = `rgba(${cColor}, ${p.alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (visualEffect === "vintage-film") {
    ctx.save();
    ctx.fillStyle = "rgba(255, 180, 70, 0.06)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    for (let i = 0; i < 8; i++) {
      const gx = Math.random() * width;
      const gy = Math.random() * height;
      ctx.fillRect(gx, gy, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
    ctx.restore();
    return;
  }

  if (visualEffect === "snow-drift") {
    ctx.save();
    for (const p of particles) {
      p.y += (Math.abs(p.speedY) * 2 + 1.2) * dtScale;
      p.x += Math.sin(currentTime * 1.2 + p.radius) * 0.8 * dtScale;
      if (p.y > height) p.y = -10;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.85})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawTopTitleOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  songTitle: string,
  hasHookBanner: boolean,
  aspectRatio: "9:16" | "16:9"
) {
  if (!songTitle.trim()) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";

  let titleFontSize = Math.round(width * (aspectRatio === "9:16" ? 0.044 : 0.028));
  ctx.font = `900 ${titleFontSize}px 'Noto Sans Thai', 'Kanit', sans-serif`;
  const maxTitleWidth = width * 0.86;
  const initialTitleWidth = ctx.measureText(songTitle).width;
  if (initialTitleWidth > maxTitleWidth) {
    titleFontSize = Math.max(Math.floor(titleFontSize * (maxTitleWidth / initialTitleWidth)), 18);
    ctx.font = `900 ${titleFontSize}px 'Noto Sans Thai', 'Kanit', sans-serif`;
  }

  const titleY = hasHookBanner
    ? aspectRatio === "9:16"
      ? height * 0.165
      : height * 0.145
    : aspectRatio === "9:16"
      ? height * 0.08
      : height * 0.06;

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.lineWidth = Math.max(4, Math.round(titleFontSize * 0.18));
  ctx.strokeStyle = "#000000";
  ctx.strokeText(songTitle, width / 2, titleY);
  ctx.fillText(songTitle, width / 2, titleY);
  ctx.restore();
}

export function drawHookHeadlineBanner(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hookHeadline: string,
  aspectRatio: "9:16" | "16:9"
) {
  const cleanHook = hookHeadline.trim();
  if (!cleanHook) return;

  const displayText = /^[\u{1F300}-\u{1FAFF}🔥]/u.test(cleanHook) ? cleanHook : `🔥 ${cleanHook}`;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const bannerY = aspectRatio === "9:16" ? height * 0.115 : height * 0.075;
  let bannerFontSize = Math.round(aspectRatio === "9:16" ? width * 0.029 : width * 0.019);
  ctx.font = `900 ${bannerFontSize}px 'Noto Sans Thai', 'Kanit', sans-serif`;
  const maxBannerW = width * 0.88;
  let textWidth = ctx.measureText(displayText).width;

  if (textWidth > maxBannerW - 40) {
    bannerFontSize = Math.max(Math.floor(bannerFontSize * ((maxBannerW - 40) / textWidth)), 13);
    ctx.font = `900 ${bannerFontSize}px 'Noto Sans Thai', 'Kanit', sans-serif`;
    textWidth = ctx.measureText(displayText).width;
  }

  const pillW = Math.min(textWidth + 42, width * 0.92);
  const pillH = bannerFontSize * 1.9;
  const pillX = (width - pillW) / 2;
  const pillY = bannerY - pillH / 2;

  const hookGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH);
  hookGrad.addColorStop(0, "rgba(245, 158, 11, 0.95)");
  hookGrad.addColorStop(0.5, "rgba(234, 88, 12, 0.95)");
  hookGrad.addColorStop(1, "rgba(225, 29, 72, 0.95)");

  ctx.fillStyle = hookGrad;
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  else ctx.rect(pillX, pillY, pillW, pillH);
  ctx.fill();

  ctx.strokeStyle = "rgba(253, 224, 71, 0.65)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 6;
  ctx.fillText(displayText, width / 2, bannerY);
  ctx.restore();
}

export function drawSubtitleCueOnCanvas(
  ctx: CanvasRenderingContext2D,
  opts: {
    width: number;
    height: number;
    currentTime: number;
    activeCue: SubtitleCue;
    subtitlePosY: number;
    fontSize: "normal" | "large" | "mega";
    subtitleTransition: "slide-up" | "bounce-pop" | "glow-fade";
    theme: ColorThemeSpec;
  }
) {
  const { width, height, currentTime, activeCue, subtitlePosY, fontSize, subtitleTransition, theme } = opts;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  const baseScale = width / 720;
  let lyricFontSize = Math.round((fontSize === "mega" ? 52 : fontSize === "normal" ? 36 : 44) * Math.min(baseScale, 1.18));
  const maxLyricWidth = width * 0.88;

  let lines = balanceThaiLyric(activeCue.text);
  if (lines.length === 0) lines = [activeCue.text];

  ctx.font = `900 ${lyricFontSize}px 'Noto Sans Thai', 'Kanit', sans-serif`;
  for (let i = 0; i < lines.length; i++) {
    const w = ctx.measureText(lines[i]).width;
    if (w > maxLyricWidth) {
      lyricFontSize = Math.max(Math.floor(lyricFontSize * (maxLyricWidth / w)), 22);
      ctx.font = `900 ${lyricFontSize}px 'Noto Sans Thai', 'Kanit', sans-serif`;
    }
  }

  const cueProgress = currentTime - activeCue.startTime;
  const cueRemaining = activeCue.endTime - currentTime;
  let cueAlpha = 1.0;
  let cueOffsetY = 0;
  let cueScale = 1.0;
  let cueBlur = 0;

  if (cueProgress < 0.28) {
    const t = Math.max(cueProgress / 0.28, 0);
    cueAlpha = t;
    if (subtitleTransition === "slide-up") {
      cueOffsetY = (1 - t) * 12;
    } else if (subtitleTransition === "bounce-pop") {
      cueScale = 0.88 + 0.12 * Math.sin((t * Math.PI) / 2);
    } else if (subtitleTransition === "glow-fade") {
      cueBlur = (1 - t) * 4;
      cueScale = 0.96 + 0.04 * t;
    }
  } else if (cueRemaining < 0.2) {
    cueAlpha = Math.max(cueRemaining / 0.2, 0);
  }

  const centerY = height * subtitlePosY + cueOffsetY;
  const lineHeight = lyricFontSize * 1.32;
  const totalBlockHeight = lines.length * lineHeight;
  const startY = centerY - totalBlockHeight / 2 + lineHeight / 2;

  const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const pillWidth = Math.min(maxLineWidth + 44, width * 0.94);
  const pillHeight = totalBlockHeight + 18;
  const pillX = (width - pillWidth) / 2;
  const pillY = centerY - pillHeight / 2;

  ctx.globalAlpha = cueAlpha;
  if (cueBlur > 0.2 && "filter" in ctx) {
    ctx.filter = `blur(${cueBlur.toFixed(1)}px)`;
  }
  if (cueScale !== 1.0) {
    ctx.translate(width / 2, centerY);
    ctx.scale(cueScale, cueScale);
    ctx.translate(-width / 2, -centerY);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 16);
  else ctx.rect(pillX, pillY, pillWidth, pillHeight);
  ctx.fill();

  const cueDuration = Math.max(activeCue.endTime - activeCue.startTime, 0.2);
  const progressRatio = Math.min(Math.max(cueProgress / cueDuration, 0), 1);
  const progW = Math.max((pillWidth - 24) * progressRatio, 4);
  ctx.fillStyle = theme.primary;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(pillX + 12, pillY + pillHeight - 4, progW, 3, 1.5);
  else ctx.rect(pillX + 12, pillY + pillHeight - 4, progW, 3);
  ctx.fill();

  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 8;
  ctx.lineWidth = Math.max(Math.round(lyricFontSize * 0.22), 7);
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = theme.primary;

  lines.forEach((lineText, idx) => {
    const y = startY + idx * lineHeight;
    ctx.strokeText(lineText, width / 2, y);
    ctx.fillText(lineText, width / 2, y);
  });

  if ("filter" in ctx) ctx.filter = "none";
  ctx.restore();
}

export function drawWaveformVisualizer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dataArray: Uint8Array,
  bufferLength: number,
  theme: ColorThemeSpec,
  style: "bars" | "wave" | "circle" = "bars",
  currentTime = 0
) {
  ctx.save();
  ctx.fillStyle = theme.primary;
  ctx.strokeStyle = theme.primary;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 12;

  const baseY = height * 0.85;

  if (style === "wave") {
    const spanW = width * 0.72;
    const startX = (width - spanW) / 2;
    const samples = 36;
    ctx.lineWidth = Math.max(3, width * 0.0045);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const idx = Math.min(Math.floor((i / samples) * bufferLength), bufferLength - 1);
      const val = (dataArray[idx] || 0) / 255;
      const offset = Math.sin(currentTime * 6 + i * 0.55) * (6 + val * 26);
      const x = startX + (i / samples) * spanW;
      const y = baseY + offset;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (style === "circle") {
    const centerX = width * 0.5;
    const centerY = height * 0.82;
    const innerR = Math.min(width, height) * 0.045;
    const spokeCount = 28;
    ctx.lineWidth = Math.max(2.5, width * 0.004);
    ctx.lineCap = "round";
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const val = (dataArray[i % bufferLength] || 0) / 255;
      const len = innerR + 6 + val * innerR * 0.8;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
      ctx.lineTo(centerX + Math.cos(angle) * len, centerY + Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Default "bars"
  const barCount = 24;
  const totalBarWidth = width * 0.7;
  const barWidth = Math.max(3, totalBarWidth / barCount - 4);
  const startX = (width - totalBarWidth) / 2;

  for (let i = 0; i < barCount; i++) {
    const val = (dataArray[i % bufferLength] || 0) / 255;
    const barHeight = Math.max(val * (height * 0.045 + 12), 4);
    const x = startX + i * (barWidth + 4);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, baseY - barHeight / 2, barWidth, barHeight, 3);
    } else {
      ctx.rect(x, baseY - barHeight / 2, barWidth, barHeight);
    }
    ctx.fill();
  }
  ctx.restore();
}
