"use client";

import { AnimatePresence, motion, useSpring } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentType,
  type RefObject,
} from "react";
import { SPRING_BOUNCE, SPRING_SNAPPY } from "@/components/motion/springs";

export type NavItem = {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string; size?: number }>;
};

export type NavBadges = Partial<Record<string, number>>;

type Props = {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
  badges?: NavBadges;
  /** Hangi sekme yükleniyor — nabız animasyonu */
  pulseId?: string | null;
  /** Hangi sekme tamamlandı — onay flaşı */
  flashId?: string | null;
  className?: string;
};

const PILL_SPRING = { stiffness: 560, damping: 34, mass: 0.78 };

function usePillPhysics(
  containerRef: RefObject<HTMLDivElement | null>,
  active: string,
) {
  const x = useSpring(0, PILL_SPRING);
  const width = useSpring(0, PILL_SPRING);
  const scale = useSpring(1, PILL_SPRING);

  const sync = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const btn = root.querySelector<HTMLElement>(`[data-nav-id="${active}"]`);
    if (!btn) return;
    const parent = root.getBoundingClientRect();
    const rect = btn.getBoundingClientRect();
    x.set(rect.left - parent.left);
    width.set(rect.width);
  }, [active, containerRef, x, width]);

  useLayoutEffect(() => {
    sync();
    scale.set(1.06);
    const t = window.setTimeout(() => scale.set(1), 140);
    return () => window.clearTimeout(t);
  }, [active, sync, scale]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const ro = new ResizeObserver(sync);
    ro.observe(root);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  return { x, width, scale };
}

function TabPulse() {
  return (
    <motion.span
      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-white/90"
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.35, 1] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    />
  );
}

function TabDoneFlash() {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.75, opacity: 0, filter: "blur(3px)" }}
      transition={SPRING_SNAPPY}
      className="pointer-events-none absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black shadow-[0_0_10px_rgba(255,255,255,0.35)]"
      aria-hidden
    >
      ✓
    </motion.span>
  );
}

export function DynamicNav({
  items,
  active,
  onChange,
  badges = {},
  pulseId = null,
  flashId = null,
  className = "",
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { x, width, scale } = usePillPhysics(trackRef, active);

  return (
    <nav
      ref={trackRef}
      aria-label="Ana menü"
      className={`nav-shell relative w-full max-w-[22rem] overflow-hidden rounded-2xl p-1 sm:max-w-md ${className}`}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 rounded-xl border border-white/18 bg-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_12px_rgba(255,255,255,0.06)]"
        style={{ left: 0, x, width, scale }}
      />

      <div className="relative flex items-stretch">
        {items.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          const badge = badges[item.id];
          const isPulsing = pulseId === item.id;
          const isFlashing = flashId === item.id;

          return (
            <motion.button
              key={item.id}
              type="button"
              data-nav-id={item.id}
              onClick={() => onChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              whileTap={{ scale: 0.94 }}
              transition={SPRING_BOUNCE}
              className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] outline-none sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                isActive
                  ? "text-foreground"
                  : "text-muted hover:text-foreground/85"
              }`}
            >
              <span className="relative flex shrink-0 items-center justify-center">
                {Icon && (
                  <motion.span
                    animate={{
                      scale: isActive ? 1.08 : 1,
                      opacity: isActive ? 1 : 0.6,
                    }}
                    transition={SPRING_SNAPPY}
                  >
                    <Icon size={16} />
                  </motion.span>
                )}
                {isPulsing && <TabPulse />}
                <AnimatePresence mode="popLayout">
                  {isFlashing && <TabDoneFlash key="tab-done" />}
                </AnimatePresence>
              </span>

              <span className="font-medium tracking-tight">{item.label}</span>

              {badge != null && badge > 0 && (
                <motion.span
                  key={badge}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={SPRING_BOUNCE}
                  className={`min-w-[1.1rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums ${
                    isActive
                      ? "bg-black/25 text-foreground"
                      : "bg-white/10 text-foreground/75"
                  }`}
                >
                  {badge}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
