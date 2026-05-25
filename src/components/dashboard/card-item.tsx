"use client";

import {
  Card,
} from "@/types/card";

import {
  computeStatus,
  histTotal,
  getDueBadge,
} from "@/lib/engine/cards";

type Props = {
  card: Card;
};

export function CardItem({
  card,
}: Props) {
  const status =
    computeStatus(card);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111827] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {card.name}
          </h3>

          <p className="text-sm text-slate-400">
            Bill {card.billDay}th
            · Due {card.dueDay}th
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-slate-400">
            {getDueBadge(card)}
          </div>

          <div className="text-xl font-bold text-white">
            ₹
            {Number(
              card.totalBill || 0
            ).toLocaleString(
              "en-IN"
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">
            Paid
          </div>

          <div className="text-green-400 font-semibold">
            ₹
            {histTotal(
              card
            ).toLocaleString(
              "en-IN"
            )}
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status === "paid"
              ? "bg-green-500/20 text-green-400"
              : status ===
                "partial"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {status}
        </div>
      </div>
    </div>
  );
}