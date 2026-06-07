import { NextRequest, NextResponse } from "next/server";
import type {
  AnalysisResult,
  ApiResponse,
  DetectedObject,
  DetectedSituation,
  DirectionImage,
  LabeledCount,
  SafetyRisk,
} from "@/types/api";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { geocodeAddress } from "@/services/geocodeService";
import {
  ANALYSIS_VIEW,
  buildStreetViewUrl,
  getStreetViewSize,
  hasStreetViewImagery,
  PANORAMA_360_DIRECTIONS,
  SCAN_DIRECTIONS,
} from "@/services/streetViewService";
import {
  detectObjects,
  summarizeDetections,
} from "@/services/huggingFaceService";
import { runDetectionCascade } from "@/services/detectionCascade";
import { buildDetectionOverlays } from "@/services/detectionOverlays";
import type { DirectionImageInput } from "@/services/huggingFaceService";
import type { SituationAnalysis } from "@/services/situationAnalysis";
import { generateReport } from "@/services/reportService";
import { groupLabeled } from "@/features/analyze/labels";
import {
  recommendTeams,
  SITUATION_LABEL,
} from "@/features/analyze/situations";
import { scoreToPriority } from "@/features/detections/priority";
import { buildPipelineMeta } from "@/services/pipelineMeta";

// Uses Buffer + external AI calls — force Node runtime and give the function
// enough headroom on Vercel to finish image fetch + inference + report.
export const runtime = "nodejs";
export const maxDuration = 120;
/** GET olsa da her istek taze analiz — adres bazlı cache yanlış "Temiz" üretiyordu. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

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

/** Derives an overall safety risk band from a 0-100 density score. */
function riskFromScore(score: number): SafetyRisk {
  if (score >= 60) return "yuksek";
  if (score >= 30) return "orta";
  return "dusuk";
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
 * HF tespit: OWLv2+DETR → Qwen-VL yedek. Rapor: HF metin → yerel özet.
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
    if (!process.env.GOOGLE_STREET_VIEW_API_KEY?.trim()) {
      const error: ApiResponse<never> = {
        success: false,
        message: "GOOGLE_STREET_VIEW_API_KEY yapılandırılmamış.",
      };
      return NextResponse.json(error, { status: 503 });
    }

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

    // 360° panorama (8×45°) — modele tam çevre; UI'da 4 ana yön.
    const fetched = (
      await Promise.all(
        PANORAMA_360_DIRECTIONS.map(
          async ({ heading, label }): Promise<FetchedDirection | null> => {
            const res = await fetchWithRetry(
              buildStreetViewUrl({
                lat,
                lng,
                heading,
                fov: ANALYSIS_VIEW.fov,
                pitch: ANALYSIS_VIEW.pitch,
                source: ANALYSIS_VIEW.source,
              }),
            );
            if (!res.ok) return null;
            return {
              label,
              heading,
              bytes: await res.arrayBuffer(),
              mimeType: res.headers.get("content-type") ?? "image/jpeg",
            };
          },
        ),
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
    const directionsScanned = SCAN_DIRECTIONS.length;
    const panoramaFrames = fetched.length || PANORAMA_360_DIRECTIONS.length;
    const baseUrl = `/api/streetview?lat=${lat}&lng=${lng}`;

    const input: DirectionImageInput[] = fetched.map((d) => ({
      label: d.label,
      heading: d.heading,
      base64: Buffer.from(d.bytes).toString("base64"),
      mimeType: d.mimeType,
    }));

    const warnings: string[] = [];
    if (fetched.length < PANORAMA_360_DIRECTIONS.length) {
      warnings.push(
        `Panorama eksik: ${fetched.length}/${PANORAMA_360_DIRECTIONS.length} kare alındı.`,
      );
    }

    const buildFromSituations = (
      sit: SituationAnalysis,
      model: AnalysisResult["analysisModel"] = "hf-detection-llm",
      detectionOverlays?: AnalysisResult["detectionOverlays"],
      extra?: Partial<AnalysisResult>,
    ): AnalysisResult => {
      const litterItems = situationsToItems(sit.situations);
      const teamRec = recommendTeams(sit.situations);
      const recommendedTeam = teamRec.display;
      const assessment =
        sit.summary ||
        (sit.situations.length === 0
          ? `${finalAddress} bölgesinin dört yönünde belirgin çevresel sorun tespit edilmedi; bölge temiz görünüyor.`
          : `${finalAddress} bölgesinde ${sit.situations.length} durum tespit edildi. Önerilen ekip: ${recommendedTeam}.`);
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
        panoramaFrames,
        cleanliness: sit.cleanliness,
        assessment,
        aiReport: "",
        reportEngine: "local",
        cityOrder: "",
        aiAssessment: true,
        analysisModel: model,
        situations: sit.situations,
        safetyRisk: sit.safetyRisk,
        recommendedTeam,
        recommendedTeams: teamRec.teams,
        imageSize: getStreetViewSize(),
        detectionOverlays,
        warnings: warnings.length > 0 ? warnings : undefined,
        status: "pending",
        assignedTeam: "",
        ...extra,
      };
    };

    let result: AnalysisResult;
    let cascadeDirections: Awaited<
      ReturnType<typeof runDetectionCascade>
    >["directions"] = [];

    try {
      const { analysis, model, directions } = await runDetectionCascade(
        finalAddress,
        input,
      );
      cascadeDirections = directions;
      const overlays = buildDetectionOverlays(directions);
      result = buildFromSituations(analysis, model, overlays);
    } catch (cascadeErr) {
      console.error("[analyze] cascade failed, falling back to DETR:", cascadeErr);
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
        panoramaFrames,
        cleanliness,
        assessment:
          litterItems.length === 0
            ? `${finalAddress} bölgesinde belirgin çöp/atık tespit edilmedi.`
            : `${finalAddress} bölgesinde ${litterItems
                .slice(0, 5)
                .map((i) => `${i.label} ×${i.count}`)
                .join(", ")} tespit edildi.`,
        aiReport: "",
        reportEngine: "local",
        cityOrder: "",
        aiAssessment: false,
        analysisModel: "object-detection",
        situations: [],
        safetyRisk: riskFromScore(summary.densityScore),
        recommendedTeam: litterItems.length > 0 ? "Temizlik Ekibi" : "—",
        analysisDegraded: true,
        warnings: [
          ...(warnings.length > 0 ? warnings : []),
          "Çoklu ajan analizi başarısız — basit nesne tespitine düşüldü.",
        ],
        status: "pending",
        assignedTeam: "",
      };
    }

    // Kapsamlı rapor (HF metin → yerel). Tespitten bağımsız, hata fırlatmaz.
    const generated = await generateReport({
      address: result.address,
      cleanliness: result.cleanliness,
      densityScore: result.densityScore,
      safetyRisk: result.safetyRisk,
      recommendedTeam: result.recommendedTeam,
      directionsScanned: result.directionsScanned,
      situations: result.situations,
    });
    result.aiReport = generated.report;
    result.reportEngine = generated.engine;
    result.pipelineMeta = buildPipelineMeta(
      cascadeDirections,
      result.detectionOverlays,
      result.analysisModel,
      result.situations,
      result.cleanliness,
      result.densityScore,
      result.analysisDegraded,
    );

    const body: ApiResponse<AnalysisResult> = { success: true, data: result };
    return NextResponse.json(body, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    const error: ApiResponse<never> = {
      success: false,
      message: err instanceof Error ? err.message : "Analiz başarısız",
    };
    return NextResponse.json(error, { status: 502 });
  }
}
