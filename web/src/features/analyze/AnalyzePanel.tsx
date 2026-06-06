"use client";

import { useState } from "react";
import type {
  AnalysisRecord,
  AnalysisResult,
  ApiResponse,
} from "@/types/api";
import { AnalysisResultView } from "./AnalysisResultView";

const SUGGESTIONS = ["Başakşehir", "Kayaşehir", "Taksim", "Kadıköy"];

type Props = {
  onAnalyzed?: (result: AnalysisResult) => AnalysisRecord | void;
  onDispatch?: (id: string, team: string) => void;
};

export function AnalyzePanel({ onAnalyzed, onDispatch }: Props) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [dispatchedTeam, setDispatchedTeam] = useState("");

  async function analyze(query: string) {
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    setError(null);
    setDispatchedTeam("");
    setSavedId(null);
    try {
      const res = await fetch(`/api/analyze?address=${encodeURIComponent(value)}`);
      const body: ApiResponse<AnalysisResult> = await res.json();
      if (!body.success) throw new Error(body.message);
      setResult(body.data);
      const saved = onAnalyzed?.(body.data);
      if (saved) setSavedId(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz başarısız oldu");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleDispatch(team: string) {
    if (savedId) onDispatch?.(savedId, team);
    setDispatchedTeam(team);
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyze(address);
        }}
        className="glass-strong flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            ⌖
          </span>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adres veya mahalle girin (örn. Başakşehir)"
            className="w-full rounded-xl border border-line bg-black/30 py-3 pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-white/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-primary-soft disabled:opacity-50"
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
            className="rounded-full border border-line bg-surface px-3 py-1 text-foreground/80 transition hover:border-white/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && !result && (
        <div className="glass animate-pulse rounded-2xl p-6 text-sm text-muted">
          Sokağın dört yönü alınıyor ve Gemini görsel yapay zekâ ile analiz
          ediliyor…
        </div>
      )}

      {result && (
        <AnalysisResultView
          result={result}
          dispatchedTeam={dispatchedTeam}
          onDispatch={handleDispatch}
        />
      )}
    </div>
  );
}
