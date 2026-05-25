"use client";

import { create } from "zustand";

export type AppTab =
  | "home"
  | "cards"
  | "reports"
  | "settings";

interface UIStore {
  tab: AppTab;

  setTab: (
    tab: AppTab
  ) => void;
}

export const useUIStore =
  create<UIStore>((set) => ({
    tab: "home",

    setTab: (tab) =>
      set({
        tab,
      }),
  }));