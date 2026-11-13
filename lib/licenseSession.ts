import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const LICENSE_COOKIE_NAME = "vericap_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Server-side Google Apps Script fallback when Vercel env vars are not explicitly configured.
const FALLBACK_LICENSE_API_URL =
  "https://script.google.com/macros/s/AKfycbwyCfv4SZXZk_dgA0enzZdXtUz8ngoE8drQokObr357dhGGgjnPXQ8wU3iMZQnJ3Sc/exec";

const ALLOWED_LICENSE_HOSTS = new Set([
  "script.google.com",
  "script.googleusercontent.com",
]);

export interface SignedLicensePayload {
  licenseKey: string;
  deviceId: string;
  userName: string;
  licenseType: string;
  activatedAt: string;
  exp: number;
}

function getSigningSecret(): string {
  const configured =
    process.env.LICENSE_SESSION_SECRET ||
    process.env.LICENSE_SHARED_SECRET ||
    process.env.GEMINI_API_KEY;
  if (configured && configured.trim().length > 0) {
    return crypto.createHash("sha256").update(`vericap-session:${configured.trim()}`).digest("hex");
  }
  return crypto
    .createHash("sha256")
    .update(`vericap-default:${FALLBACK_LICENSE_API_URL}`)
    .digest("hex");
}

export function getLicenseApiUrl(): URL {
  const raw =
    (process.env.LICENSE_API_URL || process.env.GOOGLE_SHEETS_LICENSE_URL || "").trim() ||
    FALLBACK_LICENSE_API_URL;
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:" || !ALLOWED_LICENSE_HOSTS.has(parsed.hostname)) {
    throw new Error("Invalid LICENSE_API_URL host configuration");
  }
  return parsed;
}

export function getLicenseSharedSecret(): string {
  return (process.env.LICENSE_SHARED_SECRET || "").trim();
}

export function signLicenseCookie(payload: SignedLicensePayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyLicenseCookie(token: string | undefined | null): SignedLicensePayload | null {
  if (!token || typeof token !== "string") return null;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return null;

  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!encoded || !sig) return null;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getSigningSecret())
      .update(encoded)
      .digest("base64url");

    const sigBuf = Buffer.from(sig, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SignedLicensePayload;
    if (
      !decoded ||
      typeof decoded.licenseKey !== "string" ||
      !decoded.licenseKey.trim() ||
      typeof decoded.deviceId !== "string" ||
      !decoded.deviceId.trim() ||
      typeof decoded.exp !== "number" ||
      decoded.exp <= Date.now()
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function buildSignedLicensePayload(input: {
  licenseKey: string;
  deviceId: string;
  userName?: string;
  licenseType?: string;
  activatedAt?: string;
}): SignedLicensePayload {
  return {
    licenseKey: input.licenseKey.trim().toUpperCase(),
    deviceId: input.deviceId.trim().toUpperCase(),
    userName: (input.userName || "VIP Member").trim().slice(0, 80),
    licenseType: (input.licenseType || "Permanent").trim().slice(0, 40),
    activatedAt: input.activatedAt || new Date().toISOString(),
    exp: Date.now() + SESSION_TTL_MS,
  };
}

export function attachSessionCookie(res: NextResponse, payload: SignedLicensePayload): void {
  const token = signLicenseCookie(payload);
  res.cookies.set({
    name: LICENSE_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: LICENSE_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function requireLicenseSession(
  req: NextRequest
): { ok: true; session: SignedLicensePayload } | { ok: false; response: NextResponse } {
  const cookieToken = req.cookies.get(LICENSE_COOKIE_NAME)?.value;
  const session = verifyLicenseCookie(cookieToken);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "เซสชันหมดอายุหรือยังไม่ได้ยืนยันสิทธิ์ กรุณาเข้าสู่ระบบด้วย License Key ก่อนใช้งาน",
        },
        { status: 401 }
      ),
    };
  }
  return { ok: true, session };
}
