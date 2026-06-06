import { NextRequest, NextResponse } from "next/server";
import type {
  AnalysisResult,
  ApiResponse,
  DetectedObject,
  DirectionImage,
  LabeledCount,
} from "@/types/api";
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
import {
  analyzeImagesWithVision,
  type VisionImageInput,
} from "@/services/visionService";
import { groupLabeled } from "@/features/analyze/labels";
import { scoreToPriority } from "@/features/detections/priority";

type FetchedDirection = {
  label: string;
  heading: number;
  bytes: ArrayBuffer;
  mimeType: string;
};

/** Expands labelled counts into a flat object list (for record statistics). */
function flatten(items: LabeledCount[]): DetectedObject[] {
  const out: DetectedObject[] = [];
  for (const it of items) {
    for (let i = 0; i < it.count; i++) out.push({ label: it.label, score: 1 });
  }
  return out;
}

/**
 * Analyzes a location by scanning four Street View directions
 * (front/right/back/left). Primary engine is the Gemini vision model
 * (precise litter/order analysis directly on the imagery); falls back to
 * COCO object detection when Gemini is unavailable.
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

    if (!(await hasStreetViewImagery(lat, lng))) {
      const error: ApiResponse<never> = {
        success: false,
        message: "Bu konumda sokak görüntüsü bulunmuyor.",
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Fetch all four direction images in parallel.
    const fetched = (
      await Promise.all(
        SCAN_DIRECTIONS.map(async ({ heading, label }): Promise<FetchedDirection | null> => {
          const res = await fetch(buildStreetViewUrl({ lat, lng, heading }));
          if (!res.ok) return null;
          return {
            label,
            heading,
            bytes: await res.arrayBuffer(),
            mimeType: res.headers.get("content-type") ?? "image/jpeg",
          };
        }),
      )
    ).filter((d): d is FetchedDirection => d !== null);

    const directionImages: DirectionImage[] = SCAN_DIRECTIONS.map(
      ({ heading, label }) => ({
        label,
        heading,
        url: `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}`,
      }),
    );

    const finalAddress =
      formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    let result: AnalysisResult;

    // --- Primary: Google Cloud Vision (comprehensive image analysis) ---
    try {
      const visionInput: VisionImageInput[] = fetched.map((d) => ({
        label: d.label,
        heading: d.heading,
        base64: Buffer.from(d.bytes).toString("base64"),
      }));

      const vision = await analyzeImagesWithVision(finalAddress, visionInput);
      const objects = flatten(vision.litterItems);

      result = {
        address: finalAddress,
        lat,
        lng,
        litterCount: vision.litterItems.reduce((s, i) => s + i.count, 0),
        densityScore: vision.densityScore,
        priority: scoreToPriority(vision.densityScore),
        streetViewUrl: `/api/streetview?lat=${lat}&lng=${lng}`,
        directionImages,
        litterItems: vision.litterItems,
        contextItems: vision.contextItems,
        objects,
        directionsScanned: fetched.length || SCAN_DIRECTIONS.length,
        cleanliness: vision.cleanliness,
        assessment: vision.comment,
        cityOrder: vision.cityOrder,
        aiAssessment: true,
        analysisModel: "vision",
      };
    } catch {
      // --- Fallback: COCO object detection ---
      const perDirection = await Promise.all(
        fetched.map((d) => detectObjects(d.bytes)),
      );
      const allObjects: DetectedObject[] = perDirection
        .flat()
        .map((d) => ({ label: d.label, score: d.score }));
      const summary = summarizeDetections(allObjects);
      const litterItems = groupLabeled(allObjects, "litter");
      const cleanliness =
        summary.densityScore >= 60
          ? "Kirli"
          : summary.densityScore >= 25
            ? "Orta"
            : "Temiz";
      const assessment =
        litterItems.length === 0
          ? `${finalAddress} bölgesinde belirgin çöp/atık tespit edilmedi; bölge temiz görünüyor.`
          : `${finalAddress} bölgesinde ${litterItems
              .slice(0, 5)
              .map((i) => `${i.label} ×${i.count}`)
              .join(", ")} tespit edildi. Temizlik durumu: ${cleanliness}.`;

      result = {
        address: finalAddress,
        lat,
        lng,
        litterCount: summary.litterCount,
        densityScore: summary.densityScore,
        priority: scoreToPriority(summary.densityScore),
        streetViewUrl: `/api/streetview?lat=${lat}&lng=${lng}`,
        directionImages,
        litterItems,
        contextItems: groupLabeled(allObjects, "context"),
        objects: allObjects,
        directionsScanned: fetched.length || SCAN_DIRECTIONS.length,
        cleanliness,
        assessment,
        cityOrder: "",
        aiAssessment: false,
        analysisModel: "object-detection",
      };
    }

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
