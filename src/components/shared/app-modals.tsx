"use client";

import { useUIStore } from "@/stores/ui-store";
import { useVaultStore } from "@/stores/vault-store";
import { Modal } from "@/components/ui/modal";
import { LogOut, Download, UploadCloud } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function AppModals() {
  const { isProfileOpen, setProfileOpen, isBackupOpen, setBackupOpen } = useUIStore();
  const cards = useVaultStore((s) => s.vault.cards);
  const { signOut } = useAuth();

  const handleDownloadBackup = () => {
    // Generate simple JSON backup file
    const payload = { version: 3, exported: new Date().toISOString(), cards };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duely_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Profile Modal */}
      <Modal open={isProfileOpen} onClose={() => setProfileOpen(false)} title="👤 Account">
        <div className="space-y-2">
          <button 
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-medium text-red-400 transition-all active:bg-red-500/20 min-h-[44px]"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <button onClick={() => setProfileOpen(false)} className="w-full p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all active:bg-white/5 min-h-[44px]">
            Close
          </button>
        </div>
      </Modal>

      {/* Backup Modal */}
      <Modal open={isBackupOpen} onClose={() => setBackupOpen(false)} title="☁️ Backup & Restore">
        <p className="text-[13px] text-slate-400 mb-4 leading-relaxed">
          Data automatically syncs securely to Supabase. Use the options below for an additional local copy.
        </p>

        <div className="space-y-4">
          <div>
            <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Export Data</div>
            <button 
              onClick={handleDownloadBackup}
              className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-white/10 bg-[#111827] text-sm font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
            >
              <Download className="size-4" /> Download Backup (.json)
            </button>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Restore Data</div>
            <label className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-dashed border-white/20 bg-transparent text-sm font-medium text-slate-300 transition-all hover:bg-white/5 cursor-pointer min-h-[44px]">
              <UploadCloud className="size-4" />
              <span>Choose .json backup file</span>
              <input type="file" accept=".json" className="hidden" onChange={(e) => {
                alert("To complete restore functionality, map this back into your store's setVault action.");
                setBackupOpen(false);
              }} />
            </label>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <button onClick={() => setBackupOpen(false)} className="w-full p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all active:bg-white/5 min-h-[44px]">
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}