/**
 * Hugging Face Serverless Inference — görüntü tanıma katmanı.
 * Zero-shot (OWL) + DETR paralel çalışır, sonuçlar birleştirilir.
 */

import { isPollutionLabel } from "@/features/analyze/detectionFilters";
import { LITTER_LABELS } from "@/features/analyze/labels";
import {
  URBAN_DETECTION_QUERIES,
  URBAN_QUERY_LABELS,
} from "@/features/analyze/urbanQueries";
import {
  detectWithGroundingDino,
  isGroundingDinoEnabled,
} from "@/services/groundingDinoService";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import {
  isHfCreditsError,
  isHfModelUnsupported,
} from "@/services/aiPipelineErrors";

const BIN_QUERY_LABELS = URBAN_DETECTION_QUERIES.filter(
  (q) => q.situationHint === "dolu_cop_kutusu",
).map((q) => q.query);

const BIN_DETECTION_THRESHOLD = 0.42;
const SURFACE_RECALL_THRESHOLD = 0.18;

const SURFACE_QUERY_LABELS = URBAN_DETECTION_QUERIES.filter((q) =>
  ["grafiti", "kaldirim_isgali", "moloz_hafriyat", "cop_kirliligi", "asiri_kirli"].includes(
    q.situationHint,
  ),
)
  .map((q) => q.query)
  .filter((q) => !BIN_QUERY_LABELS.includes(q));

const HF_ROUTER = "https://router.huggingface.co/hf-inference/models";

const DEFAULT_VISION_MODEL = "google/owlv2-large-patch14-ensemble";
const FALLBACK_OWL_MODELS = [
  "google/owlv2-base-patch16-ensemble",
  "google/owlvit-base-patch32",
];
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
  const v = Number(process.env.HF_DETECTION_THRESHOLD ?? "0.22");
  return Number.isFinite(v) ? v : 0.22;
}

async function postInference(model: string, body: unknown): Promise<unknown> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error("HUGGINGFACE_API_TOKEN is not configured");

  const res = await fetchWithRetry(`${HF_ROUTER}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    if (isHfCreditsError(res.status, detail)) {
      throw new Error(`HF_CREDITS_EXHAUSTED: ${detail.slice(0, 200)}`);
    }
    if (isHfModelUnsupported(res.status, detail)) {
      throw new Error(`HF_MODEL_UNSUPPORTED: ${detail.slice(0, 200)}`);
    }
    throw new Error(`HF inference failed (${res.status}): ${detail.slice(0, 240)}`);
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

function parseDetectionArray(
  data: unknown,
  minScore?: number,
): HFDetection[] {
  if (!Array.isArray(data)) return [];
  const floor = minScore ?? minVisionScore();
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

function mergeDetections(lists: HFDetection[][]): HFDetection[] {
  const best = new Map<string, HFDetection>();
  for (const list of lists) {
    for (const d of list) {
      const key = d.label.toLowerCase();
      const prev = best.get(key);
      if (!prev || d.score > prev.score) best.set(key, d);
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score);
}

async function tryZeroShotModel(
  model: string,
  base64: string,
  threshold: number,
): Promise<HFDetection[]> {
  const attempts = [
    {
      inputs: { image: base64, candidate_labels: URBAN_QUERY_LABELS },
      parameters: { threshold },
    },
    {
      inputs: base64,
      parameters: { threshold, candidate_labels: URBAN_QUERY_LABELS },
    },
  ];

  for (const body of attempts) {
    try {
      const data = await postInference(model, body);
      const parsed = parseDetectionArray(data, threshold);
      if (parsed.length > 0) return parsed;
    } catch {
      /* next format */
    }
  }
  return [];
}

/** Çöp kutusu — düşük eşik, yalnızca bin sorguları (hassas mod). */
async function detectTrashBins(imageBytes: ArrayBuffer): Promise<HFDetection[]> {
  const base64 = Buffer.from(imageBytes).toString("base64");
  const threshold = BIN_DETECTION_THRESHOLD;
  const models = [visionModel(), ...FALLBACK_OWL_MODELS.filter((m) => m !== visionModel())];

  for (const model of models) {
    const attempts = [
      {
        inputs: { image: base64, candidate_labels: BIN_QUERY_LABELS },
        parameters: { threshold },
      },
      {
        inputs: base64,
        parameters: { threshold, candidate_labels: BIN_QUERY_LABELS },
      },
    ];
    for (const body of attempts) {
      try {
        const data = await postInference(model, body);
        const parsed = parseDetectionArray(data, threshold);
        if (parsed.length > 0) return parsed.slice(0, 8);
      } catch {
        /* next */
      }
    }
  }
  return [];
}

/** Grafiti, kaldırım işgali ve atık — düşük eşikli ikinci tarama. */
async function detectSurfaceRecall(
  imageBytes: ArrayBuffer,
): Promise<HFDetection[]> {
  const base64 = Buffer.from(imageBytes).toString("base64");
  const threshold = SURFACE_RECALL_THRESHOLD;
  const models = [visionModel(), ...FALLBACK_OWL_MODELS.filter((m) => m !== visionModel())];

  for (const model of models) {
    const attempts = [
      {
        inputs: { image: base64, candidate_labels: SURFACE_QUERY_LABELS },
        parameters: { threshold },
      },
      {
        inputs: base64,
        parameters: { threshold, candidate_labels: SURFACE_QUERY_LABELS },
      },
    ];
    for (const body of attempts) {
      try {
        const data = await postInference(model, body);
        const parsed = parseDetectionArray(data, threshold);
        if (parsed.length > 0) return parsed.slice(0, 16);
      } catch {
        /* next */
      }
    }
  }
  return [];
}

async function detectZeroShot(imageBytes: ArrayBuffer): Promise<HFDetection[]> {
  const base64 = Buffer.from(imageBytes).toString("base64");
  const threshold = minVisionScore();
  const models = [visionModel(), ...FALLBACK_OWL_MODELS.filter((m) => m !== visionModel())];

  for (const model of models) {
    const hits = await tryZeroShotModel(model, base64, threshold);
    if (hits.length > 0) return hits.slice(0, 24);
  }
  return [];
}

/**
 * Grounding DINO (endpoint) + OWL + DETR paralel — en iyi sonuçları birleştirir.
 */
export async function detectUrbanObjects(
  imageBytes: ArrayBuffer,
): Promise<HFDetection[]> {
  const threshold = minVisionScore();
  const jobs: Promise<HFDetection[]>[] = [];

  if (isGroundingDinoEnabled()) {
    jobs.push(detectWithGroundingDino(imageBytes));
  }
  jobs.push(detectTrashBins(imageBytes));
  jobs.push(detectSurfaceRecall(imageBytes));
  jobs.push(detectZeroShot(imageBytes));
  jobs.push(detectObjects(imageBytes, Math.min(threshold, 0.2)));

  const results = await Promise.allSettled(jobs);
  const lists: HFDetection[][] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.length > 0) lists.push(r.value);
  }

  return mergeDetections(lists).slice(0, 30);
}

export async function detectObjects(
  imageBytes: ArrayBuffer,
  threshold = 0.2,
): Promise<HFDetection[]> {
  const base64 = Buffer.from(imageBytes).toString("base64");
  const data = await postInference(detrModel(), {
    inputs: base64,
    parameters: { threshold },
  });
  return parseDetectionArray(data, threshold);
}

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
