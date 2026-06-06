/**
 * Hugging Face Serverless Inference API client for object detection.
 *
 * No model training is required: we call a hosted, pre-trained
 * object-detection model and map the returned objects to litter classes.
 * Default model is COCO-pretrained DETR; it can be swapped for a
 * TACO-finetuned litter model via HF_DETECTION_MODEL.
 */

const HF_ROUTER = "https://router.huggingface.co/hf-inference/models";

const DEFAULT_MODEL = "facebook/detr-resnet-50";

/** COCO labels that act as litter / waste proxies for the demo. */
export const LITTER_LABELS = new Set<string>([
  "bottle",
  "cup",
  "wine glass",
  "bowl",
  "can",
  "banana",
  "apple",
  "orange",
  "sandwich",
]);

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
 * Throws if the HF token is missing or the request fails.
 */
export async function detectObjects(
  imageBytes: ArrayBuffer,
  threshold = 0.5,
): Promise<HFDetection[]> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    throw new Error("HUGGINGFACE_API_TOKEN is not configured");
  }

  const res = await fetch(`${HF_ROUTER}/${getModel()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: imageBytes,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`HF inference failed (${res.status}): ${detail}`);
  }

  const detections = (await res.json()) as HFDetection[];
  return detections.filter((d) => d.score >= threshold);
}

/**
 * Converts raw detections into a litter count and a 0-100 density score.
 * The score saturates at 20 litter objects per image.
 */
export function summarizeDetections(detections: HFDetection[]): DetectionSummary {
  const litter = detections.filter((d) => LITTER_LABELS.has(d.label));
  const litterCount = litter.length;
  const densityScore = Math.min(100, Math.round((litterCount / 20) * 100));
  return { litterCount, densityScore, rawDetections: detections };
}
