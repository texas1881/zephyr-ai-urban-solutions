"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { tabPanelVariants } from "@/components/motion/motionSystem";

type Props = {
  viewKey: string;
  direction: number;
  children: ReactNode;
  className?: string;
};

/** Sekme içeriği — Material shared-axis + iOS spring */
export function ViewPanel({
  viewKey,
  direction,
  children,
  className = "",
}: Props) {
  return (
    <div className={`view-panel overflow-x-clip ${className}`}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={viewKey}
          custom={direction}
          variants={tabPanelVariants(direction)}
          initial="hidden"
          animate="show"
          exit="exit"
          className="view-panel-inner"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
