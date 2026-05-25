"use client";

import { create } from "zustand";
import type { CreditCard, PaymentStatus } from "@/types/card";

interface VaultState {
  vault: { cards: CreditCard[] };
  addCard: (card: CreditCard) => void;
  updateCard: (cardId: string, updates: Partial<CreditCard>) => void;
  deleteCard: (cardId: string) => void;
  saveCardState: (cardId: string, updates: any) => void;
  deleteHistoryItem: (cardId: string, index: number) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  vault: { cards: [] },
  addCard: (card) =>
    set((state) => ({ vault: { ...state.vault, cards: [...state.vault.cards, card] } })),
  updateCard: (cardId, updates) =>
    set((state) => ({
      vault: {
        ...state.vault,
        cards: state.vault.cards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        ),
      },
    })),
  deleteCard: (cardId) =>
    set((state) => ({
      vault: {
        ...state.vault,
        cards: state.vault.cards.filter((c) => c.id !== cardId),
      },
    })),
  saveCardState: (cardId, updates) =>
    set((state) => ({
      vault: {
        ...state.vault,
        cards: state.vault.cards.map((card) => {
          if (card.id !== cardId) return card;
          const history = card.history || [];
          if (updates.newPayment) {
            history.push({
              amount: updates.newPayment.amount,
              note: updates.newPayment.note,
              date: updates.newPayment.date,
              ts: new Date().toISOString()
            });
            delete updates.statusOverride; // Clear override on new payment
          }
          if (updates.logOnly) {
            history.push({ text: updates.logOnly, ts: new Date().toISOString() });
          }
          return { ...card, ...updates, history };
        }),
      },
    })),
  deleteHistoryItem: (cardId, index) =>
    set((state) => ({
      vault: {
        ...state.vault,
        cards: state.vault.cards.map((card) => {
          if (card.id !== cardId) return card;
          const history = [...(card.history || [])];
          history.splice(index, 1);
          return { ...card, history, statusOverride: undefined };
        }),
      },
    })),
}));