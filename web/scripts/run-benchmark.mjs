#!/usr/bin/env node
/**
 * Zephyr benchmark runner
 * Usage:
 *   node scripts/run-benchmark.mjs
 *   BENCHMARK_BASE_URL=https://web-zephyr8.vercel.app node scripts/run-benchmark.mjs
 *   BACKEND_URL=https://zephyr-backend-2mtm.onrender.com node scripts/run-benchmark.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const BASE_URL = (
  process.env.BENCHMARK_BASE_URL ||
  process.env.NEXT_PUBLIC_VERCEL_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  ""
).replace(/\/$/, "");

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (n) => header.indexOf(n);
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const s = (k) => cols[idx(k)]?.trim() ?? "";
    const list = (k) =>
      s(k)
        ? s(k)
            .split("|")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];
    return {
      id: s("id"),
      address: s("address"),
      lat: Number(s("lat")) || undefined,
      lng: Number(s("lng")) || undefined,
      expectedClean: s("expected_clean").toLowerCase() === "true",
      expectedTypes: list("expected_types"),
      minSituations: Number(s("min_situations")) || 0,
      maxSituations: Number(s("max_situations")) || 3,
      forbiddenTypes: list("forbidden_types"),
      notes: s("notes"),
    };
  });
}

function evaluate(testCase, actual, latencyMs, error) {
  const reasons = [];
  let pass = !error;
  if (error) {
    reasons.push(`API: ${error}`);
    pass = false;
  } else {
    const count = actual.situationCount;
    if (testCase.expectedClean && count > 0) {
      pass = false;
      reasons.push(`Temiz bekleniyordu, ${count} tespit`);
    }
    if (
      !testCase.expectedClean &&
      testCase.expectedTypes.length &&
      !testCase.expectedTypes.some((t) => actual.types.includes(t)) &&
      count === 0
    ) {
      pass = false;
      reasons.push(`Beklenen tip yok: ${testCase.expectedTypes.join("|")}`);
    }
    if (count < testCase.minSituations) {
      pass = false;
      reasons.push(`Min ${testCase.minSituations}, gelen ${count}`);
    }
    if (count > testCase.maxSituations) {
      pass = false;
      reasons.push(`Max ${testCase.maxSituations}, gelen ${count}`);
    }
    for (const f of testCase.forbiddenTypes) {
      if (actual.types.includes(f)) {
        pass = false;
        reasons.push(`Yasak tip: ${f}`);
      }
    }
  }
  return {
    caseId: testCase.id,
    address: testCase.address,
    pass,
    reasons,
    actual,
    latencyMs,
    error,
  };
}

async function analyzeCase(testCase) {
  const params = new URLSearchParams();
  if (testCase.lat && testCase.lng) {
    params.set("lat", String(testCase.lat));
    params.set("lng", String(testCase.lng));
  } else {
    params.set("address", testCase.address);
  }

  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}/api/analyze?${params}`, {
    signal: AbortSignal.timeout(180000),
  });
  const latencyMs = Date.now() - t0;

  if (!res.ok) {
    const body = await res.text();
    return {
      actual: null,
      latencyMs,
      error: `${res.status} ${body.slice(0, 200)}`,
    };
  }

  const json = await res.json();
  if (!json.success) {
    return { actual: null, latencyMs, error: json.message || "analyze failed" };
  }

  const d = json.data;
  return {
    actual: {
      situationCount: d.situations?.length ?? 0,
      types: (d.situations ?? []).map((s) => s.type),
      teams: d.recommendedTeams ?? (d.recommendedTeam ? [d.recommendedTeam] : []),
      analysisModel: d.analysisModel ?? "unknown",
      cleanliness: d.cleanliness ?? "",
      densityScore: d.densityScore ?? 0,
    },
    latencyMs,
  };
}

async function postToBackend(report) {
  if (!BACKEND_URL) {
    console.log("BACKEND_URL yok — sonuç yalnızca dosyaya yazıldı.");
    return;
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/cleanliness/benchmark/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!res.ok) {
      console.warn("Backend kayıt hatası:", res.status, await res.text());
      return;
    }
    const saved = await res.json();
    console.log("Backend kaydı:", saved.id ?? "ok");
  } catch (err) {
    console.warn("Backend erişilemedi:", err.message);
  }
}

async function main() {
  const csv = readFileSync(join(ROOT, "benchmark", "locations.csv"), "utf8");
  const cases = parseCsv(csv);
  const startedAt = new Date().toISOString();
  console.log(`Benchmark: ${cases.length} konum @ ${BASE_URL}\n`);

  const results = [];
  for (const testCase of cases) {
    process.stdout.write(`• ${testCase.id} ... `);
    const { actual, latencyMs, error } = await analyzeCase(testCase);
    // Art arda ağır isteklerde dış servis bağlantılarını rahatlatmak için nefes
    await new Promise((r) => setTimeout(r, 1500));
    const result = evaluate(
      testCase,
      actual ?? {
        situationCount: 0,
        types: [],
        teams: [],
        analysisModel: "error",
        cleanliness: "",
        densityScore: 0,
      },
      latencyMs,
      error,
    );
    results.push(result);
    console.log(result.pass ? "PASS" : `FAIL (${result.reasons.join("; ")})`);
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const score = total ? Math.round((passed / total) * 100) / 10 : 0;

  const report = {
    runId: `bench-${Date.now()}`,
    startedAt,
    completedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    imageSize: process.env.STREET_VIEW_IMAGE_SIZE || "640x640",
    total,
    passed,
    failed: total - passed,
    score,
    precision: score * 10,
    cases: results,
  };

  const outPath = join(ROOT, "benchmark", "last-run.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nSonuç: ${passed}/${total} geçti — skor ${score}/10`);
  console.log(`Rapor: ${outPath}`);

  await postToBackend(report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
