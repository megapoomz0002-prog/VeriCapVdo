import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

// Default fallback to user's dedicated VeriCapVdo Google Apps Script API endpoint
const DEFAULT_API_URL =
  process.env.LICENSE_API_URL ||
  process.env.GOOGLE_SHEETS_LICENSE_URL ||
  process.env.NEXT_PUBLIC_LICENSE_API_URL ||
  "https://script.google.com/macros/s/AKfycbwyCfv4SZXZk_dgA0enzZdXtUz8ngoE8drQokObr357dhGGgjnPXQ8wU3iMZQnJ3Sc/exec";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = (body.key || "").trim().toUpperCase().replace(/\s+/g, "");
    const deviceId = (body.deviceId || "").trim();
    const userName = (body.userName || "").trim();
    const customApiUrl = (body.apiUrl || "").trim();

    if (!key) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ License Key ก่อนตรวจสอบครับ" },
        { status: 400 }
      );
    }

    const targetUrl = customApiUrl || DEFAULT_API_URL;

    // Build URL for activation check on Google Apps Script
    const activateUrl = new URL(targetUrl);
    activateUrl.searchParams.set("action", "activate");
    activateUrl.searchParams.set("key", key);
    const mid = deviceId || (body.machineId || "").trim() || "VCV-WEB-CLIENT";
    activateUrl.searchParams.set("deviceId", mid);
    activateUrl.searchParams.set("machineId", mid);
    activateUrl.searchParams.set("machineName", "Web Browser");
    if (userName) activateUrl.searchParams.set("userName", userName);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(activateUrl.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            message: `เซิร์ฟเวอร์ Google Sheets ตอบสนองด้วยรหัสข้อผิดพลาด ${response.status}`,
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr.name === "AbortError") {
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
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการตรวจสอบคีย์: " + (err?.message || "ไม่ทราบสาเหตุ"),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = (searchParams.get("key") || "").trim();
    const customApiUrl = (searchParams.get("apiUrl") || "").trim();
    const targetUrl = customApiUrl || DEFAULT_API_URL;

    if (!key) {
      // Just check server connectivity (Ping)
      const pingUrl = new URL(targetUrl);
      pingUrl.searchParams.set("action", "ping");

      const response = await fetch(pingUrl.toString(), {
        method: "GET",
        redirect: "follow",
      });
      const data = await response.json();
      return NextResponse.json({
        online: true,
        endpoint: targetUrl,
        serverInfo: data,
      });
    }

    // Check specific key status
    const checkUrl = new URL(targetUrl);
    checkUrl.searchParams.set("action", "check");
    checkUrl.searchParams.set("key", key);

    const response = await fetch(checkUrl.toString(), {
      method: "GET",
      redirect: "follow",
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" },
      { status: 500 }
    );
  }
}
