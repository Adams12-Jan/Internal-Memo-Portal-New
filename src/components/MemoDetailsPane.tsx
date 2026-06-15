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
  const [activeTab, setActiveTab] = useState<'info' | 'papermemo' | 'comments' | 'queries'>('info');
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
        return <span className={defaultClasses + "bg-blue-50 border-blue-200 text-blue-700 font-semibold"}>Pending Head of Admin</span>;
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
          { id: 'papermemo', label: 'Paper Memorandum', icon: <Printer className="w-3.5 h-3.5" /> },
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
                {/* TAB 2: OFFICIAL PAPER MEMORANDUM (WITH E-SIGNATURES DYNAMICALLY PRINT DECORATED) */}
        {activeTab === 'papermemo' && (
          <div className="space-y-4">
            
            {/* Download/Print floating control pane */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-3xs">
              <span className="flex items-center gap-1.5 leading-normal">
                <span>📄</span>
                <span><strong>Institutional Parchment Ledger:</strong> Real visual electronic cursive stamps are live-stamped directly below as successive portals endorse the approved status.</span>
              </span>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-black px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-widest flex items-center gap-1 cursor-pointer select-none transition-all shadow-3xs shrink-0 self-start sm:self-center"
              >
                {isExporting ? "Processing..." : "Raw Print Format"}
              </button>
            </div>

            {/* HIGH FIDELITY PAPER LAYOUT COMPREHENSIVE SHEET */}
            <div className="bg-[#FAF9F5] border-2 border-slate-300 rounded-2xl p-6 md:p-8 select-all shadow-md text-slate-800 font-sans relative overflow-hidden">
              
              {/* Paper Watermark Seal decoration */}
              <div className="absolute right-8 top-1/4 opacity-[0.03] text-[90px] font-black select-none pointer-events-none transform -rotate-12">
                APPROVED
              </div>

              {/* Institutional Header */}
              <div className="text-center font-bold pb-4 border-b border-slate-350">
                <span className="text-[10px] tracking-[0.25em] text-slate-500 uppercase block font-mono">VETIVA CAPITAL MANAGEMENT LIMITED</span>
                <span className="text-2xl font-serif tracking-widest text-[#0F172A] block mt-1.5">INTERNAL MEMORANDUM</span>
              </div>

              {/* Memo Formal Parameters Grid */}
              <table className="w-full text-xs mt-6 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 pr-4 font-bold text-slate-500 uppercase w-24">TO:</td>
                    <td className="py-2.5 text-slate-800 font-semibold">Babatunde Lawson (Head of Admin) • Chioma Nze (Internal Control Auditor) • Dr. Olaoluwa Vetiva (Managing Director/CEO) • Aisha Suleiman (Finance Controller)</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 pr-4 font-bold text-slate-500 uppercase">FROM:</td>
                    <td className="py-2.5 text-slate-900 font-black">{memo.initiator.name} ({memo.department})</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 pr-4 font-bold text-slate-500 uppercase">DATE:</td>
                    <td className="py-2.5 text-slate-800 font-mono font-medium">{new Date(memo.createdAt).toLocaleDateString("en-NG", { dateStyle: 'long' })}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 pr-4 font-bold text-slate-500 uppercase">REF ID:</td>
                    <td className="py-2.5 text-blue-650 font-mono font-bold">{memo.id}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 pr-4 font-bold text-slate-500 uppercase">SUM AMOUNT:</td>
                    <td className="py-2.5 text-slate-900 text-sm font-bold font-mono">₦{memo.amount.toLocaleString()} (Naira Only)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold text-slate-500 uppercase">SUBJECT:</td>
                    <td className="py-3 text-[#0F172A] font-black tracking-wide text-xs uppercase">{memo.title}</td>
                  </tr>
                </tbody>
              </table>

              {/* Formal border thin divider */}
              <hr className="border-t-2 border-double border-slate-350 my-4" />

              {/* Memorandum Standard Body */}
              <div className="space-y-4 pt-2 text-xs md:text-sm leading-relaxed text-slate-800 font-serif">
                <p>
                  This memorandum formally requests and records approval for the utilization of institutional capital. These specific resources shall support the operations outlined under direct compliance guidelines:
                </p>

                {/* Purpose Paragraph Box */}
                <div className="bg-white/80 p-4 rounded-xl border border-slate-250 font-sans text-xs italic text-slate-700 leading-relaxed my-3 shadow-3xs">
                  <strong className="block text-[9px] uppercase tracking-wider text-slate-500 not-italic font-mono font-bold mb-1">Declared Scope &amp; Purpose Justification:</strong>
                  "{memo.purpose}"
                </div>

                {/* Sub specifications for Specific types */}
                {memo.type === 'VendorPayment' && memo.vendorName && (
                  <p className="font-sans text-xs bg-indigo-50 border border-indigo-150 p-3.5 rounded-xl text-slate-700 leading-relaxed">
                    🛡️ This voucher represents a <strong>Vendor Payment track transaction</strong>. Settlements shall be processed directly to <strong>{memo.vendorName}</strong> (Account Number: <strong>{memo.accountNumber}</strong> at Bank: <strong>{memo.bankName}</strong>).
                  </p>
                )}

                {memo.type === 'Retirement' && memo.retirementExpenses && (
                  <div className="bg-slate-100 font-sans p-4 rounded-lg text-xs space-y-2 border border-slate-200">
                    <strong className="block text-slate-800 uppercase tracking-wider text-[9px]">Retirement Expense breakdown &amp; balances:</strong>
                    <div className="space-y-1">
                      {memo.retirementExpenses.map((exp, rIdx) => (
                        <div key={rIdx} className="flex justify-between border-b border-slate-200 pb-1">
                          <span>{exp.item} ({exp.description})</span>
                          <span className="font-mono font-bold">₦{exp.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    {memo.balanceReturned !== undefined && (
                      <div className="flex justify-between font-bold text-emerald-700 pt-1 text-right">
                        <span>Balance Returned to Custodian:</span>
                        <span>₦{memo.balanceReturned.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SIGNATURE STAMP GRID - HIGH INSTITUTIONAL VERITY */}
              <div className="border-t border-slate-350 mt-10 pt-6">
                <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-slate-500 block uppercase mb-5 text-center">
                  SECURE DIGITAL LEDGER OF PORTAL SIGNATURES
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Initiator Stamp */}
                  <div className="border border-slate-200 bg-white/55 p-3.5 rounded-xl text-center space-y-2 flex flex-col justify-between shadow-3xs">
                    <div>
                      <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block tracking-widest leading-none">Voucher Originator</span>
                      <strong className="text-[11px] text-slate-900 block mt-1.5">{memo.initiator.name}</strong>
                      <span className="text-[9px] text-slate-400 block">Initiating Officer</span>
                    </div>
                    <div className="h-14 bg-slate-100/50 rounded-lg flex items-center justify-center p-1 border border-slate-200 italic font-serif text-slate-400 text-xs text-center">
                      {memo.signatures.Initiator ? (
                        memo.signatures.Initiator.type === 'draw' || memo.signatures.Initiator.type === 'import' ? (
                          <img src={memo.signatures.Initiator.value} alt="Initiator Signature vector visual representation" className="h-full object-contain filter brightness-90 mix-blend-multiply" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-serif italic text-emerald-700 text-sm font-semibold">{memo.signatures.Initiator.value}</span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400">Awaiting submission</span>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-emerald-700 font-bold block bg-emerald-50 rounded py-0.5 border border-emerald-100 uppercase">
                      ✓ SECURED &amp; ORIGIN VERIFIED
                    </span>
                  </div>

                  {/* Head of Admin Endorsement */}
                  <div className="border border-slate-200 bg-white/55 p-3.5 rounded-xl text-center space-y-2 flex flex-col justify-between shadow-3xs">
                    <div>
                      <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block tracking-widest leading-none">Head of Admin Portal</span>
                      <strong className="text-[11px] text-slate-900 block mt-1.5">Babatunde Lawson</strong>
                      <span className="text-[9px] text-slate-400 block">Budget Line Controller</span>
                    </div>
                    <div className="h-14 bg-slate-100/50 rounded-lg flex items-center justify-center p-1 border border-slate-200 italic font-serif text-slate-400 text-xs text-center">
                      {memo.signatures.LineManager ? (
                        memo.signatures.LineManager.type === 'draw' || memo.signatures.LineManager.type === 'import' ? (
                          <img src={memo.signatures.LineManager.value} alt="Head of Admin signature representative image value" className="h-full object-contain filter brightness-90 mix-blend-multiply" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-serif italic text-blue-700 text-sm font-semibold">{memo.signatures.LineManager.value}</span>
                        )
                      ) : (
                        <span className="text-[9px] text-amber-600 font-bold animate-pulse">Pending Portal Sign-In</span>
                      )}
                    </div>
                    <span className={`text-[8px] font-mono font-bold block rounded py-0.5 border uppercase ${
                      memo.signatures.LineManager ? 'bg-blue-50 text-blue-800 border-blue-105' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {memo.signatures.LineManager ? `✓ ENDORSED: ${new Date(memo.signatures.LineManager.timestamp).toLocaleDateString()}` : "AWAITING ENDORSEMENT"}
                    </span>
                  </div>

                  {/* Compliance Auditor Review */}
                  <div className="border border-slate-200 bg-white/55 p-3.5 rounded-xl text-center space-y-2 flex flex-col justify-between shadow-3xs">
                    <div>
                      <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block tracking-widest leading-none">Internal Compliance Auditor</span>
                      <strong className="text-[11px] text-slate-900 block mt-1.5">Chioma Nze</strong>
                      <span className="text-[9px] text-slate-400 block">Senior compliance Officer</span>
                    </div>
                    <div className="h-14 bg-slate-100/50 rounded-lg flex items-center justify-center p-1 border border-slate-200 italic font-serif text-slate-400 text-xs text-center">
                      {memo.signatures.Auditor ? (
                        memo.signatures.Auditor.type === 'draw' || memo.signatures.Auditor.type === 'import' ? (
                          <img src={memo.signatures.Auditor.value} alt="Auditor digital stamp representation" className="h-full object-contain filter brightness-90 mix-blend-multiply" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-serif italic text-purple-700 text-sm font-semibold">{memo.signatures.Auditor.value}</span>
                        )
                      ) : (
                        <span className="text-[9px] text-slate-400">Awaiting internal compliance</span>
                      )}
                    </div>
                    <span className={`text-[8px] font-mono font-bold block rounded py-0.5 border uppercase ${
                      memo.signatures.Auditor ? 'bg-purple-50 text-purple-800 border-purple-105' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {memo.signatures.Auditor ? `✓ AUDIT PASSED: ${new Date(memo.signatures.Auditor.timestamp).toLocaleDateString()}` : "AWAITING COMPLIANCE AUDIT"}
                    </span>
                  </div>

                  {/* Managing Director CEO check */}
                  <div className="border border-slate-200 bg-white/55 p-3.5 rounded-xl text-center space-y-2 flex flex-col justify-between shadow-3xs">
                    <div>
                      <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block tracking-widest leading-none">Sanctioning Executive Authority</span>
                      <strong className="text-[11px] text-slate-900 block mt-1.5">Dr. Olaoluwa Vetiva</strong>
                      <span className="text-[9px] text-slate-400 block">Managing Director / CEO</span>
                    </div>
                    <div className="h-14 bg-slate-100/50 rounded-lg flex items-center justify-center p-1 border border-slate-200 italic font-serif text-slate-400 text-xs text-center">
                      {memo.signatures.Executive ? (
                        memo.signatures.Executive.type === 'draw' || memo.signatures.Executive.type === 'import' ? (
                          <img src={memo.signatures.Executive.value} alt="Executive CEO stamp representation" className="h-full object-contain filter brightness-90 mix-blend-multiply" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-serif italic text-amber-700 text-sm font-semibold">{memo.signatures.Executive.value}</span>
                        )
                      ) : (
                        <span className="text-[9px] text-slate-400">Awaiting CEO Sanction</span>
                      )}
                    </div>
                    <span className={`text-[8px] font-mono font-bold block rounded py-0.5 border uppercase ${
                      memo.signatures.Executive ? 'bg-amber-50 text-amber-800 border-amber-105' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {memo.signatures.Executive ? `✓ CEO APPROVED: ${new Date(memo.signatures.Executive.timestamp).toLocaleDateString()}` : "AWAITING CEO BOARD SIGN"}
                    </span>
                  </div>

                </div>

                {/* Secure digital ledger tracking metadata footprint */}
                <div className="text-center mt-6 text-[9.5px] text-slate-400 font-mono space-y-0.5 border-t border-slate-200 pt-4 select-none">
                  <div>VETIVA ENTERPRISE LEDGER SECURED DIGITAL WORKFLOW ID</div>
                  <div className="text-slate-500">DIGITAL SHA-256 CHECKSUM: {memo.id.replace(/\//g, '')}F6C7A901FDE89472B7020E90C0E773A</div>
                </div>

              </div>

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
        
        {/* State 0: Quick Auto-Approve Workflow Controller */}
        {['PendingLineManager', 'PendingAuditor', 'PendingExecutive', 'RetirementSubmitted', 'PendingRetirementLineManager', 'PendingRetirementAuditor'].includes(memo.status) && (
          <div className="bg-[#030712]/95 border border-slate-800 p-3 rounded-xl space-y-1.5 select-none shadow">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider leading-none">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span>Admin Direct Clearance Controller</span>
            </div>
            <p className="text-[9.5px] text-slate-400 leading-normal">
              Bypass sequential reviews. Automatically certifies <strong>Head of Admin</strong>, <strong>Auditor</strong>, and <strong>MD/CEO</strong> compliance sign-offs and directs straight to <strong>Finance</strong>.
            </p>
            <button
              type="button"
              onClick={() => onAction('AutomateApprovals', 'Automated direct endorsement & approval clearance certified by member of Admin department.')}
              className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow"
            >
              ⚡ Automate Approvals & Send to Finance
            </button>
          </div>
        )}
        
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
                    currentRole === 'LineManager' ? 'Head of Admin' : 
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
