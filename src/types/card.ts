export type PaymentStatus = "unpaid" | "partial" | "paid";

export type BillingFrequencyType = "monthly" | "every_x_months" | "every_x_days";

export interface BillingFrequency {
  type: BillingFrequencyType;
  value?: number; // x for every_x_months or every_x_days
}

export interface PaymentHistoryItem {
  amount?: number;
  note?: string;
  date?: string;
  ts?: string;
  text?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  billDay: number;
  dueAfterDays: number;
  dueDay: number;

  billingFrequency?: BillingFrequency; // NEW: billing frequency config

  totalBill: number | string; // Supports empty string like the vanilla input
  paidAmount?: number;
  outstandingAmount?: number;

  status: PaymentStatus;
  statusOverride?: PaymentStatus;

  notes?: string;
  history?: PaymentHistoryItem[];
  payments?: any[]; // Keep for backwards compatibility if needed

  disabled?: boolean;
  disabledAt?: string; // ISO timestamp when card was disabled

  // Track when current cycle bill was set (for pre-disable preservation)
  currentCycleBillSetAt?: string;
}

export interface ArchivedCard {
  id: string;
  name: string;
  archivedAt: string;
  history: PaymentHistoryItem[];
  totalBilled?: number; // total billed across lifetime
  billingFrequency?: BillingFrequency;
}