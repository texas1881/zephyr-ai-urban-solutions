import { NextRequest, NextResponse } from "next/server";
import type {
  AnalysisResult,
  ApiResponse,
  DetectedObject,
  DetectedSituation,
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
import {
  analyzeSituationsWithHFVision,
  type DirectionImageInput,
} from "@/services/hfVisionService";
import type { SituationAnalysis } from "@/services/situationAnalysis";
import { generateReport } from "@/services/reportService";
import { groupLabeled } from "@/features/analyze/labels";
import {
  recommendTeam,
  SITUATION_LABEL,
} from "@/features/analyze/situations";
import { scoreToPriority } from "@/features/detections/priority";

// Uses Buffer + external AI calls — force Node runtime and give the function
// enough headroom on Vercel to finish image fetch + inference + report.
export const runtime = "nodejs";
export const maxDuration = 60;

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

/** Groups detected situations into labelled counts for compact display. */
function situationsToItems(situations: DetectedSituation[]): LabeledCount[] {
  const counts = new Map<string, number>();
  for (const s of situations) {
    const label = SITUATION_LABEL[s.type];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count }));
}

/**
 * Analyzes a location by scanning four Street View directions
 * (front/right/back/left). Detection engine is a free Hugging Face multimodal
 * model (Qwen-VL) for precise situation detection (litter / road damage /
 * extreme dirt); falls back to Google Vision, then COCO object detection.
 * A comprehensive AI report is then generated separately (Gemini → HF → local).
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
    const directionsScanned = fetched.length || SCAN_DIRECTIONS.length;
    const baseUrl = `/api/streetview?lat=${lat}&lng=${lng}`;

    const input: DirectionImageInput[] = fetched.map((d) => ({
      label: d.label,
      heading: d.heading,
      base64: Buffer.from(d.bytes).toString("base64"),
      mimeType: d.mimeType,
    }));

    // Builds an AnalysisResult from a multimodal situation report (HF vision).
    const buildFromSituations = (sit: SituationAnalysis): AnalysisResult => {
      const litterItems = situationsToItems(sit.situations);
      const recommendedTeam = recommendTeam(sit.situations);
      const assessment =
        sit.situations.length === 0
          ? `${finalAddress} bölgesinin dört yönünde belirgin çevresel sorun tespit edilmedi; bölge temiz görünüyor.`
          : `${finalAddress} bölgesinde ${sit.situations.length} durum tespit edildi. Önerilen ekip: ${recommendedTeam}.`;
      return {
        address: finalAddress,
        lat,
        lng,
        litterCount: sit.situations.length,
        densityScore: sit.densityScore,
        priority: scoreToPriority(sit.densityScore),
        streetViewUrl: baseUrl,
        directionImages,
        litterItems,
        contextItems: [],
        objects: flatten(litterItems),
        directionsScanned,
        cleanliness: sit.cleanliness,
        assessment,
        aiReport: "",
        reportEngine: "local",
        cityOrder: "",
        aiAssessment: true,
        analysisModel: "hf-vision",
        situations: sit.situations,
        recommendedTeam,
        status: "pending",
        assignedTeam: "",
      };
    };

    let result: AnalysisResult;

    // --- Primary: Hugging Face multimodal (Qwen-VL, free) ---
    try {
      result = buildFromSituations(
        await analyzeSituationsWithHFVision(finalAddress, input),
      );
    } catch {
      // --- Fallback 1: Google Cloud Vision ---
      try {
        const visionInput: VisionImageInput[] = fetched.map((d) => ({
          label: d.label,
          heading: d.heading,
          base64: Buffer.from(d.bytes).toString("base64"),
        }));
        const vision = await analyzeImagesWithVision(finalAddress, visionInput);

        result = {
          address: finalAddress,
          lat,
          lng,
          litterCount: vision.litterItems.reduce((s, i) => s + i.count, 0),
          densityScore: vision.densityScore,
          priority: scoreToPriority(vision.densityScore),
          streetViewUrl: baseUrl,
          directionImages,
          litterItems: vision.litterItems,
          contextItems: vision.contextItems,
          objects: flatten(vision.litterItems),
          directionsScanned,
          cleanliness: vision.cleanliness,
          assessment: vision.comment,
          aiReport: "",
          reportEngine: "local",
          cityOrder: vision.cityOrder,
          aiAssessment: true,
          analysisModel: "vision",
          situations: [],
          recommendedTeam:
            vision.litterItems.length > 0 ? "Temizlik Ekibi" : "—",
          status: "pending",
          assignedTeam: "",
        };
      } catch {
        // --- Fallback 3: COCO object detection ---
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
          streetViewUrl: baseUrl,
          directionImages,
          litterItems,
          contextItems: groupLabeled(allObjects, "context"),
          objects: allObjects,
          directionsScanned,
          cleanliness,
          assessment,
          aiReport: "",
          reportEngine: "local",
          cityOrder: "",
          aiAssessment: false,
          analysisModel: "object-detection",
          situations: [],
          recommendedTeam: litterItems.length > 0 ? "Temizlik Ekibi" : "—",
          status: "pending",
          assignedTeam: "",
        };
      }
    }

    // Comprehensive AI commentary (Gemini → HF → local). Detection is already
    // done above; this only adds the human-readable report and never throws.
    const generated = await generateReport({
      address: result.address,
      cleanliness: result.cleanliness,
      densityScore: result.densityScore,
      recommendedTeam: result.recommendedTeam,
      directionsScanned: result.directionsScanned,
      situations: result.situations,
    });
    result.aiReport = generated.report;
    result.reportEngine = generated.engine;

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
