import {
  parseSituationResponse,
  SITUATION_PROMPT,
  type SituationAnalysis,
} from "@/services/situationAnalysis";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type DirectionImageInput = {
  /** ön | arka | sağ | sol */
  label: string;
  heading: number;
  base64: string;
  mimeType: string;
};

export type { SituationAnalysis };

/**
 * Analyzes the four direction images directly with the Gemini multimodal
 * model and returns a structured situation report (litter / road damage /
 * extreme dirt, with severity and confidence). Throws when the API key is
 * missing or the request/parse fails so the caller can fall back.
 */
export async function analyzeSituationsWithGemini(
  address: string,
  directions: DirectionImageInput[],
): Promise<SituationAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API anahtarı yok");

  const model = process.env.GEMINI_VISION_MODEL || "gemini-2.0-flash";

  const parts: Array<Record<string, unknown>> = [
    { text: `${SITUATION_PROMPT}\n\nAdres: ${address}` },
  ];
  for (const d of directions) {
    parts.push({ text: `Yön: ${d.label}` });
    parts.push({ inline_data: { mime_type: d.mimeType, data: d.base64 } });
  }

  // API keys (AIza...) use the query param; OAuth tokens use a Bearer header.
  const isApiKey = key.startsWith("AIza");
  const url = isApiKey
    ? `${GEMINI_BASE}/${model}:generateContent?key=${key}`
    : `${GEMINI_BASE}/${model}:generateContent`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!isApiKey) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini vision ${res.status}: ${await res.text()}`);
  }

  const body = await res.json();
  const text: string | undefined =
    body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini vision boş yanıt");

  return parseSituationResponse(text);
}
