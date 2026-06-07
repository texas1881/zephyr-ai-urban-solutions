// Hugging Face vision-language situation detection (free / pay-per-use).
//
// Uses the Hugging Face router's OpenAI-compatible chat-completions endpoint
// with a multimodal model (default: Qwen3-VL-8B-Instruct, served by Novita).
// All four Street View directions are sent in a single request together with
// the shared detection prompt, and the JSON response is parsed into the same
// Parses into the shared SituationAnalysis contract.

import { analyzeWithVlmFallback } from "@/services/hfVisionFallback";
import type { SituationAnalysis } from "@/services/situationAnalysis";

export type DirectionImageInput = {
  /** ön | arka | sağ | sol */
  label: string;
  heading: number;
  base64: string;
  mimeType: string;
};

export type VisionAnalysisMeta = {
  vlmModel: string;
  vlmAttempts: Array<{ model: string; ok: boolean; error?: string }>;
};

/**
 * VLM fallback zinciri ile dört yön analizi.
 * 30B → 8B → Qwen2.5-VL-7B sırasıyla dener.
 */
export async function analyzeSituationsWithHFVision(
  address: string,
  directions: DirectionImageInput[],
  detectionHints?: string,
): Promise<SituationAnalysis> {
  if (directions.length === 0) throw new Error("Görsel yok");
  const result = await analyzeWithVlmFallback(
    address,
    directions,
    detectionHints,
  );
  return result.analysis;
}

export async function analyzeSituationsWithHFVisionMeta(
  address: string,
  directions: DirectionImageInput[],
  detectionHints?: string,
): Promise<SituationAnalysis & { _meta: VisionAnalysisMeta }> {
  const result = await analyzeWithVlmFallback(
    address,
    directions,
    detectionHints,
  );
  return {
    ...result.analysis,
    _meta: { vlmModel: result.model, vlmAttempts: result.attempts },
  };
}
