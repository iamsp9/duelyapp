"use client";

import { useState, useRef } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function BackupRestoreSettings() {
  // Pull state and setter from Zustand
  const vault = useVaultStore((state) => state.vault);
  const secret = useVaultStore((state) => state.secret);
  const setVault = useVaultStore((state) => state.setVault);

  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [action, setAction] = useState<"backup" | "restore" | null>(null);
  const [error, setError] = useState("");
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleInitiateBackup = () => {
    setAction("backup");
    setPinInput("");
    setError("");
    setShowPinModal(true);
  };

  const handleInitiateRestore = () => {
    setAction("restore");
    setPinInput("");
    setError("");
    setShowPinModal(true);
  };

  // Verifies PIN against the current session's secret
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput !== secret) {
      setError("Incorrect Master PIN. Please try again.");
      return;
    }

    setShowPinModal(false);

    if (action === "backup") {
      executeBackup();
    } else if (action === "restore") {
      fileInputRef.current?.click();
    }
  };

  // Generates and downloads the .duely file
  const executeBackup = () => {
    try {
      const data = JSON.stringify(vault, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      
      const date = new Date().toISOString().split("T")[0];
      a.download = `duely-backup-${date}.duely`; // Proprietary extension
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast("Backup file exported successfully.", "success");
    } catch (err) {
      console.error("Backup failed", err);
      showToast("Failed to create backup file.", "error");
    }
  };

  // Parses the uploaded .duely file and updates the vault
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".duely")) {
      showToast("Invalid file format. Please select a .duely backup file.", "error");
      return;
    }

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      // Basic validation to ensure we're injecting the right state shape
      if (!parsedData || !Array.isArray(parsedData.cards)) {
        throw new Error("Invalid vault data structure");
      }

      setVault(parsedData);
      showToast("Vault restored successfully!", "success");
    } catch (err) {
      console.error("Restore failed", err);
      showToast("Failed to restore data. The file might be corrupted or invalid.", "error");
    } finally {
      // Reset the file input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-300 w-max max-w-[90%] whitespace-nowrap">
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 text-green-500" />
          ) : (
            <AlertCircle className="size-5 text-red-500" />
          )}
          <span className="text-[13px] font-medium text-white">{toast.message}</span>
        </div>
      )}

      {/* Disclaimer Section */}
      <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-400">
        <h4 className="font-semibold mb-1 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          Important Security Disclaimer
        </h4>
        <p>
          Local backups are exported as plain text <code className="bg-orange-500/20 px-1 rounded">.duely</code> files.
          <strong> This file is NOT encrypted.</strong> Any third-party app or person with access to this file can read your vault data. Please store it securely.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleInitiateBackup}
          className="flex-1 flex items-center justify-center gap-2 rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
        >
          Export Backup (.duely)
        </button>
        <button
          onClick={handleInitiateRestore}
          className="flex-1 flex items-center justify-center gap-2 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          Restore from .duely
        </button>
      </div>

      {/* Hidden File Input for Restore */}
      <input
        type="file"
        accept=".duely"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-[#020817] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              Enter Master PIN
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Please verify your identity to authorize this {action} operation.
            </p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-widest text-lg"
                placeholder="••••••"
                maxLength={6}
                inputMode="numeric"
                autoFocus
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}