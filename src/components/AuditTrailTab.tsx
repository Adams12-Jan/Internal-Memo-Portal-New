import { useState } from 'react';
import { AuditLog, Role } from '../types';
import { Search, Filter, ShieldCheck, Download, AlertCircle, RefreshCw } from 'lucide-react';

interface AuditTrailTabProps {
  logs: AuditLog[];
  onClear: () => void;
  theme?: 'light' | 'dark';
}

export default function AuditTrailTab({ logs, onClear, theme = 'light' }: AuditTrailTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  // Filter lists
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.memoId && log.memoId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || log.role === selectedRole;
    const matchesAction = selectedAction === 'ALL' || log.action.includes(selectedAction);

    return matchesSearch && matchesRole && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action.split('_')[0])));

  const triggerCSVExport = () => {
    const headers = ['Timestamp', 'Officer', 'Role', 'IP Address', 'Action', 'Memo ID', 'Details'];
    const rows = filteredLogs.map(l => [
      new Date(l.timestamp).toISOString(),
      l.user,
      l.role,
      l.ipAddress,
      l.action,
      l.memoId || 'N/A',
      l.details?.replace(/,/g, ';') || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VETIVA_AUDIT_LOGS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Search and Filters panel */}
      <div className={`p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 border transition-colors ${
        theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-[#F8FAFC] border-slate-200'
      }`}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 transition-colors ${
              theme === 'dark' ? 'bg-[#0E1524] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
            placeholder="Search operator, Memo ID..."
          />
        </div>
        
        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 transition-colors ${
              theme === 'dark' ? 'bg-[#0E1524] border-slate-700 text-slate-350 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="ALL">All Roles Status</option>
            <option value="Initiator">Initiator (Employee)</option>
            <option value="LineManager">Line Manager</option>
            <option value="Auditor">Internal Control</option>
            <option value="Executive">Executive Office</option>
            <option value="Finance">Finance Department</option>
          </select>
        </div>

        <div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 transition-colors ${
              theme === 'dark' ? 'bg-[#0E1524] border-slate-700 text-slate-350 text-slate-200' : 'bg-white border-slate-200 text-slate-705'
            }`}
          >
            <option value="ALL">All Action Roots</option>
            <option value="MEMO">MEMO Activities</option>
            <option value="QUERY">Queries &amp; Answers</option>
            <option value="SIGN">Signatures</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={triggerCSVExport}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-xs border ${
              theme === 'dark' 
                ? 'bg-[#1E293B] hover:bg-[#25324A] text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-707 border-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          
          <button
            onClick={onClear}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs border ${
              theme === 'dark'
                ? 'bg-[#1E293B] hover:bg-[#25324A] text-slate-400 hover:text-rose-450 border-slate-700'
                : 'bg-white text-slate-400 hover:text-rose-600 border-slate-200 hover:border-slate-300'
            }`}
            title="Reset Ledger"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Audit Log list */}
      <div className={`border rounded-xl overflow-hidden shadow-xs transition-colors ${
        theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-4 border-b flex justify-between items-center transition-colors ${
          theme === 'dark' ? 'bg-[#0E1524] border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Certified Compliance Audit Trail Ledger
          </span>
          <span className={`font-mono text-[11px] px-2.5 py-1 rounded transition-colors ${
            theme === 'dark' ? 'bg-[#1E293B] text-slate-300' : 'bg-slate-100 text-slate-600'
          }`}>
            Filtered logs count: {filteredLogs.length}
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 text-slate-450 mb-2" />
            <strong className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-808'}`}>Ledger lookup blank</strong>
            <span className="mt-0.5">Adjust filter settings or search terms above.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[10px] uppercase font-mono ${
                theme === 'dark' ? 'bg-[#0E1524] border-slate-800 text-slate-400' : 'bg-[#F8FAFC] border-slate-200 text-slate-500'
              }`}>
                <tr>
                  <th className="py-2.5 px-4 font-normal">Timestamp</th>
                  <th className="py-2.5 px-4 font-normal">Operator Officer</th>
                  <th className="py-2.5 px-4 font-normal">Session Role</th>
                  <th className="py-2.5 px-4 font-normal">Action ID</th>
                  <th className="py-2.5 px-4 font-normal">IP Address</th>
                  <th className="py-2.5 px-4 font-normal">Linked ID</th>
                  <th className="py-2.5 px-4 font-normal">Ledger Remarks Summary</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800/85' : 'divide-slate-150'}`}>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className={`font-medium transition-colors ${
                    theme === 'dark' ? 'hover:bg-[#1E293B]/50' : 'hover:bg-slate-50'
                  }`}>
                    <td className="py-3 px-4 font-mono text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className={`py-3 px-4 font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{log.user}</td>
                    <td className="py-3 px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${
                        log.role === 'Initiator' ? 'bg-indigo-50/10 text-indigo-400 border-indigo-500/20' :
                        log.role === 'LineManager' ? 'bg-emerald-50/10 text-emerald-400 border-emerald-500/20' :
                        log.role === 'Auditor' ? 'bg-pink-50/10 text-pink-400 border-pink-500/20' :
                        log.role === 'Executive' ? 'bg-amber-50/10 text-amber-400 border-amber-500/20' :
                        theme === 'dark' ? 'bg-slate-800/55 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-605 border-slate-150'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                        theme === 'dark' ? 'bg-[#0E1524] text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{log.ipAddress}</td>
                    <td className="py-3 px-4">
                      {log.memoId ? (
                        <span className="font-mono text-blue-500 font-bold">{log.memoId}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 truncate max-w-[240px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
