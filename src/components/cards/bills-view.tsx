// src/components/cards/bills-view.tsx
"use client";

import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { getNextBillDate, computeBillStatus, formatCurrency, getPaidTotal } from "@/lib/engine/cards";
import { CardItem } from "./card-item";
import { Calendar, CheckCircle2 } from "lucide-react";
import type { BillCycle } from "@/types/card";

export function BillsView() {
  const cards = useVaultStore((s) => s.vault.cards);
  
  const archiveVault = useVaultStore((s) => s.archiveVault);
  const archivedBills = archiveVault?.archivedBills || [];
  const deletedCards = archiveVault?.deletedCards || [];
  
  const setManageCardsOpen = useUIStore((s) => s.setManageCardsOpen);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Active Statements
  const activeStatements = (cards || [])
    .filter((c) => !c.disabled)
    .flatMap((card) => (card.activeBills || []).map((bill) => ({ card, bill })))
    .filter(({ bill }) => computeBillStatus(bill) !== "paid");

  // 2. Upcoming Statements
  const upcomingStatements = (cards || []).filter((c) => {
    if (c.disabled) return false;
    const nextDate = getNextBillDate(c);
    const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
    return diffDays >= 0 && diffDays <= 7;
  });

  // 3. Cleared Statements (Filtered to exclude DELETED cards)
  const clearedBillsMap = new Map<string, BillCycle>();
  
  archivedBills.forEach((bill) => {
    // ONLY include if the card still exists in 'cards' and is NOT in 'deletedCards'
    const isDeleted = deletedCards.some(dc => dc.id === bill.cardId);
    const cardExists = cards.some(c => c.id === bill.cardId);

    if (cardExists && !isDeleted) {
        const existing = clearedBillsMap.get(bill.cardId);
        if (!existing || new Date(bill.statementDate) > new Date(existing.statementDate)) {
            clearedBillsMap.set(bill.cardId, bill);
        }
    }
  });
  
  const clearedStatements = Array.from(clearedBillsMap.values()).sort(
    (a, b) => new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime()
  );

  // ... rest of the component remains the same ...
  const hasNoData = activeStatements.length === 0 && upcomingStatements.length === 0 && clearedStatements.length === 0;

  if (hasNoData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm text-center animate-in fade-in duration-300">
        <span className="text-4xl mb-2 opacity-60">🧾</span>
        <p className="mt-2 text-slate-400">No active or upcoming bills.</p>
        <button
          onClick={() => setManageCardsOpen(true)}
          className="mt-4 flex items-center justify-center gap-1.5 w-full max-w-[200px] bg-[#111827] border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
        >
          <span className="text-[18px]">➕</span> Add a card
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-300">
      {/* Active Statements Section */}
      {activeStatements.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 px-1">
            Active Statements ({activeStatements.length})
          </h3>
          <div className="flex flex-col gap-2">
            {activeStatements.map(({ card, bill }) => (
              <CardItem key={bill.id} card={card} bill={bill} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Statements Section */}
      {upcomingStatements.length > 0 && (
        <section className="space-y-3 mt-6">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <Calendar className="size-3.5" /> Generates in 7 Days ({upcomingStatements.length})
          </h3>
          <div className="flex flex-col gap-2">
            {upcomingStatements.map((card) => {
              const nextDate = getNextBillDate(card);
              const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);

              return (
                <div key={card.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-[#111827]">
                  <div>
                    <div className="font-semibold text-[14px] text-white">{card.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Statement generates {diffDays === 0 ? "today" : `in ${diffDays} day${diffDays > 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <div className="text-[11px] px-2.5 py-1 rounded-md font-semibold bg-blue-900/30 text-blue-400 border border-blue-500/20">
                    {nextDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Cleared Statements Section */}
      {clearedStatements.length > 0 && (
        <section className="space-y-3 mt-6 pt-6 border-t border-white/10">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> Last Cleared Statements ({clearedStatements.length})
          </h3>
          <div className="flex flex-col gap-2">
            {clearedStatements.map((bill) => {
              const parentCard = cards.find((c) => c.id === bill.cardId);
              // We already filtered for this above, but safe-guarding:
              if (!parentCard) return null;

              return (
                <div key={bill.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-[#141b2b] opacity-80">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="text-[14px] font-medium text-slate-300 truncate">{parentCard.name}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Statement: {new Date(bill.statementDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-bold text-green-400">{formatCurrency(getPaidTotal(bill))}</div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Paid</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}