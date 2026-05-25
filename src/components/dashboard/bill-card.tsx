"use client";

import {
  PaymentForm,
} from "./payment-form";

import {
  getOutstandingAmount,
} from "@/lib/utils/bills";

import type {
  Bill,
  CreditCard,
} from "@/types/cards";

export function BillCard({
  bill,
  card,
}: {
  bill: Bill;

  card: CreditCard;
}) {
  const outstanding =
    getOutstandingAmount(
      bill
    );

  return (
    <div className="rounded-3xl border border-white/10 bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            {card.name}
          </h3>

          <p className="text-slate-500 text-sm mt-1">
            {card.bank}
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs px-3 py-1 rounded-full bg-white/10 inline-flex">
            {bill.status}
          </div>

          <p className="mt-2 text-2xl font-bold">
            ₹
            {outstanding.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Info
          label="Bill"
          value={`₹${bill.amount}`}
        />

        <Info
          label="Paid"
          value={`₹${bill.paidAmount}`}
        />

        <Info
          label="Outstanding"
          value={`₹${outstanding}`}
        />
      </div>

      <PaymentForm
        billId={bill.id}
        currentPaid={
          bill.paidAmount
        }
        totalAmount={bill.amount}
      />
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="font-semibold mt-2">
        {value}
      </p>
    </div>
  );
}