// src/components/dashboard/home-view.tsx
"use client";

import { useMemo } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { getDTD, computeBillStatus, formatCurrency, getPaidTotal } from "@/lib/engine/cards";
import { CardItem } from "@/components/cards/card-item";
import { useUIStore } from "@/stores/ui-store";
import { useCurrencyStore, formatWithCurrency } from "@/stores/currency-store";
import { AlertTriangle, Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import type { CreditCard, BillCycle } from "@/types/card";

interface BillWithCard { card: CreditCard; bill: BillCycle; dtd: number }

export function HomeView() {
  const cards = useVaultStore((s) => s.vault.cards);
  const setManageCardsOpen = useUIStore((s) => s.setManageCardsOpen);
  const { getCurrency } = useCurrencyStore();
  const currency = getCurrency();

  function fmtCompact(v: number) {
    const sym = currency.symbol;
    if (v >= 100000) return `${sym}${(v / 100000).toFixed(1)}L`;
    if (v >= 1000)   return `${sym}${(v / 1000).toFixed(1)}k`;
    return `${sym}${Math.round(v)}`;
  }

  function fmt(v: number) {
    return formatWithCurrency(v, currency);
  }

  const allPending = useMemo<BillWithCard[]>(() => {
    return (cards || [])
      .flatMap((card) => (card.activeBills || []).map((bill) => ({ card, bill, dtd: getDTD(bill) })))
      .filter(({ bill }) => computeBillStatus(bill) !== "paid")
      .sort((a, b) => a.dtd - b.dtd);
  }, [cards]);

  // Buckets
  const overdue     = useMemo(() => allPending.filter(({ bill, dtd }) => dtd < 0  && bill.billedAmount !== ""), [allPending]);
  const dueSoon     = useMemo(() => allPending.filter(({ bill, dtd }) => dtd >= 0 && dtd <= 7 && bill.billedAmount !== ""), [allPending]);
  const upcoming    = useMemo(() => allPending.filter(({ bill, dtd }) => dtd > 7  && bill.billedAmount !== ""), [allPending]);
  const needsAmount = useMemo(() => allPending.filter(({ bill }) => bill.billedAmount === "" || bill.billedAmount === null), [allPending]);

  const overdueTotal  = useMemo(() => overdue.reduce((s,{bill})  => s + Math.max(0, Number(bill.billedAmount||0) - getPaidTotal(bill)), 0), [overdue]);
  const dueSoonTotal  = useMemo(() => dueSoon.reduce((s,{bill})  => s + Math.max(0, Number(bill.billedAmount||0) - getPaidTotal(bill)), 0), [dueSoon]);
  const next30Total   = useMemo(() =>
    [...overdue, ...dueSoon, ...upcoming]
      .filter(({ dtd }) => dtd <= 30)
      .reduce((s,{bill}) => s + Math.max(0, Number(bill.billedAmount||0) - getPaidTotal(bill)), 0),
    [overdue, dueSoon, upcoming]);

  const noCards = cards.length === 0;
  const allClear = !noCards && allPending.length === 0;

  if (noCards) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300 px-4">
        <span className="text-5xl mb-4 opacity-50">💳</span>
        <p className="text-white font-semibold text-[15px]">No cards yet</p>
        <p className="text-slate-500 text-[13px] mt-1 mb-6">Add your credit cards to start tracking bills</p>
        <button
          onClick={() => setManageCardsOpen(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 transition-colors text-white text-[13px] font-medium px-5 py-3 rounded-xl min-h-[48px]"
        >
          <span className="text-base">➕</span> Add first card
        </button>
      </div>
    );
  }

  if (allClear) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <QuickStatsStrip overdue={0} overdueTotal={0} dueSoon={0} dueSoonTotal={0} next30Total={0} fmtCompact={fmtCompact} />
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="size-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-semibold">You're all caught up</p>
          <p className="text-slate-400 text-[13px] mt-1">No pending bills right now</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <QuickStatsStrip
        overdue={overdue.length} overdueTotal={overdueTotal}
        dueSoon={dueSoon.length} dueSoonTotal={dueSoonTotal}
        next30Total={next30Total}
        fmtCompact={fmtCompact}
      />

      {overdue.length > 0 && (
        <section className="space-y-2">
          <SectionHeader
            icon={<AlertTriangle className="size-3.5 text-red-400" />}
            label="Overdue" count={overdue.length}
            total={overdueTotal} totalColor="text-red-400" fmt={fmt}
          />
          <div className="flex flex-col gap-2">
            {overdue.map(({ card, bill }) => <CardItem key={bill.id} card={card} bill={bill} />)}
          </div>
        </section>
      )}

      {dueSoon.length > 0 && (
        <section className="space-y-2">
          <SectionHeader
            icon={<Clock className="size-3.5 text-orange-400" />}
            label="Due within 7 days" count={dueSoon.length}
            total={dueSoonTotal} totalColor="text-orange-400" fmt={fmt}
          />
          <div className="flex flex-col gap-2">
            {dueSoon.map(({ card, bill }) => <CardItem key={bill.id} card={card} bill={bill} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-2">
          <SectionHeader
            icon={<CalendarDays className="size-3.5 text-slate-500" />}
            label="Upcoming" count={upcoming.length}
            total={upcoming.reduce((s,{bill}) => s + Math.max(0, Number(bill.billedAmount||0) - getPaidTotal(bill)), 0)}
            totalColor="text-slate-300" fmt={fmt}
          />
          <div className="flex flex-col gap-2">
            {upcoming.map(({ card, bill }) => <CardItem key={bill.id} card={card} bill={bill} />)}
          </div>
        </section>
      )}

      {needsAmount.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="size-1.5 rounded-full bg-blue-500/50" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Awaiting amount ({needsAmount.length})
            </p>
          </div>
          <div className="flex flex-col gap-2 opacity-65">
            {needsAmount.map(({ card, bill }) => <CardItem key={bill.id} card={card} bill={bill} />)}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Quick Stats Strip ─────────────────────────────────────────────────────────

function QuickStatsStrip({ overdue, overdueTotal, dueSoon, dueSoonTotal, next30Total, fmtCompact }: {
  overdue: number; overdueTotal: number;
  dueSoon: number; dueSoonTotal: number;
  next30Total: number;
  fmtCompact: (v: number) => string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className={`rounded-2xl border p-3 ${overdue > 0 ? "border-red-500/25 bg-red-500/[0.07]" : "border-white/10 bg-[#111827]"}`}>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Pay now</p>
        <p className={`text-[16px] font-bold leading-tight ${overdue > 0 ? "text-red-400" : "text-emerald-400"}`}>
          {overdue > 0 ? fmtCompact(overdueTotal) : fmtCompact(0)}
        </p>
        <p className={`text-[9px] mt-0.5 ${overdue > 0 ? "text-red-400/60" : "text-emerald-400/60"}`}>
          {overdue > 0 ? `${overdue} overdue` : "all on time"}
        </p>
      </div>

      <div className={`rounded-2xl border p-3 ${dueSoon > 0 ? "border-orange-500/20 bg-orange-500/[0.05]" : "border-white/10 bg-[#111827]"}`}>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">This week</p>
        <p className={`text-[16px] font-bold leading-tight ${dueSoon > 0 ? "text-orange-400" : "text-slate-500"}`}>
          {dueSoon > 0 ? fmtCompact(dueSoonTotal) : "—"}
        </p>
        <p className={`text-[9px] mt-0.5 ${dueSoon > 0 ? "text-orange-400/60" : "text-slate-700"}`}>
          {dueSoon > 0 ? `${dueSoon} bill${dueSoon !== 1 ? "s" : ""}` : "nothing due"}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111827] p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Next 30d</p>
        <p className="text-[16px] font-bold leading-tight text-white">{fmtCompact(next30Total)}</p>
        <p className="text-[9px] text-slate-700 mt-0.5">outstanding</p>
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, count, total, totalColor, fmt }: {
  icon: React.ReactNode; label: string; count: number;
  total: number; totalColor: string;
  fmt: (v: number) => string;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label} ({count})
        </p>
      </div>
      {total > 0 && <p className={`text-[12px] font-semibold ${totalColor}`}>{fmt(total)}</p>}
    </div>
  );
}
