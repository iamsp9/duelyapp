"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/stores/vault-store";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
// We use DashboardRouter here to respect the Bottom Nav tabs you built earlier
import { DashboardRouter } from "@/components/dashboard/dashboard-router"; 

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useVaultStore((s) => s.hydrated);

  useEffect(() => {
    // If the vault is locked or not loaded into memory, redirect to lock screen
    if (!hydrated) {
      router.push("/vault");
    }
  }, [hydrated, router]);

  // Don't render the dashboard UI until the vault is confirmed unlocked
  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <DashboardShell>
      <DashboardRouter />
    </DashboardShell>
  );
}