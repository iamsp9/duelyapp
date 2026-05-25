"use client";

import {
  useVaultStore,
} from "@/stores/vault-store";

import {
  isActive,
  sortByPriority,
  sortByBillDate,
} from "@/lib/engine/cards";

import {
  CardItem,
} from "./card-item";

export function AllCardsView() {
  const cards =
    useVaultStore(
      (s) => s.cards
    );

  const active =
    sortByPriority(
      cards.filter(isActive)
    );

  const upcoming =
    sortByBillDate(
      cards.filter(
        (c) => !isActive(c)
      )
    );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Active This Cycle
        </h2>

        <div className="space-y-4">
          {active.map((card) => (
            <CardItem
              key={card.id}
              card={card}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Upcoming
        </h2>

        <div className="space-y-4">
          {upcoming.map((card) => (
            <CardItem
              key={card.id}
              card={card}
            />
          ))}
        </div>
      </div>
    </div>
  );
}