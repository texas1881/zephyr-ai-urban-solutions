import type { AnalysisRecord, PriorityLevel } from "@/types/api";

export type RecordsStats = {
  total: number;
  avgDensity: number;
  totalObjects: number;
  byPriority: Record<PriorityLevel, number>;
};

export function computeRecordsStats(records: AnalysisRecord[]): RecordsStats {
  const total = records.length;
  const byPriority: Record<PriorityLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  let densitySum = 0;
  let totalObjects = 0;

  for (const r of records) {
    byPriority[r.priority] += 1;
    densitySum += r.densityScore;
    totalObjects += r.objects.length;
  }

  return {
    total,
    avgDensity: total === 0 ? 0 : Math.round(densitySum / total),
    totalObjects,
    byPriority,
  };
}
