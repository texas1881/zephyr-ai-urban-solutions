import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import {
  parseBenchmarkCsv,
  type BenchmarkRunReport,
} from "@/lib/benchmarkEval";

export const runtime = "nodejs";

/** GET /api/benchmark — benchmark case listesi */
export async function GET() {
  try {
    const csvPath = join(process.cwd(), "benchmark", "locations.csv");
    const csv = readFileSync(csvPath, "utf8");
    const cases = parseBenchmarkCsv(csv);
    return NextResponse.json({
      success: true,
      data: {
        count: cases.length,
        imageSize: process.env.STREET_VIEW_IMAGE_SIZE || "640x640",
        detectionPipeline: [
          "OWL/DETR",
          process.env.HF_SYNTHESIS_MODEL || "Qwen/Qwen2.5-7B-Instruct",
          process.env.HF_ARBITER_MODEL || "Qwen/Qwen2.5-7B-Instruct",
        ],
        groundingDino: Boolean(process.env.HF_GROUNDING_DINO_ENDPOINT),
        cases,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "benchmark yüklenemedi",
      },
      { status: 500 },
    );
  }
}

/** POST /api/benchmark — son koşu raporunu backend'e ilet (proxy) */
export async function POST(req: Request) {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
  if (!backend) {
    return NextResponse.json(
      { success: false, message: "NEXT_PUBLIC_BACKEND_URL tanımlı değil" },
      { status: 400 },
    );
  }

  let report: BenchmarkRunReport;
  try {
    report = (await req.json()) as BenchmarkRunReport;
  } catch {
    return NextResponse.json(
      { success: false, message: "Geçersiz JSON" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${backend}/api/v1/cleanliness/benchmark/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    const body = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: body?.error ?? "backend hatası" },
        { status: res.status },
      );
    }
    return NextResponse.json({ success: true, data: body });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "backend erişilemedi",
      },
      { status: 502 },
    );
  }
}
