"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "@/components/motion/motionSystem";

type Props = {
  chrome: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Apple/Google uygulama iskeleti:
 * sabit chrome + scrollable content + footer
 */
export function AppLayout({ chrome, children, footer }: Props) {
  return (
    <div className="app-root flex min-h-dvh max-w-full flex-col overflow-x-clip">
      {chrome}

      <motion.div
        className="app-layout flex flex-1 flex-col"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.div>

      {footer && (
        <motion.footer
          className="app-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {footer}
        </motion.footer>
      )}
    </div>
  );
}
