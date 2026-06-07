"use client";

import { motion } from "framer-motion";
import { SPRING_GENTLE } from "@/components/motion/springs";

type Props = {
  className?: string;
  size?: number;
  showWordmark?: boolean;
};

/** Zephyr mark — özel SVG, hover'da hafif spring. */
export function ZephyrLogo({
  className = "",
  size = 40,
  showWordmark = false,
}: Props) {
  return (
    <motion.div
      className={`inline-flex items-center gap-3 ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={SPRING_GENTLE}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="Zephyr"
        className="shrink-0 drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]"
      >
        <defs>
          <linearGradient id="zephyrFace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e8e8ed" />
          </linearGradient>
          <linearGradient id="zephyrZ" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0a0a0b" />
            <stop offset="100%" stopColor="#1c1c1e" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="11"
          fill="url(#zephyrFace)"
        />
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="11"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.5"
        />
        <path
          d="M13 15h22L15 25h20v4H13l22-10H13v-4z"
          fill="url(#zephyrZ)"
        />
        <path
          d="M10 33V23h3.5v10M17.5 33V19h3v14M24 33v-8h4.5v8M31.5 33V21H35v12"
          fill="rgba(0,0,0,0.1)"
        />
        <motion.path
          d="M24 37c-3.5-1.8-5.5-3.8-5.5-6.5v-1.5h11v1.5c0 2.7-2 4.7-5.5 6.5z"
          fill="rgba(0,0,0,0.08)"
          animate={{ opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground sm:text-base">
            Zephyr
          </span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-foreground/42 sm:text-[10px]">
            Kentsel saha yönetimi
          </span>
        </div>
      )}
    </motion.div>
  );
}
