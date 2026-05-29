// src/components/cards/card-modals.tsx
"use client";

import { useState, useEffect } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { Modal } from "@/components/ui/modal";
import type { BillingFrequency } from "@/types/card";
import {
  Pencil,
  Calendar,
  Clock,
  Power,
  Trash2,
  Archive,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// ─── Date Utilities ─────────────────────────────────────────────────────────
function getNextDateForDay(dayOfMonth: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth();
  const thisMonth = new Date(year, month, dayOfMonth);
  if (thisMonth >= today) return thisMonth;
  return new Date(year, month + 1, dayOfMonth);
}

function getNextDueDate(billDay: number, daysUntilDue: number): Date {
  const next = getNextDateForDay(billDay);
  const due = new Date(next);
  due.setDate(due.getDate() + daysUntilDue);
  return due;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── Billing Frequency Selector ───────────────────────────────────────────────
function BillingFrequencySelector({ value, onChange }: { value: BillingFrequency; onChange: (freq: BillingFrequency) => void }) {
  const options: { type: BillingFrequency['type']; label: string }[] = [
    { type: 'monthly', label: 'Monthly' },
    { type: 'every_x_months', label: 'Every X Months' },
    { type: 'every_x_days', label: 'Every X Days' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0d1525] rounded-[10px] border border-white/10">
        {options.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => onChange({ ...value, type: opt.type, value: opt.type === 'monthly' ? undefined : (value.value || (opt.type === 'every_x_months' ? 2 : 7)) })}
            className={`py-2 px-2 rounded-[8px] text-[11px] font-semibold transition-all ${value.type === opt.type ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value.type === 'every_x_months' && (
        <div className="flex items-center gap-2 animate-in fade-in duration-150">
          <label className="text-[12px] text-slate-400 shrink-0">Every</label>
          <input type="number" min="2" max="24" value={value.value || 2} onChange={(e) => { const v = Math.max(2, Math.min(24, parseInt(e.target.value) || 2)); onChange({ ...value, value: v }); }} className="w-20 bg-[#1a2234] border border-white/10 rounded-[8px] px-3 py-2 text-[14px] text-white outline-none focus:border-blue-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <label className="text-[12px] text-slate-400 shrink-0">months</label>
        </div>
      )}
      {value.type === 'every_x_days' && (
        <div className="flex items-center gap-2 animate-in fade-in duration-150">
          <label className="text-[12px] text-slate-400 shrink-0">Every</label>
          <input type="number" min="1" max="31" value={value.value || 7} onChange={(e) => { const v = Math.max(1, Math.min(31, parseInt(e.target.value) || 7)); onChange({ ...value, value: v }); }} className="w-20 bg-[#1a2234] border border-white/10 rounded-[8px] px-3 py-2 text-[14px] text-white outline-none focus:border-blue-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <label className="text-[12px] text-slate-400 shrink-0">days</label>
        </div>
      )}
    </div>
  );
}

// ─── Delete Confirmation Sub-view ────────────────────────────────────────────
function DeleteFlow({ cardName, secret, onConfirm, onCancel }: { cardName: string; secret: string | null; onConfirm: (keepHistory: boolean) => void; onCancel: () => void }) {
  const [choice, setChoice] = useState<"none" | "keep" | "purge">("none");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const handleConfirm = () => {
    if (choice === "none") return;
    if (pin !== secret) { setPinError("Incorrect Master PIN."); setPin(""); return; }
    onConfirm(choice === "keep");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-4">
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="size-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-red-300">Delete &ldquo;{cardName}&rdquo;?</p>
          <p className="text-[12px] text-red-400/80 mt-0.5 leading-relaxed">This card will be removed. What should happen to its statement history?</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={() => setChoice("keep")} className={`relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all ${choice === "keep" ? "border-blue-500/60 bg-blue-500/10" : "border-white/10 bg-[#1a2234] hover:bg-white/5"}`}>
          {choice === "keep" && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-400" />}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15"><Archive className="size-4 text-blue-400" /></div>
          <div>
            <p className="text-[12px] font-semibold text-white">Keep Statements</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Card is deleted but fully paid statements stay in Archives.</p>
          </div>
        </button>
        <button type="button" onClick={() => setChoice("purge")} className={`relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all ${choice === "purge" ? "border-red-500/60 bg-red-500/10" : "border-white/10 bg-[#1a2234] hover:bg-white/5"}`}>
          {choice === "purge" && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-400" />}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/15"><Trash2 className="size-4 text-red-400" /></div>
          <div>
            <p className="text-[12px] font-semibold text-white">Delete All</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Remove everything — card&nbsp;&amp;&nbsp;all statements.</p>
          </div>
        </button>
      </div>
      {choice !== "none" && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150 space-y-2">
          <input type="password" value={pin} maxLength={6} inputMode="numeric" autoFocus onChange={(e) => { setPin(e.target.value); setPinError(""); }} onKeyDown={(e) => e.key === "Enter" && handleConfirm()} className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest text-lg focus:border-red-500 focus:outline-none" placeholder="Enter PIN" />
          {pinError && <p className="text-[12px] text-red-400 text-center">{pinError}</p>}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white min-h-[44px]">Cancel</button>
        <button type="button" onClick={handleConfirm} disabled={choice === "none" || pin.length < 6} className={`flex-1 p-3 rounded-xl border text-sm font-medium min-h-[44px] disabled:opacity-40 ${choice === "keep" ? "border-blue-500/40 bg-blue-500/20 text-blue-300" : "border-red-500/40 bg-red-500/20 text-red-300"}`}>{choice === "keep" ? "Archive & Delete" : "Delete Forever"}</button>
      </div>
    </div>
  );
}

// ─── Archive Delete Confirmation ──────────────────────────────────────────────
function ArchiveDeleteFlow({ cardName, secret, onConfirm, onCancel }: { cardName: string; secret: string | null; onConfirm: () => void; onCancel: () => void }) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const handleConfirm = () => {
    if (pin !== secret) { setPinError("Incorrect Master PIN."); setPin(""); return; }
    onConfirm();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-4">
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="size-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-red-300">Permanently delete archived card &ldquo;{cardName}&rdquo;?</p>
          <p className="text-[12px] text-red-400/80 mt-0.5 leading-relaxed">All retained history for this card will be permanently erased. This cannot be undone.</p>
        </div>
      </div>
      <div className="space-y-2">
        <input type="password" value={pin} maxLength={6} inputMode="numeric" autoFocus onChange={(e) => { setPin(e.target.value); setPinError(""); }} onKeyDown={(e) => e.key === "Enter" && handleConfirm()} className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest text-lg focus:border-red-500 focus:outline-none" placeholder="Enter PIN" />
        {pinError && <p className="text-[12px] text-red-400 text-center">{pinError}</p>}
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white min-h-[44px]">Cancel</button>
        <button type="button" onClick={handleConfirm} disabled={pin.length < 6} className="flex-1 p-3 rounded-xl border border-red-500/40 bg-red-500/20 text-red-300 text-sm font-medium min-h-[44px] disabled:opacity-40">Delete Forever</button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function CardModals() {
  const cards = useVaultStore((s) => s.vault.cards || []);
  const archiveVault = useVaultStore((s) => s.archiveVault);
  const deletedCards = archiveVault?.deletedCards || [];
  const secret = useVaultStore((s) => s.secret);
  
  const addCard = useVaultStore((s) => s.addCard);
  const updateCard = useVaultStore((s) => s.updateCard);
  const deleteCard = useVaultStore((s) => s.deleteCard);
  const toggleCardDisabled = useVaultStore((s) => s.toggleCardDisabled);
  const removeArchivedCard = useVaultStore((s) => s.removeArchivedCard);

  const { isManageCardsOpen, setManageCardsOpen, isCardFormOpen, setCardFormOpen, editingCardId, setEditingCardId } = useUIStore();

  const [name, setName] = useState("");
  const [billDay, setBillDay] = useState("");
  const [daysDue, setDaysDue] = useState("");
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>({ type: 'monthly' });
  const [error, setError] = useState("");

  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [deletingArchiveId, setDeletingArchiveId] = useState<string | null>(null);

  const editingCard = editingCardId ? cards.find((c) => c.id === editingCardId) : null;

  useEffect(() => {
    if (isCardFormOpen) {
      if (editingCard) {
        setName(editingCard.name);
        setBillDay(editingCard.billDay?.toString() || "");
        setDaysDue(editingCard.dueAfterDays?.toString() || "");
        setBillingFrequency(editingCard.billingFrequency || { type: 'monthly' });
      } else {
        setName(""); setBillDay(""); setDaysDue(""); setBillingFrequency({ type: 'monthly' });
      }
      setError(""); setShowDeleteFlow(false);
    }
  }, [isCardFormOpen, editingCardId, editingCard]); 

  const bDay = parseInt(billDay);
  const dDue = parseInt(daysDue);

  const nextBillDate = bDay && !isNaN(bDay) && bDay >= 1 && bDay <= 31 ? (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), bDay);
    return thisMonth >= today ? thisMonth : new Date(today.getFullYear(), today.getMonth() + 1, bDay);
  })() : null;

  const nextDueDate = bDay && dDue && !isNaN(bDay) && !isNaN(dDue) && bDay >= 1 && bDay <= 31 && dDue >= 1 && dDue <= 60 ? (() => {
    if (!nextBillDate) return null;
    const due = new Date(nextBillDate); due.setDate(due.getDate() + dDue); return due;
  })() : null;

  const handleSaveCard = () => {
    if (!name.trim()) return setError("Name is required.");
    if (!bDay || bDay < 1 || bDay > 31) return setError("Enter bill date 1–31.");
    if (!dDue || dDue < 1 || dDue > 60) return setError("Enter days until due (1–60).");

    if (editingCardId) {
      updateCard(editingCardId, { name: name.trim(), billDay: bDay, dueAfterDays: dDue, billingFrequency });
    } else {
      addCard({ id: "c-" + Date.now(), name: name.trim(), billDay: bDay, dueAfterDays: dDue, billingFrequency, activeBills: [], disabled: false });
    }
    setCardFormOpen(false); setManageCardsOpen(true);
  };

  const handleDeleteConfirm = (keepHistory: boolean) => {
    if (editingCardId) deleteCard(editingCardId, keepHistory);
    setShowDeleteFlow(false); setCardFormOpen(false); setManageCardsOpen(true);
  };

  const deletingArchiveCard = deletingArchiveId ? deletedCards.find((a) => a.id === deletingArchiveId) : null;

  return (
    <>
      <Modal open={isManageCardsOpen} onClose={() => setManageCardsOpen(false)} title="💳 Manage Cards">
        {deletingArchiveCard ? (
          <ArchiveDeleteFlow
            cardName={deletingArchiveCard.name}
            secret={secret}
            onConfirm={() => { removeArchivedCard(deletingArchiveCard.id); setDeletingArchiveId(null); }}
            onCancel={() => setDeletingArchiveId(null)}
          />
        ) : (
          <>
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto mb-2 pr-1">
              {cards.map((c) => (
                <div key={c.id} className={`flex items-center gap-2.5 p-3 rounded-xl border transition-opacity ${c.disabled ? "border-white/5 bg-[#141b2b] opacity-60" : "border-white/10 bg-[#1a2234]"}`}>
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-medium text-white truncate">{c.name}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">Bill {getOrdinal(c.billDay)} · Due after {c.dueAfterDays} days</div>
                  </div>
                  <button onClick={() => { setEditingCardId(c.id); setManageCardsOpen(false); setCardFormOpen(true); }} className="flex items-center gap-1.5 bg-[#111827] border border-white/10 rounded-[10px] px-3 py-2 text-[12px] font-medium text-white hover:bg-white/5 shrink-0">
                    <Pencil className="size-3.5" /> Edit
                  </button>
                </div>
              ))}
            </div>

            {deletedCards.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1 mb-2">Archived Cards ({deletedCards.length})</p>
                <div className="flex flex-col gap-2 max-h-[25vh] overflow-y-auto pr-1">
                  {deletedCards.map((dc) => (
                    <div key={dc.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-white/5 bg-[#141b2b] opacity-70">
                      <Archive className="size-3.5 text-slate-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-slate-300 truncate block">{dc.name}</span>
                        <span className="text-[11px] text-slate-500">Deleted: {new Date(dc.deletedAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <button onClick={() => setDeletingArchiveId(dc.id)} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2 text-[12px] text-red-400 hover:bg-red-500/20 shrink-0">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button onClick={() => { setEditingCardId(null); setManageCardsOpen(false); setCardFormOpen(true); }} className="mt-3 flex items-center justify-center gap-1.5 w-full bg-[#111827] border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/5 min-h-[44px]">
              <span className="text-[18px]">➕</span> Add new card
            </button>
          </>
        )}
      </Modal>

      <Modal open={isCardFormOpen} onClose={() => { setCardFormOpen(false); setManageCardsOpen(true); }} title={editingCardId ? "✏️ Edit Card" : "➕ Add Card"}>
        {showDeleteFlow && editingCard ? (
          <DeleteFlow cardName={editingCard.name} secret={secret} onConfirm={handleDeleteConfirm} onCancel={() => setShowDeleteFlow(false)} />
        ) : (
          <>
            {editingCard?.disabled && (
              <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Power className="size-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-300 leading-relaxed flex-1">
                  This card is currently <strong>disabled</strong>. New statements will <strong>not</strong> be automatically generated on the billing date. Past statements remain visible.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-[13px] font-medium text-slate-400">Card name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Millennia" className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 w-full outline-none" />
            </div>

            <div className="flex flex-col gap-2 mb-3">
              <label className="text-[13px] font-medium text-slate-400 flex items-center gap-1.5"><RefreshCw className="size-3.5 text-slate-500" /> Billing frequency</label>
              <BillingFrequencySelector value={billingFrequency} onChange={setBillingFrequency} />
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-[13px] font-medium text-slate-400">Bill generation date <span className="text-slate-500">(day of month, 1–31)</span></label>
              <input type="number" min="1" max="31" value={billDay} onChange={(e) => setBillDay(e.target.value)} placeholder="e.g. 13" className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-[13px] font-medium text-slate-400">Days until due after bill date <span className="text-slate-500">(1–60)</span></label>
              <input type="number" min="1" max="60" value={daysDue} onChange={(e) => setDaysDue(e.target.value)} placeholder="e.g. 20" className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>

            {nextBillDate || nextDueDate ? (
              <div className="mb-4 rounded-[10px] border border-white/10 bg-[#0d1525] overflow-hidden">
                {nextBillDate && (
                  <div className="flex items-center gap-3 px-3.5 py-2.5 border-b border-white/5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/15 shrink-0"><Calendar className="size-3.5 text-blue-400" /></div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Next Bill Date</div>
                      <div className="text-[13px] font-medium text-white">{formatDate(nextBillDate)}</div>
                    </div>
                  </div>
                )}
                {nextDueDate && (
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-orange-500/15 shrink-0"><Clock className="size-3.5 text-orange-400" /></div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Next Due Date</div>
                      <div className="text-[13px] font-medium text-white">{formatDate(nextDueDate)}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 rounded-[10px] border border-dashed border-white/10 bg-[#0d1525] px-3.5 py-3 flex items-center gap-3">
                <Calendar className="size-4 text-slate-600 shrink-0" />
                <span className="text-[12px] text-slate-600">Enter bill day and days-until-due to preview dates</span>
              </div>
            )}

            {error && <div className="text-[13px] text-red-400 mb-2">{error}</div>}

            <div className="flex gap-2 mt-3.5 pt-3 border-t border-white/10">
              <button onClick={() => { setCardFormOpen(false); setManageCardsOpen(true); }} className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all hover:bg-white/5 min-h-[44px]">Cancel</button>

              {editingCardId && (
                <>
                  <button type="button" onClick={() => { toggleCardDisabled(editingCardId); setCardFormOpen(false); setManageCardsOpen(true); }} title={editingCard?.disabled ? "Enable card" : "Disable card"} className={`flex items-center justify-center px-3 rounded-xl border transition-all min-h-[44px] ${editingCard?.disabled ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"}`}><Power className="size-4" /></button>
                  <button type="button" onClick={() => setShowDeleteFlow(true)} className="flex items-center justify-center px-3 rounded-xl border border-red-500/30 text-red-400 transition-all hover:bg-red-500/10 min-h-[44px]"><Trash2 className="size-4" /></button>
                </>
              )}

              <button onClick={handleSaveCard} className="flex-1 p-3 rounded-xl border border-blue-500 bg-blue-500 text-sm font-medium text-white transition-all hover:bg-blue-600 min-h-[44px]">Save</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}