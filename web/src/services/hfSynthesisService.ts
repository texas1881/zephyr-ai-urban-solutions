// Kanıta dayalı akıllı sentez — Qwen2.5 ile OWL/DETR bulgularını yorumlar.

import {
  parseSituationResponse,
  type SituationAnalysis,
} from "@/services/situationAnalysis";
import type { DirectionDetections } from "@/services/huggingFaceService";
import { formatDetectionHints } from "@/services/detectionHints";

const HF_ROUTER = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_MODEL = "Qwen/Qwen2.5-7B-Instruct";

const SYNTHESIS_INSTRUCTION = `Sen kıdemli belediye saha denetim uzmanısın. Otomatik görüntü tanıma kanıtlarına dayanarak JSON durum raporu üret.

KURALLAR:
1. Yalnızca kanıtta desteklenen, görselde mantıklı durumları yaz.
2. person, car, handbag, backpack, suitcase, book etiketleri KİRLİLİK DEĞİL — tamamen yok say.
3. "litter on the ground", "graffiti on wall", "coiled cable on sidewalk", "stacked equipment" gibi OWL sorguları somut bulgu sinyalidir; skor düşükse bile değerlendir.
4. description alanında Türkçe, somut ve anlaşılır cümle yaz — ham İngilizce etiket tekrarlama.
5. Kanıt yetersiz veya belirsizse situations = [], cleanliness = "Temiz", densityScore ≤ 10.
6. Uydurma yasak; şüphede situations boş bırak.

SADECE JSON döndür (markdown yok):
{
  "densityScore": 0-100,
  "cleanliness": "Temiz" | "Orta" | "Kirli",
  "safetyRisk": "dusuk" | "orta" | "yuksek",
  "summary": "2-3 cümle Türkçe özet",
  "situations": [
    {
      "type": "cop_kirliligi|asiri_kirli|dolu_cop_kutusu|yol_hasari|moloz_hafriyat|grafiti|kaldirim_isgali|bozuk_tabela|su_birikintisi|yabani_ot",
      "severity": "dusuk|orta|yuksek|kritik",
      "confidence": 0.0-1.0,
      "description": "Türkçe somut açıklama",
      "location": "konum",
      "recommendedAction": "aksiyon",
      "direction": "ön|arka|sağ|sol"
    }
  ]
}`;

async function postChat(prompt: string): Promise<string> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error("HUGGINGFACE_API_TOKEN yok");

  const model =
    process.env.HF_SYNTHESIS_MODEL ||
    process.env.HF_REPORT_MODEL ||
    DEFAULT_MODEL;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(HF_ROUTER, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.12,
        max_tokens: 1800,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`HF synthesis ${res.status}: ${await res.text()}`);
    }
    const body = await res.json();
    const text: string | undefined = body?.choices?.[0]?.message?.content;
    if (!text) throw new Error("HF synthesis boş yanıt");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function synthesizeSituationsWithLLM(
  address: string,
  directions: DirectionDetections[],
): Promise<SituationAnalysis> {
  const evidence = formatDetectionHints(directions);
  const prompt = `${SYNTHESIS_INSTRUCTION}\n\nAdres: ${address}\n\n${evidence}`;
  const text = await postChat(prompt);
  return parseSituationResponse(text);
}
