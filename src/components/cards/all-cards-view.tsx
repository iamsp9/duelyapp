"use client";

import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { isActive, sortByPriority, sortByBillDate, getNextBillDate, computeStatus } from "@/lib/engine/cards";
import { CardItem } from "./card-item";
import { Archive, Download, PowerOff } from "lucide-react";
import type { CreditCard, ArchivedCard } from "@/types/card";
import * as XLSX from "xlsx";

export function AllCardsView() {
  const { cards, archivedCards } = useVaultStore((s) => s.vault);
  const setManageCardsOpen = useUIStore((s) => s.setManageCardsOpen);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeList: CreditCard[] = [];
  const upcomingList: CreditCard[] = [];
  const disabledList: CreditCard[] = [];

  cards.forEach(c => {
    // 1. Handle Disabled Cards
    if (c.disabled) {
       if (!isActive(c)) {
          disabledList.push(c);
       } else {
          // Keep in active if it still has a pre-disable bill pending
          activeList.push(c); 
       }
       return;
    }

    // Calculate days until next bill generates
    const nextBill = getNextBillDate(c);
    const diffTime = nextBill.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const currentlyActive = isActive(c);
    const status = computeStatus(c);

    // 2. Smart Classification
    if (currentlyActive && status === 'paid' && diffDays <= 15 && diffDays > 0) {
       // If it's technically active, but already PAID, and the next bill is coming soon -> Move to Upcoming
       upcomingList.push(c);
    } 
    else if (currentlyActive) {
       // Normal active card
       activeList.push(c);
    } 
    else if (diffDays <= 15 && diffDays >= 0) {
       // Not active yet, but bill generates in <= 15 days
       upcomingList.push(c);
    }
  });

  const activeCards = sortByPriority(activeList);
  const upcomingCards = sortByBillDate(upcomingList);
  const disabledCards = sortByBillDate(disabledList);

  const handleDownloadData = (card: ArchivedCard) => {
    const wsData: any[][] = [];

    // Table Headers
    wsData.push(["Timestamp", "Date", "Amount", "Type", "Note"]);

    // Map history to rows
    card.history.forEach(h => {
      const ts = h.ts ? new Date(h.ts).toLocaleString() : "";
      const date = h.date ? new Date(h.date).toLocaleDateString() : ts;
      const amount = h.amount !== undefined ? h.amount : "";
      const type = h.text ? "Log" : "Payment";
      const note = h.note || h.text || "";
      
      wsData.push([ts, date, amount, type, note]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-size columns for clean Excel formatting
    const colWidths = wsData.map(row => row.map(val => (val == null ? 10 : val.toString().length)));
    const maxColWidths = colWidths.reduce((acc: number[], row: number[]) => {
      row.forEach((len, i) => { if (!acc[i] || acc[i] < len) acc[i] = len; });
      return acc;
    }, []);
    ws['!cols'] = maxColWidths.map((w: number) => ({ wch: w + 2 }));

    // Create workbook and trigger download
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Archived Data');
    
    const fileName = `archived_${card.name.replace(/\s+/g, "_").toLowerCase()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const hasNoCards = cards.length === 0 && archivedCards.length === 0;

  return (
    <div className="space-y-6">
      {hasNoCards ? (
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
          {/* Active Cards Section */}
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

          {/* Upcoming Cards Section */}
          {upcomingCards.length > 0 && (
            <section className="space-y-3 mt-4">
              <h3 className="text-[13px] font-medium text-slate-400 px-1">
                Upcoming next 15 days ({upcomingCards.length})
              </h3>
              <div className="flex flex-col gap-2">
                {upcomingCards.map((card) => (
                  <CardItem key={card.id} card={card} />
                ))}
              </div>
            </section>
          )}

          {/* Disabled Cards Section */}
          {disabledCards.length > 0 && (
            <section className="space-y-3 mt-4">
              <h3 className="text-[13px] font-medium text-slate-400 px-1 flex items-center gap-1.5">
                <PowerOff className="size-3.5" /> Disabled ({disabledCards.length})
              </h3>
              <div className="flex flex-col gap-2 opacity-60 grayscale-[30%]">
                {disabledCards.map((card) => (
                  <CardItem key={card.id} card={card} />
                ))}
              </div>
            </section>
          )}

          {/* Archived Cards Section */}
          {archivedCards.length > 0 && (
            <section className="space-y-3 mt-6 pt-6 border-t border-white/10">
              <h3 className="text-[13px] font-medium text-slate-400 px-1 flex items-center gap-1.5">
                <Archive className="size-3.5" /> Archived Cards ({archivedCards.length})
              </h3>
              <div className="flex flex-col gap-2">
                {archivedCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#141b2b] opacity-80">
                    <div className="flex flex-col min-w-0 pr-4">
                       <span className="text-[14px] font-medium text-slate-300 truncate">{card.name}</span>
                       <span className="text-[11px] text-slate-500 mt-0.5">
                         Archived on: {new Date(card.archivedAt).toLocaleDateString()} · {card.history.length} transactions
                       </span>
                    </div>
                    <button
                      onClick={() => handleDownloadData(card)}
                      className="flex items-center justify-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-[10px] px-3 py-2 text-[12px] font-medium text-blue-400 transition-all hover:bg-blue-500/20 shrink-0"
                      title="Download Excel Data"
                    >
                      <Download className="size-3.5" /> Data
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}