"use client";

import { useState, useEffect, useCallback } from "react";
import { useVaultStore } from "@/stores/vault-store";
import { computeStatus, formatCurrency } from "@/lib/engine/cards";
import { Modal } from "@/components/ui/modal";
import { 
  SlidersHorizontal, 
  BarChart, 
  Copy, 
  Download, 
  ChevronDown, 
  Check, 
  Minus, 
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import * as XLSX from "xlsx";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, eachDayOfInterval, isSameMonth, 
  isSameDay, startOfWeek, endOfWeek 
} from "date-fns";

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// --- Custom Shadcn-Style Select ---
function CustomSelect({ value, options, onChange, placeholder }: { value: string, options: {label: string, value: string}[], onChange: (val: string) => void, placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder || "Select...";

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="w-full h-11 flex justify-between items-center bg-[#1a2234] border border-white/10 rounded-[10px] px-3 text-[14px] text-white outline-none transition-colors hover:bg-white/5 focus:ring-1 focus:ring-blue-500">
        <span className="truncate pr-2">{selectedLabel}</span>
        <ChevronDown className={`size-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1.5 p-1 bg-[#1a2234] border border-white/10 rounded-[10px] shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1">
            {options.map(o => (
              <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-[13px] outline-none transition-colors ${value === o.value ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}>
                {value === o.value && <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"><Check className="size-4" /></span>}
                {o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Custom Shadcn-Style Calendar Picker (Replaces ugly HTML calendar) ---
function CustomDatePicker({ value, onChange, placeholder }: { value: Date | undefined, onChange: (val: Date) => void, placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const handleSelect = (date: Date) => { onChange(date); setOpen(false); };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  return (
    <div className="relative w-full">
      <button type="button" onClick={() => setOpen(!open)} className={`w-full h-11 flex items-center justify-start gap-2 px-3 bg-[#1a2234] border border-white/10 rounded-[10px] text-[13px] transition-colors hover:bg-white/5 outline-none focus:ring-1 focus:ring-blue-500 ${value ? 'text-white' : 'text-slate-400'}`}>
        <CalendarIcon className="size-4 opacity-50" />
        {value ? format(value, "PPP") : placeholder}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 p-3 bg-[#1a2234] border border-white/10 rounded-[10px] shadow-xl z-50 w-[280px] animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-md transition-colors"><ChevronLeft className="size-4 text-slate-300" /></button>
              <div className="text-[14px] font-medium text-white">{format(currentMonth, "MMMM yyyy")}</div>
              <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-md transition-colors"><ChevronRight className="size-4 text-slate-300" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400 mb-2">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const isSelected = value && isSameDay(day, value);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                return (
                  <button type="button" key={i} onClick={() => handleSelect(day)} className={`h-8 w-full flex items-center justify-center rounded-md text-[13px] transition-colors ${isSelected ? 'bg-blue-500 text-white font-medium shadow-sm' : isCurrentMonth ? 'text-slate-200 hover:bg-white/10' : 'text-slate-600 hover:bg-white/5'}`}>
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ReportsView() {
  const cards = useVaultStore((s) => s.vault.cards);
  
  const [isConfigOpen, setConfigOpen] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [month, setMonth] = useState(new Date().getMonth().toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [cardId, setCardId] = useState("");
  
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [reportData, setReportData] = useState<any>(null);

  const getPaidTotal = (c: any) => (c.history || []).reduce((sum: number, h: any) => sum + Number(h.amount || 0), 0);

  const generateReport = useCallback(() => {
    let html = null;
    let csv: any[] = [];
    
    if (reportType === 'monthly') {
      let tb = 0, tp = 0;
      csv = [['Card', 'Bill Day', 'Due Day', 'Total Bill', 'Paid', 'Outstanding', 'Status']];
      const rows = cards.map(c => {
        const paid = getPaidTotal(c), bill = parseFloat(String(c.totalBill)) || 0, out = bill - paid, st = computeStatus(c);
        tb += bill; tp += paid;
        csv.push([c.name, c.billDay + 'th', c.dueDay + 'th', bill || 0, paid || 0, out > 0 ? out : 0, st]);
        return { name: c.name, bill, paid, out: out > 0 ? out : 0, status: st };
      });
      html = { title: `Monthly Summary — ${MONTHS[parseInt(month)]} ${year}`, type: 'summary', rows, tb, tp, out: (tb - tp > 0 ? tb - tp : 0) };
    } 
    else if (reportType === 'card') {
      const c = cards.find(x => x.id === cardId) || cards[0];
      if (c) {
        csv = [['Date', 'Amount', 'Note']];
        let tot = 0;
        const hist = (c.history || []).filter(h => h.amount).map(h => {
          tot += parseFloat(String(h.amount)) || 0;
          csv.push([h.date || '', parseFloat(String(h.amount)) || 0, h.note || '']);
          return { date: h.date || '—', amount: parseFloat(String(h.amount)) || 0, note: h.note || '—' };
        });
        html = { title: `${c.name} — History`, type: 'history', rows: hist, tot };
      }
    }
    else if (reportType === 'all') {
      csv = [['Date', 'Card', 'Amount', 'Note']];
      let tot = 0;
      const rows: any[] = [];
      cards.forEach(c => {
         (c.history || []).filter(h => h.amount).forEach(h => {
            rows.push({ date: h.date || '—', card: c.name, amount: parseFloat(String(h.amount)) || 0, note: h.note || '—', ts: h.ts || h.date });
         });
      });
      rows.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
      rows.forEach(r => {
         tot += r.amount;
         csv.push([r.date, r.card, r.amount, r.note]);
      });
      html = { title: `All Transactions History`, type: 'all', rows, tot };
    }
    else if (reportType === 'yearly') {
      csv = [['Card', 'Total Paid']];
      let tot = 0;
      const rows = cards.map(c => {
         const yHist = (c.history || []).filter(h => h.amount && (h.date?.startsWith(year) || h.ts?.startsWith(year)));
         const p = yHist.reduce((s, h) => s + (parseFloat(String(h.amount)) || 0), 0);
         tot += p;
         csv.push([c.name, p]);
         return { name: c.name, paid: p };
      });
      html = { title: `Yearly Overview — ${year}`, type: 'yearly', rows, tot };
    }
    else if (reportType === 'custom') {
      csv = [['Date', 'Card', 'Amount', 'Note']];
      let tot = 0;
      const rows: any[] = [];
      const dStart = fromDate ? fromDate.getTime() : 0;
      const dEnd = toDate ? toDate.getTime() : Infinity;

      cards.forEach(c => {
         (c.history || []).filter(h => h.amount).forEach(h => {
            const dTime = new Date(h.date || h.ts || 0).getTime();
            if (dTime >= dStart && dTime <= dEnd) {
               rows.push({ date: h.date || '—', card: c.name, amount: parseFloat(String(h.amount)) || 0, note: h.note || '—', ts: h.ts || h.date });
            }
         });
      });
      rows.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
      rows.forEach(r => {
         tot += r.amount;
         csv.push([r.date, r.card, r.amount, r.note]);
      });
      const fromStr = fromDate ? format(fromDate, 'MMM dd, yyyy') : 'Any';
      const toStr = toDate ? format(toDate, 'MMM dd, yyyy') : 'Any';
      html = { title: `Custom Range (${fromStr} to ${toStr})`, type: 'all', rows, tot };
    }

    setReportData({ html, csv });
    setConfigOpen(false);
  }, [cards, reportType, month, year, cardId, fromDate, toDate]);

  useEffect(() => {
    if (!reportData && cards.length > 0) {
      if (!cardId && cards.length > 0) setCardId(cards[0].id);
      generateReport();
    }
  }, [cards.length, reportData, generateReport, cardId]);

  const copyCsv = () => {
    if (!reportData?.csv) return;
    const csvStr = reportData.csv.map((r: any) => r.map((v: any) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    navigator.clipboard.writeText(csvStr);
    alert("Copied to clipboard!");
  };

  const downloadExcel = () => {
    if (!reportData?.html) return;
    const { type, rows, tb, tp, out, tot, title } = reportData.html;

    const wb = XLSX.utils.book_new();
    const wsData: any[][] = [];

    wsData.push([title]);
    wsData.push([]); 

    if (type === 'summary') {
      wsData.push(['Card Name', 'Total Bill', 'Total Paid', 'Outstanding Due', 'Payment Status']);
      rows.forEach((r: any) => wsData.push([r.name, r.bill, r.paid, r.out, r.status]));
      wsData.push([]);
      wsData.push(['Grand Total', tb, tp, out, '']);
    } else if (type === 'history') {
      wsData.push(['Date Logged', 'Amount Paid', 'Notes/Remarks']);
      rows.forEach((r: any) => wsData.push([r.date, r.amount, r.note]));
      wsData.push([]);
      wsData.push(['Total Paid', tot, '']);
    } else if (type === 'all' || type === 'custom') {
      wsData.push(['Date Logged', 'Card Name', 'Amount Paid', 'Notes/Remarks']);
      rows.forEach((r: any) => wsData.push([r.date, r.card, r.amount, r.note]));
      wsData.push([]);
      wsData.push(['Total Paid', '', tot, '']);
    } else if (type === 'yearly') {
      wsData.push(['Card Name', 'Total Amount Paid']);
      rows.forEach((r: any) => wsData.push([r.name, r.paid]));
      wsData.push([]);
      wsData.push(['Grand Total', tot]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const colWidths = wsData.map(row => row.map(val => (val == null ? 10 : val.toString().length)));
    const maxColWidths = colWidths.reduce((acc, row) => {
      row.forEach((len, i) => { if (!acc[i] || acc[i] < len) acc[i] = len; });
      return acc;
    }, []);
    ws['!cols'] = maxColWidths.map(w => ({ wch: w + 2 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `Duely_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const renderTable = () => {
    if (!reportData?.html) return null;
    const { type, rows, tb, tp, out, tot } = reportData.html;

    if (type === 'summary') {
      return (
        <table className="w-full text-left text-[12px] whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 uppercase tracking-wider text-[11px] text-slate-400">
            <tr><th className="p-3 font-medium">Card</th><th className="p-3 font-medium">Bill</th><th className="p-3 font-medium">Paid</th><th className="p-3 font-medium">Due</th><th className="p-3 font-medium">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {rows.map((r: any, i: number) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.bill ? formatCurrency(r.bill) : '—'}</td>
                <td className="p-3">{r.paid ? formatCurrency(r.paid) : '—'}</td>
                <td className="p-3">{r.out ? formatCurrency(r.out) : '—'}</td>
                <td className={`p-3 font-medium ${r.status === 'paid' ? 'text-green-400' : r.status === 'partial' ? 'text-orange-400' : 'text-red-400'}`}>{r.status}</td>
              </tr>
            ))}
            <tr className="bg-white/5 font-semibold">
              <td className="p-3">Total</td>
              <td className="p-3">{formatCurrency(tb)}</td>
              <td className="p-3 text-green-400">{formatCurrency(tp)}</td>
              <td className="p-3 text-red-400">{formatCurrency(out)}</td>
              <td className="p-3"></td>
            </tr>
          </tbody>
        </table>
      );
    } 
    
    if (type === 'history') {
      return (
        <table className="w-full text-left text-[12px] whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 uppercase tracking-wider text-[11px] text-slate-400">
            <tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Note</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {rows.map((r: any, i: number) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-3">{r.date}</td>
                <td className="p-3">{formatCurrency(r.amount)}</td>
                <td className="p-3 text-slate-400">{r.note}</td>
              </tr>
            ))}
            <tr className="bg-white/5 font-semibold">
              <td className="p-3">Total</td>
              <td className="p-3 text-green-400">{formatCurrency(tot)}</td>
              <td className="p-3"></td>
            </tr>
          </tbody>
        </table>
      );
    }

    if (type === 'all' || type === 'custom') {
      return (
        <table className="w-full text-left text-[12px] whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 uppercase tracking-wider text-[11px] text-slate-400">
            <tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Card</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Note</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {rows.map((r: any, i: number) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.card}</td>
                <td className="p-3">{formatCurrency(r.amount)}</td>
                <td className="p-3 text-slate-400">{r.note}</td>
              </tr>
            ))}
            <tr className="bg-white/5 font-semibold">
              <td className="p-3">Total</td>
              <td className="p-3"></td>
              <td className="p-3 text-green-400">{formatCurrency(tot)}</td>
              <td className="p-3"></td>
            </tr>
          </tbody>
        </table>
      );
    }

    if (type === 'yearly') {
      return (
        <table className="w-full text-left text-[12px] whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 uppercase tracking-wider text-[11px] text-slate-400">
            <tr><th className="p-3 font-medium">Card</th><th className="p-3 font-medium">Total Paid</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {rows.map((r: any, i: number) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{formatCurrency(r.paid)}</td>
              </tr>
            ))}
            <tr className="bg-white/5 font-semibold">
              <td className="p-3">Total</td>
              <td className="p-3 text-green-400">{formatCurrency(tot)}</td>
            </tr>
          </tbody>
        </table>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-slate-300">Reports</h2>
        <button type="button" onClick={() => setConfigOpen(true)} className="flex items-center gap-1.5 bg-[#111827] border border-white/10 text-[12px] font-medium text-white hover:bg-white/5 h-9 px-4 rounded-[10px] transition-colors">
          <SlidersHorizontal className="size-3.5" /> Configure
        </button>
      </div>

      {!reportData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 bg-[#111827]/50 rounded-2xl animate-in fade-in">
          <BarChart className="size-12 text-slate-500 mb-3 opacity-50" />
          <p className="text-sm text-slate-400">Generating report...</p>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <h3 className="text-[13px] font-medium text-slate-400 px-1">{reportData.html.title}</h3>
          
          <div className="rounded-[10px] border border-white/10 bg-[#111827] overflow-x-auto">
            {renderTable()}
          </div>

          <div className="flex gap-2">
            <button onClick={downloadExcel} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-[10px] h-11 text-[12px] font-semibold transition-colors">
              <Download className="size-3.5" /> Download Excel
            </button>
            <button onClick={copyCsv} className="flex items-center justify-center gap-1.5 bg-[#111827] border border-white/10 text-white hover:bg-white/5 rounded-[10px] h-11 px-4 text-[12px] font-medium transition-colors">
              <Copy className="size-3.5" /> Copy CSV
            </button>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      <Modal open={isConfigOpen} onClose={() => setConfigOpen(false)} title="📊 Generate Report">
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Report type</label>
          <CustomSelect 
            value={reportType} 
            onChange={setReportType} 
            options={[
              { label: 'Monthly Summary', value: 'monthly' },
              { label: 'All Transactions', value: 'all' },
              { label: 'Per-Card History', value: 'card' },
              { label: 'Yearly Overview', value: 'yearly' },
              { label: 'Custom Date Range', value: 'custom' }
            ]} 
          />
        </div>

        {reportType === 'card' && (
          <div className="flex flex-col gap-1.5 mb-4 animate-in fade-in slide-in-from-top-1">
            <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Select Card</label>
            <CustomSelect 
              value={cardId} 
              onChange={setCardId} 
              options={cards.map(c => ({ label: c.name, value: c.id }))} 
            />
          </div>
        )}

        {reportType === 'monthly' && (
          <div className="grid grid-cols-2 gap-3 mb-4 animate-in fade-in slide-in-from-top-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Month</label>
              <CustomSelect 
                value={month} 
                onChange={setMonth} 
                options={MONTHS.map((m, i) => ({ label: m, value: String(i) }))} 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Year</label>
              <div className="relative flex items-center">
                <button type="button" onClick={() => setYear(String(parseInt(year) - 1))} className="absolute left-1 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Minus className="size-3.5" /></button>
                <input type="number" value={year} onChange={e => setYear(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-[10px] py-2.5 px-8 h-11 text-[14px] text-white text-center outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium tracking-wide focus:ring-1 focus:ring-blue-500" />
                <button type="button" onClick={() => setYear(String(parseInt(year) + 1))} className="absolute right-1 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Plus className="size-3.5" /></button>
              </div>
            </div>
          </div>
        )}

        {reportType === 'yearly' && (
          <div className="flex flex-col gap-1.5 mb-4 animate-in fade-in slide-in-from-top-1">
            <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Year</label>
            <div className="relative flex items-center">
              <button type="button" onClick={() => setYear(String(parseInt(year) - 1))} className="absolute left-1 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Minus className="size-3.5" /></button>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} className="bg-[#1a2234] border border-white/10 rounded-[10px] py-2.5 px-8 h-11 text-[14px] text-white text-center outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium tracking-wide focus:ring-1 focus:ring-blue-500" />
              <button type="button" onClick={() => setYear(String(parseInt(year) + 1))} className="absolute right-1 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Plus className="size-3.5" /></button>
            </div>
          </div>
        )}

        {reportType === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mb-4 animate-in fade-in slide-in-from-top-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">From Date</label>
              <CustomDatePicker value={fromDate} onChange={setFromDate} placeholder="Pick a date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">To Date</label>
              <CustomDatePicker value={toDate} onChange={setToDate} placeholder="Pick a date" />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2 pt-4 border-t border-white/10">
          <button type="button" onClick={() => setConfigOpen(false)} className="flex-1 bg-transparent border border-white/10 text-[13px] font-medium text-white hover:bg-white/5 h-11 rounded-[10px] transition-colors">Cancel</button>
          <button type="button" onClick={generateReport} className="flex-1 bg-blue-500 border border-blue-500 hover:bg-blue-600 text-[13px] font-medium text-white h-11 rounded-[10px] transition-colors shadow-sm">Generate</button>
        </div>
      </Modal>
    </div>
  );
}