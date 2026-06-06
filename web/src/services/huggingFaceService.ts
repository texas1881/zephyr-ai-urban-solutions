/**
 * Hugging Face Serverless Inference API client for object detection.
 *
 * No model training is required: we call a hosted, pre-trained
 * object-detection model and map the returned objects to litter classes.
 * Default model is COCO-pretrained DETR; it can be swapped for a
 * TACO-finetuned litter model via HF_DETECTION_MODEL.
 */

import { LITTER_LABELS } from "@/features/analyze/labels";

const HF_ROUTER = "https://router.huggingface.co/hf-inference/models";

const DEFAULT_MODEL = "facebook/detr-resnet-50";

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

function getModel(): string {
  return process.env.HF_DETECTION_MODEL || DEFAULT_MODEL;
}

/**
 * Runs object detection on raw image bytes via the HF Inference API.
 * Sends a JSON + base64 payload so we can pass a detection threshold.
 * Throws if the HF token is missing or the request fails.
 */
export async function detectObjects(
  imageBytes: ArrayBuffer,
  threshold = 0.3,
): Promise<HFDetection[]> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    throw new Error("HUGGINGFACE_API_TOKEN is not configured");
  }

  const base64 = Buffer.from(imageBytes).toString("base64");

  const res = await fetch(`${HF_ROUTER}/${getModel()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: base64, parameters: { threshold } }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`HF inference failed (${res.status}): ${detail}`);
  }

  const detections = (await res.json()) as HFDetection[];
  return detections.filter((d) => d.score >= threshold);
}

/**
 * Converts raw detections into a litter count and a 0-100 pollution score.
 *
 * The score is based ONLY on litter / waste proxies (bottle, cup, can, food
 * waste, ...). People, vehicles and street furniture are deliberately ignored
 * so that a busy-but-clean place (e.g. a crowded square) is not flagged as
 * polluted just because many people or cars were detected.
 */
export function summarizeDetections(
  detections: Array<{ label: string; score: number }>,
): DetectionSummary {
  const litterCount = detections.filter((d) => LITTER_LABELS.has(d.label)).length;
  // ~7 litter objects across the 4 scanned directions ≈ fully polluted.
  const densityScore = Math.min(100, Math.round((litterCount / 7) * 100));
  return {
    litterCount,
    densityScore,
    rawDetections: detections as HFDetection[],
  };
}
