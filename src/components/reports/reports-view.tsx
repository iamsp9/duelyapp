// src/components/reports/reports-view.tsx
"use client";

import { useState, useMemo } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { computeBillStatus, getPaidTotal } from "@/lib/engine/cards";
import { useCurrencyStore, formatWithCurrency } from "@/stores/currency-store";
import type { BillCycle, CreditCard } from "@/types/card";
import {
  TrendingUp,
  TrendingDown,
  CreditCard as CreditCardIcon,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart2,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlyData {
  key: string;
  label: string;
  shortLabel: string;
  billed: number;
  paid: number;
  outstanding: number;
  count: number;
}

interface CardSummary {
  card: CreditCard;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  allBills: BillCycle[];
  lastActivity: string | null;
  avgBill: number;
  onTimeRate: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function getMonthLabel(key: string, short = false): string {
  const [y, m] = key.split("-");
  const idx = parseInt(m, 10) - 1;
  return short ? MONTHS_SHORT[idx] : `${MONTHS_FULL[idx]} ${y}`;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function getDaysOverdue(bill: BillCycle): number {
  if (computeBillStatus(bill) === "paid") return 0;
  const due = new Date(bill.dueDate);
  const today = new Date();
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return Math.max(0, diff);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, icon: Icon, trend,
}: {
  label: string; value: string; sub?: string;
  color: "blue" | "green" | "red" | "amber" | "purple";
  icon: React.ElementType;
  trend?: { value: number; label: string };
}) {
  const colorMap = {
    blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   text: "text-blue-400",   icon: "text-blue-400" },
    green:  { bg: "bg-emerald-500/10",border: "border-emerald-500/20",text: "text-emerald-400",icon: "text-emerald-400" },
    red:    { bg: "bg-red-500/10",    border: "border-red-500/20",    text: "text-red-400",    icon: "text-red-400" },
    amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/20",  text: "text-amber-400",  icon: "text-amber-400" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", icon: "text-purple-400" },
  };
  const c = colorMap[color];

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <Icon className={`size-4 ${c.icon}`} />
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.value >= 0
            ? <TrendingUp className="size-3 text-emerald-400" />
            : <TrendingDown className="size-3 text-red-400" />}
          <span className={`text-[11px] font-medium ${trend.value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {Math.abs(trend.value).toFixed(0)}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}

function SpendingBarChart({ data, height = 80 }: { data: MonthlyData[]; height?: number }) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.billed), 1);
  const barW = Math.max(14, Math.floor((280 - (data.length - 1) * 4) / data.length));

  return (
    <div className="overflow-x-auto">
      <svg
        width="100%"
        viewBox={`0 0 ${Math.max(280, data.length * (barW + 4))} ${height + 24}`}
        style={{ minWidth: `${data.length * (barW + 4)}px` }}
      >
        {data.map((d, i) => {
          const x = i * (barW + 4);
          const billedH = Math.max(2, (d.billed / maxVal) * height);
          const paidH   = Math.max(0, (d.paid   / maxVal) * height);
          return (
            <g key={d.key}>
              <rect x={x} y={height - billedH} width={barW} height={billedH} rx={3} fill="rgba(59,130,246,0.15)" />
              {paidH > 0 && (
                <rect x={x} y={height - paidH} width={barW} height={paidH} rx={3} fill="rgba(16,185,129,0.6)" />
              )}
              <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize="10" fill="rgba(148,163,184,0.8)">
                {d.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <div className="text-[12px] text-slate-500 text-center py-4">No data</div>;

  const r = 44, cx = 52, cy = 52;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width="104" height="104" viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
      {slices.map((s, i) => {
        const dash = (s.value / total) * circumference;
        const gap  = circumference - dash;
        const el = (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "52px 52px" }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="rgba(248,250,252,0.9)">
        {slices.length}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.7)">
        cards
      </text>
    </svg>
  );
}

// ─── FIX 1: Heatmap — show all 7 day labels (Tu/Th/Sa are now included) ──────
// Previously only [1,3,5,6] were labeled (M,W,F,S) due to sparse index mapping.
// The heatmap grid rows are: 0=Mon 1=Tue 2=Wed 3=Thu 4=Fri 5=Sat 6=Sun
// (startDate is anchored to a Monday via `getDate() - 7*16 + 1` which can land
// on any weekday, but the inner `d` index 0‥6 represents Mon‥Sun offsets within
// each week column).  We show concise labels every other row to avoid crowding.
function MonthlyHeatmap({ allBills }: { allBills: BillCycle[] }) {
  const payMap: Record<string, number> = {};
  allBills.forEach(bill => {
    (bill.history || []).forEach(h => {
      const dateKey = (h.date || h.ts || "").slice(0, 10);
      if (dateKey) payMap[dateKey] = (payMap[dateKey] || 0) + Number(h.amount || 0);
    });
  });

  const today = new Date();
  const weeks: string[][] = [];
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7 * 16 + 1);

  for (let w = 0; w < 16; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(startDate);
      dt.setDate(startDate.getDate() + w * 7 + d);
      week.push(dt.toISOString().slice(0, 10));
    }
    weeks.push(week);
  }

  const maxPay = Math.max(...Object.values(payMap), 1);
  const cellSize = 13;
  const gap = 2;

  // FIX: Show all 7 day-row labels (Mon–Sun). Only alternate rows to avoid crowding.
  // Row index 0=Mon 1=Tue 2=Wed 3=Thu 4=Fri 5=Sat 6=Sun
  const dayLabels: Record<number, string> = { 0: "M", 1: "T", 2: "W", 3: "T", 4: "F", 5: "S", 6: "S" };

  return (
    <div className="overflow-x-auto">
      <svg
        width="100%"
        viewBox={`0 0 ${16 * (cellSize + gap) + 14} ${7 * (cellSize + gap) + 4}`}
        style={{ minWidth: `${16 * (cellSize + gap) + 14}px` }}
      >
        {/* Day labels for all 7 rows */}
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <text
            key={d}
            x="10"
            y={(d + 0.75) * (cellSize + gap)}
            fontSize="8"
            fill="rgba(148,163,184,0.5)"
            textAnchor="middle"
          >
            {dayLabels[d]}
          </text>
        ))}

        {weeks.map((week, wi) => (
          week.map((dateStr, di) => {
            const x = 14 + wi * (cellSize + gap);
            const y = di * (cellSize + gap);
            const val = payMap[dateStr] || 0;
            const intensity = val > 0 ? clamp(val / maxPay, 0.15, 1) : 0;
            const isToday = dateStr === today.toISOString().slice(0, 10);
            let fill = "rgba(255,255,255,0.04)";
            if (val > 0) {
              const g = Math.round(intensity * 185);
              fill = `rgba(16, ${g}, 129, ${0.3 + intensity * 0.5})`;
            }
            if (isToday) fill = "rgba(59,130,246,0.4)";
            return (
              <rect
                key={dateStr} x={x} y={y} width={cellSize} height={cellSize} rx={2}
                fill={fill} stroke={isToday ? "rgba(59,130,246,0.8)" : "none"} strokeWidth="1"
              />
            );
          })
        ))}
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportsView() {
  const cards        = useVaultStore(s => s.vault.cards);
  const archiveVault = useVaultStore(s => s.archiveVault);
  const archivedBills = archiveVault?.archivedBills || [];

  // FIX 2: Pull deletedCards so we can resolve names for deleted-but-preserved cards
  const deletedCards  = archiveVault?.deletedCards  || [];

  // ── Currency ──────────────────────────────────────────────────────────────
  const { getCurrency } = useCurrencyStore();
  const currency = getCurrency();

  const fmt = (amount: number) => formatWithCurrency(amount, currency);

  const fmtCompact = (amount: number): string => {
    const sym = currency.symbol;
    if (amount >= 100000) return `${sym}${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000)   return `${sym}${(amount / 1000).toFixed(1)}k`;
    return `${sym}${amount.toFixed(0)}`;
  };

  const [selectedCardId, setSelectedCardId] = useState<string | "all">("all");
  const [monthOffset, setMonthOffset] = useState(0);

  // ── Combine all bills ──
  const allBillsFlat = useMemo<BillCycle[]>(() => {
    const active = cards.flatMap(c => c.activeBills || []);
    return [...active, ...archivedBills];
  }, [cards, archivedBills]);

  // ── Card summaries ──
  const cardSummaries = useMemo<CardSummary[]>(() => {
    return cards.map(card => {
      const cardBills = allBillsFlat.filter(b => b.cardId === card.id);
      const totalBilled = cardBills.reduce((s, b) => s + Number(b.billedAmount || 0), 0);
      const totalPaid   = cardBills.reduce((s, b) => s + getPaidTotal(b), 0);
      const allPayDates = cardBills.flatMap(b => (b.history || []).map(h => h.date || h.ts || "")).filter(Boolean);
      const lastActivity = allPayDates.length > 0 ? allPayDates.sort().at(-1) || null : null;
      const paidBills = cardBills.filter(b => computeBillStatus(b) === "paid");
      const avgBill = paidBills.length > 0
        ? paidBills.reduce((s, b) => s + Number(b.billedAmount || 0), 0) / paidBills.length
        : 0;
      let onTimeCount = 0;
      paidBills.forEach(b => {
        const lastPay = (b.history || []).map(h => h.date || h.ts || "").filter(Boolean).sort().at(-1);
        if (lastPay && lastPay <= b.dueDate) onTimeCount++;
      });
      const onTimeRate = paidBills.length > 0 ? (onTimeCount / paidBills.length) * 100 : 100;
      return {
        card, totalBilled, totalPaid,
        totalOutstanding: Math.max(0, totalBilled - totalPaid),
        allBills: cardBills, lastActivity, avgBill, onTimeRate,
      };
    });
  }, [cards, allBillsFlat]);

  // ── Monthly trend ──
  const monthlyData = useMemo<MonthlyData[]>(() => {
    const today = new Date();
    const months: MonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: getMonthLabel(key), shortLabel: MONTHS_SHORT[d.getMonth()], billed: 0, paid: 0, outstanding: 0, count: 0 });
    }
    const billsToUse = selectedCardId === "all" ? allBillsFlat : allBillsFlat.filter(b => b.cardId === selectedCardId);
    billsToUse.forEach(bill => {
      const mk = getMonthKey(bill.statementDate);
      const slot = months.find(m => m.key === mk);
      if (slot) {
        slot.billed += Number(bill.billedAmount || 0);
        slot.paid   += getPaidTotal(bill);
        slot.outstanding += Math.max(0, Number(bill.billedAmount || 0) - getPaidTotal(bill));
        slot.count++;
      }
    });
    return months;
  }, [allBillsFlat, selectedCardId]);

  const selectedMonth = useMemo(() => {
    const idx = monthlyData.length - 1 + monthOffset;
    return monthlyData[Math.max(0, Math.min(monthlyData.length - 1, idx))];
  }, [monthlyData, monthOffset]);

  const prevMonth = monthlyData[Math.max(0, monthlyData.length - 2 + monthOffset)];

  // ── Overall stats ──
  const totalBilled      = useMemo(() => cardSummaries.reduce((s, c) => s + c.totalBilled, 0),      [cardSummaries]);
  const totalPaid        = useMemo(() => cardSummaries.reduce((s, c) => s + c.totalPaid, 0),        [cardSummaries]);
  const totalOutstanding = useMemo(() => cardSummaries.reduce((s, c) => s + c.totalOutstanding, 0), [cardSummaries]);

  const overdueCount = useMemo(
    () => cards.flatMap(c => c.activeBills || [])
      .filter(b => computeBillStatus(b) !== "paid" && getDaysOverdue(b) > 0).length,
    [cards]
  );

  const thisMonthBilled = monthlyData.at(-1)?.billed || 0;
  const lastMonthBilled = monthlyData.at(-2)?.billed || 0;
  const billedTrend = lastMonthBilled > 0 ? ((thisMonthBilled - lastMonthBilled) / lastMonthBilled) * 100 : 0;

  const last6 = monthlyData.slice(-6).filter(m => m.billed > 0);
  const avgMonthlyBilled = last6.length > 0 ? last6.reduce((s, m) => s + m.billed, 0) / last6.length : 0;

  const donutSlices = useMemo(() => {
    const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];
    return cardSummaries
      .filter(c => c.totalBilled > 0)
      .map((c, i) => ({ label: c.card.name, value: c.totalBilled, color: COLORS[i % COLORS.length] }));
  }, [cardSummaries]);

  // ── Excel Export ──
  function handleExport() {
    const wb = XLSX.utils.book_new();
    const currencyNote = `Currency: ${currency.code} (${currency.symbol})`;

    const summaryRows: (string | number)[][] = [
      ["Duely — Financial Summary Export"],
      ["Generated:", new Date().toLocaleString("en-IN")],
      [currencyNote],
      [],
      ["Card Name", `Total Billed (${currency.code})`, `Total Paid (${currency.code})`, `Outstanding (${currency.code})`, "Avg Bill", "On-Time Rate"],
    ];
    cardSummaries.forEach(c => {
      summaryRows.push([c.card.name, c.totalBilled, c.totalPaid, c.totalOutstanding, c.avgBill.toFixed(0), `${c.onTimeRate.toFixed(0)}%`]);
    });
    summaryRows.push([]);
    summaryRows.push(["Grand Total", totalBilled, totalPaid, totalOutstanding, "", ""]);
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const trendRows: (string | number)[][] = [["Month", `Billed (${currency.code})`, `Paid (${currency.code})`, `Outstanding (${currency.code})`, "Bill Count"]];
    monthlyData.forEach(m => trendRows.push([m.label, m.billed, m.paid, m.outstanding, m.count]));
    const wsTrend = XLSX.utils.aoa_to_sheet(trendRows);
    wsTrend["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsTrend, "Monthly Trend");

    const txRows: (string | number)[][] = [["Date", "Card", "Bill Statement Date", `Amount Paid (${currency.code})`, "Note"]];
    allBillsFlat.forEach(bill => {
      const card = cards.find(c => c.id === bill.cardId);
      // FIX 2 (export): also check deletedCards for the card name
      const cardName = card?.name
        ?? deletedCards.find(dc => dc.id === bill.cardId)?.name
        ?? bill.cardId;
      (bill.history || []).forEach(h => {
        txRows.push([h.date || h.ts?.slice(0, 10) || "", cardName, bill.statementDate, Number(h.amount || 0), h.note || ""]);
      });
    });
    txRows.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
    const wsTx = XLSX.utils.aoa_to_sheet(txRows);
    wsTx["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsTx, "All Transactions");

    XLSX.writeFile(wb, `Duely_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ── Recent transactions ──
  // FIX 2: Resolve card name from active cards first, then deleted cards (preserved
  // history). If card was deleted with "Delete All" (no history kept), bills for
  // that cardId won't exist in archivedBills so they'll never surface here.
  const recentTransactions = useMemo(() => {
    const all: { date: string; cardName: string; amount: number; note: string; billDate: string }[] = [];
    allBillsFlat.forEach(bill => {
      // 1. Try active cards
      const activeCard = cards.find(c => c.id === bill.cardId);
      // 2. Try preserved deleted cards
      const deletedCard = !activeCard
        ? deletedCards.find(dc => dc.id === bill.cardId)
        : undefined;

      const cardName = activeCard?.name ?? deletedCard?.name ?? null;

      // If no name can be resolved at all, skip — card was fully purged
      if (!cardName) return;

      (bill.history || []).forEach(h => {
        all.push({
          date: h.date || (h.ts || "").slice(0, 10),
          cardName,
          amount: Number(h.amount || 0),
          note: h.note || "",
          billDate: bill.statementDate,
        });
      });
    });
    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }, [allBillsFlat, cards, deletedCards]);

  // ── Insights (fully dynamic — no static content) ──
  const insights = useMemo(() => {
    const list: { type: "warn" | "good" | "info"; text: string }[] = [];
    if (overdueCount > 0)
      list.push({ type: "warn", text: `${overdueCount} bill${overdueCount > 1 ? "s are" : " is"} overdue — pay now to avoid late fees` });
    const highOutstanding = cardSummaries.filter(c => c.totalOutstanding > 5000);
    if (highOutstanding.length > 0)
      list.push({ type: "warn", text: `High outstanding on ${highOutstanding.map(c => c.card.name).join(", ")}` });
    const lowOnTime = cardSummaries.filter(c => c.onTimeRate < 70 && c.allBills.length >= 2);
    if (lowOnTime.length > 0)
      list.push({ type: "warn", text: `Late payments on ${lowOnTime.map(c => c.card.name).join(", ")} — consider setting reminders` });
    if (billedTrend > 20)
      list.push({ type: "warn", text: `Spending up ${billedTrend.toFixed(0)}% vs last month — watch your usage` });
    if (billedTrend < -15 && billedTrend !== 0)
      list.push({ type: "good", text: `Spending down ${Math.abs(billedTrend).toFixed(0)}% vs last month — great progress!` });
    if (totalOutstanding === 0 && totalBilled > 0)
      list.push({ type: "good", text: "All bills fully paid — excellent track record!" });
    const allOnTime = cardSummaries.every(c => c.onTimeRate >= 90);
    if (allOnTime && cards.length > 0)
      list.push({ type: "good", text: "90%+ on-time payment rate across all cards" });
    if (list.length === 0)
      list.push({ type: "info", text: "Keep logging bills and payments for personalized insights" });
    return list.slice(0, 4);
  }, [cardSummaries, overdueCount, totalOutstanding, totalBilled, billedTrend, cards]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
        <BarChart2 className="size-12 text-slate-600 mb-4" />
        <p className="text-slate-400 font-medium">No data yet</p>
        <p className="text-slate-500 text-[13px] mt-1">Add cards and log bills to see insights here</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Analytics</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">All {cards.length} card{cards.length !== 1 ? "s" : ""} · {allBillsFlat.length} statements tracked</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-[12px] font-medium text-slate-300 bg-[#111827] border border-white/10 rounded-[10px] px-3 py-2 hover:bg-white/5 transition-colors"
        >
          <Download className="size-3.5" /> Export Excel
        </button>
      </div>

      {/* ── Top KPIs ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total billed"
          value={fmt(totalBilled)}
          sub={`avg ${fmtCompact(avgMonthlyBilled)}/mo`}
          color="blue"
          icon={CreditCardIcon}
          trend={billedTrend !== 0 ? { value: billedTrend, label: "vs last month" } : undefined}
        />
        <StatCard
          label="Total paid"
          value={fmt(totalPaid)}
          sub={totalBilled > 0 ? `${((totalPaid / totalBilled) * 100).toFixed(0)}% cleared` : undefined}
          color="green"
          icon={CheckCircle2}
        />
        <StatCard
          label="Outstanding"
          value={fmt(totalOutstanding)}
          sub={totalOutstanding > 0 ? `across ${cardSummaries.filter(c => c.totalOutstanding > 0).length} card(s)` : "fully cleared"}
          color={totalOutstanding > 0 ? "red" : "green"}
          icon={AlertCircle}
        />
        <StatCard
          label="Overdue bills"
          value={String(overdueCount)}
          sub={overdueCount > 0 ? "needs immediate attention" : "all on schedule"}
          color={overdueCount > 0 ? "amber" : "green"}
          icon={Clock}
        />
      </div>

      {/* ── Insights ── */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="size-3.5 text-amber-400" />
          <p className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider">Smart insights</p>
        </div>
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`mt-1 size-1.5 rounded-full shrink-0 ${ins.type === "warn" ? "bg-amber-400" : ins.type === "good" ? "bg-emerald-400" : "bg-blue-400"}`} />
              <p className={`text-[12px] leading-relaxed ${ins.type === "warn" ? "text-amber-300/90" : ins.type === "good" ? "text-emerald-300/90" : "text-slate-400"}`}>
                {ins.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Monthly Trend Chart ── */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider">12-month trend</p>
          <select
            value={selectedCardId}
            onChange={e => setSelectedCardId(e.target.value)}
            className="text-[11px] bg-[#1a2234] border border-white/10 rounded-[8px] px-2 py-1 text-slate-300 outline-none"
          >
            <option value="all">All cards</option>
            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-sm bg-blue-500/40" />
            <span className="text-[10px] text-slate-500">Billed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-sm bg-emerald-500/60" />
            <span className="text-[10px] text-slate-500">Paid</span>
          </div>
        </div>

        <SpendingBarChart data={monthlyData} height={72} />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <button
            onClick={() => setMonthOffset(o => Math.max(o - 1, -(monthlyData.length - 1)))}
            disabled={monthOffset <= -(monthlyData.length - 1)}
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="text-center">
            <p className="text-[13px] font-semibold text-white">{selectedMonth?.label || "—"}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {selectedMonth ? `${fmt(selectedMonth.billed)} billed · ${fmt(selectedMonth.paid)} paid` : ""}
            </p>
            {selectedMonth && prevMonth && prevMonth.billed > 0 && (
              <p className={`text-[10px] mt-0.5 ${selectedMonth.billed > prevMonth.billed ? "text-red-400" : "text-emerald-400"}`}>
                {selectedMonth.billed > prevMonth.billed ? "▲" : "▼"}{" "}
                {Math.abs(((selectedMonth.billed - prevMonth.billed) / prevMonth.billed) * 100).toFixed(0)}% vs prior month
              </p>
            )}
          </div>

          <button
            onClick={() => setMonthOffset(o => Math.min(o + 1, 0))}
            disabled={monthOffset >= 0}
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Card Breakdown ── */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
        <div className="flex items-center gap-3 mb-4">
          <DonutChart slices={donutSlices} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider mb-2">Spend distribution</p>
            <div className="space-y-1.5">
              {donutSlices.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="size-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <p className="text-[11px] text-slate-400 truncate flex-1">{s.label}</p>
                  <p className="text-[11px] font-medium text-slate-300 shrink-0">
                    {totalBilled > 0 ? `${((s.value / totalBilled) * 100).toFixed(0)}%` : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/5 pt-3">
          {cardSummaries.map(cs => {
            const pct = cs.totalBilled > 0 ? (cs.totalPaid / cs.totalBilled) * 100 : 0;
            const isDisabled = cs.card.disabled;
            return (
              <div key={cs.card.id} className={`${isDisabled ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-[13px] font-medium text-white truncate">{cs.card.name}</p>
                    {isDisabled && (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold uppercase shrink-0">off</span>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[12px] font-semibold text-white">{fmt(cs.totalBilled)}</p>
                    <p className="text-[10px] text-slate-500">{cs.allBills.length} stmt{cs.allBills.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${clamp(pct, 0, 100)}%`, background: pct >= 100 ? "#10b981" : pct > 50 ? "#f59e0b" : "#ef4444" }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-slate-500">
                    paid {fmt(cs.totalPaid)}
                    {cs.totalOutstanding > 0 && <span className="text-red-400/80"> · owe {fmt(cs.totalOutstanding)}</span>}
                  </p>
                  <p className="text-[10px] text-slate-500">avg {fmtCompact(cs.avgBill)}/bill</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Payment Heatmap ── */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
        <p className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Payment activity</p>
        <p className="text-[11px] text-slate-500 mb-3">Last 16 weeks · each cell = one day</p>
        <MonthlyHeatmap allBills={allBillsFlat} />
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[10px] text-slate-600">Less</span>
          {[0.04, 0.2, 0.45, 0.65, 0.9].map((o, i) => (
            <div key={i} className="size-2.5 rounded-sm" style={{ background: `rgba(16,185,129,${o})` }} />
          ))}
          <span className="text-[10px] text-slate-600">More</span>
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      {recentTransactions.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
          <p className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider mb-3">Recent payments</p>
          <div className="space-y-1">
            {recentTransactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-[13px] text-white font-medium truncate">{tx.cardName}</p>
                  <p className="text-[11px] text-slate-500">
                    {tx.date ? new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                    {tx.note ? ` · ${tx.note}` : ""}
                  </p>
                </div>
                <p className="text-[13px] font-semibold text-emerald-400 shrink-0">{fmt(tx.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── On-Time Rate Per Card ── */}
      {cardSummaries.some(c => c.allBills.length >= 2) && (
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
          <p className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider mb-3">On-time payment rate</p>
          <div className="space-y-3">
            {cardSummaries
              .filter(c => c.allBills.length >= 1)
              .sort((a, b) => b.onTimeRate - a.onTimeRate)
              .map(cs => (
                <div key={cs.card.id} className="flex items-center gap-3">
                  <p className="text-[12px] text-slate-300 w-28 truncate shrink-0">{cs.card.name}</p>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cs.onTimeRate}%`, background: cs.onTimeRate >= 90 ? "#10b981" : cs.onTimeRate >= 70 ? "#f59e0b" : "#ef4444" }}
                    />
                  </div>
                  <p className={`text-[12px] font-semibold w-10 text-right shrink-0 ${cs.onTimeRate >= 90 ? "text-emerald-400" : cs.onTimeRate >= 70 ? "text-amber-400" : "text-red-400"}`}>
                    {cs.onTimeRate.toFixed(0)}%
                  </p>
                </div>
              ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-3">Based on fully paid statements — payment date vs due date</p>
        </div>
      )}

    </div>
  );
}