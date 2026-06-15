import React, { useState } from 'react';
import { MemoRequest, ESignature, Role } from '../types';
import DigitalSignature from './DigitalSignature';
import { DollarSign, ShieldAlert, CheckCircle, ArrowRight, FileText, Landmark, FileCheck } from 'lucide-react';

interface FinanceModuleProps {
  pendingFinanceRequests: MemoRequest[];
  onDisburse: (
    memoId: string, 
    voucherNo: string, 
    bankRef: string, 
    paymentMethod: string, 
    custodian: string, 
    proofName: string,
    sig: ESignature
  ) => void;
}

export default function FinanceModule({ pendingFinanceRequests, onDisburse }: FinanceModuleProps) {
  const [selectedMemoId, setSelectedMemoId] = useState<string>('');
  const [voucherNo, setVoucherNo] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Central Bank RTGS');
  const [custodian, setCustodian] = useState('Aisha Suleiman (Finance Controller)');
  const [proofName, setProofName] = useState('');
  const [sig, setSig] = useState<ESignature | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedMemo = pendingFinanceRequests.find(m => m.id === selectedMemoId);

  // Generate automated voucher on selecting a memo
  const handleSelectMemo = (id: string) => {
    setSelectedMemoId(id);
    setSig(null);
    setErrorMsg('');
    if (id) {
      const randomSuf = Math.floor(1000 + Math.random() * 9000);
      setVoucherNo(`VET-PV-2026-${randomSuf}`);
      setBankRef(`CBN-FT-${Date.now().toString().slice(-10)}`);
      const activeItem = pendingFinanceRequests.find(m => m.id === id);
      if (activeItem?.type === 'PettyCash') {
        setPaymentMethod('Cash Custodian Handout');
        setProofName('petty_cash_voucher_signed.pdf');
      } else {
        setPaymentMethod('Central Bank RTGS (Access Bank)');
        setProofName('bank_transfer_slip_access_bank.pdf');
      }
    }
  };

  const handleSubmitDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemoId) {
      setErrorMsg("Please select an approved request to settle.");
      return;
    }
    if (!voucherNo.trim()) {
      setErrorMsg("Payment Voucher (PV) numbering is mandatory.");
      return;
    }
    if (!sig) {
      setErrorMsg("As financial handler, your verification signature is mandatory to book this ledger entry.");
      return;
    }

    onDisburse(
      selectedMemoId,
      voucherNo,
      bankRef,
      paymentMethod,
      custodian,
      proofName,
      sig
    );

    // Clear state
    setSelectedMemoId('');
    setVoucherNo('');
    setBankRef('');
    setSig(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 p-5 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Corporate Treasury &amp; Disbursing Settlement Ledger
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Approve funding distributions for verified memos, generate voucher archives, and close transactions.
        </p>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Select pending disbursed item */}
        <div className="lg:col-span-4 space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Approved Memos Pending Funds Settle ({pendingFinanceRequests.length})
          </span>

          {pendingFinanceRequests.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
              ✨ No approved memos are currently awaiting financial disbursement logs in this queue.
            </div>
          ) : (
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {pendingFinanceRequests.map((memo) => {
                const isSelected = memo.id === selectedMemoId;
                return (
                  <button
                    key={memo.id}
                    onClick={() => handleSelectMemo(memo.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F8FAFC] border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-blue-600 font-bold">{memo.id}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {memo.type === 'CashAdvance' ? 'Cash Advance' : memo.type === 'PettyCash' ? 'Petty Cash' : 'Payment Tracker'}
                      </span>
                    </div>
                    <strong className="text-slate-800 block truncate font-semibold mb-1">{memo.title}</strong>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">{memo.initiator.name}</span>
                      <strong className="text-blue-600 font-mono font-bold">N{memo.amount.toLocaleString()}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Settlement capture panel */}
        <div className="lg:col-span-8">
          {selectedMemo ? (
            <form onSubmit={handleSubmitDisbursement} className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Disbursement Schedule Voucher Capture</h4>
                  <p className="text-[11px] text-slate-500 font-sans">Linked: {selectedMemo.title}</p>
                </div>
                <strong className="text-blue-600 font-mono text-base font-bold">
                  N{selectedMemo.amount.toLocaleString()}
                </strong>
              </div>

              {/* Form entries for treasury processing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Generate Payment Voucher No. (PV)</label>
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold font-mono focus:border-blue-500 focus:outline-none"
                    placeholder="PV sequence code"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Audit-ledger compliant automatic numbering sequence verified.</p>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Bank Transaction Reference / Cheque No.</label>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. CBN-FT-102948293"
                  />
                </div>

                <div>
                  <label className="block text-slate-605 mb-1 font-semibold">Payment / Release Clearing Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Central Bank RTGS Swap">Central Bank RTGS Swap</option>
                    <option value="Interbank ACH Transfer">Interbank ACH Transfer</option>
                    <option value="Cash Custodian Vault Release">Cash Custodian Vault Release</option>
                    <option value="Executive Cheque Handout">Executive Cheque Handout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-605 mb-1 font-semibold">Treasury Asset Custodian Office</label>
                  <input
                    type="text"
                    value={custodian}
                    onChange={(e) => setCustodian(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Simulation select for receipt uploads */}
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-semibold">Treasury Bank Transfer Receipt PDF Slip</label>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-700 flex-1 font-mono text-xs flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-650" />
                    {proofName}
                  </div>
                  <button
                    type="button"
                    onClick={() => setProofName(`reconciled_transfer_slip_sequence_${Math.floor(Math.random()*9000)}.pdf`)}
                    className="bg-white border border-slate-200 text-slate-650 hover:text-slate-900 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
                  >
                    Regen
                  </button>
                </div>
              </div>

              {/* Signature section */}
              <div className="border-t border-slate-200 pt-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Financial Controller Ledger E-Signature
                </span>
                <DigitalSignature
                  defaultName="Aisha Suleiman"
                  defaultPosition="Senior Accountant / Financial Controller"
                  onSave={(signature) => setSig(signature)}
                  actionLabel="Authorize Disbursal Ledger Log"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded bg-rose-50 text-rose-800 text-xs border border-rose-200">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Submit ledger processing */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={!sig}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold h-10 px-6 rounded-lg text-xs tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-sm"
                  id="btn-confirm-disbursement"
                >
                  <FileCheck className="w-4 h-4" />
                  Settle Disbursement ledger
                </button>
              </div>

            </form>
          ) : (
            <div className="bg-slate-50 p-12 text-center rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[380px]">
              <Landmark className="w-12 h-12 text-slate-400 mb-3" />
              <strong className="text-slate-705 text-sm block">Treasury Clearance Form Idle</strong>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Select a verified, approved memo request from the left column to generate payment vouchers and schedule disbursements.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
