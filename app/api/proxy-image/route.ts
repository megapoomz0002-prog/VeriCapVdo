import { lookup } from "dns/promises";
import net from "net";
import { NextRequest, NextResponse } from "next/server";
import { requireLicenseSession } from "@/lib/licenseSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const FETCH_TIMEOUT_MS = 8000;
const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=720&h=1280&fit=crop&q=85";

function isPrivateOrBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // RFC1918 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a === 127) return true; // Loopback 127.0.0.0/8
  if (a === 169 && b === 254) return true; // Link-local / cloud metadata 169.254.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918 172.16.0.0/12
  if (a === 192 && b === 168) return true; // RFC1918 192.168.0.0/16
  if (a >= 224) return true; // Multicast & reserved
  return false;
}

function isPrivateOrBlockedIp(address: string): boolean {
  const cleaned = address.trim().toLowerCase().split("%")[0];
  const ipVersion = net.isIP(cleaned);
  if (ipVersion === 4) {
    return isPrivateOrBlockedIpv4(cleaned);
  }
  if (ipVersion === 6) {
    if (cleaned === "::" || cleaned === "::1") return true;
    if (cleaned.startsWith("fc") || cleaned.startsWith("fd")) return true; // ULA fc00::/7
    if (/^fe[89ab]/.test(cleaned)) return true; // Link-local fe80::/10
    if (cleaned.startsWith("::ffff:")) {
      const v4 = cleaned.slice("::ffff:".length);
      if (net.isIPv4(v4)) return isPrivateOrBlockedIpv4(v4);
    }
    return false;
  }
  return true;
}

async function assertPublicHttpsUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new HttpSafeError(400, "URL รูปภาพไม่ถูกต้อง");
  }

  if (parsed.protocol !== "https:") {
    throw new HttpSafeError(400, "อนุญาตเฉพาะลิงก์ HTTPS เท่านั้น");
  }

  if (parsed.username || parsed.password) {
    throw new HttpSafeError(400, "URL ไม่ได้รับอนุญาตให้มีข้อมูลรับรองตัวตน");
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new HttpSafeError(403, "ไม่อนุญาตให้เข้าถึงโฮสต์ภายในระบบ");
  }

  if (net.isIP(host) !== 0) {
    if (isPrivateOrBlockedIp(host)) {
      throw new HttpSafeError(403, "ไม่อนุญาตให้เข้าถึงหมายเลข IP ภายในระบบ");
    }
    return parsed;
  }

  let resolved: Array<{ address: string }>;
  try {
    resolved = await lookup(host, { all: true });
  } catch {
    throw new HttpSafeError(502, "ไม่สามารถค้นหาที่อยู่ปลายทางของรูปภาพได้");
  }

  if (!resolved || resolved.length === 0 || resolved.some((entry) => isPrivateOrBlockedIp(entry.address))) {
    throw new HttpSafeError(403, "ไม่อนุญาตให้เข้าถึงปลายทางเครือข่ายภายใน");
  }

  return parsed;
}

class HttpSafeError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function fetchValidatedImage(startUrl: string): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  let currentUrl = startUrl;
  for (let hop = 0; hop <= 2; hop++) {
    const validatedUrl = await assertPublicHttpsUrl(currentUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(validatedUrl.toString(), {
        headers: {
          "User-Agent": "VeriCapVdo-ImageProxy/1.0",
          Accept: "image/jpeg,image/png,image/webp,image/gif,*/*;q=0.5",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || hop === 2) {
          throw new HttpSafeError(502, "ปลายทางเปลี่ยนเส้นทางมากเกินไป");
        }
        currentUrl = new URL(location, validatedUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new HttpSafeError(502, `ไม่สามารถโหลดรูปภาพได้ (HTTP ${response.status})`);
      }

      const rawType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_IMAGE_MIME.has(rawType)) {
        throw new HttpSafeError(415, "ไฟล์ปลายทางไม่ใช่รูปภาพที่รองรับ (JPEG/PNG/WEBP/GIF)");
      }

      const contentLength = Number(response.headers.get("content-length") || "0");
      if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
        throw new HttpSafeError(413, "ขนาดรูปภาพเกินขีดจำกัด 10 MB");
      }

      const bytes = await response.arrayBuffer();
      if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
        throw new HttpSafeError(413, "ขนาดไฟล์รูปภาพไม่ถูกต้องหรือเกิน 10 MB");
      }

      return {
        bytes,
        contentType: rawType === "image/jpg" ? "image/jpeg" : rawType,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new HttpSafeError(502, "ไม่สามารถโหลดรูปภาพได้");
}

export async function GET(req: NextRequest) {
  const auth = requireLicenseSession(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const imageUrl = (searchParams.get("url") || "").trim();

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    // Reject SSRF / invalid policy errors strictly without falling back to external images
    await assertPublicHttpsUrl(imageUrl);

    try {
      const img = await fetchValidatedImage(imageUrl);
      return new NextResponse(img.bytes, {
        status: 200,
        headers: {
          "Content-Type": img.contentType,
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch (upstreamErr) {
      if (upstreamErr instanceof HttpSafeError && (upstreamErr.status === 400 || upstreamErr.status === 403)) {
        throw upstreamErr;
      }

      // Safe fallback cover when legitimate remote host fails transiently
      const fallbackImg = await fetchValidatedImage(FALLBACK_IMAGE_URL);
      return new NextResponse(fallbackImg.bytes, {
        status: 200,
        headers: {
          "Content-Type": fallbackImg.contentType,
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
          "Cache-Control": "private, max-age=300",
        },
      });
    }
  } catch (error) {
    if (error instanceof HttpSafeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Proxy image error:", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดรูปภาพจากปลายทางได้" }, { status: 502 });
  }
}
