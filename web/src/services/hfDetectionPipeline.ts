// Two-stage detection pipeline:
//   1) HF zero-shot vision model (OWLv2) — image recognition
//   2) HF text LLM — structured situation synthesis

import {
  detectUrbanObjects,
  type DirectionDetections,
  type DirectionImageInput,
} from "@/services/huggingFaceService";
import { synthesizeSituationsFromDetections } from "@/services/hfSynthesisService";
import type { SituationAnalysis } from "@/services/situationAnalysis";

export type { DirectionImageInput };

/**
 * Runs urban object detection on each direction image, then passes the
 * aggregated detections to a text-only language model for the final report.
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

  return synthesizeSituationsFromDetections(address, perDirection);
}
