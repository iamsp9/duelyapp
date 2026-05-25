import type {
  CreditCard,
  PaymentStatus,
} from "@/types/card";

export function calculateDueDay(
  billDay: number,
  dueAfterDays: number
) {
  const total =
    billDay +
    dueAfterDays;

  return total > 30
    ? total - 30
    : total;
}

export function formatCurrency(
  amount: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(amount || 0);
}

export function getCurrentCycleCards(
  cards: CreditCard[]
) {
  const today =
    new Date().getDate();

  return cards.filter(
    (card) => {
      const due =
        card.dueDay || 0;

      return (
        today <= due + 5
      );
    }
  );
}

export function getUpcomingCards(
  cards: CreditCard[]
) {
  const today =
    new Date().getDate();

  return cards.filter(
    (card) => {
      const bill =
        card.billDay || 0;

      return bill > today;
    }
  );
}

export function getPaidTotal(
  card: CreditCard
) {
  if (
    card.paidAmount !==
    undefined
  ) {
    return Number(
      card.paidAmount || 0
    );
  }

  return (
    card.payments || []
  ).reduce(
    (sum, payment) =>
      sum +
      Number(
        payment.amount || 0
      ),
    0
  );
}

export function getOutstanding(
  card: CreditCard
) {
  const bill =
    Number(
      card.totalBill || 0
    );

  const paid =
    getPaidTotal(card);

  return Math.max(
    0,
    bill - paid
  );
}

export function getProgress(
  card: CreditCard
) {
  const bill =
    Number(
      card.totalBill || 0
    );

  if (bill <= 0) {
    return 0;
  }

  const paid =
    getPaidTotal(card);

  return Math.min(
    100,
    Math.round(
      (paid / bill) *
        100
    )
  );
}

export function computeStatus(
  card: CreditCard
): PaymentStatus {
  const bill =
    Number(
      card.totalBill || 0
    );

  if (bill <= 0) {
    return "unpaid";
  }

  const outstanding =
    getOutstanding(card);

  if (
    outstanding === 0
  ) {
    return "paid";
  }

  const paid =
    getPaidTotal(card);

  if (paid > 0) {
    return "partial";
  }

  return "unpaid";
}