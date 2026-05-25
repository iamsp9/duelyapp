import type {
  CreditCard,
  Payment,
} from "@/types/cards";

export function getTotalLimit(
  cards: CreditCard[]
) {
  return cards.reduce(
    (sum, card) =>
      sum + card.limit,
    0
  );
}

export function getTotalPaid(
  payments: Payment[]
) {
  return payments.reduce(
    (sum, payment) =>
      sum + payment.amount,
    0
  );
}

export function getUpcomingDueCards(
  cards: CreditCard[]
) {
  const today = new Date().getDate();

  return cards.filter(
    (card) =>
      card.dueDay >= today
  );
}