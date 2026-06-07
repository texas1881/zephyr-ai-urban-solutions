// Multi-agent tespit: Vision → Thinking Reviewer → Arbiter → doğrulama

import { collectDirectionDetections } from "@/services/hfDetectionPipeline";
import { analyzeSituationsWithHFVision } from "@/services/hfVisionService";
import { recallMissedUrbanIssues } from "@/services/hfVisionFallback";
import {
  analyzeWithGeminiVision,
  isGeminiVisionEnabled,
} from "@/services/geminiVisionService";
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

  if (isGeminiVisionEnabled()) {
    try {
      const hints =
        directions.length > 0 ? formatDetectionHints(directions) : undefined;
      const gemini = await analyzeWithGeminiVision(address, input, hints);
      const validated = validateSituationAnalysis(gemini, RECALL_OPTS);
      pipelineWarnings.push(
        "Hugging Face kullanılamadı — Gemini Vision yedek motoru devrede.",
      );
      return {
        analysis: validated,
        model: "gemini-vision",
        directions,
        degraded: true,
        pipelineWarnings,
      };
    } catch (geminiErr) {
      const msg =
        geminiErr instanceof Error ? geminiErr.message : "Gemini başarısız";
      if (/GEMINI_CREDITS_EXHAUSTED/i.test(msg)) {
        pipelineWarnings.push("Google AI Studio (Gemini) kredisi tükendi.");
      } else {
        pipelineWarnings.push(`Gemini yedek analizi başarısız: ${msg.slice(0, 120)}`);
      }
    }
  } else {
    pipelineWarnings.push(
      "Gemini yedek motoru için API anahtarı bulunamadı (GEMINI_API_KEY veya Google API key).",
    );
  }

  const hfDown = pipelineWarnings.some((w) =>
    /Hugging Face|HF|OWL|desteklenmiyor/i.test(w),
  );
  const geminiDown = pipelineWarnings.some((w) =>
    /Gemini|Google AI/i.test(w),
  );

  let message =
    "Yapay zekâ analizi şu an çalışmıyor — sahte 'Temiz' sonuç üretilmedi.";
  if (hfDown && geminiDown) {
    message =
      "Hem Hugging Face hem Google Gemini kredisi/limiti tükendi. HF: huggingface.co/settings/billing · Gemini: ai.studio/projects — kredi yükledikten sonra tekrar deneyin.";
  } else if (geminiDown) {
    message =
      "Google Gemini kredisi tükendi veya API anahtarı geçersiz. ai.studio/projects üzerinden kredi yükleyin.";
  } else if (hfDown) {
    message =
      "Hugging Face kredisi tükendi. huggingface.co/settings/billing üzerinden kredi yükleyin veya GEMINI_API_KEY tanımlayın.";
  }

  if (pipelineWarnings.length > 0) {
    message += ` Detay: ${pipelineWarnings.join(" ")}`;
  }

  throw new AiPipelineUnavailableError(message);
}
