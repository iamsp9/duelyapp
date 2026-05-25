import type { CreditCard } from "@/types/card";
import { isActive, sortByDue, computeStatus } from "./cards";

export function getDashboardCards(cards: CreditCard[]) {
  // Matches the index.html renderDashboard() logic
  return sortByDue(
    cards.filter(c => isActive(c) && computeStatus(c) !== "paid")
  );
}