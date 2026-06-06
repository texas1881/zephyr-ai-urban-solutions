import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  children: ReactNode;
};

/** Reusable dashboard module wrapper with a consistent titled header. */
export function ModuleCard({
  title,
  subtitle,
  badge,
  className = "",
  children,
}: Props) {
  return (
    <section
      className={`flex flex-col rounded-2xl border border-line bg-surface/60 p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {badge && (
          <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-muted">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
