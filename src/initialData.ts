import { MemoRequest, AuditLog, Notification } from './types';

export const DEPARTMENTS = [
  'Investment Banking',
  'Treasury & Capital Markets',
  'Wealth Management',
  'Operations',
  'Legal & Compliance',
  'Internal Audit',
  'IT & Infrastructure',
  'Human Resources & Administration'
];

export const COST_CENTERS = [
  { code: 'VET-CC-IB901', name: 'Corporate Advisory Sub-Unit' },
  { code: 'VET-CC-TR502', name: 'Treasury Desk Operations' },
  { code: 'VET-CC-WM401', name: 'Private Asset Management' },
  { code: 'VET-CC-OP808', name: 'Central Support Services' },
  { code: 'VET-CC-LC102', name: 'Compliance & Secretarial Unit' },
  { code: 'VET-CC-IA301', name: 'Internal Control & Audit' },
  { code: 'VET-CC-IT202', name: 'Technology & DevOps Support' },
  { code: 'VET-CC-HR111', name: 'Talent Acquisition & Ops' }
];

// Seed signature visual previews
export const MOCK_SIG_BASE64 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><path d="M10,40 Q30,10 50,30 T90,20 T130,35" fill="none" stroke="%2310b981" stroke-width="2"/></svg>';
export const MOCK_SIG_MANAGER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><path d="M15,25 C30,45 60,5 80,42 C100,5 120,45 140,25" fill="none" stroke="%233b82f6" stroke-width="2.5"/></svg>';
export const MOCK_SIG_AUDITOR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><path d="M10,20 L30,30 L50,15 L70,35 L90,22 L110,40 L130,12" fill="none" stroke="%23845ef7" stroke-width="2"/></svg>';

export const INITIAL_MEMOS: MemoRequest[] = [
  {
    id: 'VET/MEMO/2026/012',
    type: 'CashAdvance',
    title: 'Client Hospitality & Advisory Board Executive Dinner',
    purpose: 'To cover expenditures related to private dinner consultations with key shareholders of Zenith Bank Plc and Vetiva advisory boards.',
    businessJustification: 'Strengthening relationships for upcoming capital raise mandate slated for Q3. Key conversations around advisory and underwriting allocations.',
    amount: 750000,
    costCenter: 'VET-CC-WM401',
    department: 'Wealth Management',
    beneficiary: 'Adeleke Olanrewaju',
    expectedRetirementDate: '2026-07-10',
    priority: 'High',
    attachments: [
      { name: 'dinner_reservation_invoice.pdf', size: '242 KB', type: 'application/pdf' },
      { name: 'board_guestlist_approval.xlsx', size: '1.2 MB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ],
    status: 'Paid',
    createdAt: '2026-06-10T11:20:00Z',
    initiator: {
      name: 'Adeleke Olanrewaju',
      email: 'a.olanrewaju@vetiva.com'
    },
    comments: [
      {
        id: 'c1',
        userName: 'Adeleke Olanrewaju',
        userRole: 'Initiator',
        message: 'Memo initiated. Supporting documents containing Zenith VIP list attached.',
        timestamp: '2026-06-10T11:25:00Z'
      },
      {
        id: 'c2',
        userName: 'Babatunde Lawson',
        userRole: 'LineManager',
        message: 'Wealth Management budget cleared. Recommended for approval as corporate advisory mandates are crucial right now.',
        timestamp: '2026-06-11T09:12:00Z'
      },
      {
        id: 'c3',
        userName: 'Chioma Nze',
        userRole: 'Auditor',
        message: 'Internal review passed. Spending fits executive entertainment policies section 4.2b.',
        timestamp: '2026-06-11T14:48:00Z'
      },
      {
        id: 'c4',
        userName: 'Dr. Olaoluwa Vetiva',
        userRole: 'Executive',
        message: 'Approved. Utilize Wealth Management advisory allocation. Keep track of all receipts.',
        timestamp: '2026-06-12T10:05:00Z'
      },
      {
        id: 'c5',
        userName: 'Aisha Suleiman',
        userRole: 'Finance',
        message: 'Payment processed and transfer slip generated. Retain invoices and retirement receipts on/before 10-Jul-2026.',
        timestamp: '2026-06-12T16:30:00Z'
      }
    ],
    queries: [],
    signatures: {
      Initiator: {
        name: 'Adeleke Olanrewaju',
        position: 'VP, Private Assets',
        timestamp: '2026-06-10 11:25 AM',
        type: 'draw',
        value: MOCK_SIG_BASE64
      },
      LineManager: {
        name: 'Babatunde Lawson',
        position: 'Head, Wealth Management',
        timestamp: '2026-06-11 09:12 AM',
        type: 'draw',
        value: MOCK_SIG_MANAGER
      },
      Auditor: {
        name: 'Chioma Nze',
        position: 'Chief Compliance Officer',
        timestamp: '2026-06-11 02:48 PM',
        type: 'draw',
        value: MOCK_SIG_AUDITOR
      },
      Executive: {
        name: 'Dr. Olaoluwa Vetiva',
        position: 'Managing Director / CEO',
        timestamp: '2026-06-12 10:05 AM',
        type: 'type',
        value: 'Dr. Olaoluwa Vetiva'
      },
      Finance: {
        name: 'Aisha Suleiman',
        position: 'Financial Controller',
        timestamp: '2026-06-12 04:30 PM',
        type: 'type',
        value: 'AISHA S.'
      }
    },
    financeVoucherNo: 'VET-PV-2026-0921',
    bankReference: 'CBN-FT-948123049182',
    paymentDate: '2026-06-12',
    paymentMethod: 'Bank Transfer (Access Bank)',
    paymentProofName: 'payment_slip_accessbank_0921.pdf',
    cashCustodian: 'Main Treasury Vault'
  },
  {
    id: 'VET/MEMO/2026/015',
    type: 'PettyCash',
    title: 'Emergency Fuel Purchase for Operations Generators',
    purpose: 'Purchase of 300 liters of diesel fuel for primary office generators to avert power failure due to grid collapse.',
    businessJustification: 'National grid collapsed at 06:00 AM. In-house UPS systems have a maximum 2-hour backup threshold. Server rooms require continuous cooling.',
    amount: 420000,
    costCenter: 'VET-CC-OP808',
    department: 'Operations',
    beneficiary: 'Friday Ezekiel',
    priority: 'Urgent',
    attachments: [
      { name: 'fuel_invoice_total_energies.pdf', size: '135 KB', type: 'application/pdf' }
    ],
    status: 'Released',
    createdAt: '2026-06-14T08:15:00Z',
    initiator: {
      name: 'Friday Ezekiel',
      email: 'f.ezekiel@vetiva.com'
    },
    comments: [
      {
        id: 'fc1',
        userName: 'Friday Ezekiel',
        userRole: 'Initiator',
        message: 'Diesel price set at N1,400 per liter. Immediate dispatch needed.',
        timestamp: '2026-06-14T08:18:00Z'
      },
      {
        id: 'fc2',
        userName: 'Babatunde Lawson',
        userRole: 'LineManager',
        message: 'Urgent compliance. Operations team requested emergency funds bypass directly to internal auditor.',
        timestamp: '2026-06-14T08:30:00Z'
      },
      {
        id: 'fc3',
        userName: 'Chioma Nze',
        userRole: 'Auditor',
        message: 'Compliance verified against Business Continuity Plan (BCP-09). Approved.',
        timestamp: '2026-06-14T08:45:00Z'
      },
      {
        id: 'fc4',
        userName: 'Dr. Olaoluwa Vetiva',
        userRole: 'Executive',
        message: 'Expedited. Authorized.',
        timestamp: '2026-06-14T09:00:00Z'
      },
      {
        id: 'fc5',
        userName: 'Aisha Suleiman',
        userRole: 'Finance',
        message: 'Petty cash released over-the-counter via cash custodian.',
        timestamp: '2026-06-14T09:15:00Z'
      }
    ],
    queries: [],
    signatures: {
      Initiator: {
        name: 'Friday Ezekiel',
        position: 'Head of Facilities',
        timestamp: '2026-06-14 08:18 AM',
        type: 'draw',
        value: MOCK_SIG_BASE64
      },
      LineManager: {
        name: 'Babatunde Lawson',
        position: 'Operations Director',
        timestamp: '2026-06-14 08:30 AM',
        type: 'draw',
        value: MOCK_SIG_MANAGER
      },
      Auditor: {
        name: 'Chioma Nze',
        position: 'Internal Control Auditor',
        timestamp: '2026-06-14 08:45 AM',
        type: 'draw',
        value: MOCK_SIG_AUDITOR
      },
      Executive: {
        name: 'Dr. Olaoluwa Vetiva',
        position: 'Managing Director / CEO',
        timestamp: '2026-06-14 09:00 AM',
        type: 'type',
        value: 'Dr. O. Vetiva'
      },
      Finance: {
        name: 'Aisha Suleiman',
        position: 'Financial Controller',
        timestamp: '2026-06-14 09:15 AM',
        type: 'type',
        value: 'Aisha S.'
      }
    },
    financeVoucherNo: 'VET-PCF-2026-0044',
    paymentDate: '2026-06-14',
    paymentMethod: 'Cash Release',
    cashCustodian: 'Ezekiel Alao (Ground Custodian)'
  },
  {
    id: 'VET/MEMO/2026/018',
    type: 'VendorPayment',
    title: 'Exchange Infrastructure Virtualization Renewal - VMware license',
    purpose: 'Annual renewal of enterprise virtualization hypervisor subscription managing primary transaction databases.',
    businessJustification: 'Critical renewal. The license expires on July 1st. Failure to renew results in termination of live backups and support access.',
    amount: 1950000,
    costCenter: 'VET-CC-IT202',
    department: 'IT & Infrastructure',
    beneficiary: 'Reseller Enterprise West Africa',
    vendorName: 'Global Softwares West Africa Ltd',
    bankName: 'UBA Plc',
    accountNumber: '1029485721',
    priority: 'High',
    attachments: [
      { name: 'vmware_renewal_quote_341.pdf', size: '540 KB', type: 'application/pdf' },
      { name: 'it_audit_clearance_note.pdf', size: '180 KB', type: 'application/pdf' }
    ],
    status: 'PendingExecutive',
    createdAt: '2026-06-12T09:40:00Z',
    initiator: {
      name: 'Chinedu Egwu',
      email: 'c.egwu@vetiva.com'
    },
    comments: [
      {
        id: 'vc1',
        userName: 'Chinedu Egwu',
        userRole: 'Initiator',
        message: 'Quote verified against vendor exchange rate. Price locked till June 20th.',
        timestamp: '2026-06-12T09:44:00Z'
      },
      {
        id: 'vc2',
        userName: 'Babatunde Lawson',
        userRole: 'LineManager',
        message: 'Technically approved. Software is vital for server clustering.',
        timestamp: '2026-06-12T13:20:00Z'
      },
      {
        id: 'vc3',
        userName: 'Chioma Nze',
        userRole: 'Auditor',
        message: 'Internal Control approved. Budget exists under CC-IT202 Capital Expenditure.',
        timestamp: '2026-06-13T10:15:00Z'
      }
    ],
    queries: [],
    signatures: {
      Initiator: {
        name: 'Chinedu Egwu',
        position: 'Chief Enterprise Architect',
        timestamp: '2026-06-12 09:44 AM',
        type: 'draw',
        value: MOCK_SIG_BASE64
      },
      LineManager: {
        name: 'Babatunde Lawson',
        position: 'IT Director',
        timestamp: '2026-06-12 01:20 PM',
        type: 'draw',
        value: MOCK_SIG_MANAGER
      },
      Auditor: {
        name: 'Chioma Nze',
        position: 'Internal Control Auditor',
        timestamp: '2026-06-13 10:15 AM',
        type: 'draw',
        value: MOCK_SIG_AUDITOR
      }
    }
  },
  {
    id: 'VET/MEMO/2026/020',
    type: 'CashAdvance',
    title: 'Securitization Training Workshop Travel Expense',
    purpose: 'Travel and accommodation for two compliance officers attending the SEC Capital Markets compliance workshop at Hilton Abuja.',
    businessJustification: 'Mandatory Securities and Exchange Commission professional development training. Compliance reporting requirement.',
    amount: 550000,
    costCenter: 'VET-CC-LC102',
    department: 'Legal & Compliance',
    beneficiary: 'Fola Soyinka',
    expectedRetirementDate: '2026-06-25',
    priority: 'Medium',
    attachments: [
      { name: 'sec_workshop_prospectus.pdf', size: '1.4 MB', type: 'application/pdf' }
    ],
    status: 'ReturnedForCorrection',
    createdAt: '2026-06-13T15:00:00Z',
    initiator: {
      name: 'Fola Soyinka',
      email: 'f.soyinka@vetiva.com'
    },
    comments: [
      {
        id: 'cs1',
        userName: 'Fola Soyinka',
        userRole: 'Initiator',
        message: 'Request submitted for Abuja SEC workshop.',
        timestamp: '2026-06-13T15:02:00Z'
      },
      {
        id: 'cs2',
        userName: 'Babatunde Lawson',
        userRole: 'LineManager',
        message: 'Approved for further auditing.',
        timestamp: '2026-06-14T11:40:00Z'
      },
      {
        id: 'cs3',
        userName: 'Chioma Nze',
        userRole: 'Auditor',
        message: 'Raised a query. Needs complete breakdown for the N550k cost.',
        timestamp: '2026-06-14T16:22:00Z'
      }
    ],
    queries: [
      {
        id: 'q1',
        question: 'Please attach a comprehensive daily travel expense breakdown and verify if transport includes flight bookings.',
        questionBy: 'Auditor',
        questionByName: 'Chioma Nze',
        timestamp: '2026-06-14T16:22:00Z'
      }
    ],
    signatures: {
      Initiator: {
        name: 'Fola Soyinka',
        position: 'Asst. Compliance Manager',
        timestamp: '2026-06-13 03:02 PM',
        type: 'draw',
        value: MOCK_SIG_BASE64
      },
      LineManager: {
        name: 'Babatunde Lawson',
        position: 'Head Legal Counsel',
        timestamp: '2026-06-14 11:40 AM',
        type: 'draw',
        value: MOCK_SIG_MANAGER
      }
    }
  },
  {
    id: 'VET/MEMO/2026/021',
    type: 'PettyCash',
    title: 'Conference Room Boardroom Display Repairs',
    purpose: 'Repair of HDMI feedback matrix and mounting brackets in Executive Boardroom B ahead of executive quarterly reviews.',
    businessJustification: 'Screen flicker makes visual presentations impossible. Board sessions are scheduled starting June 20th.',
    amount: 145000,
    costCenter: 'VET-CC-OP808',
    department: 'IT & Infrastructure',
    beneficiary: 'Daniel Abba',
    priority: 'Low',
    attachments: [],
    status: 'PendingLineManager',
    createdAt: '2026-06-14T17:10:00Z',
    initiator: {
      name: 'Daniel Abba',
      email: 'd.abba@vetiva.com'
    },
    comments: [],
    queries: [],
    signatures: {
      Initiator: {
        name: 'Daniel Abba',
        position: 'ICT Specialist',
        timestamp: '2026-06-14 05:10 PM',
        type: 'draw',
        value: MOCK_SIG_BASE64
      }
    }
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-10T11:20:00Z',
    user: 'Adeleke Olanrewaju',
    role: 'Initiator',
    action: 'MEMO_CREATED',
    ipAddress: '192.168.10.45',
    memoId: 'VET/MEMO/2026/012',
    details: 'Created Cash Advance Request for Dinner consults'
  },
  {
    id: 'log-2',
    timestamp: '2026-06-11T09:12:00Z',
    user: 'Babatunde Lawson',
    role: 'LineManager',
    action: 'MEMO_APPROVED',
    ipAddress: '192.168.10.12',
    memoId: 'VET/MEMO/2026/012',
    details: 'Approved and applied digital signature.'
  },
  {
    id: 'log-3',
    timestamp: '2026-06-11T14:48:00Z',
    user: 'Chioma Nze',
    role: 'Auditor',
    action: 'MEMO_COMPLIANCE_VERIFIED',
    ipAddress: '192.168.12.8',
    memoId: 'VET/MEMO/2026/012',
    details: 'Verified budget adherence and regulatory compliance policies.'
  },
  {
    id: 'log-4',
    timestamp: '2026-06-12T10:05:00Z',
    user: 'Dr. Olaoluwa Vetiva',
    role: 'Executive',
    action: 'MEMO_EXECUTIVE_APPROVED',
    ipAddress: '192.168.1.1',
    memoId: 'VET/MEMO/2026/012',
    details: 'Final authorization granted. Outlined compliance with retirement schedule.'
  },
  {
    id: 'log-5',
    timestamp: '2026-06-12T16:30:00Z',
    user: 'Aisha Suleiman',
    role: 'Finance',
    action: 'MEMO_COMPLETED_PAID',
    ipAddress: '192.168.10.5',
    memoId: 'VET/MEMO/2026/012',
    details: 'Disbursed funds of N750k via bank transfer. Assigned Voucher VET-PV-2026-0921.'
  },
  {
    id: 'log-6',
    timestamp: '2026-06-14T08:15:00Z',
    user: 'Friday Ezekiel',
    role: 'Initiator',
    action: 'MEMO_CREATED',
    ipAddress: '192.168.10.99',
    memoId: 'VET/MEMO/2026/015',
    details: 'Initiated Urgent Diesel Request.'
  },
  {
    id: 'log-7',
    timestamp: '2026-06-14T16:22:00Z',
    user: 'Chioma Nze',
    role: 'Auditor',
    action: 'MEMO_QUERY_RAISED',
    ipAddress: '192.168.12.8',
    memoId: 'VET/MEMO/2026/020',
    details: 'Raised compliance breakdown query to Fola Soyinka regarding Securitization travel.'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    message: 'URGENT: Generator fuel purchase Petty Cash request VET/MEMO/2026/015 requires final releasing.',
    timestamp: '2026-06-14T09:05:00Z',
    read: false,
    type: 'urgent'
  },
  {
    id: 'notif-2',
    message: 'Your query on Securitization Workshop Memo VET/MEMO/2026/020 has been logged. Action required.',
    timestamp: '2026-06-14T16:22:00Z',
    read: false,
    type: 'alert'
  },
  {
    id: 'notif-3',
    message: 'Cash Advance request VET/MEMO/2026/012 has been marked PAID by the Treasury Desk.',
    timestamp: '2026-06-12T16:30:00Z',
    read: true,
    type: 'success'
  }
];
