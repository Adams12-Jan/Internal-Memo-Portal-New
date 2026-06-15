import React, { useState, useEffect } from 'react';
import { MemoRequest, MemoType, Priority, Attachment, ExpenseLine, ESignature } from '../types';
import { DEPARTMENTS, COST_CENTERS } from '../initialData';
import DigitalSignature from './DigitalSignature';
import { FilePlus, Trash2, Calendar, FileText, DollarSign, Layers, Plus, Link, CheckSquare, UploadCloud, AlertCircle } from 'lucide-react';

interface MemoFormProps {
  onSubmit: (memo: {
    type: MemoType;
    title: string;
    purpose: string;
    businessJustification: string;
    amount: number;
    costCenter: string;
    department: string;
    beneficiary: string;
    expectedRetirementDate?: string;
    priority: Priority;
    attachments: Attachment[];
    vendorName?: string;
    bankName?: string;
    accountNumber?: string;
    originalMemoId?: string;
    retirementExpenses?: ExpenseLine[];
    balanceReturned?: number;
    initiatorSignature: ESignature;
  }) => void;
  onCancel: () => void;
  paidAdvances: { id: string; title: string; amount: number; type: string }[];
}

export default function MemoForm({ onSubmit, onCancel, paidAdvances }: MemoFormProps) {
  const [memoType, setMemoType] = useState<MemoType>('CashAdvance');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [justification, setJustification] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [costCenter, setCostCenter] = useState(COST_CENTERS[0].code);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [beneficiary, setBeneficiary] = useState('');
  const [expectedRetirementDate, setExpectedRetirementDate] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  
  // Vendor Payment specific
  const [vendorName, setVendorName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Retirement specific
  const [selectedAdvanceId, setSelectedAdvanceId] = useState('');
  const [originalAdvanceAmount, setOriginalAdvanceAmount] = useState<number>(0);
  const [expenses, setExpenses] = useState<ExpenseLine[]>([]);
  const [expItem, setExpItem] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmt, setExpAmt] = useState<number>(0);
  const [expReceipt, setExpReceipt] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Signature
  const [signature, setSignature] = useState<ESignature | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-seed some default fields when switching types
  useEffect(() => {
    if (memoType === 'Retirement' && paidAdvances.length > 0) {
      handleSelectAdvance(paidAdvances[0].id);
    } else {
      setAmount(0);
    }
    setErrorMsg('');
  }, [memoType]);

  const handleSelectAdvance = (id: string) => {
    setSelectedAdvanceId(id);
    const adv = paidAdvances.find(a => a.id === id);
    if (adv) {
      setOriginalAdvanceAmount(adv.amount);
      setAmount(adv.amount); // default retirement expense is the core amount
      setTitle(`Retirement for Advance: ${adv.title}`);
      setBeneficiary('Adeleke Olanrewaju (Self)');
    }
  };

  const handleAddExpense = () => {
    if (!expItem || expAmt <= 0) return;
    const newLine: ExpenseLine = {
      item: expItem,
      description: expDesc,
      amount: expAmt,
      receiptName: expReceipt || 'uploaded_receipt_slip.png'
    };
    setExpenses([...expenses, newLine]);
    
    // Clear sub inputs
    setExpItem('');
    setExpDesc('');
    setExpAmt(0);
    setExpReceipt('');
  };

  const handleRemoveExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  // Compute calculated balance for retirement helper
  const totalExpenseAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const balanceReturned = originalAdvanceAmount - totalExpenseAmount;

  // Handle drag and drop simulation
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files);
      const newAttachments: Attachment[] = filesArray.map((f: any) => ({
        name: f.name,
        size: `${Math.round(f.size / 1024)} KB`,
        type: f.type
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const addMockAttachment = (name: string, size: string) => {
    setAttachments([
      ...attachments,
      { name, size, type: 'application/pdf' }
    ]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const checkValidation = () => {
    if (!title.trim()) return "Memo Title is required.";
    if (!purpose.trim()) return "Business Purpose is required.";
    if (!businessJustification().trim()) return "Business Justification is required.";
    
    if (memoType !== 'Retirement') {
      if (amount <= 0) return "Please enter a valid request amount.";
      if (!beneficiary.trim()) return "Beneficiary name is required.";
    } else {
      if (!selectedAdvanceId) return "Please link an original Cash Advance/Petty Cash Reference.";
      if (expenses.length === 0) return "You must add at least one line item breakdown for reconciliation.";
    }

    if (memoType === 'VendorPayment') {
      if (!vendorName.trim()) return "Vendor Name is required.";
      if (!bankName.trim()) return "Vendor Bank Name is required.";
      if (!accountNumber.trim()) return "Vendor Bank Account Number is required.";
    }

    if (!signature) {
      return "An electronic workflow signature is mandatory to initiate this approval loop.";
    }

    return null;
  };

  const businessJustification = () => {
    if (memoType === 'Retirement') {
      return `Reconciliation for original core advance ${selectedAdvanceId}. Complete with receipts total N${totalExpenseAmount.toLocaleString()}.`;
    }
    return justification;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = checkValidation();
    if (error) {
      setErrorMsg(error);
      return;
    }

    onSubmit({
      type: memoType,
      title,
      purpose,
      businessJustification: businessJustification(),
      amount: memoType === 'Retirement' ? totalExpenseAmount : amount,
      costCenter,
      department,
      beneficiary,
      expectedRetirementDate: expectedRetirementDate || undefined,
      priority,
      attachments,
      vendorName: memoType === 'VendorPayment' ? vendorName : undefined,
      bankName: memoType === 'VendorPayment' ? bankName : undefined,
      accountNumber: memoType === 'VendorPayment' ? accountNumber : undefined,
      originalMemoId: memoType === 'Retirement' ? selectedAdvanceId : undefined,
      retirementExpenses: memoType === 'Retirement' ? expenses : undefined,
      balanceReturned: memoType === 'Retirement' ? balanceReturned : undefined,
      initiatorSignature: signature!
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FilePlus className="text-blue-600 w-5 h-5" />
            Initiate Internal Memo request
          </h2>
          <p className="text-xs text-slate-500">Fill in corporate request specifications & sign digital voucher</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-650 hover:text-slate-900 text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          Cancel Draft
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
        {/* Memo Type Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-2">Request Type</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            {(['CashAdvance', 'PettyCash', 'VendorPayment', 'Retirement'] as MemoType[]).map((type) => {
              const label = type === 'CashAdvance' ? 'Cash Advance' : type === 'PettyCash' ? 'Petty Cash' : type === 'VendorPayment' ? 'Vendor Payment' : 'Petty Cash Retirement';
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMemoType(type)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    memoType === type
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Header specifications */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-600 font-semibold mb-1">Memo Request Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Purchase of replacement server racks for IT unit"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 font-semibold mb-1">Corporate Business Purpose</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                placeholder="Give a brief summary detail on the scope..."
              />
            </div>

            {memoType !== 'Retirement' && (
              <div>
                <label className="block text-xs text-slate-600 font-semibold mb-1">Strategic Business Justification</label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  placeholder="Explain why this expense is required now and its impact on operations..."
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 font-semibold mb-1">Cost Center</label>
                <select
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 animate-duration-100"
                >
                  {COST_CENTERS.map((cc) => (
                    <option key={cc.code} value={cc.code}>
                      {cc.code} - {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-semibold mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 animate-duration-100"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Core financial / specific parameters */}
          <div className="space-y-4">
            {memoType === 'Retirement' ? (
              <div className="bg-[#FAF9F6] border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-blue-650 font-semibold uppercase tracking-wider mb-2">
                  <Link className="w-3.5 h-3.5 text-blue-600" />
                  Link Original Paid Request
                </div>

                {paidAdvances.length === 0 ? (
                  <div className="text-xs text-amber-805 bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>No Paid Cash Advance or Petty Cash items were found registered under your user ID to reconcile. Try adding mock data or clearing.</span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Select Disbursed Request</label>
                    <select
                      value={selectedAdvanceId}
                      onChange={(e) => handleSelectAdvance(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">-- Choose Disbursed Memo --</option>
                      {paidAdvances.map((adv) => (
                        <option key={adv.id} value={adv.id}>
                          [{adv.id}] - {adv.title} (N{adv.amount.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedAdvanceId && (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Fund Disbursed originally:</span>
                      <span className="font-mono text-slate-900 font-bold">N{originalAdvanceAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expenses Logged breakdown:</span>
                      <span className="font-mono text-blue-600 font-bold">N{totalExpenseAmount.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between font-semibold">
                      <span>Reconciliation Balance:</span>
                      <span className={`font-mono ${balanceReturned >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {balanceReturned >= 0 
                          ? `N${balanceReturned.toLocaleString()} (Refund to Cash Custodian)`
                          : `N${Math.abs(balanceReturned).toLocaleString()} (Refund due to employee)`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 font-semibold mb-1">Requested Amount (NGN)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">₦</span>
                    <input
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-8 p-2 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                      placeholder="Amount in Naira"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 font-semibold mb-1">Expected Retirement Date</label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-2.5 text-slate-550 w-4 h-4" />
                    <input
                      type="date"
                      value={expectedRetirementDate}
                      onChange={(e) => setExpectedRetirementDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 animate-duration-100"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 font-semibold mb-1">Beneficiary Name</label>
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 animate-duration-100"
                  placeholder="Kolawole Davies (or Self)"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-semibold mb-1">Priority Rating</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-805 focus:outline-none focus:border-blue-500 animate-duration-100"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent priority</option>
                </select>
              </div>
            </div>

            {/* Vendor payment specific fields */}
            {memoType === 'VendorPayment' && (
              <div className="bg-[#FAF9F6] border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider block border-b border-slate-200 pb-1.5">
                  Vendor Remittance Information
                </span>
                <div>
                  <label className="block text-[11px] text-slate-604 font-medium mb-0.5">Corporate Vendor Legal Name</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    placeholder="oracle Nigeria Consultations Ltd"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-604 font-medium mb-0.5 font-sans">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                      placeholder="e.g. Zenith Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-604 font-medium mb-0.5 font-sans">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none font-mono"
                      placeholder="10-digit account no."
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>        {/* Retirement Expense Lines Block */}
        {memoType === 'Retirement' && (
          <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-850 uppercase tracking-widest flex items-center gap-1.5 mb-4 border-b border-slate-200 pb-2">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              Detailed Receipt &amp; Voucher Reconciliation Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 items-end bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="md:col-span-1">
                <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1">Item Title / Store</label>
                <input
                  type="text"
                  value={expItem}
                  onChange={(e) => setExpItem(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-805"
                  placeholder="e.g. Lagos Hilton Hotel"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1">Detailed Description</label>
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-205"
                  placeholder="e.g. 2 Nights advisory accommodation"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1">Amount utilized (N)</label>
                <input
                  type="number"
                  value={expAmt || ''}
                  onChange={(e) => setExpAmt(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-805 font-semibold text-blue-600"
                  placeholder="Utilized Amount"
                />
              </div>
              <button
                type="button"
                onClick={handleAddExpense}
                disabled={!expItem || expAmt <= 0}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <Plus className="w-3.5 h-3.5" /> Thru Line
              </button>
            </div>

            {/* Expense Lines list */}
            {expenses.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                No individual receipts filed yet. Enter receipt transactions above to allocate funds.
              </p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {expenses.map((line, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <span className="font-semibold text-slate-800 line-clamp-1">{line.item}</span>
                      <span className="text-slate-500 line-clamp-1">{line.description}</span>
                      <span className="font-mono text-blue-600 font-semibold">N{line.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                        <FileText className="w-3 h-3" /> {line.receiptName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpense(i)}
                        className="text-rose-600 hover:text-rose-750 hover:bg-rose-50 p-1 rounded transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <span>Reconciliation count: {expenses.length} receipt lines</span>
                  <span>Total expenses computed: <strong className="font-semibold text-slate-850">N{totalExpenseAmount.toLocaleString()}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}        {/* Attachment Upload Box */}
        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3.5">Supporting PDF Invoices / Bank Proposals</label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all text-center ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/50' 
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-xs text-slate-800 font-semibold mb-1">Drag and drop supporting receipts here</p>
            <p className="text-[10px] text-slate-500 mb-3">PDF, JPEG, or Excel formats up to 10MB</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => addMockAttachment('quotation_revised_june.pdf', '325 KB')}
                className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-2.5 py-1 text-[10px] rounded font-mono font-medium transition-all cursor-pointer shadow-xs"
              >
                + Mock Vendor Proposal.pdf
              </button>
              <button
                type="button"
                onClick={() => addMockAttachment('flight_ticket_itinerary_abuja.pdf', '110 KB')}
                className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-2.5 py-1 text-[10px] rounded font-mono font-medium transition-all cursor-pointer shadow-xs"
              >
                + Flight Itinerary.pdf
              </button>
            </div>
          </div>

          {/* Render Active Attachments */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3.5">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-205 text-xs text-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-650 shrink-0" />
                    <span className="font-medium line-clamp-1">{file.name} ({file.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(i)}
                    className="text-rose-600 hover:text-rose-750 hover:bg-rose-50 p-1 rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Digital Signature capture panel */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Signature Mandate</label>
          <p className="text-[11px] text-slate-505 mb-3 leading-relaxed">
            As request initiator, applying your signature constitutes authentication of funding purpose compliance.
          </p>
          <DigitalSignature
            defaultName="Kolawole Davies"
            defaultPosition="Principal Advisor Management"
            onSave={(sig) => setSignature(sig)}
            actionLabel="Apply Initiator Signature"
          />
        </div>

        {/* Error message logging */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-250 rounded-xl p-4 flex items-center gap-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong className="font-semibold block">A processing block occurred:</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Submit Action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg font-medium text-slate-605 hover:text-slate-900 text-xs bg-white border border-slate-200 cursor-pointer"
          >
            Cancel Draft
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg text-xs font-bold tracking-wide cursor-pointer text-white bg-blue-600 hover:bg-blue-705 transition-all flex items-center gap-2 shadow-xs"
            id="cmd-submit-memo"
          >
            Launch Approval Loop
          </button>
        </div>
      </form>
    </div>
  );
}
