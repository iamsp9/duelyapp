"use client";

import {
  Settings,
  Database,
  UserCircle
} from "lucide-react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { useUIStore } from "@/stores/ui-store";
import { CardModals } from "@/components/cards/card-modals";
import { useVaultSync } from "@/hooks/use-vault-sync";

interface Props {
  children: React.ReactNode;
}

export function DashboardShell({ children }: Props) {
  const setManageCardsOpen = useUIStore((s) => s.setManageCardsOpen);

  // 🔐 Mount the Sync Engine: Watches state, encrypts locally, pushes to Supabase
  useVaultSync();

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020817]/90 backdrop-blur-2xl">
        <div className="mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-bold flex items-center gap-1.5 text-white">
              <span className="text-[18px]">💳</span> Duely
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => setManageCardsOpen(true)}
              className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 bg-transparent text-slate-400 transition-all active:bg-white/5"
            >
              <Settings className="size-[18px]" />
            </button>
            <button className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 bg-transparent text-slate-400 transition-all active:bg-white/5">
              <Database className="size-[18px]" />
            </button>
            <button className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 bg-transparent text-slate-400 transition-all active:bg-white/5">
              <UserCircle className="size-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-[14px] py-3 pb-24">
        {children}
      </section>

      <MobileNav />
      
      {/* Global Modals for Forms */}
      <CardModals />
    </main>
  );
}