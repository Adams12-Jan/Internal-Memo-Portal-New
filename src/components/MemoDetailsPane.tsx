import React, { useState } from 'react';
import { MemoRequest, Role, ESignature, Comment, QueryEntry } from '../types';
import DigitalSignature from './DigitalSignature';
import { 
  X, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, FileText, 
  MessageSquare, History, Signature, UserCheck, Check, Printer, Send 
} from 'lucide-react';

interface MemoDetailsPaneProps {
  memo: MemoRequest;
  currentRole: Role;
  onAction: (
    action: 'Approve' | 'Reject' | 'Query' | 'Return' | 'AnswerQuery', 
    comment: string, 
    sig?: ESignature, 
    queryText?: string,
    queryAnswer?: string
  ) => void;
  onClose: () => void;
}

export default function MemoDetailsPane({ memo, currentRole, onAction, onClose }: MemoDetailsPaneProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'comments' | 'queries'>('info');
  const [actionComment, setActionComment] = useState('');
  const [showApprovalSection, setShowApprovalSection] = useState(false);
  const [activeApprovalType, setActiveApprovalType] = useState<'Approve' | 'Reject' | 'Query' | 'Return' | null>(null);
  const [queryTargetText, setQueryTargetText] = useState('');
  const [queryResponseMsg, setQueryResponseMsg] = useState('');
  const [appliedSignature, setAppliedSignature] = useState<ESignature | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Determine if the current role actually can act on this memo
  const canRoleAct = () => {
    // If there's an unresolved query pending for the initiator, only the initiator can answer. No reviews can proceed.
    const hasUnresolvedQuery = memo.queries.some(q => !q.answer);
    if (hasUnresolvedQuery) {
      return currentRole === 'Initiator';
    }

    if (memo.type === 'Retirement') {
      if (memo.status === 'RetirementSubmitted' && currentRole === 'LineManager') return true;
      if (memo.status === 'PendingRetirementLineManager' && currentRole === 'LineManager') return true; // Fail safe
      if (memo.status === 'PendingRetirementAuditor' && currentRole === 'Auditor') return true;
      if (memo.status === 'PendingRetirementFinance' && currentRole === 'Finance') return true;
      return false;
    }

    switch (memo.status) {
      case 'PendingLineManager':
        return currentRole === 'LineManager';
      case 'PendingAuditor':
        return currentRole === 'Auditor';
      case 'PendingExecutive':
        return currentRole === 'Executive';
      case 'PendingFinance':
        return currentRole === 'Finance'; // Finance processes payment details separately, but can approve
      default:
        return false;
    }
  };

  const getStatusBadge = (status: string) => {
    const defaultClasses = "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ";
    switch (status) {
      case 'Draft':
        return <span className={defaultClasses + "bg-slate-100 border-slate-200 text-slate-600"}>Draft</span>;
      case 'PendingLineManager':
        return <span className={defaultClasses + "bg-blue-50 border-blue-200 text-blue-700 font-semibold"}>Pending Line Mgr</span>;
      case 'PendingAuditor':
        return <span className={defaultClasses + "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"}>Pending Auditor Review</span>;
      case 'PendingExecutive':
        return <span className={defaultClasses + "bg-amber-50 border-amber-205 text-amber-705"}>Pending Executive</span>;
      case 'PendingFinance':
        return <span className={defaultClasses + "bg-violet-50 border-violet-200 text-violet-700"}>Waiting Payment Processing</span>;
      case 'Paid':
        return <span className={defaultClasses + "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"}>Cash Advance Paid</span>;
      case 'Released':
        return <span className={defaultClasses + "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"}>Petty Cash Released</span>;
      case 'RetirementSubmitted':
        return <span className={defaultClasses + "bg-sky-50 border-sky-200 text-sky-700"}>Retirement Submitted</span>;
      case 'PendingRetirementLineManager':
        return <span className={defaultClasses + "bg-sky-50 border-sky-200 text-sky-700 animate-pulse font-bold"}>Pending Retirement Mgr</span>;
      case 'PendingRetirementAuditor':
        return <span className={defaultClasses + "bg-indigo-50 border-indigo-200 text-indigo-700"}>Retirement Auditor Verification</span>;
      case 'PendingRetirementFinance':
        return <span className={defaultClasses + "bg-blue-50 border-blue-200 text-blue-700"}>Retirement Finance Close</span>;
      case 'RetirementCompleted':
        return <span className={defaultClasses + "bg-emerald-55 border-emerald-200 text-emerald-800"}>Retirement Completed</span>;
      case 'RetirementRejected':
        return <span className={defaultClasses + "bg-rose-50 border-rose-200 text-rose-700"}>Retirement Rejected</span>;
      case 'ReturnedForCorrection':
        return <span className={defaultClasses + "bg-amber-50 border-amber-200 text-amber-800 font-black"}>Query / Return For Correction</span>;
      case 'Rejected':
        return <span className={defaultClasses + "bg-rose-50 border-rose-200 text-rose-700"}>Rejected</span>;
      default:
        return <span className={defaultClasses + "bg-slate-105 border-slate-205 text-slate-700"}>{status}</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Urgent': return <span className="text-[10px] font-bold bg-rose-50 border border-rose-205 text-rose-700 px-2.5 py-1 rounded-full uppercase">Urgent Priority</span>;
      case 'High': return <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-705 px-2.5 py-1 rounded-full uppercase">High Priority</span>;
      case 'Medium': return <span className="text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full">Medium Priority</span>;
      default: return <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-650 px-2.5 py-1 rounded-full uppercase">Low Priority</span>;
    }
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApprovalType) return;

    if (activeApprovalType === 'Query' && !queryTargetText.trim()) {
      alert("A query question string must be completed.");
      return;
    }

    if (activeApprovalType === 'Approve' && !appliedSignature) {
      alert("A digital signature is strictly mandated to endorse this asset authorization.");
      return;
    }

    onAction(
      activeApprovalType,
      actionComment || `${activeApprovalType} action by ${currentRole}`,
      appliedSignature || undefined,
      activeApprovalType === 'Query' ? queryTargetText : undefined
    );

    // Reset Form state
    setActionComment('');
    setQueryTargetText('');
    setAppliedSignature(null);
    setShowApprovalSection(false);
    setActiveApprovalType(null);
  };

  const handleAnswerQuerySubmit = (e: React.FormEvent, queryId: string) => {
    e.preventDefault();
    if (!queryResponseMsg.trim()) {
      alert("Please enter a response statement first.");
      return;
    }
    onAction('AnswerQuery', `Clarification: ${queryResponseMsg}`, undefined, undefined, queryResponseMsg);
    setQueryResponseMsg('');
  };

  // Simulated PDF export function
  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      // Create and download dummy text invoice
      const text = `
VETIVA CAPITAL MANAGEMENT LIMITED
=================================
OFFICIAL DIGITAL INTERNAL MEMO RECORD
Document ID: ${memo.id}
Generated: ${new Date().toLocaleString()}

MEMO SPECIFICATIONS:
Title: ${memo.title}
Requested By: ${memo.initiator.name} (${memo.initiator.email})
Department: ${memo.department}
Cost Center: ${memo.costCenter}
Requested Amount: NGN ${memo.amount.toLocaleString()}
Priority: ${memo.priority}
Purpose: ${memo.purpose}

FLOW DECISION LOG & E-SIGNATURE VERIFIED HISTORY:
${Object.entries(memo.signatures).map(([role, sig]) => `
-----------------------------------------
Role: ${role}
Officer Name: ${sig?.name}
Title: ${sig?.position}
State Decision: APPROVED
Date Endorsed: ${sig?.timestamp}
Digital Signature: SECURED ENCRYPTED VECTOR ID [${sig?.type === 'type' ? 'Keyboard: ' + sig.value : 'Signed via Trackpad Canvas'}]
`).join('')}

AUDIT LOG COMPLIANCE CHECKSUM:
Compliance Checksum SHA-256: F6C7A901FDE89472B7020E90C0E773A1BB92A72B72
Status: Certified Closed Ledger.
      `;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VET_MEMO_DOCKET_${memo.id.replace(/\//g, '_')}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }, 1500);
  };

  // Check unresolved query conditions
  const activeUnresolvedQuery = memo.queries.find(q => !q.answer);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
      {/* Detail Panel Header */}
      <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
            {memo.id}
          </span>
          <h3 className="text-sm font-bold text-slate-900 mt-1.5 truncate max-w-xs lg:max-w-md">{memo.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="p-1.5 text-xs text-slate-650 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Download Docket Summary"
          >
            {isExporting ? (
              <span className="animate-spin text-blue-600">●</span>
            ) : (
              <Printer className="w-3.5 h-3.5 text-blue-600" />
            )}
            Download
          </button>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Quick Stats Ribbon */}
      <div className="bg-slate-50/50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-550 font-medium">Status:</span>
          {getStatusBadge(memo.status)}
        </div>
        <div className="flex items-center gap-3">
          {getPriorityBadge(memo.priority)}
          <span className="text-slate-900 font-bold font-mono text-sm leading-none">
            ₦{memo.amount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Detail Selection Tabs */}
      <div className="flex bg-[#FAF9F6] border-b border-slate-200 px-4">
        {[
          { id: 'info', label: 'Overview', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'timeline', label: 'Approval Stepper', icon: <History className="w-3.5 h-3.5" /> },
          { id: 'comments', label: 'Discussion Logs', icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { id: 'queries', label: 'Policy Queries', icon: <HelpCircle className="w-3.5 h-3.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all relative cursor-pointer ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'queries' && memo.queries.length > 0 && (
              <span className="bg-amber-500 text-white h-3.5 w-3.5 flex items-center justify-center rounded-full text-[9px] font-bold">
                {memo.queries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pane content container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Initiator details card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-widest">Initiator / Beneficiary</span>
                <strong className="text-slate-800 text-sm block mt-0.5">{memo.initiator.name}</strong>
                <span className="text-slate-550 font-mono">{memo.initiator.email}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-widest">Target Department</span>
                <strong className="text-slate-800 block mt-0.5">{memo.department}</strong>
                <span className="text-xs text-slate-650 font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-3xs">
                  {memo.costCenter}
                </span>
              </div>
            </div>

            {/* Purpose & Justifications */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-600 uppercase tracking-widest text-[10px]">Business Purpose Scope</h4>
              <p className="bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                {memo.purpose}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-600 uppercase tracking-widest text-[10px]">Justification &amp; Impact Analysis</h4>
              <p className="bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                {memo.businessJustification}
              </p>
            </div>

            {/* Vendor remittance or Retirement details summary */}
            {memo.type === 'VendorPayment' && memo.vendorName && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-emerald-700 uppercase tracking-wide">Vendor Outbound Specifications</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium">
                  <div>Vendor Legal Name: <strong className="text-slate-800 block">{memo.vendorName}</strong></div>
                  <div>Account: <strong className="text-slate-800 font-mono block">{memo.accountNumber}</strong></div>
                  <div>Bank Institution: <strong className="text-slate-800 block">{memo.bankName}</strong></div>
                  <div>Target Reference: <strong className="text-blue-600 block font-mono">VET-PV-{memo.id.split('/').pop()}</strong></div>
                </div>
              </div>
            )}

            {memo.type === 'Retirement' && memo.retirementExpenses && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5 text-xs">
                <h4 className="font-bold text-emerald-700 uppercase tracking-wide flex justify-between">
                  <span>Expense Audits &amp; Receipt Allocations</span>
                  <span className="text-slate-500 font-mono text-[10px] lowercase font-normal">Link: {memo.originalMemoId}</span>
                </h4>
                
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {memo.retirementExpenses.map((exp, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-[11px] shadow-3xs">
                      <div>
                        <strong className="text-slate-800 block font-semibold">{exp.item}</strong>
                        <span className="text-slate-550">{exp.description}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-emerald-750 font-mono">N{exp.amount.toLocaleString()}</strong>
                        <span className="text-[9.5px] text-blue-600 font-mono block">{exp.receiptName}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Reconciliation balance calculation:</span>
                  <strong className={`${(memo.balanceReturned ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {(memo.balanceReturned ?? 0) >= 0 
                      ? `N${(memo.balanceReturned ?? 0).toLocaleString()} Refunded to Custodian`
                      : `N${Math.abs(memo.balanceReturned ?? 0).toLocaleString()} Refund due to Initiator`}
                  </strong>
                </div>
              </div>
            )}

            {/* Document Attachments Panel */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-600 uppercase tracking-widest text-[10px]">Supporting Invoices &amp; Attachments</h4>
              {memo.attachments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No attachments associated with this request.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {memo.attachments.map((file, i) => (
                    <div key={i} className="bg-white hover:bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors shadow-3xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium line-clamp-1">{file.name}</span>
                      </div>
                      <span className="font-mono text-[9px] text-slate-500">{file.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Finance processed payment vouchers rendering block */}
            {(memo.status === 'Paid' || memo.status === 'Released' || memo.status === 'RetirementCompleted') && memo.financeVoucherNo && (
              <div className="bg-emerald-50 border border-emerald-200 p-4.5 rounded-xl space-y-2.5 text-xs">
                <span className="text-emerald-800 font-bold uppercase tracking-widest text-[10px] block">
                  Processed Payment Voucher Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Voucher No: <strong className="text-slate-800 font-mono block">{memo.financeVoucherNo}</strong></div>
                  <div>Reference No: <strong className="text-slate-800 font-mono block">{memo.bankReference || 'MOCK-CSH-OTC-VAL'}</strong></div>
                  <div>Payment Date: <strong className="text-slate-850 block">{memo.paymentDate}</strong></div>
                  <div>Release Channel: <strong className="text-slate-850 block">{memo.paymentMethod || 'Over-the-counter'}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPROVAL STEPPER TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-5">
            <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px] mb-3">Workflow Lifecycle Stepper (MS Approvals Style)</h4>
            
            <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-800">
              
              {/* Step 1: Initiator Submission */}
              <div className="flex gap-4 relative">
                <div className="z-10 h-9 w-9 bg-emerald-950/80 border border-emerald-500 text-emerald-400 flex items-center justify-center rounded-full shrink-0 font-bold text-sm">
                  ✓
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex-1 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-200 text-sm">Memo Submitted</strong>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(memo.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">Initiated by {memo.initiator.name}. Digital signature applied.</p>
                  
                  {memo.signatures.Initiator && (
                    <div className="mt-3 bg-slate-900 p-2.5 rounded border border-slate-800 flex items-center justify-between gap-2 max-w-sm">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-bold block">{memo.signatures.Initiator.name}</span>
                        <span className="text-[9px] text-slate-500 block leading-none">{memo.signatures.Initiator.position}</span>
                        <span className="text-[8px] text-slate-600 block leading-normal">{memo.signatures.Initiator.timestamp}</span>
                      </div>
                      <div className="h-10 w-28 shrink-0 bg-slate-950 border border-slate-900 rounded flex items-center justify-center p-1">
                        {memo.signatures.Initiator.type === 'draw' || memo.signatures.Initiator.type === 'import' ? (
                          <img src={memo.signatures.Initiator.value} alt="Signature Vector representation value" className="h-full object-contain filter brightness-110" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-serif italic text-emerald-400 text-xs">{memo.signatures.Initiator.value}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Line Manager */}
              <div className="flex gap-4 relative">
                <div className={`z-10 h-9 w-9 flex items-center justify-center rounded-full shrink-0 font-bold text-sm ${
                  memo.signatures.LineManager ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-600'
                }`}>
                  {memo.signatures.LineManager ? '✓' : '2'}
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex-1 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-200 text-sm">Line Manager Review</strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {memo.signatures.LineManager ? 'Completed' : 'Awaiting Endorsement'}
                    </span>
                  </div>
                  <p className="text-slate-400">Certifies departmental budget checks and core strategic justification alignment.</p>
                  
                  {memo.signatures.LineManager ? (
                    <div className="mt-3 bg-slate-900 p-2.5 rounded border border-slate-800 flex items-center justify-between gap-2 max-w-sm">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-bold block">{memo.signatures.LineManager.name}</span>
                        <span className="text-[9px] text-slate-500 block leading-none">{memo.signatures.LineManager.position}</span>
                        <span className="text-[8px] text-slate-600 block">{memo.signatures.LineManager.timestamp}</span>
                      </div>
                      <div className="h-10 w-28 shrink-0 bg-slate-950 border border-slate-900 rounded flex items-center justify-center p-1 font-serif text-sky-400 italic">
                        {memo.signatures.LineManager.type === 'draw' || memo.signatures.LineManager.type === 'import' ? (
                          <img src={memo.signatures.LineManager.value} alt="Line Manager signature image representation" className="h-full object-contain filter invert-0" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{memo.signatures.LineManager.value}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-500/85 mt-2.5 block italic font-semibold">
                      {memo.status === 'PendingLineManager' ? "● Session active under Babatunde Lawson check" : "Awaiting previous level authorization."}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: Internal Control Auditor */}
              <div className="flex gap-4 relative">
                <div className={`z-10 h-9 w-9 flex items-center justify-center rounded-full shrink-0 font-bold text-sm ${
                  memo.signatures.Auditor ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-600'
                }`}>
                  {memo.signatures.Auditor ? '✓' : '3'}
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex-1 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-200 text-sm">Internal Control Compliance Review</strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {memo.signatures.Auditor ? 'Compliance Passed' : 'Awaiting Audit verification'}
                    </span>
                  </div>
                  <p className="text-slate-400">Verifies organizational policy compliance, voucher invoice details alignment, and funds audit tracking integrity.</p>
                  
                  {memo.signatures.Auditor ? (
                    <div className="mt-3 bg-slate-900 p-2.5 rounded border border-slate-800 flex items-center justify-between gap-2 max-w-sm">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-bold block">{memo.signatures.Auditor.name}</span>
                        <span className="text-[9px] text-slate-500 block leading-none">{memo.signatures.Auditor.position}</span>
                        <span className="text-[8px] text-slate-600 block">{memo.signatures.Auditor.timestamp}</span>
                      </div>
                      <div className="h-10 w-28 shrink-0 bg-slate-950 border border-slate-900 rounded flex items-center justify-center p-1">
                        {memo.signatures.Auditor.type === 'draw' || memo.signatures.Auditor.type === 'import' ? (
                          <img src={memo.signatures.Auditor.value} alt="Auditor digital signature reference" className="h-full object-contain filter brightness-110" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-serif italic text-purple-400 text-xs">{memo.signatures.Auditor.value}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-500/85 mt-2.5 block italic font-semibold">
                      {memo.status === 'PendingAuditor' ? "● Session active under Chioma Nze compliance query audits" : "Awaiting structural clearance level."}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 4: Executive CEO Approval */}
              <div className="flex gap-4 relative">
                <div className={`z-10 h-9 w-9 flex items-center justify-center rounded-full shrink-0 font-bold text-sm ${
                  memo.signatures.Executive ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-600'
                }`}>
                  {memo.signatures.Executive ? '✓' : '4'}
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex-1 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-200 text-sm">Executive CEO Management Approval</strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {memo.signatures.Executive ? 'Executive Approval cleared' : 'Awaiting CEO Sign'}
                    </span>
                  </div>
                  <p className="text-slate-400">Performs final utilization authorization before finance disbursements.</p>
                  
                  {memo.signatures.Executive ? (
                    <div className="mt-3 bg-slate-900 p-2.5 rounded border border-slate-800 flex items-center justify-between gap-2 max-w-sm">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-bold block">{memo.signatures.Executive.name}</span>
                        <span className="text-[9px] text-slate-500 block leading-none">{memo.signatures.Executive.position}</span>
                        <span className="text-[8px] text-slate-600 block">{memo.signatures.Executive.timestamp}</span>
                      </div>
                      <div className="h-10 w-28 shrink-0 bg-slate-950 border border-slate-900 rounded flex items-center justify-center p-1">
                        {memo.signatures.Executive.type === 'draw' || memo.signatures.Executive.type === 'import' ? (
                          <img src={memo.signatures.Executive.value} alt="Executive CEO digital signature reference" className="h-full object-contain filter brightness-110" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-serif italic text-amber-400 text-xs font-semibold">{memo.signatures.Executive.value}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-500/85 mt-2.5 block italic font-semibold">
                      {memo.status === 'PendingExecutive' ? "● Session active under Dr. Olaoluwa Vetiva checkout" : "Awaiting compliance clearance."}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 5: Finance Settlement */}
              <div className="flex gap-4 relative">
                <div className={`z-10 h-9 w-9 flex items-center justify-center rounded-full shrink-0 font-bold text-sm ${
                  memo.signatures.Finance ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-600'
                }`}>
                  {memo.signatures.Finance ? '✓' : '5'}
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex-1 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-200 text-sm">Finance Settlement &amp; Closing</strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {memo.signatures.Finance ? 'Completed Paid/Released' : 'Awaiting Payment'}
                    </span>
                  </div>
                  <p className="text-slate-400">Generates PV voucher reference vouchers, archives transfer slips, and handles custodians.</p>
                  
                  {memo.signatures.Finance ? (
                    <div className="mt-3 bg-slate-900 p-2.5 rounded border border-slate-800 flex items-center justify-between gap-2 max-w-sm">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 font-bold block">{memo.signatures.Finance.name}</span>
                        <span className="text-[9px] text-slate-500 block leading-none">{memo.signatures.Finance.position}</span>
                        <span className="text-[8px] text-slate-600 block">{memo.signatures.Finance.timestamp}</span>
                      </div>
                      <div className="h-10 w-28 shrink-0 bg-slate-950 border border-slate-900 rounded flex items-center justify-center p-1">
                        {memo.signatures.Finance.type === 'draw' || memo.signatures.Finance.type === 'import' ? (
                          <img src={memo.signatures.Finance.value} alt="Finance digital signature reference" className="h-full object-contain filter brightness-110" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-serif italic text-rose-400 text-xs font-bold">{memo.signatures.Finance.value}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-500/85 mt-2.5 block italic font-semibold">
                      {memo.status === 'PendingFinance' ? "● Session active under Aisha Suleiman settlement ledger" : "Awaiting executive disbursement clearance."}
                    </span>
                  )}
                </div>
              </div>

              {/* Optional Retirement Steps progression for Cash Advances */}
              {memo.type === 'CashAdvance' && (memo.status === 'Paid' || memo.status === 'RetirementSubmitted' || memo.status === 'RetirementCompleted') && (
                <div className="border-t border-slate-850 pt-5 mt-5">
                  <span className="text-[10px] font-bold text-indigo-400 block uppercase mb-4 tracking-widest">
                    Asset Retirement / Reconciliation Progression Logs
                  </span>
                  
                  <div className="flex gap-4 relative">
                    <div className={`z-10 h-8 w-8 flex items-center justify-center rounded-full shrink-0 font-mono text-xs ${
                      memo.status === 'RetirementCompleted' ? 'bg-emerald-950 border border-emerald-500 text-emerald-400' : memo.status === 'RetirementSubmitted' ? 'bg-indigo-950 border border-indigo-500 text-indigo-400' : 'bg-slate-950 border border-slate-800 text-slate-700'
                    }`}>
                      R
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex-1 text-xs">
                      <strong className="text-slate-200 block">Retirement status: {memo.status === 'RetirementCompleted' ? 'Retirement Completed' : memo.status === 'RetirementSubmitted' ? 'Retirement Submitted' : 'Awaiting Retirement by Initiator'}</strong>
                      <p className="text-slate-500 text-[11px] mt-1 leading-normal">
                        After using cash advance resources, the initiator submits receipt lines, invoices, and returns cash balance to complete the transaction loop.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DISCUSSION LOGS / COMMENTS */}
        {activeTab === 'comments' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Ecosystem Discussion Logs</h4>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {memo.comments.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">No discussion entries created yet. Signers can append comments below.</p>
              ) : (
                memo.comments.map((comm) => (
                  <div key={comm.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <div>
                        <strong className="text-slate-200">{comm.userName}</strong>
                        <span className="text-slate-500 ml-1">({comm.userRole})</span>
                      </div>
                      <span className="font-mono">{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-300 leading-normal">{comm.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: POLICY QUERIES */}
        {activeTab === 'queries' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Structural Audit Queries &amp; Clarification Loop</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              If an auditor or line manager identifies regulatory inconsistencies, they can raise queries. This pauses the approval state until the initiator clarifies the question.
            </p>

            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {memo.queries.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">No compliance audit queries raised on this request yet.</p>
              ) : (
                memo.queries.map((q) => (
                  <div key={q.id} className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-inner">
                    {/* Header Query Question */}
                    <div className="bg-slate-900 p-3 border-b border-slate-850">
                      <div className="flex justify-between text-[10px] text-amber-400 font-bold mb-1">
                        <span>❓ AUDIT QUERY RAISED BY {q.questionBy.toUpperCase()}</span>
                        <span className="font-mono font-normal text-slate-500">
                          {new Date(q.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-200 mt-1 font-semibold leading-relaxed">
                        &quot;{q.question}&quot;
                      </p>
                      <span className="text-[10px] text-slate-400 italic block mt-1">
                        — Officer: {q.questionByName}
                      </span>
                    </div>

                    {/* Footer Response Answer */}
                    <div className="p-3 bg-slate-950/80">
                      {q.answer ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-emerald-400 font-bold">
                            <span>✓ CLARIFICATION ANSWER SUBMITTED</span>
                            <span className="font-mono text-slate-500">{new Date(q.answeredAt || '').toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-350 italic mt-0.5 leading-relaxed">
                            &quot;{q.answer}&quot;
                          </p>
                        </div>
                      ) : (
                        <div>
                          {currentRole === 'Initiator' ? (
                            <form onSubmit={(e) => handleAnswerQuerySubmit(e, q.id)} className="space-y-2 mt-1">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-amber-500 mb-1">
                                  Your Clarification Response
                                </label>
                                <textarea
                                  value={queryResponseMsg}
                                  onChange={(e) => setQueryResponseMsg(e.target.value)}
                                  rows={2}
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                                  placeholder="Provide compliance answers or reference invoice corrections here..."
                                />
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="submit"
                                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Send className="w-3 h-3" />
                                  Dispatch Clarification response
                                </button>
                              </div>
                            </form>
                          ) : (
                            <span className="text-[10px] text-amber-500 italic block text-center py-2 bg-amber-950/5 rounded border border-amber-900/10">
                              ⌛ Awaiting response clarification from employee initiators. Approvals suspended until clarified.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* FOOTER ACTION CONTROLS */}
      <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-3 shrink-0">
        
        {/* State 1: Current role can act and has not started the review panel */}
        {canRoleAct() && !showApprovalSection && (
          <div className="flex items-center justify-between text-xs bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 font-medium">Actionable state active for your session role:</span>
            <button
              onClick={() => {
                setShowApprovalSection(true);
                setActiveApprovalType('Approve');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 px-4 py-1.5 rounded-lg text-xs tracking-wide transition-all shadow cursor-pointer uppercase flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Perform Decision Review
            </button>
          </div>
        )}

        {/* State 2: Active reviews capture console */}
        {canRoleAct() && showApprovalSection && (
          <form onSubmit={handleActionSubmit} className="space-y-3.5 bg-slate-900 border border-slate-800 p-4.5 rounded-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-250 uppercase tracking-widest flex items-center gap-1">
                <Signature className="w-4 h-4 text-emerald-500" />
                Workflow Actions Console
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowApprovalSection(false);
                  setActiveApprovalType(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-350"
              >
                Hide Console
              </button>
            </div>

            {/* Action Buttons toggle */}
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Selected Approval Decision</label>
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                {[
                  { id: 'Approve', label: 'Approve', color: 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400', activeBg: 'bg-emerald-600 text-white' },
                  { id: 'Reject', label: 'Reject', color: 'bg-rose-500/10 border-rose-500/20 text-rose-450', activeBg: 'bg-rose-600 text-white' },
                  { id: 'Query', label: 'Audit Query', color: 'bg-amber-500/10 border-amber-500/20 text-amber-500', activeBg: 'bg-amber-600 text-slate-950' },
                  { id: 'Return', label: 'Return Block', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500', activeBg: 'bg-yellow-600 text-slate-950' }
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setActiveApprovalType(act.id as any);
                      setAppliedSignature(null); // Reset signature for new action
                    }}
                    className={`py-1.5 text-center text-[10.5px] rounded font-bold uppercase transition-all ${
                      activeApprovalType === act.id
                        ? act.activeBg
                        : `text-slate-400 hover:text-slate-200 ${act.color}`
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input fields based on actions */}
            {activeApprovalType === 'Query' ? (
              <div>
                <label className="block text-[10px] uppercase font-bold text-amber-500 mb-1">
                  Compliance Audit Inquiry Statement
                </label>
                <textarea
                  value={queryTargetText}
                  onChange={(e) => setQueryTargetText(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-slate-200 focus:outline-none"
                  placeholder="Specify what exact clarification invoices, schedules or daily rates are missing from this docket..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Action Remarks / Endorsement Comments</label>
                <textarea
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-slate-200 focus:outline-none"
                  placeholder="Enter optional comments here to be recorded in the audit trail ledger..."
                />
              </div>
            )}

            {/* Render Forced signature pad for Approbations */}
            {activeApprovalType === 'Approve' && (
              <div className="pt-2">
                <label className="block text-[10.5px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
                  ELECTRONIC COMPLIANCE ENDORSEMENT IMAGE
                </label>
                <DigitalSignature
                  defaultName={
                    currentRole === 'LineManager' ? 'Babatunde Lawson' : 
                    currentRole === 'Auditor' ? 'Chioma Nze' : 
                    currentRole === 'Executive' ? 'Dr. Olaoluwa Vetiva' : 
                    'Aisha Suleiman'
                  }
                  defaultPosition={
                    currentRole === 'LineManager' ? 'Head of Unit' : 
                    currentRole === 'Auditor' ? 'Senior Compliance Officer' : 
                    currentRole === 'Executive' ? 'Managing Director / CEO' : 
                    'Financial Controller'
                  }
                  onSave={(sig) => setAppliedSignature(sig)}
                  actionLabel="Apply Electronic Verification & Sign"
                />
              </div>
            )}

            {/* Submit decisions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 text-xs font-semibold"
                onClick={() => {
                  setShowApprovalSection(false);
                  setActiveApprovalType(null);
                }}
              >
                Cancel review
              </button>
              <button
                type="submit"
                disabled={activeApprovalType === 'Approve' && !appliedSignature}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded text-xs tracking-wide transition-all shadow cursor-pointer uppercase"
              >
                Dispatch Decision
              </button>
            </div>
          </form>
        )}

        {/* Fallback state when it's not the user's turn */}
        {!canRoleAct() && (
          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-center text-xs text-slate-500">
            🔒 Approval controls are locked. Switch your role to the role shown under **&quot;Approval Stepper&quot;** to interact.
          </div>
        )}
      </div>
    </div>
  );
}
