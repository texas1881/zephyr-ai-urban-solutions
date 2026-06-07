import { severityRank, type Severity } from "@/features/analyze/situations";
import type { DetectedSituation } from "@/types/api";

const BIN_OBJECT_TEXT =
  /çöp\s*kutusu|konteyner|dumpster|trash\s*bin|waste\s*bin|garbage\s*bin/i;

const BIN_OVERFLOW_TEXT =
  /taşmış|taşan|taşma|overflow|spilling|kenarından\s*taş|dışarı\s*taş|açıkça\s*dolu/i;

const LITTER_TEXT =
  /dağılmış|yerde|poşet|ambalaj|atık|çöp\s*atığı|scattered|litter|plastik|karton|kutu|malzeme|debris/i;

const GRAFFITI_TEXT =
  /grafiti|spray|tag|duvar.*boya|karalama|vandal/i;

const OBSTRUCTION_TEXT =
  /kablo|hortum|engel|istif|yığın|işgal|obstacle|cable|hose|stacked/i;

function bumpSeverity(current: Severity, target: Severity): Severity {
  return severityRank(current) >= severityRank(target) ? current : target;
}

/** Dolu çöp kutusu için somut kanıt: hem kutu hem taşma ifadesi gerekir. */
export function hasBinOverflowEvidence(s: DetectedSituation): boolean {
  const text = `${s.description} ${s.location ?? ""}`.toLowerCase();
  return BIN_OBJECT_TEXT.test(text) && BIN_OVERFLOW_TEXT.test(text);
}

/** Onaylı çöp kutusu / kirlilik kayıtları için güven tabanını uygular. */
export function normalizeSituationConfidence(
  s: DetectedSituation,
): DetectedSituation {
  const text = `${s.description} ${s.location ?? ""}`.toLowerCase();

  if (s.type === "dolu_cop_kutusu") {
    if (!hasBinOverflowEvidence(s) || s.confidence < 0.72) {
      return { ...s, confidence: Math.min(s.confidence, 0.4) };
    }
    return {
      ...s,
      confidence: Math.min(0.92, Math.max(s.confidence, 0.82)),
      severity: bumpSeverity(s.severity, "yuksek"),
      recommendedAction:
        s.recommendedAction ?? "Çöp kutusu boşaltımı ve çevre temizliği",
    };
  }

  if (s.type === "cop_kirliligi" || s.type === "asiri_kirli") {
    const strong = LITTER_TEXT.test(text) || s.confidence >= 0.6;
    if (!strong) return s;
    return {
      ...s,
      confidence: Math.min(0.94, Math.max(s.confidence, 0.86)),
      severity: bumpSeverity(s.severity, "orta"),
    };
  }

  if (s.type === "grafiti" && (GRAFFITI_TEXT.test(text) || s.confidence >= 0.55)) {
    return {
      ...s,
      confidence: Math.min(0.9, Math.max(s.confidence, 0.74)),
      severity: bumpSeverity(s.severity, "orta"),
      recommendedAction:
        s.recommendedAction ?? "Grafiti temizliği veya yüzey restorasyonu",
    };
  }

  if (
    s.type === "kaldirim_isgali" &&
    (OBSTRUCTION_TEXT.test(text) || s.confidence >= 0.55)
  ) {
    return {
      ...s,
      confidence: Math.min(0.9, Math.max(s.confidence, 0.72)),
      severity: bumpSeverity(s.severity, "orta"),
      recommendedAction:
        s.recommendedAction ?? "Kaldırım engelinin kaldırılması",
    };
  }

  return s;
}

/** Görselde net çöp kutusu / kirlilik için güven ve önem skorunu yükseltir. */
export function enrichSituations(
  situations: DetectedSituation[],
): DetectedSituation[] {
  return situations.map(normalizeSituationConfidence);
}
