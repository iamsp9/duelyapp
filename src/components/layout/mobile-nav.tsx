"use client";

import { LayoutDashboard, CreditCard, BarChart2 } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function MobileNav() {
  const { tab, setTab } = useUIStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#020817]/90 pb-[max(env(safe-area-inset-bottom),4px)] backdrop-blur-2xl">
      <div className="flex h-[60px] items-center justify-around px-2">
        <button
          onClick={() => setTab("home")}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${tab === "home" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          <LayoutDashboard className="size-5" />
          <span className="text-[10px] font-medium tracking-wide">Dashboard</span>
        </button>

        <button
          onClick={() => setTab("cards")}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${tab === "cards" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          <CreditCard className="size-5" />
          <span className="text-[10px] font-medium tracking-wide">All Cards</span>
        </button>

        <button
          onClick={() => setTab("reports")}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${tab === "reports" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          <BarChart2 className="size-5" />
          <span className="text-[10px] font-medium tracking-wide">Reports</span>
        </button>
      </div>
    </div>
  );
}