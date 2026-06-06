// Two-stage detection pipeline:
//   1) HF zero-shot vision model (OWLv2) — image recognition
//   2) Rule-based synthesis (grounded) — LLM yalnızca özet için, durumlar kanıta dayalı

import {
  detectUrbanObjects,
  type DirectionDetections,
  type DirectionImageInput,
} from "@/services/huggingFaceService";
import {
  cleanSituationAnalysis,
  filterSignificantDetections,
  hasSignificantDetections,
  synthesizeFromDetectionsRuleBased,
} from "@/services/ruleBasedSynthesis";
import type { SituationAnalysis } from "@/services/situationAnalysis";

export type { DirectionImageInput };

/**
 * Runs urban object detection on each direction, then builds the situation
 * report deterministically from vision evidence (no LLM hallucination).
 */
export async function analyzeWithDetectionPipeline(
  address: string,
  directions: DirectionImageInput[],
): Promise<SituationAnalysis> {
  if (directions.length === 0) throw new Error("Görsel yok");

  const perDirection: DirectionDetections[] = await Promise.all(
    directions.map(async (d) => {
      const bytes = Buffer.from(d.base64, "base64");
      const detections = await detectUrbanObjects(bytes.buffer);
      return {
        label: d.label,
        heading: d.heading,
        detections,
      };
    }),
  );

  const filtered = filterSignificantDetections(perDirection);
  if (!hasSignificantDetections(filtered)) {
    return cleanSituationAnalysis(address);
  }

  return synthesizeFromDetectionsRuleBased(address, filtered);
}
