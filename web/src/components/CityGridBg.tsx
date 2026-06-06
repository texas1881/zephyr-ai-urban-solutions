/** Subtle corporate background — isometric city grid, no animation. */

export function CityGridBg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 480"
      role="presentation"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <pattern
          id="isoGrid"
          width="28"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(1.2)"
        >
          <path
            d="M0 8 L14 0 L28 8 L14 16 Z"
            fill="none"
            stroke="#3b82f6"
            strokeOpacity="0.08"
          />
        </pattern>
      </defs>

      <rect width="480" height="480" fill="url(#isoGrid)" />
      <rect width="480" height="240" fill="url(#gridFade)" />

      {/* Building blocks — static isometric blocks */}
      <g fill="#3b82f6" fillOpacity="0.06" stroke="#3b82f6" strokeOpacity="0.1">
        <path d="M120 280 L160 260 L160 220 L120 240 Z" />
        <path d="M160 260 L200 280 L200 240 L160 220 Z" />
        <path d="M120 280 L160 260 L200 280 L160 300 Z" />

        <path d="M260 300 L310 275 L310 230 L260 255 Z" />
        <path d="M310 275 L360 300 L360 255 L310 230 Z" />
        <path d="M260 300 L310 275 L360 300 L310 325 Z" />

        <path d="M80 340 L120 320 L120 290 L80 310 Z" />
        <path d="M120 320 L155 340 L155 310 L120 290 Z" />
        <path d="M80 340 L120 320 L155 340 L120 360 Z" />
      </g>

      {/* Connection lines */}
      <g
        fill="none"
        stroke="#60a5fa"
        strokeOpacity="0.15"
        strokeWidth="1"
        strokeDasharray="4 6"
      >
        <line x1="160" y1="260" x2="310" y2="275" />
        <line x1="200" y1="280" x2="260" y2="300" />
        <line x1="120" y1="320" x2="160" y2="260" />
      </g>

      <circle cx="240" cy="200" r="60" fill="#3b82f6" fillOpacity="0.04" />
    </svg>
  );
}
