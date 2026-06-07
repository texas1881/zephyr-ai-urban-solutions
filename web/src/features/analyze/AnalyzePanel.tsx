"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { IconAnalyze, IconPin } from "@/components/icons/FeatureIcons";
import { ScanPulse } from "@/components/icons/ScanPulse";
import { SPRING_BOUNCE, SPRING_SMOOTH } from "@/components/motion/springs";
import type {
  AnalysisRecord,
  AnalysisResult,
  ApiResponse,
} from "@/types/api";
import { SuccessFlash } from "@/components/ui/SuccessFlash";
import type { NavSignal } from "@/features/dashboard/HomeShell";
import { AnalysisResultView } from "./AnalysisResultView";

export type AnalysisUiState = "live" | "loading" | "success";

/** Kısa etiket → geocoding için tam sorgu */
const QUICK_TRY_SUGGESTIONS: { label: string; query: string }[] = [
  { label: "Başakşehir", query: "Başakşehir İstanbul" },
  { label: "Kayaşehir", query: "Kayaşehir Başakşehir İstanbul" },
  { label: "Taksim", query: "Taksim Meydanı Beyoğlu İstanbul" },
  { label: "Kadıköy", query: "Kadıköy İstanbul" },
  { label: "Beşiktaş", query: "Beşiktaş Meydanı İstanbul" },
  { label: "Şişli", query: "Halaskargazi Caddesi Şişli İstanbul" },
  { label: "Ataşehir", query: "Ataşehir İstanbul" },
  { label: "Üsküdar", query: "Üsküdar Meydanı İstanbul" },
  { label: "Fatih", query: "Fatih İstanbul" },
  { label: "Bakırköy", query: "Bakırköy İstanbul" },
  { label: "Maltepe", query: "Maltepe İstanbul" },
  { label: "Ümraniye", query: "Ümraniye İstanbul" },
  { label: "Sarıyer", query: "Sarıyer İstanbul" },
  { label: "Pendik", query: "Pendik İstanbul" },
  { label: "Eyüpsultan", query: "Eyüpsultan İstanbul" },
  { label: "Çakmak Sk.", query: "Çakmak Bağcı Sokak İstanbul" },
  { label: "Kartal", query: "Kartal İstanbul" },
  { label: "Beylikdüzü", query: "Beylikdüzü İstanbul" },
];

type Props = {
  onAnalyzed?: (result: AnalysisResult) => AnalysisRecord | void;
  onDispatch?: (id: string, team: string) => void;
  onNavSignal?: (signal: NavSignal) => void;
  onUiState?: (state: AnalysisUiState) => void;
};

export function AnalyzePanel({
  onAnalyzed,
  onDispatch,
  onNavSignal,
  onUiState,
}: Props) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [dispatchedTeam, setDispatchedTeam] = useState("");
  const [successFlash, setSuccessFlash] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function analyze(query: string) {
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    setError(null);
    setDispatchedTeam("");
    setSavedId(null);
    setSuccessFlash(false);
    onNavSignal?.("loading");
    onUiState?.("loading");
    try {
      const res = await fetch(`/api/analyze?address=${encodeURIComponent(value)}`);
      const body: ApiResponse<AnalysisResult> = await res.json();
      if (!body.success) throw new Error(body.message);
      setResult(body.data);
      const saved = onAnalyzed?.(body.data);
      if (saved) setSavedId(saved.id);
      onNavSignal?.("done");
      onUiState?.("success");
      setSuccessFlash(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz başarısız oldu");
      setResult(null);
      onNavSignal?.("idle");
      onUiState?.("live");
    } finally {
      setLoading(false);
    }
  }

  function handleDispatch(team: string) {
    if (savedId) onDispatch?.(savedId, team);
    setDispatchedTeam(team);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <motion.form
        layout
        onSubmit={(e) => {
          e.preventDefault();
          analyze(address);
        }}
        className="glass-strong flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-stretch sm:p-3.5"
      >
        <div className="relative flex-1">
          <IconPin
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adres veya mahalle girin (örn. Başakşehir)"
            className="input-field w-full rounded-xl py-3.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted"
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          transition={SPRING_BOUNCE}
          className="btn-primary flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm"
        >
          {loading ? (
            <>
              <ScanPulse />
              Analiz ediliyor…
            </>
          ) : (
            <>
              <IconAnalyze size={17} />
              Çevreyi Analiz Et
            </>
          )}
        </motion.button>
      </motion.form>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted">Hızlı dene:</span>
        <div className="quick-try-scroll flex w-full min-w-0 gap-2 overflow-x-auto pb-1">
          {QUICK_TRY_SUGGESTIONS.map(({ label, query }) => (
            <motion.button
              key={label}
              type="button"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.04, y: loading ? 0 : -1 }}
              whileTap={{ scale: loading ? 1 : 0.96 }}
              transition={SPRING_SMOOTH}
              onClick={() => {
                setAddress(query);
                analyze(query);
              }}
              className="chip shrink-0 rounded-lg px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-white/18 hover:text-foreground disabled:opacity-45"
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      <SuccessFlash
        show={successFlash}
        onHidden={() => setSuccessFlash(false)}
      />

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING_SMOOTH}
            className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </motion.div>
        )}

        {loading && !result && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING_SMOOTH}
            className="glass flex items-center gap-3.5 rounded-2xl p-6 text-sm text-muted"
          >
            <ScanPulse className="h-6 w-6 shrink-0 text-foreground" />
            <div>
              <p className="font-medium text-foreground/90">Analiz sürüyor</p>
              <p className="mt-0.5 text-xs">
                Sokağın dört yönü alınıyor ve çoklu ajan yapay zekâ ile
                taranıyor…
              </p>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="result"
            ref={resultRef}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SMOOTH}
          >
            <AnalysisResultView
              result={result}
              dispatchedTeam={dispatchedTeam}
              onDispatch={handleDispatch}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
