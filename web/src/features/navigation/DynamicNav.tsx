"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

type Props = {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
};

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32 };

/**
 * Apple Dynamic Island–style navigation: morphing pill, spring slide,
 * icon spin on select, breathing glow, and expand/collapse labels.
 */
export function DynamicNav({ items, active, onChange }: Props) {
  const [tick, setTick] = useState(0);

  function select(id: string) {
    if (id !== active) {
      setTick((t) => t + 1);
      onChange(id);
    }
  }

  return (
    <motion.nav
      initial={{ y: -28, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2"
      aria-label="Ana menü"
    >
      {/* Ambient glow — sürekli nefes alır */}
      <motion.div
        className="island-glow pointer-events-none absolute inset-0 -z-10 rounded-full"
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        key={tick}
        initial={false}
        animate={{ scale: [1, 1.045, 1] }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="island-shell pointer-events-auto relative rounded-full p-1 shadow-[0_12px_48px_rgba(0,0,0,0.65)]"
      >
        <div className="relative flex items-center gap-0.5">
          {items.map((item) => {
            const isActive = item.id === active;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40 ${
                  isActive ? "text-black" : "text-muted hover:text-foreground"
                }`}
              >
                {/* Kayar aktif pill */}
                {isActive && (
                  <motion.span
                    layoutId="island-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-[0_2px_16px_rgba(255,255,255,0.35)]"
                    transition={SPRING}
                  />
                )}

                <motion.span
                  layout
                  className="relative z-10 flex items-center gap-1.5 py-2"
                  animate={{ paddingLeft: isActive ? 18 : 14, paddingRight: isActive ? 18 : 14 }}
                  transition={SPRING}
                >
                  {Icon && (
                    <motion.span
                      className="flex shrink-0 items-center justify-center"
                      animate={
                        isActive
                          ? { rotate: [0, -12, 12, 0], scale: [1, 1.2, 1] }
                          : { rotate: 0, scale: 0.92 }
                      }
                      transition={
                        isActive
                          ? { duration: 0.5, ease: "easeOut" }
                          : { duration: 0.2 }
                      }
                    >
                      <Icon size={15} strokeWidth={isActive ? 2.4 : 2} />
                    </motion.span>
                  )}

                  <AnimatePresence mode="popLayout" initial={false}>
                    {isActive && (
                      <motion.span
                        key="label"
                        initial={{ width: 0, opacity: 0, x: -6 }}
                        animate={{ width: "auto", opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: -4 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden whitespace-nowrap text-sm font-semibold tracking-tight"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Aktif sekmede nabız noktası */}
                  {isActive && (
                    <motion.span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-black"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.35, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </motion.span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.nav>
  );
}
