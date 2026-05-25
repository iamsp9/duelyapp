"use client";

import {
  Home,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

import {
  useUIStore,
  type AppTab,
} from "@/stores/ui-store";

const items: {
  key: AppTab;

  label: string;

  icon: React.ReactNode;
}[] = [
  {
    key: "home",

    label: "Home",

    icon: (
      <Home className="size-5" />
    ),
  },

  {
    key: "cards",

    label: "Cards",

    icon: (
      <CreditCard className="size-5" />
    ),
  },

  {
    key: "reports",

    label: "Reports",

    icon: (
      <BarChart3 className="size-5" />
    ),
  },

  {
    key: "settings",

    label: "Settings",

    icon: (
      <Settings className="size-5" />
    ),
  },
];

export function MobileNav() {
  const tab =
    useUIStore(
      (s) => s.tab
    );

  const setTab =
    useUIStore(
      (s) => s.setTab
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#020817]/95 backdrop-blur-2xl">
      <div className="mx-auto grid max-w-2xl grid-cols-4">
        {items.map((item) => {
          const active =
            tab === item.key;

          return (
            <button
              key={item.key}
              onClick={() =>
                setTab(
                  item.key
                )
              }
              className="flex flex-col items-center justify-center gap-1 py-3"
            >
              <div
                className={`transition ${
                  active
                    ? "text-blue-400"
                    : "text-slate-500"
                }`}
              >
                {item.icon}
              </div>

              <span
                className={`text-xs ${
                  active
                    ? "text-blue-400"
                    : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}