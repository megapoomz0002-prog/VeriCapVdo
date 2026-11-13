import { NextRequest, NextResponse } from "next/server";
import { requireLicenseSession } from "@/lib/licenseSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET() {
  const hasServerKey = Boolean(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) ||
      (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim().length > 0)
  );

  return NextResponse.json({
    hasServerKey,
    message: hasServerKey
      ? "เซิร์ฟเวอร์มี GEMINI_API_KEY พร้อมใช้งานในระบบแล้ว"
      : "ยังไม่มี Server Key (ผู้ใช้สามารถระบุ API Key ฟรีจากหน้าเว็บได้)",
  });
}

export async function POST(req: NextRequest) {
  const auth = requireLicenseSession(req);
  if (!auth.ok) return auth.response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "รูปแบบคำขอ JSON ไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  try {
    const clientKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
    const serverKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    const cleanToken = clientKey || serverKey;

    if (!cleanToken) {
      return NextResponse.json(
        {
          success: false,
          error: "ยังไม่ได้กรอก API Key กรุณาระบุ Google AI Studio Key ก่อนทดสอบครับ",
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": cleanToken,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - startTime;
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const availableModels: string[] = (data.models || []).map((m: any) =>
          String(m?.name || "").replace(/^models\//, "")
        );

        const preferredModel =
          availableModels.find((m) => m.includes("gemini-3.8-flash")) ||
          availableModels.find((m) => m.includes("gemini-3.5-flash")) ||
          availableModels.find((m) => m.includes("gemini-2.5-flash")) ||
          availableModels.find((m) => m.includes("gemini-flash-latest")) ||
          "gemini-3.8-flash";

        return NextResponse.json({
          success: true,
          model: preferredModel,
          latencyMs,
          modelsCount: availableModels.length,
          message: `เชื่อมต่อ Google AI Studio สำเร็จ! (${preferredModel} • ตอบสนองใน ${latencyMs}ms)`,
        });
      }

      const errMsg = String(data?.error?.message || "");
      let userFriendly = "ไม่สามารถเชื่อมต่อได้: กรุณาตรวจสอบ API Key ของคุณ";
      let status = 400;

      if (
        errMsg.includes("API_KEY_INVALID") ||
        errMsg.includes("API key not valid") ||
        res.status === 400 ||
        res.status === 401
      ) {
        status = 401;
        userFriendly = "API Key ไม่ถูกต้อง กรุณาคัดลอกคีย์ใหม่จาก Google AI Studio (aistudio.google.com)";
      } else if (errMsg.includes("PERMISSION_DENIED") || res.status === 403) {
        status = 403;
        userFriendly = "API Key ถูกจำกัดสิทธิ์ หรือยังไม่ได้เปิดใช้งาน Generative Language API";
      } else if (errMsg.includes("RESOURCE_EXHAUSTED") || res.status === 429) {
        status = 429;
        userFriendly = "โควต้าการใช้งานฟรีเต็มชั่วคราว กรุณารอ 1-2 นาทีแล้วลองใหม่";
      }

      return NextResponse.json(
        {
          success: false,
          error: userFriendly,
        },
        { status }
      );
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr?.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            error: "การเชื่อมต่อหมดเวลา (Timeout 5s) กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
          },
          { status: 504 }
        );
      }
      throw fetchErr;
    }
  } catch (err) {
    console.error("Test Gemini connection error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "เกิดข้อผิดพลาดระหว่างทดสอบการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
      },
      { status: 500 }
    );
  }
}
