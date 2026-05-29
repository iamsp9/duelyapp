// src/stores/ui-store.ts
"use client";

import { create } from "zustand";

export type AppTab = "home" | "bills" | "cards" | "reports" | "settings";

interface UIStore {
  tab: AppTab;
  setTab: (tab: AppTab) => void;

  isManageCardsOpen: boolean;
  setManageCardsOpen: (open: boolean) => void;

  isCardFormOpen: boolean;
  setCardFormOpen: (open: boolean) => void;

  editingCardId: string | null;
  setEditingCardId: (id: string | null) => void;

  isProfileOpen: boolean;
  setProfileOpen: (open: boolean) => void;

  isBackupOpen: boolean;
  setBackupOpen: (open: boolean) => void;

  isDeleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;

  closeAllModals: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  tab: "home",
  setTab: (tab) => set({ tab }),

  isManageCardsOpen: false,
  setManageCardsOpen: (open) => set({ isManageCardsOpen: open }),

  isCardFormOpen: false,
  setCardFormOpen: (open) => set({ isCardFormOpen: open }),

  editingCardId: null,
  setEditingCardId: (id) => set({ editingCardId: id }),

  isProfileOpen: false,
  setProfileOpen: (open) => set({ isProfileOpen: open }),

  isBackupOpen: false,
  setBackupOpen: (open) => set({ isBackupOpen: open }),

  isDeleteConfirmOpen: false,
  setDeleteConfirmOpen: (open) => set({ isDeleteConfirmOpen: open }),

  closeAllModals: () => set({ 
    isManageCardsOpen: false, 
    isCardFormOpen: false, 
    isProfileOpen: false, 
    isBackupOpen: false 
  }),

}));

