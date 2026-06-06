const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json";

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
};

/**
 * Converts a free-text address into coordinates via the Google Geocoding API.
 * Returns `null` when the address cannot be resolved (e.g. random/garbage
 * input) so the caller can return a proper "not found" error instead of a
 * fake result.
 */
export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  const key = process.env.GOOGLE_STREET_VIEW_API_KEY;
  if (!key || !address.trim()) {
    return null;
  }

  const params = new URLSearchParams({
    address,
    key,
    region: "tr",
    language: "tr",
  });

  const res = await fetch(`${GEOCODE_BASE}?${params.toString()}`);
  const body = await res.json();

  if (body.status !== "OK" || !body.results?.length) {
    return null;
  }

  const top = body.results[0];
  return {
    lat: top.geometry.location.lat,
    lng: top.geometry.location.lng,
    formattedAddress: top.formatted_address ?? address,
  };
}
