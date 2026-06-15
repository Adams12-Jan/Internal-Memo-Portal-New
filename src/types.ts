export type Role = 'Initiator' | 'LineManager' | 'Auditor' | 'Executive' | 'Finance' | 'Admin';

export type MemoType = 'CashAdvance' | 'PettyCash' | 'VendorPayment' | 'Retirement';

export type MemoStatus =
  | 'Draft'
  | 'PendingLineManager'
  | 'PendingAuditor' // Internal Control
  | 'PendingExecutive'
  | 'PendingFinance'
  | 'Paid' // For CashAdvance
  | 'Released' // For PettyCash
  | 'RetirementSubmitted'
  | 'PendingRetirementLineManager'
  | 'PendingRetirementAuditor'
  | 'PendingRetirementFinance'
  | 'RetirementCompleted'
  | 'RetirementRejected'
  | 'ReturnedForCorrection'
  | 'Rejected';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface ESignature {
  name: string;
  position: string;
  timestamp: string;
  type: 'draw' | 'type';
  value: string; // PNG Base64 for draw, Typed text for type
}

export interface Comment {
  id: string;
  userName: string;
  userRole: Role;
  message: string;
  timestamp: string;
}

export interface QueryEntry {
  id: string;
  question: string;
  questionBy: Role;
  questionByName: string;
  timestamp: string;
  answer?: string;
  answeredAt?: string;
}

export interface Attachment {
  name: string;
  size: string;
  type: string;
  dataUrl?: string;
}

export interface ExpenseLine {
  item: string;
  description: string;
  amount: number;
  receiptName?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  ipAddress: string;
  memoId?: string;
  details?: string;
}

export interface MemoRequest {
  id: string; // Formatted like VET/MEMO/2026/001
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
  status: MemoStatus;
  createdAt: string;
  initiator: {
    name: string;
    email: string;
  };
  comments: Comment[];
  queries: QueryEntry[];
  signatures: {
    Initiator?: ESignature;
    LineManager?: ESignature;
    Auditor?: ESignature;
    Executive?: ESignature;
    Finance?: ESignature;
    RetirementLineManager?: ESignature;
    RetirementAuditor?: ESignature;
    RetirementFinance?: ESignature;
  };
  
  // Specific to Vendor Payment or Cash Advance
  vendorName?: string;
  bankName?: string;
  accountNumber?: string;

  // Specific to Petty Cash Retirement
  originalMemoId?: string; // Links back to Paid CashAdvance or released Petty Cash
  retirementExpenses?: ExpenseLine[];
  balanceReturned?: number;

  // Finance Processing Details
  financeVoucherNo?: string;
  bankReference?: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentProofName?: string;
  cashCustodian?: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'alert' | 'urgent';
}
