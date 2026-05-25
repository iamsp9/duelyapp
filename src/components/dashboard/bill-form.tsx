"use client";

import { useState } from "react";

import {
  useVaultStore,
} from "@/stores/vault-store";

export function BillForm({
  cardId,
}: {
  cardId: string;
}) {
  const addBill =
    useVaultStore(
      (state) => state.addBill
    );

  const [amount, setAmount] =
    useState("");

  const [notes, setNotes] =
    useState("");

  function handleSave() {
    if (!amount) return;

    const now = new Date();

    addBill({
      id: crypto.randomUUID(),

      cardId,

      cycleMonth:
        now.getMonth(),

      cycleYear:
        now.getFullYear(),

      amount: Number(amount),

      paidAmount: 0,

      dueDate:
        now.toISOString(),

      status: "unpaid",

      notes,

      createdAt:
        now.toISOString(),
    });

    setAmount("");
    setNotes("");
  }

  return (
    <div className="space-y-4 mt-4">
      <input
        value={amount}
        onChange={(e) =>
          setAmount(
            e.target.value
          )
        }
        placeholder="Total Bill Amount"
        className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4"
      />

      <textarea
        value={notes}
        onChange={(e) =>
          setNotes(
            e.target.value
          )
        }
        placeholder="Notes"
        className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 min-h-28"
      />

      <button
        onClick={handleSave}
        className="w-full h-12 rounded-2xl bg-primary text-white"
      >
        Save Bill
      </button>
    </div>
  );
}