"use client";

import { motion } from "framer-motion";
import {
  IconMultiAgent,
  IconShieldKvkk,
  IconStreetScan,
  IconTeamRoute,
} from "@/components/icons/FeatureIcons";
import {
  SPRING_IOS_GENTLE,
  staggerContainer,
  staggerItem,
} from "@/components/motion/motionSystem";

const STATS = [
  { Icon: IconStreetScan, label: "360° tarama", desc: "8 kare · zoom + zemin" },
  { Icon: IconMultiAgent, label: "Çoklu ajan AI", desc: "Vision + Thinking" },
  { Icon: IconTeamRoute, label: "Ekip yönlendirme", desc: "Temizlik & yol bakım" },
  { Icon: IconShieldKvkk, label: "KVKK uyumlu", desc: "Cansız obje analizi" },
] as const;

export function HeroSection() {
  return (
    <motion.section
      layout
      className="hero-shell relative overflow-hidden rounded-[1.75rem] px-6 py-9 sm:px-10 sm:py-11"
    >
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-white/[0.03] blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-12">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_IOS_GENTLE, delay: 0.04 }}
            className="hero-eyebrow mb-6 inline-flex items-center gap-3"
          >
            <span className="hero-eyebrow-mark" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
              Belediye saha denetim platformu
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_IOS_GENTLE, delay: 0.08 }}
            className="text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[2.35rem] lg:text-[2.85rem]"
          >
            Akıllı kentsel
            <span className="block text-foreground/72">çevre denetimi</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_IOS_GENTLE, delay: 0.14 }}
            className="mt-5 max-w-[34rem] text-[15px] leading-[1.65] text-muted sm:text-base"
          >
            Adres girin; dört yönlü Street View taraması, çoklu ajan yapay zekâ
            tespiti ve önceliklendirilmiş ekip önerileri ile kurumsal saha raporu
            alın.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...SPRING_IOS_GENTLE, delay: 0.2 }}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.08] pt-5 text-[11px] uppercase tracking-[0.14em] text-foreground/40"
          >
            <span>360° panorama</span>
            <span className="text-white/15">|</span>
            <span>Benchmark 9.2/10</span>
            <span className="text-white/15">|</span>
            <span>Çoklu ajan konsensüs</span>
            <span className="text-white/15">|</span>
            <span>KVKK uyumlu</span>
          </motion.div>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {STATS.map(({ Icon, label, desc }, i) => (
            <motion.div
              key={label}
              variants={staggerItem}
              whileHover={{ y: -2 }}
              transition={SPRING_IOS_GENTLE}
              className="stat-tile group flex flex-col gap-3 rounded-2xl p-4 sm:p-[1.125rem]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-foreground transition group-hover:border-white/18 group-hover:bg-white/[0.09]">
                  <Icon size={17} />
                </span>
                <span className="font-mono text-[10px] tabular-nums text-foreground/25">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div>
                <span className="block text-[13px] font-semibold tracking-[-0.01em] text-foreground">
                  {label}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-muted">
                  {desc}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
