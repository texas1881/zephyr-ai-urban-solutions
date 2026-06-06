/**
 * Shared, dependency-free label helpers used by both server (detection /
 * assessment) and client (result view).
 *
 * The detection model is COCO-pretrained, so it returns generic objects.
 * We treat ONLY disposable/consumable items as litter proxies. People,
 * vehicles, street furniture and infrastructure (fire hydrant, bench,
 * traffic light, ...) are context — NOT pollution.
 */

/** COCO labels that act as litter / waste proxies. */
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
  "pizza",
  "donut",
  "cake",
  "fork",
  "knife",
  "spoon",
]);

const LABEL_TR: Record<string, string> = {
  person: "kişi",
  bicycle: "bisiklet",
  car: "araç",
  motorcycle: "motosiklet",
  bus: "otobüs",
  truck: "kamyon",
  train: "tren",
  boat: "tekne",
  "traffic light": "trafik ışığı",
  "fire hydrant": "yangın musluğu",
  "stop sign": "dur tabelası",
  "parking meter": "parkmetre",
  bench: "bank",
  bird: "kuş",
  cat: "kedi",
  dog: "köpek",
  backpack: "sırt çantası",
  handbag: "el çantası",
  suitcase: "valiz",
  umbrella: "şemsiye",
  "potted plant": "saksı bitki",
  bottle: "şişe",
  cup: "bardak",
  "wine glass": "kadeh",
  bowl: "kase",
  can: "teneke kutu",
  banana: "muz",
  apple: "elma",
  orange: "portakal",
  sandwich: "sandviç",
  pizza: "pizza",
  donut: "çörek",
  cake: "pasta",
  fork: "çatal",
  knife: "bıçak",
  spoon: "kaşık",
};

/** People / vehicles counted as activity context (not pollution). */
const CONTEXT_PEOPLE = new Set(["person"]);
const CONTEXT_VEHICLES = new Set([
  "car",
  "bus",
  "truck",
  "motorcycle",
  "bicycle",
  "train",
]);

export function isLitter(label: string): boolean {
  return LITTER_LABELS.has(label);
}

export function isPerson(label: string): boolean {
  return CONTEXT_PEOPLE.has(label);
}

export function isVehicle(label: string): boolean {
  return CONTEXT_VEHICLES.has(label);
}

export function labelTr(label: string): string {
  return LABEL_TR[label] ?? label;
}
