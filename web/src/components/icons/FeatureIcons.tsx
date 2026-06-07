import type { ReactNode } from "react";

type IconProps = { className?: string; size?: number };

function base(size: number, className: string, children: ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconStreetScan({ className = "", size = 20 }: IconProps) {
  return base(
    size,
    className,
    <>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 10h18M8 5v14M16 5v14"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeOpacity="0.45"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.9" />
      <path
        d="M12 9.5V7M12 17v-2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconMultiAgent({ className = "", size = 20 }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="8" cy="10" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="10" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="16" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.2 11.8l1.6 2.4M13.8 11.8l-1.6 2.4M10.5 10h3"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconTeamRoute({ className = "", size = 20 }: IconProps) {
  return base(
    size,
    className,
    <>
      <path
        d="M4 18V8l8-4 8 4v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 18v-5h6v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 6v3M7 10h10"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <circle cx="17" cy="7" r="2" fill="currentColor" />
    </>,
  );
}

export function IconShieldKvkk({ className = "", size = 20 }: IconProps) {
  return base(
    size,
    className,
    <>
      <path
        d="M12 3.5L5 6.5v5.2c0 4.1 3 7.9 7 8.8 4-1 7-4.7 7-8.8V6.5L12 3.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2l1.8 1.8 3.5-3.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  );
}

export function IconAnalyze({ className = "", size = 20 }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 16l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.5 11h5M11 8.5v5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
    </>,
  );
}

export function IconPin({ className = "", size = 20 }: IconProps) {
  return base(
    size,
    className,
    <>
      <path
        d="M12 21s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.25" fill="currentColor" />
    </>,
  );
}
