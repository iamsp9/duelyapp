"use client";

import {
  Modal,
} from "@/components/ui/modal";

import {
  useUIStore,
} from "@/stores/ui-store";

export function ReportsModal() {
  const activeModal =
    useUIStore(
      (state) =>
        state.activeModal
    );

  const setModal =
    useUIStore(
      (state) => state.setModal
    );

  return (
    <Modal
      open={
        activeModal ===
        "reports"
      }
      onClose={() =>
        setModal(null)
      }
      title="Reports"
    >
      <div className="text-slate-400">
        Reports engine coming next.
      </div>
    </Modal>
  );
}