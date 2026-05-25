export interface CreditCard {
  id: string;

  bank: string;

  name: string;

  last4: string;

  limit: number;

  billGenerationDay: number;

  dueAfterDays: number;

  createdAt: string;
}

export type BillStatus =
  | "unpaid"
  | "partial"
  | "paid";

export interface Bill {
  id: string;

  cardId: string;

  cycleMonth: number;

  cycleYear: number;

  amount: number;

  paidAmount: number;

  dueDate: string;

  status: BillStatus;

  notes?: string;

  createdAt: string;
}

export interface Payment {
  id: string;

  billId: string;

  amount: number;

  paidAt: string;

  note?: string;
}

export interface VaultData {
  version: number;

  cards: CreditCard[];

  bills: Bill[];

  payments: Payment[];
}