"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { IconCheckAnimated } from "@/components/icons/IconCheckAnimated";
import { ScanPulse } from "@/components/icons/ScanPulse";
import { cardReveal, SPRING_IOS_GENTLE } from "@/components/motion/motionSystem";

export type ModuleBadgeState = "live" | "loading" | "success" | "idle";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeState?: ModuleBadgeState;
  className?: string;
  children: ReactNode;
};

const BADGE_COPY: Record<ModuleBadgeState, string> = {
  live: "Canlı",
  loading: "Taranıyor…",
  success: "Başarılı",
  idle: "",
};

export function ModuleCard({
  title,
  subtitle,
  badge,
  badgeState = "live",
  className = "",
  children,
}: Props) {
  const label = badge ?? BADGE_COPY[badgeState];
  const showBadge = Boolean(label);

  return (
    <motion.section
      layout
      variants={cardReveal}
      initial="hidden"
      animate="show"
      transition={SPRING_IOS_GENTLE}
      className={`module-card flex flex-col rounded-[1.75rem] p-5 sm:p-6 ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-white/[0.07] pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-[13px]">
              {subtitle}
            </p>
          )}
        </div>
        {showBadge && (
          <AnimatePresence mode="wait">
            <motion.span
              key={`${badgeState}-${label}`}
              initial={{ opacity: 0, scale: 0.88, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={SPRING_IOS_GENTLE}
              className={`live-badge shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-[11px] ${
                badgeState === "success"
                  ? "border-white/22 bg-white/[0.1] text-foreground"
                  : badgeState === "loading"
                    ? "border-white/15 text-foreground/85"
                    : ""
              }`}
            >
              {badgeState === "live" && (
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
              )}
              {badgeState === "loading" && (
                <ScanPulse className="h-3.5 w-3.5" />
              )}
              {badgeState === "success" && (
                <IconCheckAnimated size={14} className="text-foreground" />
              )}
              {label}
            </motion.span>
          </AnimatePresence>
        )}
      </div>
      {children}
    </motion.section>
  );
}
