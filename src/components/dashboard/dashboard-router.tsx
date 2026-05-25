"use client";

import {
  useUIStore,
} from "@/stores/ui-store";

import {
  HomeView,
} from "./home-view";

import {
  AllCardsView,
} from "@/components/cards/all-cards-view";

export function DashboardRouter() {
  const tab =
    useUIStore(
      (s) => s.tab
    );

  if (tab === "cards") {
    return (
      <AllCardsView />
    );
  }

  return <HomeView />;
}