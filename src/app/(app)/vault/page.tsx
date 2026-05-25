"use client";

import { useState } from "react";

import {
  createVault,
  unlockVault,
} from "@/lib/crypto/vault";

import {
  saveVault,
  loadVault,
} from "@/lib/supabase/vaults";

export default function VaultPage() {
  const [mode, setMode] = useState<
    "pin" | "passphrase"
  >("passphrase");

  const [secret, setSecret] =
    useState("");

  const [vault, setVault] =
    useState<any>(null);

  const [decrypted, setDecrypted] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  async function handleCreate() {
    setLoading(true);

    try {
      const encrypted =
        await createVault(
          secret,
          mode,
          {
            cards: [],
            createdAt:
              new Date().toISOString(),
          }
        );

      await saveVault(encrypted);

      setVault(encrypted);

      alert(
        "Vault encrypted and synced."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLoad() {
    setLoading(true);

    try {
      const data =
        await loadVault();

      setVault(data);

      alert(
        "Vault loaded from cloud."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock() {
    if (!vault) return;

    setLoading(true);

    try {
      const data =
        await unlockVault(
          secret,
          vault
        );

      setDecrypted(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-20">
      <div className="rounded-3xl border border-white/10 bg-card p-8">
        <h1 className="text-3xl font-bold">
          Secure Vault
        </h1>

        <p className="mt-3 text-slate-400">
          Your data encrypts locally
          before syncing.
        </p>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() =>
              setMode("passphrase")
            }
            className={`h-11 px-5 rounded-2xl ${
              mode === "passphrase"
                ? "bg-primary text-white"
                : "bg-black/20"
            }`}
          >
            Passphrase
          </button>

          <button
            onClick={() =>
              setMode("pin")
            }
            className={`h-11 px-5 rounded-2xl ${
              mode === "pin"
                ? "bg-primary text-white"
                : "bg-black/20"
            }`}
          >
            PIN
          </button>
        </div>

        <div className="mt-6">
          <input
            type={
              mode === "pin"
                ? "password"
                : "text"
            }
            placeholder={
              mode === "pin"
                ? "Enter PIN"
                : "Enter passphrase"
            }
            value={secret}
            onChange={(e) =>
              setSecret(
                e.target.value
              )
            }
            className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            disabled={loading}
            onClick={handleCreate}
            className="h-12 px-6 rounded-2xl bg-primary text-white"
          >
            Create Vault
          </button>

          <button
            disabled={loading}
            onClick={handleLoad}
            className="h-12 px-6 rounded-2xl border border-white/10"
          >
            Load Vault
          </button>

          <button
            disabled={loading}
            onClick={handleUnlock}
            className="h-12 px-6 rounded-2xl border border-white/10"
          >
            Unlock Vault
          </button>
        </div>

        {decrypted && (
          <pre className="mt-8 text-sm text-slate-400 overflow-auto">
            {JSON.stringify(
              decrypted,
              null,
              2
            )}
          </pre>
        )}
      </div>
    </main>
  );
}