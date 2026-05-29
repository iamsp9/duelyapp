// src/components/cards/card-item.tsx
"use client";

import { useState } from "react";
import { useVaultStore } from "@/stores/vault-store";
import {
  getDueBadge,
  computeBillStatus,
  getPaidTotal,
  formatCurrency,
  getDTD
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
  AlertCircle
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface Props {
  card: CreditCard;
  bill: BillCycle;
}

// Local UI Helper for the Glow effect based on true Bill DTD
function getGlowClass(bill: BillCycle) {
  if (computeBillStatus(bill) === 'paid') return 'border-white/10';
  const d = getDTD(bill);
  if (d < 0 || d <= 2) return 'border-red-500/80 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]';
  if (d <= 5) return 'border-orange-500/80 shadow-[0_0_0_3px_rgba(249,115,22,0.1)]';
  if (d <= 7) return 'border-yellow-500/80 shadow-[0_0_0_3px_rgba(234,179,8,0.1)]';
  return 'border-white/10';
}

export function CardItem({ card, bill }: Props) {
  const { updateBill, deletePayment } = useVaultStore();

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  // Initialize UI state from the specific bill
  const [billVal, setBillVal] = useState<string | number>(bill.billedAmount || "");
  const [payVal, setPayVal] = useState("");
  const [noteVal, setNoteVal] = useState("");
  const [dateVal, setDateVal] = useState(new Date().toISOString().slice(0, 10));

  const status = computeBillStatus(bill);
  const glowClass = getGlowClass(bill);

  const dotCls =
    status === "unpaid" ? "bg-red-500"
      : status === "partial" ? "bg-orange-500"
      : "bg-green-500";

  const billStr =
    bill.billedAmount !== "" && bill.billedAmount != null
      ? formatCurrency(bill.billedAmount)
      : "—";

  const tp = getPaidTotal(bill);
  const paidStr = tp > 0 ? formatCurrency(tp) : "—";
  const badge = getDueBadge(bill);

  const formatExactDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const renderStatusPreview = () => {
    const billAmt = parseFloat(String(billVal)) || parseFloat(String(bill.billedAmount)) || 0;
    const newAmt = parseFloat(payVal) || 0;
    const proj = tp + newAmt;

    if (billVal !== "" && parseFloat(String(billVal)) === 0)
      return (
        <span className="text-green-400 text-[12px] flex items-center gap-1">
          <Check className="size-3.5" /> No payment due — will be marked <b>Paid</b>
        </span>
      );

    if (!billAmt && !proj) return null;

    if (billAmt > 0 && proj >= billAmt)
      return (
        <span className="text-green-400 text-[12px] flex items-center gap-1">
          <Check className="size-3.5" /> Will be marked <b>Paid</b>
        </span>
      );

    if (proj > 0)
      return (
        <span className="text-orange-400 text-[12px] flex items-center gap-1">
          <Clock className="size-3.5" /> <b>Partial</b> — {formatCurrency(proj)} / {formatCurrency(billAmt)}
        </span>
      );

    return (
      <span className="text-red-400 text-[12px] flex items-center gap-1">
        <X className="size-3.5" /> <b>Unpaid</b>
      </span>
    );
  };

  const handleSaveStatement = (isConfirmed = false) => {
    if (bill.billedAmount !== "" && !isConfirmed) {
      setConfirmOverwrite(true);
      return;
    }

    updateBill(card.id, bill.id, { billedAmount: billVal });

    setConfirmOverwrite(false);
    setOpen(false);
    showToast("Statement Saved", "success");
  };

  const handleLogPayment = () => {
    const amt = parseFloat(payVal);
    if (!amt || amt <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }

    updateBill(card.id, bill.id, {
      newPayment: { amount: amt, note: noteVal, date: dateVal },
    });

    setPayVal("");
    setNoteVal("");
    setOpen(false);
    showToast("Payment Logged", "success");
  };

  return (
    <>
      <div className={`rounded-2xl border bg-[#111827] overflow-hidden transition-all ${glowClass}`}>
        <div
          className="flex items-center gap-2.5 p-3.5 cursor-pointer select-none active:bg-white/5"
          onClick={() => setOpen(!open)}
        >
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-white truncate leading-tight">
              {card.name}
            </div>

            <div className="text-[11px] text-slate-400 mt-[1px]">
              Bill: {formatExactDate(bill.statementDate)} · Due: {formatExactDate(bill.dueDate)}
            </div>
          </div>

          <div className={`text-[11px] px-2 py-1 rounded-md font-semibold whitespace-nowrap shrink-0 ${badge.classes}`}>
            {badge.text}
          </div>

          <div className="text-right shrink-0 ml-1">
            <div className="text-sm font-semibold text-white">{billStr}</div>
            <div className="text-[11px] text-slate-400">pd {paidStr}</div>
          </div>

          <ChevronDown className={`size-[18px] text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
        </div>

        {open && (
          <div className="p-3.5 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400">Statement Amount (₹)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={billVal}
                  onChange={(e) => setBillVal(e.target.value)}
                  className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400">Add payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={payVal}
                  onChange={(e) => {
                    if (e.target.value.includes("-")) return;
                    setPayVal(e.target.value);
                  }}
                  className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400">Note (optional)</label>
                <input
                  type="text"
                  value={noteVal}
                  onChange={(e) => setNoteVal(e.target.value)}
                  className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 outline-none w-full"
                  placeholder="e.g. via UPI"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400">Payment date</label>
                <input
                  type="date"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="md:hidden bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 outline-none w-full [color-scheme:dark]"
                />
                <div className="hidden md:block">
                  <DatePicker value={dateVal} onChange={(val) => setDateVal(val)} />
                </div>
              </div>
            </div>

            <div className="mb-2 min-h-[18px]">{renderStatusPreview()}</div>

            {confirmOverwrite && (
              <div className="mb-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-xs text-amber-200">Statement is already set. Overwrite it?</div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setConfirmOverwrite(false)} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-300 hover:bg-white/5 transition-all">Cancel</button>
                  <button onClick={() => handleSaveStatement(true)} className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-xs text-amber-200 hover:bg-amber-500/30 transition-all">Overwrite</button>
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-2.5">
              <button
                onClick={() => handleSaveStatement(false)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/10 min-h-[44px]"
              >
                <Save className="size-4" /> Save Statement
              </button>

              <button
                onClick={handleLogPayment}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/10 min-h-[44px]"
              >
                <Plus className="size-4" /> Log Payment
              </button>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-white/10">
              <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Payment History
              </div>

              <div>
                {!(bill.history && bill.history.length) ? (
                  <div className="text-[12px] text-slate-500 py-1.5">No payments yet</div>
                ) : (
                  [...bill.history].reverse().map((h) => (
                    <div key={h.id} className="py-1.5 border-b border-white/5">
                      <div className="flex items-center justify-between text-[12px] text-slate-300 gap-2">
                        <span className="flex-1 leading-[1.35]">
                          📅 {formatExactDate(h.date)} — {formatCurrency(h.amount)} {h.note ? " · " + h.note : ""}
                        </span>

                        <button
                          onClick={() => setDeleteConfirmId(h.id)}
                          className="text-red-400 p-1 shrink-0 flex items-center justify-center min-w-[30px] min-h-[30px] hover:bg-white/5 rounded-md transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {deleteConfirmId === h.id && (
                        <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-center justify-between gap-3">
                          <div className="text-xs text-red-200">Delete this payment?</div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-300 hover:bg-white/5">Cancel</button>
                            <button
                              onClick={() => {
                                deletePayment(card.id, bill.id, h.id);
                                setDeleteConfirmId(null);
                                showToast("Payment Deleted", "success");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-xs text-red-200 hover:bg-red-500/30"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100]">
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md text-sm font-medium transition-all ${toast.type === "success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200" : "bg-red-500/15 border-red-500/30 text-red-200"}`}>
            {toast.type === "success" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
            {toast.message}
          </div>
        </div>
      )}
    </>
  );
}