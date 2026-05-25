"use client";

import { useState } from "react";

import {
  useVaultStore,
} from "@/stores/vault-store";

import {
  getBillStatus,
} from "@/lib/utils/bills";

export function PaymentForm({
  billId,
  currentPaid,
  totalAmount,
}: {
  billId: string;

  currentPaid: number;

  totalAmount: number;
}) {
  const addPayment =
    useVaultStore(
      (state) => state.addPayment
    );

  const updateBill =
    useVaultStore(
      (state) =>
        state.updateBill
    );

  const [amount, setAmount] =
    useState("");

  const [note, setNote] =
    useState("");

  function handlePayment() {
    const paymentAmount =
      Number(amount);

    if (!paymentAmount)
      return;

    const newPaid =
      currentPaid +
      paymentAmount;

    const status =
      getBillStatus({
        paidAmount: newPaid,
        amount: totalAmount,
      } as any);

    addPayment({
      id: crypto.randomUUID(),

      billId,

      amount: paymentAmount,

      note,

      paidAt:
        new Date().toISOString(),
    });

    updateBill(billId, {
      paidAmount: newPaid,

      status,
    });

    setAmount("");
    setNote("");
  }

  return (
    <div className="space-y-3 mt-4">
      <input
        value={amount}
        onChange={(e) =>
          setAmount(
            e.target.value
          )
        }
        placeholder="Add Payment"
        className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4"
      />

      <input
        value={note}
        onChange={(e) =>
          setNote(
            e.target.value
          )
        }
        placeholder="Payment Note"
        className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 px-4"
      />

      <button
        onClick={handlePayment}
        className="w-full h-12 rounded-2xl bg-green-600 text-white"
      >
        Log Payment
      </button>
    </div>
  );
}