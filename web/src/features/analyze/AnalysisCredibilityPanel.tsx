"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Brain,
  Camera,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import type { PipelineMeta } from "@/services/pipelineMeta";
import { SPRING_IOS_GENTLE, staggerContainer, staggerItem } from "@/components/motion/motionSystem";

type Props = {
  meta: PipelineMeta;
  degraded?: boolean;
};

const VERDICT_STYLE = {
  uygun: "verdict-uygun",
  izle: "verdict-izle",
  mudahale: "verdict-mudahale",
} as const;

export function AnalysisCredibilityPanel({ meta, degraded }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_IOS_GENTLE}
        className={`verdict-card rounded-2xl border p-5 sm:p-6 ${VERDICT_STYLE[meta.verdict]}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08]">
              {meta.verdict === "uygun" ? (
                <ShieldCheck size={22} className="text-foreground" />
              ) : (
                <ScanSearch size={22} className="text-foreground" />
              )}
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                Saha mühendisliği kararı
              </p>
              <h4 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {meta.verdictTitle}
              </h4>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                {meta.verdictDetail}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-right">
            <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-medium text-foreground">
              Benchmark {meta.benchmarkScore}/10
            </span>
            <span className="text-[10px] text-muted">{meta.consensusLabel}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {[
          {
            icon: Camera,
            label: "Görsel kanıt",
            value: `${meta.overlayBoxes} kutu`,
          },
          {
            icon: ScanSearch,
            label: "OWL/DETR tespit",
            value: `${meta.detectionHits} sinyal`,
          },
          {
            icon: Brain,
            label: "Ort. güven",
            value:
              meta.avgConfidence != null
                ? `%${Math.round(meta.avgConfidence * 100)}`
                : "—",
          },
          {
            icon: BadgeCheck,
            label: "Doğrulama",
            value: degraded ? "Yedek" : "3 ajan",
          },
        ].map(({ icon: Icon, label, value }) => (
          <motion.div
            key={label}
            variants={staggerItem}
            className="cred-metric rounded-xl border border-white/10 bg-white/[0.04] p-3"
          >
            <Icon size={14} className="text-foreground/60" />
            <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
              {value}
            </p>
            <p className="text-[10px] text-muted">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-muted">
          Aktif analiz zinciri
        </p>
        <div className="flex flex-wrap gap-2">
          {meta.agentsUsed.map((agent, i) => (
            <span
              key={agent}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-foreground/90"
            >
              <span className="font-mono text-[9px] text-foreground/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              {agent}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
