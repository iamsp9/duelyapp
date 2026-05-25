"use client";

import { useState } from "react";

import type {
  CreditCard,
} from "@/types/card";

interface Props {
  card: CreditCard;
}

export function DashboardCard({
  card,
}: Props) {
  const [open, setOpen] =
    useState(false);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111827]">
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="w-full p-5 text-left"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {card.name}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Bill{" "}
              {card.billDay} · Due{" "}
              {card.dueDay}
            </p>
          </div>

          <div className="text-right">
            <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
              Due Soon
            </div>

            <div className="mt-2 text-xl font-bold text-white">
              ₹
              {card.totalBill ||
                0}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Total bill
              </label>

              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Add payment
              </label>

              <input
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