// src/components/dashboard/summary-cards.tsx
"use client";

import { useMemo } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { getSummary, computeBillStatus, getDTD, getPaidTotal } from "@/lib/engine/cards";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useCurrencyStore } from "@/stores/currency-store";

export function SummaryCards() {
  const cards = useVaultStore((s) => s.vault.cards);
  const summary = getSummary(cards);
  const fmt = useFormatCurrency();
  const { getCurrency } = useCurrencyStore();
  const currency = getCurrency();

  // Compact formatter that respects the current currency symbol
  function fmtCompact(value: number) {
    const sym = currency.symbol;
    if (value >= 100000) return `${sym}${(value / 100000).toFixed(1)}L`;
    if (value >= 1000)   return `${sym}${(value / 1000).toFixed(1)}k`;
    return `${sym}${Math.round(value)}`;
  }

  // Count bills needing action (overdue or due ≤ 3 days)
  const urgent = useMemo(() => {
    return (cards || [])
      .filter((c) => !c.disabled)
      .flatMap((c) => c.activeBills || [])
      .filter((b) => computeBillStatus(b) !== "paid" && b.billedAmount !== "" && getDTD(b) <= 3)
      .length;
  }, [cards]);

  const outstanding = summary.outstanding;
  const pct = summary.billed > 0 ? Math.round((summary.paid / summary.billed) * 100) : 0;

  const totalDue = useMemo(() => {
    return (cards || [])
      .filter((c) => !c.disabled)
      .flatMap((c) => c.activeBills || [])
      .filter((b) => computeBillStatus(b) !== "paid" && b.billedAmount !== "")
      .reduce((s, b) => s + Math.max(0, Number(b.billedAmount || 0) - getPaidTotal(b)), 0);
  }, [cards]);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111827] px-5 py-4">
      {/* Top row: key numbers */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Outstanding</p>
          <p className={`text-3xl font-bold leading-none ${outstanding > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {fmtCompact(outstanding)}
          </p>
          {outstanding > 0 && (
            <p className="text-[11px] text-slate-500 mt-1.5">
              of {fmtCompact(summary.billed)} total billed
            </p>
          )}
          {outstanding === 0 && summary.billed > 0 && (
            <p className="text-[11px] text-emerald-400/70 mt-1.5">all paid up ✓</p>
          )}
        </div>

        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Paid</p>
          <p className="text-3xl font-bold leading-none text-emerald-400">{fmtCompact(summary.paid)}</p>
          <p className="text-[11px] text-slate-500 mt-1.5">{pct}% cleared</p>
        </div>
      </div>

      {/* Progress bar */}
      {summary.billed > 0 && (
        <div className="mb-3">
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct >= 100
                  ? "#10b981"
                  : pct >= 60
                  ? "#f59e0b"
                  : "#ef4444",
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom row: contextual pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {urgent > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-red-500/15 border border-red-500/20 text-red-400">
            <span className="size-1.5 rounded-full bg-red-400 inline-block" />
            {urgent} urgent
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
          {cards.filter((c) => !c.disabled).length} active cards
        </span>
        {totalDue > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {fmtCompact(totalDue)} remaining
          </span>
        )}
      </div>
    </div>
  );
}
