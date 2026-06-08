// Multi-agent tespit: Vision → Thinking Reviewer → Arbiter → doğrulama

import { collectDirectionDetections } from "@/services/hfDetectionPipeline";
import { analyzeSituationsWithHFVision } from "@/services/hfVisionService";
import { recallMissedUrbanIssues } from "@/services/hfVisionFallback";
import { AiPipelineUnavailableError } from "@/services/aiPipelineErrors";
import { reviewWithThinkingAgent } from "@/services/hfThinkingReviewer";
import { arbitrateAnalysis } from "@/services/hfArbiterService";
import { synthesizeSituationsWithLLM } from "@/services/hfSynthesisService";
import {
  hasSignificantDetections,
  filterSignificantDetections,
  synthesizeFromDetectionsRuleBased,
} from "@/services/ruleBasedSynthesis";
import { formatDetectionHints } from "@/services/detectionHints";
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
  /** Kanıt katmanı — UI bounding box overlay için */
  directions: DirectionDetections[];
  degraded?: boolean;
  pipelineWarnings?: string[];
};

const CONSENSUS_OPTS = {
  minConfidence: 0.55,
  minLowSeverity: 0.62,
  maxSituations: 4,
};

/** Thinking ajanı aşırı reddettiğinde VLM taslağını geri çağır. */
const RECALL_OPTS = {
  minConfidence: 0.56,
  minLowSeverity: 0.54,
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

async function runMultiAgentConsensus(
  address: string,
  input: DirectionImageInput[],
  draft: SituationAnalysis,
  detectionDirs: Awaited<ReturnType<typeof collectDirectionDetections>>,
): Promise<SituationAnalysis> {
  let current = draft;

  if (hasFindings(current)) {
    try {
      current = await reviewWithThinkingAgent(
        address,
        input,
        current,
        detectionDirs,
      );
    } catch {
      /* taslak ile devam */
    }
  }

  if (hasFindings(current)) {
    try {
      current = await arbitrateAnalysis(address, current);
    } catch {
      /* reviewer çıktısı ile devam */
    }
  }

  return validateSituationAnalysis(current, CONSENSUS_OPTS);
}

/**
 * Agent 1 — Vision (Qwen-VL): ilk tespit
 * Agent 2 — Thinking (Qwen-VL-Thinking): görsel doğrulama
 * Agent 3 — Arbiter (Qwen2.5): tutarlılık + ekip uyumu
 * Yedek — OWL/DETR kanıt + LLM sentez
 */
export async function runDetectionCascade(
  address: string,
  input: DirectionImageInput[],
): Promise<CascadeResult> {
  const directionsPromise = collectDirectionDetections(input);
  const vlmPromise = directionsPromise.then((dirs) =>
    analyzeSituationsWithHFVision(
      address,
      input,
      dirs.length > 0 ? formatDetectionHints(dirs) : undefined,
    ),
  );

  const [directionsResult, vlmResult] = await Promise.allSettled([
    directionsPromise,
    vlmPromise,
  ]);

  const directions =
    directionsResult.status === "fulfilled" ? directionsResult.value : [];
  const pipelineWarnings: string[] = [];

  if (directionsResult.status === "rejected") {
    const msg = directionsResult.reason instanceof Error
      ? directionsResult.reason.message
      : "OWL/DETR taraması başarısız";
    if (/HF_CREDITS_EXHAUSTED/i.test(msg)) {
      pipelineWarnings.push(
        "Hugging Face kredisi tükendi — görsel kanıt katmanı devre dışı.",
      );
    } else if (/HF_MODEL_UNSUPPORTED/i.test(msg)) {
      pipelineWarnings.push(
        "OWL modelleri HF router üzerinde desteklenmiyor — yalnızca VLM kullanılıyor.",
      );
    }
  }

  if (vlmResult.status === "rejected") {
    const msg = vlmResult.reason instanceof Error
      ? vlmResult.reason.message
      : "VLM başarısız";
    if (/HF_CREDITS_EXHAUSTED/i.test(msg)) {
      pipelineWarnings.push("Hugging Face VLM kredisi tükendi.");
    } else if (/HF_TOKEN_FORBIDDEN/i.test(msg)) {
      pipelineWarnings.push(
        "Hugging Face token yetkisi yetersiz (Inference izni gerekli).",
      );
    } else {
      pipelineWarnings.push(`VLM hatası: ${msg.slice(0, 140)}`);
    }
  }

  if (vlmResult.status === "fulfilled") {
    const vlmDraft = vlmResult.value;
    const consensus = await runMultiAgentConsensus(
      address,
      input,
      vlmDraft,
      directions,
    );

    if (hasFindings(consensus)) {
      return {
        analysis: consensus,
        model: "hf-multi-agent",
        directions,
        pipelineWarnings: pipelineWarnings.length ? pipelineWarnings : undefined,
      };
    }

    if (hasFindings(vlmDraft)) {
      const recalled = validateSituationAnalysis(vlmDraft, RECALL_OPTS);
      if (hasFindings(recalled)) {
        return {
          analysis: recalled,
          model: "hf-multi-agent",
          directions,
          pipelineWarnings: pipelineWarnings.length ? pipelineWarnings : undefined,
        };
      }
    }
  }

  if (directions.length > 0) {
    const ruleBased = synthesizeFromDetectionsRuleBased(address, directions);
    if (hasFindings(ruleBased)) {
      return {
        analysis: ruleBased,
        model: "hf-detection-llm",
        directions,
        pipelineWarnings: pipelineWarnings.length ? pipelineWarnings : undefined,
      };
    }

    const filtered = filterSignificantDetections(directions);
    if (hasSignificantDetections(filtered)) {
      try {
        const synth = await synthesizeSituationsWithLLM(address, filtered);
        const reviewed = await runMultiAgentConsensus(
          address,
          input,
          synth,
          directions,
        );
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
      } catch {
        /* kanıt yolu başarısız */
      }
    }
  }

  if (vlmResult.status === "fulfilled") {
    try {
      const recall = await recallMissedUrbanIssues(address, input);
      const recalled = validateSituationAnalysis(recall, RECALL_OPTS);
      if (hasFindings(recalled)) {
        return {
          analysis: recalled,
          model: "hf-multi-agent",
          directions,
          pipelineWarnings: pipelineWarnings.length ? pipelineWarnings : undefined,
        };
      }
    } catch {
      /* HF recall başarısız */
    }
  }

  if (vlmResult.status === "fulfilled") {
    return {
      analysis: validateSituationAnalysis(vlmResult.value, CONSENSUS_OPTS),
      model: "hf-multi-agent",
      directions,
      pipelineWarnings: pipelineWarnings.length ? pipelineWarnings : undefined,
    };
  }

  let message =
    "Hugging Face analiz pipeline'ı çalışamadı — sahte 'Temiz' sonuç üretilmedi.";
  if (pipelineWarnings.some((w) => /kredisi tükendi|403|yetki/i.test(w))) {
    message =
      "Hugging Face kullanılamıyor (kredi tükendi veya token yetkisi yetersiz). huggingface.co/settings/tokens üzerinden Inference yetkili token oluşturun.";
  }

  if (pipelineWarnings.length > 0) {
    message += ` Detay: ${pipelineWarnings.join(" ")}`;
  }

  throw new AiPipelineUnavailableError(message);
}
