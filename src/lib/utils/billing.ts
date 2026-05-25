import type {
  CreditCard,
} from "@/types/cards";

export function getNextBillDate(
  card: CreditCard
) {
  const now = new Date();

  const currentMonth =
    now.getMonth();

  const currentYear =
    now.getFullYear();

  let billDate = new Date(
    currentYear,
    currentMonth,
    card.billGenerationDay
  );

  // If already passed this month,
  // move to next month
  if (billDate < now) {
    billDate = new Date(
      currentYear,
      currentMonth + 1,
      card.billGenerationDay
    );
  }

  return billDate;
}

export function getDueDate(
  card: CreditCard
) {
  const billDate =
    getNextBillDate(card);

  const dueDate = new Date(
    billDate
  );

  dueDate.setDate(
    dueDate.getDate() +
      card.dueAfterDays
  );

  return dueDate;
}

export function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}