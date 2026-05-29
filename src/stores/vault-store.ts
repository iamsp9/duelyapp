// src/stores/vault-store.ts
"use client";

import { create } from "zustand";
import type { CreditCard, BillCycle, PaymentStatus } from "@/types/card";
import { spawnMissingBills, extractArchivableBills, computeBillStatus } from "@/lib/engine/cards";

// ── Vault data shape (what gets encrypted & stored on the server) ─────────────
export interface MainVaultData {
  cards: CreditCard[];
  /** ISO-4217 currency code the user has chosen, e.g. "INR", "USD". */
  currencyCode?: string;
}

interface VaultState {
  vault: MainVaultData;
  archiveVault: {
    archivedBills: BillCycle[];
    deletedCards?: { id: string; name: string; deletedAt: string }[];
  };

  secret: string | null;
  salt: string | null;
  mode: string | null;
  cryptoKey: CryptoKey | null;
  hydrated: boolean;

  setAuth: (secret: string, salt: string, mode: string) => void;
  setCryptoKey: (key: CryptoKey) => void;
  setHydrated: (hydrated: boolean) => void;

  setVaults: (
    mainVault: MainVaultData,
    archiveVault?: { archivedBills: BillCycle[]; deletedCards?: { id: string; name: string; deletedAt: string }[] }
  ) => void;

  /** Updates the currency code stored inside the vault payload (triggers auto-sync). */
  setVaultCurrency: (code: string) => void;

  addCard: (card: CreditCard) => void;
  updateCard: (cardId: string, updates: Partial<CreditCard>) => void;
  deleteCard: (cardId: string, keepHistory?: boolean) => void;
  toggleCardDisabled: (cardId: string) => void;

  updateBill: (cardId: string, billId: string, updates: {
    billedAmount?: number | string;
    newPayment?: { amount: number; note?: string; date: string };
  }) => void;

  deletePayment: (cardId: string, billId: string, paymentId: string) => void;

  removeArchivedCard: (cardId: string) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  vault: { cards: [], currencyCode: "INR" },
  archiveVault: { archivedBills: [], deletedCards: [] },

  secret: null,
  salt: null,
  mode: null,
  cryptoKey: null,
  hydrated: false,

  setAuth: (secret, salt, mode) => set({ secret, salt, mode, cryptoKey: null }),
  setCryptoKey: (cryptoKey) => set({ cryptoKey }),
  setHydrated: (hydrated) => set({ hydrated }),

  setVaults: (mainVault, archiveVault) =>
    set((state) => {
      const processedCards = (mainVault.cards || []).map(card => spawnMissingBills(card));
      return {
        vault: {
          ...mainVault,
          cards: processedCards,
          currencyCode: mainVault.currencyCode ?? "INR",
        },
        archiveVault: archiveVault || state.archiveVault,
      };
    }),

  /**
   * Writes the chosen currency code into the vault data.
   * use-vault-sync watches `vault` changes and will automatically re-encrypt
   * and push to the server, so no extra work is needed here.
   */
  setVaultCurrency: (code) =>
    set((state) => ({
      vault: { ...state.vault, currencyCode: code },
    })),

  addCard: (card) =>
    set((state) => {
      const processedCard = spawnMissingBills(card);
      return {
        vault: {
          ...state.vault,
          cards: [...state.vault.cards, processedCard],
        },
      };
    }),

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
      const cardToDelete = state.vault.cards.find(c => c.id === cardId);
      const newCards = state.vault.cards.filter((c) => c.id !== cardId);

      let newArchiveVault = { ...state.archiveVault };

      if (!keepHistory) {
        newArchiveVault.archivedBills = newArchiveVault.archivedBills.filter(b => b.cardId !== cardId);
        newArchiveVault.deletedCards = (newArchiveVault.deletedCards || []).filter(c => c.id !== cardId);
      } else if (cardToDelete) {
        newArchiveVault.deletedCards = [
          ...(newArchiveVault.deletedCards || []),
          { id: cardToDelete.id, name: cardToDelete.name, deletedAt: new Date().toISOString() }
        ];
      }

      return {
        vault: { ...state.vault, cards: newCards },
        archiveVault: newArchiveVault
      };
    }),

  toggleCardDisabled: (cardId) =>
    set((state) => ({
      vault: {
        ...state.vault,
        cards: state.vault.cards.map((card) => {
          if (card.id !== cardId) return card;
          const isCurrentlyDisabled = card.disabled;
          return {
            ...card,
            disabled: !isCurrentlyDisabled,
            disabledAt: isCurrentlyDisabled ? undefined : new Date().toISOString(),
          };
        }),
      },
    })),

  updateBill: (cardId, billId, updates) =>
    set((state) => {
      const cardIndex = state.vault.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return state;

      const card = state.vault.cards[cardIndex];
      const activeBills = [...(card.activeBills || [])];
      const billIndex = activeBills.findIndex(b => b.id === billId);
      if (billIndex === -1) return state;

      const bill = { ...activeBills[billIndex] };
      const history = [...(bill.history || [])];

      if (updates.billedAmount !== undefined) {
        bill.billedAmount = updates.billedAmount;
      }

      if (updates.newPayment) {
        history.push({
          id: Date.now().toString(),
          amount: updates.newPayment.amount,
          note: updates.newPayment.note,
          date: updates.newPayment.date,
          ts: new Date().toISOString(),
        });
      }

      bill.history = history;
      bill.status = computeBillStatus(bill);
      activeBills[billIndex] = bill;

      const updatedCard = { ...card, activeBills };
      const { updatedCard: finalCard, billsToArchive } = extractArchivableBills(updatedCard);

      const newCards = [...state.vault.cards];
      newCards[cardIndex] = finalCard;

      return {
        vault: { ...state.vault, cards: newCards },
        archiveVault: {
          ...state.archiveVault,
          archivedBills: [...state.archiveVault.archivedBills, ...billsToArchive]
        }
      };
    }),

  deletePayment: (cardId, billId, paymentId) =>
    set((state) => {
      const cardIndex = state.vault.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return state;

      const card = state.vault.cards[cardIndex];
      const activeBills = [...(card.activeBills || [])];
      const billIndex = activeBills.findIndex(b => b.id === billId);
      if (billIndex === -1) return state;

      const bill = { ...activeBills[billIndex] };
      const history = (bill.history || []).filter(p => p.id !== paymentId);

      bill.history = history;
      bill.status = computeBillStatus(bill);
      activeBills[billIndex] = bill;

      const newCards = [...state.vault.cards];
      newCards[cardIndex] = { ...card, activeBills };

      return {
        vault: { ...state.vault, cards: newCards },
      };
    }),

  removeArchivedCard: (cardId) =>
    set((state) => ({
      archiveVault: {
        ...state.archiveVault,
        deletedCards: (state.archiveVault.deletedCards || []).filter((c) => c.id !== cardId),
        archivedBills: state.archiveVault.archivedBills.filter((b) => b.cardId !== cardId),
      },
    })),
}));
