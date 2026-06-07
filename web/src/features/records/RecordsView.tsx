"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { Check, Send, Trash2 } from "lucide-react";
import type { AnalysisRecord, DispatchStatus } from "@/types/api";
import { priorityColor, priorityLabel } from "@/features/detections/priority";
import { resolvePrimaryTeam } from "@/features/analyze/teamRouting";
import { computeRecordsStats } from "./recordsStats";

type Props = {
  records: AnalysisRecord[];
  syncError?: string | null;
  onClear: () => void;
  onRemove: (id: string) => void;
  onAssign?: (id: string, team: string) => void;
  onResolve?: (id: string) => void;
};

const STATUS_LABEL: Record<DispatchStatus, string> = {
  pending: "Beklemede",
  assigned: "Yönlendirildi",
  resolved: "Çözüldü",
};

const STATUS_COLOR: Record<DispatchStatus, string> = {
  pending: "bg-white/10 text-amber-300 ring-amber-400/30",
  assigned: "bg-white/10 text-sky-300 ring-sky-400/30",
  resolved: "bg-white/10 text-foreground/80 ring-white/20",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass flex flex-col rounded-2xl px-4 py-3">
      <span className="text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <span className="mt-0.5 text-xs text-muted">{label}</span>
    </div>
  );
}

export function RecordsView({
  records,
  syncError,
  onClear,
  onRemove,
  onAssign,
  onResolve,
}: Props) {
  const stats = computeRecordsStats(records);

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/40 p-10 text-center">
        <p className="text-lg font-semibold tracking-tight text-foreground">
          Henüz kayıt yok
        </p>
        <p className="mt-1 text-sm text-muted">
          “Analiz” modülünden bir adres analiz ettiğinizde sonuçlar burada
          birikir.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {syncError && (
        <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200/90">
          {syncError}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Toplam analiz" value={stats.total} />
        <Stat label="Ort. yoğunluk" value={stats.avgDensity} />
        <Stat label="Kritik bölge" value={stats.byPriority.critical} />
        <Stat label="Tespit edilen obje" value={stats.totalObjects} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Analiz Geçmişi</h3>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1 text-xs text-muted transition hover:border-danger/50 hover:text-danger"
        >
          <Trash2 size={13} />
          Geçmişi temizle
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {records.map((r, idx) => {
          const status: DispatchStatus = r.status ?? "pending";
          const canAssign =
            status === "pending" &&
            r.recommendedTeam &&
            r.recommendedTeam !== "—" &&
            typeof onAssign === "function";
          return (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              className="glass flex flex-col gap-3 rounded-2xl p-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={r.streetViewUrl}
                  alt={r.address}
                  className="h-12 w-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.address}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(r.createdAt).toLocaleString("tr-TR")} ·{" "}
                    {(r.situations?.length ?? r.objects.length)} durum
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityColor[r.priority]}`}
                  >
                    {priorityLabel[r.priority]}
                  </span>
                  <span className="w-8 text-right font-serif text-lg font-semibold text-foreground">
                    {r.densityScore}
                  </span>
                  <button
                    onClick={() => onRemove(r.id)}
                    aria-label="Kaydı sil"
                    title="Kaydı sil"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition hover:border-danger/50 hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COLOR[status]}`}
                >
                  {STATUS_LABEL[status]}
                </span>
                {r.assignedTeam ? (
                  <span className="text-xs text-muted">
                    Ekip: {r.assignedTeam}
                  </span>
                ) : r.recommendedTeam && r.recommendedTeam !== "—" ? (
                  <span className="text-xs text-muted">
                    Önerilen: {r.recommendedTeam}
                  </span>
                ) : null}

                <div className="ml-auto flex items-center gap-2">
                  {canAssign && (
                    <button
                      onClick={() =>
                        onAssign?.(
                          r.id,
                          resolvePrimaryTeam(
                            r.recommendedTeam,
                            r.recommendedTeams,
                          ),
                        )
                      }
                      className="btn-primary flex items-center gap-1.5 rounded-md px-3 py-1 text-xs"
                    >
                      <Send size={12} />
                      Ekip Yönlendir
                    </button>
                  )}
                  {status !== "resolved" && typeof onResolve === "function" && (
                    <button
                      onClick={() => onResolve?.(r.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1 text-xs text-muted transition hover:border-white/30 hover:text-foreground"
                    >
                      <Check size={12} />
                      Çözüldü
                    </button>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
