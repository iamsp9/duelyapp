// src/stores/vault-store.ts
"use client";

import { create } from "zustand";
import type { CreditCard, PaymentStatus } from "@/types/card";
import { computeStatus } from "@/lib/engine/cards";

// FIXED: typed the update payload strictly to avoid `any`
export interface SaveCardUpdates extends Partial<CreditCard> {
  newPayment?: {
    amount?: number;
    note?: string;
    date?: string;
  };
  logOnly?: string;
}

interface VaultState {
  vault: { cards: CreditCard[] };
  
  secret: string | null;
  salt: string | null;
  mode: string | null;
  cryptoKey: CryptoKey | null; 
  hydrated: boolean;

  setAuth: (secret: string, salt: string, mode: string) => void;
  setCryptoKey: (key: CryptoKey) => void;
  setHydrated: (hydrated: boolean) => void;
  setVault: (vault: { cards: CreditCard[] }) => void;

  addCard: (card: CreditCard) => void;
  updateCard: (cardId: string, updates: Partial<CreditCard>) => void;
  deleteCard: (cardId: string) => void;
  saveCardState: (cardId: string, updates: SaveCardUpdates) => void;
  deleteHistoryItem: (cardId: string, index: number) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  vault: { cards: [] },
  
  secret: null,
  salt: null,
  mode: null,
  cryptoKey: null,
  hydrated: false,

  setAuth: (secret, salt, mode) => set({ secret, salt, mode, cryptoKey: null }),
  setCryptoKey: (cryptoKey) => set({ cryptoKey }),
  setHydrated: (hydrated) => set({ hydrated }),
  setVault: (vault) => set({ vault }),

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
          const history = card.history ? [...card.history] : [];
          
          let statusOverride = updates.statusOverride !== undefined ? updates.statusOverride : card.statusOverride;

          if (updates.newPayment) {
            history.push({
              amount: updates.newPayment.amount,
              note: updates.newPayment.note,
              date: updates.newPayment.date,
              ts: new Date().toISOString()
            });
            statusOverride = undefined; 
          }
          
          if (updates.logOnly) {
            history.push({ text: updates.logOnly, ts: new Date().toISOString() });
          }
          
          // Remove custom metadata before merging so we maintain CreditCard exact type format if necessary
          const { newPayment, logOnly, ...baseUpdates } = updates;
          const updatedCard = { ...card, ...baseUpdates, history, statusOverride };
          
          if (!statusOverride) {
             updatedCard.status = computeStatus(updatedCard as CreditCard);
          } else {
             updatedCard.status = statusOverride;
          }

          return updatedCard as CreditCard;
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
          
          const updatedCard = { ...card, history, statusOverride: undefined };
          updatedCard.status = computeStatus(updatedCard as CreditCard);
          
          return updatedCard as CreditCard;
        }),
      },
    })),
}));