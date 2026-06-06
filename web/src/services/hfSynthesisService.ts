// Stage 2: text-only HF language model turns vision detections into a
// structured SituationAnalysis JSON report.

import {
  parseSituationResponse,
  type SituationAnalysis,
} from "@/services/situationAnalysis";
import type { DirectionDetections } from "@/services/huggingFaceService";

const HF_ROUTER = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_SYNTHESIS_MODEL = "Qwen/Qwen2.5-7B-Instruct";

const SYNTHESIS_PROMPT = `Sen kıdemli bir belediye saha denetim uzmanısın. Sana bir konumun dört yönünde çalıştırılmış GÖRÜNTÜ TANIMA modelinin ham tespit sonuçları veriliyor. Görevin: bu kanıtlara dayanarak YÜKSEK DOĞRULUKLU, yapılandırılmış durum raporu üretmek.

KURALLAR:
- Yalnızca tespit listesinde skoru ≥ 0.35 olan ve net eşleşen durumları raporla
- Aynı sorun tipini birden fazla yönde görürsen TEK kayıt yaz (en yüksek skorlu yön)
- İnsan, araç, bisiklet, bank, ağaç tespitleri sorun DEĞİL — yok say
- Kanıt yoksa situations = [], cleanliness = "Temiz", densityScore ≤ 10
- confidence değerini tespit skoruna göre ver; uydurma yapma
- Emin olmadığın durumu ekleme

DURUM TİPLERİ: cop_kirliligi, asiri_kirli, dolu_cop_kutusu, yol_hasari, moloz_hafriyat, grafiti, kaldirim_isgali, bozuk_tabela, su_birikintisi, yabani_ot

SADECE şu JSON şemasında yanıt ver, başka metin ekleme:
{
  "densityScore": 0-100,
  "cleanliness": "Temiz" | "Orta" | "Kirli",
  "safetyRisk": "dusuk" | "orta" | "yuksek",
  "summary": "2-3 cümle Türkçe özet",
  "situations": [
    {
      "type": "...",
      "severity": "dusuk|orta|yuksek|kritik",
      "confidence": 0.0-1.0,
      "description": "tespit kanıtına dayalı Türkçe açıklama",
      "location": "görüntüdeki konum",
      "recommendedAction": "somut müdahale önerisi",
      "direction": "ön|arka|sağ|sol"
    }
  ]
}`;

function buildDetectionPayload(
  address: string,
  directions: DirectionDetections[],
): string {
  const lines = directions.map((d) => {
    const hits =
      d.detections.length === 0
        ? "  (tespit yok)"
        : d.detections
            .map(
              (x) =>
                `  - "${x.label}" skor=${x.score.toFixed(2)} kutu=[${x.box.xmin},${x.box.ymin},${x.box.xmax},${x.box.ymax}]`,
            )
            .join("\n");
    return `Yön: ${d.label} (heading ${d.heading})\n${hits}`;
  });
  return `${SYNTHESIS_PROMPT}\n\nAdres: ${address}\n\nGÖRÜNTÜ TANIMA ÇIKTISI:\n${lines.join("\n\n")}`;
}

/**
 * Sends aggregated vision detections to a text-only HF LLM and parses the
 * structured situation report. Throws on missing token or unparseable output.
 */
export async function synthesizeSituationsFromDetections(
  address: string,
  directions: DirectionDetections[],
): Promise<SituationAnalysis> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error("HUGGINGFACE_API_TOKEN yok");

  const model = process.env.HF_SYNTHESIS_MODEL || DEFAULT_SYNTHESIS_MODEL;
  const prompt = buildDetectionPayload(address, directions);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 35000);
  let res: Response;
  try {
    res = await fetch(HF_ROUTER, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        top_p: 0.85,
        max_tokens: 2048,
      }),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`HF synthesis ${res.status}: ${await res.text()}`);
  }

  const body = await res.json();
  const text: string | undefined = body?.choices?.[0]?.message?.content;
  if (!text) throw new Error("HF synthesis boş yanıt");

  return parseSituationResponse(text);
}
