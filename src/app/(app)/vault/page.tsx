// src/app/(app)/vault/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createVault, unlockVault } from "@/lib/crypto/vault";
import { saveVault, loadVault, cancelAccountDeletion, wipeUserVault } from "@/lib/supabase/vaults";
import { useVaultStore } from "@/stores/vault-store";
import { useAuth } from "@/hooks/use-auth";
import { Lock, LogOut, ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "loading" | "unlock" | "setup" | "confirm" | "forgot_pin";

export default function VaultPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  // NOTE: Swapped setVault for setVaults
  const { setAuth, setVaults, setHydrated } = useVaultStore();

  const [step, setStep] = useState<Step>("loading");
  
  // Dual Vault State
  const [encryptedMainVault, setEncryptedMainVault] = useState<any>(null);
  const [encryptedArchiveVault, setEncryptedArchiveVault] = useState<any>(null);
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Rate Limiting State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    const storedAttempts = localStorage.getItem("duely_failed_attempts");
    const storedLockout = localStorage.getItem("duely_lockout_end");
    if (storedAttempts) setFailedAttempts(parseInt(storedAttempts, 10));
    if (storedLockout) setLockoutEndTime(parseInt(storedLockout, 10));

    async function checkExistingVault() {
      try {
        const cloudMainVault = await loadVault('main');
        const cloudArchiveVault = await loadVault('archive');
        
        if (cloudMainVault && cloudMainVault.ciphertext && cloudMainVault.metadata) {
          setEncryptedMainVault(cloudMainVault);
          setEncryptedArchiveVault(cloudArchiveVault);
          setStep("unlock");
        } else {
          setStep("setup");
        }
      } catch (err) {
        console.error("Failed to load vault:", err);
        setError("Network connection issue. Please reload.");
        setStep("setup");
      }
    }
    checkExistingVault();
  }, []);

  useEffect(() => {
    if (!lockoutEndTime) {
      setRemainingTime(0);
      return;
    }
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.ceil((lockoutEndTime - now) / 1000);
      if (diff <= 0) {
        setLockoutEndTime(null);
        setRemainingTime(0);
        localStorage.removeItem("duely_lockout_end");
        setError("");
      } else {
        setRemainingTime(diff);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  const triggerError = (msg: string, isUnlockAttempt = false) => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
    setPin("");
    setConfirmPin("");

    if (isUnlockAttempt) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem("duely_failed_attempts", newAttempts.toString());

      let lockoutSeconds = 0;
      if (newAttempts >= 7) lockoutSeconds = 900;
      else if (newAttempts >= 5) lockoutSeconds = 300;
      else if (newAttempts >= 3) lockoutSeconds = 60;

      if (lockoutSeconds > 0) {
        const endTime = Date.now() + lockoutSeconds * 1000;
        setLockoutEndTime(endTime);
        localStorage.setItem("duely_lockout_end", endTime.toString());
        setError(`Too many failed attempts. Try again in ${Math.ceil(lockoutSeconds / 60)} minute(s).`);
      } else {
        setError(msg);
      }
    } else {
      setError(msg);
    }
  };

  const handleSetup = useCallback(async (secretKey: string) => {
    setIsProcessing(true);
    setError("");

    try {
      const emptyMain = { cards: [] };
      const emptyArchive = { archivedBills: [] };
      
      const newMainVault = await createVault(secretKey, "pin", emptyMain);
      await saveVault(newMainVault, 'main');
      
      const newArchiveVault = await createVault(secretKey, "pin", emptyArchive, newMainVault.metadata!.salt);
      await saveVault(newArchiveVault, 'archive');
      
      setAuth(secretKey, newMainVault.metadata!.salt, "pin");
      setVaults(emptyMain, emptyArchive);
      setHydrated(true);
      router.push("/dashboard");
    } catch (err) {
      triggerError("Encryption failure. Please try again.", false);
    } finally {
      setIsProcessing(false);
    }
  }, [router, setAuth, setHydrated, setVaults]);

  const handleUnlock = useCallback(async (secretKey: string) => {
    if (!encryptedMainVault) return;
    setIsProcessing(true);
    setError("");

    try {
      const decryptedMain = await unlockVault<any>(secretKey, encryptedMainVault);
      let decryptedArchive = { archivedBills: [] };
      
      if (encryptedArchiveVault && encryptedArchiveVault.ciphertext) {
        decryptedArchive = await unlockVault<any>(secretKey, encryptedArchiveVault);
      }
      
      if (encryptedMainVault.metadata?.delete_scheduled_at) {
        await cancelAccountDeletion();
      }
      
      setFailedAttempts(0);
      setLockoutEndTime(null);
      localStorage.removeItem("duely_failed_attempts");
      localStorage.removeItem("duely_lockout_end");
      
      setAuth(secretKey, encryptedMainVault.metadata!.salt, "pin");
      setVaults(decryptedMain, decryptedArchive);
      setHydrated(true);
      router.push("/dashboard");
    } catch (err) {
      triggerError("Incorrect Master PIN. Please try again.", true);
    } finally {
      setIsProcessing(false);
    }
  }, [encryptedMainVault, encryptedArchiveVault, router, setAuth, setHydrated, setVaults, failedAttempts]);

  const handleWipeVault = async () => {
    setIsProcessing(true);
    try {
      await wipeUserVault();
      setEncryptedMainVault(null);
      setEncryptedArchiveVault(null);
      setStep("setup");
      setPin("");
      setConfirmPin("");
      setAcknowledged(false);
      
      setFailedAttempts(0);
      setLockoutEndTime(null);
      localStorage.removeItem("duely_failed_attempts");
      localStorage.removeItem("duely_lockout_end");
    } catch (err) {
      setError("Failed to reset account. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePinInput = useCallback((val: string) => {
    if (isProcessing || (step === "setup" && !acknowledged) || lockoutEndTime) return;
    
    setError("");
    const current = step === "confirm" ? confirmPin : pin;
    const setter = step === "confirm" ? setConfirmPin : setPin;

    if (val === "backspace") {
      setter(current.slice(0, -1));
    } else if (val === "clear") {
      setter("");
    } else if (current.length < 6) {
      const newPin = current + val;
      setter(newPin);

      if (newPin.length === 6) {
        if (step === "setup") {
          setTimeout(() => setStep("confirm"), 150);
        } else if (step === "confirm") {
          if (newPin !== pin) {
            triggerError("PINs do not match. Restarting setup.", false);
            setTimeout(() => setStep("setup"), 400);
          } else {
            handleSetup(newPin);
          }
        } else if (step === "unlock") {
          handleUnlock(newPin);
        }
      }
    }
  }, [confirmPin, isProcessing, pin, step, acknowledged, handleSetup, handleUnlock, lockoutEndTime]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (step === "forgot_pin") return;
      if (e.key >= '0' && e.key <= '9') handlePinInput(e.key);
      if (e.key === 'Backspace') handlePinInput('backspace');
      if (e.key === 'Escape') handlePinInput('clear');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePinInput, step]);

  if (step === "loading") {
    return (
      <main className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (step === "forgot_pin") {
    return (
      <main className="min-h-screen bg-[#020817] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-[#0a0f1c] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/50" />
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="size-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Reset Account & Vault</h2>
            <p className="text-[14px] text-slate-300">
              Because Duely uses strict zero-knowledge encryption, we <strong className="text-red-400">cannot recover your Master PIN</strong> or decrypt your data.
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <ul className="text-[13px] text-red-300 space-y-2 text-left list-disc list-inside">
              <li>All saved cards and transaction history will be <strong className="text-red-400">permanently deleted</strong>.</li>
              <li>Your encrypted vault in the cloud will be destroyed.</li>
              <li>You will start fresh as a new user.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleWipeVault}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Wiping Data..." : "I Understand, Delete My Vault"}
            </button>
            <button 
              onClick={() => { setStep("unlock"); setPin(""); setError(""); }}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-sm transition-colors disabled:opacity-50"
            >
              Cancel, Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020817] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[380px] text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-[#1a2234] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/50 relative">
            {step === "unlock" ? <Lock className="size-8 text-blue-400" /> : <ShieldAlert className="size-8 text-green-400" />}
            {lockoutEndTime && (
               <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                 <Lock className="size-6 text-red-500" />
               </div>
            )}
          </div>
          <h1 className="text-[22px] font-bold text-white mb-2 tracking-tight">
            {step === "unlock" ? "Unlock Duely" : step === "confirm" ? "Confirm Master PIN" : "Set Master PIN"}
          </h1>
          <p className="text-[13px] text-slate-400">
            {step === "unlock" ? "Enter your Master PIN to decrypt card data." : 
             step === "confirm" ? "Re-enter your 6-digit Master PIN." : 
             "Create a 6-digit Master PIN to secure your data locally."}
          </p>
          {user?.email && (
            <div className="mt-4 py-1.5 px-3 bg-white/5 border border-white/10 rounded-full inline-flex items-center gap-2 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-green-500" /> {user.email}
            </div>
          )}
        </div>

        {step === "setup" && (
          <div className="mb-6 flex items-start gap-3 text-left bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl mx-2">
            <input 
              type="checkbox" 
              id="ack" 
              checked={acknowledged} 
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 shrink-0 accent-orange-500 size-4 cursor-pointer"
            />
            <label htmlFor="ack" className="text-[11.5px] text-orange-400/90 leading-relaxed cursor-pointer select-none">
              <strong>Zero-Knowledge Security:</strong> I understand that my Master PIN is used to locally encrypt my data. <strong>If I forget this PIN, my vault cannot be recovered by anyone</strong>.
            </label>
          </div>
        )}

        <div className={cn("mb-6 transition-opacity duration-300", (step === "setup" && !acknowledged) || lockoutEndTime ? "opacity-30 pointer-events-none" : "")}>
          <div className={cn("flex justify-center gap-3.5 mb-6 transition-transform", isShaking && "translate-x-[-8px] animate-in shake duration-100")}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={cn("w-3.5 h-3.5 rounded-full border-2 transition-all duration-200", (step === "confirm" ? confirmPin : pin).length > i ? "bg-blue-500 border-blue-500 scale-110 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "border-white/20 bg-transparent")} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button type="button" key={num} onClick={() => handlePinInput(num.toString())} className="h-14 rounded-2xl bg-[#1a2234] border border-white/10 text-xl font-medium text-white transition-all active:bg-white/10 active:scale-95">{num}</button>
            ))}
            <button type="button" onClick={() => handlePinInput('clear')} className="h-14 rounded-2xl bg-transparent text-[13px] font-medium text-slate-400 active:scale-95">Clear</button>
            <button type="button" onClick={() => handlePinInput('0')} className="h-14 rounded-2xl bg-[#1a2234] border border-white/10 text-xl font-medium text-white active:scale-95">0</button>
            <button type="button" onClick={() => handlePinInput('backspace')} className="h-14 rounded-2xl bg-transparent text-xl font-medium text-slate-400 active:scale-95 flex items-center justify-center">⌫</button>
          </div>
        </div>

        <div className="min-h-[24px]">
          {error && !lockoutEndTime && <div className="text-[13px] text-red-400 font-medium">{error}</div>}
          {lockoutEndTime && remainingTime > 0 && (
             <div className="text-[13px] text-red-400 font-medium flex items-center justify-center gap-2 animate-pulse">
               <Lock className="size-3" /> Try again in {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
             </div>
          )}
          {isProcessing && !error && !lockoutEndTime && <div className="text-[13px] text-blue-400 font-medium animate-pulse">Processing security handshake...</div>}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
          {step === "unlock" && user && (
             <button 
               type="button" 
               onClick={() => setStep("forgot_pin")} 
               className="text-[12px] text-red-400/80 hover:text-red-400 transition-colors underline underline-offset-2"
             >
               Forgot PIN? Reset Account
             </button>
          )}

          <button type="button" onClick={async () => { await signOut(); router.push("/login"); }} className="flex items-center justify-center gap-1.5 w-full text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
            <LogOut className="size-3.5" /> Sign out / Switch Account
          </button>
        </div>
      </div>
    </main>
  );
}