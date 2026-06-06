import type { ApiResponse, DetectionPoint } from "@/types/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

/**
 * Fetches detection results. Falls back to the local mock API route
 * when no Go backend (masterfabric-go) URL is configured yet.
 */
export async function getDetections(): Promise<DetectionPoint[]> {
  const base = BACKEND_URL || "";
  const res = await fetch(`${base}/api/detections`, { cache: "no-store" });
  const body: ApiResponse<DetectionPoint[]> = await res.json();

  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
}
