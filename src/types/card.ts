export type PaymentHistory = {
  amount?: number;
  note?: string;
  date?: string;
  text?: string;
  ts: string;
};

export type CardStatus =
  | "paid"
  | "partial"
  | "unpaid";

export type Card = {
  id: string;

  name: string;

  billDay: number;

  dueDay: number;

  totalBill: string;

  status?: CardStatus;

  statusOverride?: CardStatus;

  notes?: string;

  history: PaymentHistory[];
};