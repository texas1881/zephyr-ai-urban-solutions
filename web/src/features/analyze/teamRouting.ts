import {
  SITUATION_TEAM,
  severityRank,
  type Severity,
  type SituationType,
} from "@/features/analyze/situations";

export type TeamRecommendation = {
  /** En yüksek öncelikli ekip */
  primary: string;
  /** Gerekli tüm ekipler (öncelik sırasıyla) */
  teams: string[];
  /** UI için birleşik metin */
  display: string;
};

const TEAM_ORDER = ["Temizlik Ekibi", "Yol Bakım Ekibi"] as const;

/**
 * Tüm tespitlere göre gerekli ekipleri hesaplar.
 * Tek ekip yerine çoklu ekip önerir (ör. Temizlik + Yol Bakım).
 */
export function recommendTeams(
  situations: Array<{
    type: SituationType;
    severity: Severity;
    confidence: number;
  }>,
): TeamRecommendation {
  const actionable = situations.filter((s) => s.type !== "temiz");
  if (actionable.length === 0) {
    return { primary: "—", teams: [], display: "—" };
  }

  const teamScores = new Map<string, number>();
  for (const s of actionable) {
    const team = SITUATION_TEAM[s.type];
    const score =
      severityRank(s.severity) * 10 * s.confidence + s.confidence;
    teamScores.set(team, (teamScores.get(team) ?? 0) + score);
  }

  const ranked = [...teamScores.entries()].sort((a, b) => b[1] - a[1]);
  const teams = TEAM_ORDER.filter((t) => teamScores.has(t));
  const extra = ranked
    .map(([t]) => t)
    .filter((t) => !teams.includes(t as (typeof TEAM_ORDER)[number]));
  const allTeams = [...teams, ...extra];

  const primary = ranked[0]?.[0] ?? "—";
  const display =
    allTeams.length > 1 ? allTeams.join(" + ") : primary;

  return { primary, teams: allTeams, display };
}

/** Ekip yönlendirme için tek ekip adı (birleşik display string'den ayrıştırır). */
export function resolvePrimaryTeam(
  recommendedTeam: string,
  recommendedTeams?: string[],
): string {
  if (recommendedTeams?.[0]) return recommendedTeams[0];
  if (!recommendedTeam || recommendedTeam === "—") return "—";
  const first = recommendedTeam.split(" + ")[0]?.trim();
  return first || recommendedTeam;
}

/** Geriye uyumluluk */
export function recommendTeam(
  situations: Array<{
    type: SituationType;
    severity: Severity;
    confidence?: number;
  }>,
): string {
  return recommendTeams(
    situations.map((s) => ({
      ...s,
      confidence: s.confidence ?? 0.7,
    })),
  ).display;
}
