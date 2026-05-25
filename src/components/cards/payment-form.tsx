"use client";

import { useState } from "react";
import type { CreditCard } from "@/types/card";
import { useVaultStore } from "@/stores/vault-store";

interface Props {
  card: CreditCard;
  onClose: () => void;
}

export function PaymentForm({ card, onClose }: Props) {
  // FIXED: Using saveCardState instead of undefined saveBill/logPayment
  const saveCardState = useVaultStore((s) => s.saveCardState);

  const [totalBill, setTotalBill] = useState(card.totalBill || 0);
  const [payment, setPayment] = useState(0);
  const [note, setNote] = useState("");
  const [loadingBill, setLoadingBill] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  async function handleSaveBill() {
    setLoadingBill(true);
    saveCardState(card.id, { totalBill: Number(totalBill) });
    alert("Bill saved successfully");
    setLoadingBill(false);
    onClose();
  }

  async function handleLogPayment() {
    if (!payment || payment <= 0) {
      alert("Enter valid payment");
      return;
    }
    setLoadingPayment(true);
    saveCardState(card.id, {
      newPayment: { amount: Number(payment), note, date: new Date().toISOString() }
    });
    alert("Payment logged successfully");
    setLoadingPayment(false);
    onClose();
  }

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h2 className="text-4xl font-bold text-white">{card.name}</h2>
        <p className="mt-2 text-slate-400">Bill {card.billDay} · Due {card.dueDay}</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <label className="mb-3 block text-slate-400">Total bill (₹)</label>
        <input
          type="number"
          value={totalBill}
          onChange={(e) => setTotalBill(Number(e.target.value))}
          className="w-full rounded-2xl bg-[#0B132B] px-5 py-4 text-3xl font-bold text-white outline-none"
        />
        <button
          onClick={handleSaveBill}
          disabled={loadingBill}
          className="mt-5 w-full rounded-2xl bg-blue-500 py-4 text-lg font-semibold text-white"
        >
          {loadingBill ? "Saving..." : "Save Bill"}
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <label className="mb-3 block text-slate-400">Add payment (₹)</label>
        <input
          type="number"
          value={payment}
          onChange={(e) => setPayment(Number(e.target.value))}
          className="w-full rounded-2xl bg-[#0B132B] px-5 py-4 text-2xl text-white outline-none"
        />
        <div className="mt-5">
          <label className="mb-2 block text-slate-400">Note</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. via UPI"
            className="w-full rounded-2xl bg-[#0B132B] px-5 py-4 text-white outline-none"
          />
        </div>
        <button
          onClick={handleLogPayment}
          disabled={loadingPayment}
          className="mt-5 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-semibold text-white"
        >
          {loadingPayment ? "Logging..." : "Log Payment"}
        </button>
      </div>
      <button onClick={onClose} className="w-full rounded-2xl border border-white/10 py-4 text-lg text-white">
        Close
      </button>
    </div>
  );
}