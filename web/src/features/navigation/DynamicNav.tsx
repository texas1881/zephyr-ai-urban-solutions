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

/**
 * "Dynamic island" style segmented navigation. The active pill slides between
 * items using a shared framer-motion layout animation (spring), and each item
 * renders a real lucide SVG icon.
 */
export function DynamicNav({ items, active, onChange }: Props) {
  return (
    <div className="glass-strong fixed left-1/2 top-4 z-50 w-fit -translate-x-1/2 rounded-full p-1 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
      <div className="relative flex">
        {items.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                isActive ? "text-black" : "text-muted hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_2px_10px_rgba(255,255,255,0.25)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {Icon && <Icon size={15} strokeWidth={2.2} />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
