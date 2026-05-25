"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function DatePicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayRaw = new Date(year, month, 1).getDay();
  // Adjust so Monday is 0 instead of Sunday
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1; 

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const blanks = Array.from({ length: firstDay }).map((_, i) => <div key={`blank-${i}`} />);

  const days = Array.from({ length: daysInMonth }).map((_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = value === dateStr;
    const isToday = new Date().toISOString().slice(0, 10) === dateStr;

    return (
      <button
        key={day}
        type="button"
        onClick={() => { 
          onChange(dateStr); 
          setIsOpen(false); 
        }}
        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] transition-colors
          ${isSelected 
            ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20' :
            isToday 
            ? 'bg-white/10 text-white font-medium' 
            : 'text-slate-300 hover:bg-white/10'}
        `}
      >
        {day}
      </button>
    );
  });

  const displayDate = value 
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
    : "Select date";

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#1a2234] border border-white/10 rounded-[10px] p-2.5 text-[15px] text-white w-full flex items-center justify-between outline-none hover:border-white/20 transition-colors"
      >
        <span className={value ? "text-white" : "text-slate-400"}>{displayDate}</span>
        <CalendarIcon className="size-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 z-50 bg-[#1a2234] border border-white/10 rounded-xl p-3 shadow-2xl w-[260px] animate-in fade-in zoom-in-95 duration-100 origin-top">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button type="button" onClick={prevMonth} className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-[14px] font-semibold text-white">
              {MONTHS[month]} {year}
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Days Row */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {DAYS.map(d => (
              <div key={d} className="text-[11px] font-medium text-slate-500 w-8 h-6 flex items-center justify-center">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {blanks}
            {days}
          </div>
        </div>
      )}
    </div>
  );
}