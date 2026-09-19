import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'BENEFICIARY' | 'FIELD_OFFICER' | 'DISTRICT_OFFICER' | 'FINANCE_APPROVER' | 'ADMIN';
  district: string;
  state: string;
  phone: string;
  department?: string;
  beneficiaryProfile?: BeneficiaryProfile;
}

export interface BeneficiaryProfile {
  aadhaarNumber: string;
  category: 'SMALL_FARMER' | 'MARGINAL_FARMER' | 'RURAL_ARTISAN' | 'WOMEN_ENTREPRENEUR' | 'SC_ST_GENERAL';
  annualIncome: number;
  landHoldingAcres: number;
  bankAccount: string;
  ifscCode: string;
  bankName: string;
  panNumber: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface Scheme {
  id: string;
  code: string;
  title: string;
  department: string;
  description: string;
  totalBudget: number;
  disbursedAmount: number;
  allocatedAmount: number;
  status: 'ACTIVE' | 'DRAFT' | 'CLOSED';
  startDate: string;
  endDate: string;
  grantAmountMin: number;
  grantAmountMax: number;
  eligibilityCriteria: {
    maxIncome: number;
    eligibleCategories: string[];
    minAge: number;
    maxAge: number;
    maxLandHoldingAcres: number;
    requiredDocuments: string[];
  };
  stagesConfig: {
    stageNumber: number;
    name: string;
    percentage: number;
    daysFromPrevious: number;
    requiredProof: string;
  }[];
  regionalBudgets: {
    district: string;
    allocated: number;
    spent: number;
  }[];
}

export interface VerificationRecord {
  id: string;
  applicationId: string;
  stage: 'FIELD_VERIFICATION' | 'DISTRICT_REVIEW' | 'FINANCE_APPROVAL';
  officerId: string;
  officerName: string;
  officerRole: string;
  status: 'RECOMMENDED' | 'APPROVED' | 'REJECTED' | 'RE_VERIFICATION_REQUESTED' | 'ESCALATED';
  decisionDate: string;
  remarks: string;
  geoCoordinates?: string;
  findings?: Record<string, any>;
}

export interface Milestone {
  id: string;
  applicationId: string;
  milestoneNumber: number;
  title: string;
  description: string;
  amount: number;
  percentage: number;
  dueDate: string;
  status: 'SCHEDULED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'DISBURSED' | 'OVERDUE' | 'NON_COMPLIANT';
  proofDocument?: string;
  proofSubmittedDate?: string;
  verifiedBy?: string;
  verificationDate?: string;
  disbursedDate?: string;
  transactionRef?: string;
  utrNumber?: string;
  remarks?: string;
}

export interface Application {
  id: string;
  applicationNumber: string;
  schemeId: string;
  schemeTitle: string;
  schemeCode: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryCategory: string;
  beneficiaryPhone: string;
  district: string;
  state: string;
  requestedAmount: number;
  sanctionedAmount?: number;
  submissionDate: string;
  currentStatus: 
    | 'SUBMITTED' 
    | 'UNDER_FIELD_VERIFICATION' 
    | 'FIELD_VERIFIED' 
    | 'UNDER_DISTRICT_REVIEW' 
    | 'DISTRICT_APPROVED' 
    | 'ESCALATED_SCRUTINY' 
    | 'FINANCE_APPROVED' 
    | 'SANCTIONED' 
    | 'DISBURSEMENT_IN_PROGRESS' 
    | 'COMPLETED' 
    | 'REJECTED' 
    | 'RE_VERIFICATION_REQUIRED'
    | 'REAPPLY_REQUESTED';
  currentStage: 'FIELD_VERIFICATION' | 'DISTRICT_REVIEW' | 'FINANCE_APPROVAL' | 'DISBURSEMENT' | 'CLOSED';
  eligibilityScore: number;
  priorityBand: 'FAST_TRACK' | 'STANDARD' | 'SCRUTINY_FLAGGED';
  scoreBreakdown: {
    incomeScore: number;
    categoryScore: number;
    landScore: number;
    documentationScore: number;
    ageScore: number;
    total: number;
  };
  isHighValue: boolean;
  documents: {
    type: string;
    fileName: string;
    url: string;
    verified: boolean;
  }[];
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  sanctionOrderNumber?: string;
  sanctionDate?: string;
  assignedFieldOfficerId?: string;
  assignedFieldOfficerName?: string;
  rejectionReason?: string;
  reapplyRemarks?: string;
  milestones: Milestone[];
  verificationHistory: VerificationRecord[];
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: 'APPLICATION' | 'SCHEME' | 'USER' | 'DISBURSEMENT' | 'SYSTEM';
  targetId: string;
  previousState?: string;
  newState?: string;
  remarks: string;
  ipAddress: string;
}

// Password for demo accounts: "Gov@1234"
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Gov@1234', 10);

export const initialUsers: User[] = [
  {
    id: 'USR-ADM-001',
    name: 'Dr. Rajesh Verma',
    email: 'admin@gov.in',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'ADMIN',
    district: 'State HQ',
    state: 'Maharashtra',
    phone: '+91 9820011223',
    department: 'Ministry of Direct Benefit Transfer & Social Welfare'
  },
  {
    id: 'USR-DST-101',
    name: 'Anjali Deshmukh, IAS',
    email: 'district.officer@gov.in',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'DISTRICT_OFFICER',
    district: 'Pune',
    state: 'Maharashtra',
    phone: '+91 9821122334',
    department: 'District Collectorate'
  },
  {
    id: 'USR-FLD-201',
    name: 'Vikram Shinde',
    email: 'field.officer@gov.in',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'FIELD_OFFICER',
    district: 'Pune',
    state: 'Maharashtra',
    phone: '+91 9822233445',
    department: 'Department of Agriculture & Rural Verification'
  },
  {
    id: 'USR-FIN-301',
    name: 'Suresh Narayanan',
    email: 'finance.officer@gov.in',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'FINANCE_APPROVER',
    district: 'State Treasury',
    state: 'Maharashtra',
    phone: '+91 9823344556',
    department: 'State Treasury & DBT Cell'
  },
  {
    id: 'USR-BEN-401',
    name: 'Ramesh Balaji Patil',
    email: 'ramesh.kumar@beneficiary.in',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'BENEFICIARY',
    district: 'Pune',
    state: 'Maharashtra',
    phone: '+91 9876543210',
    beneficiaryProfile: {
      aadhaarNumber: 'XXXX-XXXX-8921',
      category: 'SMALL_FARMER',
      annualIncome: 140000,
      landHoldingAcres: 2.5,
      bankAccount: '918273645012',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India - Baramati Branch',
      panNumber: 'ABCDE1234F',
      age: 42,
      gender: 'MALE'
    }
  },
  {
    id: 'USR-BEN-402',
    name: 'Sunita Meena',
    email: 'sunita.artisan@beneficiary.in',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'BENEFICIARY',
    district: 'Pune',
    state: 'Maharashtra',
    phone: '+91 9890123456',
    beneficiaryProfile: {
      aadhaarNumber: 'XXXX-XXXX-3419',
      category: 'WOMEN_ENTREPRENEUR',
      annualIncome: 95000,
      landHoldingAcres: 0,
      bankAccount: '109283746522',
      ifscCode: 'BARB0BARAMA',
      bankName: 'Bank of Baroda - Haveli',
      panNumber: 'FGHIJ5678K',
      age: 36,
      gender: 'FEMALE'
    }
  }
];

export const initialSchemes: Scheme[] = [
  {
    id: 'SCH-AGR-001',
    code: 'PM-KSY-2025',
    title: 'Krishi Sinchayee Micro-Irrigation Modernization Grant',
    department: 'Agriculture & Farmers Welfare',
    description: 'Direct financial assistance for small and marginal farmers to install drip and sprinkler micro-irrigation systems to improve water use efficiency.',
    totalBudget: 25000000, // 2.5 Crore
    allocatedAmount: 18500000,
    disbursedAmount: 12400000,
    status: 'ACTIVE',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    grantAmountMin: 25000,
    grantAmountMax: 75000,
    eligibilityCriteria: {
      maxIncome: 250000,
      eligibleCategories: ['SMALL_FARMER', 'MARGINAL_FARMER', 'SC_ST_GENERAL'],
      minAge: 18,
      maxAge: 70,
      maxLandHoldingAcres: 5.0,
      requiredDocuments: ['Aadhaar Card', 'Land Revenue 7/12 Extract', 'Bank Passbook Copy', 'Quotation from Approved Vendor']
    },
    stagesConfig: [
      { stageNumber: 1, name: 'Stage 1: Advance for Equipment Procurement', percentage: 30, daysFromPrevious: 7, requiredProof: 'Vendor Order & Advance Receipt' },
      { stageNumber: 2, name: 'Stage 2: Ground Installation & Field Verification', percentage: 40, daysFromPrevious: 30, requiredProof: 'Geo-tagged Installation Photos & Field Officer Report' },
      { stageNumber: 3, name: 'Stage 3: Final Inspection & Utilization Certificate', percentage: 30, daysFromPrevious: 60, requiredProof: 'Certified Utilization Certificate (UC) & Water Flow Inspection' }
    ],
    regionalBudgets: [
      { district: 'Pune', allocated: 8000000, spent: 5400000 },
      { district: 'Nagpur', allocated: 5500000, spent: 3200000 },
      { district: 'Nashik', allocated: 6000000, spent: 2600000 },
      { district: 'Satara', allocated: 5500000, spent: 1200000 }
    ]
  },
  {
    id: 'SCH-SLR-002',
    code: 'SURYA-GHAR-2025',
    title: 'Surya Ghar Rooftop Solar & Green Energy Subsidy',
    department: 'New & Renewable Energy',
    description: 'Capital subsidy scheme incentivizing domestic and agrarian rooftop solar installations (up to 3kW to 5kW) for sustainable distributed power generation.',
    totalBudget: 40000000, // 4 Crore
    allocatedAmount: 31000000,
    disbursedAmount: 21500000,
    status: 'ACTIVE',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    grantAmountMin: 40000,
    grantAmountMax: 120000,
    eligibilityCriteria: {
      maxIncome: 500000,
      eligibleCategories: ['SMALL_FARMER', 'MARGINAL_FARMER', 'RURAL_ARTISAN', 'WOMEN_ENTREPRENEUR', 'SC_ST_GENERAL'],
      minAge: 21,
      maxAge: 75,
      maxLandHoldingAcres: 15.0,
      requiredDocuments: ['Aadhaar Card', 'Electricity Bill of Last 3 Months', 'Rooftop Ownership Proof', 'Discom Net-Metering Approval']
    },
    stagesConfig: [
      { stageNumber: 1, name: 'Stage 1: Discom Feasibility & Structure Setup', percentage: 35, daysFromPrevious: 10, requiredProof: 'Discom Sanction Letter & Mounting Photos' },
      { stageNumber: 2, name: 'Stage 2: PV Panels & Inverter Installation', percentage: 45, daysFromPrevious: 35, requiredProof: 'Net-Meter Commissioning Certificate & Geo-tagged Inspection' },
      { stageNumber: 3, name: 'Stage 3: 30-Day Generation Audit & Final UC', percentage: 20, daysFromPrevious: 65, requiredProof: 'Discom Generation Certificate & Signed Beneficiary UC' }
    ],
    regionalBudgets: [
      { district: 'Pune', allocated: 12000000, spent: 8900000 },
      { district: 'Nagpur', allocated: 10000000, spent: 6200000 },
      { district: 'Nashik', allocated: 9000000, spent: 4100000 },
      { district: 'Satara', allocated: 9000000, spent: 2300000 }
    ]
  },
  {
    id: 'SCH-WSH-003',
    code: 'MAHILA-SHG-2025',
    title: 'Mahila Vikas Self-Help Group Enterprise Grant',
    department: 'Rural Development & Women Empowerment',
    description: 'Seed capital and expansion grants for women-led rural cottage industries, agro-processing, food preservation, and handicraft collectives.',
    totalBudget: 15000000, // 1.5 Crore
    allocatedAmount: 11200000,
    disbursedAmount: 8400000,
    status: 'ACTIVE',
    startDate: '2025-03-15',
    endDate: '2026-06-30',
    grantAmountMin: 30000,
    grantAmountMax: 90000,
    eligibilityCriteria: {
      maxIncome: 180000,
      eligibleCategories: ['WOMEN_ENTREPRENEUR', 'RURAL_ARTISAN', 'SC_ST_GENERAL'],
      minAge: 18,
      maxAge: 65,
      maxLandHoldingAcres: 2.0,
      requiredDocuments: ['Aadhaar Card', 'SHG Membership Registration', 'Group Bank Passbook', 'Enterprise Business Plan']
    },
    stagesConfig: [
      { stageNumber: 1, name: 'Stage 1: Working Capital Mobilization', percentage: 40, daysFromPrevious: 7, requiredProof: 'Raw Material Purchase Invoices' },
      { stageNumber: 2, name: 'Stage 2: Production Commenced & Peer Audit', percentage: 35, daysFromPrevious: 45, requiredProof: 'Field Officer Inspection & Sales Register Log' },
      { stageNumber: 3, name: 'Stage 3: Market Linkage & Annual UC Sign-off', percentage: 25, daysFromPrevious: 75, requiredProof: 'Audited Group Utilization Statement' }
    ],
    regionalBudgets: [
      { district: 'Pune', allocated: 4500000, spent: 3400000 },
      { district: 'Nagpur', allocated: 3500000, spent: 2100000 },
      { district: 'Nashik', allocated: 4000000, spent: 1800000 },
      { district: 'Satara', allocated: 3000000, spent: 1100000 }
    ]
  },
  {
    id: 'SCH-ART-004',
    code: 'RURAL-HUNAR-2025',
    title: 'Vishwakarma Rural Artisan Tooling & Modernization Grant',
    department: 'Skill Development & Traditional Crafts',
    description: 'Modern equipment purchase subsidy and safety gear kit assistance for traditional blacksmiths, weavers, potters, and sculptors.',
    totalBudget: 12000000,
    allocatedAmount: 7800000,
    disbursedAmount: 5100000,
    status: 'ACTIVE',
    startDate: '2025-02-01',
    endDate: '2026-03-31',
    grantAmountMin: 20000,
    grantAmountMax: 50000,
    eligibilityCriteria: {
      maxIncome: 150000,
      eligibleCategories: ['RURAL_ARTISAN', 'SC_ST_GENERAL'],
      minAge: 18,
      maxAge: 68,
      maxLandHoldingAcres: 1.0,
      requiredDocuments: ['Aadhaar Card', 'Artisan Guild Certificate', 'Bank Account Proof', 'Equipment Quotation']
    },
    stagesConfig: [
      { stageNumber: 1, name: 'Stage 1: Tool Kit Procurement Advance', percentage: 50, daysFromPrevious: 7, requiredProof: 'Supplier Delivery Challan' },
      { stageNumber: 2, name: 'Stage 2: Workshop Commissioning & Final Verification', percentage: 50, daysFromPrevious: 40, requiredProof: 'Field Officer Physical Inspection & Craft Demonstration Photo' }
    ],
    regionalBudgets: [
      { district: 'Pune', allocated: 3500000, spent: 2400000 },
      { district: 'Nagpur', allocated: 2500000, spent: 1400000 },
      { district: 'Nashik', allocated: 3000000, spent: 900000 },
      { district: 'Satara', allocated: 3000000, spent: 400000 }
    ]
  }
];

export const initialApplications: Application[] = [
  {
    id: 'APP-2025-0091',
    applicationNumber: 'MH-PUN-AGR-2025-0091',
    schemeId: 'SCH-AGR-001',
    schemeTitle: 'Krishi Sinchayee Micro-Irrigation Modernization Grant',
    schemeCode: 'PM-KSY-2025',
    beneficiaryId: 'USR-BEN-401',
    beneficiaryName: 'Ramesh Balaji Patil',
    beneficiaryCategory: 'SMALL_FARMER',
    beneficiaryPhone: '+91 9876543210',
    district: 'Pune',
    state: 'Maharashtra',
    requestedAmount: 65000,
    sanctionedAmount: 65000,
    submissionDate: '2025-08-10T10:30:00Z',
    currentStatus: 'DISBURSEMENT_IN_PROGRESS',
    currentStage: 'DISBURSEMENT',
    eligibilityScore: 88,
    priorityBand: 'FAST_TRACK',
    scoreBreakdown: {
      incomeScore: 28, // Low income bonus
      categoryScore: 25, // Small farmer priority
      landScore: 18, // 2.5 acres within ideal bracket
      documentationScore: 10, // Full set attached
      ageScore: 7,
      total: 88
    },
    isHighValue: false,
    documents: [
      { type: 'Aadhaar Card', fileName: 'aadhaar_ramesh_patil.pdf', url: '#', verified: true },
      { type: 'Land Revenue 7/12 Extract', fileName: '7_12_land_record_baramati.pdf', url: '#', verified: true },
      { type: 'Bank Passbook Copy', fileName: 'sbi_passbook_copy.pdf', url: '#', verified: true },
      { type: 'Quotation from Approved Vendor', fileName: 'jain_irrigation_quote.pdf', url: '#', verified: true }
    ],
    bankDetails: {
      accountNumber: '918273645012',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India - Baramati'
    },
    sanctionOrderNumber: 'SO/2025/MH-PUN/AGR-8812',
    sanctionDate: '2025-08-20T14:15:00Z',
    assignedFieldOfficerId: 'USR-FLD-201',
    assignedFieldOfficerName: 'Vikram Shinde',
    milestones: [
      {
        id: 'MLS-0091-1',
        applicationId: 'APP-2025-0091',
        milestoneNumber: 1,
        title: 'Stage 1: Advance for Equipment Procurement',
        description: '30% upfront grant release for ordering micro-irrigation hardware.',
        amount: 19500,
        percentage: 30,
        dueDate: '2025-08-27T00:00:00Z',
        status: 'DISBURSED',
        proofDocument: 'vendor_invoice_inv771.pdf',
        proofSubmittedDate: '2025-08-22T09:00:00Z',
        verifiedBy: 'Suresh Narayanan (Finance)',
        verificationDate: '2025-08-24T11:00:00Z',
        disbursedDate: '2025-08-25T16:30:00Z',
        transactionRef: 'DBT-TR-2025-998124',
        utrNumber: 'SBIN882910471201',
        remarks: 'Advance tranche released successfully to beneficiary account.'
      },
      {
        id: 'MLS-0091-2',
        applicationId: 'APP-2025-0091',
        milestoneNumber: 2,
        title: 'Stage 2: Ground Installation & Field Verification',
        description: '40% milestone grant upon physical installation and field inspection.',
        amount: 26000,
        percentage: 40,
        dueDate: '2025-09-25T00:00:00Z',
        status: 'PENDING_VERIFICATION',
        proofDocument: 'drip_installation_photo_geo.jpg',
        proofSubmittedDate: '2025-09-12T10:45:00Z',
        remarks: 'Beneficiary uploaded geotagged drip line photos. Awaiting Field Officer verification sign-off.'
      },
      {
        id: 'MLS-0091-3',
        applicationId: 'APP-2025-0091',
        milestoneNumber: 3,
        title: 'Stage 3: Final Inspection & Utilization Certificate',
        description: '30% final retention upon submission of certified UC.',
        amount: 19500,
        percentage: 30,
        dueDate: '2025-11-20T00:00:00Z',
        status: 'SCHEDULED',
        remarks: 'Scheduled after Stage 2 completion.'
      }
    ],
    verificationHistory: [
      {
        id: 'VR-01',
        applicationId: 'APP-2025-0091',
        stage: 'FIELD_VERIFICATION',
        officerId: 'USR-FLD-201',
        officerName: 'Vikram Shinde',
        officerRole: 'FIELD_OFFICER',
        status: 'RECOMMENDED',
        decisionDate: '2025-08-14T11:20:00Z',
        remarks: 'Field visit completed on 13-Aug-2025. Verified 2.5 acre sugarcane plot. Water source available via canal. Farmer genuinely qualifies.',
        geoCoordinates: '18.1519° N, 74.5772° E'
      },
      {
        id: 'VR-02',
        applicationId: 'APP-2025-0091',
        stage: 'DISTRICT_REVIEW',
        officerId: 'USR-DST-101',
        officerName: 'Anjali Deshmukh, IAS',
        officerRole: 'DISTRICT_OFFICER',
        status: 'APPROVED',
        decisionDate: '2025-08-18T16:00:00Z',
        remarks: 'District quota checked. All parameters conform to state guidelines. Approved for financial sanction.'
      },
      {
        id: 'VR-03',
        applicationId: 'APP-2025-0091',
        stage: 'FINANCE_APPROVAL',
        officerId: 'USR-FIN-301',
        officerName: 'Suresh Narayanan',
        officerRole: 'FINANCE_APPROVER',
        status: 'APPROVED',
        decisionDate: '2025-08-20T14:15:00Z',
        remarks: 'Bank account pre-validated via PFMS. Sanction order SO/2025/MH-PUN/AGR-8812 issued. 3-stage milestone schedule registered.'
      }
    ],
    updatedAt: '2025-09-12T10:45:00Z'
  },
  {
    id: 'APP-2025-0104',
    applicationNumber: 'MH-PUN-SLR-2025-0104',
    schemeId: 'SCH-SLR-002',
    schemeTitle: 'Surya Ghar Rooftop Solar & Green Energy Subsidy',
    schemeCode: 'SURYA-GHAR-2025',
    beneficiaryId: 'USR-BEN-402',
    beneficiaryName: 'Sunita Meena',
    beneficiaryCategory: 'WOMEN_ENTREPRENEUR',
    beneficiaryPhone: '+91 9890123456',
    district: 'Pune',
    state: 'Maharashtra',
    requestedAmount: 95000,
    submissionDate: '2025-09-02T14:10:00Z',
    currentStatus: 'UNDER_FIELD_VERIFICATION',
    currentStage: 'FIELD_VERIFICATION',
    eligibilityScore: 92,
    priorityBand: 'FAST_TRACK',
    scoreBreakdown: {
      incomeScore: 30,
      categoryScore: 30,
      landScore: 15,
      documentationScore: 10,
      ageScore: 7,
      total: 92
    },
    isHighValue: true,
    documents: [
      { type: 'Aadhaar Card', fileName: 'sunita_aadhaar.pdf', url: '#', verified: true },
      { type: 'Electricity Bill of Last 3 Months', fileName: 'mseb_bill_august.pdf', url: '#', verified: true },
      { type: 'Rooftop Ownership Proof', fileName: 'property_tax_receipt.pdf', url: '#', verified: false },
      { type: 'Discom Net-Metering Approval', fileName: 'discom_feasibility_approval.pdf', url: '#', verified: true }
    ],
    bankDetails: {
      accountNumber: '109283746522',
      ifscCode: 'BARB0BARAMA',
      bankName: 'Bank of Baroda - Haveli'
    },
    assignedFieldOfficerId: 'USR-FLD-201',
    assignedFieldOfficerName: 'Vikram Shinde',
    milestones: [],
    verificationHistory: [],
    updatedAt: '2025-09-02T14:10:00Z'
  },
  {
    id: 'APP-2025-0078',
    applicationNumber: 'MH-PUN-WSH-2025-0078',
    schemeId: 'SCH-WSH-003',
    schemeTitle: 'Mahila Vikas Self-Help Group Enterprise Grant',
    schemeCode: 'MAHILA-SHG-2025',
    beneficiaryId: 'USR-BEN-402',
    beneficiaryName: 'Sunita Meena (Pragati SHG)',
    beneficiaryCategory: 'WOMEN_ENTREPRENEUR',
    beneficiaryPhone: '+91 9890123456',
    district: 'Pune',
    state: 'Maharashtra',
    requestedAmount: 75000,
    sanctionedAmount: 75000,
    submissionDate: '2025-07-15T09:20:00Z',
    currentStatus: 'UNDER_DISTRICT_REVIEW',
    currentStage: 'DISTRICT_REVIEW',
    eligibilityScore: 84,
    priorityBand: 'FAST_TRACK',
    scoreBreakdown: {
      incomeScore: 28,
      categoryScore: 30,
      landScore: 12,
      documentationScore: 8,
      ageScore: 6,
      total: 84
    },
    isHighValue: false,
    documents: [
      { type: 'Aadhaar Card', fileName: 'pragati_lead_aadhaar.pdf', url: '#', verified: true },
      { type: 'SHG Membership Registration', fileName: 'shg_reg_cert_pune.pdf', url: '#', verified: true },
      { type: 'Group Bank Passbook', fileName: 'shg_bank_passbook.pdf', url: '#', verified: true },
      { type: 'Enterprise Business Plan', fileName: 'spices_processing_plan.pdf', url: '#', verified: true }
    ],
    bankDetails: {
      accountNumber: '109283746522',
      ifscCode: 'BARB0BARAMA',
      bankName: 'Bank of Baroda - Haveli'
    },
    assignedFieldOfficerId: 'USR-FLD-201',
    assignedFieldOfficerName: 'Vikram Shinde',
    milestones: [],
    verificationHistory: [
      {
        id: 'VR-04',
        applicationId: 'APP-2025-0078',
        stage: 'FIELD_VERIFICATION',
        officerId: 'USR-FLD-201',
        officerName: 'Vikram Shinde',
        officerRole: 'FIELD_OFFICER',
        status: 'RECOMMENDED',
        decisionDate: '2025-07-28T15:30:00Z',
        remarks: 'Inspected micro-processing workshop. 10 women members active. Ground machinery requirement validated. Recommended for district approval.',
        geoCoordinates: '18.5204° N, 73.8567° E'
      }
    ],
    updatedAt: '2025-07-28T15:30:00Z'
  },
  {
    id: 'APP-2025-0062',
    applicationNumber: 'MH-PUN-AGR-2025-0062',
    schemeId: 'SCH-AGR-001',
    schemeTitle: 'Krishi Sinchayee Micro-Irrigation Modernization Grant',
    schemeCode: 'PM-KSY-2025',
    beneficiaryId: 'USR-BEN-999',
    beneficiaryName: 'Kishore Jagtap',
    beneficiaryCategory: 'MARGINAL_FARMER',
    beneficiaryPhone: '+91 9422019283',
    district: 'Pune',
    state: 'Maharashtra',
    requestedAmount: 70000,
    sanctionedAmount: 70000,
    submissionDate: '2025-06-11T11:00:00Z',
    currentStatus: 'DISBURSEMENT_IN_PROGRESS',
    currentStage: 'DISBURSEMENT',
    eligibilityScore: 78,
    priorityBand: 'FAST_TRACK',
    scoreBreakdown: {
      incomeScore: 24,
      categoryScore: 25,
      landScore: 15,
      documentationScore: 8,
      ageScore: 6,
      total: 78
    },
    isHighValue: false,
    documents: [
      { type: 'Aadhaar Card', fileName: 'aadhaar_kj.pdf', url: '#', verified: true },
      { type: 'Land Revenue 7/12 Extract', fileName: '712_jagtap.pdf', url: '#', verified: true }
    ],
    bankDetails: {
      accountNumber: '445566778899',
      ifscCode: 'MAHB0000122',
      bankName: 'Bank of Maharashtra'
    },
    sanctionOrderNumber: 'SO/2025/MH-PUN/AGR-5541',
    sanctionDate: '2025-06-25T11:00:00Z',
    milestones: [
      {
        id: 'MLS-0062-1',
        applicationId: 'APP-2025-0062',
        milestoneNumber: 1,
        title: 'Stage 1: Advance for Equipment Procurement',
        description: '30% upfront grant release.',
        amount: 21000,
        percentage: 30,
        dueDate: '2025-07-02T00:00:00Z',
        status: 'DISBURSED',
        proofDocument: 'invoice_adv.pdf',
        disbursedDate: '2025-07-05T12:00:00Z',
        transactionRef: 'DBT-TR-2025-110291',
        utrNumber: 'MAHB29104812'
      },
      {
        id: 'MLS-0062-2',
        applicationId: 'APP-2025-0062',
        milestoneNumber: 2,
        title: 'Stage 2: Ground Installation & Field Verification',
        description: '40% milestone grant upon physical installation.',
        amount: 28000,
        percentage: 40,
        dueDate: '2025-08-10T00:00:00Z',
        status: 'NON_COMPLIANT',
        remarks: 'Overdue by 34 days! No installation photo or field report submitted. Automated non-compliance flag raised. Second tranche withheld.'
      },
      {
        id: 'MLS-0062-3',
        applicationId: 'APP-2025-0062',
        milestoneNumber: 3,
        title: 'Stage 3: Final Inspection & Utilization Certificate',
        description: '30% final retention upon certified UC.',
        amount: 21000,
        percentage: 30,
        dueDate: '2025-10-15T00:00:00Z',
        status: 'SCHEDULED'
      }
    ],
    verificationHistory: [
      {
        id: 'VR-05',
        applicationId: 'APP-2025-0062',
        stage: 'FINANCE_APPROVAL',
        officerId: 'USR-FIN-301',
        officerName: 'Suresh Narayanan',
        officerRole: 'FINANCE_APPROVER',
        status: 'APPROVED',
        decisionDate: '2025-06-25T11:00:00Z',
        remarks: 'Sanctioned and advance released.'
      }
    ],
    updatedAt: '2025-08-15T00:00:00Z'
  },
  {
    id: 'APP-2025-0118',
    applicationNumber: 'MH-PUN-SLR-2025-0118',
    schemeId: 'SCH-SLR-002',
    schemeTitle: 'Surya Ghar Rooftop Solar & Green Energy Subsidy',
    schemeCode: 'SURYA-GHAR-2025',
    beneficiaryId: 'USR-BEN-998',
    beneficiaryName: 'Bhavna K. Solanki',
    beneficiaryCategory: 'SC_ST_GENERAL',
    beneficiaryPhone: '+91 9711223344',
    district: 'Pune',
    state: 'Maharashtra',
    requestedAmount: 110000,
    submissionDate: '2025-09-08T16:00:00Z',
    currentStatus: 'ESCALATED_SCRUTINY',
    currentStage: 'DISTRICT_REVIEW',
    eligibilityScore: 58,
    priorityBand: 'SCRUTINY_FLAGGED',
    scoreBreakdown: {
      incomeScore: 16,
      categoryScore: 15,
      landScore: 10,
      documentationScore: 10,
      ageScore: 7,
      total: 58
    },
    isHighValue: true,
    documents: [
      { type: 'Aadhaar Card', fileName: 'bhavna_aadhaar.pdf', url: '#', verified: true },
      { type: 'Electricity Bill of Last 3 Months', fileName: 'elec_bill.pdf', url: '#', verified: true }
    ],
    bankDetails: {
      accountNumber: '998877665544',
      ifscCode: 'HDFC0000128',
      bankName: 'HDFC Bank Ltd'
    },
    assignedFieldOfficerId: 'USR-FLD-201',
    assignedFieldOfficerName: 'Vikram Shinde',
    milestones: [],
    verificationHistory: [
      {
        id: 'VR-06',
        applicationId: 'APP-2025-0118',
        stage: 'FIELD_VERIFICATION',
        officerId: 'USR-FLD-201',
        officerName: 'Vikram Shinde',
        officerRole: 'FIELD_OFFICER',
        status: 'ESCALATED',
        decisionDate: '2025-09-10T14:00:00Z',
        remarks: 'High grant value exceeding ₹1 Lakh threshold and eligibility score is borderline (58). Discom technical feasibility document missing. Escalated to District Officer for additional scrutiny.'
      }
    ],
    updatedAt: '2025-09-10T14:00:00Z'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'AUD-901',
    timestamp: '2025-09-12T10:45:00Z',
    actorId: 'USR-BEN-401',
    actorName: 'Ramesh Balaji Patil',
    actorRole: 'BENEFICIARY',
    action: 'UPLOAD_MILESTONE_PROOF',
    targetType: 'APPLICATION',
    targetId: 'APP-2025-0091',
    previousState: 'SCHEDULED',
    newState: 'PENDING_VERIFICATION',
    remarks: 'Uploaded geotagged photo proof for Stage 2 micro-irrigation installation.',
    ipAddress: '157.34.18.92'
  },
  {
    id: 'AUD-902',
    timestamp: '2025-09-10T14:00:00Z',
    actorId: 'USR-FLD-201',
    actorName: 'Vikram Shinde',
    actorRole: 'FIELD_OFFICER',
    action: 'ESCALATE_APPLICATION',
    targetType: 'APPLICATION',
    targetId: 'APP-2025-0118',
    previousState: 'UNDER_FIELD_VERIFICATION',
    newState: 'ESCALATED_SCRUTINY',
    remarks: 'Flagged high value grant (₹1.10L) with score 58 for District Collectorate review.',
    ipAddress: '10.240.11.45'
  },
  {
    id: 'AUD-903',
    timestamp: '2025-08-25T16:30:00Z',
    actorId: 'USR-FIN-301',
    actorName: 'Suresh Narayanan',
    actorRole: 'FINANCE_APPROVER',
    action: 'EXECUTE_DBT_DISBURSEMENT',
    targetType: 'DISBURSEMENT',
    targetId: 'MLS-0091-1',
    previousState: 'VERIFIED',
    newState: 'DISBURSED',
    remarks: 'Disbursed Tranche 1 (₹19,500) via PFMS Gateway Ref DBT-TR-2025-998124.',
    ipAddress: '10.240.55.12'
  },
  {
    id: 'AUD-904',
    timestamp: '2025-08-20T14:15:00Z',
    actorId: 'USR-FIN-301',
    actorName: 'Suresh Narayanan',
    actorRole: 'FINANCE_APPROVER',
    action: 'ISSUE_SANCTION_ORDER',
    targetType: 'APPLICATION',
    targetId: 'APP-2025-0091',
    previousState: 'DISTRICT_APPROVED',
    newState: 'SANCTIONED',
    remarks: 'Sanction order SO/2025/MH-PUN/AGR-8812 registered with 3 staged milestones.',
    ipAddress: '10.240.55.12'
  },
  {
    id: 'AUD-905',
    timestamp: '2025-08-18T16:00:00Z',
    actorId: 'USR-DST-101',
    actorName: 'Anjali Deshmukh, IAS',
    actorRole: 'DISTRICT_OFFICER',
    action: 'APPROVE_DISTRICT_STAGE',
    targetType: 'APPLICATION',
    targetId: 'APP-2025-0091',
    previousState: 'UNDER_DISTRICT_REVIEW',
    newState: 'DISTRICT_APPROVED',
    remarks: 'Approved after district quota audit. Recommended for finance sanction.',
    ipAddress: '10.240.12.80'
  }
];
