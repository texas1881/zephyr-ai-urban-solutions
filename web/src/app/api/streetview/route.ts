import { NextRequest, NextResponse } from "next/server";
import { buildStreetViewUrl } from "@/services/streetViewService";

/**
 * Proxies a Google Street View Static image so the API key stays server-only.
 * GET /api/streetview?lat=41.09&lng=28.80
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { success: false, message: "lat ve lng zorunludur" },
      { status: 400 },
    );
  }

  const imageUrl = buildStreetViewUrl({ lat, lng, size: "640x400" });
  const imageRes = await fetch(imageUrl);

  if (!imageRes.ok) {
    return NextResponse.json(
      { success: false, message: "Street View görüntüsü alınamadı" },
      { status: 502 },
    );
  }

  const bytes = await imageRes.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": imageRes.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
