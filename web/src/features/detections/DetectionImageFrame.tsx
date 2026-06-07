"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { ScanPulse } from "@/components/icons/ScanPulse";
import { SPRING_IOS_GENTLE } from "@/components/motion/motionSystem";
import {
  boxColor,
  boxLabelTr,
  type DetectionBox,
} from "@/features/detections/detectionOverlayUtils";

type Props = {
  src: string;
  alt: string;
  label?: string;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  boxes?: DetectionBox[];
  /** cover = grid, contain = lightbox */
  fit?: "cover" | "contain";
};

/**
 * Görüntü + tespit çerçevesi (bounding box overlay).
 * OWL/DETR kutularını SVG ile görüntü üzerine bindirir.
 */
export function DetectionImageFrame({
  src,
  alt,
  label,
  className = "",
  onClick,
  interactive = true,
  boxes = [],
  fit = "cover",
}: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [showBoxes, setShowBoxes] = useState(boxes.length > 0);

  const hasBoxes = boxes.length > 0;
  const Wrapper = interactive && onClick ? "button" : "div";

  const toggleBoxes = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setShowBoxes((v) => !v);
    },
    [],
  );

  return (
    <Wrapper
      type={interactive && onClick ? "button" : undefined}
      onClick={onClick}
      className={`detection-frame sv-image-frame group relative overflow-hidden bg-black ${className} ${
        onClick
          ? "cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          : ""
      }`}
      aria-label={onClick ? `${alt} — büyüt` : undefined}
    >
      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            key="load"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/80"
          >
            <ScanPulse className="h-7 w-7 text-white/70" />
          </motion.div>
        )}
      </AnimatePresence>

      {status === "error" ? (
        <div className="flex h-full min-h-[120px] items-center justify-center p-4 text-center text-xs text-muted">
          Görüntü yüklenemedi
        </div>
      ) : (
        <div className="relative h-full w-full">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
            className={`h-full w-full transition duration-300 ${
              fit === "contain" ? "object-contain" : "object-cover"
            } ${
              status === "ready"
                ? "opacity-100 group-hover:scale-[1.02] group-hover:brightness-105"
                : "opacity-0"
            }`}
          />

          {hasBoxes && showBoxes && status === "ready" && (
            <svg
              className="detection-overlay pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              aria-hidden
            >
              {boxes.map((box, i) => (
                <g key={`${box.label}-${i}`}>
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.w}
                    height={box.h}
                    fill="none"
                    stroke={boxColor(box.label)}
                    strokeWidth={0.004}
                    rx={0.006}
                  />
                  <rect
                    x={box.x}
                    y={Math.max(0, box.y - 0.038)}
                    width={Math.min(0.55, box.w + 0.04)}
                    height={0.034}
                    fill="rgba(0,0,0,0.72)"
                    rx={0.004}
                  />
                  <text
                    x={box.x + 0.008}
                    y={Math.max(0.022, box.y - 0.01)}
                    fill="white"
                    fontSize={0.022}
                    fontFamily="system-ui, sans-serif"
                  >
                    {boxLabelTr(box.label)} %{Math.round(box.score * 100)}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      )}

      {label && (
        <span className="absolute left-2 top-2 z-20 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
          {label}
        </span>
      )}

      {hasBoxes && status === "ready" && (
        <button
          type="button"
          onClick={toggleBoxes}
          className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md border border-white/15 bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur transition hover:bg-black/85"
          aria-pressed={showBoxes}
          aria-label={showBoxes ? "Tespit kutularını gizle" : "Tespit kutularını göster"}
        >
          {showBoxes ? <EyeOff size={11} /> : <Eye size={11} />}
          {showBoxes ? "Kutular" : `${boxes.length} tespit`}
        </button>
      )}

      {onClick && status === "ready" && (
        <span className="pointer-events-none absolute bottom-2 right-2 z-20 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] text-white/85 opacity-0 backdrop-blur transition group-hover:opacity-100">
          Büyüt
        </span>
      )}

      {hasBoxes && showBoxes && status === "ready" && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_IOS_GENTLE}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-wrap gap-1 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2 pb-2 pt-6"
        >
          {boxes.slice(0, 4).map((box, i) => (
            <span
              key={`chip-${i}`}
              className="rounded border border-white/15 bg-black/55 px-1.5 py-0.5 text-[9px] text-white/90"
            >
              {boxLabelTr(box.label)}
            </span>
          ))}
          {boxes.length > 4 && (
            <span className="rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[9px] text-white/60">
              +{boxes.length - 4}
            </span>
          )}
        </motion.div>
      )}
    </Wrapper>
  );
}
