import type { PriorityLevel } from "@/types/api";

export const priorityLabel: Record<PriorityLevel, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

export const priorityColor: Record<PriorityLevel, string> = {
  low: "bg-slate-500/15 text-slate-300 ring-slate-400/25",
  medium: "bg-amber-500/12 text-amber-200 ring-amber-400/25",
  high: "bg-orange-500/12 text-orange-200 ring-orange-400/25",
  critical: "bg-red-500/12 text-red-200 ring-red-400/25",
};

export function densityBarColor(score: number): string {
  if (score >= 60) return "bg-red-500";
  if (score >= 25) return "bg-amber-400";
  return "bg-primary";
}

export function scoreToPriority(score: number): PriorityLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}
