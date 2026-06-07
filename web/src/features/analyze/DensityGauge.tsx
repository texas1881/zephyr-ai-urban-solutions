"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { SPRING_SMOOTH } from "@/components/motion/springs";

type Props = {
  score: number;
  size?: number;
};

function strokeColor(score: number): string {
  if (score >= 60) return "#ff453a";
  if (score >= 25) return "#d1d1d6";
  return "#ffffff";
}

export function DensityGauge({ score, size = 132 }: Props) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));

  const springScore = useSpring(0, SPRING_SMOOTH);
  useEffect(() => {
    springScore.set(clamped);
  }, [clamped, springScore]);

  const offset = useTransform(springScore, (v) => {
    const c = Math.max(0, Math.min(100, v));
    return circumference - (c / 100) * circumference;
  });

  const displayScore = useTransform(springScore, (v) => Math.round(v));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={10}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor(clamped)}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-3xl font-semibold tabular-nums text-foreground">
          {displayScore}
        </motion.span>
        <span className="text-[10px] uppercase tracking-wide text-muted">
          yoğunluk
        </span>
      </div>
    </div>
  );
}
