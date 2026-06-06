// Post-model validation layer — filters false positives and recalculates scores
// from only high-confidence, corroborated detections.

import type { DetectedSituation, SafetyRisk } from "@/types/api";
import { severityRank } from "@/features/analyze/situations";
import type { SituationAnalysis } from "@/services/situationAnalysis";

/** Minimum confidence to include a detection in the final report. */
const MIN_CONFIDENCE = 0.68;

/** Low-severity findings need higher confidence to avoid noise. */
const MIN_CONFIDENCE_LOW_SEVERITY = 0.78;

const SEVERITY_WEIGHT: Record<string, number> = {
  dusuk: 8,
  orta: 18,
  yuksek: 32,
  kritik: 48,
};

function passesConfidenceGate(s: DetectedSituation): boolean {
  const min =
    s.severity === "dusuk" ? MIN_CONFIDENCE_LOW_SEVERITY : MIN_CONFIDENCE;
  if (s.confidence < min) return false;
  if (!s.description || s.description.length < 12) return false;
  return true;
}

/** Drops duplicate types, keeping the highest-confidence entry. */
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
  if (count === 0 || score < 12) return "Temiz";
  if (score >= 55) return "Kirli";
  return "Orta";
}

function riskFrom(score: number, situations: DetectedSituation[]): SafetyRisk {
  const hasCritical = situations.some(
    (s) => s.severity === "kritik" || s.severity === "yuksek",
  );
  if (hasCritical && score >= 40) return "yuksek";
  if (score >= 45) return "yuksek";
  if (score >= 22) return "orta";
  return "dusuk";
}

/**
 * Applies confidence gates, deduplication, and score recalculation so the
 * final output reflects only verified, high-precision detections.
 */
export function validateSituationAnalysis(
  raw: SituationAnalysis,
): SituationAnalysis {
  const situations = dedupeByType(
    raw.situations.filter(passesConfidenceGate),
  ).slice(0, 8);

  const densityScore = scoreFromSituations(situations);
  const cleanliness = cleanlinessFrom(densityScore, situations.length);
  const safetyRisk = riskFrom(densityScore, situations);

  const summary =
    situations.length === 0
      ? "Bölgede yüksek güven eşiğini geçen belirgin çevre sorunu tespit edilmedi; genel görünüm uygun."
      : raw.summary;

  return {
    densityScore,
    cleanliness,
    summary,
    safetyRisk,
    situations,
  };
}
