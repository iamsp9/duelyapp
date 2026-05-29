// src/components/layout/mobile-nav.tsx
"use client";

import { LayoutDashboard, Receipt, CreditCard, BarChart2 } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const pathname = usePathname();
  const { tab, setTab, closeAllModals } = useUIStore();

  // Hide nav entirely on the security-sensitive Vault page
  if (pathname === "/vault") return null;

  const navItems = [
    { id: "home" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "bills" as const, label: "Bills", icon: Receipt },
    { id: "cards" as const, label: "Cards", icon: CreditCard },
    { id: "reports" as const, label: "Reports", icon: BarChart2 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#020817]/90 pb-[max(env(safe-area-inset-bottom),4px)] backdrop-blur-2xl">
      <div className="flex h-[60px] items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                closeAllModals(); // Dismiss any open modals on navigation
                setTab(item.id);
              }}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}