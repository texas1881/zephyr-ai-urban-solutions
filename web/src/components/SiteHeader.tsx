"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { ZephyrLogo } from "@/components/ZephyrLogo";

type Props = {
  nav?: ReactNode;
};

/** Sabit üst çubuk — logo + nav tek blokta, scroll'da sıkılaşır. */
export function SiteHeader({ nav }: Props) {
  const { scrollY } = useScroll();
  const borderColor = useTransform(
    scrollY,
    [0, 48],
    ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.12)"],
  );
  const backgroundColor = useTransform(
    scrollY,
    [0, 48],
    ["rgba(3,3,4,0.82)", "rgba(3,3,4,0.94)"],
  );

  return (
    <motion.header
      style={{ borderBottomColor: borderColor, backgroundColor }}
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-2xl backdrop-saturate-150"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-5">
        {/* Marka satırı */}
        <div className="flex h-12 items-center justify-between sm:h-[3.25rem]">
          <ZephyrLogo size={32} showWordmark />
          <span className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-foreground/36 sm:inline-flex">
            <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden>
              <circle
                cx="3"
                cy="3"
                r="2.5"
                fill="currentColor"
                fillOpacity="0.35"
              />
            </svg>
            Hackathon 2026
          </span>
        </div>

        {/* Nav — header içinde sabit, içerik üstüne binmez */}
        {nav && (
          <div className="flex justify-center pb-3 pt-0.5 sm:pb-3.5">
            {nav}
          </div>
        )}
      </div>
    </motion.header>
  );
}
