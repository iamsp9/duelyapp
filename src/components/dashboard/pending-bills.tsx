"use client";

import {
  useEffect,
} from "react";

import {
  BillCard,
} from "./bill-card";

import {
  generateCurrentCycleBill,
  getCurrentCycleBill,
} from "@/lib/utils/current-cycle";

import {
  useVaultStore,
} from "@/stores/vault-store";

export function PendingBills() {
  const cards =
    useVaultStore(
      (state) =>
        state.vault.cards
    );

  const bills =
    useVaultStore(
      (state) =>
        state.vault.bills
    );

  const addBill =
    useVaultStore(
      (state) => state.addBill
    );

  // Auto-generate current cycle
  useEffect(() => {
    cards.forEach((card) => {
      const existing =
        getCurrentCycleBill(
          card,
          bills
        );

      if (!existing) {
        addBill(
          generateCurrentCycleBill(
            card
          )
        );
      }
    });
  }, [cards]);

  const currentBills =
    bills.filter(
      (bill) =>
        bill.status !==
        "paid"
    );

  if (!cards.length) {
    return (
      <div className="mt-8 rounded-3xl border border-white/10 bg-card p-8 text-center text-slate-400">
        Add your first card to begin.
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8">
      {currentBills.map(
        (bill) => {
          const card =
            cards.find(
              (c) =>
                c.id ===
                bill.cardId
            );

          if (!card)
            return null;

          return (
            <BillCard
              key={bill.id}
              bill={bill}
              card={card}
            />
          );
        }
      )}
    </div>
  );
}