import { NextResponse } from "next/server";
import type { ApiResponse, DetectionPoint } from "@/types/api";
import { mockDetections } from "@/features/detections/mockData";

export async function GET() {
  const sorted = [...mockDetections].sort(
    (a, b) => b.densityScore - a.densityScore,
  );
  const body: ApiResponse<DetectionPoint[]> = {
    success: true,
    data: sorted,
  };
  return NextResponse.json(body);
}
