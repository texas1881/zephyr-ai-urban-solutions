import { isPollutionSituationText } from "@/features/analyze/detectionFilters";
import type { DetectedSituation, SafetyRisk } from "@/types/api";
import { severityRank, type SituationType } from "@/features/analyze/situations";
import type { SituationAnalysis } from "@/services/situationAnalysis";
import {
  enrichSituations,
  hasBinOverflowEvidence,
} from "@/services/situationEnrichment";

const DEFAULT_MIN = 0.55;
const DEFAULT_MIN_LOW = 0.62;
const MAX_SITUATIONS = 4;

/** Temizlik tipleri hassas; altyapı tipleri sıkı */
const TYPE_MIN_CONFIDENCE: Partial<Record<SituationType, number>> = {
  dolu_cop_kutusu: 0.72,
  cop_kirliligi: 0.52,
  asiri_kirli: 0.55,
  yol_hasari: 0.68,
  su_birikintisi: 0.72,
  moloz_hafriyat: 0.65,
  bozuk_tabela: 0.65,
  kaldirim_isgali: 0.62,
  yabani_ot: 0.6,
  grafiti: 0.6,
};

const SEVERITY_WEIGHT: Record<string, number> = {
  dusuk: 8,
  orta: 18,
  yuksek: 32,
  kritik: 48,
};

export type ValidationOptions = {
  minConfidence?: number;
  minLowSeverity?: number;
  maxSituations?: number;
};

function minConfidenceFor(s: DetectedSituation, base: number, minLow: number): number {
  const typeMin = TYPE_MIN_CONFIDENCE[s.type] ?? base;
  const sevMin = s.severity === "dusuk" ? minLow : base;
  return Math.max(typeMin, sevMin);
}

function passesConfidenceGate(
  s: DetectedSituation,
  minConf: number,
  minLow: number,
): boolean {
  const min = minConfidenceFor(s, minConf, minLow);
  if (s.confidence < min) return false;
  if (!s.description || s.description.length < 12) return false;
  if (!isPollutionSituationText(s.description)) return false;
  if (s.location && !isPollutionSituationText(s.location)) return false;
  if (!s.direction || s.direction.length < 2) return false;
  if (s.type === "dolu_cop_kutusu" && !hasBinOverflowEvidence(s)) return false;
  return true;
}

function dedupeByType(situations: DetectedSituation[]): DetectedSituation[] {
  const best = new Map<string, DetectedSituation>();
  for (const s of situations) {
    const prev = best.get(s.type);
    if (!prev || s.confidence > prev.confidence) best.set(s.type, s);
  }
  return [...best.values()].sort(
    (a, b) =>
      severityRank(b.severity) - severityRank(a.severity) ||
      b.confidence - a.confidence,
  );
}

function scoreFromSituations(situations: DetectedSituation[]): number {
  if (situations.length === 0) return 0;
  let raw = 0;
  for (const s of situations) {
    raw += (SEVERITY_WEIGHT[s.severity] ?? 10) * s.confidence;
  }
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function cleanlinessFrom(score: number, count: number): string {
  if (count === 0 || score < 10) return "Temiz";
  if (score >= 50) return "Kirli";
  return "Orta";
}

function riskFrom(score: number, situations: DetectedSituation[]): SafetyRisk {
  const hasCritical = situations.some(
    (s) => s.severity === "kritik" || s.severity === "yuksek",
  );
  if (hasCritical && score >= 35) return "yuksek";
  if (score >= 40) return "yuksek";
  if (score >= 18) return "orta";
  return "dusuk";
}

export function validateSituationAnalysis(
  raw: SituationAnalysis,
  opts?: ValidationOptions,
): SituationAnalysis {
  const minConf = opts?.minConfidence ?? DEFAULT_MIN;
  const minLow = opts?.minLowSeverity ?? DEFAULT_MIN_LOW;
  const maxSit = opts?.maxSituations ?? MAX_SITUATIONS;

  const situations = enrichSituations(
    dedupeByType(
      raw.situations.filter((s) =>
        passesConfidenceGate(s, minConf, minLow),
      ),
    ).slice(0, maxSit),
  );

  const densityScore = scoreFromSituations(situations);
  const cleanliness = cleanlinessFrom(densityScore, situations.length);
  const safetyRisk = riskFrom(densityScore, situations);

  const summary =
    situations.length === 0
      ? raw.situations.length > 0
        ? `${raw.summary.split(".")[0]}. Çoklu ajan doğrulaması sonrası güvenilir bulgu kalmadı.`
        : "Bölgede belirgin çevre sorunu tespit edilmedi; genel görünüm uygun."
      : raw.summary;

  return {
    densityScore,
    cleanliness,
    summary,
    safetyRisk,
    situations,
  };
}
