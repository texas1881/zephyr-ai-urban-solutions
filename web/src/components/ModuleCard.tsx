import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  children: ReactNode;
};

/** Kurumsal modül kartı — sol mavi aksan çizgisi. */
export function ModuleCard({
  title,
  subtitle,
  badge,
  className = "",
  children,
}: Props) {
  return (
    <section
      className={`glass flex flex-col rounded-2xl border-l-[3px] border-l-primary p-6 ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p>
          )}
        </div>
        {badge && (
          <span className="shrink-0 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary-soft">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
