/** Etiketler ve metinler — kirlilik DEĞİL, asla durum üretme. */

const NON_POLLUTION_LABELS = new Set([
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
  "umbrella",
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
  "tie",
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
]);

const FORBIDDEN_TEXT =
  /\b(car|cars|vehicle|vehicles|truck|bus|motorcycle|bicycle|bike|person|people|pedestrian|araç|otomobil|kamyon|otobüs|motosiklet|bisiklet|insan|yaya|park\s+etmiş)\b/i;

export function isPollutionLabel(label: string): boolean {
  const lower = label.toLowerCase().trim();
  if (NON_POLLUTION_LABELS.has(lower)) return false;
  if (FORBIDDEN_TEXT.test(lower)) return false;
  return true;
}

export function isPollutionSituationText(text: string): boolean {
  if (!text || FORBIDDEN_TEXT.test(text)) return false;
  return true;
}
