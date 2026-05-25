import type {
  Bill,
} from "@/types/cards";

export function getBillStatus(
  bill: Bill
) {
  if (
    bill.paidAmount <= 0
  ) {
    return "unpaid";
  }

  if (
    bill.paidAmount >=
    bill.amount
  ) {
    return "paid";
  }

  return "partial";
}

export function getOutstandingAmount(
  bill: Bill
) {
  return Math.max(
    bill.amount -
      bill.paidAmount,
    0
  );
}