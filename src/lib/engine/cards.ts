import { Card } from "@/types/card";

const today = new Date();

const curDay = today.getDate();

const curMonth = today.getMonth();

const curYear = today.getFullYear();

export function getDueDate(card: Card) {
  let month = curMonth;
  let year = curYear;

  if (card.dueDay <= card.billDay) {
    month++;

    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return new Date(
    year,
    month,
    card.dueDay
  );
}

export function getDTD(card: Card) {
  return Math.ceil(
    (
      getDueDate(card).getTime() -
      today.getTime()
    ) / 86400000
  );
}

export function isActive(card: Card) {
  return curDay >= card.billDay;
}

export function histTotal(card: Card) {
  if (!card.history) {
    return 0;
  }

  return card.history
    .filter((h) => h.amount)
    .reduce(
      (sum, h) =>
        sum + (Number(h.amount) || 0),
      0
    );
}

export function computeStatus(
  card: Card
) {
  if (card.statusOverride) {
    return card.statusOverride;
  }

  const bill =
    Number(card.totalBill) || 0;

  const total = histTotal(card);

  if (
    card.totalBill !== "" &&
    bill === 0
  ) {
    return "paid";
  }

  if (bill > 0 && total >= bill) {
    return "paid";
  }

  if (total > 0) {
    return "partial";
  }

  return "unpaid";
}

export function sortByDue(
  list: Card[]
) {
  return [...list].sort(
    (a, b) => getDTD(a) - getDTD(b)
  );
}

export function sortByPriority(
  list: Card[]
) {
  return [...list].sort((a, b) => {
    const paidA =
      computeStatus(a) === "paid";

    const paidB =
      computeStatus(b) === "paid";

    if (paidA !== paidB) {
      return paidA ? 1 : -1;
    }

    return getDTD(a) - getDTD(b);
  });
}

export function sortByBillDate(
  list: Card[]
) {
  return [...list].sort((a, b) => {
    const da =
      a.billDay >= curDay
        ? a.billDay
        : a.billDay + 31;

    const db =
      b.billDay >= curDay
        ? b.billDay
        : b.billDay + 31;

    return da - db;
  });
}

export function getDueBadge(
  card: Card
) {
  const active = isActive(card);

  if (!active) {
    return `Bill ${card.billDay}th`;
  }

  const d = getDTD(card);

  if (
    computeStatus(card) === "paid"
  ) {
    return "Paid";
  }

  if (d < 0) {
    return `Overdue ${Math.abs(d)}d`;
  }

  if (d === 0) {
    return "Due today";
  }

  if (d <= 7) {
    return `Due in ${d}d`;
  }

  return `Due ${card.dueDay}`;
}