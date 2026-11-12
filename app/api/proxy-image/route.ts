import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    try {
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "image/jpeg";
        // If content-type is json (like an error object), do not treat as image
        if (!contentType.includes("json")) {
          const arrayBuffer = await response.arrayBuffer();
          return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
          });
        }
      }
    } catch (fetchErr) {
      console.warn("Proxy direct fetch error, using safe image fallback:", fetchErr);
    }

    // Safe fallback image: Always returns a real JPEG so canvas never fails or taints!
    const fallbackRes = await fetch(
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=720&h=1280&fit=crop&q=85"
    );
    const fallbackBuffer = await fallbackRes.arrayBuffer();

    return new NextResponse(fallbackBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("Proxy image unhandled error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
