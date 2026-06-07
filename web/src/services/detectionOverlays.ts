import { passesDisplayGate } from "@/features/detections/detectionOverlayUtils";
import type { DirectionDetectionOverlay } from "@/features/detections/detectionOverlayUtils";
import type { DirectionDetections } from "@/services/huggingFaceService";

const IMAGE_DIM = 640;

/** OWL/DETR kutularını UI overlay formatına çevirir. */
export function buildDetectionOverlays(
  directions: DirectionDetections[],
): DirectionDetectionOverlay[] {
  return directions.map((d) => ({
    direction: d.label,
    heading: d.heading,
    boxes: d.detections
      .filter((det) => passesDisplayGate(det.label, det.score))
      .slice(0, 10)
      .map((det) => ({
        label: det.label,
        score: det.score,
        x: det.box.xmin / IMAGE_DIM,
        y: det.box.ymin / IMAGE_DIM,
        w: (det.box.xmax - det.box.xmin) / IMAGE_DIM,
        h: (det.box.ymax - det.box.ymin) / IMAGE_DIM,
      })),
  }));
}
