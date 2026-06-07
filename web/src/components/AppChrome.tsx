"use client";

import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { ZephyrLogo } from "@/components/ZephyrLogo";

type Props = {
  nav: ReactNode;
};

/** Sabit üst uygulama kabuğu — scroll'da kaymaz, gölge sıkılaşır. */
export function AppChrome({ nav }: Props) {
  const chromeRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  const boxShadow = useTransform(
    scrollY,
    [0, 24, 80],
    [
      "0 4px 20px rgba(0,0,0,0.2)",
      "0 8px 28px rgba(0,0,0,0.4)",
      "0 12px 36px rgba(0,0,0,0.55)",
    ],
  );
  const borderBottomColor = useTransform(
    scrollY,
    [0, 40],
    ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.16)"],
  );

  useLayoutEffect(() => {
    const el = chromeRef.current;
    if (!el) return;

    const sync = () => {
      document.documentElement.style.setProperty(
        "--chrome-h",
        `${el.offsetHeight}px`,
      );
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--chrome-h", "7.5rem");
  }, []);

  return (
    <motion.header
      ref={chromeRef}
      layout="position"
      style={{ boxShadow, borderBottomColor }}
      className="app-chrome fixed inset-x-0 top-0 z-[200] border-b"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-5">
        <div className="flex h-11 items-center justify-between sm:h-12">
          <ZephyrLogo size={30} showWordmark />
          <span className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-foreground/34 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
            Hackathon 2026
          </span>
        </div>

        <div className="chrome-nav-slot flex justify-center pb-2.5 pt-0.5 sm:pb-3">
          {nav}
        </div>
      </div>
    </motion.header>
  );
}
