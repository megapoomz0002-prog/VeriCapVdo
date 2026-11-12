import { NextRequest, NextResponse } from "next/server";

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
  try {
    const body = await req.json();
    const token = body.apiKey || process.env.GEMINI_API_KEY;

    if (!token || !token.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ยังไม่ได้กรอก API Key กรุณาระบุ Google AI Studio Key ก่อนทดสอบครับ",
        },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanToken}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok) {
        // Extract available models
        const availableModels: string[] = (data.models || []).map((m: any) =>
          (m.name || "").replace("models/", "")
        );

        // Find primary active Flash model
        const preferredModel =
          availableModels.find((m) => m.includes("gemini-2.5-flash")) ||
          availableModels.find((m) => m.includes("gemini-2.0-flash")) ||
          availableModels.find((m) => m.includes("gemini-1.5-flash")) ||
          availableModels.find((m) => m.includes("gemini-3.8-flash")) ||
          "Gemini Flash";

        return NextResponse.json({
          success: true,
          model: preferredModel,
          latencyMs,
          modelsCount: availableModels.length,
          message: `เชื่อมต่อ Google AI Studio สำเร็จ! (${preferredModel} • ตอบสนองใน ${latencyMs}ms)`,
        });
      } else {
        const errMsg = data.error?.message || "";
        let userFriendly = "ไม่สามารถเชื่อมต่อได้: กรุณาตรวจสอบ API Key ของคุณ";

        if (
          errMsg.includes("API_KEY_INVALID") ||
          errMsg.includes("API key not valid") ||
          res.status === 400
        ) {
          userFriendly = "API Key ไม่ถูกต้อง กรุณาคัดลอกคีย์ใหม่จาก Google AI Studio (aistudio.google.com)";
        } else if (errMsg.includes("PERMISSION_DENIED") || res.status === 403) {
          userFriendly = "API Key ถูกจำกัดสิทธิ์ หรือยังไม่ได้เปิดใช้งาน Generative Language API";
        } else if (errMsg.includes("RESOURCE_EXHAUSTED") || res.status === 429) {
          userFriendly = "โควต้าการใช้งานฟรีเต็มชั่วคราว กรุณารอ 1-2 นาทีแล้วลองใหม่";
        }

        return NextResponse.json(
          {
            success: false,
            error: userFriendly,
            rawError: errMsg,
          },
          { status: 400 }
        );
      }
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr.name === "AbortError") {
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
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "เกิดข้อผิดพลาดในการทดสอบ: " + (err?.message || "ไม่ทราบสาเหตุ"),
      },
      { status: 500 }
    );
  }
}
