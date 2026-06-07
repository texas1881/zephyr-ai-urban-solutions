// Deterministic situation synthesis from vision detections.

import {
  isLitterCocoLabel,
  isPollutionLabel,
  isUrbanQueryLabel,
} from "@/features/analyze/detectionFilters";
import {
  URBAN_DETECTION_QUERIES,
  type UrbanQuery,
} from "@/features/analyze/urbanQueries";
import type { DetectedSituation, SafetyRisk } from "@/types/api";
import type { SituationAnalysis } from "@/services/situationAnalysis";
import { validateSituationAnalysis } from "@/services/situationValidation";
import type { DirectionDetections, HFDetection } from "@/services/huggingFaceService";
import type { SituationType } from "@/features/analyze/situations";

const MIN_DETECTION_SCORE = 0.28;
const MIN_BIN_DETECTION_SCORE = 0.42;
const MIN_COCO_LITTER_SCORE = 0.55;
const MIN_SURFACE_RECALL_SCORE = 0.18;

const LOW_THRESHOLD_TYPES = new Set<SituationType>([
  "grafiti",
  "kaldirim_isgali",
  "moloz_hafriyat",
  "cop_kirliligi",
  "asiri_kirli",
]);

/** COCO/DETR — yalnızca sıkı atık proxy'leri */
const COCO_SITUATION: Record<string, SituationType> = {
  bottle: "cop_kirliligi",
  cup: "cop_kirliligi",
  "wine glass": "cop_kirliligi",
  bowl: "cop_kirliligi",
  can: "cop_kirliligi",
};

function matchQuery(label: string): UrbanQuery | undefined {
  const lower = label.toLowerCase().trim();
  return URBAN_DETECTION_QUERIES.find((q) => lower === q.query.toLowerCase());
}

function passesScoreGate(det: HFDetection): boolean {
  if (isUrbanQueryLabel(det.label)) {
    const q = matchQuery(det.label);
    if (q?.situationHint === "dolu_cop_kutusu") {
      return det.score >= MIN_BIN_DETECTION_SCORE;
    }
    if (q && LOW_THRESHOLD_TYPES.has(q.situationHint)) {
      return det.score >= MIN_SURFACE_RECALL_SCORE;
    }
    return det.score >= MIN_DETECTION_SCORE;
  }
  if (isLitterCocoLabel(det.label)) return det.score >= MIN_COCO_LITTER_SCORE;
  return false;
}

function matchCoco(label: string): SituationType | undefined {
  return COCO_SITUATION[label.toLowerCase().trim()];
}

function severityFromScore(score: number): DetectedSituation["severity"] {
  if (score >= 0.65) return "yuksek";
  if (score >= 0.42) return "orta";
  return "dusuk";
}

function actionFor(type: SituationType): string {
  const map: Record<SituationType, string> = {
    temiz: "—",
    cop_kirliligi: "Temizlik ekibi ile yerden atık toplama",
    asiri_kirli: "Acil temizlik ve çöp toplama operasyonu",
    dolu_cop_kutusu: "Çöp kutusu boşaltımı veya ek konteyner",
    yol_hasari: "Yol bakım ekibi ile onarım planlaması",
    moloz_hafriyat: "Moloz kaldırma ve şantiye alanı düzenleme",
    grafiti: "Yüzey temizliği veya boya/restorasyon",
    kaldirim_isgali: "Kaldırım engelinin kaldırılması",
    bozuk_tabela: "Tabela/levha onarımı veya yenileme",
    su_birikintisi: "Drenaj kontrolü ve su tahliyesi",
    yabani_ot: "Budama ve yeşil alan bakımı",
  };
  return map[type];
}

function confidenceFromDetection(
  type: SituationType,
  score: number,
): number {
  if (type === "dolu_cop_kutusu") {
    return Math.min(0.92, Math.max(0.72, score + 0.08));
  }
  if (type === "cop_kirliligi" || type === "asiri_kirli") {
    return Math.min(0.94, Math.max(0.82, score + 0.12));
  }
  return Math.min(0.92, score + 0.05);
}

function buildSituation(
  type: SituationType,
  detection: HFDetection,
  direction: string,
): DetectedSituation {
  return {
    type,
    severity:
      type === "dolu_cop_kutusu" && detection.score >= 0.5
        ? "yuksek"
        : severityFromScore(detection.score),
    confidence: confidenceFromDetection(type, detection.score),
    description: `Görüntü tanıma: "${detection.label}" (skor ${(detection.score * 100).toFixed(0)}%)`,
    location: "sokak görüntüsünde tespit edilen alan",
    recommendedAction: actionFor(type),
    direction,
  };
}

export function filterSignificantDetections(
  directions: DirectionDetections[],
): DirectionDetections[] {
  return directions.map((d) => ({
    ...d,
    detections: d.detections.filter(
      (x) => isPollutionLabel(x.label) && passesScoreGate(x),
    ),
  }));
}

export function hasSignificantDetections(directions: DirectionDetections[]): boolean {
  return directions.some((d) => d.detections.length > 0);
}

export function cleanSituationAnalysis(address: string): SituationAnalysis {
  return {
    densityScore: 0,
    cleanliness: "Temiz",
    summary: `${address} bölgesinde dört yönlü taramada belirgin çevre sorunu tespit edilmedi; genel görünüm uygun.`,
    safetyRisk: "dusuk",
    situations: [],
  };
}

export function synthesizeFromDetectionsRuleBased(
  address: string,
  directions: DirectionDetections[],
): SituationAnalysis {
  const filtered = filterSignificantDetections(directions);
  if (!hasSignificantDetections(filtered)) {
    return cleanSituationAnalysis(address);
  }

  const bestByType = new Map<string, DetectedSituation>();

  for (const dir of filtered) {
    for (const det of dir.detections) {
      const hint = matchQuery(det.label);
      const cocoType = matchCoco(det.label);
      const type = hint?.situationHint ?? cocoType;
      if (!type) continue;

      const candidate = buildSituation(type, det, dir.label);
      const prev = bestByType.get(type);
      if (!prev || candidate.confidence > prev.confidence) {
        bestByType.set(type, candidate);
      }
    }
  }

  const situations = [...bestByType.values()].sort(
    (a, b) => b.confidence - a.confidence,
  );

  if (situations.length === 0) {
    return cleanSituationAnalysis(address);
  }

  const raw: SituationAnalysis = {
    densityScore: 0,
    cleanliness: "Orta",
    summary: `${address} bölgesinde görüntü tanıma ile ${situations.length} durum tespit edildi.`,
    safetyRisk: "orta" as SafetyRisk,
    situations,
  };

  return validateSituationAnalysis(raw, {
    minConfidence: 0.42,
    minLowSeverity: 0.48,
  });
}
