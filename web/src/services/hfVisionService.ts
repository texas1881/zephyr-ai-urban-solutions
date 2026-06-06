// Hugging Face vision-language situation detection (free / pay-per-use).
//
// Uses the Hugging Face router's OpenAI-compatible chat-completions endpoint
// with a multimodal model (default: Qwen3-VL-8B-Instruct, served by Novita).
// All four Street View directions are sent in a single request together with
// the shared detection prompt, and the JSON response is parsed into the same
// SituationAnalysis shape used by the Gemini engine.

import {
  parseSituationResponse,
  SITUATION_PROMPT,
  type SituationAnalysis,
} from "@/services/situationAnalysis";

const HF_ROUTER = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_MODEL = "Qwen/Qwen3-VL-8B-Instruct";

export type DirectionImageInput = {
  /** ön | arka | sağ | sol */
  label: string;
  heading: number;
  base64: string;
  mimeType: string;
};

type ChatContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

/**
 * Analyzes the four direction images with a Hugging Face multimodal model and
 * returns a structured situation report. Throws when the token is missing or
 * the request/parse fails so the caller can fall back to another engine.
 */
export async function analyzeSituationsWithHFVision(
  address: string,
  directions: DirectionImageInput[],
): Promise<SituationAnalysis> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error("HUGGINGFACE_API_TOKEN yok");
  if (directions.length === 0) throw new Error("Görsel yok");

  const model = process.env.HF_VISION_MODEL || DEFAULT_MODEL;

  const content: ChatContent[] = [
    { type: "text", text: `${SITUATION_PROMPT}\n\nAdres: ${address}` },
  ];
  for (const d of directions) {
    content.push({ type: "text", text: `Yön: ${d.label}` });
    content.push({
      type: "image_url",
      image_url: { url: `data:${d.mimeType};base64,${d.base64}` },
    });
  }

  const res = await fetch(HF_ROUTER, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content }],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    throw new Error(`HF vision ${res.status}: ${await res.text()}`);
  }

  const body = await res.json();
  const text: string | undefined = body?.choices?.[0]?.message?.content;
  if (!text) throw new Error("HF vision boş yanıt");

  return parseSituationResponse(text);
}
