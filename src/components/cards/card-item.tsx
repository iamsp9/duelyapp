// src/components/cards/card-item.tsx
"use client";

import { useState } from "react";
import { useVaultStore } from "@/stores/vault-store";
import {
  getDueBadge,
  computeBillStatus,
  getPaidTotal,
  formatCurrency,
  getDTD,
} from "@/lib/engine/cards";
import type { CreditCard, BillCycle } from "@/types/card";
import {
  ChevronDown,
  X,
  Clock,
  Check,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useCurrencyStore } from "@/stores/currency-store";

interface Props { card: CreditCard; bill: BillCycle }

function getGlowClass(bill: BillCycle) {
  if (computeBillStatus(bill) === "paid") return "border-white/10";
  const d = getDTD(bill);
  if (d < 0 || d <= 2)  return "border-red-500/70 shadow-[0_0_0_2px_rgba(239,68,68,0.07)]";
  if (d <= 5)           return "border-orange-500/70 shadow-[0_0_0_2px_rgba(249,115,22,0.07)]";
  if (d <= 7)           return "border-yellow-500/70 shadow-[0_0_0_2px_rgba(234,179,8,0.07)]";
  return "border-white/10";
}

export function CardItem({ card, bill }: Props) {
  const { updateBill, deletePayment } = useVaultStore();
  const fmt = useFormatCurrency();
  const { getCurrency } = useCurrencyStore();
  const currency = getCurrency();

  const [open,              setOpen]              = useState(false);
  const [toast,             setToast]             = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirmId,   setDeleteConfirmId]   = useState<string | null>(null);
  const [confirmOverwrite,  setConfirmOverwrite]  = useState(false);

  const [billVal, setBillVal] = useState<string | number>(bill.billedAmount || "");
  const [payVal,  setPayVal]  = useState("");
  const [noteVal, setNoteVal] = useState("");
  const [dateVal, setDateVal] = useState(new Date().toISOString().slice(0, 10));

  const status    = computeBillStatus(bill);
  const glowClass = getGlowClass(bill);

  const dotCls =
    status === "unpaid"  ? "bg-red-500"
    : status === "partial" ? "bg-orange-500"
    : "bg-green-500";

  const billStr = bill.billedAmount !== "" && bill.billedAmount != null
    ? fmt(bill.billedAmount) : "—";
  const tp       = getPaidTotal(bill);
  const paidStr  = tp > 0 ? fmt(tp) : "—";
  const badge    = getDueBadge(bill);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const formatShort = (s: string) =>
    new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const renderStatusPreview = () => {
    const billAmt = parseFloat(String(billVal)) || parseFloat(String(bill.billedAmount)) || 0;
    const newAmt  = parseFloat(payVal) || 0;
    const proj    = tp + newAmt;
    if (billVal !== "" && parseFloat(String(billVal)) === 0)
      return <span className="text-emerald-400 text-[12px] flex items-center gap-1"><Check className="size-3.5" /> No payment due — marked <b>Paid</b></span>;
    if (!billAmt && !proj) return null;
    if (billAmt > 0 && proj >= billAmt)
      return <span className="text-emerald-400 text-[12px] flex items-center gap-1"><Check className="size-3.5" /> Will be <b>Paid</b></span>;
    if (proj > 0)
      return <span className="text-orange-400 text-[12px] flex items-center gap-1"><Clock className="size-3.5" /><b>Partial</b> — {fmt(proj)} / {fmt(billAmt)}</span>;
    return <span className="text-red-400 text-[12px] flex items-center gap-1"><X className="size-3.5" /><b>Unpaid</b></span>;
  };

  const handleSaveStatement = (isConfirmed = false) => {
    if (bill.billedAmount !== "" && !isConfirmed) { setConfirmOverwrite(true); return; }
    updateBill(card.id, bill.id, { billedAmount: billVal });
    setConfirmOverwrite(false);
    setOpen(false);
    showToast("Statement saved", "success");
  };

  const handleLogPayment = () => {
    const amt = parseFloat(payVal);
    if (!amt || amt <= 0) { showToast("Enter a valid amount", "error"); return; }
    updateBill(card.id, bill.id, { newPayment: { amount: amt, note: noteVal, date: dateVal } });
    setPayVal(""); setNoteVal(""); setOpen(false);
    showToast("Payment logged", "success");
  };

  return (
    <>
      <div className={`rounded-2xl border bg-[#111827] overflow-hidden transition-all ${glowClass}`}>

        {/* ── Collapsed row ── */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none active:bg-white/[0.03]"
          onClick={() => setOpen(!open)}
        >
          <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${dotCls}`} />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] text-white leading-tight truncate">
              {card.name}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {formatShort(bill.statementDate)} · due {formatShort(bill.dueDate)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold whitespace-nowrap ${badge.classes}`}>
              {badge.text}
            </span>
            <div className="text-right">
              <p className="text-[13px] font-bold text-white leading-tight">{billStr}</p>
              {tp > 0 && (
                <p className="text-[10px] text-slate-500 leading-tight">pd {paidStr}</p>
              )}
            </div>
          </div>

          <ChevronDown
            className={`size-4 text-slate-500 transition-transform shrink-0 ml-1 ${open ? "rotate-180" : ""}`}
          />
        </div>

        {/* ── Expanded panel ── */}
        {open && (
          <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-3">

            {/* Full dates row */}
            <div className="flex gap-3 text-[11px] text-slate-500 bg-white/[0.03] rounded-xl px-3 py-2.5">
              <span>📅 Bill: {formatDate(bill.statementDate)}</span>
              <span className="text-white/10">·</span>
              <span>⏰ Due: {formatDate(bill.dueDate)}</span>
            </div>

            {/* Amount inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 block">
                  Statement ({currency.symbol})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={billVal}
                  onChange={(e) => setBillVal(e.target.value)}
                  className="w-full bg-[#1a2234] border border-white/10 rounded-xl px-3.5 py-3 text-[16px] font-semibold text-white focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 block">
                  Pay now ({currency.symbol})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={payVal}
                  onChange={(e) => { if (!e.target.value.includes("-")) setPayVal(e.target.value); }}
                  className="w-full bg-[#1a2234] border border-white/10 rounded-xl px-3.5 py-3 text-[16px] font-semibold text-white focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Note + Date row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 block">Note</label>
                <input
                  type="text"
                  value={noteVal}
                  onChange={(e) => setNoteVal(e.target.value)}
                  placeholder="e.g. via UPI"
                  className="w-full bg-[#1a2234] border border-white/10 rounded-xl px-3.5 py-3 text-[14px] text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 block">Date</label>
                <input
                  type="date"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="md:hidden w-full bg-[#1a2234] border border-white/10 rounded-xl px-3.5 py-3 text-[14px] text-white focus:border-blue-500 outline-none [color-scheme:dark]"
                />
                <div className="hidden md:block">
                  <DatePicker value={dateVal} onChange={(v) => setDateVal(v)} />
                </div>
              </div>
            </div>

            {/* Status preview */}
            <div className="min-h-[18px]">{renderStatusPreview()}</div>

            {/* Overwrite confirm */}
            {confirmOverwrite && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[12px] text-amber-200">Statement already set. Overwrite it?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmOverwrite(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-[12px] text-slate-300 hover:bg-white/5">Cancel</button>
                  <button onClick={() => handleSaveStatement(true)} className="flex-1 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-[12px] text-amber-200">Overwrite</button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleSaveStatement(false)}
                className="flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 rounded-xl py-3.5 text-[13px] font-medium text-white transition-all active:bg-white/10 min-h-[48px]"
              >
                <Save className="size-4" /> Save statement
              </button>
              <button
                onClick={handleLogPayment}
                className="flex items-center justify-center gap-1.5 bg-blue-500/15 border border-blue-500/25 rounded-xl py-3.5 text-[13px] font-medium text-blue-300 transition-all active:bg-blue-500/25 min-h-[48px]"
              >
                <Plus className="size-4" /> Log payment
              </button>
            </div>

            {/* Payment history */}
            {bill.history && bill.history.length > 0 && (
              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Payment history
                </p>
                <div className="space-y-0">
                  {[...bill.history].reverse().map((h) => (
                    <div key={h.id} className="py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] text-slate-300">
                            {h.date
                              ? new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                              : "—"}
                            {" "}— {fmt(h.amount)}
                            {h.note && <span className="text-slate-500"> · {h.note}</span>}
                          </span>
                        </div>
                        <button
                          onClick={() => setDeleteConfirmId(h.id)}
                          className="shrink-0 p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      {deleteConfirmId === h.id && (
                        <div className="mt-2 rounded-xl border border-red-500/25 bg-red-500/8 p-3 flex items-center justify-between gap-2 animate-in fade-in zoom-in-95 duration-200">
                          <p className="text-[12px] text-red-300">Delete this payment?</p>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 rounded-lg border border-white/10 text-[12px] text-slate-400">No</button>
                            <button
                              onClick={() => { deletePayment(card.id, bill.id, h.id); setDeleteConfirmId(null); showToast("Payment deleted", "success"); }}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-[12px] text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 shadow-2xl text-[13px] font-medium backdrop-blur-md
            ${toast.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
              : "bg-red-500/15 border-red-500/30 text-red-200"}`}
          >
            {toast.type === "success"
              ? <CheckCircle2 className="size-4 shrink-0" />
              : <AlertCircle  className="size-4 shrink-0" />}
            {toast.message}
          </div>
        </div>
      )}
    </>
  );
}
