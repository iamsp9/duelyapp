"use client";

import {
  useState,
} from "react";

import type {
  CreditCard,
} from "@/types/card";

import {
  useVaultStore,
} from "@/stores/vault-store";

interface Props {
  card: CreditCard;

  onClose: () => void;
}

export function PaymentForm({
  card,
  onClose,
}: Props) {
  const saveBill =
    useVaultStore(
      (s) =>
        s.saveBill
    );

  const logPayment =
    useVaultStore(
      (s) =>
        s.logPayment
    );

  const [
    totalBill,
    setTotalBill,
  ] = useState(
    card.totalBill || 0
  );

  const [
    payment,
    setPayment,
  ] = useState(0);

  const [
    note,
    setNote,
  ] = useState("");

  const [
    loadingBill,
    setLoadingBill,
  ] = useState(false);

  const [
    loadingPayment,
    setLoadingPayment,
  ] = useState(false);

  async function handleSaveBill() {
    setLoadingBill(true);

    saveBill(
      card.id,
      Number(totalBill)
    );

    alert(
      "Bill saved successfully"
    );

    setLoadingBill(false);

    onClose();
  }

  async function handleLogPayment() {
    if (
      !payment ||
      payment <= 0
    ) {
      alert(
        "Enter valid payment"
      );

      return;
    }

    setLoadingPayment(
      true
    );

    logPayment(
      card.id,
      Number(payment),
      note
    );

    alert(
      "Payment logged successfully"
    );

    setLoadingPayment(
      false
    );

    onClose();
  }

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h2 className="text-4xl font-bold text-white">
          {card.name}
        </h2>

        <p className="mt-2 text-slate-400">
          Bill{" "}
          {card.billDay}
          · Due{" "}
          {card.dueDay}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <label className="mb-3 block text-slate-400">
          Total bill (₹)
        </label>

        <input
          type="number"
          value={totalBill}
          onChange={(e) =>
            setTotalBill(
              Number(
                e.target.value
              )
            )
          }
          className="w-full rounded-2xl bg-[#0B132B] px-5 py-4 text-3xl font-bold text-white outline-none"
        />

        <button
          onClick={
            handleSaveBill
          }
          disabled={
            loadingBill
          }
          className="mt-5 w-full rounded-2xl bg-blue-500 py-4 text-lg font-semibold text-white"
        >
          {loadingBill
            ? "Saving..."
            : "Save Bill"}
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <label className="mb-3 block text-slate-400">
          Add payment (₹)
        </label>

        <input
          type="number"
          value={payment}
          onChange={(e) =>
            setPayment(
              Number(
                e.target.value
              )
            )
          }
          className="w-full rounded-2xl bg-[#0B132B] px-5 py-4 text-2xl text-white outline-none"
        />

        <div className="mt-5">
          <label className="mb-2 block text-slate-400">
            Note
          </label>

          <input
            value={note}
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
            placeholder="e.g. via UPI"
            className="w-full rounded-2xl bg-[#0B132B] px-5 py-4 text-white outline-none"
          />
        </div>

        <button
          onClick={
            handleLogPayment
          }
          disabled={
            loadingPayment
          }
          className="mt-5 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-semibold text-white"
        >
          {loadingPayment
            ? "Logging..."
            : "Log Payment"}
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">
            Outstanding
          </span>

          <span className="text-2xl font-bold text-white">
            ₹
            {(
              card.outstandingAmount ||
              0
            ).toLocaleString()}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-slate-400">
            Paid
          </span>

          <span className="text-xl font-semibold text-emerald-400">
            ₹
            {(
              card.paidAmount ||
              0
            ).toLocaleString()}
          </span>
        </div>
      </div>

      {(card.payments ||
        []).length >
        0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-xl font-semibold text-white">
            Payment History
          </h3>

          <div className="space-y-3">
            {(card.payments ||
              []).map(
              (
                payment
              ) => (
                <div
                  key={
                    payment.id
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      ₹
                      {payment.amount.toLocaleString()}
                    </span>

                    <span className="text-sm text-slate-400">
                      {new Date(
                        payment.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  {payment.note && (
                    <p className="mt-2 text-sm text-slate-400">
                      {
                        payment.note
                      }
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full rounded-2xl border border-white/10 py-4 text-lg text-white"
      >
        Close
      </button>
    </div>
  );
}