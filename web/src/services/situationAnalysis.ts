// Shared prompt + response parser for multimodal situation detection.
// Used by both the Gemini and the Hugging Face (Qwen-VL) vision services so the
// detection taxonomy and JSON contract stay identical across engines.

import {
  isSeverity,
  isSituationType,
} from "@/features/analyze/situations";
import type { DetectedSituation, SafetyRisk } from "@/types/api";
import { validateSituationAnalysis } from "@/services/situationValidation";

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
export const SITUATION_PROMPT = `Sen kıdemli bir belediye saha denetim uzmanısın. Görevin YÜKSEK DOĞRULUKLA, yalnızca görüntüde NET ve BELİRGİN sorunları raporlamaktır. Şüpheli veya muğlak bulguları RAPOR ETME.
Sana aynı konumun DÖRT yönüne (ön/arka/sağ/sol) ait Google Street View görselleri veriliyor.

ÇALIŞMA YÖNTEMİ (içsel; çıktıya yazma):
1. Her görseli TEK TEK incele: zemin, kaldırım, duvar, çöp kutusu, köşe alanları.
2. Bir sorunu raporlamadan önce şu soruyu sor: "Bu gerçekten bir müdahale gerektiren sorun mu, yoksa normal kent görünümü mü?"
3. Aynı sorun birden fazla yönde görünüyorsa TEK kayıt yaz; en net göründüğü yönü kullan.
4. Gölge, bulanıklık, uzaklık veya düşük çözünürlük nedeniyle emin olamadığın şeyleri ATLA.

TESPİT EDİLECEK DURUM TİPLERİ (yalnızca açık kanıt varsa):
- cop_kirliligi: yerde BELİRGİN dağılmış çöp/atık (tek poşet değil, net görünür kirlilik)
- asiri_kirli: yoğun çöp birikimi veya çöp yığını
- dolu_cop_kutusu: taşmış veya açıkça dolu çöp kutusu/konteyner
- yol_hasari: belirgin çukur, geniş çatlak veya ciddi asfalt/kaldırım hasarı
- moloz_hafriyat: moloz, inşaat atığı veya hafriyat yığını
- grafiti: duvar/yüzeyde net grafiti veya izinsiz büyük karalama
- kaldirim_isgali: kaldırımı fiilen kapatan engel veya malzeme yığını
- bozuk_tabela: eğik, kırık veya devrilmiş tabela/levha
- su_birikintisi: yolda/kaldırımda belirgin su birikintisi
- yabani_ot: kaldırımdan taşan veya bakımsız yabani ot (normal ağaç/bitki DEĞİL)

YANLIŞ POZİTİF — ASLA SORUN SAYMA:
- İnsan, araç, bisiklet, bank, ağaç, çalı, sokak lambası, trafik işareti
- Park etmiş araçlar, trafik, kalabalık, normal dükkan vitrinleri
- Gölge, ıslak zemin yansıması, uzaktaki bulanık nesneler
- Tek tük küçük leke veya şüpheli piksel; emin değilsen ATLA
- Kişi/plaka tanımlama; yalnızca cansız çevre unsurları

GÜVEN SKORU KURALLARI:
- confidence ≥ 0.75: görüntüde açıkça görülen, tartışmasız sorun
- confidence 0.65–0.74: net ama kısmen gizli sorun
- confidence < 0.65: RAPOR ETME — situations listesine ekleme
- Uydurma veya tahmine dayalı tespit YASAK

SONUÇ:
- Belirgin sorun yoksa situations = [], cleanliness = "Temiz", densityScore ≤ 10, safetyRisk = "dusuk"
- summary'de yalnızca doğrulanmış bulguları özetle; abartma yapma

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

  return validateSituationAnalysis({
    densityScore,
    cleanliness,
    summary: str(parsed.summary),
    safetyRisk,
    situations,
  });
}
