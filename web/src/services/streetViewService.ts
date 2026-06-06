const STREET_VIEW_BASE = "https://maps.googleapis.com/maps/api/streetview";
const STREET_VIEW_META = "https://maps.googleapis.com/maps/api/streetview/metadata";

/** Headings scanned at each location: front / right / back / left. */
export const SCAN_DIRECTIONS = [
  { heading: 0, label: "ön" },
  { heading: 90, label: "sağ" },
  { heading: 180, label: "arka" },
  { heading: 270, label: "sol" },
] as const;

export type StreetViewParams = {
  lat: number;
  lng: number;
  size?: string;
  fov?: number;
  heading?: number;
  pitch?: number;
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
    const res = await fetch(`${STREET_VIEW_META}?${params.toString()}`);
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
  size = "640x640",
  fov = 90,
  heading = 0,
  pitch = 0,
}: StreetViewParams): string {
  const key = process.env.GOOGLE_STREET_VIEW_API_KEY ?? "";
  const params = new URLSearchParams({
    size,
    location: `${lat},${lng}`,
    fov: String(fov),
    heading: String(heading),
    pitch: String(pitch),
    key,
  });
  return `${STREET_VIEW_BASE}?${params.toString()}`;
}
