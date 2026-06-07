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

export function IconNavAnalyze({ className = "", size = 18 }: IconProps) {
  return base(
    size,
    className,
    <>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10.5" cy="10.5" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13 13l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconNavRecords({ className = "", size = 18 }: IconProps) {
  return base(
    size,
    className,
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 6.5v5c0 1.65 3.13 3 7 3s7-1.35 7-3v-5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 11.5v5c0 1.65 3.13 3 7 3s7-1.35 7-3v-5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </>,
  );
}

export function IconNavDashboard({ className = "", size = 18 }: IconProps) {
  return base(
    size,
    className,
    <>
      <rect
        x="3"
        y="3"
        width="8"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="13"
        y="3"
        width="8"
        height="5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="13"
        y="10"
        width="8"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="3"
        y="13"
        width="8"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </>,
  );
}
