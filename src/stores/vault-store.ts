"use client";

import { create } from "zustand";

import type {
  CreditCard,
  PaymentStatus,
} from "@/types/card";

interface VaultState {
  vault: {
    cards: CreditCard[];
  };

  addCard: (
    card: CreditCard
  ) => void;

  updateCard: (
    cardId: string,
    updates: Partial<CreditCard>
  ) => void;

  deleteCard: (
    cardId: string
  ) => void;

  saveBill: (
    cardId: string,
    amount: number
  ) => void;

  logPayment: (
    cardId: string,
    amount: number,
    note?: string
  ) => void;
}

export const useVaultStore =
  create<VaultState>(
    (set) => ({
      vault: {
        cards: [],
      },

      addCard: (card) =>
        set((state) => ({
          vault: {
            ...state.vault,

            cards: [
              ...state.vault.cards,
              card,
            ],
          },
        })),

      updateCard: (
        cardId,
        updates
      ) =>
        set((state) => ({
          vault: {
            ...state.vault,

            cards:
              state.vault.cards.map(
                (card) =>
                  card.id ===
                  cardId
                    ? {
                        ...card,
                        ...updates,
                      }
                    : card
              ),
          },
        })),

      deleteCard: (
        cardId
      ) =>
        set((state) => ({
          vault: {
            ...state.vault,

            cards:
              state.vault.cards.filter(
                (c) =>
                  c.id !==
                  cardId
              ),
          },
        })),

      saveBill: (
        cardId,
        amount
      ) =>
        set((state) => ({
          vault: {
            ...state.vault,

            cards:
              state.vault.cards.map(
                (card) => {
                  if (
                    card.id !==
                    cardId
                  ) {
                    return card;
                  }

                  const outstanding =
                    amount -
                    card.paidAmount;

                  let status: PaymentStatus =
                    "unpaid";

                  if (
                    outstanding <=
                    0
                  ) {
                    status =
                      "paid";
                  } else if (
                    card.paidAmount >
                    0
                  ) {
                    status =
                      "partial";
                  }

                  return {
                    ...card,

                    totalBill:
                      amount,

                    outstandingAmount:
                      Math.max(
                        0,
                        outstanding
                      ),

                    status,
                  };
                }
              ),
          },
        })),

      logPayment: (
        cardId,
        amount,
        note
      ) =>
        set((state) => ({
          vault: {
            ...state.vault,

            cards:
              state.vault.cards.map(
                (card) => {
                  if (
                    card.id !==
                    cardId
                  ) {
                    return card;
                  }

                  const paid =
                    card.paidAmount +
                    amount;

                  const outstanding =
                    Math.max(
                      0,
                      card.totalBill -
                        paid
                    );

                  let status: PaymentStatus =
                    "unpaid";

                  if (
                    outstanding ===
                    0 &&
                    card.totalBill >
                      0
                  ) {
                    status =
                      "paid";
                  } else if (
                    paid > 0
                  ) {
                    status =
                      "partial";
                  }

                  return {
                    ...card,

                    paidAmount:
                      paid,

                    outstandingAmount:
                      outstanding,

                    status,

                    payments: [
                      ...card.payments,

                      {
                        id:
                          crypto.randomUUID(),

                        amount,

                        note,

                        createdAt:
                          new Date().toISOString(),
                      },
                    ],
                  };
                }
              ),
          },
        })),
    })
  );