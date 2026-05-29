// src/lib/engine/dashboard.ts
import type { CreditCard } from "@/types/card";
import { computeBillStatus, getDTD } from "./cards";

export function getDashboardCards(cards: CreditCard[]) {
  return cards
    .filter((c) => !c.disabled)
    .flatMap((c) => c.activeBills || [])
    .filter((bill) => computeBillStatus(bill) !== "paid")
    .sort((a, b) => getDTD(a) - getDTD(b));
}