"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { AnalysisResult, SafetyRisk } from "@/types/api";
import { priorityColor, priorityLabel } from "@/features/detections/priority";
import {
  SEVERITY_LABEL,
  SITUATION_LABEL,
  severityColor,
} from "./situations";
import { DensityGauge } from "./DensityGauge";

const EMBED_KEY = process.env.NEXT_PUBLIC_MAPS_EMBED_KEY;

const RISK_LABEL: Record<SafetyRisk, string> = {
  dusuk: "Düşük risk",
  orta: "Orta risk",
  yuksek: "Yüksek risk",
};

const RISK_COLOR: Record<SafetyRisk, string> = {
  dusuk: "bg-white/10 text-emerald-300 ring-emerald-400/30",
  orta: "bg-white/10 text-amber-300 ring-amber-400/30",
  yuksek: "bg-white/10 text-red-300 ring-red-400/30",
};

type Props = {
  result: AnalysisResult;
  /** Team the record has been dispatched to (empty if not yet). */
  dispatchedTeam?: string;
  /** Called when the user dispatches the recommended team. */
  onDispatch?: (team: string) => void;
};

export function AnalysisResultView({
  result,
  dispatchedTeam = "",
  onDispatch,
}: Props) {
  const [pano, setPano] = useState(false);

  const modelLabel =
    result.analysisModel === "hf-vision"
      ? "Yapay zekâ görsel analizi"
      : result.analysisModel === "gemini"
        ? "Yapay zekâ görsel analizi"
        : result.analysisModel === "vision"
          ? "Google Vision"
          : "Nesne tespiti";

  const reportLabel =
    result.reportEngine === "gemini"
      ? "Gemini yorum"
      : result.reportEngine === "hf"
        ? "Yapay zekâ yorum"
        : "Otomatik özet";

  const canDispatch =
    !dispatchedTeam &&
    result.recommendedTeam !== "—" &&
    typeof onDispatch === "function";

  const panoUrl = EMBED_KEY
    ? `https://www.google.com/maps/embed/v1/streetview?key=${EMBED_KEY}&location=${result.lat},${result.lng}&heading=0&pitch=0&fov=90`
    : null;

  return (
    <div className="glass-strong overflow-hidden rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      {/* Görsel / 360° geçişi */}
      {panoUrl && (
        <div className="flex items-center justify-end gap-1 border-b border-white/10 bg-black/40 px-3 py-2">
          <button
            onClick={() => setPano(false)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              !pano
                ? "bg-white text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            4 Yön
          </button>
          <button
            onClick={() => setPano(true)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              pano ? "bg-white text-black" : "text-muted hover:text-foreground"
            }`}
          >
            360° Gezin
          </button>
        </div>
      )}

      {pano && panoUrl ? (
        <div className="relative aspect-video w-full bg-black">
          <iframe
            title={`${result.address} 360° Street View`}
            src={panoUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
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
      )}

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
            <div className="flex items-center gap-2">
              <p className="text-foreground">
                Temizlik durumu:{" "}
                <span className="font-semibold">{result.cleanliness}</span>
              </p>
              {result.safetyRisk && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${RISK_COLOR[result.safetyRisk]}`}
                >
                  {RISK_LABEL[result.safetyRisk]}
                </span>
              )}
            </div>
            <p className="text-foreground">
              <span className="text-2xl font-semibold tabular-nums">
                {result.situations.length || result.litterCount}
              </span>{" "}
              <span className="text-muted">tespit edilen durum</span>
            </p>
          </div>
        </div>

        {/* Durum kartları */}
        {result.situations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Tespit edilen durumlar
            </p>
            {result.situations.map((s, i) => (
              <div
                key={`${s.type}-${i}`}
                className="glass flex items-start justify-between gap-3 rounded-xl p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {SITUATION_LABEL[s.type]}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${severityColor[s.severity]}`}
                    >
                      {SEVERITY_LABEL[s.severity]}
                    </span>
                    {s.location && (
                      <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] text-muted">
                        {s.location}
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="mt-0.5 text-xs text-muted">{s.description}</p>
                  )}
                  {s.recommendedAction && (
                    <p className="mt-1 text-xs text-foreground/80">
                      <span className="text-muted">Öneri: </span>
                      {s.recommendedAction}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs tabular-nums text-muted">
                    %{Math.round(s.confidence * 100)}
                  </p>
                  {s.direction && (
                    <p className="text-[10px] uppercase tracking-wide text-muted">
                      {s.direction}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ekip yönlendirme */}
        {result.recommendedTeam !== "—" && (
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div>
              <p className="text-xs text-muted">Önerilen ekip</p>
              <p className="text-sm font-semibold text-foreground">
                {result.recommendedTeam}
              </p>
            </div>
            {dispatchedTeam ? (
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                ✓ {dispatchedTeam} yönlendirildi
              </span>
            ) : (
              canDispatch && (
                <button
                  onClick={() => onDispatch?.(result.recommendedTeam)}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary-soft"
                >
                  Ekip Yönlendir
                </button>
              )
            )}
          </div>
        )}

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

        {/* Kapsamlı AI raporu */}
        {result.aiReport && (
          <div className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                Kapsamlı AI Raporu
              </span>
              <span className="rounded-full border border-line bg-surface px-1.5 py-0.5 text-[10px] text-muted">
                {reportLabel}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm leading-6 text-foreground/90">
              {result.aiReport}
            </p>
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
