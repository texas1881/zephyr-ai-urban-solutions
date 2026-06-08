const HF_ROUTER = "https://router.huggingface.co/v1/chat/completions";

export type ChatContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type ChatOptions = {
  model: string;
  content: ChatContent[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export async function hfChatCompletion(opts: ChatOptions): Promise<string> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error("HUGGINGFACE_API_TOKEN yok");

  const ctrl = new AbortController();
  const timer = setTimeout(
    () => ctrl.abort(),
    opts.timeoutMs ?? 45000,
  );
  try {
    const res = await fetch(HF_ROUTER, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        messages: [{ role: "user", content: opts.content }],
        temperature: opts.temperature ?? 0.1,
        max_tokens: opts.maxTokens ?? 2048,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const detail = await res.text();
      if (res.status === 402 || /depleted your monthly included credits/i.test(detail)) {
        throw new Error(`HF_CREDITS_EXHAUSTED: ${detail.slice(0, 200)}`);
      }
      if (res.status === 403 || /insufficient permissions/i.test(detail)) {
        throw new Error(`HF_TOKEN_FORBIDDEN: ${detail.slice(0, 200)}`);
      }
      throw new Error(`HF chat ${res.status}: ${detail.slice(0, 240)}`);
    }
    const body = await res.json();
    const text: string | undefined = body?.choices?.[0]?.message?.content;
    if (!text?.trim()) throw new Error("HF chat boş yanıt");
    return text.trim();
  } finally {
    clearTimeout(timer);
  }
}
