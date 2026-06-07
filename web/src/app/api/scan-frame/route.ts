import { NextRequest, NextResponse } from "next/server";
import {
  buildStreetViewUrl,
  headingToSector,
} from "@/services/streetViewService";
import { detectUrbanObjects } from "@/services/huggingFaceService";
import { isPollutionLabel } from "@/features/analyze/detectionFilters";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Tek kare anlık tarama — 360° gezinirken hızlı OWL/DETR.
 * GET /api/scan-frame?lat=&lng=&heading=
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const heading = Number(searchParams.get("heading") ?? "0");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { success: false, message: "lat ve lng zorunludur" },
      { status: 400 },
    );
  }

  try {
    const imageRes = await fetch(
      buildStreetViewUrl({
        lat,
        lng,
        heading: Number.isFinite(heading) ? heading : 0,
      }),
    );
    if (!imageRes.ok) {
      return NextResponse.json(
        { success: false, message: "Görüntü alınamadı" },
        { status: 502 },
      );
    }

    const bytes = await imageRes.arrayBuffer();
    const raw = await detectUrbanObjects(bytes);
    const detections = raw
      .filter((d) => isPollutionLabel(d.label))
      .slice(0, 12)
      .map((d) => ({
        label: d.label,
        score: Math.round(d.score * 100),
      }));

    const h = Number.isFinite(heading) ? heading : 0;
    return NextResponse.json({
      success: true,
      data: {
        heading: h,
        sector: headingToSector(h),
        detections,
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Tarama başarısız",
      },
      { status: 502 },
    );
  }
}
