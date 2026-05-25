"use client";

import { useVaultStore } from "@/stores/vault-store";
import { isActive, sortByPriority, sortByBillDate } from "@/lib/engine/cards";
import { CardItem } from "./card-item";

export function AllCardsView() {
  const cards = useVaultStore((s) => s.vault.cards);

  const activeCards = sortByPriority(cards.filter(isActive));
  const upcomingCards = sortByBillDate(cards.filter(c => !isActive(c)));

  return (
    <div className="space-y-6">
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 text-center text-slate-400">
          <p className="mt-2 text-sm">No cards yet.</p>
        </div>
      ) : (
        <>
          {activeCards.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-[13px] font-medium text-slate-400 px-1">
                Active this cycle ({activeCards.length})
              </h3>
              <div className="flex flex-col gap-2">
                {activeCards.map((card) => (
                  <CardItem key={card.id} card={card} />
                ))}
              </div>
            </section>
          )}

          {upcomingCards.length > 0 && (
            <section className="space-y-3 mt-4">
              <h3 className="text-[13px] font-medium text-slate-400 px-1">
                Upcoming ({upcomingCards.length})
              </h3>
              <div className="flex flex-col gap-2">
                {upcomingCards.map((card) => (
                  <CardItem key={card.id} card={card} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}