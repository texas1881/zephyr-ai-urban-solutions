"use client";

import { useEffect } from "react";
import { X, ZoomIn } from "lucide-react";
import { DetectionImageFrame } from "@/features/detections/DetectionImageFrame";
import type { DetectionBox } from "@/features/detections/detectionOverlayUtils";

type Props = {
  src: string;
  alt: string;
  label?: string;
  boxes?: DetectionBox[];
  onClose: () => void;
};

export function ImageLightbox({ src, alt, label, boxes, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Kapat"
      >
        <X size={20} />
      </button>

      <div
        className="relative flex max-h-[90vh] max-w-[min(96vw,1100px)] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {label && (
          <span className="mb-3 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white">
            {label}
          </span>
        )}
        <DetectionImageFrame
          src={src}
          alt={alt}
          boxes={boxes}
          interactive={false}
          fit="contain"
          className="aspect-[4/3] max-h-[82vh] w-full max-w-full rounded-xl shadow-2xl"
        />
        <p className="mt-3 flex items-center gap-1.5 text-xs text-white/60">
          <ZoomIn size={13} />
          Kapatmak için dışarı tıklayın veya Esc
        </p>
      </div>
    </div>
  );
}
