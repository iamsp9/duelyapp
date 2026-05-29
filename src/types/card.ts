// src/types/card.ts
export type PaymentStatus = "unpaid" | "partial" | "paid";

export type BillingFrequencyType = "monthly" | "every_x_months" | "every_x_days";

export interface BillingFrequency {
  type: BillingFrequencyType;
  value?: number;
}

export interface PaymentHistoryItem {
  id: string; // Unique ID for the payment
  amount: number;
  note?: string;
  date: string; // ISO string when payment was made
  ts: string; // timestamp
}

// NEW: Statement-centric Bill Cycle
export interface BillCycle {
  id: string; // Format: <CARD_ID>-<YYYYMMDD>
  cardId: string;
  statementDate: string; // The generated bill date (e.g., 2026-05-13)
  dueDate: string; // The exact calculated due date (e.g., 2026-06-02)
  
  billedAmount: number | string; // User inputs this when prompted
  paidAmount: number;
  
  status: PaymentStatus;
  history: PaymentHistoryItem[];
  
  isArchived?: boolean; // If true, it gets moved to the archive vault
}

export interface CreditCard {
  id: string;
  name: string;
  billDay: number;
  dueAfterDays: number;
  billingFrequency?: BillingFrequency;
  
  disabled?: boolean;
  disabledAt?: string;

  // REPLACED: No more flat totalBill or history here. 
  // All active and overdue bills live in this array.
  activeBills: BillCycle[]; 
  
  notes?: string;
}

// For the Archive Vault decrypted payload
export interface ArchiveVaultData {
  archivedBills: BillCycle[];
}