"use client";

import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { isActive, sortByPriority, sortByBillDate } from "@/lib/engine/cards";
import { CardItem } from "./card-item";

export function AllCardsView() {
  const cards = useVaultStore((s) => s.vault.cards);
  const setManageCardsOpen = useUIStore((s) => s.setManageCardsOpen);

  const activeCards = sortByPriority(cards.filter(isActive));
  const upcomingCards = sortByBillDate(cards.filter(c => !isActive(c)));

  return (
    <div className="space-y-6">
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm text-center">
          <span className="text-4xl mb-2 opacity-60">💳</span>
          <p className="mt-2 text-slate-400">No cards yet.</p>
          <button 
            onClick={() => setManageCardsOpen(true)}
            className="mt-4 flex items-center justify-center gap-1.5 w-full max-w-[200px] bg-[#111827] border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
          >
            <span className="text-[18px]">➕</span> Add a card
          </button>
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