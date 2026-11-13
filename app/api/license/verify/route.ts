import { NextRequest, NextResponse } from "next/server";
import {
  attachSessionCookie,
  buildSignedLicensePayload,
  clearSessionCookie,
  getLicenseApiUrl,
  getLicenseSharedSecret,
  LICENSE_COOKIE_NAME,
  verifyLicenseCookie,
} from "@/lib/licenseSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

async function fetchGoogleSheetsApi(url: URL, timeoutMs = 12000): Promise<{ ok: boolean; status: number; data: any }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const sharedSecret = getLicenseSharedSecret();
    if (sharedSecret) {
      url.searchParams.set("secret", sharedSecret);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "รูปแบบคำขอ JSON ไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  try {
    const key = typeof body?.key === "string" ? body.key.trim().toUpperCase().replace(/\s+/g, "") : "";
    const deviceId =
      typeof body?.deviceId === "string"
        ? body.deviceId.trim().toUpperCase().slice(0, 120)
        : typeof body?.machineId === "string"
          ? body.machineId.trim().toUpperCase().slice(0, 120)
          : "";
    const userName = typeof body?.userName === "string" ? body.userName.trim().slice(0, 80) : "";

    if (!key || key.length < 6 || key.length > 64) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ License Key ให้ถูกต้องก่อนตรวจสอบครับ" },
        { status: 400 }
      );
    }

    if (!deviceId || deviceId === "VCV-WEB-CLIENT" || deviceId.length < 6) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสอุปกรณ์ที่ถูกต้อง กรุณารีเฟรชหน้าเว็บแล้วลองใหม่ครับ" },
        { status: 400 }
      );
    }

    const activateUrl = getLicenseApiUrl();
    activateUrl.searchParams.set("action", "activate");
    activateUrl.searchParams.set("key", key);
    activateUrl.searchParams.set("deviceId", deviceId);
    activateUrl.searchParams.set("machineId", deviceId);
    activateUrl.searchParams.set("machineName", "Web Browser");
    if (userName) activateUrl.searchParams.set("userName", userName);

    try {
      const result = await fetchGoogleSheetsApi(activateUrl, 12000);

      if (!result.ok || !result.data || typeof result.data !== "object") {
        return NextResponse.json(
          {
            success: false,
            message: `เซิร์ฟเวอร์ตรวจสอบสิทธิ์ตอบสนองด้วยข้อผิดพลาด (${result.status})`,
          },
          { status: result.status >= 400 ? result.status : 502 }
        );
      }

      if (result.data.success === true) {
        const payload = buildSignedLicensePayload({
          licenseKey: String(result.data.licenseKey || key),
          deviceId,
          userName: String(result.data.userName || userName || "VIP Member"),
          licenseType: String(result.data.licenseType || "Permanent"),
        });

        const res = NextResponse.json({
          success: true,
          message: result.data.message || "เปิดใช้งานสิทธิ์เข้าใช้งานสำเร็จเรียบร้อยแล้ว!",
          licenseKey: payload.licenseKey,
          userName: payload.userName,
          licenseType: payload.licenseType,
          activatedAt: payload.activatedAt,
          deviceId: payload.deviceId,
        });
        attachSessionCookie(res, payload);
        return res;
      }

      const failRes = NextResponse.json(
        {
          success: false,
          revoked: true,
          message:
            result.data.message ||
            "ไม่พบ License Key นี้ในระบบ Google Sheets หรือคีย์ถูกใช้งานบนเครื่องอื่นแล้ว",
        },
        { status: 403 }
      );
      clearSessionCookie(failRes);
      return failRes;
    } catch (fetchErr: any) {
      if (fetchErr?.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            message: "การเชื่อมต่อไปยัง Google Sheets หมดเวลา (Timeout 12s) กรุณาลองใหม่อีกครั้ง",
          },
          { status: 504 }
        );
      }
      throw fetchErr;
    }
  } catch (err) {
    console.error("License verify POST error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาลองใหม่อีกครั้ง",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = (searchParams.get("action") || "").trim().toLowerCase();

    if (action === "session") {
      const cookieToken = req.cookies.get(LICENSE_COOKIE_NAME)?.value;
      const session = verifyLicenseCookie(cookieToken);
      if (!session) {
        return NextResponse.json({ authenticated: false, session: null }, { status: 200 });
      }

      const recheck = searchParams.get("recheck") === "1";
      if (!recheck) {
        return NextResponse.json({
          authenticated: true,
          session: {
            licenseKey: session.licenseKey,
            userName: session.userName,
            licenseType: session.licenseType,
            activatedAt: session.activatedAt,
            deviceId: session.deviceId,
          },
        });
      }

      // Remote check against Google Sheets to catch revoked keys or device mismatches
      try {
        const checkUrl = getLicenseApiUrl();
        checkUrl.searchParams.set("action", "check");
        checkUrl.searchParams.set("key", session.licenseKey);

        const upstream = await fetchGoogleSheetsApi(checkUrl, 10000);
        if (!upstream.ok || !upstream.data || typeof upstream.data !== "object") {
          // Transient upstream issue: keep verified session temporarily rather than locking out user offline
          return NextResponse.json({
            authenticated: true,
            recheckSkipped: true,
            session: {
              licenseKey: session.licenseKey,
              userName: session.userName,
              licenseType: session.licenseType,
              activatedAt: session.activatedAt,
              deviceId: session.deviceId,
            },
          });
        }

        const boundDevice = String(upstream.data.boundDeviceId || "").trim().toUpperCase();
        const deviceConflict = boundDevice.length > 0 && boundDevice !== session.deviceId;
        if (upstream.data.success !== true || deviceConflict) {
          const invalidRes = NextResponse.json({
            authenticated: false,
            revoked: true,
            message: deviceConflict
              ? "License Key นี้ถูกเปลี่ยนไปใช้งานบนอุปกรณ์อื่นแล้ว"
              : upstream.data.message || "License Key ถูกระงับหรือไม่พบในระบบ",
            session: null,
          });
          clearSessionCookie(invalidRes);
          return invalidRes;
        }

        return NextResponse.json({
          authenticated: true,
          rechecked: true,
          session: {
            licenseKey: session.licenseKey,
            userName: String(upstream.data.userName || session.userName || "VIP Member"),
            licenseType: session.licenseType,
            activatedAt: session.activatedAt,
            deviceId: session.deviceId,
          },
        });
      } catch {
        return NextResponse.json({
          authenticated: true,
          recheckSkipped: true,
          session: {
            licenseKey: session.licenseKey,
            userName: session.userName,
            licenseType: session.licenseType,
            activatedAt: session.activatedAt,
            deviceId: session.deviceId,
          },
        });
      }
    }

    // Default / Ping healthcheck without leaking internal endpoint URL or license records
    const pingUrl = getLicenseApiUrl();
    pingUrl.searchParams.set("action", "ping");
    const pingResult = await fetchGoogleSheetsApi(pingUrl, 8000);
    return NextResponse.json({
      online: Boolean(pingResult.ok && pingResult.data?.success),
      message: pingResult.data?.message || "License service status checked",
    });
  } catch (err) {
    console.error("License verify GET error:", err);
    return NextResponse.json(
      { online: false, success: false, message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ตรวจสอบสิทธิ์ได้" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true, message: "ออกจากระบบเรียบร้อยแล้ว" });
  clearSessionCookie(res);
  return res;
}
