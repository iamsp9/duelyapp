"use client";

import { useState } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { 
  getDueBadge, computeStatus, isActive, getPaidTotal, formatCurrency, getGlowClass 
} from "@/lib/engine/cards";
import type { CreditCard } from "@/types/card";

interface Props { card: CreditCard; }

export function CardItem({ card }: Props) {
  const { saveCardState, deleteHistoryItem } = useVaultStore();
  const [open, setOpen] = useState(false);

  const [billVal, setBillVal] = useState(card.totalBill || "");
  const [payVal, setPayVal] = useState("");
  const [noteVal, setNoteVal] = useState("");
  const [dateVal, setDateVal] = useState(new Date().toISOString().slice(0, 10));
  const [notesText, setNotesText] = useState(card.notes || "");

  const active = isActive(card);
  const status = computeStatus(card);
  const glowClass = getGlowClass(card, active);
  
  const dotCls = status === 'unpaid' ? 'bg-red-400' : status === 'partial' ? 'bg-orange-400' : 'bg-green-400';
  const billStr = card.totalBill !== '' && card.totalBill != null ? formatCurrency(card.totalBill) : '—';
  const tp = getPaidTotal(card);
  const paidStr = tp > 0 ? formatCurrency(tp) : '—';
  const badge = getDueBadge(card, active);

  const renderStatusPreview = () => {
    const bill = parseFloat(String(billVal)) || parseFloat(String(card.totalBill)) || 0;
    const newAmt = parseFloat(payVal) || 0;
    const proj = tp + newAmt;

    if (billVal !== '' && parseFloat(String(billVal)) === 0) return <span className="text-green-400">✓ No payment due — will be marked <b>Paid</b></span>;
    if (!bill && !proj) return null;
    if (bill > 0 && proj >= bill) return <span className="text-green-400">✓ Will be marked <b>Paid</b></span>;
    if (proj > 0) return <span className="text-orange-400">⏳ <b>Partial</b> — {formatCurrency(proj)} / {formatCurrency(bill)}</span>;
    return <span className="text-red-400">✕ <b>Unpaid</b></span>;
  };

  const handleSave = () => {
    saveCardState(card.id, {
      totalBill: billVal,
      notes: notesText,
      logOnly: `${new Date().toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}: bill set ${formatCurrency(billVal || 0)}`
    });
  };

  const handleLogPayment = () => {
    const amt = parseFloat(payVal);
    if (!amt || amt <= 0) return alert("Enter a valid amount.");
    saveCardState(card.id, {
      newPayment: { amount: amt, note: noteVal, date: dateVal }
    });
    setPayVal("");
    setNoteVal("");
  };

  const setOverride = (st: string) => {
    saveCardState(card.id, { statusOverride: st });
  };

  return (
    <div className={`rounded-2xl border bg-[#111827] overflow-hidden transition-all ${glowClass}`}>
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-white/5" onClick={() => setOpen(!open)}>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-white truncate">{card.name}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Bill {card.billDay}th · Due {card.dueDay}th</div>
        </div>
        <div className={`text-[11px] px-2 py-1 rounded-md font-semibold whitespace-nowrap shrink-0 ${badge.classes}`}>
          {badge.text}
        </div>
        <div className="text-right shrink-0 ml-2">
          <div className="text-sm font-semibold text-white">{billStr}</div>
          <div className="text-[11px] text-slate-400">pd {paidStr}</div>
        </div>
        <div className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</div>
      </div>

      {open && (
        <div className="p-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400">Total bill (₹)</label>
              <input type="number" value={billVal} onChange={e => setBillVal(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="0" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400">Add payment (₹)</label>
              <input type="number" value={payVal} onChange={e => setPayVal(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400">Note (optional)</label>
              <input type="text" value={noteVal} onChange={e => setNoteVal(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. via UPI" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400">Payment date</label>
              <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" />
            </div>
          </div>

          <div className="text-xs mb-3 min-h-[18px]">{renderStatusPreview()}</div>

          <div className="flex gap-2 mb-3">
            <button onClick={() => setOverride('unpaid')} className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${status === 'unpaid' ? 'bg-red-900/20 border-red-500 text-red-400' : 'border-white/10 text-slate-400'}`}>✕ Unpaid</button>
            <button onClick={() => setOverride('partial')} className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${status === 'partial' ? 'bg-orange-900/20 border-orange-500 text-orange-400' : 'border-white/10 text-slate-400'}`}>⏳ Partial</button>
            <button onClick={() => setOverride('paid')} className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${status === 'paid' ? 'bg-green-900/20 border-green-500 text-green-400' : 'border-white/10 text-slate-400'}`}>✓ Paid</button>
          </div>

          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium text-slate-400">Notes</label>
            <textarea value={notesText} onChange={e => setNotesText(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none min-h-[60px]" placeholder="Optional notes..."></textarea>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={handleSave} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 text-sm font-medium text-white hover:bg-white/10">Save</button>
            <button onClick={handleLogPayment} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 text-sm font-medium text-white hover:bg-white/10">Log Payment</button>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment History</div>
            <div>
              {!(card.history && card.history.length) ? (
                <div className="text-xs text-slate-500 py-1">No payments yet</div>
              ) : (
                [...card.history].reverse().map((h, ri) => {
                  const idx = card.history!.length - 1 - ri;
                  return (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 text-xs text-slate-300">
                      <span className="flex-1 leading-relaxed">
                        {h.amount ? `📅 ${h.date || '—'} — ${formatCurrency(h.amount)}${h.note ? ' · ' + h.note : ''}` : (h.text || h)}
                      </span>
                      <button onClick={() => deleteHistoryItem(card.id, idx)} className="text-red-400 p-1 shrink-0">🗑</button>
                    </div>
                  );
                })
              )}
            </div>
            {tp > 0 && <div className="text-sm font-semibold text-white pt-2 mt-1 border-t border-white/10">Total paid after bill generation: {formatCurrency(tp)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}