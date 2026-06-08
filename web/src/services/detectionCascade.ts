// HF tespit pipeline: OWL/DETR kanıt → kural sentezi → LLM sentez → Arbiter

import { collectDirectionDetections } from "@/services/hfDetectionPipeline";
import { AiPipelineUnavailableError } from "@/services/aiPipelineErrors";
import { arbitrateAnalysis } from "@/services/hfArbiterService";
import { synthesizeSituationsWithLLM } from "@/services/hfSynthesisService";
import {
  cleanSituationAnalysis,
  hasSignificantDetections,
  filterSignificantDetections,
  synthesizeFromDetectionsRuleBased,
} from "@/services/ruleBasedSynthesis";
import type {
  DirectionDetections,
  DirectionImageInput,
} from "@/services/huggingFaceService";
import type { SituationAnalysis } from "@/services/situationAnalysis";
import { validateSituationAnalysis } from "@/services/situationValidation";
import type { AnalysisResult } from "@/types/api";

type CascadeResult = {
  analysis: SituationAnalysis;
  model: AnalysisResult["analysisModel"];
  directions: DirectionDetections[];
  degraded?: boolean;
  pipelineWarnings?: string[];
};

const CONSENSUS_OPTS = {
  minConfidence: 0.55,
  minLowSeverity: 0.62,
  maxSituations: 4,
};

const DETECTION_LLM_OPTS = {
  minConfidence: 0.48,
  minLowSeverity: 0.5,
  maxSituations: 4,
};

function hasFindings(sit: SituationAnalysis): boolean {
  return sit.situations.length > 0;
}

function hfWarningFrom(err: unknown): string | null {
  const msg = err instanceof Error ? err.message : String(err);
  if (/HF_CREDITS_EXHAUSTED/i.test(msg)) {
    return "Hugging Face kredisi tükendi.";
  }
  if (/HF_TOKEN_FORBIDDEN/i.test(msg)) {
    return "Hugging Face token yetkisi yetersiz (Inference izni gerekli).";
  }
  if (/HF_MODEL_UNSUPPORTED/i.test(msg)) {
    return "OWL modelleri HF router üzerinde desteklenmiyor.";
  }
  return null;
}

/** Metin tabanlı Arbiter — VLM/Vision yok. */
async function runTextConsensus(
  address: string,
  draft: SituationAnalysis,
): Promise<SituationAnalysis> {
  if (!hasFindings(draft)) {
    return validateSituationAnalysis(draft, CONSENSUS_OPTS);
  }
  try {
    const arbitrated = await arbitrateAnalysis(address, draft);
    return validateSituationAnalysis(arbitrated, CONSENSUS_OPTS);
  } catch {
    return validateSituationAnalysis(draft, CONSENSUS_OPTS);
  }
}

/**
 * OWL/DETR görsel kanıt → kural sentezi → Qwen2.5 LLM sentez → Arbiter.
 */
export async function runDetectionCascade(
  address: string,
  input: DirectionImageInput[],
): Promise<CascadeResult> {
  const pipelineWarnings: string[] = [];
  let directions: DirectionDetections[] = [];

  try {
    directions = await collectDirectionDetections(input);
  } catch (err) {
    const w = hfWarningFrom(err);
    if (w) pipelineWarnings.push(w);
    else {
      pipelineWarnings.push(
        err instanceof Error ? err.message.slice(0, 140) : "OWL/DETR taraması başarısız",
      );
    }
  }

  if (directions.length > 0) {
    const ruleBased = synthesizeFromDetectionsRuleBased(address, directions);
    if (hasFindings(ruleBased)) {
      const final = await runTextConsensus(address, ruleBased);
      return {
        analysis: final,
        model: "hf-detection-llm",
        directions,
        pipelineWarnings: pipelineWarnings.length ? pipelineWarnings : undefined,
      };
    }

    const filtered = filterSignificantDetections(directions);
    if (hasSignificantDetections(filtered)) {
      try {
        const synth = await synthesizeSituationsWithLLM(address, filtered);
        const reviewed = await runTextConsensus(address, synth);
        if (hasFindings(reviewed)) {
          return {
            analysis: reviewed,
            model: "hf-detection-llm",
            directions,
            pipelineWarnings: pipelineWarnings.length ? pipelineWarnings : undefined,
          };
        }
        const direct = validateSituationAnalysis(synth, DETECTION_LLM_OPTS);
        if (hasFindings(direct)) {
          return {
            analysis: direct,
            model: "hf-detection-llm",
            directions,
            pipelineWarnings: pipelineWarnings.length ? pipelineWarnings : undefined,
          };
        }
      } catch (err) {
        const w = hfWarningFrom(err);
        if (w) pipelineWarnings.push(w);
      }
    }

    return {
      analysis: cleanSituationAnalysis(address),
      model: "hf-detection-llm",
      directions,
      pipelineWarnings: pipelineWarnings.length ? pipelineWarnings : undefined,
    };
  }

  let message =
    "Hugging Face tespit pipeline'ı çalışamadı — sahte 'Temiz' sonuç üretilmedi.";
  if (pipelineWarnings.some((w) => /kredisi tükendi|yetkisi yetersiz/i.test(w))) {
    message =
      "Hugging Face kullanılamıyor (kredi tükendi veya token yetkisi yetersiz). huggingface.co/settings/tokens üzerinden Inference yetkili token oluşturun.";
  }
  if (pipelineWarnings.length > 0) {
    message += ` Detay: ${pipelineWarnings.join(" ")}`;
  }

  throw new AiPipelineUnavailableError(message);
}
