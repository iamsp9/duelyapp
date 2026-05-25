"use client";

import {
  useState,
} from "react";

import {
  Modal,
} from "@/components/ui/modal";

import {
  useUIStore,
} from "@/stores/ui-store";

import {
  useVaultStore,
} from "@/stores/vault-store";

export function ManageCardsModal() {
  const activeModal =
    useUIStore(
      (state) =>
        state.activeModal
    );

  const setModal =
    useUIStore(
      (state) => state.setModal
    );

  const cards =
    useVaultStore(
      (state) =>
        state.vault.cards
    );

  const addCard =
    useVaultStore(
      (state) => state.addCard
    );

  const [form, setForm] =
    useState({
      bank: "",

      name: "",

      last4: "",

      limit: "",

      billGenerationDay:
        "",

      dueAfterDays: "",
    });

  function handleAdd() {
    if (
      !form.name ||
      !form.bank
    ) {
      return;
    }

    addCard({
      id: crypto.randomUUID(),

      bank: form.bank,

      name: form.name,

      last4: form.last4,

      limit: Number(
        form.limit
      ),

      billGenerationDay:
        Number(
          form.billGenerationDay
        ),

      dueAfterDays:
        Number(
          form.dueAfterDays
        ),

      createdAt:
        new Date().toISOString(),
    });

    setForm({
      bank: "",

      name: "",

      last4: "",

      limit: "",

      billGenerationDay:
        "",

      dueAfterDays: "",
    });
  }

  return (
    <Modal
      open={
        activeModal ===
        "cards"
      }
      onClose={() =>
        setModal(null)
      }
      title="Manage Cards"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-3xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {card.name}
                  </h3>

                  <p className="text-sm text-slate-400 mt-1">
                    {card.bank}
                    {" • "}
                    ****
                    {card.last4}
                  </p>

                  <p className="text-xs text-slate-500 mt-2">
                    Bill{" "}
                    {
                      card.billGenerationDay
                    }
                    th • Due after{" "}
                    {
                      card.dueAfterDays
                    }
                    days
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold">
                    ₹
                    {card.limit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <h3 className="font-semibold">
            Add New Card
          </h3>

          <Grid>
            <Input
              placeholder="Bank"
              value={form.bank}
              onChange={(v) =>
                setForm({
                  ...form,
                  bank: v,
                })
              }
            />

            <Input
              placeholder="Card Name"
              value={form.name}
              onChange={(v) =>
                setForm({
                  ...form,
                  name: v,
                })
              }
            />
          </Grid>

          <Grid>
            <Input
              placeholder="Last 4 digits"
              value={form.last4}
              onChange={(v) =>
                setForm({
                  ...form,
                  last4: v,
                })
              }
            />

            <Input
              placeholder="Credit Limit"
              value={form.limit}
              onChange={(v) =>
                setForm({
                  ...form,
                  limit: v,
                })
              }
            />
          </Grid>

          <Grid>
            <Input
              placeholder="Bill Date"
              value={
                form.billGenerationDay
              }
              onChange={(v) =>
                setForm({
                  ...form,
                  billGenerationDay:
                    v,
                })
              }
            />

            <Input
              placeholder="Due After Days"
              value={
                form.dueAfterDays
              }
              onChange={(v) =>
                setForm({
                  ...form,
                  dueAfterDays:
                    v,
                })
              }
            />
          </Grid>

          <button
            onClick={handleAdd}
            className="w-full h-12 rounded-2xl bg-primary text-white font-medium"
          >
            Save Card
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Grid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;

  onChange: (
    value: string
  ) => void;

  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value
        )
      }
      placeholder={
        placeholder
      }
      className="w-full h-12 rounded-2xl border border-white/10 bg-black/20 px-4"
    />
  );
}