"use client";

import { useState } from "react";
import {
  Settings,
  Database,
  UserCircle,
  X
} from "lucide-react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { useUIStore } from "@/stores/ui-store";
import { CardModals } from "@/components/cards/card-modals";
import { useVaultSync } from "@/hooks/use-vault-sync";

// Import the new Backup & Restore component we created
import { BackupRestoreSettings } from "@/components/settings/backup-restore";

interface Props {
  children: React.ReactNode;
}

export function DashboardShell({ children }: Props) {
  const setManageCardsOpen = useUIStore((s) => s.setManageCardsOpen);
  
  // Local state to manage the Backup/Restore modal visibility
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

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
              className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 bg-transparent text-slate-400 transition-all hover:text-white active:bg-white/5"
              aria-label="Settings"
            >
              <Settings className="size-[18px]" />
            </button>
            
            {/* Hooked up the Database button to open our Backup & Restore Modal */}
            <button 
              onClick={() => setIsDataModalOpen(true)}
              className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 bg-transparent text-slate-400 transition-all hover:text-white active:bg-white/5"
              aria-label="Data Management"
            >
              <Database className="size-[18px]" />
            </button>
            
            <button 
              className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 bg-transparent text-slate-400 transition-all hover:text-white active:bg-white/5"
              aria-label="Profile"
            >
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

      {/* Backup & Restore Modal Overlay */}
      {isDataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#020817] p-6 shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsDataModalOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="size-5 text-blue-400" /> Data Management
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Export your vault data locally as a backup, or restore from a previously saved file.
              </p>
            </div>

            {/* Injected Backup/Restore Component */}
            <BackupRestoreSettings />
            
          </div>
        </div>
      )}
    </main>
  );
}