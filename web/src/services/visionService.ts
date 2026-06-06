import type { LabeledCount } from "@/types/api";

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

export type VisionImageInput = {
  label: string;
  heading: number;
  base64: string;
};

export type VisionAnalysis = {
  densityScore: number;
  cleanliness: string;
  litterItems: LabeledCount[];
  contextItems: LabeledCount[];
  comment: string;
  cityOrder: string;
};

type RawDetection = { name: string; score: number };

/** Vision label/object names (lowercased) that indicate litter / pollution. */
const WASTE_KEYWORDS = [
  "litter",
  "garbage",
  "waste",
  "trash",
  "rubbish",
  "debris",
  "junk",
  "dump",
  "landfill",
  "pollution",
  "rubble",
  "scrap",
  "plastic bag",
  "plastic bottle",
  "bottle",
  "tin can",
  "can",
  "packaging",
  "packaged goods",
  "cardboard",
  "waste container",
  "dumpster",
  "graffiti",
  "sewage",
  "mud",
];

/** Context labels (lowercased) that are NOT pollution. */
const CONTEXT_KEYWORDS = [
  "person",
  "pedestrian",
  "people",
  "car",
  "vehicle",
  "bus",
  "truck",
  "bicycle",
  "motorcycle",
  "wheel",
  "tire",
  "building",
  "house",
  "tower block",
  "road",
  "street",
  "asphalt",
  "sidewalk",
  "lane",
  "tree",
  "plant",
  "sky",
  "cloud",
  "traffic light",
  "street light",
  "bench",
  "fire hydrant",
];

const TR: Record<string, string> = {
  litter: "çöp",
  garbage: "çöp",
  waste: "atık",
  trash: "çöp",
  rubbish: "çöp",
  debris: "moloz",
  junk: "hurda",
  dump: "çöp yığını",
  landfill: "çöplük",
  pollution: "kirlilik",
  rubble: "moloz",
  scrap: "hurda",
  "plastic bag": "plastik poşet",
  "plastic bottle": "plastik şişe",
  bottle: "şişe",
  "tin can": "teneke kutu",
  can: "teneke kutu",
  packaging: "ambalaj",
  "packaged goods": "ambalaj",
  cardboard: "karton",
  "waste container": "çöp konteyneri",
  dumpster: "çöp konteyneri",
  graffiti: "grafiti",
  sewage: "kanalizasyon",
  mud: "çamur",
  person: "yaya",
  pedestrian: "yaya",
  people: "yaya",
  car: "araç",
  vehicle: "araç",
  bus: "otobüs",
  truck: "kamyon",
  bicycle: "bisiklet",
  motorcycle: "motosiklet",
  wheel: "tekerlek",
  tire: "lastik",
  building: "bina",
  house: "ev",
  "tower block": "apartman",
  road: "yol",
  street: "sokak",
  asphalt: "asfalt",
  sidewalk: "kaldırım",
  lane: "şerit",
  tree: "ağaç",
  plant: "bitki",
  sky: "gökyüzü",
  cloud: "bulut",
  "traffic light": "trafik ışığı",
  "street light": "sokak lambası",
  bench: "bank",
  "fire hydrant": "yangın musluğu",
};

function tr(name: string): string {
  return TR[name.toLowerCase()] ?? name.toLowerCase();
}

function matches(name: string, keywords: string[]): boolean {
  const n = name.toLowerCase();
  return keywords.some((k) => n === k || n.includes(k));
}

function aggregate(
  detections: RawDetection[],
  keywords: string[],
): LabeledCount[] {
  const counts = new Map<string, number>();
  for (const d of detections) {
    if (!matches(d.name, keywords)) continue;
    const label = tr(d.name);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function cleanlinessFromScore(score: number): string {
  if (score >= 60) return "Kirli";
  if (score >= 25) return "Orta";
  return "Temiz";
}

async function annotateImage(
  key: string,
  base64: string,
): Promise<RawDetection[]> {
  const res = await fetch(`${VISION_ENDPOINT}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [
            { type: "LABEL_DETECTION", maxResults: 25 },
            { type: "OBJECT_LOCALIZATION", maxResults: 25 },
          ],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Vision ${res.status}: ${await res.text()}`);

  const body = await res.json();
  const r = body?.responses?.[0] ?? {};
  if (r.error) throw new Error(`Vision error: ${r.error.message}`);

  const labels: RawDetection[] = (r.labelAnnotations ?? []).map(
    (l: { description: string; score: number }) => ({
      name: l.description,
      score: l.score,
    }),
  );
  const objects: RawDetection[] = (r.localizedObjectAnnotations ?? []).map(
    (o: { name: string; score: number }) => ({ name: o.name, score: o.score }),
  );
  return [...labels, ...objects];
}

/**
 * Analyzes the four direction images with the Google Cloud Vision API
 * (LABEL_DETECTION + OBJECT_LOCALIZATION) and derives a cleanliness/pollution
 * assessment. Throws when the API key is missing or all requests fail.
 */
export async function analyzeImagesWithVision(
  address: string,
  directions: VisionImageInput[],
): Promise<VisionAnalysis> {
  const key =
    process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_STREET_VIEW_API_KEY;
  if (!key) throw new Error("Google Vision API anahtarı yok");

  const perDirection = await Promise.all(
    directions.map((d) => annotateImage(key, d.base64)),
  );
  const all = perDirection.flat();
  if (all.length === 0) throw new Error("Vision boş sonuç döndürdü");

  const wasteDetections = all.filter((d) => matches(d.name, WASTE_KEYWORDS));
  const litterItems = aggregate(all, WASTE_KEYWORDS);
  const contextItems = aggregate(all, CONTEXT_KEYWORDS);

  const wasteScoreSum = wasteDetections.reduce((s, d) => s + d.score, 0);
  const densityScore = Math.min(100, Math.round(wasteScoreSum * 28));
  const cleanliness = cleanlinessFromScore(densityScore);

  const litterTotal = litterItems.reduce((s, i) => s + i.count, 0);
  const orderly = all.some((d) =>
    ["road", "street", "sidewalk", "asphalt", "urban area"].includes(
      d.name.toLowerCase(),
    ),
  );
  const cityOrder = orderly
    ? "Belirgin yol/kaldırım yapısı ile düzenli kentsel doku."
    : "Kentsel doku sınırlı ölçüde görüntülenebildi.";

  let comment: string;
  if (litterTotal === 0) {
    comment = `${address} bölgesinde dört yönün görsel analizinde belirgin çöp veya kirlilik tespit edilmedi; bölge temiz görünüyor.`;
  } else {
    const list = litterItems
      .slice(0, 5)
      .map((i) => `${i.label} ×${i.count}`)
      .join(", ");
    const oneri =
      cleanliness === "Kirli"
        ? "öncelikli temizlik önerilir"
        : "periyodik kontrol uygundur";
    comment = `${address} bölgesinde çevresel kirlilik göstergeleri tespit edildi (${list}); ${oneri}. Temizlik durumu: ${cleanliness}.`;
  }

  return {
    densityScore,
    cleanliness,
    litterItems,
    contextItems,
    comment,
    cityOrder,
  };
}
