"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import type { DetectionPoint } from "@/types/api";
import { densityBarColor, priorityColor, priorityLabel } from "./priority";

type Props = {
  detection: DetectionPoint;
  rank: number;
};

export function DetectionCard({ detection, rank }: Props) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.04, duration: 0.25 }}
      className="glass flex items-center gap-4 rounded-2xl p-4"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary-soft">
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
            <MapPin size={14} className="shrink-0 text-muted" />
            <span className="truncate">{detection.location}</span>
          </p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityColor[detection.priority]}`}
          >
            {priorityLabel[detection.priority]}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-muted">
          {detection.litterCount} obje tespit edildi
        </p>

        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <motion.div
              className={`h-full rounded-full ${densityBarColor(detection.densityScore)}`}
              initial={{ width: 0 }}
              animate={{ width: `${detection.densityScore}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <span className="w-12 text-right text-sm font-semibold tabular-nums text-foreground">
            {detection.densityScore}
          </span>
        </div>
      </div>
    </motion.li>
  );
}
