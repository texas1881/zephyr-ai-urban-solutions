"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

type Props = {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
};

const SPRING = { type: "spring" as const, stiffness: 380, damping: 34 };

export function DynamicNav({ items, active, onChange }: Props) {
  return (
    <nav
      className="pointer-events-none fixed left-1/2 top-4 z-50 w-full max-w-3xl -translate-x-1/2 px-4"
      aria-label="Ana menü"
    >
      <div className="nav-shell pointer-events-auto rounded-2xl p-1">
        <div className="relative flex items-center">
          {items.map((item) => {
            const isActive = item.id === active;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40 ${
                  isActive ? "text-black" : "text-muted hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-white shadow-[0_2px_12px_rgba(255,255,255,0.25)]"
                    transition={SPRING}
                  />
                )}
                {Icon && (
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="relative z-10 shrink-0"
                  />
                )}
                <span className="relative z-10 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
