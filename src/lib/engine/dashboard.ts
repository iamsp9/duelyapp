import type {
  CreditCard,
} from "@/types/card";

export function isCardActive(
  card: CreditCard
) {
  const today =
    new Date().getDate();

  return (
    today >= card.billDay
  );
}

export function getDashboardCards(
  cards: CreditCard[]
) {
  return cards
    .filter(isCardActive)
    .filter(
      (card) =>
        card.status !==
        "paid"
    )
    .sort(
      (a, b) =>
        a.dueDay -
        b.dueDay
    );
}