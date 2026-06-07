import { passesDisplayGate } from "@/features/detections/detectionOverlayUtils";
import type { DirectionDetectionOverlay } from "@/features/detections/detectionOverlayUtils";
import type { DirectionDetections } from "@/services/huggingFaceService";
import { getStreetViewImageDim } from "@/services/streetViewService";

/** OWL/DETR kutularını UI overlay formatına çevirir. */
export function buildDetectionOverlays(
  directions: DirectionDetections[],
): DirectionDetectionOverlay[] {
  const dim = getStreetViewImageDim();
  return directions.map((d) => ({
    direction: d.label,
    heading: d.heading,
    boxes: d.detections
      .filter((det) => passesDisplayGate(det.label, det.score))
      .slice(0, 10)
      .map((det) => ({
        label: det.label,
        score: det.score,
        x: det.box.xmin / dim,
        y: det.box.ymin / dim,
        w: (det.box.xmax - det.box.xmin) / dim,
        h: (det.box.ymax - det.box.ymin) / dim,
      })),
  }));
}
