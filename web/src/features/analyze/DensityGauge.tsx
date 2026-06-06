type Props = {
  score: number;
  size?: number;
};

function strokeColor(score: number): string {
  if (score >= 60) return "#ff453a";
  if (score >= 25) return "#d1d1d6";
  return "#ffffff";
}

export function DensityGauge({ score, size = 132 }: Props) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor(clamped)}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {clamped}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted">
          yoğunluk
        </span>
      </div>
    </div>
  );
}
