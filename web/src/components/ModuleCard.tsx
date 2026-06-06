import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  children: ReactNode;
};

export function ModuleCard({
  title,
  subtitle,
  badge,
  className = "",
  children,
}: Props) {
  return (
    <section
      className={`glass flex flex-col rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.45)] ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          )}
        </div>
        {badge && (
          <span className="shrink-0 rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] text-foreground/80">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
