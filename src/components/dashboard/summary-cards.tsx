// src/components/dashboard/summary-cards.tsx
"use client";

import { useVaultStore } from "@/stores/vault-store";
import { getSummary, computeBillStatus } from "@/lib/engine/cards";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function SummaryCards() {
  const cards = useVaultStore((s) => s.vault.cards);
  const summary = getSummary(cards);

  // Calculate the actual number of pending bills across all un-disabled cards
  const totalPendingBills = (cards || [])
    .filter((c) => !c.disabled)
    .flatMap((c) => c.activeBills || [])
    .filter((bill) => computeBillStatus(bill) !== "paid").length;

  const items = [
    {
      label: "Billed",
      value: "₹" + formatINR(summary.billed),
      color: "text-white",
    },
    {
      label: "Paid",
      value: "₹" + formatINR(summary.paid),
      color: "text-emerald-400",
    },
    {
      label: "Outstanding",
      value: "₹" + formatINR(summary.outstanding),
      color: "text-red-400",
    },
    {
      label: "Pending Bills",
      value: String(totalPendingBills),
      color: "text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-white/10 bg-[#111827] p-5"
        >
          <div className="text-xs uppercase tracking-wider text-slate-500">
            {item.label}
          </div>
          <div
            className={`mt-3 text-3xl md:text-4xl font-bold ${item.color}`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

