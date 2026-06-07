"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ScanPulse } from "@/components/icons/ScanPulse";
import { SPRING_IOS_GENTLE } from "@/components/motion/motionSystem";
import {
  SEVERITY_LABEL,
  SITUATION_LABEL,
  severityColor,
} from "@/features/analyze/situations";
import type { DetectedSituation } from "@/types/api";

export type LiveDetection = {
  label: string;
  score: number;
};

type Props = {
  heading: number;
  sector: string;
  scanning: boolean;
  liveDetections: LiveDetection[];
  situations: DetectedSituation[];
  error?: string | null;
};

export function PanoScanSidebar({
  heading,
  sector,
  scanning,
  liveDetections,
  situations,
  error,
}: Props) {
  const sectorSituations = situations.filter(
    (s) => s.direction?.toLowerCase() === sector.toLowerCase(),
  );

  return (
    <aside className="pano-scan-sidebar flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-4">
      <div className="shrink-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Anlık tarama
          </p>
          {scanning && (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-foreground/80">
              <ScanPulse className="h-3.5 w-3.5" />
              Taranıyor
            </span>
          )}
        </div>
        <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
          {Math.round(heading)}°
          <span className="ml-2 text-sm font-medium text-muted">{sector}</span>
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <section>
          <p className="mb-1.5 text-[11px] font-medium text-foreground">
            OWL/DETR sinyalleri
          </p>
          <AnimatePresence mode="popLayout">
            {liveDetections.length === 0 && !scanning ? (
              <motion.p
                key="empty-live"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted"
              >
                Bu açıda belirgin sinyal yok
              </motion.p>
            ) : (
              <ul className="space-y-1">
                {liveDetections.map((d) => (
                  <motion.li
                    key={`${d.label}-${d.score}`}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={SPRING_IOS_GENTLE}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs"
                  >
                    <span className="truncate text-foreground/90">{d.label}</span>
                    <span className="shrink-0 tabular-nums text-muted">%{d.score}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </AnimatePresence>
        </section>

        <section>
          <p className="mb-1.5 text-[11px] font-medium text-foreground">
            AI tespitleri ({sector})
          </p>
          {sectorSituations.length === 0 ? (
            <p className="text-xs text-muted">Bu yönde kayıtlı bulgu yok</p>
          ) : (
            <ul className="space-y-1.5">
              {sectorSituations.map((s, i) => (
                <motion.li
                  key={`${s.type}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING_IOS_GENTLE, delay: i * 0.04 }}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {SITUATION_LABEL[s.type]}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] ring-1 ring-inset ${severityColor[s.severity]}`}
                    >
                      {SEVERITY_LABEL[s.severity]}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted">
                    {s.description}
                  </p>
                  <p className="mt-0.5 text-[10px] tabular-nums text-foreground/70">
                    %{Math.round(s.confidence * 100)}
                  </p>
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}
