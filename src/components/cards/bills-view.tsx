// src/components/cards/bills-view.tsx
"use client";

import { useMemo, useState } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import {
  getNextBillDate,
  computeBillStatus,
  formatCurrency,
  getPaidTotal,
  getDTD,
} from "@/lib/engine/cards";
import { CardItem } from "./card-item";
import {
  AlertTriangle,
  Clock,
  CalendarDays,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import type { BillCycle, CreditCard } from "@/types/card";

interface BillWithCard { card: CreditCard; bill: BillCycle; dtd: number }

export function BillsView() {
  const cards        = useVaultStore((s) => s.vault.cards);
  const archiveVault = useVaultStore((s) => s.archiveVault);
  const archivedBills  = archiveVault?.archivedBills  || [];
  const deletedCards   = archiveVault?.deletedCards   || [];
  const setManageCardsOpen = useUIStore((s) => s.setManageCardsOpen);

  const [clearedExpanded, setClearedExpanded] = useState(false);
  const [upcomingExpanded, setUpcomingExpanded] = useState(false);

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);

  // ── All active bills ──────────────────────────────────────────────────────
  const allActive = useMemo<BillWithCard[]>(() => {
    return (cards || [])
      .filter((c) => !c.disabled)
      .flatMap((card) =>
        (card.activeBills || []).map((bill) => ({ card, bill, dtd: getDTD(bill) }))
      )
      .filter(({ bill }) => computeBillStatus(bill) !== "paid");
  }, [cards]);

  // Priority buckets
  const overdue     = useMemo(() => allActive.filter(({ bill, dtd }) => dtd < 0  && bill.billedAmount !== "").sort((a,b) => a.dtd - b.dtd), [allActive]);
  const dueSoon     = useMemo(() => allActive.filter(({ bill, dtd }) => dtd >= 0 && dtd <= 7  && bill.billedAmount !== "").sort((a,b) => a.dtd - b.dtd), [allActive]);
  const upcomingBills = useMemo(() => allActive.filter(({ bill, dtd }) => dtd > 7 && bill.billedAmount !== "").sort((a,b) => a.dtd - b.dtd), [allActive]);
  const needsAmount = useMemo(() => allActive.filter(({ bill }) => bill.billedAmount === "" || bill.billedAmount === null).sort((a,b) => a.dtd - b.dtd), [allActive]);

  // ── Upcoming statement generation (next 7 days) ───────────────────────────
  const upcomingGeneration = useMemo(() => {
    return (cards || []).filter((c) => {
      if (c.disabled) return false;
      const next = getNextBillDate(c);
      const diff = Math.ceil((next.getTime() - today.getTime()) / 86400000);
      return diff >= 0 && diff <= 7;
    });
  }, [cards, today]);

  // ── Last cleared (most recent per card, active-card-only) ─────────────────
  const clearedBills = useMemo<BillCycle[]>(() => {
    const map = new Map<string, BillCycle>();
    archivedBills.forEach((bill) => {
      const isDeleted  = deletedCards.some((dc) => dc.id === bill.cardId);
      const cardExists = cards.some((c) => c.id === bill.cardId);
      if (!cardExists || isDeleted) return;
      const existing = map.get(bill.cardId);
      if (!existing || bill.statementDate > existing.statementDate) map.set(bill.cardId, bill);
    });
    return Array.from(map.values()).sort((a, b) => b.statementDate.localeCompare(a.statementDate));
  }, [archivedBills, cards, deletedCards]);

  const CLEARED_PREVIEW = 3;
  const clearedVisible  = clearedExpanded ? clearedBills : clearedBills.slice(0, CLEARED_PREVIEW);

  const isEmpty = allActive.length === 0 && upcomingGeneration.length === 0 && clearedBills.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
        <span className="text-5xl mb-4 opacity-50">🧾</span>
        <p className="text-white font-semibold text-[15px]">No bills yet</p>
        <p className="text-slate-500 text-[13px] mt-1 mb-6">Add cards to start tracking statements</p>
        <button
          onClick={() => setManageCardsOpen(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 transition-colors text-white text-[13px] font-medium px-5 py-2.5 rounded-xl"
        >
          <Plus className="size-4" /> Add a card
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">

      {/* ── OVERDUE ─────────────────────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <Section
          icon={<AlertTriangle className="size-3.5 text-red-400" />}
          label="Overdue"
          count={overdue.length}
          total={overdue.reduce((s,{bill}) => s + Math.max(0, Number(bill.billedAmount||0) - getPaidTotal(bill)), 0)}
          totalColor="text-red-400"
        >
          {overdue.map(({ card, bill }) => (
            <CardItem key={bill.id} card={card} bill={bill} />
          ))}
        </Section>
      )}

      {/* ── DUE WITHIN 7 DAYS ───────────────────────────────────────────────── */}
      {dueSoon.length > 0 && (
        <Section
          icon={<Clock className="size-3.5 text-orange-400" />}
          label="Due within 7 days"
          count={dueSoon.length}
          total={dueSoon.reduce((s,{bill}) => s + Math.max(0, Number(bill.billedAmount||0) - getPaidTotal(bill)), 0)}
          totalColor="text-orange-400"
        >
          {dueSoon.map(({ card, bill }) => (
            <CardItem key={bill.id} card={card} bill={bill} />
          ))}
        </Section>
      )}

      {/* ── UPCOMING (> 7 days) ──────────────────────────────────────────────── */}
      {upcomingBills.length > 0 && (
        <Section
          icon={<CalendarDays className="size-3.5 text-slate-400" />}
          label="Upcoming"
          count={upcomingBills.length}
          total={upcomingBills.reduce((s,{bill}) => s + Math.max(0, Number(bill.billedAmount||0) - getPaidTotal(bill)), 0)}
          totalColor="text-slate-300"
          collapsible
          defaultCollapsed={upcomingBills.length > 3}
        >
          {upcomingBills.map(({ card, bill }) => (
            <CardItem key={bill.id} card={card} bill={bill} />
          ))}
        </Section>
      )}

      {/* ── NEEDS AMOUNT ─────────────────────────────────────────────────────── */}
      {needsAmount.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <FileText className="size-3.5 text-blue-400/60" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Enter statement amount ({needsAmount.length})
            </p>
          </div>
          <div className="flex flex-col gap-2 opacity-75">
            {needsAmount.map(({ card, bill }) => (
              <CardItem key={bill.id} card={card} bill={bill} />
            ))}
          </div>
        </div>
      )}

      {/* ── UPCOMING STATEMENT GENERATION ───────────────────────────────────── */}
      {upcomingGeneration.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <CalendarDays className="size-3.5 text-slate-500" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Generates in 7 days ({upcomingGeneration.length})
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {upcomingGeneration.map((card) => {
              const nextDate = getNextBillDate(card);
              const diff     = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
              return (
                <div
                  key={card.id}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/5 bg-[#111827]/60"
                >
                  <div>
                    <p className="text-[13px] font-medium text-slate-300">{card.name}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Statement {diff === 0 ? "generates today" : `in ${diff} day${diff > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-blue-900/30 text-blue-400 border border-blue-500/20 shrink-0">
                    {nextDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LAST CLEARED ─────────────────────────────────────────────────────── */}
      {clearedBills.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500/60" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Last cleared ({clearedBills.length})
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {clearedVisible.map((bill) => {
              const parentCard = cards.find((c) => c.id === bill.cardId);
              if (!parentCard) return null;
              const paid = getPaidTotal(bill);
              return (
                <ClearedBillRow key={bill.id} cardName={parentCard.name} bill={bill} paid={paid} />
              );
            })}
          </div>

          {clearedBills.length > CLEARED_PREVIEW && (
            <button
              onClick={() => setClearedExpanded((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/5 bg-transparent text-[12px] font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors active:bg-white/5"
            >
              {clearedExpanded ? (
                <><ChevronUp className="size-3.5" /> Show less</>
              ) : (
                <><ChevronDown className="size-3.5" /> {clearedBills.length - CLEARED_PREVIEW} more</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Cleared Bill Row ─────────────────────────────────────────────────────────

function ClearedBillRow({
  cardName, bill, paid,
}: {
  cardName: string; bill: BillCycle; paid: number;
}) {
  const statDate = new Date(bill.statementDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "2-digit",
  });
  const dueDate  = new Date(bill.dueDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
  });

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/5 bg-[#0d1420]">
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-[13px] font-medium text-slate-300 truncate">{cardName}</p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Stmt {statDate} · due {dueDate}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[14px] font-bold text-emerald-400">{formatCurrency(paid)}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mt-0.5">Paid</p>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon, label, count, total, totalColor, children, collapsible = false, defaultCollapsed = false,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  totalColor: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="space-y-2">
      <button
        onClick={() => collapsible && setCollapsed((v) => !v)}
        className={`w-full flex items-center justify-between px-1 ${collapsible ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label} ({count})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <p className={`text-[12px] font-semibold ${totalColor}`}>{formatCurrency(total)}</p>
          )}
          {collapsible && (
            collapsed
              ? <ChevronDown className="size-3.5 text-slate-600" />
              : <ChevronUp   className="size-3.5 text-slate-600" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full py-2.5 rounded-xl border border-white/5 bg-transparent text-[12px] text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-colors"
        >
          Show {count} bill{count !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
