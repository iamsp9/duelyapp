// src/components/cards/add-card-form.tsx
"use client";

import { useState } from "react";
import { useVaultStore } from "@/stores/vault-store";

export function AddCardForm() {
  const addCard = useVaultStore((s) => s.addCard);

  const [name, setName] = useState("");
  const [billDay, setBillDay] = useState(1);
  const [dueAfterDays, setDueAfterDays] = useState(20);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Standardized addition relying on activeBills array cycles
    addCard({
      id: "c-" + crypto.randomUUID(),
      name: name.trim(),
      billDay: Number(billDay),
      dueAfterDays: Number(dueAfterDays),
      activeBills: [],
      disabled: false,
    });

    setName("");
    setBillDay(1);
    setDueAfterDays(20);

    alert("Credit Card registered successfully! If statement cycles are valid, a bill instance will generate automatically.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-white/10 bg-card p-6"
    >
      <div>
        <label className="mb-2 block text-slate-400">Card Issuer & Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. HDFC Bank Regalia Gold"
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-slate-400">Billing Date (Day of Month)</label>
        <input
          type="number"
          min={1}
          max={31}
          value={billDay}
          onChange={(e) => setBillDay(Number(e.target.value))}
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-slate-400">Interest-Free Days (Grace Period)</label>
        <input
          type="number"
          min={1}
          max={60}
          value={dueAfterDays}
          onChange={(e) => setDueAfterDays(Number(e.target.value))}
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-blue-500 py-4 font-semibold text-white transition-colors hover:bg-blue-600"
      >
        Add Card
      </button>
    </form>
  );
}