"use client";

import { useState, useEffect } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { Modal } from "@/components/ui/modal";
import { calculateDueDay } from "@/lib/engine/cards";
import { Pencil } from "lucide-react";

export function CardModals() {
  const { vault, addCard, updateCard, deleteCard, secret } = useVaultStore();
  const { cards } = vault;
  
  const {
    isManageCardsOpen, setManageCardsOpen,
    isCardFormOpen, setCardFormOpen,
    editingCardId, setEditingCardId
  } = useUIStore();

  // Form State
  const [name, setName] = useState("");
  const [billDay, setBillDay] = useState("");
  const [daysDue, setDaysDue] = useState("");
  const [error, setError] = useState("");

  // Deletion State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePin, setDeletePin] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Populate form when opening in Edit mode
  useEffect(() => {
    if (isCardFormOpen) {
      if (editingCardId) {
        const c = cards.find(x => x.id === editingCardId);
        if (c) {
          setName(c.name);
          setBillDay(c.billDay?.toString() || "");
          let diff = c.dueDay - c.billDay;
          if (diff <= 0) diff += 30;
          setDaysDue(diff.toString());
        }
      } else {
        setName("");
        setBillDay("");
        setDaysDue("");
      }
      setError("");
      setIsDeleting(false);
      setDeletePin("");
      setDeleteError("");
    }
  }, [isCardFormOpen, editingCardId, cards]);

  const bDay = parseInt(billDay);
  const dDue = parseInt(daysDue);
  const calcDue = (bDay && dDue) ? calculateDueDay(bDay, dDue) : null;

  const handleSaveCard = () => {
    if (!name.trim()) return setError("Name is required.");
    if (!bDay || bDay < 1 || bDay > 31) return setError("Enter bill date 1–31.");
    if (!dDue || dDue < 1 || dDue > 60) return setError("Enter days until due (1–60).");
    if (!calcDue) return setError("Due date could not be calculated.");

    if (editingCardId) {
      updateCard(editingCardId, { name: name.trim(), billDay: bDay, dueAfterDays: dDue, dueDay: calcDue });
    } else {
      addCard({
        id: 'c' + Date.now(),
        name: name.trim(),
        billDay: bDay,
        dueAfterDays: dDue,
        dueDay: calcDue,
        totalBill: "",
        status: "unpaid",
        history: []
      });
    }
    setCardFormOpen(false);
    setManageCardsOpen(true);
  };

  const confirmDelete = () => {
    if (deletePin !== secret) {
      setDeleteError("Incorrect secure code entry.");
      return;
    }
    deleteCard(editingCardId!);
    setIsDeleting(false);
    setCardFormOpen(false);
    setManageCardsOpen(true);
  };

  return (
    <>
      {/* Manage Cards Modal */}
      <Modal open={isManageCardsOpen} onClose={() => setManageCardsOpen(false)} title="💳 Manage Cards">
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto mb-2 pr-1">
          {cards.map(c => (
            <div key={c.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-white/10 bg-[#1a2234]">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-white">{c.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Bill {c.billDay}th · Due {c.dueDay}th</div>
              </div>
              <button 
                onClick={() => { setEditingCardId(c.id); setManageCardsOpen(false); setCardFormOpen(true); }}
                className="flex items-center justify-center gap-1.5 bg-[#111827] border border-white/10 rounded-[10px] px-3 py-2 text-[12px] font-medium text-white transition-all hover:bg-white/5 active:bg-white/10 shrink-0"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
            </div>
          ))}
          {cards.length === 0 && <div className="text-sm text-slate-500 text-center py-4">No cards added yet.</div>}
        </div>
        
        <button 
          onClick={() => { setEditingCardId(null); setManageCardsOpen(false); setCardFormOpen(true); }}
          className="mt-1 flex items-center justify-center gap-1.5 w-full bg-[#111827] border border-white/10 rounded-[10px] py-2.5 text-[13px] font-medium text-white transition-all active:bg-white/5 min-h-[44px]"
        >
          <span className="text-[18px]">➕</span> Add new card
        </button>
        
        <div className="flex gap-2 mt-3.5 pt-3 border-t border-white/10">
          <button onClick={() => setManageCardsOpen(false)} className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all active:bg-white/5 min-h-[44px]">
            Close
          </button>
        </div>
      </Modal>

      {/* Add / Edit Card Form Modal */}
      <Modal open={isCardFormOpen} onClose={() => { setCardFormOpen(false); setManageCardsOpen(true); }} title={editingCardId ? "✏️ Edit Card" : "➕ Add Card"}>
        <div className="flex flex-col gap-1 mb-3">
          <label className="text-[13px] font-medium text-slate-400">Card name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HDFC Millennia" className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 w-full outline-none" />
        </div>
        
        <div className="flex flex-col gap-1 mb-3">
          <label className="text-[13px] font-medium text-slate-400">Bill generation date (day of month)</label>
          <input type="number" min="1" max="31" value={billDay} onChange={e => setBillDay(e.target.value)} placeholder="e.g. 13" className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 w-full outline-none" />
        </div>
        
        <div className="flex flex-col gap-1 mb-3">
          <label className="text-[13px] font-medium text-slate-400">Days until due after bill date</label>
          <input type="number" min="1" max="60" value={daysDue} onChange={e => setDaysDue(e.target.value)} placeholder="e.g. 20" className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white focus:border-blue-500 w-full outline-none" />
          <div className="text-[11px] text-slate-500 mt-0.5">e.g. enter 20 if due date is 20 days after bill generation</div>
        </div>
        
        <div className="flex flex-col gap-1 mb-3">
          <label className="text-[13px] font-medium text-slate-400">Calculated due date (day of month)</label>
          <input type="text" readOnly value={calcDue ? `${calcDue}th` : ''} className="bg-[#111827] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-slate-400 w-full outline-none pointer-events-none" />
          <div className="text-[11px] text-slate-500 mt-0.5">{calcDue ? `Bill on ${bDay}th + ${dDue} days = due on ${calcDue}th` : 'Auto-calculated based on bill date + days'}</div>
        </div>
        
        {error && <div className="text-[13px] text-red-400 min-h-[18px] mb-2">{error}</div>}
        
        {isDeleting ? (
          <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-200">
            <p className="text-sm text-slate-300 mb-3">Are you sure you want to remove this card? Enter your application PIN to authorize.</p>
            <input 
               type="password" 
               value={deletePin} 
               onChange={e => { setDeletePin(e.target.value); setDeleteError(""); }} 
               autoFocus 
               maxLength={6}
               onKeyDown={e => e.key === 'Enter' && confirmDelete()}
               className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[18px] text-white focus:border-red-500 outline-none w-full mb-2 text-center tracking-widest"
               placeholder="------"
            />
            {deleteError && <div className="text-xs text-red-400 text-center mb-2">{deleteError}</div>}
            <div className="flex gap-2">
               <button onClick={() => { setIsDeleting(false); setDeletePin(""); setDeleteError(""); }} className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white hover:bg-white/5 transition-all">Cancel</button>
               <button onClick={confirmDelete} className="flex-1 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-sm font-medium text-red-400 hover:bg-red-500 hover:text-white transition-all">Confirm Destruction</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-3.5 pt-3 border-t border-white/10">
            <button onClick={() => { setCardFormOpen(false); setManageCardsOpen(true); }} className="flex-1 p-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition-all hover:bg-white/5 min-h-[44px]">
              Cancel
            </button>
            
            {editingCardId && (
              <button onClick={() => setIsDeleting(true)} className="flex items-center justify-center p-3 rounded-xl border border-red-500/30 text-red-400 transition-all hover:bg-red-500/10 min-h-[44px]">
                🗑️
              </button>
            )}
            
            <button onClick={handleSaveCard} className="flex-1 p-3 rounded-xl border border-blue-500 bg-blue-500 text-sm font-medium text-white transition-all hover:bg-blue-600 min-h-[44px]">
              Save
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}