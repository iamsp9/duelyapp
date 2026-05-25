"use client";

import {
  useState,
} from "react";

import {
  useVaultStore,
} from "@/stores/vault-store";

export function AddCardForm() {
  const addCard =
    useVaultStore(
      (s) =>
        s.addCard
    );

  const [
    name,
    setName,
  ] = useState("");

  const [
    billDay,
    setBillDay,
  ] = useState(1);

  const [
    dueAfterDays,
    setDueAfterDays,
  ] = useState(20);

  function calculateDueDay() {
    const total =
      billDay +
      dueAfterDays;

    return total > 30
      ? total - 30
      : total;
  }

  function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    addCard({
      id:
        crypto.randomUUID(),

      name,

      billDay,

      dueAfterDays,

      dueDay:
        calculateDueDay(),

      totalBill: 0,

      paidAmount: 0,

      outstandingAmount: 0,

      status: "unpaid",

      payments: [],
    });

    setName("");
    setBillDay(1);
    setDueAfterDays(20);

    alert(
      "Card added successfully"
    );
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-5 rounded-3xl border border-white/10 bg-card p-6"
    >
      <div>
        <label className="mb-2 block text-slate-400">
          Card name
        </label>

        <input
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-slate-400">
          Bill date
        </label>

        <input
          type="number"
          min={1}
          max={31}
          value={billDay}
          onChange={(e) =>
            setBillDay(
              Number(
                e.target.value
              )
            )
          }
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-slate-400">
          Days after bill till due
        </label>

        <input
          type="number"
          min={1}
          max={60}
          value={
            dueAfterDays
          }
          onChange={(e) =>
            setDueAfterDays(
              Number(
                e.target.value
              )
            )
          }
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300">
        Due date will be{" "}
        <span className="font-bold text-white">
          {
            calculateDueDay()
          }
        </span>
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-blue-500 py-4 font-semibold text-white"
      >
        Add Card
      </button>
    </form>
  );
}