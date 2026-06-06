"use client";

import type { AnalysisRecord } from "@/types/api";
import { priorityColor, priorityLabel } from "@/features/detections/priority";
import { computeRecordsStats } from "./recordsStats";

type Props = {
  records: AnalysisRecord[];
  onClear: () => void;
  onRemove: (id: string) => void;
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface px-4 py-3 shadow-sm">
      <span className="font-serif text-2xl font-semibold text-foreground">
        {value}
      </span>
      <span className="mt-0.5 text-xs text-muted">{label}</span>
    </div>
  );
}

export function RecordsView({ records, onClear, onRemove }: Props) {
  const stats = computeRecordsStats(records);

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center">
        <p className="font-serif text-lg text-foreground">Henüz kayıt yok</p>
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
          className="rounded-lg border border-line px-3 py-1 text-xs text-muted transition hover:border-red-300 hover:text-red-600"
        >
          Geçmişi temizle
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {records.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.streetViewUrl}
              alt={r.address}
              className="h-12 w-16 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {r.address}
              </p>
              <p className="text-xs text-muted">
                {new Date(r.createdAt).toLocaleString("tr-TR")} ·{" "}
                {r.objects.length} obje
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
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
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
          </li>
        ))}
      </ul>
    </div>
  );
}
