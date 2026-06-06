import type { PriorityLevel } from "@/types/api";

export const priorityLabel: Record<PriorityLevel, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

export const priorityColor: Record<PriorityLevel, string> = {
  low: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  medium: "bg-amber-100 text-amber-700 ring-amber-600/20",
  high: "bg-orange-100 text-orange-700 ring-orange-600/20",
  critical: "bg-red-100 text-red-700 ring-red-600/20",
};

export function densityBarColor(score: number): string {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-emerald-500";
}
