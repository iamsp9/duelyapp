"use client";

import { useState, useRef } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { encryptData, decryptData } from "@/lib/crypto/aes";
import { deriveKey } from "@/lib/crypto/kdf";
import { toBase64, fromBase64 } from "@/lib/crypto/encoding";

export function BackupRestoreSettings() {
  const { user } = useAuth();
  
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
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput !== secret) {
      setError("Incorrect Master PIN. Please try again.");
      return;
    }

    setShowPinModal(false);

    if (action === "backup") {
      await executeBackup();
    } else if (action === "restore") {
      fileInputRef.current?.click();
    }
  };

  // Generates and downloads the securely encrypted .duely file
  const executeBackup = async () => {
    try {
      if (!user?.email) {
        showToast("Authentication required to encrypt backup files securely.", "error");
        return;
      }

      // 1. Generate salt and derive encryption key using user's email
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(user.email, salt);
      
      // 2. Encrypt the vault state
      const { ciphertext, iv } = await encryptData(key, vault);

      // 3. Create a payload representing the encrypted backup
      const backupPayload = {
        version: 2,
        ciphertext,
        iv,
        salt: toBase64(salt.buffer as ArrayBuffer),
      };

      const data = JSON.stringify(backupPayload, null, 2);
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
      
      showToast("Secure backup exported successfully.", "success");
    } catch (err) {
      console.error("Backup failed", err);
      showToast("Failed to create backup file.", "error");
    }
  };

  // Parses and decrypts the uploaded .duely file and updates the vault
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

      let vaultDataToRestore;

      // Check if it's the new encrypted format (version 2)
      if (parsedData.version === 2 && parsedData.ciphertext) {
        if (!user?.email) {
          showToast("You must be logged in to restore a secure backup.", "error");
          return;
        }

        try {
          const salt = fromBase64(parsedData.salt);
          const key = await deriveKey(user.email, salt);
          vaultDataToRestore = await decryptData(key, parsedData.ciphertext, parsedData.iv);
        } catch (decryptionError) {
          console.error("Decryption failed", decryptionError);
          showToast("Decryption failed. Please ensure you are logged in with the same email used for backup.", "error");
          return;
        }
      } else {
        // Fallback: Retain backward compatibility for older plain-text unencrypted backups
        vaultDataToRestore = parsedData;
      }

      // Basic validation to ensure we're injecting the right state shape
      if (!vaultDataToRestore || !Array.isArray(vaultDataToRestore.cards)) {
        throw new Error("Invalid vault data structure");
      }

      setVault(vaultDataToRestore);
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
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-400">
        <h4 className="font-semibold mb-1 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Encrypted Backup
        </h4>
        <p>
          Local backups are exported as <code className="bg-blue-500/20 px-1 rounded">.duely</code> files.
          <strong> These files are securely encrypted</strong> using your current account email <span className="font-medium text-blue-300">({user?.email || "not logged in"})</span>. You will need to be logged in with this same email to restore the backup in the future.
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