"use client";

import {
  useVaultStore,
} from "@/stores/vault-store";

import {
  getSummary,
} from "@/lib/engine/cards";

function formatINR(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  ).format(value);
}

export function SummaryCards() {
  const cards =
    useVaultStore(
      (s) =>
        s.vault.cards
    );

  const summary =
    getSummary(cards);

  const items = [
    {
      label: "Billed",

      value:
        "₹" +
        formatINR(
          summary.billed
        ),

      color:
        "text-white",
    },

    {
      label: "Paid",

      value:
        "₹" +
        formatINR(
          summary.paid
        ),

      color:
        "text-emerald-400",
    },

    {
      label:
        "Outstanding",

      value:
        "₹" +
        formatINR(
          summary.outstanding
        ),

      color:
        "text-red-400",
    },

    {
      label:
        "Progress",

      value:
        summary.progress +
        "%",

      color:
        "text-white",

      progress:
        summary.progress,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-white/10 bg-[#111827] p-5"
        >
          <div className="text-xs uppercase tracking-wider text-slate-500">
            {item.label}
          </div>

          <div
            className={`mt-3 text-4xl font-bold ${item.color}`}
          >
            {item.value}
          </div>

          {item.progress !==
            undefined && (
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{
                  width: `${item.progress}%`,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}