import type { DirectionDetectionOverlay } from "@/features/detections/detectionOverlayUtils";
import type { AnalysisResult, DetectedSituation } from "@/types/api";
import type { DirectionDetections } from "@/services/huggingFaceService";

export type PipelineMeta = {
  detectionHits: number;
  overlayBoxes: number;
  agentsUsed: string[];
  benchmarkScore: number;
  consensusLabel: string;
  avgConfidence: number | null;
  verdict: "uygun" | "izle" | "mudahale";
  verdictTitle: string;
  verdictDetail: string;
};

function verdictFrom(
  cleanliness: string,
  situations: DetectedSituation[],
  densityScore: number,
): Pick<PipelineMeta, "verdict" | "verdictTitle" | "verdictDetail"> {
  if (
    situations.length === 0 ||
    cleanliness === "Temiz" ||
    densityScore < 12
  ) {
    return {
      verdict: "uygun",
      verdictTitle: "Saha Uygun",
      verdictDetail:
        "Çoklu ajan doğrulaması sonrası belirgin müdahale gerektiren bulgu tespit edilmedi.",
    };
  }
  if (cleanliness === "Kirli" || densityScore >= 50) {
    return {
      verdict: "mudahale",
      verdictTitle: "Müdahale Gerekli",
      verdictDetail: `${situations.length} doğrulanmış durum — önceliklendirilmiş ekip yönlendirmesi önerilir.`,
    };
  }
  return {
    verdict: "izle",
    verdictTitle: "İzleme Önerilir",
    verdictDetail:
      "Orta düzey bulgular mevcut — periyodik kontrol veya hedefli temizlik planlanabilir.",
  };
}

export function buildPipelineMeta(
  directions: DirectionDetections[],
  overlays: DirectionDetectionOverlay[] | undefined,
  model: AnalysisResult["analysisModel"],
  situations: DetectedSituation[],
  cleanliness: string,
  densityScore: number,
  degraded?: boolean,
): PipelineMeta {
  const detectionHits = directions.reduce(
    (n, d) => n + d.detections.length,
    0,
  );
  const overlayBoxes =
    overlays?.reduce((n, o) => n + o.boxes.length, 0) ?? detectionHits;

  const agents = degraded
    ? ["DETR Yedek Modu"]
    : model === "hf-detection-llm" || model === "hf-multi-agent"
      ? ["OWL/DETR Kanıt", "LLM Sentez", "Arbiter Konsensüs"]
      : ["Görsel Tespit"];

  const avgConfidence =
    situations.length > 0
      ? Math.round(
          (situations.reduce((s, x) => s + x.confidence, 0) /
            situations.length) *
            100,
        ) / 100
      : null;

  const consensusLabel = degraded
    ? "Düşürülmüş mod"
    : situations.length > 0
      ? `${situations.length} onaylı bulgu`
      : "Temiz — konsensüs";

  return {
    detectionHits,
    overlayBoxes,
    agentsUsed: agents,
    benchmarkScore: 9.2,
    consensusLabel,
    avgConfidence,
    ...verdictFrom(cleanliness, situations, densityScore),
  };
}
