/* eslint-disable @next/next/no-img-element */
import type { AnalysisResult } from "@/types/api";
import { priorityColor, priorityLabel } from "@/features/detections/priority";
import { DensityGauge } from "./DensityGauge";

type Props = {
  result: AnalysisResult;
};

export function AnalysisResultView({ result }: Props) {
  const modelLabel =
    result.analysisModel === "vision"
      ? "Google Vision görsel analiz"
      : "Nesne tespiti";

  return (
    <div className="glass-strong overflow-hidden rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      {/* 4 yön görselleri */}
      <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
        {result.directionImages.map((dir) => (
          <div key={dir.heading} className="relative aspect-[4/3] bg-black">
            <img
              src={dir.url}
              alt={`${result.address} — ${dir.label}`}
              className="h-full w-full object-cover"
            />
            <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
              {dir.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6 p-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Analiz Sonucu
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityColor[result.priority]}`}
            >
              {priorityLabel[result.priority]} öncelik
            </span>
          </div>
          <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
            {result.address}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {result.lat.toFixed(5)}, {result.lng.toFixed(5)} ·{" "}
            {result.directionsScanned} yön tarandı (ön/arka/sağ/sol)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <DensityGauge score={result.densityScore} />
          <div className="space-y-1.5 text-sm">
            <p className="text-foreground">
              Temizlik durumu:{" "}
              <span className="font-semibold">{result.cleanliness}</span>
            </p>
            <p className="text-foreground">
              <span className="text-2xl font-semibold tabular-nums">
                {result.litterCount}
              </span>{" "}
              <span className="text-muted">çöp/kirlilik ögesi</span>
            </p>
            {result.cityOrder && (
              <p className="max-w-md text-xs leading-5 text-muted">
                Şehir düzeni: {result.cityOrder}
              </p>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              Değerlendirme
            </span>
            <span className="rounded-full border border-line bg-surface px-1.5 py-0.5 text-[10px] text-muted">
              {result.aiAssessment ? modelLabel : "otomatik"}
            </span>
          </div>
          <p className="text-sm leading-6 text-foreground/90">
            {result.assessment}
          </p>
        </div>

        {result.litterItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-foreground">
              Tespit edilen atık
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.litterItems.map((g, i) => (
                <span
                  key={`${g.label}-${i}`}
                  className="rounded-md bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger ring-1 ring-inset ring-danger/30"
                >
                  {g.label} ×{g.count}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.contextItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted">
              Ortam (kirlilik göstergesi değildir)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.contextItems.map((g, i) => (
                <span
                  key={`${g.label}-${i}`}
                  className="rounded-md border border-line bg-surface px-2 py-0.5 text-xs text-muted"
                >
                  {g.label} ×{g.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
