"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IconCheckAnimated } from "@/components/icons/IconCheckAnimated";
import { ScanPulse } from "@/components/icons/ScanPulse";
import { SPRING_SMOOTH } from "@/components/motion/springs";

export type ToastKind = "loading" | "success" | "error";

export type ToastState = {
  kind: ToastKind;
  message: string;
} | null;

type Props = {
  toast: ToastState;
};

/** Sabit üst toast — chrome altında, fade in/out */
export function LiveToast({ toast }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[250] flex justify-center px-4"
      style={{ top: "calc(var(--chrome-h, 7.5rem) + 0.5rem)" }}
    >
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={`${toast.kind}-${toast.message}`}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96, filter: "blur(8px)" }}
            transition={SPRING_SMOOTH}
            className={`live-toast flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ${
              toast.kind === "error" ? "text-red-200" : "text-foreground"
            }`}
          >
            {toast.kind === "loading" && (
              <ScanPulse className="h-4 w-4 shrink-0" />
            )}
            {toast.kind === "success" && (
              <IconCheckAnimated size={18} className="shrink-0 text-foreground" />
            )}
            {toast.kind === "error" && (
              <span className="text-red-400" aria-hidden>
                ✕
              </span>
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
