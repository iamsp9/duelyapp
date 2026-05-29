// src/components/dashboard/home-view.tsx
"use client";

import { useVaultStore } from "@/stores/vault-store";
import { getDTD, computeBillStatus } from "@/lib/engine/cards";
import { SummaryCards } from "./summary-cards";
import { CardItem } from "@/components/cards/card-item";

export function HomeView() {
  const cards = useVaultStore((s) => s.vault.cards);

  // 1. Flatten all active bills from all cards
  // 2. Filter out fully paid bills (they get archived anyway, but just in case)
  // 3. Sort them strictly by Due Date (Overdue -> Due Soon -> Later)
  const pendingBills = (cards || [])
    .flatMap(card => 
      (card.activeBills || []).map(bill => ({ card, bill }))
    )
    .filter(({ bill }) => computeBillStatus(bill) !== "paid")
    .sort((a, b) => getDTD(a.bill) - getDTD(b.bill));

  return (
    <div className="space-y-6">
      <SummaryCards />

      {pendingBills.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 text-center">
          <div className="text-4xl mb-2 text-green-400">✓</div>
          <p className="text-slate-400">All active bills paid!</p>
        </div>
      ) : (
        <section className="space-y-3">
          <h3 className="text-[13px] font-medium text-slate-400 px-1">
            {pendingBills.length} bill{pendingBills.length > 1 ? 's' : ''} pending
          </h3>
          <div className="flex flex-col gap-2">
            {pendingBills.map(({ card, bill }) => (
              <CardItem key={bill.id} card={card} bill={bill} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}