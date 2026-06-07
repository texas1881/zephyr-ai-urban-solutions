/**
 * Geçici ağ hatalarına (undici "fetch failed", ECONNRESET, kısa kesintiler)
 * karşı üstel geri çekilmeli yeniden deneme. Art arda ağır isteklerde dış
 * servislere (Google, HF) giden bağlantı anlık düşse bile akış bozulmaz.
 */
export async function fetchWithRetry(
  input: string | URL | Request,
  init?: RequestInit,
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<Response> {
  const retries = opts.retries ?? 2;
  const baseDelay = opts.baseDelayMs ?? 400;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      // 5xx ve 429 geçici kabul edilir — yeniden dene
      if ((res.status >= 500 || res.status === 429) && attempt < retries) {
        await sleep(baseDelay * 2 ** attempt);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(baseDelay * 2 ** attempt);
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("fetch failed");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
