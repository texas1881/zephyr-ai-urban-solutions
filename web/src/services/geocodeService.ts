const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json";

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
};

/** Demo fallback locations (Başakşehir / İstanbul) used when geocoding
 * is unavailable, so the live demo always returns a coordinate. */
const FALLBACK_LOCATIONS: { match: string; result: GeocodeResult }[] = [
  {
    match: "başakşehir",
    result: { lat: 41.0935, lng: 28.802, formattedAddress: "Başakşehir, İstanbul" },
  },
  {
    match: "kayaşehir",
    result: { lat: 41.114, lng: 28.766, formattedAddress: "Kayaşehir, İstanbul" },
  },
  {
    match: "taksim",
    result: { lat: 41.0369, lng: 28.985, formattedAddress: "Taksim, İstanbul" },
  },
  {
    match: "kadıköy",
    result: { lat: 40.9903, lng: 29.0277, formattedAddress: "Kadıköy, İstanbul" },
  },
];

function fallbackGeocode(address: string): GeocodeResult {
  const key = address.toLocaleLowerCase("tr-TR");
  const hit = FALLBACK_LOCATIONS.find((f) => key.includes(f.match));
  return (
    hit?.result ?? {
      lat: 41.0082,
      lng: 28.9784,
      formattedAddress: address || "İstanbul",
    }
  );
}

/**
 * Converts a free-text address into coordinates via the Google Geocoding API.
 * Falls back to a small built-in location table when no API key is configured
 * or the request fails, so the demo keeps working.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const key = process.env.GOOGLE_STREET_VIEW_API_KEY;
  if (!key) {
    return fallbackGeocode(address);
  }

  try {
    const params = new URLSearchParams({
      address,
      key,
      region: "tr",
      language: "tr",
    });
    const res = await fetch(`${GEOCODE_BASE}?${params.toString()}`);
    const body = await res.json();

    if (body.status !== "OK" || !body.results?.length) {
      return fallbackGeocode(address);
    }

    const top = body.results[0];
    return {
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
      formattedAddress: top.formatted_address ?? address,
    };
  } catch {
    return fallbackGeocode(address);
  }
}
