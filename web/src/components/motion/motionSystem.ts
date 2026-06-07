/**
 * Zephyr Motion System — Apple (spring) + Material (easing) standartları.
 * Tüm animasyonlar bu token'ları kullanır.
 */

import type { Transition, Variants } from "framer-motion";

/* ── Apple UISpring benzeri presetler ── */
export const SPRING_IOS = {
  type: "spring" as const,
  stiffness: 500,
  damping: 36,
  mass: 0.82,
};

export const SPRING_IOS_SNAPPY = {
  type: "spring" as const,
  stiffness: 580,
  damping: 38,
  mass: 0.72,
};

export const SPRING_IOS_GENTLE = {
  type: "spring" as const,
  stiffness: 280,
  damping: 30,
  mass: 1,
};

export const SPRING_MATERIAL = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.9,
};

/* Geriye uyumluluk */
export const SPRING_SNAPPY = SPRING_IOS_SNAPPY;
export const SPRING_SMOOTH = SPRING_IOS_GENTLE;
export const SPRING_GENTLE = SPRING_IOS_GENTLE;
export const SPRING_BOUNCE = {
  type: "spring" as const,
  stiffness: 440,
  damping: 24,
  mass: 0.7,
};

/** Material emphasized decelerate */
export const EASE_EMPHASIZED = [0.2, 0, 0, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
  fast: 0.2,
  normal: 0.32,
  slow: 0.48,
} as const;

export const DEFAULT_TRANSITION: Transition = SPRING_IOS_GENTLE;

/* ── Sayfa / panel varyantları ── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: SPRING_IOS_GENTLE,
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(6px)",
    transition: { ...SPRING_IOS_GENTLE, duration: 0.22 },
  },
};

/** Material shared-axis — sekme geçişi (yatay taşma yok) */
export function tabPanelVariants(direction: number): Variants {
  const enterY = direction >= 0 ? 18 : -14;
  const exitY = direction >= 0 ? -12 : 14;
  return {
    hidden: { opacity: 0, y: enterY, scale: 0.99, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: SPRING_IOS,
    },
    exit: {
      opacity: 0,
      y: exitY,
      scale: 0.995,
      filter: "blur(6px)",
      transition: { ...SPRING_IOS, duration: 0.26 },
    },
  };
}

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_IOS_GENTLE,
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: SPRING_IOS_GENTLE,
  },
};

/** @deprecated STAGGER_CHILD yerine staggerItem kullan */
export const STAGGER_CHILD = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...SPRING_IOS_GENTLE, delay: i * 0.06 },
  }),
};

export const pressTap = { scale: 0.96 };
export const pressHover = { scale: 1.02, y: -1 };

export const VIEW_ORDER = ["analiz", "kayitlar", "pano"] as const;

export function viewDirection(from: string, to: string): number {
  const a = VIEW_ORDER.indexOf(from as (typeof VIEW_ORDER)[number]);
  const b = VIEW_ORDER.indexOf(to as (typeof VIEW_ORDER)[number]);
  if (a < 0 || b < 0) return 1;
  return b >= a ? 1 : -1;
}
