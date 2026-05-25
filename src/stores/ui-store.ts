"use client";

import { create } from "zustand";

export type AppTab =
  | "home"
  | "cards"
  | "reports"
  | "settings";

interface UIStore {
  tab: AppTab;
  setTab: (tab: AppTab) => void;

  isManageCardsOpen: boolean;
  setManageCardsOpen: (open: boolean) => void;

  isCardFormOpen: boolean;
  setCardFormOpen: (open: boolean) => void;

  editingCardId: string | null;
  setEditingCardId: (id: string | null) => void;
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
}));