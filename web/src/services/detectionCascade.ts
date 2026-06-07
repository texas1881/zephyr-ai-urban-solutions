// Multi-agent tespit: Vision → Thinking Reviewer → Arbiter → doğrulama

import { collectDirectionDetections } from "@/services/hfDetectionPipeline";
import { analyzeSituationsWithHFVision } from "@/services/hfVisionService";
import { recallMissedUrbanIssues } from "@/services/hfVisionFallback";
import { reviewWithThinkingAgent } from "@/services/hfThinkingReviewer";
import { arbitrateAnalysis } from "@/services/hfArbiterService";
import { synthesizeSituationsWithLLM } from "@/services/hfSynthesisService";
import {
  cleanSituationAnalysis,
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

  if (vlmResult.status === "fulfilled") {
    const vlmDraft = vlmResult.value;
    const consensus = await runMultiAgentConsensus(
      address,
      input,
      vlmDraft,
      directions,
    );

    if (hasFindings(consensus)) {
      return { analysis: consensus, model: "hf-multi-agent", directions };
    }

    if (hasFindings(vlmDraft)) {
      const recalled = validateSituationAnalysis(vlmDraft, RECALL_OPTS);
      if (hasFindings(recalled)) {
        return { analysis: recalled, model: "hf-multi-agent", directions };
      }
    }
  }

  if (directions.length > 0) {
    const ruleBased = synthesizeFromDetectionsRuleBased(address, directions);
    if (hasFindings(ruleBased)) {
      return { analysis: ruleBased, model: "hf-detection-llm", directions };
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
          return { analysis: reviewed, model: "hf-detection-llm", directions };
        }
        const direct = validateSituationAnalysis(synth, DETECTION_LLM_OPTS);
        if (hasFindings(direct)) {
          return { analysis: direct, model: "hf-detection-llm", directions };
        }
      } catch {
        /* kanıt yolu başarısız */
      }
    }
  }

  try {
    const recall = await recallMissedUrbanIssues(address, input);
    const recalled = validateSituationAnalysis(recall, RECALL_OPTS);
    if (hasFindings(recalled)) {
      return { analysis: recalled, model: "hf-multi-agent", directions };
    }
  } catch {
    /* son temiz */
  }

  if (vlmResult.status === "fulfilled") {
    return {
      analysis: validateSituationAnalysis(vlmResult.value, CONSENSUS_OPTS),
      model: "hf-multi-agent",
      directions,
    };
  }

  return {
    analysis: cleanSituationAnalysis(address),
    model: "hf-multi-agent",
    directions,
  };
}
