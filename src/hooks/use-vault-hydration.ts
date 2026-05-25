"use client";

import {
  useState,
} from "react";

import {
  loadVault,
} from "@/lib/supabase/vaults";

import {
  unlockVault,
} from "@/lib/crypto/vault";

import {
  useVaultStore,
} from "@/stores/vault-store";

export function useVaultHydration() {
  const [loading, setLoading] =
    useState(false);

  const setVault =
    useVaultStore(
      (state) => state.setVault
    );

  const setSecret =
    useVaultStore(
      (state) => state.setSecret
    );

  const setSalt =
    useVaultStore(
      (state) => state.setSalt
    );

  const setMode =
    useVaultStore(
      (state) => state.setMode
    );

  const setHydrated =
    useVaultStore(
      (state) =>
        state.setHydrated
    );

  async function unlock(
    secret: string
  ) {
    try {
      setLoading(true);

      const encrypted =
        await loadVault();

      // First-time user
      if (!encrypted) {
        setVault({
          version: 1,

          cards: [],

          bills: [],

          payments: [],
        });

        setSecret(secret);

        setHydrated(true);

        return true;
      }

      const decrypted: any =
        await unlockVault(
          secret,
          encrypted
        );

      // Schema migration safety
      const normalizedVault = {
        version:
          decrypted.version ||
          1,

        cards:
          decrypted.cards || [],

        bills:
          decrypted.bills || [],

        payments:
          decrypted.payments ||
          [],
      };

      setVault(
        normalizedVault
      );

      setSecret(secret);

      setMode(
        encrypted.metadata.mode
      );

      setSalt(
        encrypted.metadata.salt
      );

      setHydrated(true);

      return true;
    } catch (error) {
      console.error(error);

      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    unlock,
  };
}