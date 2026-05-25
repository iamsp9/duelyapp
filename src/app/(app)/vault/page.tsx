"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createVault, unlockVault } from "@/lib/crypto/vault";
import { saveVault, loadVault, cancelAccountDeletion } from "@/lib/supabase/vaults";
import { useVaultStore } from "@/stores/vault-store";
import { useAuth } from "@/hooks/use-auth";
import { Lock, LogOut, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "loading" | "unlock" | "setup" | "confirm";

export default function VaultPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { setAuth, setVault, setHydrated } = useVaultStore();

  const [step, setStep] = useState<Step>("loading");
  const [encryptedVault, setEncryptedVault] = useState<any>(null);
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function checkExistingVault() {
      try {
        const cloudVault = await loadVault();
        if (cloudVault && cloudVault.ciphertext && cloudVault.metadata) {
          setEncryptedVault(cloudVault);
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

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
    setPin("");
    setConfirmPin("");
  };

  const handleSetup = useCallback(async (secretKey: string) => {
    setIsProcessing(true);
    setError("");

    try {
      const emptyData = { cards: [] };
      const newVault = await createVault(secretKey, "pin", emptyData);
      await saveVault(newVault);
      
      // FIXED: Assert metadata exists (!)
      setAuth(secretKey, newVault.metadata!.salt, "pin");
      setVault(emptyData);
      setHydrated(true);
      router.push("/dashboard");
    } catch (err) {
      triggerError("Encryption failure. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [router, setAuth, setHydrated, setVault]);

  const handleUnlock = useCallback(async (secretKey: string) => {
    if (!encryptedVault) return;
    setIsProcessing(true);
    setError("");

    try {
      const decryptedData = await unlockVault<any>(secretKey, encryptedVault);
      
      if (encryptedVault.metadata?.delete_scheduled_at) {
        await cancelAccountDeletion();
      }
      
      // FIXED: Assert metadata exists (!)
      setAuth(secretKey, encryptedVault.metadata!.salt, "pin");
      setVault(decryptedData);
      setHydrated(true);
      router.push("/dashboard");
    } catch (err) {
      triggerError("Incorrect Master PIN. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [encryptedVault, router, setAuth, setHydrated, setVault]);

  const handlePinInput = useCallback((val: string) => {
    if (isProcessing || (step === "setup" && !acknowledged)) return;
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
            triggerError("PINs do not match. Restarting setup.");
            setTimeout(() => setStep("setup"), 400);
          } else {
            handleSetup(newPin);
          }
        } else if (step === "unlock") {
          handleUnlock(newPin);
        }
      }
    }
  }, [confirmPin, isProcessing, pin, step, acknowledged, handleSetup, handleUnlock]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key >= '0' && e.key <= '9') handlePinInput(e.key);
      if (e.key === 'Backspace') handlePinInput('backspace');
      if (e.key === 'Escape') handlePinInput('clear');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePinInput]);

  if (step === "loading") {
    return (
      <main className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020817] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[380px] text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-[#1a2234] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/50">
            {step === "unlock" ? <Lock className="size-8 text-blue-400" /> : <ShieldAlert className="size-8 text-green-400" />}
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
              <strong>Zero-Knowledge Security:</strong> I understand that my Master PIN is used to locally encrypt my data. <strong>If I forget this PIN, my vault cannot be recovered by anyone</strong>, including Duely.
            </label>
          </div>
        )}

        <div className={cn("mb-6 transition-opacity duration-300", step === "setup" && !acknowledged && "opacity-30 pointer-events-none")}>
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
          {error && <div className="text-[13px] text-red-400 font-medium">{error}</div>}
          {isProcessing && !error && <div className="text-[13px] text-blue-400 font-medium animate-pulse">Processing security handshake...</div>}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <button type="button" onClick={async () => { await signOut(); router.push("/login"); }} className="flex items-center justify-center gap-1.5 w-full text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
            <LogOut className="size-3.5" /> Sign out / Switch Account
          </button>
        </div>
      </div>
    </main>
  );
}