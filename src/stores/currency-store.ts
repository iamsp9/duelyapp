// src/stores/currency-store.ts
"use client";

import { create } from "zustand";

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)", locale: "en-IN" },
  { code: "USD", symbol: "$", label: "US Dollar ($)", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "Euro (€)", locale: "de-DE" },
  { code: "GBP", symbol: "£", label: "British Pound (£)", locale: "en-GB" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)", locale: "ar-AE" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (S$)", locale: "en-SG" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar (CA$)", locale: "en-CA" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (A$)", locale: "en-AU" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen (¥)", locale: "ja-JP" },
];

interface CurrencyStore {
  currencyCode: string;
  setCurrency: (code: string) => void;
  getCurrency: () => CurrencyOption;
}

/**
 * Currency preference is stored in the encrypted vault (server-side) via vault-store.
 * This store acts as a runtime cache — it is hydrated when the vault is unlocked
 * (see vault-store.ts → setVaults) and written back whenever the user changes it
 * (see app-modals.tsx → handleCurrencyChange).
 *
 * There is intentionally NO localStorage/persist here; the vault IS the source of truth.
 */
export const useCurrencyStore = create<CurrencyStore>((set, get) => ({
  currencyCode: "INR",
  setCurrency: (code: string) => set({ currencyCode: code }),
  getCurrency: () =>
    CURRENCIES.find((c) => c.code === get().currencyCode) ?? CURRENCIES[0],
}));

/**
 * Format a number as currency using the user's preferred currency.
 */
export function formatWithCurrency(
  amount: number | string,
  currency: CurrencyOption
): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(num);
}
