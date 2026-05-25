import type {
  Bill,
  CreditCard,
} from "@/types/cards";

export function getCurrentCycleBill(
  card: CreditCard,
  bills: Bill[]
) {
  const now = new Date();

  const month =
    now.getMonth();

  const year =
    now.getFullYear();

  return bills.find(
    (bill) =>
      bill.cardId === card.id &&
      bill.cycleMonth === month &&
      bill.cycleYear === year
  );
}

export function generateCurrentCycleBill(
  card: CreditCard
): Bill {
  const now = new Date();

  const dueDate =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      card.billGenerationDay +
        card.dueAfterDays
    );

  return {
    id: crypto.randomUUID(),

    cardId: card.id,

    cycleMonth:
      now.getMonth(),

    cycleYear:
      now.getFullYear(),

    amount: 0,

    paidAmount: 0,

    dueDate:
      dueDate.toISOString(),

    status: "unpaid",

    createdAt:
      now.toISOString(),
  };
}