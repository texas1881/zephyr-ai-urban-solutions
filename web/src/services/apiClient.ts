// Thin client for the masterfabric-go backend. Attaches the JWT (when present)
// and centralizes the base URL. No-ops gracefully when the backend URL is unset
// so the app keeps working in localStorage-only / demo mode.

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const TOKEN_KEY = "zephyr.token.v1";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function hasBackend(): boolean {
  return BASE_URL.length > 0;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

/**
 * Performs a request against the backend, returning parsed JSON.
 * Throws ApiError on non-2xx responses.
 */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body, auth = true }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `İstek başarısız (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

/** Best-effort fire-and-forget request (used for optional backend sync). */
export function apiFireAndForget(path: string, options: RequestOptions): void {
  if (!hasBackend()) return;
  apiRequest(path, options).catch(() => {
    /* backend optional */
  });
}
