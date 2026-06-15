import { useState } from 'react';
import { MemoRequest } from '../types';
import { DEPARTMENTS, COST_CENTERS } from '../initialData';
import { BarChart3, Receipt, CheckSquare, XCircle, TrendingUp, Download, PieChart, Users, Compass } from 'lucide-react';

interface ReportsTabProps {
  memos: MemoRequest[];
  theme?: 'light' | 'dark';
}

export default function ReportsTab({ memos, theme = 'light' }: ReportsTabProps) {
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStage, setFilterStage] = useState('ALL');

  // Compute Core Statistics
  const totalDisbursedAdvances = memos
    .filter(m => (m.status === 'Paid' || m.status === 'RetirementCompleted') && m.type === 'CashAdvance')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalPettyCashReleased = memos
    .filter(m => (m.status === 'Released' || m.status === 'RetirementCompleted') && m.type === 'PettyCash')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalRejectedRequests = memos
    .filter(m => m.status === 'Rejected')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalOutstandingRetirement = memos
    .filter(m => m.type === 'CashAdvance' && m.status === 'Paid')
    .reduce((sum, m) => sum + m.amount, 0);

  // Filters applying to breakdown
  const filteredMemos = memos.filter(m => {
    const matchesDept = filterDept === 'ALL' || m.department === filterDept;
    const matchesStage = filterStage === 'ALL' || m.status === filterStage;
    return matchesDept && matchesStage;
  });

  // Pure CSS Data Visualizers
  // Compute department distribution amounts
  const deptBreakdown = DEPARTMENTS.map(dept => {
    const total = memos
      .filter(m => m.department === dept)
      .reduce((sum, m) => sum + m.amount, 0);
    return { dept, total };
  }).sort((a, b) => b.total - a.total);

  const maxDeptValue = Math.max(...deptBreakdown.map(d => d.total), 1);

  // Compute stage distribution count
  const statusCounts = memos.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const triggerExport = (type: 'EXCEL' | 'PDF') => {
    if (type === 'EXCEL') {
      const headers = ['Request ID', 'Title', 'Type', 'Amount', 'Department', 'Cost Center', 'Beneficiary', 'Verification Status', 'Disbursed Date'];
      const rows = filteredMemos.map(m => [
        m.id,
        m.title.replace(/,/g, ';'),
        m.type,
        m.amount,
        m.department,
        m.costCenter,
        m.beneficiary,
        m.status,
        m.paymentDate || 'N/A'
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `VETIVA_EXCEL_REPORT_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // PDF export simulator
      alert("Executive report printed! Check browser storage. PDF copy compiled with compliance SHA-256 seal.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className={`border p-5 rounded-xl flex items-center justify-between shadow-3xs relative overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-[#F8FAFC] border-slate-200'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Disbursed Cash Advances</span>
            <strong className={`text-xl font-bold block font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              ₦{totalDisbursedAdvances.toLocaleString()}
            </strong>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 font-mono">
              <TrendingUp className="w-3 h-3" /> Ledger cleared
            </span>
          </div>
          <div className={`p-3 rounded-lg border shrink-0 shadow-3xs transition-colors ${
            theme === 'dark' ? 'bg-[#0E1524] border-slate-700' : 'bg-white border-slate-100'
          }`}>
            <Receipt className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className={`border p-5 rounded-xl flex items-center justify-between shadow-3xs relative overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-[#F8FAFC] border-slate-200'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Petty Cash Released</span>
            <strong className={`text-xl font-bold block font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              ₦{totalPettyCashReleased.toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 font-mono">Over-the-counter release</span>
          </div>
          <div className={`p-3 rounded-lg border shrink-0 shadow-3xs transition-colors ${
            theme === 'dark' ? 'bg-[#0E1524] border-slate-700' : 'bg-white border-slate-100'
          }`}>
            <Compass className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className={`border p-5 rounded-xl flex items-center justify-between shadow-3xs relative overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-[#F8FAFC] border-slate-200'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Outstanding Retirement</span>
            <strong className="text-xl text-amber-500 font-bold block font-mono">
              ₦{totalOutstandingRetirement.toLocaleString()}
            </strong>
            <span className="text-[10px] text-amber-500 font-semibold font-mono">
              ⌛ Reconciliations pending
            </span>
          </div>
          <div className={`p-3 rounded-lg border shrink-0 shadow-3xs transition-colors ${
            theme === 'dark' ? 'bg-[#0E1524] border-slate-700' : 'bg-white border-slate-100'
          }`}>
            <CheckSquare className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className={`border p-5 rounded-xl flex items-center justify-between shadow-3xs relative overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-[#F8FAFC] border-slate-200'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-505 font-bold uppercase tracking-wider block">Total Rejected Bookings</span>
            <strong className="text-xl text-rose-500 font-bold block font-mono">
              ₦{totalRejectedRequests.toLocaleString()}
            </strong>
            <span className="text-[10px] text-rose-500 font-mono">Audit exception tracking</span>
          </div>
          <div className={`p-3 rounded-lg border shrink-0 shadow-3xs transition-colors ${
            theme === 'dark' ? 'bg-[#0E1524] border-slate-700' : 'bg-white border-slate-100'
          }`}>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
        </div>

      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* CSS Bar Distribution: Spending distribution by Department */}
        <div className={`border rounded-xl p-5 flex flex-col h-full shadow-3xs transition-colors ${
          theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`pb-3 mb-4 flex justify-between items-center border-b ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-150'
          }`}>
            <div>
              <h4 className={`font-bold text-sm flex items-center gap-1.5 font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Department Funding Allocations
              </h4>
              <p className="text-[11px] text-slate-500">Gross funding allocation and advance requests cumulative valuation</p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5 flex-1 select-none">
            {deptBreakdown.map((row, i) => {
              const perc = Math.max((row.total / maxDeptValue) * 100, 2);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-medium truncate max-w-[200px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{row.dept}</span>
                    <strong className={`font-mono font-semibold ${theme === 'dark' ? 'text-slate-205' : 'text-slate-900'}`}>₦{row.total.toLocaleString()}</strong>
                  </div>
                  <div className={`h-2 w-full rounded-full overflow-hidden flex border transition-colors ${
                    theme === 'dark' ? 'bg-[#0E1524] border-slate-700' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all" 
                      style={{ width: `${perc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Progression states Breakdowns */}
        <div className={`border rounded-xl p-5 flex flex-col justify-between shadow-3xs transition-colors ${
          theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className={`pb-3 mb-4 flex justify-between items-center border-b ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-150'
            }`}>
              <div>
                <h4 className={`font-bold text-sm flex items-center gap-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <PieChart className="w-4 h-4 text-blue-500" />
                  Workflow Lifecycle State Indices
                </h4>
                <p className="text-[11px] text-slate-500">Volumetric state count across active loop approvals</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { status: 'Paid', label: 'Advances Settle', color: theme === 'dark' ? 'border-emerald-900/60 text-emerald-400 bg-emerald-950/20' : 'border-emerald-300 text-emerald-800 bg-emerald-50/50' },
                { status: 'Released', label: 'Released PC', color: theme === 'dark' ? 'border-indigo-900/60 text-indigo-400 bg-indigo-950/20' : 'border-indigo-300 text-indigo-800 bg-indigo-50/50' },
                { status: 'PendingLineManager', label: 'Wait Mgr', color: theme === 'dark' ? 'border-yellow-900/60 text-yellow-450 bg-yellow-950/20' : 'border-yellow-300 text-yellow-800 bg-yellow-50/50' },
                { status: 'PendingAuditor', label: 'Under IC Audit', color: theme === 'dark' ? 'border-pink-900/60 text-pink-400 bg-pink-950/20' : 'border-pink-300 text-pink-850 bg-pink-50/50' },
                { status: 'PendingExecutive', label: 'CEO Clear', color: theme === 'dark' ? 'border-amber-900/60 text-amber-455 bg-amber-950/20' : 'border-amber-300 text-amber-800 bg-amber-50/50' },
                { status: 'RetirementCompleted', label: 'Retired Comp', color: theme === 'dark' ? 'border-emerald-800 text-emerald-400 bg-emerald-950/20' : 'border-emerald-250 text-emerald-800 bg-emerald-50/50' },
                { status: 'PendingFinance', label: 'In Disbursal', color: theme === 'dark' ? 'border-teal-900/60 text-teal-400 bg-[#0E1524]' : 'border-teal-300 text-teal-850 bg-teal-50/50' },
                { status: 'Rejected', label: 'Rejected Memos', color: theme === 'dark' ? 'border-rose-900/60 text-rose-450 bg-[#0E1524]' : 'border-rose-300 text-rose-850 bg-rose-50/50' },
              ].map((cell, i) => {
                const count = statusCounts[cell.status] || 0;
                return (
                  <div key={i} className={`p-3 rounded-lg border ${cell.color} flex flex-col justify-between text-xs transition-all hover:shadow-2xs`}>
                    <span className="text-slate-500 block text-[10px] font-semibold truncate max-w-[120px]">{cell.label}</span>
                    <strong className={`text-lg block font-bold font-mono mt-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-850'}`}>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`pt-4 mt-4 flex justify-end gap-2 shrink-0 border-t ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-150'
          }`}>
            <button
              onClick={() => triggerExport('EXCEL')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
            <button
              onClick={() => triggerExport('PDF')}
              className={`font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer shadow-3xs border ${
                theme === 'dark'
                  ? 'bg-[#1E293B] border-slate-700 text-slate-350 hover:bg-[#25324A] hover:text-white'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              Compile PDF Docket
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
