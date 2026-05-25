import { create } from "zustand";

import { Card } from "@/types/card";

type VaultState = {
  cards: Card[];

  addCard: (
    card: Card
  ) => void;

  updateCard: (
    id: string,
    data: Partial<Card>
  ) => void;

  deleteCard: (
    id: string
  ) => void;

  addPayment: (
    cardId: string,
    amount: number,
    note?: string
  ) => void;
};

export const useVaultStore =
  create<VaultState>((set) => ({
    cards: [],

    addCard: (card) =>
      set((state) => ({
        cards: [
          ...state.cards,
          card,
        ],
      })),

    updateCard: (id, data) =>
      set((state) => ({
        cards: state.cards.map((c) =>
          c.id === id
            ? {
                ...c,
                ...data,
              }
            : c
        ),
      })),

    deleteCard: (id) =>
      set((state) => ({
        cards: state.cards.filter(
          (c) => c.id !== id
        ),
      })),

    addPayment: (
      cardId,
      amount,
      note
    ) =>
      set((state) => ({
        cards: state.cards.map((c) => {
          if (c.id !== cardId) {
            return c;
          }

          return {
            ...c,

            history: [
              ...c.history,

              {
                amount,
                note,
                date:
                  new Date()
                    .toISOString()
                    .slice(0, 10),

                ts:
                  new Date().toISOString(),
              },
            ],
          };
        }),
      })),
  }));