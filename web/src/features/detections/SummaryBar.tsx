import type { DetectionPoint } from "@/types/api";

type Props = {
  detections: DetectionPoint[];
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </span>
      <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export function SummaryBar({ detections }: Props) {
  const total = detections.length;
  const critical = detections.filter((d) => d.priority === "critical").length;
  const totalLitter = detections.reduce((sum, d) => sum + d.litterCount, 0);
  const avgDensity =
    total === 0
      ? 0
      : Math.round(
          detections.reduce((sum, d) => sum + d.densityScore, 0) / total,
        );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Taranan bölge" value={total} />
      <Stat label="Kritik öncelik" value={critical} />
      <Stat label="Tespit edilen obje" value={totalLitter} />
      <Stat label="Ort. yoğunluk" value={avgDensity} />
    </div>
  );
}
