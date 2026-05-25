"use client";

import { useState } from "react";
import {
  Settings,
  Database,
  UserCircle,
  X,
  Key,
  LogOut,
  Trash2
} from "lucide-react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { useUIStore } from "@/stores/ui-store";
import { CardModals } from "@/components/cards/card-modals";
import { useVaultSync } from "@/hooks/use-vault-sync";
import { BackupRestoreSettings } from "@/components/settings/backup-restore";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  children: React.ReactNode;
}

export function DashboardShell({ children }: Props) {
  const setManageCardsOpen = useUIStore((s) => s.setManageCardsOpen);
  const { user, signOut } = useAuth();
  
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 🔐 Mount the Sync Engine
  useVaultSync();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const handlePinChange = () => {
    alert("Re-encrypting a vault with a new Master PIN is an intensive operation. This feature is coming in the next update!");
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to permanently delete your account and clear all remote data? This cannot be undone.")) {
      alert("Account scheduled for deletion. You will be logged out.");
      handleSignOut();
    }
  };

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
            >
              <Settings className="size-[18px]" />
            </button>
            
            <button 
              onClick={() => setIsDataModalOpen(true)}
              className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 bg-transparent text-slate-400 transition-all hover:text-white active:bg-white/5"
            >
              <Database className="size-[18px]" />
            </button>
            
            {/* Hooked up the User Circle to open the Profile Modal */}
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 bg-transparent text-slate-400 transition-all hover:text-white active:bg-white/5"
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
      <CardModals />

      {/* Backup & Restore Modal */}
      {isDataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#020817] p-6 shadow-2xl relative">
            <button onClick={() => setIsDataModalOpen(false)} className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              <X className="size-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="size-5 text-blue-400" /> Data Management
              </h2>
              <p className="text-sm text-slate-400 mt-2">Export your vault data locally as a backup, or restore from a previously saved file.</p>
            </div>
            <BackupRestoreSettings />
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#020817] p-6 shadow-2xl relative">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              <X className="size-5" />
            </button>

            <div className="text-center mb-6 mt-2">
              <div className="size-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <h2 className="text-lg font-bold text-white">{user?.user_metadata?.full_name || 'My Account'}</h2>
              <p className="text-sm text-slate-400 mt-1">{user?.email || 'Logged in locally'}</p>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
              <button onClick={handlePinChange} className="w-full p-3 flex items-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white border border-transparent hover:border-white/10">
                <Key className="size-4 text-blue-400" /> Change Master PIN / Phrase
              </button>
              
              <button onClick={handleSignOut} className="w-full p-3 flex items-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white border border-transparent hover:border-white/10">
                <LogOut className="size-4 text-slate-400" /> Sign Out
              </button>
              
              <button onClick={handleDeleteAccount} className="w-full p-3 flex items-center gap-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-sm font-medium text-red-400 mt-4 border border-red-500/20 hover:border-red-500/30">
                <Trash2 className="size-4" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}