/**
 * Hugging Face Serverless Inference — görüntü tanıma katmanı.
 *
 * Birincil: zero-shot nesne tespiti (OWLv2-large) kentsel sorgularla.
 * Yedek: COCO DETR nesne tespiti.
 */

import { LITTER_LABELS } from "@/features/analyze/labels";
import { URBAN_QUERY_LABELS } from "@/features/analyze/urbanQueries";

const HF_ROUTER = "https://router.huggingface.co/hf-inference/models";

/** Zero-shot görüntü tanıma — yüksek kapasiteli OWLv2. */
const DEFAULT_VISION_MODEL = "google/owlv2-large-patch14-ensemble";
/** Klasik nesne tespiti yedeği. */
const DEFAULT_DETR_MODEL = "facebook/detr-resnet-101";

export type HFDetection = {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
};

export type DetectionSummary = {
  litterCount: number;
  densityScore: number;
  rawDetections: HFDetection[];
};

export type DirectionImageInput = {
  label: string;
  heading: number;
  base64: string;
  mimeType: string;
};

export type DirectionDetections = {
  label: string;
  heading: number;
  detections: HFDetection[];
};

function visionModel(): string {
  return (
    process.env.HF_VISION_DETECTION_MODEL ||
    process.env.HF_DETECTION_MODEL ||
    DEFAULT_VISION_MODEL
  );
}

function detrModel(): string {
  return process.env.HF_DETR_MODEL || DEFAULT_DETR_MODEL;
}

function minVisionScore(): number {
  const v = Number(process.env.HF_DETECTION_THRESHOLD ?? "0.32");
  return Number.isFinite(v) ? v : 0.32;
}

async function postInference(
  model: string,
  body: unknown,
): Promise<unknown> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error("HUGGINGFACE_API_TOKEN is not configured");

  const res = await fetch(`${HF_ROUTER}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HF inference failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
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

function parseDetectionArray(data: unknown): HFDetection[] {
  if (!Array.isArray(data)) return [];
  const minScore = minVisionScore();
  return data
    .map((item) => {
      const r = item as Record<string, unknown>;
      const label = String(r.label ?? "");
      const score = Number(r.score ?? 0);
      if (!label || !Number.isFinite(score)) return null;
      return { label, score, box: normalizeBox(r) };
    })
    .filter((d): d is HFDetection => d !== null && d.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/**
 * Zero-shot kentsel nesne tespiti — OWLv2 / OWL-ViT üzerinde eğitilmiş
 * görüntü tanıma modeli, önceden tanımlı kentsel sorgularla çalışır.
 */
export async function detectUrbanObjects(
  imageBytes: ArrayBuffer,
): Promise<HFDetection[]> {
  const base64 = Buffer.from(imageBytes).toString("base64");
  const threshold = minVisionScore();
  const model = visionModel();

  // Format A: inputs + parameters.candidate_labels (OWL zero-shot)
  try {
    const data = await postInference(model, {
      inputs: {
        image: base64,
        candidate_labels: URBAN_QUERY_LABELS,
      },
      parameters: { threshold },
    });
    const parsed = parseDetectionArray(data);
    if (parsed.length > 0) return parsed.slice(0, 24);
  } catch {
    /* try format B */
  }

  // Format B: raw base64 + candidate_labels in parameters
  try {
    const data = await postInference(model, {
      inputs: base64,
      parameters: { threshold, candidate_labels: URBAN_QUERY_LABELS },
    });
    const parsed = parseDetectionArray(data);
    if (parsed.length > 0) return parsed.slice(0, 24);
  } catch {
    /* fall through to DETR */
  }

  return detectObjects(imageBytes, threshold);
}

/**
 * Klasik COCO nesne tespiti (DETR) — zero-shot başarısız olursa yedek.
 */
export async function detectObjects(
  imageBytes: ArrayBuffer,
  threshold = 0.3,
): Promise<HFDetection[]> {
  const base64 = Buffer.from(imageBytes).toString("base64");
  const data = await postInference(detrModel(), {
    inputs: base64,
    parameters: { threshold },
  });
  return parseDetectionArray(data);
}

/**
 * Ham tespitleri çöp sayısı ve yoğunluk skoruna çevirir (DETR yolu için).
 */
export function summarizeDetections(
  detections: Array<{ label: string; score: number }>,
): DetectionSummary {
  const litterCount = detections.filter((d) =>
    LITTER_LABELS.has(d.label),
  ).length;
  const densityScore = Math.min(100, Math.round((litterCount / 7) * 100));
  return {
    litterCount,
    densityScore,
    rawDetections: detections as HFDetection[],
  };
}
