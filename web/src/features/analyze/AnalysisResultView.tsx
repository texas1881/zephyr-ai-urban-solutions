"use client";

import { motion } from "framer-motion";
import {
  Construction,
  Droplets,
  FileText,
  type LucideIcon,
  Send,
  ShieldAlert,
  ShieldCheck,
  Signpost,
  Sparkles,
  Sprout,
  SprayCan,
  TrafficCone,
  Trash2,
  Truck,
} from "lucide-react";
import type { AnalysisResult, SafetyRisk } from "@/types/api";
import { priorityColor, priorityLabel } from "@/features/detections/priority";
import {
  SEVERITY_LABEL,
  SITUATION_LABEL,
  SITUATION_TEAM,
  severityColor,
  type SituationType,
} from "./situations";
import { StreetViewExplorer } from "@/features/streetview/StreetViewExplorer";
import { SPRING_BOUNCE, SPRING_SMOOTH } from "@/components/motion/springs";
import { AnalysisCredibilityPanel } from "./AnalysisCredibilityPanel";
import { DensityGauge } from "./DensityGauge";

const RISK_LABEL: Record<SafetyRisk, string> = {
  dusuk: "Düşük risk",
  orta: "Orta risk",
  yuksek: "Yüksek risk",
};

const RISK_COLOR: Record<SafetyRisk, string> = {
  dusuk: "bg-white/10 text-foreground/80 ring-white/20",
  orta: "bg-white/10 text-amber-300 ring-amber-400/30",
  yuksek: "bg-white/10 text-red-300 ring-red-400/30",
};

const SITUATION_ICON: Record<SituationType, LucideIcon> = {
  temiz: ShieldCheck,
  cop_kirliligi: Trash2,
  asiri_kirli: Trash2,
  dolu_cop_kutusu: Trash2,
  yol_hasari: Construction,
  moloz_hafriyat: Truck,
  grafiti: SprayCan,
  kaldirim_isgali: TrafficCone,
  bozuk_tabela: Signpost,
  su_birikintisi: Droplets,
  yabani_ot: Sprout,
};

type Props = {
  result: AnalysisResult;
  dispatchedTeam?: string;
  onDispatch?: (team: string) => void;
};

export function AnalysisResultView({
  result,
  dispatchedTeam = "",
  onDispatch,
}: Props) {
  const modelLabel =
    result.analysisModel === "hf-multi-agent" ||
      result.analysisModel === "hf-detection-llm"
      ? "HF kanıt + LLM sentez (OWL/DETR + Qwen2.5)"
      : result.analysisModel === "hf-vision"
        ? "HF tespit pipeline (eski)"
        : "Nesne tespiti (DETR)";

  const teams =
    result.recommendedTeams && result.recommendedTeams.length > 0
      ? result.recommendedTeams
      : result.recommendedTeam !== "—"
        ? [result.recommendedTeam]
        : [];

  const reportLabel =
    result.reportEngine === "hf" ? "Yapay zekâ yorum" : "Doğrulanmış özet";

  const canDispatch =
    !dispatchedTeam &&
    result.recommendedTeam !== "—" &&
    typeof onDispatch === "function";

  return (
    <div className="glass-strong scroll-mt-24 rounded-2xl">
      <StreetViewExplorer result={result} />

      <div className="border-t border-line">
        <div className="flex flex-col gap-6 p-6">
          {result.pipelineMeta && (
            <AnalysisCredibilityPanel
              meta={result.pipelineMeta}
              degraded={result.analysisDegraded}
            />
          )}

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
              {result.directionsScanned} ana yön
              {result.panoramaFrames
                ? ` · ${result.panoramaFrames} kare 360° AI taraması`
                : ""}
            </p>
            {result.analysisDegraded && (
              <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200/90">
                Analiz kalitesi düşürüldü — çoklu ajan yerine basit tespit kullanıldı.
              </p>
            )}
            {result.warnings && result.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {result.warnings.map((w) => (
                  <li key={w}>· {w}</li>
                ))}
              </ul>
            )}
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
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${RISK_COLOR[result.safetyRisk]}`}
                  >
                    <ShieldAlert size={11} />
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

          {result.situations.length === 0 && result.cleanliness === "Temiz" && (
            <div className="glass flex items-start gap-4 rounded-2xl border border-white/12 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06]">
                <ShieldCheck size={24} className="text-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Doğrulanmış temiz bölge
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  360° panorama ve çoklu ajan konsensüsü sonrası müdahale
                  gerektiren çevresel bulgu raporlanmadı. Görsel kanıt
                  kutularını sokak görüntüsünde inceleyebilirsiniz.
                </p>
              </div>
            </div>
          )}

          {result.situations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">
                Tespit edilen durumlar
              </p>
              {result.situations.map((s, i) => {
                const Icon = SITUATION_ICON[s.type] ?? Trash2;
                return (
                  <motion.div
                    key={`${s.type}-${i}`}
                    initial={{ opacity: 0, x: -12, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ ...SPRING_SMOOTH, delay: i * 0.06 }}
                    whileHover={{ y: -2 }}
                    className="glass flex items-start justify-between gap-3 rounded-xl p-3"
                  >
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-foreground">
                        <Icon size={15} />
                      </span>
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
                          <span className="rounded-full border border-white/15 bg-white/6 px-2 py-0.5 text-[10px] text-foreground/90">
                            {SITUATION_TEAM[s.type]}
                          </span>
                          {s.location && (
                            <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] text-muted">
                              {s.location}
                            </span>
                          )}
                        </div>
                        {s.description && (
                          <p className="mt-0.5 text-xs text-muted">
                            {s.description}
                          </p>
                        )}
                        {s.recommendedAction && (
                          <p className="mt-1 text-xs text-foreground/80">
                            <span className="text-muted">Öneri: </span>
                            {s.recommendedAction}
                          </p>
                        )}
                      </div>
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
                  </motion.div>
                );
              })}
            </div>
          )}

          {teams.length > 0 && (
            <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div>
                <p className="text-xs text-muted">
                  {teams.length > 1 ? "Önerilen ekipler" : "Önerilen ekip"}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <span
                      key={team}
                      className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {team}
                    </span>
                  ))}
                </div>
              </div>
              {dispatchedTeam ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-inset ring-white/10">
                  <ShieldCheck size={13} />
                  {dispatchedTeam} yönlendirildi
                </span>
              ) : (
                canDispatch && (
                  <motion.button
                    onClick={() => onDispatch?.(teams[0])}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_BOUNCE}
                    className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <Send size={15} />
                    {teams.length > 1
                      ? "Birincil Ekip Yönlendir"
                      : "Ekip Yönlendir"}
                  </motion.button>
                )
              )}
            </div>
          )}

          <div className="glass rounded-2xl p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Sparkles size={14} className="text-foreground" />
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

          {result.aiReport && (
            <div className="glass rounded-2xl p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText size={14} className="text-foreground" />
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
    </div>
  );
}
