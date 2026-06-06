import type { DetectedObject } from "@/types/api";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type Assessment = {
  /** Temiz | Orta | Kirli */
  cleanliness: string;
  /** Natural-language evaluation of cleanliness, pollution and city order. */
  comment: string;
  /** Whether the comment came from Gemini (true) or the local fallback (false). */
  aiGenerated: boolean;
};

export function cleanlinessFromScore(score: number): string {
  if (score >= 65) return "Kirli";
  if (score >= 35) return "Orta";
  return "Temiz";
}

function topLabels(objects: DetectedObject[], n = 6): string {
  const counts = new Map<string, number>();
  for (const o of objects) counts.set(o.label, (counts.get(o.label) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, c]) => `${label} x${c}`)
    .join(", ");
}

function heuristicComment(
  address: string,
  densityScore: number,
  objects: DetectedObject[],
): string {
  const cleanliness = cleanlinessFromScore(densityScore);
  const labels = topLabels(objects) || "belirgin obje yok";
  const durum =
    cleanliness === "Kirli"
      ? "yüksek yoğunlukta çevresel obje ve olası kirlilik tespit edildi; öncelikli temizlik önerilir"
      : cleanliness === "Orta"
        ? "orta düzeyde çevresel yoğunluk var; periyodik kontrol uygun olur"
        : "çevre düzeni iyi durumda, belirgin kirlilik gözlenmedi";
  return `${address} bölgesinde ${durum}. Tespit edilen başlıca objeler: ${labels}. Çöp yoğunluğu skoru ${densityScore}/100 (${cleanliness}).`;
}

/**
 * Generates a Turkish assessment of cleanliness / pollution / city order.
 * Uses the Gemini API when a key is available; otherwise falls back to a
 * deterministic heuristic comment so the feature always works.
 */
export async function generateAssessment(
  address: string,
  densityScore: number,
  objects: DetectedObject[],
): Promise<Assessment> {
  const cleanliness = cleanlinessFromScore(densityScore);
  const key =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_STREET_VIEW_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  if (!key) {
    return {
      cleanliness,
      comment: heuristicComment(address, densityScore, objects),
      aiGenerated: false,
    };
  }

  const prompt = `Sen bir belediye temizlik ve kentsel düzen analiz asistanısın.
Adres: ${address}
Çöp/çevresel yoğunluk skoru: ${densityScore}/100 (${cleanliness})
Tespit edilen nesneler (ön/arka/sağ/sol taramasından): ${topLabels(objects, 12) || "yok"}
Bu bölgenin temizlik durumu, çevresel kirlilik ve şehir düzeni hakkında 2-3 cümlelik kısa, profesyonel bir Türkçe değerlendirme yaz. Sadece değerlendirme metnini döndür.`;

  try {
    const res = await fetch(
      `${GEMINI_BASE}/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 256 },
        }),
      },
    );

    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const body = await res.json();
    const text: string | undefined =
      body?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Gemini boş yanıt");

    return { cleanliness, comment: text.trim(), aiGenerated: true };
  } catch {
    return {
      cleanliness,
      comment: heuristicComment(address, densityScore, objects),
      aiGenerated: false,
    };
  }
}
