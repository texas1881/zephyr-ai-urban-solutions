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
    <div className="glass-strong fixed left-1/2 top-4 z-50 w-fit -translate-x-1/2 rounded-full p-1 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
      <div
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}
      >
        <div
          className="absolute inset-y-0 rounded-full bg-white shadow-[0_2px_10px_rgba(255,255,255,0.25)] transition-transform duration-300 ease-out"
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
                isActive ? "text-black" : "text-muted hover:text-foreground"
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
