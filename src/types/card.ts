export type PaymentStatus =
  | "unpaid"
  | "partial"
  | "paid";

export interface Payment {
  id: string;

  amount: number;

  note?: string;

  createdAt: string;
}

export interface CreditCard {
  id: string;

  name: string;

  billDay: number;

  dueAfterDays: number;

  dueDay: number;

  totalBill: number;

  paidAmount: number;

  outstandingAmount: number;

  status: PaymentStatus;

  payments: Payment[];
}