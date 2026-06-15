import { useState } from 'react';
import { 
  Role, MemoRequest, AuditLog, Notification, ESignature, MemoStatus, MemoType, QueryEntry
} from './types';
import { 
  INITIAL_MEMOS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS, COST_CENTERS, DEPARTMENTS 
} from './initialData';

// Component Imports
import RoleSwitcher from './components/RoleSwitcher';
import MemoForm from './components/MemoForm';
import MemoDetailsPane from './components/MemoDetailsPane';
import FinanceModule from './components/FinanceModule';
import AuditTrailTab from './components/AuditTrailTab';
import ReportsTab from './components/ReportsTab';
import SignInDashboard from './components/SignInDashboard';

// Lucide Icons
import { 
  Briefcase, PlusCircle, Bell, Landmark, Search, Filter, 
  HelpCircle, Archive, ClipboardCheck, ArrowUpDown, DollarSign, 
  CheckCircle2, FileJson, Layers, Calendar, Terminal, ShieldCheck, LogOut
} from 'lucide-react';

export default function App() {
  // Global Session / UI States
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string} | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('Initiator');
  const [activeTab, setActiveTab] = useState<'memos' | 'payment-tracker' | 'audit' | 'reports'>('memos');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  
  // Real-time Database state triggers
  const [memos, setMemos] = useState<MemoRequest[]>(INITIAL_MEMOS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // Quick State Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | MemoType>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [memoSubTab, setMemoSubTab] = useState<'ALL' | 'PENDING_ME' | 'QUERIES' | 'CLOSED'>('ALL');

  // Compute pending items for Role switcher notification tags
  const getPendingCountForRole = (role: Role): number => {
    // If there's an unresolved query, it goes to the Initiator
    const memosWithQueries = memos.filter(m => m.queries.some(q => !q.answer));

    if (role === 'Initiator') {
      return memosWithQueries.length + memos.filter(m => m.status === 'ReturnedForCorrection').length;
    }

    // Queries block normal progress for all reviewers
    const normalMemos = memos.filter(m => !m.queries.some(q => !q.answer));

    switch (role) {
      case 'LineManager':
        return normalMemos.filter(m => 
          m.status === 'PendingLineManager' || 
          (m.type === 'Retirement' && m.status === 'RetirementSubmitted')
        ).length;
      case 'Auditor':
        return normalMemos.filter(m => 
          m.status === 'PendingAuditor' || 
          (m.type === 'Retirement' && m.status === 'PendingRetirementLineManager') || // LineMgr approved retirement
          (m.type === 'Retirement' && m.status === 'PendingRetirementAuditor')
        ).length;
      case 'Executive':
        return normalMemos.filter(m => m.status === 'PendingExecutive').length;
      case 'Finance':
        return normalMemos.filter(m => 
          m.status === 'PendingFinance' ||
          (m.type === 'Retirement' && m.status === 'PendingRetirementAuditor') || // Auditor approved retirement
          (m.type === 'Retirement' && m.status === 'PendingRetirementFinance')
        ).length;
      default:
        return 0;
    }
  };

  const pendingCounts: Record<Role, number> = {
    Initiator: getPendingCountForRole('Initiator'),
    LineManager: getPendingCountForRole('LineManager'),
    Auditor: getPendingCountForRole('Auditor'),
    Executive: getPendingCountForRole('Executive'),
    Finance: getPendingCountForRole('Finance'),
    Admin: 0
  };

  // Generate notifications builder
  const pushNotification = (message: string, type: 'info' | 'success' | 'alert' | 'urgent') => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type
    };
    setNotifications([newNotif, ...notifications]);
  };

  // Submission handler for new request (MemoForm Callback)
  const handleCreateMemo = (newMemoData: any) => {
    const nextIdNumber = memos.length + 13; // ensure unique increment indexing
    const formattedId = `VET/MEMO/2026/${nextIdNumber}`;
    
    const newMemo: MemoRequest = {
      id: formattedId,
      type: newMemoData.type,
      title: newMemoData.title,
      purpose: newMemoData.purpose,
      businessJustification: newMemoData.businessJustification,
      amount: newMemoData.amount,
      costCenter: newMemoData.costCenter,
      department: newMemoData.department,
      beneficiary: newMemoData.beneficiary,
      expectedRetirementDate: newMemoData.expectedRetirementDate,
      priority: newMemoData.priority,
      attachments: newMemoData.attachments,
      status: 'PendingLineManager', // Default workflow status
      createdAt: new Date().toISOString(),
      initiator: {
        name: newMemoData.initiatorSignature.name,
        email: 'a.olanrewaju@vetiva.com' // Map default employee email
      },
      comments: [
        {
          id: `comment-${Date.now()}`,
          userName: newMemoData.initiatorSignature.name,
          userRole: 'Initiator',
          message: `Memo initiated. Secured digital signature applied by ${newMemoData.initiatorSignature.name}.`,
          timestamp: new Date().toISOString()
        }
      ],
      queries: [],
      signatures: {
        Initiator: newMemoData.initiatorSignature
      }
    };

    // Append to lists
    setMemos([newMemo, ...memos]);
    
    // Add Audit Record
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: newMemoData.initiatorSignature.name,
      role: 'Initiator',
      action: 'MEMO_CREATED',
      ipAddress: '192.168.10.88',
      memoId: formattedId,
      details: `Created ${newMemoData.type} memo titled "${newMemoData.title}" amounting N${newMemoData.amount.toLocaleString()}`
    };
    setAuditLogs([newLog, ...auditLogs]);

    pushNotification(`New ${newMemoData.type} "${newMemoData.title}" submitted to Line Manager for approval.`, 'info');
    setShowCreateForm(false);
  };

  // Decisions trigger (Details Pane actions callback)
  const handleDetailsPaneAction = (
    action: 'Approve' | 'Reject' | 'Query' | 'Return' | 'AnswerQuery', 
    comment: string, 
    sig?: ESignature, 
    queryText?: string,
    queryAnswer?: string
  ) => {
    if (!selectedMemoId) return;

    const opName = sig?.name || (currentRole === 'Initiator' ? 'Kolawole Davies' : currentRole);
    const opTitle = sig?.position || 'Authorized Signer';

    setMemos(memos.map(memo => {
      if (memo.id !== selectedMemoId) return memo;

      let updatedStatus: MemoStatus = memo.status;
      const updatedSignatures = { ...memo.signatures };
      const updatedComments = [...memo.comments];
      const updatedQueries = [...memo.queries];

      // Format current timestamp
      const nowStr = new Date().toLocaleString();

      if (action === 'Approve') {
        if (memo.type === 'Retirement') {
          // Retirement approvals lifecycle
          if (memo.status === 'RetirementSubmitted') {
            updatedStatus = 'PendingRetirementAuditor';
            updatedSignatures.RetirementLineManager = sig;
          } else if (memo.status === 'PendingRetirementLineManager') {
            updatedStatus = 'PendingRetirementAuditor';
            updatedSignatures.RetirementLineManager = sig;
          } else if (memo.status === 'PendingRetirementAuditor') {
            updatedStatus = 'PendingRetirementFinance';
            updatedSignatures.RetirementAuditor = sig;
          }
        } else {
          // Standard approvals lifecycle
          if (memo.status === 'PendingLineManager') {
            updatedStatus = 'PendingAuditor';
            updatedSignatures.LineManager = sig;
          } else if (memo.status === 'PendingAuditor') {
            updatedStatus = 'PendingExecutive';
            updatedSignatures.Auditor = sig;
          } else if (memo.status === 'PendingExecutive') {
            updatedStatus = 'PendingFinance';
            updatedSignatures.Executive = sig;
          }
        }

        // Add to remarks
        updatedComments.push({
          id: `c-${Date.now()}`,
          userName: opName,
          userRole: currentRole,
          message: comment || `Approved request and applied electronic workflow signature.`,
          timestamp: new Date().toISOString()
        });

        // Add compliance log
        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: opName,
          role: currentRole,
          action: 'MEMO_APPROVED',
          ipAddress: '192.168.10.15',
          memoId: memo.id,
          details: `Approved by ${opName} (${opTitle}). Transitioned eligibility status to ${updatedStatus}`
        };
        setAuditLogs([newLog, ...auditLogs]);

        pushNotification(`Memo ${memo.id} approved by ${currentRole} and transitioned to ${updatedStatus}.`, 'success');
      }

      else if (action === 'Reject') {
        updatedStatus = memo.type === 'Retirement' ? 'RetirementRejected' : 'Rejected';
        
        updatedComments.push({
          id: `c-${Date.now()}`,
          userName: opName,
          userRole: currentRole,
          message: `🚨 REJECTED: ${comment}`,
          timestamp: new Date().toISOString()
        });

        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: opName,
          role: currentRole,
          action: 'MEMO_REJECTED',
          ipAddress: '192.168.10.22',
          memoId: memo.id,
          details: `REJECTED request actioned by ${opName}. Comments: ${comment}`
        };
        setAuditLogs([newLog, ...auditLogs]);

        pushNotification(`Memo ${memo.id} was REJECTED by ${currentRole}.`, 'alert');
      }

      else if (action === 'Query' && queryText) {
        // Pauses workflow. Marks query as active.
        const newQuery: QueryEntry = {
          id: `q-${Date.now()}`,
          question: queryText,
          questionBy: currentRole,
          questionByName: opName,
          timestamp: new Date().toISOString()
        };
        updatedQueries.push(newQuery);
        updatedStatus = 'ReturnedForCorrection';

        updatedComments.push({
          id: `c-${Date.now()}`,
          userName: opName,
          userRole: currentRole,
          message: `❓ POLICY QUERY RAISED: "${queryText}"`,
          timestamp: new Date().toISOString()
        });

        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: opName,
          role: currentRole,
          action: 'MEMO_QUERY_RAISED',
          ipAddress: '192.168.12.8',
          memoId: memo.id,
          details: `Raised clarification query: "${queryText}"`
        };
        setAuditLogs([newLog, ...auditLogs]);

        pushNotification(`Policy discrepancy query raised on Memo ${memo.id} by ${currentRole}. Paused.`, 'alert');
      }

      else if (action === 'Return') {
        updatedStatus = 'ReturnedForCorrection';
        updatedComments.push({
          id: `c-${Date.now()}`,
          userName: opName,
          userRole: currentRole,
          message: `Returned for correction. Remarks: "${comment}"`,
          timestamp: new Date().toISOString()
        });

        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: opName,
          role: currentRole,
          action: 'MEMO_RETURNED',
          ipAddress: '192.168.12.9',
          memoId: memo.id,
          details: `Returned memo for corrections: "${comment}"`
        };
        setAuditLogs([newLog, ...auditLogs]);

        pushNotification(`Memo ${memo.id} returned to employee for structural adjustments.`, 'info');
      }

      else if (action === 'AnswerQuery' && queryAnswer) {
        // Answer latest query
        const unresQIdx = updatedQueries.findIndex(q => !q.answer);
        if (unresQIdx !== -1) {
          updatedQueries[unresQIdx].answer = queryAnswer;
          updatedQueries[unresQIdx].answeredAt = new Date().toISOString();
        }

        // Restore original approval status based on who query was raised by
        const originalQuerier = updatedQueries[unresQIdx]?.questionBy || 'LineManager';
        if (memo.type === 'Retirement') {
          updatedStatus = 'RetirementSubmitted'; // return to review state
        } else {
          updatedStatus = originalQuerier === 'LineManager' ? 'PendingLineManager' : originalQuerier === 'Auditor' ? 'PendingAuditor' : 'PendingExecutive';
        }

        updatedComments.push({
          id: `c-${Date.now()}`,
          userName: 'Kolawole Davies (Initiator)',
          userRole: 'Initiator',
          message: `✓ CLARIFICATION ANSWER SUBMITTED: "${queryAnswer}"`,
          timestamp: new Date().toISOString()
        });

        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Kolawole Davies',
          role: 'Initiator',
          action: 'MEMO_QUERY_ANSWERED',
          ipAddress: '192.168.10.3',
          memoId: memo.id,
          details: `Responded to query with clarification: "${queryAnswer}"`
        };
        setAuditLogs([newLog, ...auditLogs]);

        pushNotification(`Employee answered compliance queries on Memo ${memo.id}. Approval state resumed.`, 'success');
      }

      return {
        ...memo,
        status: updatedStatus,
        signatures: updatedSignatures,
        comments: updatedComments,
        queries: updatedQueries
      };
    }));
  };

  // Finance settlement handler (FinanceModule Callback)
  const handleFinanceDisbursal = (
    memoId: string, 
    voucherNo: string, 
    bankRef: string, 
    paymentMethod: string, 
    custodian: string, 
    proofName: string,
    sig: ESignature
  ) => {
    setMemos(memos.map(memo => {
      if (memo.id !== memoId) return memo;

      const isAdvance = memo.type === 'CashAdvance';
      const resolvedStatus: MemoStatus = isAdvance ? 'Paid' : memo.type === 'PettyCash' ? 'Released' : 'Paid';

      const updatedComments = [...memo.comments, {
        id: `c-${Date.now()}`,
        userName: sig.name,
        userRole: 'Finance' as Role,
        message: `Disbursed funds of N${memo.amount.toLocaleString()}. Assigned PV voucher ${voucherNo}. Transaction complete.`,
        timestamp: new Date().toISOString()
      }];

      return {
        ...memo,
        status: memo.type === 'Retirement' ? 'RetirementCompleted' : resolvedStatus,
        financeVoucherNo: voucherNo,
        bankReference: bankRef,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod,
        cashCustodian: custodian,
        paymentProofName: proofName,
        signatures: {
          ...memo.signatures,
          Finance: sig,
          ...(memo.type === 'Retirement' ? { RetirementFinance: sig } : {})
        },
        comments: updatedComments
      };
    }));

    // Add Audit ledger entry
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: sig.name,
      role: 'Finance',
      action: 'MEMO_COMPLETED_PAID',
      ipAddress: '192.168.10.5',
      memoId: memoId,
      details: `TREASURY DISBURSED. Issued voucher ${voucherNo}. Bank Reference code logged: ${bankRef}.`
    };
    setAuditLogs([newLog, ...auditLogs]);

    pushNotification(`Treasury cleared and disbursed NGN payment reference ${voucherNo} for memo ${memoId}.`, 'success');
  };

  // Pre-filter database records based on tabs/search query
  const filteredMemos = memos.filter(memo => {
    // 1. Text Search matching title, ID, purpose, department, or beneficiary
    const matchesSearch = 
      memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Type filtering
    const matchesType = filterType === 'ALL' || memo.type === filterType;

    // 3. Priority filter matcher
    const matchesPriority = filterPriority === 'ALL' || memo.priority === filterPriority;

    // 4. Sub-tab inboxes filter mapping
    let matchesSubTab = true;
    if (memoSubTab === 'PENDING_ME') {
      // Show memos requiring active role review
      const hasUnresolvedQuery = memo.queries.some(q => !q.answer);
      if (hasUnresolvedQuery) {
        matchesSubTab = currentRole === 'Initiator';
      } else {
        if (memo.type === 'Retirement') {
          if (memo.status === 'RetirementSubmitted' && currentRole === 'LineManager') matchesSubTab = true;
          else if (memo.status === 'PendingRetirementAuditor' && currentRole === 'Auditor') matchesSubTab = true;
          else if (memo.status === 'PendingRetirementFinance' && currentRole === 'Finance') matchesSubTab = true;
          else matchesSubTab = false;
        } else {
          switch (memo.status) {
            case 'PendingLineManager':
              matchesSubTab = currentRole === 'LineManager';
              break;
            case 'PendingAuditor':
              matchesSubTab = currentRole === 'Auditor';
              break;
            case 'PendingExecutive':
              matchesSubTab = currentRole === 'Executive';
              break;
            case 'PendingFinance':
              matchesSubTab = currentRole === 'Finance';
              break;
            default:
              matchesSubTab = false;
          }
        }
      }
    } else if (memoSubTab === 'QUERIES') {
      matchesSubTab = memo.status === 'ReturnedForCorrection' || memo.queries.some(q => !q.answer);
    } else if (memoSubTab === 'CLOSED') {
      matchesSubTab = ['Paid', 'Released', 'RetirementCompleted', 'Rejected', 'RetirementRejected'].includes(memo.status);
    }

    return matchesSearch && matchesType && matchesPriority && matchesSubTab;
  });

  // Collect the Paid advances lists so employees can select one to retire
  const eligiblePaidAdvances = memos
    .filter(m => (m.status === 'Paid' || m.status === 'Released') && (m.type === 'CashAdvance' || m.type === 'PettyCash'))
    .map(m => ({ id: m.id, title: m.title, amount: m.amount, type: m.type }));

  const activeSelectedMemo = memos.find(m => m.id === selectedMemoId);

  if (!isAuthenticated) {
    return (
      <SignInDashboard 
        onSignIn={(role, name, email) => {
          setCurrentRole(role);
          setCurrentUser({ name, email });
          setIsAuthenticated(true);
          // Focus view appropriately
          if (role === 'Admin') setActiveTab('audit');
          else if (role === 'Finance') setActiveTab('payment-tracker');
          else setActiveTab('memos');
        }}
        pendingCounts={pendingCounts}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none selection:bg-blue-100 selection:text-[#0F172A] transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      
      {/* Vetiva Corporate Header */}
      <header className={`px-6 py-4.5 shrink-0 shadow-sm border-b transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://imgur.com/12nOK79.png" alt="Vetiva Logo" referrerPolicy="no-referrer" className="h-9 w-auto object-contain shrink-0" />
            <div>
              <h1 className={`text-sm font-black tracking-widest uppercase transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Vetiva Capital Management
              </h1>
              <span className={`text-[10px] font-mono tracking-widest uppercase font-semibold ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Internal Memo &amp; Corporate Treasury Ledger V1.1
              </span>
            </div>
          </div>

          {/* Quick Notification Ribbon */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border select-none transition-colors ${
                theme === 'dark' ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <div className="text-left">
                  <span className={`text-[10px] font-bold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-805'}`}>{currentUser.name}</span>
                  <span className="text-[8.5px] text-slate-500 block leading-none font-mono">{currentUser.email}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                alert("Simulating standard real-time push email sync: all notification logs are verified live.");
              }}
              className={`relative p-2 border rounded-xl transition-all cursor-pointer shadow-sm ${
                theme === 'dark'
                  ? 'bg-[#1E293B] border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-650 hover:text-slate-950'
              }`}
            >
              <Bell className="w-4 h-4 text-emerald-600" />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono rounded-full font-bold h-4 w-4 text-[9px] flex items-center justify-center border border-white animate-pulse">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Day / Dark mode toggler button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm text-xs flex items-center justify-center h-8.5 w-8.5 ${
                theme === 'dark'
                  ? 'bg-[#1E293B] border-slate-700 text-yellow-400 hover:text-yellow-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Security Sign Out */}
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setCurrentUser(null);
                setSelectedMemoId(null);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm text-xs flex items-center gap-1.5 font-bold h-8.5 ${
                theme === 'dark'
                  ? 'bg-rose-950/20 border-rose-900 text-rose-405 hover:bg-rose-955/30'
                  : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
              }`}
              title="Sign Out Access Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Role Switcher Controls Ribbon */}
      <RoleSwitcher 
        currentRole={currentRole} 
        onRoleChange={(role) => {
          setCurrentRole(role);
          // If admin triggers role change, adjust appropriate active tab views
          if (role === 'Admin') setActiveTab('audit');
          else if (role === 'Finance') setActiveTab('payment-tracker');
          else setActiveTab('memos');
          setSelectedMemoId(null);
        }} 
        pendingCounts={pendingCounts} 
        theme={theme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-6 overflow-hidden">
        
        {/* Dynamic Urgent Broadcast Banner */}
        {notifications.filter(n => n.type === 'urgent' && !n.read).length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between gap-4 text-xs text-rose-700 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong className="font-bold">Urgent Action Mandate:</strong>
                <span className="ml-1.5">{notifications.find(n => n.type === 'urgent')?.message}</span>
              </div>
            </div>
            <button
              onClick={() => {
                // Dim/dismiss
                setNotifications(notifications.map(n => n.type === 'urgent' ? { ...n, read: true } : n));
              }}
              className="bg-rose-100 hover:bg-rose-200 text-rose-900 px-2.5 py-1 rounded text-[10px] font-bold transition-all"
            >
              Dismiss alert
            </button>
          </div>
        )}

        {/* Layout Navigation Sub-tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
            {[
              { id: 'memos', label: 'Memos Dashboard' },
              { id: 'payment-tracker', label: 'Treasury Settlement' },
              { id: 'audit', label: 'Compliance Audit Trail' },
              { id: 'reports', label: 'Performance Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedMemoId(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {currentRole === 'Initiator' && (
            <button
              onClick={() => {
                setShowCreateForm(true);
                setSelectedMemoId(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Initiate Memo
            </button>
          )}
        </div>

        {/* VIEW 1: MEMO DASHBOARD LISTINGS */}
        {activeTab === 'memos' && !showCreateForm && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Table Listings column */}
            <div className={`lg:col-span-8 flex flex-col space-y-4 ${selectedMemoId ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                      {/* Quick Filters ribbon */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between select-none shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-55 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setMemoSubTab('ALL')}
                    className={`px-3 py-1.5 text-[10.5px] font-bold rounded cursor-pointer transition-all ${
                      memoSubTab === 'ALL' ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Memos
                  </button>
                  <button
                    onClick={() => setMemoSubTab('PENDING_ME')}
                    className={`px-3 py-1.5 text-[10.5px] font-bold rounded flex items-center gap-1 cursor-pointer transition-all ${
                      memoSubTab === 'PENDING_ME' ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pending Inbox ({memos.length - pendingCounts.Admin})
                  </button>
                  <button
                    onClick={() => setMemoSubTab('QUERIES')}
                    className={`px-3 py-1.5 text-[10.5px] font-bold rounded cursor-pointer transition-all ${
                      memoSubTab === 'QUERIES' ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Queries
                  </button>
                  <button
                    onClick={() => setMemoSubTab('CLOSED')}
                    className={`px-3 py-1.5 text-[10.5px] font-bold rounded cursor-pointer transition-all ${
                      memoSubTab === 'CLOSED' ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Closed Memos
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-48 bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-750 focus:outline-none focus:border-blue-500 shadow-sm"
                      placeholder="Title or Beneficiary..."
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="ALL">All Vouchers</option>
                    <option value="CashAdvance">Cash Advance</option>
                    <option value="PettyCash">Petty Cash</option>
                    <option value="VendorPayment">Vendor Payment</option>
                    <option value="Retirement">Petty Cash Retirement</option>
                  </select>
                </div>
              </div>
              {/* Memos database table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {filteredMemos.length === 0 ? (
                  <div className="p-16 text-center text-xs text-slate-500">
                    <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <strong className="block text-slate-700 text-sm font-semibold mb-1">No Memo records in this layout query</strong>
                    <span>Use filters adjust, switch roles, or click &quot;Initiate Memo&quot; to seed.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto select-none">
                    <table className="w-full text-left font-medium text-xs">
                      <thead className="bg-[#FAF9F6] border-b border-slate-200 text-[10.5px] uppercase font-mono text-slate-500">
                        <tr>
                          <th className="py-3 px-4 font-normal">Memo ID</th>
                          <th className="py-3 px-4 font-normal">Title / Purpose Scope</th>
                          <th className="py-3 px-4 font-normal text-right">Requested Amount</th>
                          <th className="py-3 px-4 font-normal">Corporate Dept</th>
                          <th className="py-3 px-4 font-normal text-center">Priority</th>
                          <th className="py-3 px-4 font-normal text-center">Verification Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMemos.map((memo) => {
                          const isSelected = memo.id === selectedMemoId;
                          
                          // Custom status colors
                          let statusColor = "bg-slate-100 text-slate-655 border border-slate-200";
                          if (memo.status.includes('Paid') || memo.status.includes('Released') || memo.status.includes('Completed') || memo.status === 'RetirementCompleted') {
                            statusColor = "bg-emerald-50 text-emerald-800 border border-emerald-200";
                          } else if (memo.status.includes('Pending') || memo.status === 'RetirementSubmitted') {
                            statusColor = "bg-blue-50 text-blue-700 border border-blue-200";
                          } else if (memo.status === 'ReturnedForCorrection') {
                            statusColor = "bg-amber-50 text-amber-700 border border-amber-250 font-bold";
                          } else if (memo.status.includes('Rejected')) {
                            statusColor = "bg-rose-50 text-rose-700 border border-rose-200";
                          }

                          return (
                            <tr
                              key={memo.id}
                              onClick={() => setSelectedMemoId(memo.id)}
                              className={`hover:bg-slate-50/70 select-none cursor-pointer border-b border-slate-105 transition-colors ${
                                isSelected ? 'bg-blue-50/40 border-l-4 border-blue-600 font-semibold' : ''
                              }`}
                            >
                              <td className="py-3.5 px-4 font-mono text-blue-600 font-bold shrink-0">{memo.id}</td>
                              <td className="py-3.5 px-4 max-w-sm">
                                <span className="text-slate-900 font-semibold text-sm block truncate">{memo.title}</span>
                                <span className="text-[11px] text-slate-500 font-sans block mt-0.5 lowercase font-normal">
                                  by <strong className="text-slate-750">{memo.beneficiary}</strong> • {memo.type === 'CashAdvance' ? 'Cash Advance' : memo.type === 'PettyCash' ? 'Petty Cash' : memo.type === 'VendorPayment' ? 'Vendor Pay' : 'Petty Cash Retirement'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                                ₦{memo.amount.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="text-slate-700 block font-medium">{memo.department}</span>
                                <span className="text-[10px] text-slate-400 font-mono block uppercase">{memo.costCenter}</span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  memo.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  memo.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  memo.priority === 'Medium' ? 'bg-blue-50 text-blue-750 border border-blue-200' :
                                  'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {memo.priority}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold tracking-wider ${statusColor}`}>
                                  {memo.status === 'PendingLineManager' ? 'Line Mgr' : memo.status === 'PendingAuditor' ? 'Internal Control' : memo.status === 'PendingExecutive' ? 'CEO Clear' : memo.status === 'PendingFinance' ? 'Settlement' : memo.status === 'Paid' ? 'Paid' : memo.status === 'Released' ? 'Released' : memo.status === 'ReturnedForCorrection' ? 'Query Unresolved' : memo.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Details / Progress Stepper Panel */}
            {selectedMemoId && activeSelectedMemo && (
              <div className="lg:col-span-5">
                <MemoDetailsPane 
                  memo={activeSelectedMemo}
                  currentRole={currentRole}
                  onAction={handleDetailsPaneAction}
                  onClose={() => setSelectedMemoId(null)}
                />
              </div>
            )}

          </div>
        )}

        {/* VIEW 1.B: INITIATE MEMO WIZARD MODAL */}
        {activeTab === 'memos' && showCreateForm && (
          <MemoForm 
            paidAdvances={eligiblePaidAdvances}
            onSubmit={handleCreateMemo} 
            onCancel={() => setShowCreateForm(false)} 
          />
        )}

        {/* VIEW 2: PAYMENT TRACKING MODULE */}
        {activeTab === 'payment-tracker' && (
          <div className="space-y-6">
            
            {/* Quick Analytics ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
              <div className="bg-slate-900 border border-slate-900 p-4.5 rounded-xl text-xs space-y-1">
                <span className="text-slate-500 uppercase font-bold text-[9px]">Unpaid Approved Memos</span>
                <strong className="text-lg text-slate-200 font-mono block">
                  {memos.filter(m => m.status === 'PendingFinance').length} items
                </strong>
                <span className="text-[10px] text-amber-500">Wait voucher routing</span>
              </div>
              <div className="bg-slate-900 border border-slate-900 p-4.5 rounded-xl text-xs space-y-1">
                <span className="text-slate-500 uppercase font-bold text-[9px]">Unretired Outstanding Advances</span>
                <strong className="text-lg text-slate-200 font-mono block">
                  {memos.filter(m => m.type === 'CashAdvance' && m.status === 'Paid').length} items
                </strong>
                <span className="text-[10px] text-amber-500">Subject to reconciliation deadlines</span>
              </div>
              <div className="bg-slate-900 border border-slate-900 p-4.5 rounded-xl text-xs space-y-1">
                <span className="text-slate-500 uppercase font-bold text-[9px]">Gross Funds Settled Cash</span>
                <strong className="text-lg text-slate-200 font-mono block">
                  ₦{memos.filter(m => ['Paid', 'Released', 'RetirementCompleted'].includes(m.status)).reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                </strong>
                <span className="text-[10px] text-emerald-400">Total Corporate Clearances</span>
              </div>
              <div className="bg-slate-900 border border-slate-900 p-4.5 rounded-xl text-xs space-y-1">
                <span className="text-slate-500 uppercase font-bold text-[9px]">Reconciled Retirements Completed</span>
                <strong className="text-lg text-slate-200 font-mono block">
                  {memos.filter(m => m.status === 'RetirementCompleted').length} items
                </strong>
                <span className="text-[10px] text-emerald-400">Audits verified logs</span>
              </div>
            </div>

            {/* Settle disbursal actioning component */}
            {currentRole === 'Finance' && (
              <FinanceModule 
                pendingFinanceRequests={memos.filter(m => m.status === 'PendingFinance')}
                onDisburse={handleFinanceDisbursal}
              />
            )}

            {/* Standard Payment Tracker table tracking */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="text-[#10b981] w-4.5 h-4.5" />
                  Corporate Settlement &amp; Payments tracking index
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Real-time closing accounts</span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left font-medium">
                  <thead className="bg-slate-950 border-b border-slate-850 text-[10.5px] uppercase font-mono text-slate-550">
                    <tr>
                      <th className="py-2.5 px-4 font-normal">Memo Reference</th>
                      <th className="py-2.5 px-4 font-normal">Beneficiary name</th>
                      <th className="py-2.5 px-4 font-normal">Amount Approved</th>
                      <th className="py-2.5 px-4 font-normal">Clearing Voucher No</th>
                      <th className="py-2.5 px-4 font-normal">Transfer Slip Date</th>
                      <th className="py-2.5 px-4 font-normal">Status Flag</th>
                      <th className="py-2.5 px-4 font-normal">Retirement schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {memos.filter(m => ['Paid', 'Released', 'PendingFinance', 'RetirementSubmitted', 'RetirementCompleted'].includes(m.status)).map((m) => {
                      return (
                        <tr key={m.id} className="hover:bg-slate-950/40">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{m.id}</td>
                          <td className="py-3 px-4 font-semibold text-slate-200">
                            {m.beneficiary}
                            <span className="text-[10px] text-slate-500 font-mono block lowercase font-normal">{m.department}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-100">₦{m.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">{m.financeVoucherNo || <span className="text-slate-650 italic">— Pending Settle —</span>}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">{m.paymentDate || '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold tracking-wide ${
                              m.status === 'Paid' ? 'bg-emerald-950/45 text-emerald-400' :
                              m.status === 'Released' ? 'bg-indigo-950 text-indigo-400' :
                              m.status === 'PendingFinance' ? 'bg-yellow-950/30 text-yellow-500 animate-pulse' :
                              'bg-indigo-950/60 text-indigo-400'
                            }`}>
                              {m.status === 'PendingFinance' ? 'Pending Payment' : m.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {m.type === 'CashAdvance' ? (
                              <span className={`text-[10.5px] font-bold ${
                                m.status === 'RetirementCompleted' ? 'text-emerald-400' : 'text-amber-500 animate-pulse'
                              }`}>
                                {m.status === 'RetirementCompleted' ? 'Fully Retired ✓' : 'Outstanding Retirement'}
                              </span>
                            ) : (
                              <span className="text-slate-600">Not Applicable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: COMPLIANCE AUDIT TRIAL */}
        {activeTab === 'audit' && (
          <AuditTrailTab 
            logs={auditLogs} 
            onClear={() => {
              setAuditLogs(INITIAL_AUDIT_LOGS);
              pushNotification("Audit Trial records compliance clearing console reset completed.", "info");
            }} 
            theme={theme}
          />
        )}

        {/* VIEW 4: PERFORMANCE REPORTS COCKPIT */}
        {activeTab === 'reports' && (
          <ReportsTab memos={memos} theme={theme} />
        )}

      </main>

      {/* Corporate Compliance footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 text-center text-[10px] text-slate-500 font-mono mt-auto select-none">
        Secure SHA-256 Ledger: CC92A72B-F6C7A901-FDE89472-B7020E90 • Vetiva Corporate Governance Policy Compliance verified 2026.
      </footer>
    </div>
  );
}
