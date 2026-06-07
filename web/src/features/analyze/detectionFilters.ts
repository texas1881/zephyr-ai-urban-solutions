/**
 * Kirlilik tespiti — allowlist yaklaşımı.
 * Yalnızca OWL kentsel sorguları veya sıkı COCO atık proxy'leri kabul edilir.
 */

import { LITTER_LABELS } from "@/features/analyze/labels";
import { URBAN_QUERY_LABELS } from "@/features/analyze/urbanQueries";

const URBAN_QUERY_LOWER = new Set(
  URBAN_QUERY_LABELS.map((q) => q.toLowerCase()),
);

/** Kişisel eşya / bağlam — asla kirlilik sayılmaz. */
const NON_POLLUTION_LABELS = new Set([
  "handbag",
  "backpack",
  "suitcase",
  "book",
  "tie",
  "umbrella",
  "cell phone",
  "remote",
  "keyboard",
  "mouse",
  "tv",
  "laptop",
  "microwave",
  "oven",
  "toaster",
  "sink",
  "refrigerator",
  "clock",
  "vase",
  "scissors",
  "teddy bear",
  "hair drier",
  "toothbrush",
  "fork",
  "knife",
  "spoon",
  "banana",
  "apple",
  "orange",
  "sandwich",
  "pizza",
  "donut",
  "cake",
  "car",
  "truck",
  "bus",
  "motorcycle",
  "bicycle",
  "train",
  "boat",
  "airplane",
  "person",
  "bird",
  "cat",
  "dog",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "traffic light",
  "fire hydrant",
  "stop sign",
  "parking meter",
  "bench",
  "skis",
  "snowboard",
  "sports ball",
  "kite",
  "baseball bat",
  "baseball glove",
  "skateboard",
  "surfboard",
  "tennis racket",
  "frisbee",
  "potted plant",
  "chair",
  "couch",
]);

const FORBIDDEN_TEXT =
  /\b(car|cars|vehicle|vehicles|truck|bus|motorcycle|bicycle|bike|person|people|pedestrian|handbag|backpack|suitcase|book|araç|otomobil|kamyon|otobüs|motosiklet|bisiklet|insan|yaya|çanta|el\s*çantası|sırt\s*çantası|valiz|park\s+etmiş)\b/i;

export function isUrbanQueryLabel(label: string): boolean {
  return URBAN_QUERY_LOWER.has(label.toLowerCase().trim());
}

export function isLitterCocoLabel(label: string): boolean {
  return LITTER_LABELS.has(label.toLowerCase().trim());
}

/** OWL kentsel sorgusu veya sıkı COCO atık etiketi mi? */
export function isPollutionLabel(label: string): boolean {
  const lower = label.toLowerCase().trim();
  if (NON_POLLUTION_LABELS.has(lower)) return false;
  if (FORBIDDEN_TEXT.test(lower)) return false;
  return isUrbanQueryLabel(lower) || isLitterCocoLabel(lower);
}

export function isPollutionSituationText(text: string): boolean {
  if (!text || FORBIDDEN_TEXT.test(text)) return false;
  return true;
}
