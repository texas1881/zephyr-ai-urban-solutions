"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { IconCheckAnimated } from "@/components/icons/IconCheckAnimated";
import { SPRING_SMOOTH } from "@/components/motion/springs";

type Props = {
  show: boolean;
  message?: string;
  /** ms sonra otomatik kapanır */
  durationMs?: number;
  onHidden?: () => void;
};

/**
 * Başarı şeridi — tik animasyonu, tut, fade-out ile kaybolur.
 */
export function SuccessFlash({
  show,
  message = "Başarılı — analiz tamamlandı",
  durationMs = 2800,
  onHidden,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(t);
  }, [show, durationMs]);

  return (
    <AnimatePresence onExitComplete={onHidden}>
      {visible && (
        <motion.div
          key="success-flash"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98, filter: "blur(6px)" }}
          transition={SPRING_SMOOTH}
          className="success-flash flex items-center gap-3 rounded-xl px-4 py-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-foreground">
            <IconCheckAnimated size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{message}</p>
            <p className="text-xs text-muted">Sonuçlar aşağıda listelendi</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
