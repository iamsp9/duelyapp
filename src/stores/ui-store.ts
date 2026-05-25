import { create } from "zustand";

type ModalType =
  | "cards"
  | "backup"
  | "settings"
  | "reports"
  | null;

interface UIState {
  activeModal: ModalType;

  setModal: (
    modal: ModalType
  ) => void;
}

export const useUIStore =
  create<UIState>((set) => ({
    activeModal: null,

    setModal: (modal) =>
      set({
        activeModal: modal,
      }),
  }));