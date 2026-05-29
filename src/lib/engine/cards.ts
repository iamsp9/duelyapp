// src/lib/engine/cards.ts
import type { CreditCard, BillCycle, PaymentStatus, BillingFrequency } from "@/types/card";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// --- CALENDAR & DATE MATH ---

export function getExactDueDate(statementDate: Date, dueAfterDays: number): Date {
  const due = new Date(statementDate);
  due.setDate(due.getDate() + dueAfterDays);
  return due;
}

export function formatCurrency(amount: number | string) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

// --- BILL ID GENERATION ---
//
// Format: <cardId>-<YYYYMMDD>-<BASE36_TIMESTAMP><4_RAND_CHARS>
//
// Examples:
//   c-hdfc-20260513-M5X3KAB2
//   c-idfc-20260509-M5X1JC7F
//
// The base-36 millisecond timestamp ensures IDs generated even in the same
// second are highly unlikely to collide; the 4 random chars add an extra
// ~1.6 million combinations on top.
//
function genBillId(cardId: string, dateStr: string): string {
  const datePart = dateStr.replace(/-/g, "");                         // YYYYMMDD
  const tsPart   = Date.now().toString(36).toUpperCase();              // e.g. "M5X3K"
  const randPart = Math.random().toString(36).slice(2, 6).toUpperCase(); // e.g. "AB2F"
  return `${cardId}-${datePart}-${tsPart}${randPart}`;
}

// --- BILL CYCLE LOGIC ---

export function getNextExpectedBillDate(card: CreditCard): Date {
  const lastBill = card.activeBills?.length > 0 
    ? new Date(card.activeBills[card.activeBills.length - 1].statementDate)
    : new Date(new Date().getFullYear(), new Date().getMonth() - 1, card.billDay);

  const freq = card.billingFrequency || { type: 'monthly' };
  const next = new Date(lastBill);

  if (freq.type === 'every_x_months') {
    next.setMonth(next.getMonth() + (freq.value || 2));
  } else if (freq.type === 'every_x_days') {
    next.setDate(next.getDate() + (freq.value || 30));
  } else {
    // Default Monthly
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export function spawnMissingBills(card: CreditCard): CreditCard {
  if (card.disabled) return card;

  const today = new Date();
  const nextExpected = getNextExpectedBillDate(card);
  
  // Only spawn if today is >= the expected date and it hasn't been spawned yet
  if (today < nextExpected) return card;

  const dateStr = nextExpected.toISOString().split('T')[0];
  const billExists = card.activeBills?.some(b => b.statementDate === dateStr);
  
  if (!billExists) {
    const dueDate = getExactDueDate(nextExpected, card.dueAfterDays);
    const newBill: BillCycle = {
      id: genBillId(card.id, dateStr),
      cardId: card.id,
      statementDate: dateStr,
      dueDate: dueDate.toISOString().split('T')[0],
      billedAmount: "",
      paidAmount: 0,
      status: "unpaid",
      history: []
    };
    
    return { ...card, activeBills: [...(card.activeBills || []), newBill] };
  }
  return card;
}

export function getPaidTotal(bill: BillCycle) {
  return (bill.history || []).reduce((sum, h) => sum + Number(h.amount || 0), 0);
}

export function getOutstanding(bill: BillCycle) {
  const billed = Number(bill.billedAmount || 0);
  const paid = getPaidTotal(bill);
  return Math.max(0, billed - paid);
}

export function computeBillStatus(bill: BillCycle): PaymentStatus {
  const billed = Number(bill.billedAmount || 0);
  const totalPaid = getPaidTotal(bill);

  // If user hasn't entered a bill amount yet (it's empty), it's not paid
  if (bill.billedAmount === "" || bill.billedAmount === null) return 'unpaid';
  
  if (billed > 0 && totalPaid >= billed) return 'paid';
  if (totalPaid > 0) return 'partial';
  return 'unpaid';
}

/**
 * Identifies which bills are fully paid and ready to be moved to the Archive Vault.
 */
export function extractArchivableBills(card: CreditCard): { 
  updatedCard: CreditCard, 
  billsToArchive: BillCycle[] 
} {
  const activeBills: BillCycle[] = [];
  const billsToArchive: BillCycle[] = [];

  (card.activeBills || []).forEach(bill => {
    // A bill is only archived if it has a billed amount AND is fully paid
    if (bill.billedAmount !== "" && computeBillStatus(bill) === 'paid') {
      billsToArchive.push({ ...bill, isArchived: true });
    } else {
      activeBills.push(bill);
    }
  });

  return {
    updatedCard: { ...card, activeBills },
    billsToArchive
  };
}

// --- UI HELPERS ---

export function getDTD(bill: BillCycle) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = new Date(bill.dueDate);
  const diff = dueDate.getTime() - todayStart.getTime();
  return Math.ceil(diff / 86400000);
}

export function getDueBadge(bill: BillCycle) {
  const d = getDTD(bill);
  const due = new Date(bill.dueDate);
  const ds = `${due.getDate()} ${MONTHS[due.getMonth()]}`;
  
  if (computeBillStatus(bill) === 'paid') return { text: `Paid (Due ${ds})`, classes: 'bg-green-900/30 text-green-400' };
  
  if (bill.billedAmount === "") return { text: `Statement Generated`, classes: 'bg-blue-900/30 text-blue-400' }; // Prompt for input
  
  if (d < 0) return { text: `Overdue ${Math.abs(d)}d`, classes: 'bg-red-900/30 text-red-400 font-bold' };
  if (d === 0) return { text: `Due today`, classes: 'bg-red-900/30 text-red-400 font-bold' };
  if (d <= 2) return { text: `Due in ${d}d`, classes: 'bg-red-900/30 text-red-400' };
  if (d <= 5) return { text: `Due in ${d}d`, classes: 'bg-orange-900/30 text-orange-400' };
  if (d <= 7) return { text: `Due ${ds}`, classes: 'bg-yellow-900/30 text-yellow-400' };
  
  return { text: `Due ${ds}`, classes: 'bg-green-900/30 text-green-400' };
}

export function getSummary(cards: CreditCard[]) {
  let billed = 0;
  let paid = 0;
  
  (cards || []).forEach(card => {
    // Only count bills for active (non-disabled) cards
    if (!card.disabled) {
      (card.activeBills || []).forEach(bill => {
        billed += Number(bill.billedAmount || 0);
        paid += getPaidTotal(bill);
      });
    }
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
/**
 * Calculates the exact next calendar billing date for a credit card.
 */
export function getNextBillDate(card: CreditCard): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Create a billing target for the current month
  const thisMonthBill = new Date(currentYear, currentMonth, card.billDay);
  
  if (thisMonthBill > today) {
    return thisMonthBill;
  }
  
  // If the billing day passed, the next bill is next month
  return new Date(currentYear, currentMonth + 1, card.billDay);
}

// Legacy compatibility alias (used in dashboard.ts)
export function isActive(card: CreditCard): boolean {
  return !card.disabled;
}

export function computeStatus(card: CreditCard): PaymentStatus {
  const allBills = card.activeBills || [];
  if (allBills.length === 0) return 'paid';
  const unpaid = allBills.find(b => computeBillStatus(b) !== 'paid');
  return unpaid ? computeBillStatus(unpaid) : 'paid';
}

export function sortByDue(cards: CreditCard[]): CreditCard[] {
  return [...cards].sort((a, b) => {
    const aDate = a.activeBills?.[0]?.dueDate ?? '';
    const bDate = b.activeBills?.[0]?.dueDate ?? '';
    return aDate.localeCompare(bDate);
  });
}