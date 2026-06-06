// Comprehensive natural-language field report generator.
// When no situations were validated, uses deterministic local text only
// (no LLM) to prevent hallucinated findings.

import type { DetectedSituation, SafetyRisk } from "@/types/api";
import { SITUATION_LABEL, SEVERITY_LABEL } from "@/features/analyze/situations";
import { reportContradictsContext } from "@/services/reportValidation";

const RISK_LABEL: Record<SafetyRisk, string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const HF_ROUTER = "https://router.huggingface.co/v1/chat/completions";

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
  safetyRisk: SafetyRisk;
  recommendedTeam: string;
  directionsScanned: number;
  situations: DetectedSituation[];
};

export type GeneratedReport = {
  report: string;
  engine: "gemini" | "hf" | "local";
};

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
      ? "ONAYLANMIŞ TESPİT YOK — bölge temiz."
      : ctx.situations
          .map((s) => {
            const meta = [
              `önem: ${SEVERITY_LABEL[s.severity]}`,
              `güven: %${Math.round(s.confidence * 100)}`,
              `yön: ${s.direction || "—"}`,
            ];
            if (s.location) meta.push(`konum: ${s.location}`);
            const action = s.recommendedAction
              ? ` Öneri: ${s.recommendedAction}`
              : "";
            return `- ${SITUATION_LABEL[s.type]} (${meta.join(", ")})${
              s.description ? ` — ${s.description}` : ""
            }${action}`;
          })
          .join("\n");

  const emptyRules =
    ctx.situations.length === 0
      ? `
KRİTİK: Onaylanmış tespit YOK. Raporda çöp, atık, kirlilik, hasar, tarım veya herhangi bir sorun YAZMA.
Yalnızca bölgenin temiz ve uygun olduğunu, rutin denetimin yeterli olduğunu belirt.`
      : `
KRİTİK: Yalnızca yukarıdaki onaylanmış tespitleri yaz. Listede olmayan sorun uydurma.`;

  return `Sen deneyimli bir belediye saha denetim uzmanısın. Aşağıdaki DOĞRULANMIŞ analiz sonuçlarına dayanarak kısa, profesyonel Türkçe saha raporu yaz.

Konum: ${ctx.address}
Taranan yön: ${ctx.directionsScanned}
Temizlik: ${ctx.cleanliness}
Yoğunluk skoru: ${ctx.densityScore}/100
Risk: ${RISK_LABEL[ctx.safetyRisk]}
Önerilen ekip: ${ctx.recommendedTeam}
Onaylanmış tespitler:
${sit}
${emptyRules}

Rapor bölümleri (markdown/yıldız kullanma):
1. Genel değerlendirme — 2 cümle
2. Öne çıkan bulgular — yalnızca onaylanmış tespit varsa
3. Risk ve etki — 1-2 cümle
4. Önerilen aksiyon — ekip ve öncelik
Toplam 120-180 kelime. Gözlemlere %100 sadık kal.`;
}

function localReport(ctx: ReportContext): string {
  if (ctx.situations.length === 0) {
    return `Genel değerlendirme
${ctx.address} bölgesinin dört yönü tarandı. Onaylanmış çevre sorunu veya atık birikimi tespit edilmedi; bölge genel olarak temiz ve düzenli görünüyor (yoğunluk skoru ${ctx.densityScore}/100).

Öne çıkan bulgular
Belirgin bulgu yok.

Risk ve etki
Güvenlik ve halk sağlığı açısından düşük risk; rutin denetim yeterlidir.

Önerilen aksiyon
Acil ekip yönlendirmesi gerekmiyor. Periyodik saha kontrolü önerilir.`;
  }

  const items = ctx.situations
    .map(
      (s) =>
        `${SITUATION_LABEL[s.type]} — ${SEVERITY_LABEL[s.severity]} önem, ${s.direction || "yön belirtilmedi"} yönünde`,
    )
    .join("\n");

  return `Genel değerlendirme
${ctx.address} bölgesinde dört yönlü analiz sonucunda ${ctx.situations.length} onaylanmış durum tespit edildi. Genel temizlik: ${ctx.cleanliness}, yoğunluk skoru ${ctx.densityScore}/100.

Öne çıkan bulgular
${items}

Risk ve etki
Güvenlik/aciliyet riski: ${RISK_LABEL[ctx.safetyRisk]}.

Önerilen aksiyon
${ctx.recommendedTeam} bölgeye yönlendirilmeli; yüksek önemli bulgular önceliklendirilmelidir.`;
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
          generationConfig: { temperature: 0.15, maxOutputTokens: 700 },
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
  const model =
    process.env.HF_REPORT_MODEL ||
    process.env.HF_SYNTHESIS_MODEL ||
    "Qwen/Qwen2.5-7B-Instruct";
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
          temperature: 0.1,
          max_tokens: 700,
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

function acceptOrLocal(
  raw: string | null,
  ctx: ReportContext,
  engine: GeneratedReport["engine"],
): GeneratedReport {
  if (!raw) return { report: localReport(ctx), engine: "local" };
  const cleaned = cleanText(raw);
  if (reportContradictsContext(cleaned, ctx)) {
    return { report: localReport(ctx), engine: "local" };
  }
  return { report: cleaned, engine };
}

export async function generateReport(
  ctx: ReportContext,
): Promise<GeneratedReport> {
  // Temiz bölge: LLM kullanma — halüsinasyon riski sıfır
  if (ctx.situations.length === 0) {
    return { report: localReport(ctx), engine: "local" };
  }

  const prompt = buildPrompt(ctx);
  const gemini = await tryGemini(prompt);
  if (gemini) return acceptOrLocal(gemini, ctx, "gemini");

  const hf = await tryHF(prompt);
  if (hf) return acceptOrLocal(hf, ctx, "hf");

  return { report: localReport(ctx), engine: "local" };
}
