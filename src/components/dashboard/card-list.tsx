"use client";

import { useVaultStore } from "@/stores/vault-store";

import {
  getDueDate,
  formatDate,
} from "@/lib/utils/billing";

export function CardList() {
  const { vault } =
    useVaultStore();

  if (!vault.cards.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-card p-6 text-slate-400">
        No cards added yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vault.cards.map((card) => {
        const dueDate =
          getDueDate(card);

        return (
          <div
            key={card.id}
            className="rounded-3xl border border-white/10 bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {card.name}
                </h3>

                <p className="text-slate-400 text-sm mt-1">
                  {card.bank} ••••
                  {card.last4}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold">
                  ₹
                  {card.limit.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-slate-500">
                  Bill Date
                </p>

                <p className="text-lg font-semibold mt-1">
                  Every{" "}
                  {
                    card.billGenerationDay
                  }
                  th
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-slate-500">
                  Next Due
                </p>

                <p className="text-lg font-semibold mt-1">
                  {formatDate(
                    dueDate
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}