"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AppChrome } from "@/components/AppChrome";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroSection } from "@/components/HeroSection";
import { IconShieldKvkk } from "@/components/icons/FeatureIcons";
import {
  IconNavAnalyze,
  IconNavDashboard,
  IconNavRecords,
} from "@/components/icons/NavIcons";
import { SPRING_IOS_GENTLE, viewDirection } from "@/components/motion/motionSystem";
import { DynamicNav, type NavItem } from "@/features/navigation/DynamicNav";
import { useRecords } from "@/features/records/useRecords";
import { DashboardShell } from "./DashboardShell";

const NAV_ITEMS: NavItem[] = [
  { id: "analiz", label: "Analiz", icon: IconNavAnalyze },
  { id: "kayitlar", label: "Kayıtlar", icon: IconNavRecords },
  { id: "pano", label: "Pano", icon: IconNavDashboard },
];

export type NavSignal = "loading" | "done" | "idle";

export function HomeShell() {
  const [view, setView] = useState("analiz");
  const [tabDirection, setTabDirection] = useState(1);
  const [navPulse, setNavPulse] = useState<string | null>(null);
  const [navFlash, setNavFlash] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordsStore = useRecords();
  const { records } = recordsStore;

  const handleViewChange = useCallback(
    (id: string) => {
      setTabDirection(viewDirection(view, id));
      setView(id);
      window.requestAnimationFrame(() => {
        contentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    [view],
  );

  const handleNavSignal = useCallback((signal: NavSignal) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);

    if (signal === "loading") {
      setNavFlash(null);
      setNavPulse("analiz");
      return;
    }

    if (signal === "done") {
      setNavPulse(null);
      setNavFlash("analiz");
      flashTimer.current = setTimeout(() => setNavFlash(null), 1600);
      return;
    }

    setNavPulse(null);
  }, []);

  const footer = (
    <>
      <IconShieldKvkk size={14} className="text-muted" />
      <Link
        href="/kvkk"
        className="underline-offset-2 transition-colors hover:text-foreground hover:underline"
      >
        KVKK Aydınlatma Metni
      </Link>
      · Yalnızca kamusal alandaki cansız objeler analiz edilir · Cursor
      Hackathon 2026
    </>
  );

  return (
    <AppLayout
      chrome={
        <AppChrome
          nav={
            <DynamicNav
              items={NAV_ITEMS}
              active={view}
              onChange={handleViewChange}
              badges={{
                kayitlar: records.length,
                pano: records.length,
              }}
              pulseId={navPulse}
              flashId={navFlash}
            />
          }
        />
      }
      footer={footer}
    >
      <AnimatePresence mode="popLayout">
        {view === "analiz" && (
          <motion.div
            key="hero"
            layout
            initial={{ opacity: 0, y: 16, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={SPRING_IOS_GENTLE}
            className="overflow-hidden"
          >
            <HeroSection />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={contentRef}
        className="content-anchor scroll-mt-[calc(var(--chrome-h,7.5rem)+0.75rem)]"
      >
        <DashboardShell
          view={view}
          tabDirection={tabDirection}
          onViewChange={handleViewChange}
          onNavSignal={handleNavSignal}
          recordsStore={recordsStore}
        />
      </div>
    </AppLayout>
  );
}
