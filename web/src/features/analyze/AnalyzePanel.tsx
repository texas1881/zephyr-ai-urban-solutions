"use client";

import { useState } from "react";
import type { AnalysisResult, ApiResponse } from "@/types/api";
import { AnalysisResultView } from "./AnalysisResultView";

const SUGGESTIONS = ["Başakşehir", "Kayaşehir", "Taksim", "Kadıköy"];

type Props = {
  onAnalyzed?: (result: AnalysisResult) => void;
};

export function AnalyzePanel({ onAnalyzed }: Props) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function analyze(query: string) {
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze?address=${encodeURIComponent(value)}`);
      const body: ApiResponse<AnalysisResult> = await res.json();
      if (!body.success) throw new Error(body.message);
      setResult(body.data);
      onAnalyzed?.(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz başarısız oldu");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyze(address);
        }}
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            ⌖
          </span>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adres veya mahalle girin (örn. Başakşehir)"
            className="w-full rounded-xl border border-line bg-background py-3 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-soft disabled:opacity-60"
        >
          {loading ? "Analiz ediliyor…" : "Çevreyi Analiz Et"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Hızlı dene:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setAddress(s);
              analyze(s);
            }}
            className="rounded-full border border-line bg-surface px-3 py-1 transition hover:border-primary hover:text-primary"
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !result && (
        <div className="animate-pulse rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
          Sokak görüntüsü alınıyor ve yapay zekâ ile analiz ediliyor…
        </div>
      )}

      {result && <AnalysisResultView result={result} />}
    </div>
  );
}
