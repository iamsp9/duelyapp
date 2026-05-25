"use client";

import {
  Bell,
} from "lucide-react";

import {
  MobileNav,
} from "@/components/layout/mobile-nav";

interface Props {
  children: React.ReactNode;
}

export function DashboardShell({
  children,
}: Props) {
  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020817]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/15 p-2 text-blue-400">
              💳
            </div>

            <div>
              <div className="text-lg font-semibold">
                Duely
              </div>
            </div>
          </div>

          <button className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Bell className="size-5 text-slate-300" />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 pb-28">
        {children}
      </section>

      <MobileNav />
    </main>
  );
}