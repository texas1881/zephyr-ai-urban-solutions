"use client";

import { LayoutGroup, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { SPRING_IOS_GENTLE } from "@/components/motion/motionSystem";

type Props = { children: ReactNode };

/** Global fizik motoru — tüm alt bileşenlere spring + reduced-motion uygular */
export function MotionProvider({ children }: Props) {
  return (
    <MotionConfig
      transition={SPRING_IOS_GENTLE}
      reducedMotion="user"
    >
      <LayoutGroup id="zephyr-app">{children}</LayoutGroup>
    </MotionConfig>
  );
}
