/**
 * Grounding DINO — HF Inference Endpoints üzerinden zero-shot tespit.
 *
 * Kurulum:
 * 1. https://huggingface.co/inference-endpoints → GPU endpoint oluştur
 * 2. Model: IDEA-Research/grounding-dino-base (veya tiny)
 * 3. HF_GROUNDING_DINO_ENDPOINT=https://xxx.aws.endpoints.huggingface.cloud
 */

import { isPollutionLabel } from "@/features/analyze/detectionFilters";
import { URBAN_QUERY_LABELS } from "@/features/analyze/urbanQueries";
import type { HFDetection } from "@/services/huggingFaceService";

function endpointUrl(): string | null {
  const url = process.env.HF_GROUNDING_DINO_ENDPOINT?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

function threshold(): number {
  const v = Number(process.env.HF_GROUNDING_DINO_THRESHOLD ?? "0.32");
  return Number.isFinite(v) ? v : 0.32;
}

function dinoTextPrompt(): string {
  return URBAN_QUERY_LABELS.map((q) => q.replace(/\./g, "")).join(" . ");
}

function normalizeBox(
  raw: Record<string, unknown>,
): { xmin: number; ymin: number; xmax: number; ymax: number } {
  const box = (raw.box ?? raw) as Record<string, number>;
  return {
    xmin: Number(box.xmin ?? 0),
    ymin: Number(box.ymin ?? 0),
    xmax: Number(box.xmax ?? 0),
    ymax: Number(box.ymax ?? 0),
  };
}

function parseDinoResponse(data: unknown, floor: number): HFDetection[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      const r = item as Record<string, unknown>;
      const label = String(r.label ?? "");
      const score = Number(r.score ?? 0);
      if (!label || !Number.isFinite(score)) return null;
      return { label, score, box: normalizeBox(r) };
    })
    .filter(
      (d): d is HFDetection =>
        d !== null && d.score >= floor && isPollutionLabel(d.label),
    )
    .sort((a, b) => b.score - a.score);
}

export function isGroundingDinoEnabled(): boolean {
  return Boolean(endpointUrl() && process.env.HUGGINGFACE_API_TOKEN);
}

/**
 * Grounding DINO endpoint ile tek görüntü tespiti.
 * Endpoint yoksa boş dizi döner (OWL yedek devreye girer).
 */
export async function detectWithGroundingDino(
  imageBytes: ArrayBuffer,
): Promise<HFDetection[]> {
  const endpoint = endpointUrl();
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!endpoint || !token) return [];

  const base64 = Buffer.from(imageBytes).toString("base64");
  const floor = threshold();
  const text = dinoTextPrompt();

  const bodies = [
    { inputs: { image: base64, text } },
    { inputs: base64, parameters: { text, threshold: floor } },
    {
      inputs: { image: base64, candidate_labels: URBAN_QUERY_LABELS },
      parameters: { threshold: floor },
    },
  ];

  for (const body of bodies) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const parsed = parseDinoResponse(data, floor);
      if (parsed.length > 0) return parsed.slice(0, 24);
    } catch {
      /* sonraki format */
    }
  }

  return [];
}
