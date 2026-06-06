import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";
import { buildStreetViewUrl } from "@/services/streetViewService";
import {
  detectObjects,
  summarizeDetections,
  type DetectionSummary,
} from "@/services/huggingFaceService";

/**
 * Analyzes a single location: pulls a Street View image and runs
 * Hugging Face object detection to compute a litter density score.
 *
 * GET /api/analyze?lat=41.09&lng=28.80
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const error: ApiResponse<never> = {
      success: false,
      message: "lat ve lng zorunludur",
    };
    return NextResponse.json(error, { status: 400 });
  }

  try {
    const imageUrl = buildStreetViewUrl({ lat, lng });
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Street View image fetch failed (${imageRes.status})`);
    }
    const imageBytes = await imageRes.arrayBuffer();

    const detections = await detectObjects(imageBytes);
    const summary = summarizeDetections(detections);

    const body: ApiResponse<DetectionSummary & { lat: number; lng: number }> = {
      success: true,
      data: { lat, lng, ...summary },
    };
    return NextResponse.json(body);
  } catch (err) {
    const error: ApiResponse<never> = {
      success: false,
      message: err instanceof Error ? err.message : "Analiz başarısız",
    };
    return NextResponse.json(error, { status: 502 });
  }
}
