"use client";

import {
  Bell,
  CreditCard,
  Settings,
  BarChart3,
} from "lucide-react";

import {
  useUIStore,
} from "@/stores/ui-store";

interface Props {
  children: React.ReactNode;
}

export function DashboardShell({
  children,
}: Props) {
  const setModal =
    useUIStore(
      (state) => state.setModal
    );

  return (
    <main className="min-h-screen bg-background text-white pb-32">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1020]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            💳 Duely
          </div>

          <div className="flex items-center gap-2">
            <IconButton
              icon={
                <Bell className="size-5" />
              }
            />

            <IconButton
              icon={
                <CreditCard className="size-5" />
              }
              onClick={() =>
                setModal("cards")
              }
            />

            <IconButton
              icon={
                <BarChart3 className="size-5" />
              }
              onClick={() =>
                setModal(
                  "reports"
                )
              }
            />

            <IconButton
              icon={
                <Settings className="size-5" />
              }
              onClick={() =>
                setModal(
                  "settings"
                )
              }
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </main>
  );
}

function IconButton({
  icon,
  onClick,
}: {
  icon: React.ReactNode;

  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="size-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
    >
      {icon}
    </button>
  );
}