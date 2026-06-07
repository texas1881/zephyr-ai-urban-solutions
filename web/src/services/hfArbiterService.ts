// Arbiter Agent — metin tabanlı son kontrol, ekip uyumu ve tutarlılık.

import { SITUATION_LABEL, SITUATION_TEAM } from "@/features/analyze/situations";
import { hfChatCompletion } from "@/services/hfModelClient";
import {
  parseSituationResponse,
  type SituationAnalysis,
} from "@/services/situationAnalysis";

const DEFAULT_ARBITER_MODEL = "Qwen/Qwen2.5-7B-Instruct";

const ARBITER_PROMPT = `Sen belediye operasyon koordinatörüsün (Arbiter Agent).
Vision Agent ve Thinking Reviewer ortak bulguları sundu. Son kontrol yap.

KURALLAR:
1. Tutarsız veya abartılı bulguları çıkar
2. En fazla 4 durum; dolu_cop_kutusu ve cop_kirliligi birlikte kalabilir
2b. dolu_cop_kutusu: taşma/konteyner NET değilse çıkar; emin olmayan bin bulgularını at
3. Her durumun recommendedAction alanını doğru ekiple eşleştir:
   - Temizlik Ekibi: çöp, dolu konteyner, grafiti, yabani ot
   - Yol Bakım Ekibi: yol hasarı, moloz, kaldırım işgali, tabela, su birikintisi
4. summary'de hangi ekiplerin gerektiğini belirt
5. Belirsiz bulgu varsa çıkar — az ama doğru

SADECE JSON (markdown yok):
{
  "densityScore": 0-100,
  "cleanliness": "Temiz" | "Orta" | "Kirli",
  "safetyRisk": "dusuk" | "orta" | "yuksek",
  "summary": "Türkçe özet",
  "situations": [...]
}`;

export async function arbitrateAnalysis(
  address: string,
  consensus: SituationAnalysis,
): Promise<SituationAnalysis> {
  if (consensus.situations.length === 0) return consensus;

  const model =
    process.env.HF_ARBITER_MODEL ||
    process.env.HF_SYNTHESIS_MODEL ||
    DEFAULT_ARBITER_MODEL;

  const brief = consensus.situations
    .map(
      (s) =>
        `- ${SITUATION_LABEL[s.type]} (${s.severity}, ${s.direction}): ${s.description} → ${SITUATION_TEAM[s.type]}`,
    )
    .join("\n");

  const text = await hfChatCompletion({
    model,
    content: [
      {
        type: "text",
        text: `${ARBITER_PROMPT}\n\nAdres: ${address}\n\nOrtak bulgular:\n${brief}\n\nTam JSON:\n${JSON.stringify(consensus, null, 2)}`,
      },
    ],
    temperature: 0.08,
    maxTokens: 1400,
    timeoutMs: 12000,
  });

  return parseSituationResponse(text);
}
