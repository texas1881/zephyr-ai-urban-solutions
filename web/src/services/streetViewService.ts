const STREET_VIEW_BASE = "https://maps.googleapis.com/maps/api/streetview";

export type StreetViewParams = {
  lat: number;
  lng: number;
  size?: string;
  fov?: number;
  heading?: number;
  pitch?: number;
};

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
