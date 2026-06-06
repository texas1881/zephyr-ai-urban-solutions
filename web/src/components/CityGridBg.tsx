/** Subtle monochrome background grid for hero. */

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
          <stop offset="0%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
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
            stroke="#fff"
            strokeOpacity="0.06"
          />
        </pattern>
      </defs>

      <rect width="480" height="480" fill="url(#isoGrid)" />
      <rect width="480" height="240" fill="url(#gridFade)" />

      <g fill="#fff" fillOpacity="0.04" stroke="#fff" strokeOpacity="0.08">
        <path d="M120 280 L160 260 L160 220 L120 240 Z" />
        <path d="M160 260 L200 280 L200 240 L160 220 Z" />
        <path d="M120 280 L160 260 L200 280 L160 300 Z" />
        <path d="M260 300 L310 275 L310 230 L260 255 Z" />
        <path d="M310 275 L360 300 L360 255 L310 230 Z" />
        <path d="M260 300 L310 275 L360 300 L310 325 Z" />
      </g>
    </svg>
  );
}
