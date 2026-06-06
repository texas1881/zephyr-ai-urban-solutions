"use client";

export type NavItem = {
  id: string;
  label: string;
  icon?: string;
};

type Props = {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
};

/**
 * "Dynamic island" style segmented navigation with a sliding active pill.
 * Switches between dashboard modules without a page reload.
 */
export function DynamicNav({ items, active, onChange }: Props) {
  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.id === active),
  );
  const widthPct = 100 / items.length;

  return (
    <div className="mx-auto w-fit rounded-full border border-line bg-surface/90 p-1 shadow-sm backdrop-blur">
      <div
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}
      >
        <div
          className="absolute inset-y-0 rounded-full bg-primary shadow-sm transition-transform duration-300 ease-out"
          style={{
            width: `${widthPct}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                isActive ? "text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {item.icon && <span className="text-xs">{item.icon}</span>}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
