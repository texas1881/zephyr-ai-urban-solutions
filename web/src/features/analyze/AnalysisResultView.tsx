/* eslint-disable @next/next/no-img-element */
import type { AnalysisResult, DetectedObject } from "@/types/api";
import { priorityColor, priorityLabel } from "@/features/detections/priority";
import { isLitter, labelTr } from "./labels";
import { DensityGauge } from "./DensityGauge";

type Props = {
  result: AnalysisResult;
};

type Grouped = { label: string; count: number };

function groupObjects(
  objects: DetectedObject[],
  litter: boolean,
): Grouped[] {
  const counts = new Map<string, number>();
  for (const o of objects) {
    if (isLitter(o.label) !== litter) continue;
    counts.set(o.label, (counts.get(o.label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function AnalysisResultView({ result }: Props) {
  const litterGroups = groupObjects(result.objects, true);
  const contextGroups = groupObjects(result.objects, false);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="grid gap-0">
        <div className="relative aspect-[16/10] bg-[#ece4d4]">
          <img
            src={result.streetViewUrl}
            alt={`${result.address} sokak görüntüsü`}
            className="h-full w-full object-cover"
          />
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
            Google Street View
          </span>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-muted">
                Analiz Sonucu
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityColor[result.priority]}`}
              >
                {priorityLabel[result.priority]} öncelik
              </span>
            </div>
            <h3 className="mt-1 font-serif text-xl text-foreground">
              {result.address}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {result.lat.toFixed(5)}, {result.lng.toFixed(5)}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <DensityGauge score={result.densityScore} />
            <div className="space-y-1 text-sm">
              <p className="text-foreground">
                Temizlik durumu:{" "}
                <span className="font-medium">{result.cleanliness}</span>
              </p>
              <p className="text-foreground">
                <span className="font-serif text-2xl font-semibold">
                  {result.litterCount}
                </span>{" "}
                çöp/kirlilik objesi
              </p>
              <p className="text-muted">
                {result.objects.length} nesne · {result.directionsScanned} yön
                tarandı (ön/arka/sağ/sol)
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-background p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-primary">
                Değerlendirme
              </span>
              <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] text-muted">
                {result.aiAssessment ? "Gemini AI" : "otomatik"}
              </span>
            </div>
            <p className="text-sm leading-6 text-foreground">
              {result.assessment}
            </p>
          </div>

          {litterGroups.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-foreground">
                Tespit edilen atık
              </p>
              <div className="flex flex-wrap gap-1.5">
                {litterGroups.map((g) => (
                  <span
                    key={g.label}
                    className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200"
                  >
                    {labelTr(g.label)} ×{g.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {contextGroups.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                Ortam (kirlilik göstergesi değildir)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {contextGroups.map((g) => (
                  <span
                    key={g.label}
                    className="rounded-md border border-line bg-background px-2 py-0.5 text-xs text-muted"
                  >
                    {labelTr(g.label)} ×{g.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
