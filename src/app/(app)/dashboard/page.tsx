"use client";

import { useState } from "react";

import {
  DashboardView,
} from "@/components/dashboard/dashboard-view";

import {
  AllCardsView,
} from "@/components/dashboard/all-cards-view";

type Tab =
  | "dashboard"
  | "cards"
  | "reports"
  | "settings";

export default function Page() {
  const [tab, setTab] =
    useState<Tab>(
      "dashboard"
    );

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="mx-auto max-w-7xl p-6 pb-32">
        {tab ===
          "dashboard" && (
          <DashboardView />
        )}

        {tab === "cards" && (
          <AllCardsView />
        )}

        {tab ===
          "reports" && (
          <div>
            Reports
          </div>
        )}

        {tab ===
          "settings" && (
          <div>
            Settings
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#020817]">
        <div className="grid grid-cols-4">
          <button
            onClick={() =>
              setTab(
                "dashboard"
              )
            }
            className="p-4"
          >
            Home
          </button>

          <button
            onClick={() =>
              setTab("cards")
            }
            className="p-4"
          >
            Cards
          </button>

          <button
            onClick={() =>
              setTab(
                "reports"
              )
            }
            className="p-4"
          >
            Reports
          </button>

          <button
            onClick={() =>
              setTab(
                "settings"
              )
            }
            className="p-4"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}