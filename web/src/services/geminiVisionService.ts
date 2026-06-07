// Gemini Vision — HF kredisi / OWL kesintisinde yedek VLM.

import { fetchWithRetry } from "@/lib/fetchWithRetry";
import {
  parseSituationResponse,
  SITUATION_PROMPT,
  type SituationAnalysis,
} from "@/services/situationAnalysis";
import type { DirectionImageInput } from "@/services/huggingFaceService";

const DEFAULT_MODEL = "gemini-2.0-flash";

function geminiModel(): string {
  return (
    process.env.GEMINI_VISION_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    DEFAULT_MODEL
  );
}

/** GEMINI_API_KEY yoksa aynı Google projesindeki diğer anahtarları dene. */
function geminiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_VISION_API_KEY?.trim() ||
    process.env.GOOGLE_STREET_VIEW_API_KEY?.trim() ||
    null
  );
}

const MAIN_LABELS = new Set(["ön", "sağ", "arka", "sol"]);

export function isGeminiVisionEnabled(): boolean {
  return Boolean(geminiKey());
}

export async function analyzeWithGeminiVision(
  address: string,
  directions: DirectionImageInput[],
  detectionHints?: string,
): Promise<SituationAnalysis> {
  const key = geminiKey();
  if (!key) throw new Error("GEMINI_API_KEY yapılandırılmamış");

  const hintBlock = detectionHints?.trim()
    ? `\n\n${detectionHints.trim()}`
    : "";

  const parts: Array<Record<string, unknown>> = [
    {
      text: `${SITUATION_PROMPT}\n\nAdres: ${address}${hintBlock}`,
    },
  ];

  const mainDirs = directions.filter((d) => MAIN_LABELS.has(d.label));
  const scanDirs = mainDirs.length >= 4 ? mainDirs : directions.slice(0, 4);

  for (const d of scanDirs) {
    parts.push({ text: `Yön: ${d.label}` });
    parts.push({
      inlineData: {
        mimeType: d.mimeType || "image/jpeg",
        data: d.base64,
      },
    });
  }

  const model = geminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.08,
          maxOutputTokens: 2048,
        },
      }),
    },
    { retries: 1, baseDelayMs: 800 },
  );

  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429 || /depleted|RESOURCE_EXHAUSTED/i.test(detail)) {
      throw new Error(
        `GEMINI_CREDITS_EXHAUSTED: Google AI Studio kredisi tükendi (${res.status})`,
      );
    }
    throw new Error(`Gemini vision ${res.status}: ${detail.slice(0, 240)}`);
  }

  const body = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = body.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini vision boş yanıt");
  return parseSituationResponse(text);
}
