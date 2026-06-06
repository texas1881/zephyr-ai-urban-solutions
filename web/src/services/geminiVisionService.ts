import {
  isSeverity,
  isSituationType,
  type Severity,
  type SituationType,
} from "@/features/analyze/situations";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type DirectionImageInput = {
  /** ön | arka | sağ | sol */
  label: string;
  heading: number;
  base64: string;
  mimeType: string;
};

export type DetectedSituation = {
  type: SituationType;
  severity: Severity;
  confidence: number;
  description: string;
  direction: string;
};

export type SituationAnalysis = {
  densityScore: number;
  cleanliness: string;
  situations: DetectedSituation[];
};

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

const PROMPT = `Sen bir belediye saha denetim modelisin. Sokak görüntülerinden çevresel temizlik ve altyapı durumunu HASSAS biçimde tespit edersin.
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

Yalnızca şu JSON şemasında yanıt ver (Türkçe açıklama):
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
    { text: `${PROMPT}\n\nAdres: ${address}` },
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

  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

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
