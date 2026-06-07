import { filterSignificantDetections } from "@/services/ruleBasedSynthesis";
import type { DirectionDetections } from "@/services/huggingFaceService";

/** OWL/DETR kanıtını VLM prompt'una eklemek için metin üretir. */
export function formatDetectionHints(
  directions: DirectionDetections[],
): string {
  const filtered = filterSignificantDetections(directions);
  const lines: string[] = [
    "OTOMATİK GÖRÜNTÜ TANıMA İPUÇLARI (yardımcı kanıt — görseli MUTLAKA doğrula):",
  ];

  for (const dir of filtered) {
    if (dir.detections.length === 0) {
      lines.push(`• ${dir.label}: belirgin atık sinyali yok`);
      continue;
    }
    const items = dir.detections
      .slice(0, 5)
      .map((d) => `${d.label} %${(d.score * 100).toFixed(0)}`)
      .join(", ");
    lines.push(`• ${dir.label}: ${items}`);
  }

  lines.push(
    "NOT: Bu ipuçları kişi/araç/çanta gibi nesneleri yanlış işaretleyebilir. Yalnızca görselde GERÇEKTEN yerde duran atık, hasar veya engel varsa raporla.",
  );
  return lines.join("\n");
}

export function hasStrongUrbanSignals(
  directions: DirectionDetections[],
): boolean {
  const filtered = filterSignificantDetections(directions);
  return filtered.some((d) => d.detections.length > 0);
}
