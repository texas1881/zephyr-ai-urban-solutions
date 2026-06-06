import type { DetectionPoint } from "@/types/api";
import { densityBarColor, priorityColor, priorityLabel } from "./priority";

type Props = {
  detection: DetectionPoint;
  rank: number;
};

export function DetectionCard({ detection, rank }: Props) {
  return (
    <li className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
            {detection.location}
          </p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityColor[detection.priority]}`}
          >
            {priorityLabel[detection.priority]}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {detection.litterCount} obje tespit edildi
        </p>

        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${densityBarColor(detection.densityScore)}`}
              style={{ width: `${detection.densityScore}%` }}
            />
          </div>
          <span className="w-12 text-right text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
            {detection.densityScore}
          </span>
        </div>
      </div>
    </li>
  );
}
