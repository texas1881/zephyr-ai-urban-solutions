import type { DetectionPoint } from "@/types/api";
import { densityBarColor, priorityColor, priorityLabel } from "./priority";

type Props = {
  detection: DetectionPoint;
  rank: number;
};

export function DetectionCard({ detection, rank }: Props) {
  return (
    <li className="glass flex items-center gap-4 rounded-2xl p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-foreground">
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-foreground">
            {detection.location}
          </p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityColor[detection.priority]}`}
          >
            {priorityLabel[detection.priority]}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-muted">
          {detection.litterCount} obje tespit edildi
        </p>

        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full ${densityBarColor(detection.densityScore)}`}
              style={{ width: `${detection.densityScore}%` }}
            />
          </div>
          <span className="w-12 text-right text-sm font-semibold tabular-nums text-foreground">
            {detection.densityScore}
          </span>
        </div>
      </div>
    </li>
  );
}
