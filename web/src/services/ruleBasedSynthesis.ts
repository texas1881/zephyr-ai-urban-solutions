// Deterministic situation synthesis from vision detections.

import { isPollutionLabel } from "@/features/analyze/detectionFilters";
import {
  URBAN_DETECTION_QUERIES,
  type UrbanQuery,
} from "@/features/analyze/urbanQueries";
import type { DetectedSituation, SafetyRisk } from "@/types/api";
import type { SituationAnalysis } from "@/services/situationAnalysis";
import { validateSituationAnalysis } from "@/services/situationValidation";
import type { DirectionDetections, HFDetection } from "@/services/huggingFaceService";
import type { SituationType } from "@/features/analyze/situations";

const MIN_DETECTION_SCORE = 0.22;

/** COCO/DETR etiketleri → durum tipi */
const COCO_SITUATION: Record<string, SituationType> = {
  bottle: "cop_kirliligi",
  cup: "cop_kirliligi",
  "wine glass": "cop_kirliligi",
  bowl: "cop_kirliligi",
  can: "cop_kirliligi",
  banana: "cop_kirliligi",
  apple: "cop_kirliligi",
  orange: "cop_kirliligi",
  sandwich: "cop_kirliligi",
  pizza: "cop_kirliligi",
  donut: "cop_kirliligi",
  cake: "cop_kirliligi",
  fork: "cop_kirliligi",
  knife: "cop_kirliligi",
  spoon: "cop_kirliligi",
  book: "cop_kirliligi",
  handbag: "cop_kirliligi",
};

function matchQuery(label: string): UrbanQuery | undefined {
  const lower = label.toLowerCase().trim();
  return URBAN_DETECTION_QUERIES.find(
    (q) =>
      lower === q.query.toLowerCase() ||
      lower.includes(q.query.toLowerCase()) ||
      q.query.toLowerCase().includes(lower),
  );
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

function buildSituation(
  type: SituationType,
  detection: HFDetection,
  direction: string,
): DetectedSituation {
  return {
    type,
    severity: severityFromScore(detection.score),
    confidence: Math.min(0.92, detection.score + 0.05),
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
      (x) => x.score >= MIN_DETECTION_SCORE && isPollutionLabel(x.label),
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
