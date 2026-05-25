"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

const items = [
  {
    href: "/dashboard",
    label: "Home",
    icon: LayoutGrid,
  },
  {
    href: "/cards",
    label: "Cards",
    icon: CreditCard,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-black/40 backdrop-blur-2xl">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1"
            >
              <item.icon
                className={`size-5 ${
                  active
                    ? "text-blue-500"
                    : "text-slate-500"
                }`}
              />

              <span
                className={`text-[11px] ${
                  active
                    ? "text-blue-500"
                    : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}