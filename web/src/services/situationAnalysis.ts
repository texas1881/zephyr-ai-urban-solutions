// Shared prompt + response parser for multimodal situation detection.
// Used by both the Gemini and the Hugging Face (Qwen-VL) vision services so the
// detection taxonomy and JSON contract stay identical across engines.

import {
  isSeverity,
  isSituationType,
} from "@/features/analyze/situations";
import type { DetectedSituation } from "@/types/api";

export type SituationAnalysis = {
  densityScore: number;
  cleanliness: string;
  situations: DetectedSituation[];
};

/** The detection instruction shared by every vision engine. */
export const SITUATION_PROMPT = `Sen bir belediye saha denetim modelisin. Sokak görüntülerinden çevresel temizlik ve altyapı durumunu HASSAS biçimde tespit edersin.
Sana aynı konumun DÖRT yönüne (ön/arka/sağ/sol) ait Google Street View görselleri veriliyor.

Görevin: Her görselde aşağıdaki durumları dikkatle ara ve raporla:
- cop_kirliligi: yerde dağılmış çöp, atık, izmarit, kağıt
- asiri_kirli: yoğun çöp birikimi, çöp yığını
- dolu_cop_kutusu: taşmış/dolu çöp kutusu veya konteyner
- yol_hasari: çukur, çatlak, bozuk asfalt, hasarlı kaldırım
- moloz_hafriyat: moloz, inşaat atığı, hafriyat yığını
- grafiti: duvarlarda grafiti/karalama

KESİN KURALLAR:
- İnsan, araç, yangın musluğu, bank, ağaç gibi normal kent ögelerini ASLA sorun olarak işaretleme.
- Kalabalık veya trafik bir bölgeyi kirli yapmaz.
- Hiçbir sorun yoksa situations dizisini boş bırak ve cleanliness "Temiz" olsun.

SADECE şu JSON şemasında yanıt ver, başka hiçbir metin ekleme (Türkçe açıklama):
{
  "densityScore": 0-100 tamsayı (0=tertemiz, 100=çok kötü durumda),
  "cleanliness": "Temiz" | "Orta" | "Kirli",
  "situations": [
    {
      "type": "cop_kirliligi|asiri_kirli|dolu_cop_kutusu|yol_hasari|moloz_hafriyat|grafiti",
      "severity": "dusuk|orta|yuksek|kritik",
      "confidence": 0.0-1.0,
      "description": "kısa Türkçe açıklama",
      "direction": "ön|arka|sağ|sol"
    }
  ]
}`;

function clampScore(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function clampConfidence(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0.5;
  if (v > 1) return Math.max(0, Math.min(1, v / 100));
  return Math.max(0, Math.min(1, v));
}

/** Strips markdown fences and extracts the first JSON object from raw text. */
function extractJson(text: string): string {
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  // Be lenient: some models prepend a sentence before the JSON object.
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return s.slice(start, end + 1);
  }
  return s;
}

/**
 * Parses the JSON situation report returned by a vision model into a typed
 * {@link SituationAnalysis}. Invalid/unknown situation types are dropped.
 * Throws when no parseable JSON object is present so the caller can fall back.
 */
export function parseSituationResponse(text: string): SituationAnalysis {
  const parsed = JSON.parse(extractJson(text)) as Record<string, unknown>;

  const rawSituations = Array.isArray(parsed.situations)
    ? parsed.situations
    : [];
  const situations: DetectedSituation[] = rawSituations
    .map((s) => {
      const item = s as Record<string, unknown>;
      const type = String(item.type ?? "");
      const severity = String(item.severity ?? "orta");
      if (!isSituationType(type) || type === "temiz") return null;
      return {
        type,
        severity: isSeverity(severity) ? severity : "orta",
        confidence: clampConfidence(item.confidence),
        description:
          typeof item.description === "string" ? item.description.trim() : "",
        direction:
          typeof item.direction === "string" ? item.direction.trim() : "",
      } as DetectedSituation;
    })
    .filter((s): s is DetectedSituation => s !== null)
    .slice(0, 12);

  const densityScore = clampScore(parsed.densityScore);
  const cleanliness =
    typeof parsed.cleanliness === "string" && parsed.cleanliness.trim()
      ? (parsed.cleanliness as string).trim()
      : densityScore >= 60
        ? "Kirli"
        : densityScore >= 25
          ? "Orta"
          : "Temiz";

  return { densityScore, cleanliness, situations };
}
