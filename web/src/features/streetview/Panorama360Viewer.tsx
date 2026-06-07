"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { headingToSector, streetViewProxyUrl } from "@/services/streetViewService";
import { StreetViewImage } from "./StreetViewImage";
import {
  PanoScanSidebar,
  type LiveDetection,
} from "./PanoScanSidebar";
import type { DetectedSituation } from "@/types/api";
import { SpringPress } from "@/components/motion/SpringPress";

type Props = {
  lat: number;
  lng: number;
  address: string;
  situations: DetectedSituation[];
};

const PRELOAD_OFFSETS = [-45, 0, 45];

export function Panorama360Viewer({
  lat,
  lng,
  address,
  situations,
}: Props) {
  const [heading, setHeading] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [liveDetections, setLiveDetections] = useState<LiveDetection[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startH: number } | null>(null);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sector = headingToSector(heading);
  const imageUrl = streetViewProxyUrl(lat, lng, Math.round(heading));

  const runScan = useCallback(
    async (h: number) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setScanning(true);
      setScanError(null);
      try {
        const res = await fetch(
          `/api/scan-frame?lat=${lat}&lng=${lng}&heading=${Math.round(h)}`,
          { signal: ac.signal },
        );
        const body = await res.json();
        if (!body.success) throw new Error(body.message);
        setLiveDetections(body.data.detections ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setScanError(
          err instanceof Error ? err.message : "Anlık tarama başarısız",
        );
        setLiveDetections([]);
      } finally {
        setScanning(false);
      }
    },
    [lat, lng],
  );

  useEffect(() => {
    if (scanTimer.current) clearTimeout(scanTimer.current);
    scanTimer.current = setTimeout(() => runScan(heading), 900);
    return () => {
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, [heading, runScan]);

  useEffect(() => {
    for (const off of PRELOAD_OFFSETS) {
      const h = (Math.round(heading) + off + 360) % 360;
      const img = new Image();
      img.src = streetViewProxyUrl(lat, lng, h);
    }
  }, [heading, lat, lng]);

  function nudge(delta: number) {
    setHeading((h) => (h + delta + 360) % 360);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") nudge(-12);
      if (e.key === "ArrowRight") nudge(12);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onPointerDown(e: ReactPointerEvent) {
    dragRef.current = { startX: e.clientX, startH: heading };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const delta = dx * 0.35;
    setHeading((dragRef.current.startH - delta + 360) % 360);
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div className="pano-360-layout grid min-h-[min(72vh,520px)] grid-cols-1 lg:grid-cols-[minmax(220px,280px)_1fr]">
      <PanoScanSidebar
        heading={heading}
        sector={sector}
        scanning={scanning}
        liveDetections={liveDetections}
        situations={situations}
        error={scanError}
      />

      <div className="relative flex min-h-[280px] flex-col bg-black lg:min-h-0">
        <div
          className="relative flex-1 touch-pan-y select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <StreetViewImage
            src={imageUrl}
            alt={`${address} — ${Math.round(heading)}°`}
            label={`${Math.round(heading)}°`}
            interactive={false}
            className="h-full min-h-[280px] w-full lg:min-h-[420px]"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

          <motion.div
            className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[10px] text-white/80 backdrop-blur"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            Sürükleyerek 360° gezin
          </motion.div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/60 px-3 py-2">
          <SpringPress
            type="button"
            onClick={() => nudge(-15)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10"
            aria-label="Sola dön"
          >
            <ChevronLeft size={18} />
          </SpringPress>
          <span className="text-xs tabular-nums text-white/70">
            {Math.round(heading)}° · {sector}
          </span>
          <SpringPress
            type="button"
            onClick={() => nudge(15)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10"
            aria-label="Sağa dön"
          >
            <ChevronRight size={18} />
          </SpringPress>
        </div>
      </div>
    </div>
  );
}
