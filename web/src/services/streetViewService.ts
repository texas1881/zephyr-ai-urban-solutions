import { fetchWithRetry } from "@/lib/fetchWithRetry";

const STREET_VIEW_BASE = "https://maps.googleapis.com/maps/api/streetview";
const STREET_VIEW_META = "https://maps.googleapis.com/maps/api/streetview/metadata";

/**
 * Street View Static API tek karede en fazla 640×640 döndürür (scale yok).
 * Daha büyük istek sessizce 640'a kırpılır — bu yüzden boyutu açıkça sınırlarız.
 */
const STREET_VIEW_MAX_DIM = 640;

/** Boyutu Google'ın 640 tavanına sıkıştırır (WxH). */
function clampSize(size: string): string {
  const m = size.match(/^(\d+)x(\d+)$/);
  if (!m) return `${STREET_VIEW_MAX_DIM}x${STREET_VIEW_MAX_DIM}`;
  const w = Math.min(Number(m[1]) || STREET_VIEW_MAX_DIM, STREET_VIEW_MAX_DIM);
  const h = Math.min(Number(m[2]) || STREET_VIEW_MAX_DIM, STREET_VIEW_MAX_DIM);
  return `${w}x${h}`;
}

/** Analiz için görüntü boyutu — env ile override edilebilir (max 640×640). */
export function getStreetViewSize(): string {
  return clampSize(process.env.STREET_VIEW_IMAGE_SIZE?.trim() || "640x640");
}

/**
 * Tespit için optimize edilmiş kamera presetleri.
 * fov=66 → 90'a göre ~%36 daha fazla piksel/nesne (uzaktaki çöp/kutu daha net).
 * pitch=-8 → kaldırım ve yol zeminindeki atıkları kadraja alır.
 * source=outdoor → kullanıcı iç-mekan photosphere'lerini eler, tutarlı sokak görüntüsü.
 */
export const ANALYSIS_VIEW = { fov: 66, pitch: -8, source: "outdoor" } as const;

/** UI grid — dört ana yön. */
export const SCAN_DIRECTIONS = [
  { heading: 0, label: "ön" },
  { heading: 90, label: "sağ" },
  { heading: 180, label: "arka" },
  { heading: 270, label: "sol" },
] as const;

/** Model için 360° panorama — 45° aralık (8 kare). */
export const PANORAMA_360_DIRECTIONS = Array.from({ length: 8 }, (_, i) => {
  const heading = i * 45;
  const label =
    heading === 0
      ? "ön"
      : heading === 90
        ? "sağ"
        : heading === 180
          ? "arka"
          : heading === 270
            ? "sol"
            : `${heading}°`;
  return { heading, label };
});

/** Mevcut heading hangi ana yöne düşer (±45°). */
export function headingToSector(heading: number): string {
  const h = ((Math.round(heading) % 360) + 360) % 360;
  if (h >= 315 || h < 45) return "ön";
  if (h < 135) return "sağ";
  if (h < 225) return "arka";
  return "sol";
}

export function streetViewProxyUrl(
  lat: number,
  lng: number,
  heading = 0,
  size?: string,
): string {
  const q = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    heading: String(heading),
  });
  if (size) q.set("size", size);
  return `/api/streetview?${q.toString()}`;
}

export type StreetViewParams = {
  lat: number;
  lng: number;
  size?: string;
  fov?: number;
  heading?: number;
  pitch?: number;
  source?: string;
};

/**
 * Returns true when Google has Street View imagery for the location.
 * Used to reject coordinates with no panorama before running detection.
 */
export async function hasStreetViewImagery(
  lat: number,
  lng: number,
): Promise<boolean> {
  const key = process.env.GOOGLE_STREET_VIEW_API_KEY ?? "";
  const params = new URLSearchParams({ location: `${lat},${lng}`, key });
  try {
    const res = await fetchWithRetry(`${STREET_VIEW_META}?${params.toString()}`);
    const body = await res.json();
    return body?.status === "OK";
  } catch {
    return false;
  }
}

/**
 * Builds a Google Street View Static API image URL for a location.
 * The API key is read from the server-only env var and never exposed to the client.
 */
export function buildStreetViewUrl({
  lat,
  lng,
  size = getStreetViewSize(),
  fov = 90,
  heading = 0,
  pitch = 0,
  source,
}: StreetViewParams): string {
  const key = process.env.GOOGLE_STREET_VIEW_API_KEY ?? "";
  const params = new URLSearchParams({
    size: clampSize(size),
    location: `${lat},${lng}`,
    fov: String(fov),
    heading: String(heading),
    pitch: String(pitch),
    key,
  });
  // Yalnızca analiz çağrısında outdoor zorlanır; UI'da varsayılan (en iyi mevcut)
  // panorama korunur, böylece iç-mekan-only konumlarda gri görüntü oluşmaz.
  if (source) params.set("source", source);
  return `${STREET_VIEW_BASE}?${params.toString()}`;
}
