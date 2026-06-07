import type { PriorityLevel } from "@/types/api";

export const priorityLabel: Record<PriorityLevel, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

export const priorityColor: Record<PriorityLevel, string> = {
  low: "bg-white/10 text-foreground/80 ring-white/20",
  medium: "bg-white/10 text-amber-300 ring-amber-400/30",
  high: "bg-white/10 text-orange-300 ring-orange-400/30",
  critical: "bg-white/10 text-red-300 ring-red-400/30",
};

export function densityBarColor(score: number): string {
  if (score >= 60) return "bg-red-400";
  if (score >= 25) return "bg-white/70";
  return "bg-white";
}

export function scoreToPriority(score: number): PriorityLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}
