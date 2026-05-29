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
  const mainTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const archiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vault = useVaultStore((state) => state.vault);
  const archiveVault = useVaultStore((state) => state.archiveVault);
  
  const secret = useVaultStore((state) => state.secret);
  const salt = useVaultStore((state) => state.salt);
  const mode = useVaultStore((state) => state.mode);
  const hydrated = useVaultStore((state) => state.hydrated);
  
  const cryptoKey = useVaultStore((state) => state.cryptoKey);
  const setCryptoKey = useVaultStore((state) => state.setCryptoKey);

  // Helper to safely get or derive the encryption key
  const getActiveKey = async () => {
    if (cryptoKey) return cryptoKey;
    if (!secret || !salt) throw new Error("Missing auth materials");

    console.log("Deriving master key...");
    const saltBytes = decodeSalt(salt);
    const rawKeyBytes = await deriveKey(secret, saltBytes);
    
    const newKey = await crypto.subtle.importKey(
      "raw",
      rawKeyBytes,
      "AES-GCM",
      false, 
      ["encrypt", "decrypt"]
    );
    
    setCryptoKey(newKey);
    return newKey;
  };

  // 1. Sync Main Vault (Active Cards & Bills)
  useEffect(() => {
    if (!hydrated || !secret || !salt || !mode) return;

    if (mainTimeoutRef.current) {
      clearTimeout(mainTimeoutRef.current);
    }

    mainTimeoutRef.current = setTimeout(async () => {
      try {
        console.log("Encrypting main vault...");
        const activeKey = await getActiveKey();

        const encrypted = await createVault(
          activeKey, 
          mode as VaultMode,
          vault,
          salt
        );

        await saveVault(encrypted, 'main');
        console.log("Main vault synced.");
      } catch (error) {
        console.error("Failed to sync main vault:", error);
      }
    }, 1200);

    return () => {
      if (mainTimeoutRef.current) clearTimeout(mainTimeoutRef.current);
    };
  }, [vault, secret, salt, mode, hydrated]);

  // 2. Sync Archive Vault (Fully Paid Historical Bills)
  useEffect(() => {
    if (!hydrated || !secret || !salt || !mode) return;

    if (archiveTimeoutRef.current) {
      clearTimeout(archiveTimeoutRef.current);
    }

    archiveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log("Encrypting archive vault...");
        const activeKey = await getActiveKey();

        const encrypted = await createVault(
          activeKey, 
          mode as VaultMode,
          archiveVault,
          salt
        );

        await saveVault(encrypted, 'archive');
        console.log("Archive vault synced.");
      } catch (error) {
        console.error("Failed to sync archive vault:", error);
      }
    }, 1200);

    return () => {
      if (archiveTimeoutRef.current) clearTimeout(archiveTimeoutRef.current);
    };
  }, [archiveVault, secret, salt, mode, hydrated]);
}