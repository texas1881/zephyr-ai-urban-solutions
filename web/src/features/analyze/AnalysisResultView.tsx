/* eslint-disable @next/next/no-img-element */
import type { AnalysisResult } from "@/types/api";
import { priorityColor, priorityLabel } from "@/features/detections/priority";
import { DensityGauge } from "./DensityGauge";

type Props = {
  result: AnalysisResult;
};

export function AnalysisResultView({ result }: Props) {
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
                <span className="font-serif text-2xl font-semibold">
                  {result.litterCount}
                </span>{" "}
                çöp/kirlilik objesi
              </p>
              <p className="text-muted">
                {result.objects.length} nesne tespit edildi
              </p>
            </div>
          </div>

          {result.objects.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.objects.map((obj, i) => (
                <span
                  key={`${obj.label}-${i}`}
                  className="rounded-md border border-line bg-background px-2 py-0.5 text-xs text-muted"
                >
                  {obj.label} · {(obj.score * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
