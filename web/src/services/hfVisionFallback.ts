// VLM fallback zinciri — 30B timeout/hata → 8B → Qwen2.5-VL-7B

import { hfChatCompletion } from "@/services/hfModelClient";
import {
  parseSituationResponse,
  SITUATION_PROMPT,
  type SituationAnalysis,
} from "@/services/situationAnalysis";
import type { DirectionImageInput } from "@/services/huggingFaceService";

const DEFAULT_PRIMARY = "Qwen/Qwen3-VL-30B-A3B-Instruct";
const DEFAULT_FALLBACK_1 = "Qwen/Qwen3-VL-8B-Instruct";
const DEFAULT_FALLBACK_2 = "Qwen/Qwen2.5-VL-7B-Instruct";

export type VlmAttempt = {
  model: string;
  ok: boolean;
  error?: string;
};

export type VlmFallbackResult = {
  analysis: SituationAnalysis;
  model: string;
  attempts: VlmAttempt[];
};

function vlmChain(): string[] {
  const chain = [
    process.env.HF_VISION_MODEL || DEFAULT_PRIMARY,
    process.env.HF_VISION_FALLBACK_MODEL || DEFAULT_FALLBACK_1,
    process.env.HF_VISION_FALLBACK_2 || DEFAULT_FALLBACK_2,
  ];
  return [...new Set(chain.filter(Boolean))];
}

function buildContent(
  address: string,
  directions: DirectionImageInput[],
  detectionHints?: string,
): Parameters<typeof hfChatCompletion>[0]["content"] {
  const hintBlock = detectionHints?.trim()
    ? `\n\n${detectionHints.trim()}`
    : "";
  const content: Parameters<typeof hfChatCompletion>[0]["content"] = [
    {
      type: "text",
      text: `${SITUATION_PROMPT}\n\nAdres: ${address}${hintBlock}`,
    },
  ];
  for (const d of directions) {
    content.push({ type: "text", text: `Yön: ${d.label}` });
    content.push({
      type: "image_url",
      image_url: { url: `data:${d.mimeType};base64,${d.base64}` },
    });
  }
  return content;
}

async function tryModel(
  model: string,
  address: string,
  directions: DirectionImageInput[],
  detectionHints?: string,
): Promise<SituationAnalysis> {
  const text = await hfChatCompletion({
    model,
    content: buildContent(address, directions, detectionHints),
    temperature: 0.08,
    maxTokens: 2048,
    timeoutMs: model.includes("30B") ? 32000 : 22000,
  });
  return parseSituationResponse(text);
}

/**
 * Sırayla VLM modellerini dener; ilk başarılı sonucu döner.
 */
export async function analyzeWithVlmFallback(
  address: string,
  directions: DirectionImageInput[],
  detectionHints?: string,
): Promise<VlmFallbackResult> {
  const attempts: VlmAttempt[] = [];
  const models = vlmChain();

  for (const model of models) {
    try {
      const analysis = await tryModel(
        model,
        address,
        directions,
        detectionHints,
      );
      attempts.push({ model, ok: true });
      return { analysis, model, attempts };
    } catch (err) {
      attempts.push({
        model,
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  throw new Error(
    `Tüm VLM modelleri başarısız: ${attempts.map((a) => a.model).join(" → ")}`,
  );
}

const RECALL_PROMPT = `Sen belediye saha denetim uzmanısın — İKİNCİ TUR (kaçan bulgular).
İlk tarama "temiz" döndü; dört ana yön görselini TEKRAR incele. Özellikle şunları ara:
- Duvarlarda grafiti, spray paint, tag, karalama
- Kaldırımda sarılmış kablo/hortum, istiflenmiş kutu, terk edilmiş malzeme
- Moloz, inşaat artığı, dağınık atık

İnsan/araç/çanta kirlilik DEĞİL. Emin olduğun bulguları raporla; en fazla 4 durum.
SADECE JSON (markdown yok) — aynı şema: densityScore, cleanliness, safetyRisk, summary, situations[].`;

const MAIN_LABELS = new Set(["ön", "sağ", "arka", "sol"]);

/** İlk tur boş döndüğünde — grafiti/işgal odaklı ikinci VLM turu. */
export async function recallMissedUrbanIssues(
  address: string,
  directions: DirectionImageInput[],
): Promise<SituationAnalysis> {
  const mainDirs = directions.filter((d) => MAIN_LABELS.has(d.label));
  const input = mainDirs.length >= 4 ? mainDirs : directions;
  const model =
    process.env.HF_VISION_FALLBACK_MODEL ||
    process.env.HF_VISION_MODEL ||
    DEFAULT_FALLBACK_1;

  const content: Parameters<typeof hfChatCompletion>[0]["content"] = [
    { type: "text", text: `${RECALL_PROMPT}\n\nAdres: ${address}` },
  ];
  for (const d of input) {
    content.push({ type: "text", text: `Yön: ${d.label}` });
    content.push({
      type: "image_url",
      image_url: { url: `data:${d.mimeType};base64,${d.base64}` },
    });
  }

  const text = await hfChatCompletion({
    model,
    content,
    temperature: 0.1,
    maxTokens: 1600,
    timeoutMs: 22000,
  });
  return parseSituationResponse(text);
}
