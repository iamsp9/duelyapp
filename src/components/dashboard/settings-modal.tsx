"use client";

import {
  Modal,
} from "@/components/ui/modal";

import {
  useUIStore,
} from "@/stores/ui-store";

import {
  createClient,
} from "@/lib/supabase/client";

export function SettingsModal() {
  const activeModal =
    useUIStore(
      (state) =>
        state.activeModal
    );

  const setModal =
    useUIStore(
      (state) => state.setModal
    );

  async function signOut() {
    const supabase =
      createClient();

    await supabase.auth.signOut();

    location.href =
      "/login";
  }

  return (
    <Modal
      open={
        activeModal ===
        "settings"
      }
      onClose={() =>
        setModal(null)
      }
      title="Settings"
    >
      <div className="space-y-4">
        <button className="w-full h-12 rounded-2xl border border-white/10 bg-white/5">
          Change PIN
        </button>

        <button
          onClick={signOut}
          className="w-full h-12 rounded-2xl border border-white/10 bg-white/5"
        >
          Sign Out
        </button>
      </div>
    </Modal>
  );
}