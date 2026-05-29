// src/components/dashboard/dashboard-router.tsx
"use client";

import { useUIStore } from "@/stores/ui-store";
import { HomeView } from "./home-view";
import { BillsView } from "@/components/cards/bills-view";
import { AllCardsView } from "@/components/cards/all-cards-view";
import { ReportsView } from "@/components/reports/reports-view";

export function DashboardRouter() {
  const tab = useUIStore((s) => s.tab);

  if (tab === "bills") return <BillsView />;
  if (tab === "cards") return <AllCardsView />;
  if (tab === "reports") return <ReportsView />;

  return <HomeView />;
}