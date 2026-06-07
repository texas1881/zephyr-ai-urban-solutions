export type BenchmarkCase = {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  expectedClean: boolean;
  expectedTypes: string[];
  minSituations: number;
  maxSituations: number;
  forbiddenTypes: string[];
  notes: string;
};

export type BenchmarkAnalysisSnapshot = {
  situationCount: number;
  types: string[];
  teams: string[];
  analysisModel: string;
  cleanliness: string;
  densityScore: number;
};

export type BenchmarkCaseResult = {
  caseId: string;
  address: string;
  pass: boolean;
  reasons: string[];
  expected: Pick<
    BenchmarkCase,
    "expectedClean" | "expectedTypes" | "minSituations" | "maxSituations"
  >;
  actual: BenchmarkAnalysisSnapshot;
  latencyMs: number;
  error?: string;
};

export type BenchmarkRunReport = {
  runId: string;
  startedAt: string;
  completedAt: string;
  baseUrl: string;
  imageSize: string;
  total: number;
  passed: number;
  failed: number;
  score: number;
  precision: number;
  cases: BenchmarkCaseResult[];
};

export function parseBenchmarkCsv(text: string): BenchmarkCase[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const str = (k: string) => cols[idx(k)]?.trim() ?? "";
    const num = (k: string) => {
      const v = Number(str(k));
      return Number.isFinite(v) ? v : undefined;
    };
    const bool = (k: string) => str(k).toLowerCase() === "true";
    const list = (k: string) =>
      str(k)
        ? str(k)
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    return {
      id: str("id"),
      address: str("address"),
      lat: num("lat"),
      lng: num("lng"),
      expectedClean: bool("expected_clean"),
      expectedTypes: list("expected_types"),
      minSituations: num("min_situations") ?? 0,
      maxSituations: num("max_situations") ?? 3,
      forbiddenTypes: list("forbidden_types"),
      notes: str("notes"),
    };
  });
}

export function evaluateCase(
  testCase: BenchmarkCase,
  actual: BenchmarkAnalysisSnapshot,
  latencyMs: number,
  error?: string,
): BenchmarkCaseResult {
  const reasons: string[] = [];
  let pass = !error;

  if (error) {
    reasons.push(`API hatası: ${error}`);
    pass = false;
  } else {
    const count = actual.situationCount;

    if (testCase.expectedClean && count > 0) {
      pass = false;
      reasons.push(`Temiz bekleniyordu, ${count} tespit geldi`);
    }

    if (!testCase.expectedClean && testCase.expectedTypes.length > 0) {
      const overlap = testCase.expectedTypes.some((t) =>
        actual.types.includes(t),
      );
      if (!overlap && count === 0) {
        pass = false;
        reasons.push(
          `Beklenen tiplerden biri yok: ${testCase.expectedTypes.join("|")}`,
        );
      }
    }

    if (count < testCase.minSituations) {
      pass = false;
      reasons.push(`Min ${testCase.minSituations} tespit, gelen ${count}`);
    }
    if (count > testCase.maxSituations) {
      pass = false;
      reasons.push(`Max ${testCase.maxSituations} tespit, gelen ${count}`);
    }

    for (const forbidden of testCase.forbiddenTypes) {
      if (actual.types.includes(forbidden)) {
        pass = false;
        reasons.push(`Yasak tip tespit edildi: ${forbidden}`);
      }
    }
  }

  return {
    caseId: testCase.id,
    address: testCase.address,
    pass,
    reasons,
    expected: {
      expectedClean: testCase.expectedClean,
      expectedTypes: testCase.expectedTypes,
      minSituations: testCase.minSituations,
      maxSituations: testCase.maxSituations,
    },
    actual,
    latencyMs,
    error,
  };
}

export function summarizeRun(cases: BenchmarkCaseResult[]): {
  passed: number;
  failed: number;
  score: number;
  precision: number;
} {
  const total = cases.length;
  const passed = cases.filter((c) => c.pass).length;
  const failed = total - passed;
  const score = total > 0 ? Math.round((passed / total) * 100) / 10 : 0;
  const cleanExpected = cases.filter((c) => c.expected.expectedClean);
  const cleanCorrect = cleanExpected.filter(
    (c) => c.pass && c.actual.situationCount === 0,
  ).length;
  const precision =
    cleanExpected.length > 0
      ? Math.round((cleanCorrect / cleanExpected.length) * 100)
      : passed > 0
        ? Math.round((passed / total) * 100)
        : 0;

  return { passed, failed, score, precision };
}
