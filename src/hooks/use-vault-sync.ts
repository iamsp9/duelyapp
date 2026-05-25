// src/hooks/use-vault-sync.ts
"use client";

import { useEffect, useRef } from "react";
import { createVault } from "@/lib/crypto/vault";
import { saveVault } from "@/lib/supabase/vaults";
import { useVaultStore } from "@/stores/vault-store";
import { decodeSalt } from "@/lib/crypto/salt";
import { deriveKey } from "@/lib/crypto/kdf";
import type { VaultMode } from "@/types/vault";

export function useVaultSync() {
  // FIXED: Changed NodeJS.Timeout to ReturnType<typeof setTimeout> for environment-agnostic type safety
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vault = useVaultStore((state) => state.vault);
  const secret = useVaultStore((state) => state.secret);
  const salt = useVaultStore((state) => state.salt);
  const mode = useVaultStore((state) => state.mode);
  const hydrated = useVaultStore((state) => state.hydrated);
  
  const cryptoKey = useVaultStore((state) => state.cryptoKey);
  const setCryptoKey = useVaultStore((state) => state.setCryptoKey);

  useEffect(() => {
    if (!hydrated) return;
    if (!secret || !salt || !mode) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        console.log("Encrypting vault...");

        let activeKey = cryptoKey;

        if (!activeKey) {
          console.log("Deriving master key (first time)...");
          const saltBytes = decodeSalt(salt);
          const rawKeyBytes = await deriveKey(secret, saltBytes);
          
          activeKey = await crypto.subtle.importKey(
            "raw",
            rawKeyBytes,
            "AES-GCM",
            false, 
            ["encrypt", "decrypt"]
          );
          
          setCryptoKey(activeKey);
        }

        const encrypted = await createVault(
          activeKey, 
          mode as VaultMode,
          vault,
          salt
        );

        console.log("Syncing encrypted vault...");
        await saveVault(encrypted);
        console.log("Vault synced.");
      } catch (error) {
        console.error(error);
      }
    }, 1200);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [vault, secret, salt, mode, hydrated, cryptoKey, setCryptoKey]);
}