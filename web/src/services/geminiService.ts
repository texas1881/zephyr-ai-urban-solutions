import type { DetectedObject } from "@/types/api";
import {
  isLitter,
  isPerson,
  isVehicle,
  labelTr,
} from "@/features/analyze/labels";

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
  if (score >= 60) return "Kirli";
  if (score >= 25) return "Orta";
  return "Temiz";
}

type Grouped = { label: string; count: number };

function groupBy(
  objects: DetectedObject[],
  pred: (label: string) => boolean,
): Grouped[] {
  const counts = new Map<string, number>();
  for (const o of objects) {
    if (!pred(o.label)) continue;
    counts.set(o.label, (counts.get(o.label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function listTr(groups: Grouped[], n = 6): string {
  return groups
    .slice(0, n)
    .map((g) => `${labelTr(g.label)} ×${g.count}`)
    .join(", ");
}

function heuristicComment(
  address: string,
  densityScore: number,
  objects: DetectedObject[],
): string {
  const cleanliness = cleanlinessFromScore(densityScore);
  const litter = groupBy(objects, isLitter);
  const litterTotal = litter.reduce((s, g) => s + g.count, 0);
  const people = objects.filter((o) => isPerson(o.label)).length;
  const vehicles = objects.filter((o) => isVehicle(o.label)).length;

  let temizlik: string;
  if (litterTotal === 0) {
    temizlik =
      "Görüntülerde belirgin çöp veya atık tespit edilmedi; bölge temiz görünüyor.";
  } else if (cleanliness === "Kirli") {
    temizlik = `Yüksek miktarda atık tespit edildi (${listTr(litter)}); öncelikli temizlik önerilir.`;
  } else {
    temizlik = `Az miktarda atık tespit edildi (${listTr(litter)}); periyodik kontrol uygundur.`;
  }

  const baglamParcalari: string[] = [];
  if (people > 0) baglamParcalari.push(`${people} yaya`);
  if (vehicles > 0) baglamParcalari.push(`${vehicles} araç`);
  const baglam =
    baglamParcalari.length > 0
      ? ` Bölgede ${baglamParcalari.join(" ve ")} hareketi gözlendi (kirlilik göstergesi değildir).`
      : "";

  return `${address} bölgesi için temizlik durumu: ${cleanliness}. ${temizlik}${baglam}`;
}

/**
 * Generates a Turkish assessment of cleanliness / pollution / city order.
 * Pollution reasoning is based on litter only; people/vehicles are treated as
 * context. Uses the Gemini API when a key is available; otherwise falls back
 * to a deterministic heuristic comment so the feature always works.
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

  const litter = groupBy(objects, isLitter);
  const people = objects.filter((o) => isPerson(o.label)).length;
  const vehicles = objects.filter((o) => isVehicle(o.label)).length;

  const prompt = `Sen bir belediye temizlik ve kentsel düzen analiz asistanısın.
Adres: ${address}
Çöp/atık skoru: ${densityScore}/100 (${cleanliness})
Tespit edilen ATIK objeleri: ${listTr(litter, 12) || "yok"}
Bağlam (kirlilik DEĞİLDİR, sadece bilgi): ${people} yaya, ${vehicles} araç.
Kurallar: İnsanları, araçları, yangın musluğu/bank gibi kent mobilyalarını ASLA kirlilik/çöp olarak değerlendirme. Kalabalık veya trafik bir bölgeyi "kirli" yapmaz. Sadece atık objelerine göre temizlik yorumu yap.
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
