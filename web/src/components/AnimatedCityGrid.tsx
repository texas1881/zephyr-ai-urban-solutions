"use client";

import { motion } from "framer-motion";

/** Hero arka planı — izometrik SVG grid + yavaş drift animasyonu. */
export function AnimatedCityGrid({ className = "" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 480 480"
      role="presentation"
      aria-hidden
      className={className}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.55, 0.85, 0.55] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <pattern
          id="isoGrid"
          width="28"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 8 L14 0 L28 8 L14 16 Z"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.07"
          />
        </pattern>
        <radialGradient id="glow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <motion.g
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect width="480" height="480" fill="url(#isoGrid)" />
        <rect width="480" height="260" fill="url(#gridFade)" />
        <rect width="480" height="480" fill="url(#glow)" />

        <g fill="#fff" fillOpacity="0.045" stroke="#fff" strokeOpacity="0.1">
          <path d="M120 280 L160 260 L160 220 L120 240 Z" />
          <path d="M160 260 L200 280 L200 240 L160 220 Z" />
          <path d="M120 280 L160 260 L200 280 L160 300 Z" />
          <path d="M260 300 L310 275 L310 230 L260 255 Z" />
          <path d="M310 275 L360 300 L360 255 L310 230 Z" />
          <path d="M260 300 L310 275 L360 300 L310 325 Z" />
        </g>

        <motion.path
          d="M80 340 L140 310 L200 340"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.12"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          animate={{ strokeDashoffset: [0, -24] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </motion.g>
    </motion.svg>
  );
}
