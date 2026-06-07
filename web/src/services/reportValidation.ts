import type { ReportContext } from "@/services/reportService";

/** Keywords that imply issues — must not appear when no situations were found. */
const ISSUE_PATTERNS = [
  /çöp/i,
  /atık/i,
  /kirlilik/i,
  /kirli/i,
  /hasar/i,
  /grafiti/i,
  /moloz/i,
  /birikint/i,
  /tarım/i,
  /çukur/i,
  /işgal/i,
  /sorun\s+tespit/i,
  /bulgu/i,
  /müdahale\s+gerektir/i,
  /acil\s+temizlik/i,
];

/**
 * Returns true when an AI-generated report contradicts the structured analysis
 * (e.g. mentions trash when zero situations were validated).
 */
export function reportContradictsContext(
  report: string,
  ctx: ReportContext,
): boolean {
  if (!report.trim()) return true;

  if (ctx.situations.length === 0) {
    return ISSUE_PATTERNS.some((p) => p.test(report));
  }

  if (/tarım/i.test(report) && ctx.densityScore < 15) return true;

  const falsePositiveLink =
    /\b(araç|otomobil|car|kamyon|otobüs|bisiklet|yaya|insan|çanta|el\s*çantası|handbag|backpack)\b.*\b(çöp|kirlilik|atık|tespit|sorun)\b/i;
  const falsePositiveReverse =
    /\b(çöp|kirlilik|atık).*\b(araç|otomobil|car|çanta|handbag)\b/i;
  if (falsePositiveLink.test(report) || falsePositiveReverse.test(report)) {
    return true;
  }

  return false;
}
