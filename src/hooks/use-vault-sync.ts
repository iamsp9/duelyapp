"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  createVault,
} from "@/lib/crypto/vault";

import {
  saveVault,
} from "@/lib/supabase/vaults";

import {
  useVaultStore,
} from "@/stores/vault-store";

export function useVaultSync() {
  const timeoutRef =
    useRef<NodeJS.Timeout | null>(
      null
    );

  const vault =
    useVaultStore(
      (state) => state.vault
    );

  const secret =
    useVaultStore(
      (state) => state.secret
    );

  const salt =
    useVaultStore(
      (state) => state.salt
    );

  const mode =
    useVaultStore(
      (state) => state.mode
    );

  const hydrated =
    useVaultStore(
      (state) => state.hydrated
    );

  useEffect(() => {
    if (!hydrated) return;

    if (!secret) return;

    if (timeoutRef.current) {
      clearTimeout(
        timeoutRef.current
      );
    }

    timeoutRef.current =
      setTimeout(async () => {
        try {
          console.log(
            "Encrypting vault..."
          );

          const encrypted =
            await createVault(
              secret,
              mode,
              vault,
              salt
            );

          console.log(
            "Syncing encrypted vault..."
          );

          await saveVault(
            encrypted
          );

          console.log(
            "Vault synced."
          );
        } catch (error) {
          console.error(error);
        }
      }, 1200);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(
          timeoutRef.current
        );
      }
    };
  }, [
    vault,
    secret,
    salt,
    mode,
    hydrated,
  ]);
}