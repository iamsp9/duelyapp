"use client";

import { useMemo } from "react";

import {
  useVaultStore,
} from "@/stores/vault-store";

export function SummaryCards() {
  const bills =
    useVaultStore(
      (state) =>
        state.vault.bills || []
    );

  const summary =
    useMemo(() => {
      const billed =
        bills.reduce(
          (sum, bill) =>
            sum + bill.amount,
          0
        );

      const paid =
        bills.reduce(
          (sum, bill) =>
            sum +
            bill.paidAmount,
          0
        );

      const outstanding =
        billed - paid;

      const progress =
        billed
          ? Math.round(
              (paid / billed) *
                100
            )
          : 0;

      return {
        billed,
        paid,
        outstanding,
        progress,
      };
    }, [bills]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Billed"
        value={`₹${summary.billed.toLocaleString()}`}
      />

      <Card
        title="Paid"
        value={`₹${summary.paid.toLocaleString()}`}
        valueClass="text-green-500"
      />

      <Card
        title="Outstanding"
        value={`₹${summary.outstanding.toLocaleString()}`}
        valueClass="text-red-500"
      />

      <div className="rounded-3xl border border-white/10 bg-card p-5 col-span-2 lg:col-span-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Progress
        </p>

        <p className="text-3xl font-bold mt-2">
          {summary.progress}%
        </p>

        <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{
              width: `${summary.progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  valueClass,
}: {
  title: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p
        className={`text-3xl font-bold mt-2 ${valueClass || ""}`}
      >
        {value}
      </p>
    </div>
  );
}