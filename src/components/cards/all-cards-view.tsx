// src/components/cards/all-cards-view.tsx
"use client";

import { useState } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { computeBillStatus, formatCurrency, getPaidTotal } from "@/lib/engine/cards";
import { PowerOff, ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, Archive } from "lucide-react";
import type { CreditCard, BillCycle } from "@/types/card";
import * as XLSX from "xlsx";

// ─── Reusable Card History Table Component ──────────────────────────────────
function CardHistoryRow({ card, archivedBills }: { card: CreditCard; archivedBills: BillCycle[] }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 5;

  const allBills = [...(card.activeBills || []), ...archivedBills.filter((b) => b.cardId === card.id)].sort(
    (a, b) => new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(allBills.length / limit));
  const paginated = allBills.slice((page - 1) * limit, page * limit);

  const handleDownload = () => {
    const wsData = [["Statement Date", "Due Date", "Billed Amount", "Paid Amount", "Status"]];

    allBills.forEach((b) => {
      wsData.push([
        new Date(b.statementDate).toLocaleDateString("en-IN"),
        new Date(b.dueDate).toLocaleDateString("en-IN"),
        b.billedAmount || 0,
        getPaidTotal(b),
        computeBillStatus(b).toUpperCase(),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();

    ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];

    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, `${card.name.replace(/\s+/g, "_")}_History.xlsx`);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div>
          <div className="font-semibold text-[14px] text-white flex items-center gap-2">
            {card.name}
            {card.disabled && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold uppercase">
                {card.billDay === -1 ? 'Archived' : 'Disabled'}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{allBills.length} Statements tracked</div>
        </div>
        <ChevronDown className={`size-[18px] text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="p-4 border-t border-white/10 bg-[#0d1525]">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider">Statement History</h4>
            <button
              onClick={handleDownload}
              disabled={allBills.length === 0}
              className="text-[11px] flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="size-3.5" /> Export Excel
            </button>
          </div>

          {allBills.length === 0 ? (
            <div className="text-[12px] text-slate-500 py-3 text-center border border-dashed border-white/10 rounded-lg">
              No statement history available.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-white/5">
                <table className="w-full text-left text-[12px] whitespace-nowrap">
                  <thead className="bg-[#1a2234] text-slate-400 border-b border-white/5 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Statement</th>
                      <th className="px-3 py-2 font-medium">Due</th>
                      <th className="px-3 py-2 font-medium">Billed</th>
                      <th className="px-3 py-2 font-medium">Paid</th>
                      <th className="px-3 py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-white/5">
                    {paginated.map((b) => {
                      const stat = computeBillStatus(b);
                      return (
                        <tr key={b.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-3 py-2.5">
                            {new Date(b.statementDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                          </td>
                          <td className="px-3 py-2.5">
                            {new Date(b.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                          </td>
                          <td className="px-3 py-2.5">{b.billedAmount ? formatCurrency(b.billedAmount) : "—"}</td>
                          <td className="px-3 py-2.5">{formatCurrency(getPaidTotal(b))}</td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${stat === "paid" ? "bg-green-500/10 text-green-400" : stat === "partial" ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-400"}`}>
                              {stat.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3">
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 transition-colors">
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-[11px] font-medium text-slate-500">Page {page} of {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 transition-colors">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main View Component ────────────────────────────────────────────────────
export function AllCardsView() {
  const cards = useVaultStore((s) => s.vault.cards);
  
  // FIX: Fetch the object first, apply the array fallback outside to prevent infinite loops
  const archiveVault = useVaultStore((s) => s.archiveVault);
  const archivedBills = archiveVault?.archivedBills || [];
  const deletedCards = archiveVault?.deletedCards || [];
  
  const setManageCardsOpen = useUIStore((s) => s.setManageCardsOpen);

  const activeCards = (cards || []).filter((c) => !c.disabled);
  const disabledCards = (cards || []).filter((c) => c.disabled);

  const hasNoCards = cards.length === 0 && deletedCards.length === 0;

  if (hasNoCards) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm text-center animate-in fade-in duration-300">
        <span className="text-4xl mb-2 opacity-60">💳</span>
        <p className="mt-2 text-slate-400">No cards tracked yet.</p>
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
      {/* Active Cards */}
      {activeCards.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 px-1">
            Active Cards ({activeCards.length})
          </h3>
          <div className="flex flex-col gap-2">
            {activeCards.map((card) => (
              <CardHistoryRow key={card.id} card={card} archivedBills={archivedBills} />
            ))}
          </div>
        </section>
      )}

      {/* Disabled Cards */}
      {disabledCards.length > 0 && (
        <section className="space-y-3 mt-6 pt-6 border-t border-white/10">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <PowerOff className="size-3.5" /> Disabled Cards ({disabledCards.length})
          </h3>
          <div className="flex flex-col gap-2 opacity-60 grayscale-[30%] hover:grayscale-0 transition-all duration-300">
            {disabledCards.map((card) => (
              <CardHistoryRow key={card.id} card={card} archivedBills={archivedBills} />
            ))}
          </div>
        </section>
      )}

      {/* Archived Cards (Deleted but History Retained) */}
      {deletedCards.length > 0 && (
        <section className="space-y-3 mt-6 pt-6 border-t border-white/10">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <Archive className="size-3.5" /> Archived Cards ({deletedCards.length})
          </h3>
          <div className="flex flex-col gap-2 opacity-50 grayscale-[50%] hover:grayscale-0 transition-all duration-300">
            {deletedCards.map((dc) => {
              // Create a dummy CreditCard object to pass to CardHistoryRow
              const mockCard: CreditCard = {
                id: dc.id,
                name: dc.name,
                billDay: -1, // Hack flag to denote "Archived" status
                dueAfterDays: 0,
                activeBills: [],
                disabled: true
              };
              return <CardHistoryRow key={mockCard.id} card={mockCard} archivedBills={archivedBills} />
            })}
          </div>
        </section>
      )}
    </div>
  );
}