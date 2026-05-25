"use client";

import {
  useState,
} from "react";

import {
  useVaultStore,
} from "@/stores/vault-store";

import {
  getActiveCards,
  getUpcomingCards,
} from "@/lib/engine/cards";

import {
  Sheet,
} from "@/components/ui/sheet";

import {
  AddCardForm,
} from "./add-card-form";

import {
  CardItem,
} from "./card-item";

export function AllCardsView() {
  const cards =
    useVaultStore(
      (s) =>
        s.vault.cards
    );

  const activeCards =
    getActiveCards(
      cards
    );

  const upcomingCards =
    getUpcomingCards(
      cards
    );

  const [open, setOpen] =
    useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            All Cards
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Manage your credit cards
          </p>
        </div>

        <button
          onClick={() =>
            setOpen(true)
          }
          className="rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white"
        >
          Add Card
        </button>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Current Cycle
        </h3>

        {activeCards.length ===
        0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#111827] p-8 text-center text-slate-400">
            No active cards
          </div>
        ) : (
          activeCards.map(
            (card) => (
              <CardItem
                key={card.id}
                card={card}
              />
            )
          )
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Upcoming
        </h3>

        {upcomingCards.length ===
        0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#111827] p-8 text-center text-slate-400">
            No upcoming cards
          </div>
        ) : (
          upcomingCards.map(
            (card) => (
              <CardItem
                key={card.id}
                card={card}
              />
            )
          )
        )}
      </section>

      <Sheet
        open={open}
        onClose={() =>
          setOpen(false)
        }
      >
        <AddCardForm
          onClose={() =>
            setOpen(false)
          }
        />
      </Sheet>
    </div>
  );
}