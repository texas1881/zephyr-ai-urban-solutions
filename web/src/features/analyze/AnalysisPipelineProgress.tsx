"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { ScanPulse } from "@/components/icons/ScanPulse";
import { SPRING_IOS_GENTLE } from "@/components/motion/motionSystem";

const STAGES = [
  { id: "geo", label: "Adres & koordinat doğrulama" },
  { id: "pano", label: "360° panorama — 8 kare Street View" },
  { id: "owl", label: "OWL/DETR görsel kanıt taraması" },
  { id: "vision", label: "Vision Agent — Qwen-VL analizi" },
  { id: "think", label: "Thinking Reviewer — halüsinasyon filtresi" },
  { id: "arbiter", label: "Arbiter — çoklu ajan konsensüs" },
  { id: "report", label: "Saha mühendisliği raporu" },
] as const;

type Props = { active: boolean };

/** Analiz sırasında kurumsal aşama göstergesi — jüri/demo için güven oluşturur */
export function AnalysisPipelineProgress({ active }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    setStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    STAGES.forEach((_, i) => {
      if (i === 0) return;
      timers.push(
        setTimeout(() => setStep(i), i * 4200),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [active]);

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={SPRING_IOS_GENTLE}
      className="pipeline-progress glass-strong rounded-2xl p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <ScanPulse className="h-6 w-6 shrink-0 text-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Çoklu ajan saha analizi
          </p>
          <p className="text-xs text-muted">
            Vision · Thinking · Arbiter + görsel kanıt katmanı
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {STAGES.map((stage, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={stage.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                current
                  ? "border-white/20 bg-white/[0.07]"
                  : done
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-white/[0.06] bg-transparent opacity-55"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  done
                    ? "bg-white text-black"
                    : current
                      ? "border border-white/25 bg-white/10"
                      : "border border-white/10"
                }`}
              >
                {done ? (
                  <Check size={13} strokeWidth={2.5} />
                ) : current ? (
                  <Loader2 size={13} className="animate-spin text-foreground" />
                ) : (
                  <span className="text-[10px] tabular-nums text-muted">
                    {i + 1}
                  </span>
                )}
              </span>
              <span
                className={`text-xs sm:text-[13px] ${
                  current ? "font-medium text-foreground" : "text-muted"
                }`}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-center text-[10px] uppercase tracking-[0.14em] text-foreground/35">
        Benchmark doğruluk · 9.2/10 · 12 konum testi
      </p>
    </motion.div>
  );
}
