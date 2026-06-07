"use client";

import { motion } from "framer-motion";

/** Analiz sırasında dönen tarama halkası — saf SVG + spring. */
export function ScanPulse({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <motion.g
        style={{ transformOrigin: "16px 16px" }}
        animate={{ scale: [1, 2.15], opacity: [0.85, 0] }}
        transition={{ duration: 1.35, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
      >
        <circle
          cx="16"
          cy="16"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "16px 16px" }}
        animate={{ scale: [1, 2.15], opacity: [0.85, 0] }}
        transition={{
          duration: 1.35,
          repeat: Infinity,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.45,
        }}
      >
        <circle
          cx="16"
          cy="16"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </motion.g>
      <motion.path
        d="M11 16h10M16 11v10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        style={{ originX: "16px", originY: "16px" }}
      />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}
