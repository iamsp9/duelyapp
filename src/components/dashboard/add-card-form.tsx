"use client";

import { useState } from "react";

import { useVaultStore } from "@/stores/vault-store";

export function AddCardForm() {
  const { addCard } =
    useVaultStore();

  const [loading, setLoading] =
    useState(false);

  const [name, setName] =
    useState("");

  const [bank, setBank] =
    useState("");

  const [last4, setLast4] =
    useState("");

  const [limit, setLimit] =
    useState("");

  const [
    billGenerationDay,
    setBillGenerationDay,
  ] = useState("");

  const [
    dueAfterDays,
    setDueAfterDays,
  ] = useState("");

  async function handleSubmit() {
    try {
      setLoading(true);

      await new Promise((r) =>
        setTimeout(r, 500)
      );

      addCard({
        id: crypto.randomUUID(),

        name,

        bank,

        last4,

        limit: Number(limit),

        billGenerationDay:
          Number(
            billGenerationDay
          ),

        dueAfterDays:
          Number(dueAfterDays),

        createdAt:
          new Date().toISOString(),
      });

      setName("");
      setBank("");
      setLast4("");
      setLimit("");
      setBillGenerationDay("");
      setDueAfterDays("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-card p-6">
      <h2 className="text-xl font-semibold">
        Add Card
      </h2>

      <div className="space-y-4 mt-6">
        <input
          placeholder="Card Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4"
        />

        <input
          placeholder="Bank"
          value={bank}
          onChange={(e) =>
            setBank(e.target.value)
          }
          className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4"
        />

        <input
          placeholder="Last 4 Digits"
          value={last4}
          onChange={(e) =>
            setLast4(e.target.value)
          }
          className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4"
        />

        <input
          placeholder="Card Limit"
          value={limit}
          onChange={(e) =>
            setLimit(e.target.value)
          }
          className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4"
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Bill Date"
            value={billGenerationDay}
            onChange={(e) =>
              setBillGenerationDay(
                e.target.value
              )
            }
            className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4"
          />

          <input
            placeholder="Due After (Days)"
            value={dueAfterDays}
            onChange={(e) =>
              setDueAfterDays(
                e.target.value
              )
            }
            className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400 leading-relaxed">
          Example:
          <br />
          Bill Date = 13
          <br />
          Due After = 20 days
          <br />
          → Bill generated every month on 13th
          <br />
          → Payment due 20 days later
        </div>

        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full h-12 rounded-2xl bg-primary text-white disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : "Save Card"}
        </button>
      </div>
    </div>
  );
}