// Shared situation taxonomy and team routing for cleanliness analysis.
// Used by both the Gemini detection service and the result UI.

export type SituationType =
  | "temiz"
  | "cop_kirliligi"
  | "asiri_kirli"
  | "dolu_cop_kutusu"
  | "yol_hasari"
  | "moloz_hafriyat"
  | "grafiti"
  | "kaldirim_isgali"
  | "bozuk_tabela"
  | "su_birikintisi"
  | "yabani_ot";

export type Severity = "dusuk" | "orta" | "yuksek" | "kritik";

export const SITUATION_LABEL: Record<SituationType, string> = {
  temiz: "Temiz",
  cop_kirliligi: "Çöp / kirlilik",
  asiri_kirli: "Aşırı kirli",
  dolu_cop_kutusu: "Dolu çöp kutusu",
  yol_hasari: "Yol hasarı",
  moloz_hafriyat: "Moloz / hafriyat",
  grafiti: "Grafiti",
  kaldirim_isgali: "Kaldırım işgali",
  bozuk_tabela: "Bozuk tabela / levha",
  su_birikintisi: "Su birikintisi",
  yabani_ot: "Yabani ot / bakımsızlık",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
  kritik: "Kritik",
};

/** Responsible municipal team per situation type. */
export const SITUATION_TEAM: Record<SituationType, string> = {
  temiz: "—",
  cop_kirliligi: "Temizlik Ekibi",
  asiri_kirli: "Temizlik Ekibi",
  dolu_cop_kutusu: "Temizlik Ekibi",
  grafiti: "Temizlik Ekibi",
  yabani_ot: "Temizlik Ekibi",
  yol_hasari: "Yol Bakım Ekibi",
  moloz_hafriyat: "Yol Bakım Ekibi",
  kaldirim_isgali: "Yol Bakım Ekibi",
  bozuk_tabela: "Yol Bakım Ekibi",
  su_birikintisi: "Yol Bakım Ekibi",
};

export const TEAMS = ["Temizlik Ekibi", "Yol Bakım Ekibi"] as const;

const SEVERITY_RANK: Record<Severity, number> = {
  dusuk: 1,
  orta: 2,
  yuksek: 3,
  kritik: 4,
};

export function isSituationType(v: string): v is SituationType {
  return v in SITUATION_LABEL;
}

export function isSeverity(v: string): v is Severity {
  return v in SEVERITY_LABEL;
}

export function severityRank(s: Severity): number {
  return SEVERITY_RANK[s] ?? 0;
}

/** Tailwind classes for a severity badge (dark glass friendly). */
export const severityColor: Record<Severity, string> = {
  dusuk: "bg-white/10 text-emerald-300 ring-emerald-400/30",
  orta: "bg-white/10 text-amber-300 ring-amber-400/30",
  yuksek: "bg-white/10 text-orange-300 ring-orange-400/30",
  kritik: "bg-white/10 text-red-300 ring-red-400/30",
};

/**
 * Picks the recommended team from a list of detected situations:
 * the team of the highest-severity, non-clean situation.
 */
export function recommendTeam(
  situations: Array<{ type: SituationType; severity: Severity }>,
): string {
  const actionable = situations
    .filter((s) => s.type !== "temiz")
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  if (actionable.length === 0) return "—";
  return SITUATION_TEAM[actionable[0].type];
}
