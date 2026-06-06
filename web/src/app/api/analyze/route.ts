import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResult, ApiResponse } from "@/types/api";
import { geocodeAddress } from "@/services/geocodeService";
import { buildStreetViewUrl } from "@/services/streetViewService";
import {
  detectObjects,
  summarizeDetections,
} from "@/services/huggingFaceService";
import { scoreToPriority } from "@/features/detections/priority";

/**
 * Analyzes a location for litter density.
 * Accepts either a free-text address or explicit coordinates:
 *   GET /api/analyze?address=Başakşehir
 *   GET /api/analyze?lat=41.09&lng=28.80
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim() ?? "";
  let lat = Number(searchParams.get("lat"));
  let lng = Number(searchParams.get("lng"));
  let formattedAddress = address;

  try {
    if (address) {
      const geo = await geocodeAddress(address);
      lat = geo.lat;
      lng = geo.lng;
      formattedAddress = geo.formattedAddress;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const error: ApiResponse<never> = {
        success: false,
        message: "Geçerli bir adres ya da lat/lng girilmelidir",
      };
      return NextResponse.json(error, { status: 400 });
    }

    const imageUrl = buildStreetViewUrl({ lat, lng });
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Street View görüntüsü alınamadı (${imageRes.status})`);
    }
    const imageBytes = await imageRes.arrayBuffer();

    const detections = await detectObjects(imageBytes);
    const summary = summarizeDetections(detections);

    const result: AnalysisResult = {
      address: formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
      litterCount: summary.litterCount,
      densityScore: summary.densityScore,
      priority: scoreToPriority(summary.densityScore),
      streetViewUrl: `/api/streetview?lat=${lat}&lng=${lng}`,
      objects: summary.rawDetections
        .slice(0, 12)
        .map((d) => ({ label: d.label, score: d.score })),
    };

    const body: ApiResponse<AnalysisResult> = { success: true, data: result };
    return NextResponse.json(body);
  } catch (err) {
    const error: ApiResponse<never> = {
      success: false,
      message: err instanceof Error ? err.message : "Analiz başarısız",
    };
    return NextResponse.json(error, { status: 502 });
  }
}
