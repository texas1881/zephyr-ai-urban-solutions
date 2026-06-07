// Thinking Agent — VLM bulgularını görselde doğrular, halüsinasyon eler.

import { formatDetectionHints } from "@/services/detectionHints";
import { hfChatCompletion } from "@/services/hfModelClient";
import type { DirectionImageInput } from "@/services/huggingFaceService";
import {
  parseSituationResponse,
  type SituationAnalysis,
} from "@/services/situationAnalysis";
import type { DirectionDetections } from "@/services/huggingFaceService";

const DEFAULT_THINKING_MODEL = "Qwen/Qwen3-VL-30B-A3B-Thinking";

const REVIEW_PROMPT = `Sen şüpheci kıdemli belediye denetim uzmanısın (Thinking modu).
Başka bir AI aşağıdaki durumları raporladı. AYNI dört yön görselini incele ve her bulguyu doğrula.

GÖREV:
1. Her durum için: belirtilen yönde görselde NET görünüyor mu?
2. Gölge, ıslak zemin, uzaklık, normal kent ögesi mi? → REDDET
3. Yol hasarı / su birikintisi için ekstra titiz ol — emin değilsen REDDET
4. dolu_cop_kutusu: kutunun kendisi VE taşan atık NET görünmeli; şüphede REDDET
5. cop_kirliligi ile dolu_cop_kutusu aynı yönde birlikte olabilir
6. En fazla 4 onaylı durum; emin olmadığın bulguyu çıkar
7. Hiçbiri görselde doğrulanmıyorsa situations = []

YANLIŞ POZİTİF — REDDET:
- İnsan, araç, çanta, güvercin, normal meydan kalabalığı
- Gölge veya yansıma = su birikintisi DEĞİL
- Çatlak olmayan zemin = yol hasarı DEĞİL
- Normal ağaç/bitki = yabani ot DEĞİL
- Dükkan tabelası, vitrin, posta kutusu, saksı = çöp kutusu DEĞİL

SADECE JSON döndür (markdown yok):
{
  "densityScore": 0-100,
  "cleanliness": "Temiz" | "Orta" | "Kirli",
  "safetyRisk": "dusuk" | "orta" | "yuksek",
  "summary": "2-3 cümle Türkçe — yalnızca onaylanan bulgular",
  "situations": [ onaylanan durumlar — dolu_cop_kutusu yalnızca taşma NET ise ]
}`;

function buildImageContent(
  address: string,
  directions: DirectionImageInput[],
  proposed: SituationAnalysis,
  detectionDirs: DirectionDetections[],
): Parameters<typeof hfChatCompletion>[0]["content"] {
  const proposedJson = JSON.stringify(
    {
      summary: proposed.summary,
      situations: proposed.situations,
    },
    null,
    2,
  );
  const hints =
    detectionDirs.length > 0
      ? `\n\n${formatDetectionHints(detectionDirs)}`
      : "";

  const content: Parameters<typeof hfChatCompletion>[0]["content"] = [
    {
      type: "text",
      text: `${REVIEW_PROMPT}\n\nAdres: ${address}\n\nÖnceki AI raporu:\n${proposedJson}${hints}`,
    },
  ];
  for (const d of directions) {
    content.push({ type: "text", text: `Yön: ${d.label}` });
    content.push({
      type: "image_url",
      image_url: { url: `data:${d.mimeType};base64,${d.base64}` },
    });
  }
  return content;
}

export async function reviewWithThinkingAgent(
  address: string,
  directions: DirectionImageInput[],
  proposed: SituationAnalysis,
  detectionDirs: DirectionDetections[] = [],
): Promise<SituationAnalysis> {
  if (proposed.situations.length === 0) return proposed;

  const model =
    process.env.HF_THINKING_MODEL || DEFAULT_THINKING_MODEL;

  const text = await hfChatCompletion({
    model,
    content: buildImageContent(
      address,
      directions,
      proposed,
      detectionDirs,
    ),
    temperature: 0.05,
    maxTokens: 1800,
    timeoutMs: 32000,
  });

  return parseSituationResponse(text);
}
