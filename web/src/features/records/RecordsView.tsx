"use client";

import type { AnalysisRecord, DispatchStatus } from "@/types/api";
import { priorityColor, priorityLabel } from "@/features/detections/priority";
import { computeRecordsStats } from "./recordsStats";

type Props = {
  records: AnalysisRecord[];
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
  resolved: "bg-white/10 text-emerald-300 ring-emerald-400/30",
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
          className="rounded-lg border border-line px-3 py-1 text-xs text-muted transition hover:border-danger/50 hover:text-danger"
        >
          Geçmişi temizle
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {records.map((r) => {
          const status: DispatchStatus = r.status ?? "pending";
          const canAssign =
            status === "pending" &&
            r.recommendedTeam &&
            r.recommendedTeam !== "—" &&
            typeof onAssign === "function";
          return (
            <li key={r.id} className="glass flex flex-col gap-3 rounded-2xl p-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
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
                      onClick={() => onAssign?.(r.id, r.recommendedTeam)}
                      className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-black transition hover:bg-primary-soft"
                    >
                      Ekip Yönlendir
                    </button>
                  )}
                  {status !== "resolved" && typeof onResolve === "function" && (
                    <button
                      onClick={() => onResolve?.(r.id)}
                      className="rounded-lg border border-line px-3 py-1 text-xs text-muted transition hover:border-emerald-400/50 hover:text-emerald-300"
                    >
                      Çözüldü
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
