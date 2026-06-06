/** Corporate Zephyr mark — city grid + shield motif. */

type Props = {
  className?: string;
  size?: number;
  showWordmark?: boolean;
};

export function ZephyrLogo({
  className = "",
  size = 40,
  showWordmark = false,
}: Props) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="Zephyr"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="zephyrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="10"
          fill="url(#zephyrGrad)"
        />
        {/* City skyline silhouette */}
        <path
          d="M10 32V22h4v10M18 32V18h3v14M25 32V24h5v8M34 32V20h4v12"
          fill="rgba(255,255,255,0.25)"
        />
        {/* Z monogram */}
        <path
          d="M14 14h20l-14 10h14v4H14l14-10H14v-4z"
          fill="#fff"
        />
        {/* Shield accent */}
        <path
          d="M24 36c-4-2-6-4-6-7v-2h12v2c0 3-2 5-6 7z"
          fill="rgba(255,255,255,0.35)"
        />
      </svg>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Zephyr
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
            Kentsel Saha Yönetimi
          </span>
        </div>
      )}
    </div>
  );
}
