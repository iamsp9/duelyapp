"use client";

import { useState } from "react";
import type { CreditCard } from "@/types/card";
import { useCurrencyStore, formatWithCurrency } from "@/stores/currency-store";
import { getPaidTotal, computeBillStatus, getDTD } from "@/lib/engine/cards";

interface Props {
  card: CreditCard;
}

export function DashboardCard({ card }: Props) {
  const [open, setOpen] = useState(false);

  const { getCurrency } = useCurrencyStore();
  const currency = getCurrency();
  const fmt = (v: number | string) => formatWithCurrency(v, currency);

  // Derive the most relevant active bill (earliest due, unpaid)
  const activeBill = (card.activeBills || [])
    .filter((b) => computeBillStatus(b) !== "paid")
    .sort((a, b) => getDTD(a) - getDTD(b))[0] ?? null;

  const billedAmount = activeBill ? Number(activeBill.billedAmount || 0) : 0;
  const paidAmount   = activeBill ? getPaidTotal(activeBill) : 0;
  const outstanding  = Math.max(0, billedAmount - paidAmount);

  const dueDateLabel = activeBill
    ? new Date(activeBill.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "—";

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111827]">
      <button onClick={() => setOpen(!open)} className="w-full p-5 text-left">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{card.name}</h3>
            <p className="mt-1 text-sm text-slate-400">
              Bill {card.billDay} · Due {dueDateLabel}
            </p>
          </div>

          <div className="text-right">
            <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
              Due Soon
            </div>
            <div className="mt-2 text-xl font-bold text-white">
              {fmt(outstanding)}
            </div>
          </div>
        </div>
      </button>

      {open && activeBill && (
        <div className="border-t border-white/10 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Total bill ({currency.symbol})
              </label>
              <input
                readOnly
                value={billedAmount}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Paid ({currency.symbol})
              </label>
              <input
                readOnly
                value={paidAmount}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <button className="rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-sm text-red-400">
              Unpaid
            </button>
            <button className="rounded-2xl border border-yellow-500/30 py-3 text-sm text-yellow-400">
              Partial
            </button>
            <button className="rounded-2xl border border-green-500/30 py-3 text-sm text-green-400">
              Paid
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button className="rounded-2xl border border-white/10 py-3 font-medium text-white">
              Save
            </button>
            <button className="rounded-2xl border border-white/10 py-3 font-medium text-white">
              Log Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}