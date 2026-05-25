"use client";

import { useState, useEffect } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Edit2 } from "lucide-react";

export function CardModals() {
  const { vault, addCard, updateCard, deleteCard } = useVaultStore();
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

  // Populate form when opening in Edit mode
  useEffect(() => {
    if (isCardFormOpen) {
      if (editingCardId) {
        const c = cards.find(x => x.id === editingCardId);
        if (c) {
          setName(c.name);
          setBillDay(c.billDay?.toString() || "");
          let diff = c.dueDay - c.billDay;
          if (diff <= 0) diff += 30; // Handle wraparound for existing data
          setDaysDue(diff.toString());
        }
      } else {
        setName("");
        setBillDay("");
        setDaysDue("");
      }
      setError("");
    }
  }, [isCardFormOpen, editingCardId, cards]);

  const bDay = parseInt(billDay);
  const dDue = parseInt(daysDue);

  // --- Proper Calculation Logic ---
  let calcDue = null;
  let dueMonthText = "";
  if (bDay && dDue) {
    const sum = bDay + dDue;
    calcDue = sum > 30 ? sum % 30 || 30 : sum;
    
    if (sum > 60) dueMonthText = "two months ahead";
    else if (sum > 30) dueMonthText = "of the next month";
    else dueMonthText = "of the current month";
  }

  // Helper for 1st, 2nd, 3rd, etc.
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const handleSaveCard = () => {
    if (!name.trim()) return setError("Name is required.");
    if (!bDay || bDay < 1 || bDay > 31) return setError("Enter a valid bill date (1–31).");
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

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this card?")) {
      deleteCard(editingCardId!);
      setCardFormOpen(false);
      setManageCardsOpen(true);
    }
  };

  return (
    <>
      {/* Manage Cards Modal */}
      <Modal open={isManageCardsOpen} onClose={() => setManageCardsOpen(false)} title="💳 Manage Cards">
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto mb-3 pr-1 custom-scrollbar">
          {cards.map(c => (
            <div key={c.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-white/10 bg-[#1a2234]">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-white">{c.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Bill {getOrdinal(c.billDay)} · Due {getOrdinal(c.dueDay)}</div>
              </div>
              <Button 
                variant="outline"
                onClick={() => { setEditingCardId(c.id); setManageCardsOpen(false); setCardFormOpen(true); }}
                className="h-8 px-3 text-[12px] bg-[#111827] border-white/10 text-white hover:bg-white/5 shrink-0"
              >
                <Edit2 className="size-3.5 mr-1.5" /> Edit
              </Button>
            </div>
          ))}
          {cards.length === 0 && <div className="text-sm text-slate-500 text-center py-4">No cards added yet.</div>}
        </div>
        
        <Button 
          onClick={() => { setEditingCardId(null); setManageCardsOpen(false); setCardFormOpen(true); }}
          className="w-full h-11 bg-[#111827] border border-white/10 text-[13px] font-medium text-white hover:bg-white/5 rounded-[10px]"
        >
          <Plus className="size-4 mr-1.5" /> Add new card
        </Button>
        
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
          <Button onClick={() => setManageCardsOpen(false)} variant="outline" className="flex-1 h-11 bg-transparent border-white/10 text-white hover:bg-white/5 rounded-[10px]">
            Close
          </Button>
        </div>
      </Modal>

      {/* Add / Edit Card Form Modal */}
      <Modal open={isCardFormOpen} onClose={() => { setCardFormOpen(false); setManageCardsOpen(true); }} title={editingCardId ? "✏️ Edit Card" : "➕ Add Card"}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Card name</label>
            <Input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. HDFC Millennia" 
              className="bg-[#1a2234] border-white/10 text-white h-11 rounded-[10px] focus:ring-blue-500" 
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Bill generation date (1-31)</label>
            <Input 
              type="text" 
              inputMode="numeric"
              value={billDay} 
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, ''); // Strip non-numbers
                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) setBillDay(val);
              }} 
              placeholder="e.g. 13" 
              className="bg-[#1a2234] border-white/10 text-white h-11 rounded-[10px] focus:ring-blue-500" 
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Days until due</label>
            <Input 
              type="text" 
              inputMode="numeric"
              value={daysDue} 
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 60)) setDaysDue(val);
              }} 
              placeholder="e.g. 20" 
              className="bg-[#1a2234] border-white/10 text-white h-11 rounded-[10px] focus:ring-blue-500" 
            />
            <div className="text-[11px] text-slate-500">e.g. enter 20 if the due date is 20 days after bill generation</div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Calculated due date</label>
            <Input 
              type="text" 
              readOnly 
              value={calcDue ? `${getOrdinal(calcDue)} ${dueMonthText}` : ''} 
              className="bg-[#111827] border-white/5 text-slate-300 h-11 rounded-[10px] pointer-events-none opacity-80 font-medium" 
            />
            <div className="text-[11px] text-slate-500">
              {calcDue ? `Bill on the ${getOrdinal(bDay)} + ${dDue} days = ${getOrdinal(calcDue)}` : 'Auto-calculated based on bill date + days'}
            </div>
          </div>
        </div>
        
        {error && <div className="text-[13px] text-red-400 font-medium mt-4">{error}</div>}
        
        <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
          <Button onClick={() => { setCardFormOpen(false); setManageCardsOpen(true); }} variant="outline" className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5 h-11 rounded-[10px]">
            Cancel
          </Button>
          
          {editingCardId && (
            <Button onClick={handleDelete} variant="outline" className="flex items-center justify-center bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 h-11 w-14 rounded-[10px] shrink-0">
              <Trash2 className="size-4" />
            </Button>
          )}
          
          <Button onClick={handleSaveCard} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-11 rounded-[10px]">
            Save
          </Button>
        </div>
      </Modal>
    </>
  );
}