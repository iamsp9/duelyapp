"use client";

import {
  useState,
} from "react";

import {
  getDueBadge,
  getOutstanding,
  computeStatus,
  getStatusColor,
} from "@/lib/engine/cards";

import {
  Sheet,
} from "@/components/ui/sheet";

import {
  AddCardForm,
} from "./add-card-form";

import {
  PaymentForm,
} from "./payment-form";

import type {
  CreditCard,
} from "@/types/card";

interface Props {
  card: CreditCard;
}

export function CardItem({
  card,
}: Props) {
  const [edit, setEdit] =
    useState(false);

  const [
    payment,
    setPayment,
  ] = useState(false);

  const status =
    computeStatus(card);

  const colors =
    getStatusColor(
      status
    );

  return (
    <>
      <div
        onClick={() =>
          setPayment(true)
        }
        className="cursor-pointer rounded-3xl border border-white/10 bg-[#111827] p-5 transition hover:border-white/20"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`size-3 rounded-full ${colors.bg}`}
              />

              <h3 className="text-lg font-semibold text-white">
                {card.name}
              </h3>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Bill {card.billDay} ·
              Due {card.dueDay}
            </p>
          </div>

          <div className="text-right">
            <div
              className={`inline-flex rounded-full px-3 py-1 text-xs ${colors.bg} ${colors.text}`}
            >
              {getDueBadge(
                card
              )}
            </div>

            <div className="mt-3 text-2xl font-bold text-white">
              ₹
              {getOutstanding(
                card
              ).toLocaleString(
                "en-IN"
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();

              setEdit(true);
            }}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
          >
            Edit
          </button>
        </div>
      </div>

      <Sheet
        open={edit}
        onClose={() =>
          setEdit(false)
        }
      >
        <AddCardForm
          editing={card}
          onClose={() =>
            setEdit(false)
          }
        />
      </Sheet>

      <Sheet
        open={payment}
        onClose={() =>
          setPayment(false)
        }
      >
        <PaymentForm
          card={card}
          onClose={() =>
            setPayment(false)
          }
        />
      </Sheet>
    </>
  );
}