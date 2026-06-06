// Kapsamlı saha raporu — yalnızca HF metin modeli + yerel özet (Gemini/Vision yok).

import type { DetectedSituation, SafetyRisk } from "@/types/api";
import { SITUATION_LABEL, SEVERITY_LABEL } from "@/features/analyze/situations";
import { reportContradictsContext } from "@/services/reportValidation";

const RISK_LABEL: Record<SafetyRisk, string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
};

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
  engine: "hf" | "local";
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
  const sit = ctx.situations
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

  return `Sen deneyimli bir belediye saha denetim uzmanısın. DOĞRULANMIŞ analiz sonuçlarına dayanarak kısa Türkçe saha raporu yaz.

Konum: ${ctx.address}
Taranan yön: ${ctx.directionsScanned}
Temizlik: ${ctx.cleanliness}
Yoğunluk: ${ctx.densityScore}/100
Risk: ${RISK_LABEL[ctx.safetyRisk]}
Önerilen ekip: ${ctx.recommendedTeam}
Onaylanmış tespitler:
${sit}

KRİTİK: Yalnızca yukarıdaki tespitleri yaz, uydurma yapma.
Bölümler (markdown kullanma): Genel değerlendirme, Öne çıkan bulgular, Risk ve etki, Önerilen aksiyon.
120-180 kelime.`;
}

function localReport(ctx: ReportContext): string {
  if (ctx.situations.length === 0) {
    return `Genel değerlendirme
${ctx.address} bölgesinin dört yönü tarandı. Onaylanmış çevre sorunu tespit edilmedi (yoğunluk ${ctx.densityScore}/100).

Öne çıkan bulgular
Belirgin bulgu yok.

Risk ve etki
Düşük risk; rutin denetim yeterlidir.

Önerilen aksiyon
Acil ekip yönlendirmesi gerekmiyor.`;
  }

  const items = ctx.situations
    .map(
      (s) =>
        `${SITUATION_LABEL[s.type]} — ${SEVERITY_LABEL[s.severity]}, ${s.direction || "—"} yön`,
    )
    .join("\n");

  return `Genel değerlendirme
${ctx.address}: ${ctx.situations.length} onaylanmış durum, temizlik ${ctx.cleanliness}, yoğunluk ${ctx.densityScore}/100.

Öne çıkan bulgular
${items}

Risk ve etki
${RISK_LABEL[ctx.safetyRisk]} risk.

Önerilen aksiyon
${ctx.recommendedTeam} yönlendirilmeli.`;
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

export async function generateReport(
  ctx: ReportContext,
): Promise<GeneratedReport> {
  if (ctx.situations.length === 0) {
    return { report: localReport(ctx), engine: "local" };
  }

  const prompt = buildPrompt(ctx);
  const hf = await tryHF(prompt);
  if (hf) {
    const cleaned = cleanText(hf);
    if (!reportContradictsContext(cleaned, ctx)) {
      return { report: cleaned, engine: "hf" };
    }
  }

  return { report: localReport(ctx), engine: "local" };
}
