// Decorative, dependency-free SVG "radar scan" animation for the hero.
// Pure SMIL animation — no client JS, renders fine in a server component.

export function HeroScanner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="presentation"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id="scanFade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Static grid rings */}
      <g fill="none" stroke="#fff" strokeOpacity="0.12">
        <circle cx="100" cy="100" r="30" />
        <circle cx="100" cy="100" r="55" />
        <circle cx="100" cy="100" r="80" />
        <line x1="100" y1="20" x2="100" y2="180" />
        <line x1="20" y1="100" x2="180" y2="100" />
      </g>

      {/* Pulsing radar pings */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx="100"
          cy="100"
          r="10"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
        >
          <animate
            attributeName="r"
            values="10;82"
            dur="3s"
            begin={`${i}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values="0.55;0"
            dur="3s"
            begin={`${i}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Rotating sweep wedge */}
      <g>
        <path d="M100 100 L100 20 A80 80 0 0 1 169 60 Z" fill="url(#sweep)" />
        <line x1="100" y1="100" x2="100" y2="20" stroke="#fff" strokeOpacity="0.6" />
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 100 100"
          to="360 100 100"
          dur="4s"
          repeatCount="indefinite"
        />
      </g>

      <circle cx="100" cy="100" r="42" fill="url(#scanFade)" />
      <circle cx="100" cy="100" r="3.5" fill="#fff" />
    </svg>
  );
}
