"use client";

import { useState } from "react";
import { Compass, Grid2x2 } from "lucide-react";
import type { DetectionBox } from "@/features/detections/detectionOverlayUtils";
import type { AnalysisResult } from "@/types/api";
import { ImageLightbox } from "@/components/ImageLightbox";
import { SpringPress } from "@/components/motion/SpringPress";
import { StreetViewImage } from "./StreetViewImage";
import { Panorama360Viewer } from "./Panorama360Viewer";

type ViewMode = "grid" | "pano360";

type Props = {
  result: AnalysisResult;
};

export function StreetViewExplorer({ result }: Props) {
  const [mode, setMode] = useState<ViewMode>("grid");
  const [lightbox, setLightbox] = useState<{
    url: string;
    label: string;
    boxes?: DetectionBox[];
  } | null>(null);

  return (
    <>
      {lightbox && (
        <ImageLightbox
          src={lightbox.url}
          alt={`${result.address} — ${lightbox.label}`}
          label={lightbox.label}
          boxes={lightbox.boxes}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className="sv-explorer overflow-hidden rounded-t-2xl border-b border-line bg-black/30">
        <div className="flex items-center justify-between gap-2 border-b border-line bg-black/50 px-3 py-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
            Sokak görüntüsü
            {result.panoramaFrames ? (
              <span className="ml-2 text-foreground/50">
                · {result.panoramaFrames} kare 360° AI
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-0.5">
            <SpringPress
              type="button"
              onClick={() => setMode("grid")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === "grid"
                  ? "bg-white text-black"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Grid2x2 size={13} />
              4 Yön
            </SpringPress>
            <SpringPress
              type="button"
              onClick={() => setMode("pano360")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === "pano360"
                  ? "bg-white text-black"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Compass size={13} />
              360° Gezin
            </SpringPress>
          </div>
        </div>

        {mode === "pano360" ? (
          <Panorama360Viewer
            lat={result.lat}
            lng={result.lng}
            address={result.address}
            situations={result.situations}
          />
        ) : (
          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
            {result.directionImages.map((dir) => {
              const overlay = result.detectionOverlays?.find(
                (o) => o.direction === dir.label || o.heading === dir.heading,
              );
              return (
                <StreetViewImage
                  key={dir.heading}
                  src={dir.url}
                  alt={`${result.address} — ${dir.label}`}
                  label={dir.label}
                  boxes={overlay?.boxes}
                  onClick={() =>
                    setLightbox({
                      url: dir.url,
                      label: dir.label,
                      boxes: overlay?.boxes,
                    })
                  }
                  className="aspect-[4/3] w-full"
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
