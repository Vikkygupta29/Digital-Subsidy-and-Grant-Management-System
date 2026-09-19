import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import { 
  initialUsers, 
  initialSchemes, 
  initialApplications, 
  initialAuditLogs, 
  User, 
  Scheme, 
  Application, 
  AuditLog, 
  Milestone, 
  VerificationRecord 
} from './data';
import { calculateEligibilityScore } from './scoring';

export const apiRouter = Router();

// In-Memory mutable data store initialized with realistic demo data
let users: User[] = [...initialUsers];
let schemes: Scheme[] = [...initialSchemes];
let applications: Application[] = [...initialApplications];
let auditLogs: AuditLog[] = [...initialAuditLogs];

const JWT_SECRET = process.env.JWT_SECRET || 'subsidy-grant-portal-super-secret-key-2025';

// Helper to log audit actions
function recordAudit(
  actor: { id: string; name: string; role: string },
  action: string,
  targetType: AuditLog['targetType'],
  targetId: string,
  remarks: string,
  previousState?: string,
  newState?: string,
  ipAddress = '127.0.0.1'
) {
  const log: AuditLog = {
    id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    targetType,
    targetId,
    previousState,
    newState,
    remarks,
    ipAddress
  };
  auditLogs.unshift(log);
  // Keep recent 1000 logs
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(0, 1000);
  }
}

// Authentication Middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: User['role'];
    name: string;
    district: string;
  };
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// Role Authorization Middleware
function requireRoles(...roles: User['role'][]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this operation' });
    }
    next();
  };
}

// ----------------------------------------------------
// AUTH CONTROLLER ENDPOINTS
// ----------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      district: user.district
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  const { passwordHash, ...userWithoutPassword } = user;
  res.json({
    token,
    user: userWithoutPassword
  });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone, district, state, category, annualIncome, landHoldingAcres, bankAccount, ifscCode, bankName, aadhaarNumber } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const newUser: User = {
    id: `USR-BEN-${Date.now().toString().slice(-4)}`,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'BENEFICIARY',
    district: district || 'Pune',
    state: state || 'Maharashtra',
    phone: phone || '+91 9000000000',
    beneficiaryProfile: {
      aadhaarNumber: aadhaarNumber || 'XXXX-XXXX-9999',
      category: category || 'SMALL_FARMER',
      annualIncome: Number(annualIncome) || 120000,
      landHoldingAcres: Number(landHoldingAcres) || 1.5,
      bankAccount: bankAccount || '123456789012',
      ifscCode: ifscCode || 'SBIN0001111',
      bankName: bankName || 'State Bank of India',
      panNumber: 'ABCDE1111Z',
      age: 38,
      gender: 'MALE'
    }
  };

  users.push(newUser);

  const token = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      district: newUser.district
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  recordAudit(
    { id: newUser.id, name: newUser.name, role: newUser.role },
    'BENEFICIARY_REGISTRATION',
    'USER',
    newUser.id,
    'New beneficiary registered onto the national subsidy platform.'
  );

  const { passwordHash, ...userWithoutPassword } = newUser;
  res.status(201).json({ token, user: userWithoutPassword });
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Demo accounts for quick evaluation
apiRouter.get('/auth/demo-users', (_req: Request, res: Response) => {
  const demoList = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    district: u.district,
    department: u.department,
    defaultPassword: 'Gov@1234'
  }));
  res.json(demoList);
});

// ----------------------------------------------------
// SCHEME CONTROLLER ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/schemes', (_req: Request, res: Response) => {
  res.json(schemes);
});

apiRouter.get('/schemes/:id', (req: Request, res: Response) => {
  const scheme = schemes.find(s => s.id === req.params.id || s.code === req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: 'Scheme not found' });
  }
  res.json(scheme);
});

// Admin creates a new scheme
apiRouter.post('/schemes', authMiddleware, requireRoles('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  if (!body.title || !body.code || !body.department || !body.totalBudget) {
    return res.status(400).json({ error: 'Required scheme fields missing' });
  }

  const newScheme: Scheme = {
    id: `SCH-${Date.now().toString(36).toUpperCase()}`,
    code: body.code.toUpperCase(),
    title: body.title,
    department: body.department,
    description: body.description || '',
    totalBudget: Number(body.totalBudget),
    allocatedAmount: 0,
    disbursedAmount: 0,
    status: 'ACTIVE',
    startDate: body.startDate || new Date().toISOString().split('T')[0],
    endDate: body.endDate || '2026-03-31',
    grantAmountMin: Number(body.grantAmountMin) || 10000,
    grantAmountMax: Number(body.grantAmountMax) || 100000,
    eligibilityCriteria: {
      maxIncome: Number(body.eligibilityCriteria?.maxIncome) || 300000,
      eligibleCategories: body.eligibilityCriteria?.eligibleCategories || ['SMALL_FARMER', 'MARGINAL_FARMER', 'SC_ST_GENERAL'],
      minAge: Number(body.eligibilityCriteria?.minAge) || 18,
      maxAge: Number(body.eligibilityCriteria?.maxAge) || 70,
      maxLandHoldingAcres: Number(body.eligibilityCriteria?.maxLandHoldingAcres) || 5.0,
      requiredDocuments: body.eligibilityCriteria?.requiredDocuments || ['Aadhaar Card', 'Bank Passbook']
    },
    stagesConfig: body.stagesConfig || [
      { stageNumber: 1, name: 'Stage 1: Advance Tranche', percentage: 40, daysFromPrevious: 7, requiredProof: 'Procurement Agreement' },
      { stageNumber: 2, name: 'Stage 2: Implementation & UC', percentage: 60, daysFromPrevious: 45, requiredProof: 'Utilization Certificate & Photos' }
    ],
    regionalBudgets: body.regionalBudgets || [
      { district: 'Pune', allocated: Math.floor(body.totalBudget * 0.4), spent: 0 },
      { district: 'Nagpur', allocated: Math.floor(body.totalBudget * 0.3), spent: 0 },
      { district: 'Nashik', allocated: Math.floor(body.totalBudget * 0.3), spent: 0 }
    ]
  };

  schemes.push(newScheme);

  recordAudit(
    req.user!,
    'CREATE_SCHEME',
    'SCHEME',
    newScheme.id,
    `New subsidy scheme ${newScheme.title} (${newScheme.code}) launched with budget ₹${newScheme.totalBudget.toLocaleString()}.`
  );

  res.status(201).json(newScheme);
});

// Admin edits scheme
apiRouter.put('/schemes/:id', authMiddleware, requireRoles('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const index = schemes.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Scheme not found' });
  }

  schemes[index] = {
    ...schemes[index],
    ...req.body,
    id: schemes[index].id // immutable id
  };

  recordAudit(
    req.user!,
    'UPDATE_SCHEME',
    'SCHEME',
    schemes[index].id,
    `Scheme configuration updated for ${schemes[index].code}.`
  );

  res.json(schemes[index]);
});

// Instant Eligibility Pre-Check
apiRouter.post('/schemes/:id/check-eligibility', (req: Request, res: Response) => {
  const scheme = schemes.find(s => s.id === req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: 'Scheme not found' });
  }

  const { category, annualIncome, landHoldingAcres, age, requestedAmount, documentsCount } = req.body;
  const mockProfile: any = {
    category: category || 'SMALL_FARMER',
    annualIncome: Number(annualIncome) || 120000,
    landHoldingAcres: Number(landHoldingAcres) || 2.0,
    age: Number(age) || 35
  };

  const result = calculateEligibilityScore(
    mockProfile,
    scheme,
    Number(requestedAmount) || scheme.grantAmountMin,
    Number(documentsCount) || scheme.eligibilityCriteria.requiredDocuments.length
  );

  res.json(result);
});

// ----------------------------------------------------
// APPLICATION CONTROLLER ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/applications', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { status, schemeId, district, priorityBand, stage } = req.query;
  const currentUser = req.user!;

  let filtered = [...applications];

  // RBAC filters
  if (currentUser.role === 'BENEFICIARY') {
    filtered = filtered.filter(a => a.beneficiaryId === currentUser.id);
  } else if (currentUser.role === 'FIELD_OFFICER') {
    // Field officer sees tasks in their assigned district
    filtered = filtered.filter(a => a.district.toLowerCase() === currentUser.district.toLowerCase());
  } else if (currentUser.role === 'DISTRICT_OFFICER') {
    // District officer sees applications in their district
    filtered = filtered.filter(a => a.district.toLowerCase() === currentUser.district.toLowerCase());
  }

  // Query parameter filters
  if (status) {
    filtered = filtered.filter(a => a.currentStatus === status);
  }
  if (schemeId) {
    filtered = filtered.filter(a => a.schemeId === schemeId);
  }
  if (district) {
    filtered = filtered.filter(a => a.district.toLowerCase() === (district as string).toLowerCase());
  }
  if (priorityBand) {
    filtered = filtered.filter(a => a.priorityBand === priorityBand);
  }
  if (stage) {
    filtered = filtered.filter(a => a.currentStage === stage);
  }

  res.json(filtered);
});

apiRouter.get('/applications/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const application = applications.find(a => a.id === req.params.id || a.applicationNumber === req.params.id);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  // Beneficiaries can only see their own application
  if (req.user?.role === 'BENEFICIARY' && application.beneficiaryId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(application);
});

// Submit Application (Beneficiary)
apiRouter.post('/applications', authMiddleware, requireRoles('BENEFICIARY', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { schemeId, requestedAmount, documents, bankDetails, profileOverride } = req.body;
  const currentUser = users.find(u => u.id === req.user?.id);

  if (!currentUser) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  const scheme = schemes.find(s => s.id === schemeId);
  if (!scheme) {
    return res.status(404).json({ error: 'Scheme not found' });
  }

  const activeProfile = profileOverride || currentUser.beneficiaryProfile || {
    category: 'SMALL_FARMER',
    annualIncome: 120000,
    landHoldingAcres: 2.0,
    age: 38
  };

  const amount = Number(requestedAmount) || scheme.grantAmountMin;
  const docsList = documents || scheme.eligibilityCriteria.requiredDocuments.map(d => ({
    type: d,
    fileName: `${d.toLowerCase().replace(/\s+/g, '_')}.pdf`,
    url: '#',
    verified: false
  }));

  // Automated Eligibility Scoring Engine calculation
  const scoreResult = calculateEligibilityScore(
    activeProfile,
    scheme,
    amount,
    docsList.length
  );

  const appId = `APP-2025-0${applications.length + 100}`;
  const appNumber = `MH-${currentUser.district.slice(0, 3).toUpperCase()}-${scheme.code.slice(0, 3)}-2025-0${applications.length + 100}`;

  const assignedFieldOfficer = users.find(u => u.role === 'FIELD_OFFICER' && u.district.toLowerCase() === currentUser.district.toLowerCase()) || users.find(u => u.role === 'FIELD_OFFICER');

  const newApp: Application = {
    id: appId,
    applicationNumber: appNumber,
    schemeId: scheme.id,
    schemeTitle: scheme.title,
    schemeCode: scheme.code,
    beneficiaryId: currentUser.id,
    beneficiaryName: currentUser.name,
    beneficiaryCategory: activeProfile.category,
    beneficiaryPhone: currentUser.phone,
    district: currentUser.district,
    state: currentUser.state,
    requestedAmount: amount,
    submissionDate: new Date().toISOString(),
    currentStatus: 'UNDER_FIELD_VERIFICATION',
    currentStage: 'FIELD_VERIFICATION',
    eligibilityScore: scoreResult.totalScore,
    priorityBand: scoreResult.priorityBand,
    scoreBreakdown: scoreResult.scoreBreakdown,
    isHighValue: scoreResult.isHighValue,
    documents: docsList,
    bankDetails: bankDetails || {
      accountNumber: currentUser.beneficiaryProfile?.bankAccount || '987654321098',
      ifscCode: currentUser.beneficiaryProfile?.ifscCode || 'SBIN0001234',
      bankName: currentUser.beneficiaryProfile?.bankName || 'State Bank of India'
    },
    assignedFieldOfficerId: assignedFieldOfficer?.id,
    assignedFieldOfficerName: assignedFieldOfficer?.name,
    milestones: [],
    verificationHistory: [],
    updatedAt: new Date().toISOString()
  };

  applications.unshift(newApp);

  recordAudit(
    req.user!,
    'SUBMIT_APPLICATION',
    'APPLICATION',
    newApp.id,
    `Application ${newApp.applicationNumber} submitted for ${scheme.title}. Automated score: ${newApp.eligibilityScore}/100 (${newApp.priorityBand}). Routed to Level 1 Field Verification.`
  );

  res.status(201).json(newApp);
});

// ----------------------------------------------------
// WORKFLOW & VERIFICATION CONTROLLERS
// ----------------------------------------------------

// 1. Field Officer Verification
apiRouter.post('/applications/:id/field-verify', authMiddleware, requireRoles('FIELD_OFFICER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const app = applications.find(a => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const { action, remarks, geoCoordinates, checklist } = req.body;
  // action can be: 'RECOMMEND_APPROVE' | 'RECOMMEND_REJECT' | 'REQUEST_REVERIFICATION' | 'ESCALATE'
  if (!action || !remarks) {
    return res.status(400).json({ error: 'Verification action and inspection remarks are required' });
  }

  const officer = req.user!;
  let previousState = app.currentStatus;
  let newStatus: Application['currentStatus'] = app.currentStatus;
  let newStage: Application['currentStage'] = app.currentStage;
  let verificationStatus: VerificationRecord['status'] = 'RECOMMENDED';

  if (action === 'RECOMMEND_APPROVE') {
    newStatus = 'UNDER_DISTRICT_REVIEW';
    newStage = 'DISTRICT_REVIEW';
    verificationStatus = 'RECOMMENDED';
    app.documents.forEach(d => { d.verified = true; });
  } else if (action === 'RECOMMEND_REJECT') {
    newStatus = 'REJECTED';
    newStage = 'CLOSED';
    verificationStatus = 'REJECTED';
    app.rejectionReason = remarks;
  } else if (action === 'REQUEST_REVERIFICATION') {
    newStatus = 'RE_VERIFICATION_REQUIRED';
    verificationStatus = 'RE_VERIFICATION_REQUESTED';
  } else if (action === 'ESCALATE') {
    newStatus = 'ESCALATED_SCRUTINY';
    newStage = 'DISTRICT_REVIEW';
    verificationStatus = 'ESCALATED';
  }

  const record: VerificationRecord = {
    id: `VR-${Date.now().toString(36).toUpperCase()}`,
    applicationId: app.id,
    stage: 'FIELD_VERIFICATION',
    officerId: officer.id,
    officerName: officer.name,
    officerRole: officer.role,
    status: verificationStatus,
    decisionDate: new Date().toISOString(),
    remarks,
    geoCoordinates: geoCoordinates || '18.5204° N, 73.8567° E',
    findings: checklist || { groundAssetVerified: true, identityMatched: true, landBoundaryValid: true }
  };

  app.verificationHistory.push(record);
  app.currentStatus = newStatus;
  app.currentStage = newStage;
  app.updatedAt = new Date().toISOString();

  recordAudit(
    officer,
    'FIELD_VERIFICATION_ACTION',
    'APPLICATION',
    app.id,
    `Field Officer ${officer.name} completed ground inspection. Decision: ${action}. Remarks: ${remarks}`,
    previousState,
    newStatus
  );

  res.json({ message: 'Field verification recorded successfully', application: app });
});

// 2. District Officer Review
apiRouter.post('/applications/:id/district-review', authMiddleware, requireRoles('DISTRICT_OFFICER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const app = applications.find(a => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const { action, remarks } = req.body;
  // action: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'SEND_BACK'
  if (!action || !remarks) {
    return res.status(400).json({ error: 'Action and remarks are required' });
  }

  const officer = req.user!;
  let previousState = app.currentStatus;
  let newStatus: Application['currentStatus'] = app.currentStatus;
  let newStage: Application['currentStage'] = app.currentStage;
  let verificationStatus: VerificationRecord['status'] = 'APPROVED';

  if (action === 'APPROVE') {
    newStatus = 'DISTRICT_APPROVED';
    newStage = 'FINANCE_APPROVAL';
    verificationStatus = 'APPROVED';
  } else if (action === 'REJECT') {
    newStatus = 'REJECTED';
    newStage = 'CLOSED';
    verificationStatus = 'REJECTED';
    app.rejectionReason = remarks;
  } else if (action === 'ESCALATE') {
    newStatus = 'ESCALATED_SCRUTINY';
    verificationStatus = 'ESCALATED';
  } else if (action === 'SEND_BACK') {
    newStatus = 'UNDER_FIELD_VERIFICATION';
    newStage = 'FIELD_VERIFICATION';
    verificationStatus = 'RE_VERIFICATION_REQUESTED';
  }

  const record: VerificationRecord = {
    id: `VR-${Date.now().toString(36).toUpperCase()}`,
    applicationId: app.id,
    stage: 'DISTRICT_REVIEW',
    officerId: officer.id,
    officerName: officer.name,
    officerRole: officer.role,
    status: verificationStatus,
    decisionDate: new Date().toISOString(),
    remarks
  };

  app.verificationHistory.push(record);
  app.currentStatus = newStatus;
  app.currentStage = newStage;
  app.updatedAt = new Date().toISOString();

  recordAudit(
    officer,
    'DISTRICT_OFFICER_REVIEW',
    'APPLICATION',
    app.id,
    `District Officer ${officer.name} evaluated application. Action: ${action}. Remarks: ${remarks}`,
    previousState,
    newStatus
  );

  res.json({ message: 'District review recorded', application: app });
});

// Universal Officer Action Endpoint (APPROVE, REAPPLY, REJECT)
apiRouter.post('/applications/:id/officer-action', authMiddleware, requireRoles('FIELD_OFFICER', 'DISTRICT_OFFICER', 'FINANCE_APPROVER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const app = applications.find(a => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const { action, remarks } = req.body;
  // action: 'APPROVE' | 'REAPPLY' | 'REJECT'
  if (!action || !['APPROVE', 'REAPPLY', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Valid action (APPROVE, REAPPLY, or REJECT) is required' });
  }

  const officer = req.user!;
  const prevStatus = app.currentStatus;
  let newStatus: Application['currentStatus'] = app.currentStatus;
  let newStage: Application['currentStage'] = app.currentStage;
  let verificationStatus: VerificationRecord['status'] = 'APPROVED';

  if (action === 'APPROVE') {
    if (officer.role === 'FIELD_OFFICER') {
      newStatus = 'UNDER_DISTRICT_REVIEW';
      newStage = 'DISTRICT_REVIEW';
      verificationStatus = 'RECOMMENDED';
      app.documents.forEach(d => { d.verified = true; });
    } else if (officer.role === 'DISTRICT_OFFICER') {
      newStatus = 'DISTRICT_APPROVED';
      newStage = 'FINANCE_APPROVAL';
      verificationStatus = 'APPROVED';
    } else {
      // Finance or Admin approval
      newStatus = 'SANCTIONED';
      newStage = 'DISBURSEMENT';
      verificationStatus = 'APPROVED';
      app.sanctionedAmount = app.requestedAmount;
      app.sanctionDate = new Date().toISOString();
    }
    app.reapplyRemarks = undefined;
  } else if (action === 'REAPPLY') {
    newStatus = 'REAPPLY_REQUESTED';
    verificationStatus = 'RE_VERIFICATION_REQUESTED';
    app.reapplyRemarks = remarks || 'Officer requested applicant to reapply with updated details or clearer documents.';
  } else if (action === 'REJECT') {
    newStatus = 'REJECTED';
    newStage = 'CLOSED';
    verificationStatus = 'REJECTED';
    app.rejectionReason = remarks || 'Application rejected by verification authority.';
  }

  const record: VerificationRecord = {
    id: `VR-${Date.now().toString(36).toUpperCase()}`,
    applicationId: app.id,
    stage: officer.role === 'FIELD_OFFICER' ? 'FIELD_VERIFICATION' : 'DISTRICT_REVIEW',
    officerId: officer.id,
    officerName: officer.name,
    officerRole: officer.role,
    status: verificationStatus,
    decisionDate: new Date().toISOString(),
    remarks: remarks || `Officer decided to ${action}.`
  };

  app.verificationHistory.push(record);
  app.currentStatus = newStatus;
  app.currentStage = newStage;
  app.updatedAt = new Date().toISOString();

  recordAudit(
    officer,
    `OFFICER_${action}`,
    'APPLICATION',
    app.id,
    `Officer ${officer.name} executed ${action}. Remarks: ${remarks || 'None'}`,
    prevStatus,
    newStatus
  );

  res.json({ message: `Application status updated to ${newStatus}`, application: app });
});

// Beneficiary Re-submission (When application is in REAPPLY_REQUESTED status)
apiRouter.post('/applications/:id/resubmit', authMiddleware, requireRoles('BENEFICIARY', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const app = applications.find(a => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const { requestedAmount, documents, remarks } = req.body;
  const prevStatus = app.currentStatus;

  if (requestedAmount) {
    app.requestedAmount = Number(requestedAmount);
  }
  if (documents && Array.isArray(documents)) {
    app.documents = documents;
  }

  app.currentStatus = 'UNDER_FIELD_VERIFICATION';
  app.currentStage = 'FIELD_VERIFICATION';
  app.reapplyRemarks = undefined;
  app.updatedAt = new Date().toISOString();

  const record: VerificationRecord = {
    id: `VR-${Date.now().toString(36).toUpperCase()}`,
    applicationId: app.id,
    stage: 'FIELD_VERIFICATION',
    officerId: req.user!.id,
    officerName: req.user!.name,
    officerRole: 'BENEFICIARY',
    status: 'RECOMMENDED',
    decisionDate: new Date().toISOString(),
    remarks: remarks || 'Applicant revised application and resubmitted for verification.'
  };
  app.verificationHistory.push(record);

  recordAudit(
    req.user!,
    'RESUBMIT_APPLICATION',
    'APPLICATION',
    app.id,
    `Applicant resubmitted application with updated documentation.`,
    prevStatus,
    'UNDER_FIELD_VERIFICATION'
  );

  res.json({ message: 'Application resubmitted successfully', application: app });
});

// 3. Finance Sanction & Staged Disbursement Generation
apiRouter.post('/applications/:id/finance-sanction', authMiddleware, requireRoles('FINANCE_APPROVER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const app = applications.find(a => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const { sanctionedAmount, remarks } = req.body;
  const officer = req.user!;
  const scheme = schemes.find(s => s.id === app.schemeId);

  if (!scheme) {
    return res.status(404).json({ error: 'Scheme data not found' });
  }

  const finalAmount = Number(sanctionedAmount) || app.requestedAmount;
  const sanctionNum = `SO/2025/MH-${app.district.slice(0, 3).toUpperCase()}/${scheme.code.slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;

  app.sanctionedAmount = finalAmount;
  app.sanctionOrderNumber = sanctionNum;
  app.sanctionDate = new Date().toISOString();
  app.currentStatus = 'DISBURSEMENT_IN_PROGRESS';
  app.currentStage = 'DISBURSEMENT';

  // Generate automated compliance milestones based on scheme configuration
  const milestones: Milestone[] = scheme.stagesConfig.map((stage, idx) => {
    const stageAmount = Math.round((finalAmount * stage.percentage) / 100);
    const dueDate = new Date(Date.now() + stage.daysFromPrevious * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: `MLS-${app.id.replace('APP-', '')}-${stage.stageNumber}`,
      applicationId: app.id,
      milestoneNumber: stage.stageNumber,
      title: stage.name,
      description: `${stage.percentage}% staged fund tranche upon compliance proof: ${stage.requiredProof}`,
      amount: stageAmount,
      percentage: stage.percentage,
      dueDate,
      status: idx === 0 ? 'SCHEDULED' : 'SCHEDULED'
    };
  });

  app.milestones = milestones;

  // Update scheme allocation budget
  scheme.allocatedAmount += finalAmount;
  const regBudget = scheme.regionalBudgets.find(r => r.district.toLowerCase() === app.district.toLowerCase());
  if (regBudget) {
    regBudget.spent += 0; // updated upon actual disbursement
  }

  const record: VerificationRecord = {
    id: `VR-${Date.now().toString(36).toUpperCase()}`,
    applicationId: app.id,
    stage: 'FINANCE_APPROVAL',
    officerId: officer.id,
    officerName: officer.name,
    officerRole: officer.role,
    status: 'APPROVED',
    decisionDate: new Date().toISOString(),
    remarks: remarks || `Sanction Order ${sanctionNum} issued for ₹${finalAmount.toLocaleString()}. 3-stage disbursement schedule initialized.`
  };
  app.verificationHistory.push(record);
  app.updatedAt = new Date().toISOString();

  recordAudit(
    officer,
    'SANCTION_APPLICATION',
    'APPLICATION',
    app.id,
    `Finance sanction granted. Sanction Order: ${sanctionNum}. Amount: ₹${finalAmount.toLocaleString()}. Generated ${milestones.length} staged milestones.`,
    'DISTRICT_APPROVED',
    'DISBURSEMENT_IN_PROGRESS'
  );

  res.json({ message: 'Sanction order issued and milestone schedule initialized', application: app });
});

// ----------------------------------------------------
// STAGED DISBURSEMENT & MILESTONES CONTROLLER
// ----------------------------------------------------
apiRouter.get('/disbursements', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { status, district, schemeId } = req.query;
  const user = req.user!;

  let allMilestones: Array<Milestone & {
    applicationNumber: string;
    beneficiaryName: string;
    beneficiaryCategory: string;
    schemeTitle: string;
    district: string;
    bankDetails: Application['bankDetails'];
  }> = [];

  applications.forEach(app => {
    // RBAC check
    if (user.role === 'BENEFICIARY' && app.beneficiaryId !== user.id) return;
    if ((user.role === 'FIELD_OFFICER' || user.role === 'DISTRICT_OFFICER') && app.district.toLowerCase() !== user.district.toLowerCase()) return;

    app.milestones.forEach(m => {
      allMilestones.push({
        ...m,
        applicationNumber: app.applicationNumber,
        beneficiaryName: app.beneficiaryName,
        beneficiaryCategory: app.beneficiaryCategory,
        schemeTitle: app.schemeTitle,
        district: app.district,
        bankDetails: app.bankDetails
      });
    });
  });

  if (status) {
    allMilestones = allMilestones.filter(m => m.status === status);
  }
  if (district) {
    allMilestones = allMilestones.filter(m => m.district.toLowerCase() === (district as string).toLowerCase());
  }

  res.json(allMilestones);
});

// Beneficiary submits milestone compliance proof (e.g. UC or photo)
apiRouter.post('/disbursements/:milestoneId/upload-proof', authMiddleware, requireRoles('BENEFICIARY', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { proofDocument, remarks } = req.body;
  const milestoneId = req.params.milestoneId;

  let targetApp: Application | undefined;
  let targetMilestone: Milestone | undefined;

  for (const app of applications) {
    const found = app.milestones.find(m => m.id === milestoneId);
    if (found) {
      targetApp = app;
      targetMilestone = found;
      break;
    }
  }

  if (!targetApp || !targetMilestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const prevStatus = targetMilestone.status;
  targetMilestone.proofDocument = proofDocument || 'utilization_proof_document.pdf';
  targetMilestone.proofSubmittedDate = new Date().toISOString();
  targetMilestone.status = 'PENDING_VERIFICATION';
  targetMilestone.remarks = remarks || 'Beneficiary uploaded progress documentation.';
  targetApp.updatedAt = new Date().toISOString();

  recordAudit(
    req.user!,
    'UPLOAD_MILESTONE_PROOF',
    'DISBURSEMENT',
    targetMilestone.id,
    `Proof document uploaded for Milestone #${targetMilestone.milestoneNumber} (${targetMilestone.title}) on application ${targetApp.applicationNumber}.`,
    prevStatus,
    'PENDING_VERIFICATION'
  );

  res.json({ message: 'Proof submitted for verification', milestone: targetMilestone });
});

// Field Officer or Finance verifies milestone proof
apiRouter.post('/disbursements/:milestoneId/verify-proof', authMiddleware, requireRoles('FIELD_OFFICER', 'FINANCE_APPROVER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { decision, remarks } = req.body; // 'VERIFIED' | 'REJECTED'
  const milestoneId = req.params.milestoneId;

  let targetApp: Application | undefined;
  let targetMilestone: Milestone | undefined;

  for (const app of applications) {
    const found = app.milestones.find(m => m.id === milestoneId);
    if (found) {
      targetApp = app;
      targetMilestone = found;
      break;
    }
  }

  if (!targetApp || !targetMilestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const prevStatus = targetMilestone.status;
  if (decision === 'VERIFIED') {
    targetMilestone.status = 'VERIFIED';
    targetMilestone.verifiedBy = `${req.user!.name} (${req.user!.role})`;
    targetMilestone.verificationDate = new Date().toISOString();
    targetMilestone.remarks = remarks || 'Compliance milestone documentation verified and endorsed.';
  } else {
    targetMilestone.status = 'NON_COMPLIANT';
    targetMilestone.remarks = remarks || 'Document failed compliance criteria. Resubmission required.';
  }

  targetApp.updatedAt = new Date().toISOString();

  recordAudit(
    req.user!,
    'VERIFY_MILESTONE',
    'DISBURSEMENT',
    targetMilestone.id,
    `Officer ${req.user!.name} evaluated milestone #${targetMilestone.milestoneNumber}. Status: ${targetMilestone.status}. Remarks: ${remarks}`,
    prevStatus,
    targetMilestone.status
  );

  res.json({ message: 'Milestone compliance evaluated', milestone: targetMilestone });
});

// Finance Approver executes DBT tranche release
apiRouter.post('/disbursements/:milestoneId/release-fund', authMiddleware, requireRoles('FINANCE_APPROVER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const milestoneId = req.params.milestoneId;
  const { paymentGatewayRemarks } = req.body;

  let targetApp: Application | undefined;
  let targetMilestone: Milestone | undefined;

  for (const app of applications) {
    const found = app.milestones.find(m => m.id === milestoneId);
    if (found) {
      targetApp = app;
      targetMilestone = found;
      break;
    }
  }

  if (!targetApp || !targetMilestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const scheme = schemes.find(s => s.id === targetApp?.schemeId);
  const prevStatus = targetMilestone.status;

  const txnRef = `DBT-TR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const utrNum = `SBIN${Math.floor(100000000000 + Math.random() * 900000000000)}`;

  targetMilestone.status = 'DISBURSED';
  targetMilestone.disbursedDate = new Date().toISOString();
  targetMilestone.transactionRef = txnRef;
  targetMilestone.utrNumber = utrNum;
  targetMilestone.remarks = paymentGatewayRemarks || 'Direct Benefit Transfer (DBT) executed via PFMS Public Treasury Gateway.';

  // Update scheme disbursed total
  if (scheme) {
    scheme.disbursedAmount += targetMilestone.amount;
    const reg = scheme.regionalBudgets.find(r => r.district.toLowerCase() === targetApp?.district.toLowerCase());
    if (reg) {
      reg.spent += targetMilestone.amount;
    }
  }

  // Check if all milestones are disbursed
  const allDisbursed = targetApp.milestones.every(m => m.status === 'DISBURSED');
  if (allDisbursed) {
    targetApp.currentStatus = 'COMPLETED';
    targetApp.currentStage = 'CLOSED';
  }

  targetApp.updatedAt = new Date().toISOString();

  recordAudit(
    req.user!,
    'EXECUTE_DBT_DISBURSEMENT',
    'DISBURSEMENT',
    targetMilestone.id,
    `Direct Benefit Transfer of ₹${targetMilestone.amount.toLocaleString()} disbursed to account ${targetApp.bankDetails.accountNumber} (${targetApp.bankDetails.bankName}). Ref: ${txnRef}, UTR: ${utrNum}.`,
    prevStatus,
    'DISBURSED'
  );

  res.json({
    message: 'Fund disbursed successfully through DBT treasury gateway',
    milestone: targetMilestone,
    transactionRef: txnRef,
    utrNumber: utrNum
  });
});

// Flag Non-Compliance Automation (Scheduler / Manual trigger)
apiRouter.post('/disbursements/auto-flag-noncompliant', authMiddleware, requireRoles('ADMIN', 'FINANCE_APPROVER'), (req: AuthenticatedRequest, res: Response) => {
  const now = new Date().getTime();
  let flaggedCount = 0;

  applications.forEach(app => {
    app.milestones.forEach(m => {
      const dueTime = new Date(m.dueDate).getTime();
      if ((m.status === 'SCHEDULED' || m.status === 'PENDING_VERIFICATION') && dueTime < now) {
        m.status = 'NON_COMPLIANT';
        flaggedCount++;
        m.remarks = 'Milestone overdue! Compliance timeline exceeded without acceptable verification.';
      }
    });
  });

  res.json({ message: `Automated compliance check run. Flagged ${flaggedCount} overdue milestones.`, flaggedCount });
});

// ----------------------------------------------------
// ANALYTICS & FUND UTILIZATION CONTROLLERS
// ----------------------------------------------------
apiRouter.get('/analytics/dashboard', authMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  const totalBudget = schemes.reduce((sum, s) => sum + s.totalBudget, 0);
  const totalAllocated = schemes.reduce((sum, s) => sum + s.allocatedAmount, 0);
  const totalDisbursed = schemes.reduce((sum, s) => sum + s.disbursedAmount, 0);
  const totalRemaining = totalBudget - totalDisbursed;

  const totalApplications = applications.length;
  const pendingVerification = applications.filter(a => a.currentStatus === 'UNDER_FIELD_VERIFICATION' || a.currentStatus === 'UNDER_DISTRICT_REVIEW').length;
  const sanctionedCount = applications.filter(a => a.currentStatus === 'SANCTIONED' || a.currentStatus === 'DISBURSEMENT_IN_PROGRESS' || a.currentStatus === 'COMPLETED').length;
  const rejectedCount = applications.filter(a => a.currentStatus === 'REJECTED').length;

  // Staged Milestone Stats
  let totalMilestones = 0;
  let disbursedMilestones = 0;
  let pendingMilestones = 0;
  let nonCompliantMilestones = 0;

  applications.forEach(a => {
    a.milestones.forEach(m => {
      totalMilestones++;
      if (m.status === 'DISBURSED') disbursedMilestones++;
      if (m.status === 'SCHEDULED' || m.status === 'PENDING_VERIFICATION') pendingMilestones++;
      if (m.status === 'NON_COMPLIANT' || m.status === 'OVERDUE') nonCompliantMilestones++;
    });
  });

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  applications.forEach(a => {
    categoryCounts[a.beneficiaryCategory] = (categoryCounts[a.beneficiaryCategory] || 0) + 1;
  });

  // District wise fund release
  const districtPerformance: Record<string, { allocated: number; disbursed: number; beneficiaries: number }> = {};
  schemes.forEach(s => {
    s.regionalBudgets.forEach(r => {
      if (!districtPerformance[r.district]) {
        districtPerformance[r.district] = { allocated: 0, disbursed: 0, beneficiaries: 0 };
      }
      districtPerformance[r.district].allocated += r.allocated;
      districtPerformance[r.district].disbursed += r.spent;
    });
  });

  applications.forEach(a => {
    if (districtPerformance[a.district]) {
      districtPerformance[a.district].beneficiaries += 1;
    }
  });

  res.json({
    metrics: {
      totalBudget,
      totalAllocated,
      totalDisbursed,
      totalRemaining,
      utilizationRate: totalBudget > 0 ? Math.round((totalDisbursed / totalBudget) * 100) : 0,
      totalApplications,
      pendingVerification,
      sanctionedCount,
      rejectedCount,
      totalMilestones,
      disbursedMilestones,
      pendingMilestones,
      nonCompliantMilestones,
      averageTurnaroundDays: 4.8
    },
    schemesSummary: schemes.map(s => ({
      id: s.id,
      code: s.code,
      title: s.title,
      department: s.department,
      totalBudget: s.totalBudget,
      allocatedAmount: s.allocatedAmount,
      disbursedAmount: s.disbursedAmount,
      utilizationPercent: Math.round((s.disbursedAmount / s.totalBudget) * 100)
    })),
    districtPerformance: Object.entries(districtPerformance).map(([district, data]) => ({
      district,
      ...data,
      utilizationPercent: data.allocated > 0 ? Math.round((data.disbursed / data.allocated) * 100) : 0
    })),
    categoryDistribution: Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count
    }))
  });
});

// ----------------------------------------------------
// AUDIT LOG CONTROLLER ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/audit-logs', authMiddleware, requireRoles('ADMIN', 'FINANCE_APPROVER', 'DISTRICT_OFFICER'), (req: Request, res: Response) => {
  const { action, actorRole, targetType } = req.query;

  let filtered = [...auditLogs];
  if (action) {
    filtered = filtered.filter(l => l.action.toLowerCase().includes((action as string).toLowerCase()));
  }
  if (actorRole) {
    filtered = filtered.filter(l => l.actorRole === actorRole);
  }
  if (targetType) {
    filtered = filtered.filter(l => l.targetType === targetType);
  }

  res.json(filtered);
});

// ----------------------------------------------------
// TREASURY SIMULATION API (Integration for treasury system)
// ----------------------------------------------------
apiRouter.get('/treasury/health', (_req: Request, res: Response) => {
  res.json({
    gateway: 'Public Financial Management System (PFMS) / e-Kuber RBI Direct Interface',
    status: 'ONLINE',
    pingMs: 42,
    authenticatedAgency: 'STATE_DBT_NODAL_AGENCY_MH',
    currentTreasuryBalance: 1450000000,
    dailyBatchDisbursementLimit: 50000000
  });
});

// ----------------------------------------------------
// AI ASSISTANT FOR BENEFICIARY (Gemini 3.8 Flash Powered)
// ----------------------------------------------------
apiRouter.post('/assistant/chat', async (req: Request, res: Response) => {
  const { message, history, citizenContext } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Build context summarizing active schemes and DBT rules
  const schemesSummary = schemes.map(s => `
- Scheme: "${s.title}" (Code: ${s.code}, Dept: ${s.department})
  Max Subsidy: ₹${s.grantAmountMax?.toLocaleString()}, Min: ₹${s.grantAmountMin?.toLocaleString()}
  Eligible Categories: ${s.eligibilityCriteria?.eligibleCategories?.join(', ')}
  Income Limit: up to ₹${s.eligibilityCriteria?.maxIncome?.toLocaleString()}
  Max Land: ${s.eligibilityCriteria?.maxLandHoldingAcres} acres
  Required Documents: ${s.eligibilityCriteria?.requiredDocuments?.join(', ')}
  Description: ${s.description}
  Stages/Milestones: ${s.stagesConfig?.map(st => `${st.name} (${st.percentage}%)`).join(' -> ')}
`).join('\n');

  const systemInstruction = `You are "JanLabh Sahayak" (जनलाभ सहायक), an empathetic, expert AI Assistant for Indian Government Direct Benefit Transfer (DBT) and subsidy schemes.
Your primary role is to assist citizens, farmers, artisans, and small business beneficiaries in understanding government schemes, determining their eligibility, preparing mandatory documents (Aadhaar, 7/12 Land Records, Bank Passbooks, Quotations), navigating the application process, and tracking verification & disbursement stages.

AVAILABLE GOVERNMENT SCHEMES ON JANLABH:
${schemesSummary}

CITIZEN CONTEXT (if available):
${citizenContext ? JSON.stringify(citizenContext, null, 2) : 'General Citizen / Guest'}

INSTRUCTIONS & GUIDELINES:
1. Always be polite, encouraging, clear, and easy to understand (simple English, or Hindi/Hinglish if asked). Avoid dense administrative jargon without explaining it.
2. If asked about eligibility, calculate against the citizen's category, land holding, and income based on the official scheme criteria provided.
3. Clearly mention the mandatory documents:
   - Aadhaar Card (UIDAI e-KYC)
   - 7/12 Land Revenue Record / RoR extract (for agricultural subsidies)
   - Bank Passbook / Cancelled Cheque (for Aadhaar-linked PFMS bank DBT transfers)
   - Vendor Quotation / Proforma Invoice (from authorized dealers)
4. Explain the multi-tier verification process:
   - Level 1: Field Officer inspection (geo-tagged photos, physical check)
   - Level 2: District Officer administrative scrutiny & quota sanction
   - Level 3: Finance / Treasury PFMS fund release directly to their bank account in stages/milestones.
5. If an application was flagged for "Reapplication", explain what corrections are needed (e.g., re-uploading clearer 7/12 extract or valid quotation) and encourage resubmission.
6. Provide concise, structured bullet points with bold highlights for readability.`;

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Prepare conversation contents
      const formattedContents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          if (item.sender === 'user') {
            formattedContents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'assistant') {
            formattedContents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }
      }
      formattedContents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      const replyText = response.text || 'I am here to assist you with JanLabh schemes, documents, and DBT status.';
      return res.json({
        reply: replyText,
        source: 'gemini-3.8-flash'
      });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to smart rule-based assistant:', err.message);
    }
  }

  // Graceful rule-based intelligent fallback if API key is not yet set or rate-limited
  const lower = message.toLowerCase();
  let fallbackReply = '';

  if (lower.includes('solar') || lower.includes('surya') || lower.includes('electricity') || lower.includes('roof')) {
    fallbackReply = `☀️ **Surya Ghar Rooftop Solar & Green Energy Subsidy:**
- **Grant Amount:** Up to **₹1,20,000** (capital subsidy up to 5kW system).
- **Eligibility:** Domestic households and agricultural pump owners with electricity connections.
- **Mandatory Documents:**
  1. **Aadhaar Card** (Linked with DBT Bank Account)
  2. **Electricity Bill** (Last 3 months receipt)
  3. **Rooftop Ownership / Land Proof** (7/12 extract or municipal tax receipt)
  4. **Authorized Solar Vendor Quotation**
- **Disbursement:** 50% on vendor equipment order, 50% after grid synchronization inspection.`;
  } else if (lower.includes('irrigation') || lower.includes('drip') || lower.includes('farmer') || lower.includes('krishi') || lower.includes('sinchayee')) {
    fallbackReply = `🌾 **PM Krishi Sinchayee Micro-Irrigation Modernization Grant:**
- **Grant Amount:** **₹25,000 to ₹75,000** (55% to 70% subsidy on equipment costs).
- **Eligibility:** Small and marginal farmers with land holding under **5.0 acres** and annual income under **₹2,50,000**.
- **Required Documents:**
  1. **Aadhaar Card**
  2. **Land Record (7/12 Extract / RoR)** showing survey / Gat number
  3. **Bank Passbook** (Aadhaar NPCI linked)
  4. **Approved Vendor Quotation** with GSTIN
- **Verification:** Ground inspection by Agricultural Field Officer (Vikram Shinde) with GPS coordinates.`;
  } else if (lower.includes('document') || lower.includes('aadhaar') || lower.includes('7/12') || lower.includes('upload') || lower.includes('proof')) {
    fallbackReply = `📄 **Mandatory Documents for Subsidy Applications:**
1. **Aadhaar Card:** Mandatory for UIDAI biometric identity and e-KYC authentication.
2. **7/12 Land Record Extract / RoR:** Verifies agricultural ownership, boundary survey, and land ceiling limit.
3. **Bank Passbook / Cancelled Cheque:** Required for direct credit via RBI e-Kuber / PFMS DBT gateway.
4. **Vendor Proforma Invoice / Quotation:** Must specify technical specifications and approved dealer rates.
*Tip: You can use DigiLocker sync on JanLabh for instant automated verification.*`;
  } else if (lower.includes('reapply') || lower.includes('rejected') || lower.includes('resubmit') || lower.includes('status')) {
    fallbackReply = `🔄 **Application Correction & Resubmission Guide:**
- If an officer flagged your application as **Reapply Requested**, check the specific remarks in **My Applications**.
- Common reasons: unclear 7/12 land extract, missing vendor seal on quotation, or mismatched bank account name.
- Click the **"Edit & Resubmit"** button on your dashboard to attach updated proofs; your application will be re-routed immediately to the officer queue.`;
  } else if (lower.includes('officer') || lower.includes('desk') || lower.includes('verification') || lower.includes('login')) {
    fallbackReply = `🏛️ **Department Officer Verification Roles:**
- **Field Officer (Level 1):** Conducts on-site verification, physical asset checks, and geo-tagged coordinates.
- **District Officer (Level 2):** Collectorate scrutiny, regional quota checks, and formal sanction approval.
- **Finance Officer (Level 3):** Reserves treasury funds and triggers phased DBT tranche releases.
*Officers can switch using the top-right Persona Switcher or sign in via the Department Officer Login tab.*`;
  } else {
    fallbackReply = `Namaste! 🙏 I am **JanLabh Sahayak**, your AI Assistant.
I can help you with:
- **Checking Eligibility:** Find which subsidies (Solar, Micro-Irrigation, Horticulture, Dairy) you qualify for.
- **Document Requirements:** Guidance on Aadhaar e-KYC, 7/12 Land Records, Bank passbooks, and Vendor quotes.
- **Application Assistance:** Step-by-step help filling out your grant dossier.
- **Tracking & Correction:** Understanding officer reviews and resubmitting flagged dossiers.

What would you like assistance with today?`;
  }

  return res.json({
    reply: fallbackReply,
    source: 'rule-engine'
  });
});

