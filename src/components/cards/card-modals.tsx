"use client";

import { useState, useEffect } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { Modal } from "@/components/ui/modal";
import { calculateDueDay } from "@/lib/engine/cards";
import {
  Pencil,
  Calendar,
  Clock,
  Power,
  Trash2,
  Archive,
  AlertTriangle,
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
        {/* Keep history */}
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
            <p className="text-[12px] font-semibold text-white">Keep History</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Transaction data stays available in Reports.
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function CardModals() {
  const { vault, addCard, updateCard, deleteCard, toggleCardDisabled, secret } =
    useVaultStore();
  const { cards } = vault;

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
  const [error, setError] = useState("");

  // Whether the delete flow is showing
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);

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
      } else {
        setName("");
        setBillDay("");
        setDaysDue("");
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
      ? getNextDateForDay(bDay)
      : null;

  const nextDueDate =
    bDay && dDue && !isNaN(bDay) && !isNaN(dDue) && bDay >= 1 && bDay <= 31 && dDue >= 1 && dDue <= 60
      ? getNextDueDate(bDay, dDue)
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
      });
    } else {
      addCard({
        id: "c" + Date.now(),
        name: name.trim(),
        billDay: bDay,
        dueAfterDays: dDue,
        dueDay: calcDue,
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
    // Reflect new value in the form immediately
    setCardFormOpen(false);
    setManageCardsOpen(true);
  };

  return (
    <>
      {/* ── Manage Cards Modal ─────────────────────────────────────────────── */}
      <Modal
        open={isManageCardsOpen}
        onClose={() => setManageCardsOpen(false)}
        title="💳 Manage Cards"
      >
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto mb-2 pr-1">
          {cards.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-opacity ${
                c.disabled
                  ? "border-white/5 bg-[#141b2b] opacity-60"
                  : "border-white/10 bg-[#1a2234]"
              }`}
            >
              {/* Disabled indicator dot */}
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
          {cards.length === 0 && (
            <div className="text-sm text-slate-500 text-center py-4">
              No cards added yet.
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setEditingCardId(null);
            setManageCardsOpen(false);
            setCardFormOpen(true);
          }}
          className="mt-1 flex items-center justify-center gap-1.5 w-full bg-[#111827] border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
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
                  This card is currently <strong>disabled</strong>. It won't
                  appear on the dashboard or affect summaries.
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