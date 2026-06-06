import { AlertOctagon, Gauge, MapPin, Trash2, type LucideIcon } from "lucide-react";
import type { DetectionPoint } from "@/types/api";

type Props = {
  detections: DetectionPoint[];
};

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-soft">
        <Icon size={17} />
      </span>
      <div className="flex flex-col">
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
        <span className="mt-0.5 text-xs text-muted">{label}</span>
      </div>
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
      <Stat label="Taranan bölge" value={total} icon={MapPin} />
      <Stat label="Kritik öncelik" value={critical} icon={AlertOctagon} />
      <Stat label="Tespit edilen obje" value={totalLitter} icon={Trash2} />
      <Stat label="Ort. yoğunluk" value={avgDensity} icon={Gauge} />
    </div>
  );
}
