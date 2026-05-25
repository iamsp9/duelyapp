"use client";

import {
  useVaultStore,
} from "@/stores/vault-store";

import {
  getDashboardCards,
} from "@/lib/engine/dashboard";

import {
  SummaryCards,
} from "./summary-cards";

import {
  DashboardCard,
} from "./dashboard-card";

export function HomeView() {
  const cards =
    useVaultStore(
      (s) =>
        s.vault.cards
    );

  const dashboardCards =
    getDashboardCards(
      cards
    );

  return (
    <div className="space-y-8">
      <SummaryCards />

      <div className="space-y-4">
        {dashboardCards.map(
          (card) => (
            <DashboardCard
              key={card.id}
              card={card}
            />
          )
        )}
      </div>
    </div>
  );
}