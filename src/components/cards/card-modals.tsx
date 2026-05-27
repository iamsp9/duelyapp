"use client";

import { useState, useEffect } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { Modal } from "@/components/ui/modal";
import { calculateDueDay } from "@/lib/engine/cards";
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
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Billing Frequency Selector ───────────────────────────────────────────────

interface BillingFrequencySelectorProps {
  value: BillingFrequency;
  onChange: (freq: BillingFrequency) => void;
}

function BillingFrequencySelector({ value, onChange }: BillingFrequencySelectorProps) {
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
            className={`py-2 px-2 rounded-[8px] text-[11px] font-semibold transition-all ${
              value.type === opt.type
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {value.type === 'every_x_months' && (
        <div className="flex items-center gap-2 animate-in fade-in duration-150">
          <label className="text-[12px] text-slate-400 shrink-0">Every</label>
          <input
            type="number"
            min="2"
            max="24"
            value={value.value || 2}
            onChange={(e) => {
              const v = Math.max(2, Math.min(24, parseInt(e.target.value) || 2));
              onChange({ ...value, value: v });
            }}
            className="w-20 bg-[#1a2234] border border-white/10 rounded-[8px] px-3 py-2 text-[14px] text-white outline-none focus:border-blue-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <label className="text-[12px] text-slate-400 shrink-0">months</label>
        </div>
      )}

      {value.type === 'every_x_days' && (
        <div className="flex items-center gap-2 animate-in fade-in duration-150">
          <label className="text-[12px] text-slate-400 shrink-0">Every</label>
          <input
            type="number"
            min="1"
            max="31"
            value={value.value || 7}
            onChange={(e) => {
              const v = Math.max(1, Math.min(31, parseInt(e.target.value) || 7));
              onChange({ ...value, value: v });
            }}
            className="w-20 bg-[#1a2234] border border-white/10 rounded-[8px] px-3 py-2 text-[14px] text-white outline-none focus:border-blue-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <label className="text-[12px] text-slate-400 shrink-0">days</label>
        </div>
      )}
    </div>
  );
}

// ─── Delete Confirmation Sub-view ────────────────────────────────────────────

type DeleteChoice = "none" | "keep" | "purge";

interface DeleteFlowProps {
  cardName: string;
  secret: string | null;
  onConfirm: (keepHistory: boolean) => void;
  onCancel: () => void;
}

function DeleteFlow({ cardName, secret, onConfirm, onCancel }: DeleteFlowProps) {
  const [choice, setChoice] = useState<DeleteChoice>("none");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const handleConfirm = () => {
    if (choice === "none") return;
    if (pin !== secret) {
      setPinError("Incorrect Master PIN.");
      setPin("");
      return;
    }
    onConfirm(choice === "keep");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-4">
      {/* Warning header */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="size-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-red-300">
            Delete &ldquo;{cardName}&rdquo;?
          </p>
          <p className="text-[12px] text-red-400/80 mt-0.5 leading-relaxed">
            This card and its configuration will be permanently removed. What
            should happen to its transaction history?
          </p>
        </div>
      </div>

      {/* Choice tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Keep history → Archive */}
        <button
          type="button"
          onClick={() => setChoice("keep")}
          className={`relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all ${
            choice === "keep"
              ? "border-blue-500/60 bg-blue-500/10"
              : "border-white/10 bg-[#1a2234] hover:bg-white/5"
          }`}
        >
          {choice === "keep" && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-400" />
          )}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15">
            <Archive className="size-4 text-blue-400" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white">Archive History</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Card is deleted but history stays in Archives &amp; Reports.
            </p>
          </div>
        </button>

        {/* Purge everything */}
        <button
          type="button"
          onClick={() => setChoice("purge")}
          className={`relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all ${
            choice === "purge"
              ? "border-red-500/60 bg-red-500/10"
              : "border-white/10 bg-[#1a2234] hover:bg-white/5"
          }`}
        >
          {choice === "purge" && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-400" />
          )}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/15">
            <Trash2 className="size-4 text-red-400" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white">Delete All</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Remove everything — card&nbsp;&amp;&nbsp;all history.
            </p>
          </div>
        </button>
      </div>

      {/* PIN confirmation — shown once a choice is made */}
      {choice !== "none" && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150 space-y-2">
          <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">
            Enter Master PIN to confirm
          </label>
          <input
            type="password"
            value={pin}
            maxLength={6}
            inputMode="numeric"
            autoFocus
            onChange={(e) => {
              setPin(e.target.value);
              setPinError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest text-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="••••••"
          />
          {pinError && (
            <p className="text-[12px] text-red-400 text-center">{pinError}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all hover:bg-white/5 min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={choice === "none" || pin.length < 6}
          className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all min-h-[44px] disabled:opacity-40 ${
            choice === "keep"
              ? "border-blue-500/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
              : "border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30"
          }`}
        >
          {choice === "keep" ? "Archive & Delete" : "Delete Forever"}
        </button>
      </div>
    </div>
  );
}

// ─── Archive Delete Confirmation ──────────────────────────────────────────────

interface ArchiveDeleteFlowProps {
  cardName: string;
  secret: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function ArchiveDeleteFlow({ cardName, secret, onConfirm, onCancel }: ArchiveDeleteFlowProps) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const handleConfirm = () => {
    if (pin !== secret) {
      setPinError("Incorrect Master PIN.");
      setPin("");
      return;
    }
    onConfirm();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-4">
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="size-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-red-300">
            Permanently delete archived &ldquo;{cardName}&rdquo;?
          </p>
          <p className="text-[12px] text-red-400/80 mt-0.5 leading-relaxed">
            All transaction history will be permanently erased. This cannot be undone.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">
          Enter Master PIN to confirm
        </label>
        <input
          type="password"
          value={pin}
          maxLength={6}
          inputMode="numeric"
          autoFocus
          onChange={(e) => {
            setPin(e.target.value);
            setPinError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest text-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="••••••"
        />
        {pinError && (
          <p className="text-[12px] text-red-400 text-center">{pinError}</p>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all hover:bg-white/5 min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pin.length < 6}
          className="flex-1 p-3 rounded-xl border border-red-500/40 bg-red-500/20 text-red-300 text-sm font-medium transition-all hover:bg-red-500/30 min-h-[44px] disabled:opacity-40"
        >
          Delete Forever
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CardModals() {
  const { vault, addCard, updateCard, deleteCard, toggleCardDisabled, removeArchivedCard, secret } =
    useVaultStore();
  const { cards, archivedCards } = vault;

  const {
    isManageCardsOpen,
    setManageCardsOpen,
    isCardFormOpen,
    setCardFormOpen,
    editingCardId,
    setEditingCardId,
  } = useUIStore();

  // Form fields
  const [name, setName] = useState("");
  const [billDay, setBillDay] = useState("");
  const [daysDue, setDaysDue] = useState("");
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>({ type: 'monthly' });
  const [error, setError] = useState("");

  // Whether the delete flow is showing
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);

  // Archive deletion state
  const [deletingArchiveId, setDeletingArchiveId] = useState<string | null>(null);

  // Card being edited (resolved object)
  const editingCard = editingCardId ? cards.find((c) => c.id === editingCardId) : null;

  // Populate form when opening in Edit mode
  useEffect(() => {
    if (isCardFormOpen) {
      if (editingCard) {
        setName(editingCard.name);
        setBillDay(editingCard.billDay?.toString() || "");
        let diff = editingCard.dueDay - editingCard.billDay;
        if (diff <= 0) diff += 30;
        setDaysDue(diff.toString());
        setBillingFrequency(editingCard.billingFrequency || { type: 'monthly' });
      } else {
        setName("");
        setBillDay("");
        setDaysDue("");
        setBillingFrequency({ type: 'monthly' });
      }
      setError("");
      setShowDeleteFlow(false);
    }
  }, [isCardFormOpen, editingCardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const bDay = parseInt(billDay);
  const dDue = parseInt(daysDue);
  const calcDue = bDay && dDue ? calculateDueDay(bDay, dDue) : null;

  const nextBillDate =
    bDay && !isNaN(bDay) && bDay >= 1 && bDay <= 31
      ? (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const thisMonth = new Date(today.getFullYear(), today.getMonth(), bDay);
          return thisMonth >= today ? thisMonth : new Date(today.getFullYear(), today.getMonth() + 1, bDay);
        })()
      : null;

  const nextDueDate =
    bDay && dDue && !isNaN(bDay) && !isNaN(dDue) && bDay >= 1 && bDay <= 31 && dDue >= 1 && dDue <= 60
      ? (() => {
          if (!nextBillDate) return null;
          const due = new Date(nextBillDate);
          due.setDate(due.getDate() + dDue);
          return due;
        })()
      : null;

  const handleSaveCard = () => {
    if (!name.trim()) return setError("Name is required.");
    if (!bDay || bDay < 1 || bDay > 31) return setError("Enter bill date 1–31.");
    if (!dDue || dDue < 1 || dDue > 60) return setError("Enter days until due (1–60).");
    if (!calcDue) return setError("Due date could not be calculated.");

    if (editingCardId) {
      updateCard(editingCardId, {
        name: name.trim(),
        billDay: bDay,
        dueAfterDays: dDue,
        dueDay: calcDue,
        billingFrequency,
      });
    } else {
      addCard({
        id: "c" + Date.now(),
        name: name.trim(),
        billDay: bDay,
        dueAfterDays: dDue,
        dueDay: calcDue,
        billingFrequency,
        totalBill: "",
        status: "unpaid",
        history: [],
        disabled: false,
      });
    }
    setCardFormOpen(false);
    setManageCardsOpen(true);
  };

  const handleDeleteConfirm = (keepHistory: boolean) => {
    deleteCard(editingCardId!, keepHistory);
    setShowDeleteFlow(false);
    setCardFormOpen(false);
    setManageCardsOpen(true);
  };

  const handleToggleDisabled = () => {
    if (!editingCardId) return;
    toggleCardDisabled(editingCardId);
    setCardFormOpen(false);
    setManageCardsOpen(true);
  };

  const deletingArchive = deletingArchiveId
    ? archivedCards.find((a) => a.id === deletingArchiveId)
    : null;

  return (
    <>
      {/* ── Manage Cards Modal ─────────────────────────────────────────────── */}
      <Modal
        open={isManageCardsOpen}
        onClose={() => setManageCardsOpen(false)}
        title="💳 Manage Cards"
      >
        {/* Archive Delete Flow */}
        {deletingArchive ? (
          <ArchiveDeleteFlow
            cardName={deletingArchive.name}
            secret={secret}
            onConfirm={() => {
              removeArchivedCard(deletingArchive.id);
              setDeletingArchiveId(null);
            }}
            onCancel={() => setDeletingArchiveId(null)}
          />
        ) : (
          <>
            {/* Active Cards */}
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto mb-2 pr-1">
              {cards.length > 0 && (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">
                  Active Cards ({cards.length})
                </p>
              )}
              {cards.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-opacity ${
                    c.disabled
                      ? "border-white/5 bg-[#141b2b] opacity-60"
                      : "border-white/10 bg-[#1a2234]"
                  }`}
                >
                  {c.disabled && (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-500" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-white truncate">
                        {c.name}
                      </span>
                      {c.disabled && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Bill {c.billDay}th · Due {c.dueDay}th
                      {c.billingFrequency && c.billingFrequency.type !== 'monthly' && (
                        <span className="ml-1.5 text-blue-400/70">
                          · {c.billingFrequency.type === 'every_x_months' ? `Every ${c.billingFrequency.value}mo` : `Every ${c.billingFrequency.value}d`}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCardId(c.id);
                      setManageCardsOpen(false);
                      setCardFormOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 bg-[#111827] border border-white/10 rounded-[10px] px-3 py-2 text-[12px] font-medium text-white transition-all hover:bg-white/5 active:bg-white/10 shrink-0"
                  >
                    <Pencil className="size-3.5" /> Edit
                  </button>
                </div>
              ))}
              {cards.length === 0 && archivedCards.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">
                  No cards added yet.
                </div>
              )}
            </div>

            {/* Archived Cards Section */}
            {archivedCards.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1 mb-2">
                  Archived ({archivedCards.length})
                </p>
                <div className="flex flex-col gap-2 max-h-[25vh] overflow-y-auto pr-1">
                  {archivedCards.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-white/5 bg-[#141b2b] opacity-70"
                    >
                      <Archive className="size-3.5 text-slate-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-slate-300 truncate block">
                          {a.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Archived · {a.history.length} transactions
                        </span>
                      </div>
                      <button
                        onClick={() => setDeletingArchiveId(a.id)}
                        className="flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2 text-[12px] font-medium text-red-400 transition-all hover:bg-red-500/20 shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setEditingCardId(null);
                setManageCardsOpen(false);
                setCardFormOpen(true);
              }}
              className="mt-3 flex items-center justify-center gap-1.5 w-full bg-[#111827] border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
            >
              <span className="text-[18px]">➕</span> Add new card
            </button>

            <div className="flex gap-2 mt-3.5 pt-3 border-t border-white/10">
              <button
                onClick={() => setManageCardsOpen(false)}
                className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Add / Edit Card Form Modal ─────────────────────────────────────── */}
      <Modal
        open={isCardFormOpen}
        onClose={() => {
          setCardFormOpen(false);
          setManageCardsOpen(true);
        }}
        title={editingCardId ? "✏️ Edit Card" : "➕ Add Card"}
      >
        {/* ── Delete flow overlay ─── */}
        {showDeleteFlow && editingCard ? (
          <DeleteFlow
            cardName={editingCard.name}
            secret={secret}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDeleteFlow(false)}
          />
        ) : (
          <>
            {/* ── Disabled banner (edit mode only) ── */}
            {editingCard?.disabled && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Power className="size-4 text-amber-400 shrink-0" />
                <p className="text-[12px] text-amber-300 leading-relaxed flex-1">
                  This card is currently <strong>disabled</strong>. It won&apos;t
                  appear on the dashboard or in upcoming bills. Pre-disable bills are still visible.
                </p>
              </div>
            )}

            {/* Card Name */}
            <div className="flex flex-col gap-1 mb-3">
              <label className="text-[13px] font-medium text-slate-400">
                Card name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HDFC Millennia"
                className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 w-full outline-none"
              />
            </div>

            {/* Billing Frequency */}
            <div className="flex flex-col gap-2 mb-3">
              <label className="text-[13px] font-medium text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="size-3.5 text-slate-500" />
                Billing frequency
              </label>
              <BillingFrequencySelector
                value={billingFrequency}
                onChange={setBillingFrequency}
              />
            </div>

            {/* Bill Generation Date */}
            <div className="flex flex-col gap-1 mb-3">
              <label className="text-[13px] font-medium text-slate-400">
                Bill generation date{" "}
                <span className="text-slate-500">(day of month, 1–31)</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={billDay}
                onChange={(e) => setBillDay(e.target.value)}
                placeholder="e.g. 13"
                className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Days Until Due */}
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-[13px] font-medium text-slate-400">
                Days until due after bill date{" "}
                <span className="text-slate-500">(1–60)</span>
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={daysDue}
                onChange={(e) => setDaysDue(e.target.value)}
                placeholder="e.g. 20"
                className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Upcoming dates preview */}
            {nextBillDate || nextDueDate ? (
              <div className="mb-4 rounded-[10px] border border-white/10 bg-[#0d1525] overflow-hidden">
                {nextBillDate && (
                  <div className="flex items-center gap-3 px-3.5 py-2.5 border-b border-white/5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/15 shrink-0">
                      <Calendar className="size-3.5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                        Next Bill Date
                      </div>
                      <div className="text-[13px] font-medium text-white">
                        {formatDate(nextBillDate)}
                      </div>
                    </div>
                  </div>
                )}
                {nextDueDate && (
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-orange-500/15 shrink-0">
                      <Clock className="size-3.5 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                        Next Due Date
                      </div>
                      <div className="text-[13px] font-medium text-white">
                        {formatDate(nextDueDate)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 rounded-[10px] border border-dashed border-white/10 bg-[#0d1525] px-3.5 py-3 flex items-center gap-3">
                <Calendar className="size-4 text-slate-600 shrink-0" />
                <span className="text-[12px] text-slate-600">
                  Enter bill day and days-until-due to preview upcoming dates
                </span>
              </div>
            )}

            {error && (
              <div className="text-[13px] text-red-400 mb-2">{error}</div>
            )}

            {/* ── Action row ── */}
            <div className="flex gap-2 mt-3.5 pt-3 border-t border-white/10">
              {/* Cancel */}
              <button
                onClick={() => {
                  setCardFormOpen(false);
                  setManageCardsOpen(true);
                }}
                className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all hover:bg-white/5 min-h-[44px]"
              >
                Cancel
              </button>

              {/* Edit-mode extra controls */}
              {editingCardId && (
                <>
                  {/* Disable / Enable toggle */}
                  <button
                    type="button"
                    onClick={handleToggleDisabled}
                    title={editingCard?.disabled ? "Enable card" : "Disable card"}
                    className={`flex items-center justify-center px-3 rounded-xl border transition-all min-h-[44px] ${
                      editingCard?.disabled
                        ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    }`}
                  >
                    <Power className="size-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setShowDeleteFlow(true)}
                    className="flex items-center justify-center px-3 rounded-xl border border-red-500/30 text-red-400 transition-all hover:bg-red-500/10 min-h-[44px]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}

              {/* Save */}
              <button
                onClick={handleSaveCard}
                className="flex-1 p-3 rounded-xl border border-blue-500 bg-blue-500 text-sm font-medium text-white transition-all hover:bg-blue-600 min-h-[44px]"
              >
                Save
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}