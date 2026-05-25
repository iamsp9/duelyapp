"use client";

import { useState } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { 
  getDueBadge, computeStatus, isActive, getPaidTotal, formatCurrency, getGlowClass 
} from "@/lib/engine/cards";
import type { CreditCard } from "@/types/card";
import { 
  ChevronDown, 
  X, 
  Clock, 
  Check, 
  Save, 
  Plus,
  Trash2
} from "lucide-react";

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
  
  const dotCls = status === 'unpaid' ? 'bg-red-500' : status === 'partial' ? 'bg-orange-500' : 'bg-green-500';
  const billStr = card.totalBill !== '' && card.totalBill != null ? formatCurrency(card.totalBill) : '—';
  const tp = getPaidTotal(card);
  const paidStr = tp > 0 ? formatCurrency(tp) : '—';
  const badge = getDueBadge(card, active);

  const renderStatusPreview = () => {
    const bill = parseFloat(String(billVal)) || parseFloat(String(card.totalBill)) || 0;
    const newAmt = parseFloat(payVal) || 0;
    const proj = tp + newAmt;

    if (billVal !== '' && parseFloat(String(billVal)) === 0) return <span className="text-green-400 text-[12px] flex items-center gap-1"><Check className="size-3.5" /> No payment due — will be marked <b>Paid</b></span>;
    if (!bill && !proj) return null;
    if (bill > 0 && proj >= bill) return <span className="text-green-400 text-[12px] flex items-center gap-1"><Check className="size-3.5" /> Will be marked <b>Paid</b></span>;
    if (proj > 0) return <span className="text-orange-400 text-[12px] flex items-center gap-1"><Clock className="size-3.5" /> <b>Partial</b> — {formatCurrency(proj)} / {formatCurrency(bill)}</span>;
    return <span className="text-red-400 text-[12px] flex items-center gap-1"><X className="size-3.5" /> <b>Unpaid</b></span>;
  };

  const handleSave = () => {
    const updates: any = {
      totalBill: billVal,
      notes: notesText,
    };

    const amt = parseFloat(payVal);
    if (amt && amt > 0) {
      updates.newPayment = { amount: amt, note: noteVal, date: dateVal };
      setPayVal("");
      setNoteVal("");
    }

    updates.logOnly = `${new Date().toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}: bill set ${formatCurrency(billVal || 0)}`;

    saveCardState(card.id, updates);
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
      <div className="flex items-center gap-2.5 p-3.5 cursor-pointer select-none active:bg-white/5" onClick={() => setOpen(!open)}>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-white truncate leading-tight">{card.name}</div>
          <div className="text-[11px] text-slate-400 mt-[1px]">Bill {card.billDay}th · Due {card.dueDay}th</div>
        </div>
        <div className={`text-[11px] px-2 py-1 rounded-md font-semibold whitespace-nowrap shrink-0 ${badge.classes}`}>
          {badge.text}
        </div>
        <div className="text-right shrink-0 ml-1">
          <div className="text-sm font-semibold text-white">{billStr}</div>
          <div className="text-[11px] text-slate-400">pd {paidStr}</div>
        </div>
        <ChevronDown className={`size-[18px] text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="p-3.5 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400">Total bill (₹)</label>
              <input 
                type="number" 
                inputMode="decimal" 
                value={billVal} 
                onChange={e => setBillVal(e.target.value)} 
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
                onChange={e => {
                  if (e.target.value.includes('-')) return; // strictly prevents negative inputs
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
              <input type="text" value={noteVal} onChange={e => setNoteVal(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 outline-none w-full" placeholder="e.g. via UPI" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400">Payment date</label>
              <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 outline-none w-full" />
            </div>
          </div>

          <div className="mb-2 min-h-[18px]">{renderStatusPreview()}</div>

          <div className="flex gap-1.5 mb-2.5">
            <button 
              onClick={() => setOverride('unpaid')} 
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] border text-[11px] font-semibold transition-all active:scale-95 min-h-[40px] ${status === 'unpaid' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}
            >
              <X className="size-3.5" /> Unpaid
            </button>
            <button 
              onClick={() => setOverride('partial')} 
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] border text-[11px] font-semibold transition-all active:scale-95 min-h-[40px] ${status === 'partial' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}
            >
              <Clock className="size-3.5" /> Partial
            </button>
            <button 
              onClick={() => setOverride('paid')} 
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] border text-[11px] font-semibold transition-all active:scale-95 min-h-[40px] ${status === 'paid' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}
            >
              <Check className="size-3.5" /> Paid
            </button>
          </div>

          <div className="flex flex-col gap-1 mb-2.5">
            <label className="text-xs font-medium text-slate-400">Notes</label>
            <textarea value={notesText} onChange={e => setNotesText(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 outline-none min-h-[60px] w-full" placeholder="Optional notes..."></textarea>
          </div>

          <div className="flex gap-2 mb-2.5">
            <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/10 min-h-[44px]">
              <Save className="size-4" /> Save
            </button>
            <button onClick={handleLogPayment} className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/10 min-h-[44px]">
              <Plus className="size-4" /> Log Payment
            </button>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-white/10">
            <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Payment History</div>
            <div>
              {!(card.history && card.history.length) ? (
                <div className="text-[12px] text-slate-500 py-1.5">No payments yet</div>
              ) : (
                [...card.history].reverse().map((h, ri) => {
                  const idx = card.history!.length - 1 - ri;
                  return (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-white/5 text-[12px] text-slate-300 gap-2">
                      <span className="flex-1 leading-[1.35]">
                        {h.amount ? `📅 ${h.date || '—'} — ${formatCurrency(h.amount)}${h.note ? ' · ' + h.note : ''}` : (h.text || h)}
                      </span>
                      <button onClick={() => deleteHistoryItem(card.id, idx)} className="text-red-400 p-1 shrink-0 flex items-center justify-center min-w-[30px] min-h-[30px] hover:bg-white/5 rounded-md transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            {tp > 0 && <div className="text-[13px] font-semibold text-white pt-2 mt-1 border-t border-white/10">Total paid after bill generation: {formatCurrency(tp)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}