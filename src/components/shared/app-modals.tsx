// src/components/shared/app-modals.tsx
"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useVaultStore } from "@/stores/vault-store";
import { useCurrencyStore, CURRENCIES } from "@/stores/currency-store";
import { Modal } from "@/components/ui/modal";
import {
  LogOut,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Trash2,
  ChevronLeft,
  Coins,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createVault } from "@/lib/crypto/vault";
import { saveVault, scheduleAccountDeletion } from "@/lib/supabase/vaults";

type ProfileView = "menu" | "change_pin" | "delete_account" | "currency";

export function AppModals() {
  const { isProfileOpen, setProfileOpen, isBackupOpen, setBackupOpen } = useUIStore();
  const { vault, archiveVault, secret, setAuth, setVaultCurrency } = useVaultStore();
  const cards = vault.cards;
  const { user, signOut } = useAuth();

  const { currencyCode, setCurrency } = useCurrencyStore();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [profileView, setProfileView] = useState<ProfileView>("menu");

  // Change PIN state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete account state
  const [deletePin, setDeletePin] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDownloadBackup = () => {
    try {
      const payload = { version: 3, exported: new Date().toISOString(), cards };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `duely_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("JSON Backup generated successfully.", "success");
      setTimeout(() => setBackupOpen(false), 1500);
    } catch {
      showToast("Failed to generate backup file.", "error");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const resetProfileState = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmNewPin("");
    setDeletePin("");
    setIsProcessing(false);
  };

  /**
   * Currency change handler.
   * 1. `setCurrency`      — updates the runtime store (instant UI everywhere).
   * 2. `setVaultCurrency` — writes `currencyCode` into vault.currencyCode so
   *    use-vault-sync will re-encrypt and push to the server automatically.
   */
  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    setVaultCurrency(code);
    const found = CURRENCIES.find((c) => c.code === code);
    showToast(`Currency set to ${found?.label ?? code}`, "success");
  };

  /**
   * PIN change handler.
   *
   * ✅ Both vaults (main + archive) are re-encrypted with the new PIN and
   * a shared new salt. This keeps them in sync so the next unlock works
   * correctly for both.
   *
   * The archive vault re-uses the same salt generated for the main vault so
   * unlockVault can derive the same key from a single PIN entry.
   */
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentPin !== secret) {
      showToast("Incorrect current PIN.", "error");
      return;
    }
    if (newPin.length !== 6 || confirmNewPin.length !== 6) {
      showToast("PIN must be exactly 6 digits.", "error");
      return;
    }
    if (newPin !== confirmNewPin) {
      showToast("New PINs do not match.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      // ✅ Re-encrypt main vault with new PIN (generates a new salt)
      const newEncryptedMain = await createVault(newPin, "pin", vault);
      await saveVault(newEncryptedMain, "main");

      // ✅ Re-encrypt archive vault with the SAME new salt so they stay paired
      const newSalt = newEncryptedMain.metadata!.salt;
      const newEncryptedArchive = await createVault(newPin, "pin", archiveVault, newSalt);
      await saveVault(newEncryptedArchive, "archive");

      // Update in-memory auth so the session continues working
      setAuth(newPin, newSalt, "pin");

      showToast("Master PIN changed successfully!", "success");
      setProfileView("menu");
      resetProfileState();
    } catch {
      showToast("Failed to change PIN. Try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deletePin !== secret) {
      showToast("Incorrect Master PIN.", "error");
      return;
    }
    setIsProcessing(true);
    try {
      await scheduleAccountDeletion();
      showToast("Account scheduled for deletion. Signing out...", "success");
      setTimeout(() => handleSignOut(), 2500);
    } catch {
      showToast("Failed to schedule deletion. Try again.", "error");
      setIsProcessing(false);
    }
  };

  const handleCloseProfile = () => {
    setProfileOpen(false);
    setTimeout(() => {
      setProfileView("menu");
      resetProfileState();
    }, 200);
  };

  const userDisplayName = user?.user_metadata?.full_name || "Duely User";
  const userInitials = userDisplayName.substring(0, 2).toUpperCase();

  const profileTitle = () => {
    switch (profileView) {
      case "change_pin":     return "🔑 Change Master PIN";
      case "delete_account": return "🗑️ Delete Account";
      case "currency":       return "💱 Display Currency";
      default:               return "👤 Account";
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 shadow-lg animate-in slide-in-from-top-4 duration-300 w-max max-w-[90%] whitespace-nowrap">
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 text-green-500" />
          ) : (
            <AlertCircle className="size-5 text-red-500" />
          )}
          <span className="text-[13px] font-medium text-white">{toast.message}</span>
        </div>
      )}

      {/* ── Profile Modal ── */}
      <Modal
        open={isProfileOpen}
        onClose={handleCloseProfile}
        title={
          <div className="flex items-center gap-2">
            {profileView !== "menu" && (
              <button
                onClick={() => { setProfileView("menu"); resetProfileState(); }}
                className="p-1 -ml-2 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            {profileTitle()}
          </div>
        }
      >
        {/* ── MENU VIEW ── */}
        {profileView === "menu" && (
          <div className="space-y-4">
            {user && (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-[#111827]">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-lg border border-blue-500/30">
                  {userInitials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white truncate">{userDisplayName}</span>
                  <span className="text-xs text-slate-400 truncate">{user.email}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {/* Currency Selector */}
              <button
                onClick={() => setProfileView("currency")}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-slate-300 transition-all hover:bg-white/5 active:bg-white/10 min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <Coins className="size-4 text-amber-400" />
                  <span>Display Currency</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-slate-500 bg-white/5 border border-white/10 rounded-md px-2 py-0.5 font-mono">
                    {currencyCode}
                  </span>
                  <span className="text-[10px] text-emerald-500/70 font-medium">synced</span>
                </div>
              </button>

              <button
                onClick={() => setProfileView("change_pin")}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-slate-300 transition-all hover:bg-white/5 active:bg-white/10 min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-blue-400" /> Change Master PIN
                </div>
              </button>

              <button
                onClick={() => setProfileView("delete_account")}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 active:bg-red-500/30 min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="size-4" /> Delete Account
                </div>
              </button>

              <div className="h-px bg-white/10 my-2" />

              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-slate-300 transition-all hover:bg-white/5 active:bg-white/10 min-h-[44px]"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </div>
        )}

        {/* ── CURRENCY VIEW ── */}
        {profileView === "currency" && (
          <div className="space-y-3">
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Choose how amounts are displayed throughout the app. Your preference is saved to your
              encrypted vault and will be restored automatically on every device you log in from.
            </p>

            <div className="space-y-1.5">
              {CURRENCIES.map((c) => {
                const isSelected = currencyCode === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => handleCurrencyChange(c.code)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all min-h-[44px] ${
                      isSelected
                        ? "border-blue-500/50 bg-blue-500/10 text-white"
                        : "border-white/10 bg-[#111827] text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[13px] font-bold w-8 text-center ${
                          isSelected ? "text-blue-300" : "text-slate-400"
                        }`}
                      >
                        {c.symbol}
                      </span>
                      <span className="text-[13px]">{c.label}</span>
                    </div>
                    {isSelected && <Check className="size-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
              Currency conversion is not performed — only the symbol and number formatting change.
              Your preference is saved securely in your vault.
            </p>
          </div>
        )}

        {/* ── CHANGE PIN VIEW ── */}
        {profileView === "change_pin" && (
          <form onSubmit={handleChangePin} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
                  Current PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 tracking-widest text-center text-lg"
                  placeholder="••••••"
                  required
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
                  New PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 tracking-widest text-center text-lg"
                  placeholder="••••••"
                  required
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 tracking-widest text-center text-lg"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full p-3 rounded-xl bg-blue-500 text-white text-sm font-medium transition-all hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 min-h-[44px] mt-2"
            >
              {isProcessing ? "Updating..." : "Update PIN"}
            </button>
          </form>
        )}

        {/* ── DELETE ACCOUNT VIEW ── */}
        {profileView === "delete_account" && (
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-400 leading-relaxed">
              <AlertCircle className="size-5 mb-2 inline-block mr-1" />
              <strong>Warning:</strong> Your account will be scheduled for deletion in{" "}
              <strong>7 days</strong>. If you log back in during this period, your account will
              become active again and the deletion will be canceled.
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
                Enter Master PIN to Confirm
              </label>
              <input
                type="password"
                maxLength={6}
                inputMode="numeric"
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 tracking-widest text-center text-lg"
                placeholder="••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-all hover:bg-red-500/30 active:scale-[0.98] disabled:opacity-50 min-h-[44px] mt-2"
            >
              {isProcessing ? "Processing..." : "Schedule Deletion"}
            </button>
          </form>
        )}

        {/* Universal Close Button */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={handleCloseProfile}
            className="w-full p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* ── Backup Modal ── */}
      <Modal open={isBackupOpen} onClose={() => setBackupOpen(false)} title="☁️ Backup & Restore">
        <p className="text-[13px] text-slate-400 mb-4 leading-relaxed">
          Data automatically syncs securely to Supabase. Use the options below for an additional
          local copy.
        </p>

        <div className="space-y-4">
          <div>
            <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Export Data
            </div>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-white/10 bg-[#111827] text-sm font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
            >
              <Download className="size-4" /> Download Backup (.json)
            </button>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Restore Data
            </div>
            <label className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-dashed border-white/20 bg-transparent text-sm font-medium text-slate-300 transition-all hover:bg-white/5 cursor-pointer min-h-[44px]">
              <UploadCloud className="size-4" />
              <span>Choose .json backup file</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  showToast(
                    "Action restricted. Please use the core settings for restoration.",
                    "error"
                  );
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => setBackupOpen(false)}
            className="w-full p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
