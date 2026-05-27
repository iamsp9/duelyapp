export type PaymentStatus = "unpaid" | "partial" | "paid";
 
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
 
  totalBill: number | string; // Supports empty string like the vanilla input
  paidAmount?: number;
  outstandingAmount?: number;
 
  status: PaymentStatus;
  statusOverride?: PaymentStatus;
 
  notes?: string;
  history?: PaymentHistoryItem[];
  payments?: any[]; // Keep for backwards compatibility if needed
 
  disabled?: boolean;
}
 
export interface ArchivedCard {
  id: string;
  name: string;
  archivedAt: string;
  history: PaymentHistoryItem[];
}
 