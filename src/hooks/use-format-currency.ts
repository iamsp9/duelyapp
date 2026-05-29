// src/hooks/use-format-currency.ts
//
// Drop-in hook that returns a formatCurrency function respecting the user's
// currency preference from useCurrencyStore.
//
// Usage in any component:
//   const fmt = useFormatCurrency();
//   fmt(1234) // => "₹1,234" or "$1,234" depending on preference
//
"use client";

import { useCurrencyStore, formatWithCurrency } from "@/stores/currency-store";

export function useFormatCurrency() {
  const getCurrency = useCurrencyStore((s) => s.getCurrency);
  const currency = getCurrency();

  return (amount: number | string) => formatWithCurrency(amount, currency);
}
