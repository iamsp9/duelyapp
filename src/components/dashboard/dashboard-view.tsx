"use client";

import {
  useVaultStore,
} from "@/stores/vault-store";

import {
  computeStatus,
  isActive,
  sortByDue,
} from "@/lib/engine/cards";

import {
  CardItem,
} from "./card-item";

export function DashboardView() {
  const cards =
    useVaultStore(
      (s) => s.cards
    );

  const pending =
    sortByDue(
      cards.filter(
        (c) =>
          isActive(c) &&
          computeStatus(c) !==
            "paid"
      )
    );

  if (!pending.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#111827] p-10 text-center text-slate-400">
        No pending bills.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.map((card) => (
        <CardItem
          key={card.id}
          card={card}
        />
      ))}
    </div>
  );
}