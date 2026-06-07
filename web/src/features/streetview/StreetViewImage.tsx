"use client";

import type { DetectionBox } from "@/features/detections/detectionOverlayUtils";
import { DetectionImageFrame } from "@/features/detections/DetectionImageFrame";

type Props = {
  src: string;
  alt: string;
  label?: string;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  /** OWL/DETR bounding box'ları — varsa çerçeve overlay aktif */
  boxes?: DetectionBox[];
};

/** Street View kare — tespit çerçevesi destekli görüntü gösterimi. */
export function StreetViewImage({
  boxes,
  ...props
}: Props) {
  return <DetectionImageFrame boxes={boxes} {...props} />;
}
