"use client";

import { useState } from "react";

import {
  useVaultHydration,
} from "@/hooks/use-vault-hydration";

export function UnlockVault() {
  const [secret, setSecret] =
    useState("");

  const {
    unlock,
    loading,
  } = useVaultHydration();

  async function handleUnlock() {
    if (!secret) return;

    const success =
      await unlock(secret);

    if (!success) {
      alert(
        "Invalid PIN or passphrase"
      );
    }
  }

  function append(
    value: string
  ) {
    setSecret(
      (prev) => prev + value
    );
  }

  function remove() {
    setSecret((prev) =>
      prev.slice(0, -1)
    );
  }

  return (
    <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-card p-8">
      <h1 className="text-3xl font-bold">
        Unlock Vault
      </h1>

      <p className="text-slate-400 mt-3">
        Your data decrypts locally
        on this device.
      </p>

      <input
        type="password"
        value={secret}
        onChange={(e) =>
          setSecret(
            e.target.value
          )
        }
        placeholder="Enter PIN"
        className="w-full h-14 rounded-2xl bg-black/20 border border-white/10 px-4 mt-8 text-center text-xl tracking-[0.5em]"
      />

      <div className="grid grid-cols-3 gap-3 mt-6">
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button
            key={n}
            onClick={() =>
              append(String(n))
            }
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-lg font-semibold"
          >
            {n}
          </button>
        ))}

        <button
          onClick={remove}
          className="h-14 rounded-2xl bg-white/5"
        >
          ←
        </button>

        <button
          onClick={() =>
            append("0")
          }
          className="h-14 rounded-2xl bg-white/5 text-lg font-semibold"
        >
          0
        </button>

        <button
          disabled={loading}
          onClick={handleUnlock}
          className="h-14 rounded-2xl bg-primary text-white disabled:opacity-50"
        >
          →
        </button>
      </div>
    </div>
  );
}