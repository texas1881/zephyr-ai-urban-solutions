// HF-only detection cascade: OWL+DETR → Qwen-VL yedek.

import { analyzeWithDetectionPipeline } from "@/services/hfDetectionPipeline";
import { analyzeSituationsWithHFVision } from "@/services/hfVisionService";
import type { DirectionImageInput } from "@/services/huggingFaceService";
import type { SituationAnalysis } from "@/services/situationAnalysis";
import { validateSituationAnalysis } from "@/services/situationValidation";
import type { AnalysisResult } from "@/types/api";

type CascadeResult = {
  analysis: SituationAnalysis;
  model: AnalysisResult["analysisModel"];
};

function hasFindings(sit: SituationAnalysis): boolean {
  return sit.situations.length > 0 || sit.densityScore >= 18;
}

/**
 * 1) OWLv2 + DETR (kural tabanlı)
 * 2) Qwen-VL multimodal (görsel anlama yedek)
 */
export async function runDetectionCascade(
  address: string,
  input: DirectionImageInput[],
): Promise<CascadeResult> {
  const pipeline = await analyzeWithDetectionPipeline(address, input);
  if (hasFindings(pipeline)) {
    return { analysis: pipeline, model: "hf-detection-llm" };
  }

  try {
    const vlm = await analyzeSituationsWithHFVision(address, input);
    const validated = validateSituationAnalysis(vlm, {
      minConfidence: 0.55,
      minLowSeverity: 0.6,
    });
    if (hasFindings(validated)) {
      return { analysis: validated, model: "hf-vision" };
    }
  } catch {
    /* pipeline sonucunu kullan */
  }

  return { analysis: pipeline, model: "hf-detection-llm" };
}
