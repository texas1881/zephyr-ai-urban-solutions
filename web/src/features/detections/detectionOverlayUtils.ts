import { SITUATION_LABEL, type SituationType } from "@/features/analyze/situations";
import { URBAN_DETECTION_QUERIES } from "@/features/analyze/urbanQueries";

export type DetectionBox = {
  label: string;
  score: number;
  /** Normalize 0–1 */
  x: number;
  y: number;
  w: number;
  h: number;
  situationType?: SituationType;
};

export type DirectionDetectionOverlay = {
  direction: string;
  heading: number;
  boxes: DetectionBox[];
};

const BIN_MIN_DISPLAY = 0.42;
const DEFAULT_MIN_DISPLAY = 0.28;

function matchSituationHint(label: string): SituationType | undefined {
  const lower = label.toLowerCase().trim();
  return URBAN_DETECTION_QUERIES.find((q) => q.query.toLowerCase() === lower)
    ?.situationHint;
}

function isBinLabel(label: string): boolean {
  return matchSituationHint(label) === "dolu_cop_kutusu";
}

/** UI'da gösterilecek kutular — çöp kutusu için daha yüksek eşik */
export function passesDisplayGate(label: string, score: number): boolean {
  if (isBinLabel(label)) return score >= BIN_MIN_DISPLAY;
  return score >= DEFAULT_MIN_DISPLAY;
}

export function boxColor(label: string): string {
  const hint = matchSituationHint(label);
  if (hint === "dolu_cop_kutusu") return "rgba(255, 180, 80, 0.92)";
  if (hint === "cop_kirliligi" || hint === "asiri_kirli") return "rgba(255, 255, 255, 0.9)";
  if (hint) return "rgba(200, 200, 210, 0.85)";
  return "rgba(255, 255, 255, 0.75)";
}

export function boxLabelTr(label: string): string {
  const hint = matchSituationHint(label);
  if (hint) return SITUATION_LABEL[hint];
  return label.length > 28 ? `${label.slice(0, 26)}…` : label;
}
