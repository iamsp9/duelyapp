"use client";

import { useVaultStore } from "@/stores/vault-store";
import { getDashboardCards } from "@/lib/engine/dashboard";
import { SummaryCards } from "./summary-cards";
import { CardItem } from "@/components/cards/card-item";

export function HomeView() {
  const cards = useVaultStore((s) => s.vault.cards);
  const dashboardCards = getDashboardCards(cards);

  return (
    <div className="space-y-6">
      <SummaryCards />

      {dashboardCards.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 text-center">
          <div className="text-4xl mb-2 text-green-400">✓</div>
          <p className="text-slate-400">All active bills paid!</p>
        </div>
      ) : (
        <section className="space-y-3">
          <h3 className="text-[13px] font-medium text-slate-400 px-1">
            {dashboardCards.length} bill{dashboardCards.length > 1 ? 's' : ''} pending
          </h3>
          <div className="flex flex-col gap-2">
            {dashboardCards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}