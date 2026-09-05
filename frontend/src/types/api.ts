export type UserRole =
  | 'ADMIN'
  | 'BENEFICIARY'
  | 'FIELD_OFFICER'
  | 'DISTRICT_OFFICER'
  | 'FINANCE_APPROVER';

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  role: UserRole;
}

export interface RegisterResponse {
  message: string;
  role: string;
}

export interface SchemeRequest {
  name: string;
  grantAmount: number;
  criteriaSchema: string;
}

export interface SchemeResponse {
  id: number;
  name: string;
  grantAmount: number;
  criteriaSchema: string;
}

export interface BeneficiaryRequest {
  name: string;
  email: string;
  phone: string;
  category: string;
  region: string;
}

export interface BeneficiaryResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  category: string;
  region: string;
}

export type ApplicationStage =
  | 'ELIGIBILITY_CHECK'
  | 'FIELD_REVIEW'
  | 'DISTRICT_REVIEW'
  | 'FINANCE_REVIEW'
  | 'APPROVED_FUNDS_DISBURSED'
  | 'REJECTED'
  | 'REVERIFY_REQUESTED';

export type VerificationDecision = 'APPROVE' | 'REJECT' | 'REVERIFY';

export interface ApplicationRequest {
  beneficiaryId?: number; // Required for ADMIN creation, optional for BENEFICIARY
  schemeId: number;
  purpose: string;
  requestedAmount: number;
}

export interface ApplicationResponse {
  id: number;
  beneficiaryId: number;
  beneficiaryName: string;
  schemeId: number;
  schemeName: string;
  purpose: string;
  requestedAmount: number;
  eligibilityScore: number;
  eligibilityResult: string;
  status: string;
  currentStage: ApplicationStage;
  currentLevel: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationRequest {
  decision: VerificationDecision;
  remarks?: string;
}

export interface AnalyticsSummary {
  totalApplications: number;
  rejected: number;
  fullyApproved: number;
  totalFundsDisbursed: number;
  activeInPipeline: number;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string>;
}
