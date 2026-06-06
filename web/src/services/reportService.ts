// Comprehensive natural-language field report generator.
//
// Detection is handled by the vision engine; THIS module only produces the
// human-readable commentary/report. Gemini is used as the primary commentary
// engine (per product decision), with a Hugging Face text model fallback and a
// final local heuristic so the report never blocks the response.

import type { DetectedSituation } from "@/types/api";
import { SITUATION_LABEL, SEVERITY_LABEL } from "@/features/analyze/situations";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const HF_ROUTER = "https://router.huggingface.co/v1/chat/completions";

/** fetch with an abort timeout so a hanging provider can't stall the request. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export type ReportContext = {
  address: string;
  cleanliness: string;
  densityScore: number;
  recommendedTeam: string;
  directionsScanned: number;
  situations: DetectedSituation[];
};

export type GeneratedReport = {
  report: string;
  /** Which engine produced the commentary. */
  engine: "gemini" | "hf" | "local";
};

/** Strips markdown emphasis/heading markers some models add despite the prompt. */
function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/(^|\n)\s*#{1,6}\s*/g, "$1")
    .replace(/(^|\n)\s*[*-]\s+/g, "$1• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildPrompt(ctx: ReportContext): string {
  const sit =
    ctx.situations.length === 0
      ? "Belirgin bir çevresel sorun tespit edilmedi."
      : ctx.situations
          .map(
            (s) =>
              `- ${SITUATION_LABEL[s.type]} (önem: ${SEVERITY_LABEL[s.severity]}, güven: %${Math.round(
                s.confidence * 100,
              )}, yön: ${s.direction || "—"})${s.description ? ` — ${s.description}` : ""}`,
          )
          .join("\n");

  return `Sen deneyimli bir belediye saha denetim uzmanısın. Aşağıdaki otomatik görüntü analizi (sokağın dört yönü tarandı) sonuçlarına dayanarak KAPSAMLI, profesyonel ve akıcı bir Türkçe saha raporu yaz.

Konum: ${ctx.address}
Taranan yön sayısı: ${ctx.directionsScanned}
Genel temizlik durumu: ${ctx.cleanliness}
Kirlilik/yoğunluk skoru (0-100): ${ctx.densityScore}
Önerilen ekip: ${ctx.recommendedTeam}
Tespit edilen durumlar:
${sit}

Rapor şu bölümleri içersin (başlıkları KISA tut, markdown kullanma):
1. Genel değerlendirme (2-3 cümle).
2. Öne çıkan bulgular (varsa madde madde).
3. Önerilen aksiyon ve önceliklendirme (hangi ekip, ne kadar acil).
Toplam 120-180 kelime. Abartma, gözlemlere sadık kal. İnsan, araç gibi normal kent ögelerini sorun olarak yorumlama.`;
}

async function tryGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_REPORT_MODEL || "gemini-2.0-flash";
  const isApiKey = key.startsWith("AIza");
  const url = isApiKey
    ? `${GEMINI_BASE}/${model}:generateContent?key=${key}`
    : `${GEMINI_BASE}/${model}:generateContent`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!isApiKey) headers.Authorization = `Bearer ${key}`;
  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
        }),
      },
      8000,
    );
    if (!res.ok) return null;
    const body = await res.json();
    const text: string | undefined =
      body?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || null;
  } catch {
    return null;
  }
}

async function tryHF(prompt: string): Promise<string | null> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) return null;
  const model = process.env.HF_REPORT_MODEL || "Qwen/Qwen3-VL-8B-Instruct";
  try {
    const res = await fetchWithTimeout(
      HF_ROUTER,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 600,
        }),
      },
      20000,
    );
    if (!res.ok) return null;
    const body = await res.json();
    const text: string | undefined = body?.choices?.[0]?.message?.content;
    return text?.trim() || null;
  } catch {
    return null;
  }
}

/** Local heuristic report used when no AI engine is reachable. */
function localReport(ctx: ReportContext): string {
  if (ctx.situations.length === 0) {
    return `${ctx.address} bölgesinin dört yönü tarandı. Belirgin bir çevresel sorun ya da atık birikimi tespit edilmedi; bölge genel olarak temiz ve düzenli görünüyor (kirlilik skoru ${ctx.densityScore}/100). Şu an için ekip yönlendirmesi gerekmiyor; rutin denetim yeterlidir.`;
  }
  const items = ctx.situations
    .map((s) => `${SITUATION_LABEL[s.type]} (${SEVERITY_LABEL[s.severity]})`)
    .join(", ");
  return `${ctx.address} bölgesinde yapılan dört yönlü analizde ${ctx.situations.length} durum tespit edildi: ${items}. Genel temizlik durumu "${ctx.cleanliness}", kirlilik skoru ${ctx.densityScore}/100. Önerilen aksiyon: ${ctx.recommendedTeam} bölgeye yönlendirilmeli; yüksek önem dereceli bulgular öncelikli ele alınmalıdır.`;
}

/**
 * Produces a comprehensive Turkish field report from the analysis context.
 * Tries Gemini (commentary engine) first, then a Hugging Face text model, and
 * finally a deterministic local summary. Never throws.
 */
export async function generateReport(
  ctx: ReportContext,
): Promise<GeneratedReport> {
  const prompt = buildPrompt(ctx);

  const gemini = await tryGemini(prompt);
  if (gemini) return { report: cleanText(gemini), engine: "gemini" };

  const hf = await tryHF(prompt);
  if (hf) return { report: cleanText(hf), engine: "hf" };

  return { report: localReport(ctx), engine: "local" };
}
