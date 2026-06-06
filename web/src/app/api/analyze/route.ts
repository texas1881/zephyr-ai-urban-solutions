import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResult, ApiResponse, DetectedObject } from "@/types/api";
import { geocodeAddress } from "@/services/geocodeService";
import {
  buildStreetViewUrl,
  hasStreetViewImagery,
  SCAN_DIRECTIONS,
} from "@/services/streetViewService";
import {
  detectObjects,
  summarizeDetections,
} from "@/services/huggingFaceService";
import { generateAssessment } from "@/services/geminiService";
import { scoreToPriority } from "@/features/detections/priority";

/**
 * Analyzes a location for litter density by scanning four Street View
 * directions (front/right/back/left), then summarizing detections and
 * producing a Gemini assessment.
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
      if (!geo) {
        const error: ApiResponse<never> = {
          success: false,
          message: "Adres bulunamadı. Lütfen geçerli bir adres girin.",
        };
        return NextResponse.json(error, { status: 404 });
      }
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

    const hasImagery = await hasStreetViewImagery(lat, lng);
    if (!hasImagery) {
      const error: ApiResponse<never> = {
        success: false,
        message: "Bu konumda sokak görüntüsü bulunmuyor.",
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Scan all four directions in parallel.
    const perDirection = await Promise.all(
      SCAN_DIRECTIONS.map(async ({ heading }) => {
        const imageUrl = buildStreetViewUrl({ lat, lng, heading });
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) return [] as DetectedObject[];
        const bytes = await imageRes.arrayBuffer();
        const detections = await detectObjects(bytes);
        return detections.map((d) => ({ label: d.label, score: d.score }));
      }),
    );

    const allObjects: DetectedObject[] = perDirection.flat();
    const summary = summarizeDetections(allObjects);

    const assessment = await generateAssessment(
      formattedAddress,
      summary.densityScore,
      allObjects,
    );

    const result: AnalysisResult = {
      address: formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
      litterCount: summary.litterCount,
      densityScore: summary.densityScore,
      priority: scoreToPriority(summary.densityScore),
      streetViewUrl: `/api/streetview?lat=${lat}&lng=${lng}`,
      objects: allObjects
        .sort((a, b) => b.score - a.score)
        .slice(0, 14),
      directionsScanned: SCAN_DIRECTIONS.length,
      cleanliness: assessment.cleanliness,
      assessment: assessment.comment,
      aiAssessment: assessment.aiGenerated,
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
