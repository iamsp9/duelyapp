// src/lib/engine/cards.ts
import type { CreditCard, PaymentStatus } from "@/types/card";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function calculateDueDay(billDay: number, dueAfterDays: number) {
  const total = billDay + dueAfterDays;
  return total > 30 ? total - 30 : total;
}

export function formatCurrency(amount: number | string) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function getDueDate(card: CreditCard) {
  const today = new Date();
  let m = today.getMonth();
  let y = today.getFullYear();
  if ((card.dueDay || 0) <= (card.billDay || 0)) {
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return new Date(y, m, card.dueDay || 0);
}

export function getDTD(card: CreditCard) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = getDueDate(card).getTime() - todayStart.getTime();
  return Math.ceil(diff / 86400000);
}

export function isActive(card: CreditCard) {
  const today = new Date().getDate();
  return today >= (card.billDay || 0);
}

export function getPaidTotal(card: CreditCard) {
  return (card.history || []).reduce((sum, h) => sum + Number(h.amount || 0), 0);
}

export function getOutstanding(card: CreditCard) {
  const bill = Number(card.totalBill || 0);
  const paid = getPaidTotal(card);
  return Math.max(0, bill - paid);
}

export function computeStatus(card: CreditCard): PaymentStatus {
  if (card.statusOverride) return card.statusOverride as PaymentStatus;
  
  const bill = Number(card.totalBill || 0);
  const total = getPaidTotal(card);

  // FIXED: Removed the invalid `!== null` check as it violates the interface type bounds
  if (card.totalBill !== '' && bill <= 0) return 'paid';
  if (bill > 0 && total >= bill) return 'paid';
  if (total > 0) return 'partial';
  return 'unpaid';
}

// Exact Vanilla Sorting Translators
export function sortByDue(list: CreditCard[]) {
  return list.slice().sort((a, b) => getDTD(a) - getDTD(b));
}

export function sortByPriority(list: CreditCard[]) {
  return list.slice().sort((a, b) => {
    const paidA = computeStatus(a) === 'paid';
    const paidB = computeStatus(b) === 'paid';
    if (paidA !== paidB) return paidA ? 1 : -1;
    return getDTD(a) - getDTD(b);
  });
}

export function sortByBillDate(list: CreditCard[]) {
  return list.slice().sort((a, b) => {
    const todayDay = new Date().getDate();
    const da = (a.billDay || 0) >= todayDay ? (a.billDay || 0) : (a.billDay || 0) + 31;
    const db = (b.billDay || 0) >= todayDay ? (b.billDay || 0) : (b.billDay || 0) + 31;
    return da - db;
  });
}

export function getDueBadge(card: CreditCard, active: boolean) {
  if (!active) return { text: `Bill ${card.billDay}th`, classes: 'bg-gray-800 text-gray-400' };
  
  const d = getDTD(card);
  const due = getDueDate(card);
  const today = new Date();
  const ds = due.getDate() + (due.getMonth() !== today.getMonth() ? ' ' + MONTHS[due.getMonth()] : '');
  
  if (computeStatus(card) === 'paid') return { text: `Paid (Due ${ds})`, classes: 'bg-green-900/30 text-green-400' };
  if (d < 0) return { text: `Overdue ${Math.abs(d)}d`, classes: 'bg-red-900/30 text-red-400' };
  if (d === 0) return { text: `Due today`, classes: 'bg-red-900/30 text-red-400' };
  if (d <= 2) return { text: `Due in ${d}d`, classes: 'bg-red-900/30 text-red-400' };
  if (d <= 5) return { text: `Due in ${d}d`, classes: 'bg-orange-900/30 text-orange-400' };
  if (d <= 7) return { text: `Due ${ds}`, classes: 'bg-yellow-900/30 text-yellow-400' };
  
  return { text: `Due ${ds}`, classes: 'bg-green-900/30 text-green-400' };
}

export function getGlowClass(card: CreditCard, active: boolean) {
  if (!active || computeStatus(card) === 'paid') return 'border-white/10';
  const d = getDTD(card);
  if (d < 0 || d <= 2) return 'border-red-500/80 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]';
  if (d <= 5) return 'border-orange-500/80 shadow-[0_0_0_3px_rgba(249,115,22,0.1)]';
  if (d <= 7) return 'border-yellow-500/80 shadow-[0_0_0_3px_rgba(234,179,8,0.1)]';
  return 'border-white/10';
}

export function getSummary(cards: CreditCard[]) {
  const active = cards.filter(isActive);
  
  let billed = 0;
  let paid = 0;
  
  active.forEach(c => {
    billed += Number(c.totalBill || 0);
    paid += getPaidTotal(c);
  });
  
  const outstanding = Math.max(0, billed - paid);
  const progress = billed > 0 ? Math.round((paid / billed) * 100) : 0;

  return {
    billed,
    paid,
    outstanding,
    progress
  };
}