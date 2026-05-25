"use client";

import {
  DashboardShell,
} from "@/components/dashboard/dashboard-shell";

import {
  DashboardView,
} from "@/components/dashboard/dashboard-view";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardView />
    </DashboardShell>
  );
}