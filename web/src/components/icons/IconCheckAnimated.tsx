"use client";

import { motion } from "framer-motion";
import { SPRING_SNAPPY } from "@/components/motion/springs";

type Props = { className?: string; size?: number };

/** Tik — pathLength spring ile çizilir */
export function IconCheckAnimated({ className = "", size = 20 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...SPRING_SNAPPY, duration: 0.45 }}
      />
      <motion.path
        d="M8 12.2l2.6 2.6 5.4-5.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...SPRING_SNAPPY, delay: 0.12, duration: 0.35 }}
      />
    </svg>
  );
}
