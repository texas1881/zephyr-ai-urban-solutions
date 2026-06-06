// Shared prompt + response parser for multimodal situation detection.
// Used by both the Gemini and the Hugging Face (Qwen-VL) vision services so the
// detection taxonomy and JSON contract stay identical across engines.

import {
  isSeverity,
  isSituationType,
} from "@/features/analyze/situations";
import type { DetectedSituation, SafetyRisk } from "@/types/api";

export type SituationAnalysis = {
  densityScore: number;
  cleanliness: string;
  /** Short model-written overview of the four directions (optional). */
  summary: string;
  /** Overall safety/urgency risk inferred by the model. */
  safetyRisk: SafetyRisk;
  situations: DetectedSituation[];
};

/** The detection instruction shared by every vision engine. */
export const SITUATION_PROMPT = `Sen kıdemli bir belediye saha denetim uzmanısın. Sokak görüntülerinden çevresel temizlik ve altyapı sorunlarını YÜKSEK HASSASİYETLE, gözden kaçırmadan tespit edersin.
Sana aynı konumun DÖRT yönüne (ön/arka/sağ/sol) ait Google Street View görselleri veriliyor.

ÇALIŞMA YÖNTEMİ (içsel; çıktıya yazma):
1. Her görseli TEK TEK, sistematik tara: zemin/asfalt, kaldırım, duvarlar, köşeler, çöp kutuları, kenarlar.
2. Küçük ama gerçek sorunları da yakala (tek tük çöp, küçük çatlak gibi) ama abartma.
3. Aynı sorunu birden çok yönde görürsen her yön için ayrı kayıt yazma; en net göründüğü yönü kullan.

TESPİT EDİLECEK DURUM TİPLERİ:
- cop_kirliligi: yerde dağılmış çöp, atık, izmarit, kağıt, poşet
- asiri_kirli: yoğun çöp birikimi, çöp yığını, dökülmüş atık
- dolu_cop_kutusu: taşmış/dolu çöp kutusu veya konteyner
- yol_hasari: çukur, çatlak, bozuk asfalt, hasarlı/çökmüş kaldırım
- moloz_hafriyat: moloz, inşaat atığı, hafriyat yığını, kum/çakıl
- grafiti: duvar/yüzeylerde grafiti, karalama, izinsiz afiş
- kaldirim_isgali: kaldırımı kapatan engel, dağınık malzeme, seyyar yığın
- bozuk_tabela: eğik/kırık/paslı tabela, devrilmiş levha, bozuk durak
- su_birikintisi: yolda/kaldırımda su birikmesi, tıkalı gider
- yabani_ot: bakımsız yeşil alan, kaldırımdan çıkan yabani ot

KESİN KURALLAR (KVKK + doğruluk):
- İnsan, araç, yangın musluğu, bank, ağaç, bisiklet gibi NORMAL kent ögelerini ASLA sorun sayma.
- Kalabalık, trafik veya park etmiş araç bir bölgeyi kirli YAPMAZ.
- Kişi/plaka tanımaya çalışma; yalnızca cansız çevre unsurlarını değerlendir.
- Emin olmadığın tespit için confidence değerini düşük ver (0.3-0.5), uydurma.
- Hiçbir sorun yoksa situations boş kalsın, cleanliness "Temiz", safetyRisk "dusuk".

SADECE şu JSON şemasında yanıt ver, başka hiçbir metin/markdown ekleme:
{
  "densityScore": 0-100 tamsayı (0=tertemiz, 100=çok kötü),
  "cleanliness": "Temiz" | "Orta" | "Kirli",
  "safetyRisk": "dusuk" | "orta" | "yuksek",
  "summary": "2-3 cümlelik genel durum özeti (Türkçe)",
  "situations": [
    {
      "type": "cop_kirliligi|asiri_kirli|dolu_cop_kutusu|yol_hasari|moloz_hafriyat|grafiti|kaldirim_isgali|bozuk_tabela|su_birikintisi|yabani_ot",
      "severity": "dusuk|orta|yuksek|kritik",
      "confidence": 0.0-1.0,
      "description": "ne gördüğünün net Türkçe açıklaması",
      "location": "görüntüdeki yeri (ör. kaldırım kenarı, sol duvar, yol ortası)",
      "recommendedAction": "kısa, somut müdahale önerisi",
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
  const str = (v: unknown): string =>
    typeof v === "string" ? v.trim() : "";

  const situations: DetectedSituation[] = rawSituations
    .map((s) => {
      const item = s as Record<string, unknown>;
      const type = String(item.type ?? "");
      const severity = String(item.severity ?? "orta");
      if (!isSituationType(type) || type === "temiz") return null;
      const situation: DetectedSituation = {
        type,
        severity: isSeverity(severity) ? severity : "orta",
        confidence: clampConfidence(item.confidence),
        description: str(item.description),
        direction: str(item.direction),
      };
      const action = str(item.recommendedAction);
      const location = str(item.location);
      if (action) situation.recommendedAction = action;
      if (location) situation.location = location;
      return situation;
    })
    .filter((s): s is DetectedSituation => s !== null)
    .slice(0, 16);

  const densityScore = clampScore(parsed.densityScore);
  const cleanliness =
    typeof parsed.cleanliness === "string" && parsed.cleanliness.trim()
      ? (parsed.cleanliness as string).trim()
      : densityScore >= 60
        ? "Kirli"
        : densityScore >= 25
          ? "Orta"
          : "Temiz";

  const rawRisk = str(parsed.safetyRisk).toLowerCase();
  const safetyRisk: SafetyRisk =
    rawRisk === "yuksek" || rawRisk === "orta" || rawRisk === "dusuk"
      ? (rawRisk as SafetyRisk)
      : densityScore >= 60
        ? "yuksek"
        : densityScore >= 30
          ? "orta"
          : "dusuk";

  return {
    densityScore,
    cleanliness,
    summary: str(parsed.summary),
    safetyRisk,
    situations,
  };
}
