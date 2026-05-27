
// src/stores/vault-store.ts
"use client";
 
import { create } from "zustand";
import type { CreditCard, ArchivedCard, PaymentStatus } from "@/types/card";
import { computeStatus } from "@/lib/engine/cards";
 
export interface SaveCardUpdates extends Partial<CreditCard> {
  newPayment?: {
    amount?: number;
    note?: string;
    date?: string;
  };
  logOnly?: string;
}
 
interface VaultState {
  vault: {
    cards: CreditCard[];
    /** Cards that have been deleted but whose history is kept for reports */
    archivedCards: ArchivedCard[];
  };
 
  secret: string | null;
  salt: string | null;
  mode: string | null;
  cryptoKey: CryptoKey | null;
  hydrated: boolean;
 
  setAuth: (secret: string, salt: string, mode: string) => void;
  setCryptoKey: (key: CryptoKey) => void;
  setHydrated: (hydrated: boolean) => void;
  setVault: (vault: { cards: CreditCard[]; archivedCards?: ArchivedCard[] }) => void;
 
  addCard: (card: CreditCard) => void;
  updateCard: (cardId: string, updates: Partial<CreditCard>) => void;
 
  /**
   * Delete a card.
   * @param cardId  The card to remove.
   * @param keepHistory  When true, the card's history is moved to archivedCards
   *                     so it remains available in Reports.
   */
  deleteCard: (cardId: string, keepHistory?: boolean) => void;
 
  /** Toggle the disabled flag on a card without touching any other state. */
  toggleCardDisabled: (cardId: string) => void;
 
  saveCardState: (cardId: string, updates: SaveCardUpdates) => void;
  deleteHistoryItem: (cardId: string, index: number) => void;
 
  /** Permanently remove an archived card from the store. */
  removeArchivedCard: (archivedId: string) => void;
}
 
export const useVaultStore = create<VaultState>((set) => ({
  vault: { cards: [], archivedCards: [] },
 
  secret: null,
  salt: null,
  mode: null,
  cryptoKey: null,
  hydrated: false,
 
  setAuth: (secret, salt, mode) => set({ secret, salt, mode, cryptoKey: null }),
  setCryptoKey: (cryptoKey) => set({ cryptoKey }),
  setHydrated: (hydrated) => set({ hydrated }),
 
  // Normalise legacy vaults that don't yet have archivedCards
  setVault: (vault) =>
    set({
      vault: {
        cards: vault.cards ?? [],
        archivedCards: vault.archivedCards ?? [],
      },
    }),
 
  addCard: (card) =>
    set((state) => ({
      vault: {
        ...state.vault,
        cards: [...state.vault.cards, card],
      },
    })),
 
  updateCard: (cardId, updates) =>
    set((state) => ({
      vault: {
        ...state.vault,
        cards: state.vault.cards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        ),
      },
    })),
 
  deleteCard: (cardId, keepHistory = false) =>
    set((state) => {
      const card = state.vault.cards.find((c) => c.id === cardId);
      const newCards = state.vault.cards.filter((c) => c.id !== cardId);
 
      // If the user wants to keep history for reports, move to archivedCards
      const newArchived =
        keepHistory && card
          ? [
              ...state.vault.archivedCards,
              {
                id: card.id,
                name: card.name,
                archivedAt: new Date().toISOString(),
                history: card.history ?? [],
              } satisfies ArchivedCard,
            ]
          : state.vault.archivedCards;
 
      return {
        vault: {
          ...state.vault,
          cards: newCards,
          archivedCards: newArchived,
        },
      };
    }),
 
  toggleCardDisabled: (cardId) =>
    set((state) => ({
      vault: {
        ...state.vault,
        cards: state.vault.cards.map((card) =>
          card.id === cardId
            ? { ...card, disabled: !card.disabled }
            : card
        ),
      },
    })),
 
  saveCardState: (cardId, updates) =>
    set((state) => ({
      vault: {
        ...state.vault,
        cards: state.vault.cards.map((card) => {
          if (card.id !== cardId) return card;
          const history = card.history ? [...card.history] : [];
 
          let statusOverride =
            updates.statusOverride !== undefined
              ? updates.statusOverride
              : card.statusOverride;
 
          if (updates.newPayment) {
            history.push({
              amount: updates.newPayment.amount,
              note: updates.newPayment.note,
              date: updates.newPayment.date,
              ts: new Date().toISOString(),
            });
            statusOverride = undefined;
          }
 
          if (updates.logOnly) {
            history.push({ text: updates.logOnly, ts: new Date().toISOString() });
          }
 
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
 
  removeArchivedCard: (archivedId) =>
    set((state) => ({
      vault: {
        ...state.vault,
        archivedCards: state.vault.archivedCards.filter(
          (a) => a.id !== archivedId
        ),
      },
    })),
}));