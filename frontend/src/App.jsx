import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';

// 10 Role & Functional Dashboard Modules
import DashboardView from './components/DashboardView'; // Module 1: Admin Executive Operations Ledger
import BeneficiaryPortalView from './components/BeneficiaryPortalView'; // Module 2: Dedicated Beneficiary Portal
import SchemesMasterView from './components/SchemesMasterView'; // Module 3: Schemes Master & Beneficiary Registry
import VerificationPipelineView from './components/VerificationPipelineView'; // Module 4: Multi-Level Verification Pipeline
import StagedDisbursementView from './components/StagedDisbursementView'; // Module 5: Staged Disbursements (PFMS/DBT)
import ComplianceDashboardView from './components/ComplianceDashboardView'; // Module 6: Compliance Dashboard
import BeneficiaryUserDashboardView from './components/BeneficiaryUserDashboardView'; // Module 7: Beneficiary User Dashboard
import FieldOfficerDashboardView from './components/FieldOfficerDashboardView'; // Module 8: Field Officer Dashboard
import DistrictOfficerDashboardView from './components/DistrictOfficerDashboardView'; // Module 9: District Officer Dashboard
import FinanceApproverDashboardView from './components/FinanceApproverDashboardView'; // Module 10: Finance Approver Dashboard

import AuditLogsView from './components/AuditLogsView';
import ReportCenterView from './components/ReportCenterView';
import AIAssistantWidget from './components/AIAssistantWidget';

import { analyticsAPI, schemeAPI, beneficiaryAPI, applicationAPI, auditAPI, disbursementAPI, authAPI } from './services/api';

function MainAppContent({ currentUser, onLogout, onSwitchRole, users }) {
  const [metrics, setMetrics] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [applications, setApplications] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [complianceRecords, setComplianceRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const [mRes, sRes, bRes, aRes, dRes, logRes] = await Promise.all([
        analyticsAPI.getDashboardMetrics().catch(() => ({ data: null })),
        schemeAPI.getAll().catch(() => ({ data: [] })),
        beneficiaryAPI.getAll().catch(() => ({ data: [] })),
        applicationAPI.getAll().catch(() => ({ data: [] })),
        disbursementAPI.getAll().catch(() => ({ data: [] })),
        auditAPI.getAuditLogs().catch(() => ({ data: [] })),
      ]);

      if (mRes.data) setMetrics(mRes.data);
      if (Array.isArray(sRes.data)) setSchemes(sRes.data);
      if (Array.isArray(bRes.data)) setBeneficiaries(bRes.data);
      if (Array.isArray(aRes.data)) setApplications(aRes.data);
      if (Array.isArray(dRes.data)) setDisbursements(dRes.data);
      if (Array.isArray(logRes.data)) setAuditLogs(logRes.data);

      // Build compliance records from staged disbursements if needed
      if (Array.isArray(dRes.data)) {
        const mappedCompliance = dRes.data.map((d, index) => ({
          id: d.id || (index + 1),
          applicationNo: d.application?.applicationNo || `APP-2026-${d.applicationId || 'REF'}`,
          beneficiaryName: d.application?.beneficiary?.fullName || 'Registered Beneficiary',
          schemeName: d.application?.scheme?.name || 'Central Grant Scheme',
          milestoneName: d.milestoneName || `Milestone Phase ${d.stageNumber}`,
          stageNumber: d.stageNumber || 1,
          scheduledAmount: d.scheduledAmount || 0,
          disbursedAmount: d.disbursedAmount || 0,
          dueDate: d.dueDate || '2026-03-31',
          status: d.status === 'FUND_RELEASED' ? 'COMPLIANT' :
                  d.status === 'PROOF_SUBMITTED' ? 'UNDER_REVIEW' :
                  d.status === 'NON_COMPLIANT' ? 'NON_COMPLIANT' : 'PENDING',
          flagged: d.status === 'NON_COMPLIANT',
          flagReason: d.proofRemarks || null,
          proofDocumentUrl: d.complianceProofUrl || null,
          proofSubmittedDate: d.disbursedAt || null,
          history: [
            { date: '2026-01-15', action: 'Milestone Created', by: 'System Engine' }
          ]
        }));
        setComplianceRecords(mappedCompliance);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load database records:', err);
      setError('Unable to load database records. Please check backend connection.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Determine role default home route
  const getRoleDefaultRoute = (role) => {
    if (role === 'BENEFICIARY') return '/beneficiary';
    if (role === 'FIELD_OFFICER') return '/field';
    if (role === 'DISTRICT_OFFICER') return '/district';
    if (role === 'FINANCE_APPROVER') return '/finance';
    return '/dashboard';
  };

  // State handlers for instant UI synchronization & DB re-fetch
  const handleRegisterBeneficiary = async () => {
    await loadData();
  };

  const handleUpdateBeneficiary = async () => {
    await loadData();
  };

  const handleCreateScheme = async () => {
    await loadData();
  };

  const handleUpdateScheme = async () => {
    await loadData();
  };

  const handleDeleteScheme = async () => {
    await loadData();
  };

  const handleUpdateApplicationStage = async () => {
    await loadData();
  };

  const handleSubmitApplication = async () => {
    await loadData();
  };

  const handleReleaseFund = async (milestoneId) => {
    try {
      await disbursementAPI.releaseFund(milestoneId, currentUser?.id);
      await loadData();
    } catch (err) {
      console.warn('Fund release handled, refreshing database:', err);
      await loadData();
    }
  };

  const handleResolveComplianceFlag = async () => {
    await loadData();
  };

  const userRole = currentUser?.role || 'ADMIN';

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-sans flex flex-col">
      <Navbar
        activeUser={currentUser}
        onLogout={onLogout}
        onSwitchRole={onSwitchRole}
        dbUsers={users}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center justify-between">
            <span><strong>Database Alert:</strong> {error}</span>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-red-800 text-white font-bold rounded-lg hover:bg-red-900"
            >
              Retry Database Fetch
            </button>
          </div>
        )}

        <Routes>
          {/* ========================================================= */}
          {/* 1. SYSTEM ADMINISTRATOR DASHBOARD & ADMIN MODULES         */}
          {/* ========================================================= */}
          <Route 
            path="/dashboard" 
            element={
              userRole === 'ADMIN' ? (
                <DashboardView 
                  metrics={metrics} 
                  schemes={schemes} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  complianceRecords={complianceRecords} 
                  loading={loading} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* Module 2: Beneficiary Portal */}
          <Route 
            path="/beneficiary-portal" 
            element={
              ['ADMIN', 'FIELD_OFFICER', 'DISTRICT_OFFICER'].includes(userRole) ? (
                <BeneficiaryPortalView 
                  beneficiaries={beneficiaries} 
                  applications={applications} 
                  currentUser={currentUser} 
                  onRefresh={loadData} 
                  onRegisterBeneficiary={handleRegisterBeneficiary} 
                  onUpdateBeneficiary={handleUpdateBeneficiary} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* Module 3: Schemes Master & Beneficiary Registry */}
          <Route 
            path="/schemes-master" 
            element={
              ['ADMIN', 'DISTRICT_OFFICER'].includes(userRole) ? (
                <SchemesMasterView 
                  schemes={schemes} 
                  beneficiaries={beneficiaries} 
                  onRefresh={loadData} 
                  onCreateScheme={handleCreateScheme} 
                  onUpdateScheme={handleUpdateScheme} 
                  onDeleteScheme={handleDeleteScheme} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* Module 4: Multi-Level Verification Pipeline */}
          <Route 
            path="/verification-pipeline" 
            element={
              ['ADMIN', 'FIELD_OFFICER', 'DISTRICT_OFFICER', 'FINANCE_APPROVER'].includes(userRole) ? (
                <VerificationPipelineView 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  currentUser={currentUser} 
                  onRefresh={loadData} 
                  onUpdateApplicationStage={handleUpdateApplicationStage} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* Module 5: Staged Disbursements (PFMS/DBT) */}
          <Route 
            path="/disbursements" 
            element={
              ['ADMIN', 'FINANCE_APPROVER'].includes(userRole) ? (
                <StagedDisbursementView 
                  disbursements={disbursements} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  currentUser={currentUser} 
                  onRefresh={loadData} 
                  onReleaseFund={handleReleaseFund} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* Module 6: Compliance Dashboard */}
          <Route 
            path="/compliance" 
            element={
              ['ADMIN', 'FINANCE_APPROVER', 'DISTRICT_OFFICER'].includes(userRole) ? (
                <ComplianceDashboardView 
                  complianceRecords={complianceRecords} 
                  onRefresh={loadData} 
                  onResolveFlag={handleResolveComplianceFlag} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* ========================================================= */}
          {/* 7. BENEFICIARY USER DASHBOARD                             */}
          {/* ========================================================= */}
          <Route 
            path="/beneficiary" 
            element={
              userRole === 'BENEFICIARY' ? (
                <BeneficiaryUserDashboardView 
                  currentTab="dashboard" 
                  currentUser={currentUser} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  applications={applications} 
                  disbursements={disbursements} 
                  complianceRecords={complianceRecords} 
                  onRefresh={loadData} 
                  onSubmitApplication={handleSubmitApplication} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/beneficiary/profile" 
            element={
              userRole === 'BENEFICIARY' ? (
                <BeneficiaryUserDashboardView 
                  currentTab="profile" 
                  currentUser={currentUser} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  applications={applications} 
                  disbursements={disbursements} 
                  complianceRecords={complianceRecords} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/beneficiary/schemes" 
            element={
              userRole === 'BENEFICIARY' ? (
                <BeneficiaryUserDashboardView 
                  currentTab="schemes" 
                  currentUser={currentUser} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  applications={applications} 
                  disbursements={disbursements} 
                  complianceRecords={complianceRecords} 
                  onRefresh={loadData} 
                  onSubmitApplication={handleSubmitApplication} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/beneficiary/applications" 
            element={
              userRole === 'BENEFICIARY' ? (
                <BeneficiaryUserDashboardView 
                  currentTab="applications" 
                  currentUser={currentUser} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  applications={applications} 
                  disbursements={disbursements} 
                  complianceRecords={complianceRecords} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/beneficiary/documents" 
            element={
              userRole === 'BENEFICIARY' ? (
                <BeneficiaryUserDashboardView 
                  currentTab="documents" 
                  currentUser={currentUser} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  applications={applications} 
                  disbursements={disbursements} 
                  complianceRecords={complianceRecords} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/beneficiary/disbursements" 
            element={
              userRole === 'BENEFICIARY' ? (
                <BeneficiaryUserDashboardView 
                  currentTab="disbursements" 
                  currentUser={currentUser} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  applications={applications} 
                  disbursements={disbursements} 
                  complianceRecords={complianceRecords} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/beneficiary/compliance" 
            element={
              userRole === 'BENEFICIARY' ? (
                <BeneficiaryUserDashboardView 
                  currentTab="compliance" 
                  currentUser={currentUser} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  applications={applications} 
                  disbursements={disbursements} 
                  complianceRecords={complianceRecords} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* ========================================================= */}
          {/* 8. FIELD OFFICER DASHBOARD                                */}
          {/* ========================================================= */}
          <Route 
            path="/field" 
            element={
              userRole === 'FIELD_OFFICER' ? (
                <FieldOfficerDashboardView 
                  currentTab="operations" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                  onUpdateApplicationStage={handleUpdateApplicationStage} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/field/verification-queue" 
            element={
              userRole === 'FIELD_OFFICER' ? (
                <FieldOfficerDashboardView 
                  currentTab="queue" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                  onUpdateApplicationStage={handleUpdateApplicationStage} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/field/beneficiaries" 
            element={
              userRole === 'FIELD_OFFICER' ? (
                <FieldOfficerDashboardView 
                  currentTab="beneficiaries" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/field/ground-reports" 
            element={
              userRole === 'FIELD_OFFICER' ? (
                <FieldOfficerDashboardView 
                  currentTab="reports" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/field/history" 
            element={
              userRole === 'FIELD_OFFICER' ? (
                <FieldOfficerDashboardView 
                  currentTab="history" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* ========================================================= */}
          {/* 9. DISTRICT OFFICER DASHBOARD                             */}
          {/* ========================================================= */}
          <Route 
            path="/district" 
            element={
              userRole === 'DISTRICT_OFFICER' ? (
                <DistrictOfficerDashboardView 
                  currentTab="dashboard" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                  onUpdateApplicationStage={handleUpdateApplicationStage} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/district/sanction-queue" 
            element={
              userRole === 'DISTRICT_OFFICER' ? (
                <DistrictOfficerDashboardView 
                  currentTab="review_queue" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                  onUpdateApplicationStage={handleUpdateApplicationStage} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/district/schemes" 
            element={
              userRole === 'DISTRICT_OFFICER' ? (
                <DistrictOfficerDashboardView 
                  currentTab="applications" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/district/history" 
            element={
              userRole === 'DISTRICT_OFFICER' ? (
                <DistrictOfficerDashboardView 
                  currentTab="history" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/district/reports" 
            element={
              userRole === 'DISTRICT_OFFICER' ? (
                <DistrictOfficerDashboardView 
                  currentTab="reports" 
                  currentUser={currentUser} 
                  applications={applications} 
                  beneficiaries={beneficiaries} 
                  schemes={schemes} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* ========================================================= */}
          {/* 10. FINANCE APPROVER DASHBOARD                            */}
          {/* ========================================================= */}
          <Route 
            path="/finance" 
            element={
              userRole === 'FINANCE_APPROVER' ? (
                <FinanceApproverDashboardView 
                  currentTab="dashboard" 
                  currentUser={currentUser} 
                  applications={applications} 
                  disbursements={disbursements} 
                  schemes={schemes} 
                  beneficiaries={beneficiaries} 
                  onRefresh={loadData} 
                  onUpdateApplicationStage={handleUpdateApplicationStage} 
                  onReleaseFund={handleReleaseFund} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/finance/approval-queue" 
            element={
              userRole === 'FINANCE_APPROVER' ? (
                <FinanceApproverDashboardView 
                  currentTab="approval_queue" 
                  currentUser={currentUser} 
                  applications={applications} 
                  disbursements={disbursements} 
                  schemes={schemes} 
                  beneficiaries={beneficiaries} 
                  onRefresh={loadData} 
                  onUpdateApplicationStage={handleUpdateApplicationStage} 
                  onReleaseFund={handleReleaseFund} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/finance/disbursements" 
            element={
              userRole === 'FINANCE_APPROVER' ? (
                <FinanceApproverDashboardView 
                  currentTab="disbursements" 
                  currentUser={currentUser} 
                  applications={applications} 
                  disbursements={disbursements} 
                  schemes={schemes} 
                  beneficiaries={beneficiaries} 
                  onRefresh={loadData} 
                  onReleaseFund={handleReleaseFund} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/finance/milestones" 
            element={
              userRole === 'FINANCE_APPROVER' ? (
                <FinanceApproverDashboardView 
                  currentTab="milestones" 
                  currentUser={currentUser} 
                  applications={applications} 
                  disbursements={disbursements} 
                  schemes={schemes} 
                  beneficiaries={beneficiaries} 
                  onRefresh={loadData} 
                  onReleaseFund={handleReleaseFund} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/finance/payment-dbt" 
            element={
              userRole === 'FINANCE_APPROVER' ? (
                <FinanceApproverDashboardView 
                  currentTab="payment_dbt" 
                  currentUser={currentUser} 
                  applications={applications} 
                  disbursements={disbursements} 
                  schemes={schemes} 
                  beneficiaries={beneficiaries} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/finance/reports" 
            element={
              userRole === 'FINANCE_APPROVER' ? (
                <FinanceApproverDashboardView 
                  currentTab="reports" 
                  currentUser={currentUser} 
                  applications={applications} 
                  disbursements={disbursements} 
                  schemes={schemes} 
                  beneficiaries={beneficiaries} 
                  onRefresh={loadData} 
                />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* Secondary Admin Audit Logs & Reports */}
          <Route 
            path="/audit-logs" 
            element={
              userRole === 'ADMIN' ? (
                <AuditLogsView auditLogs={auditLogs} />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />
          <Route 
            path="/reports" 
            element={
              ['ADMIN', 'DISTRICT_OFFICER', 'FINANCE_APPROVER'].includes(userRole) ? (
                <ReportCenterView metrics={metrics} schemes={schemes} applications={applications} />
              ) : (
                <Navigate to={getRoleDefaultRoute(userRole)} replace />
              )
            } 
          />

          {/* Root & Catch-all redirects */}
          <Route path="/" element={<Navigate to={getRoleDefaultRoute(userRole)} replace />} />
          <Route path="*" element={<Navigate to={getRoleDefaultRoute(userRole)} replace />} />
        </Routes>
      </main>

      {/* Sovereign AI Sahayak Floating Copilot Widget */}
      <AIAssistantWidget 
        currentUser={currentUser} 
        schemes={schemes} 
        applications={applications} 
        beneficiaries={beneficiaries} 
      />

      <footer className="bg-[#00142f] text-xs text-[#7a91b7] py-4 text-center mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Digital Subsidy & Grant Administration Platform &copy; 2026 Govt of India Official DBT Registry</span>
          <span className="font-mono text-emerald-400">Database Single Source of Truth &bull; Spring Boot + MySQL + React 19</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('gov_subsidy_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [dbUsers, setDbUsers] = useState([]);

  useEffect(() => {
    authAPI.getUsers().then(res => {
      if (Array.isArray(res.data)) {
        setDbUsers(res.data);
      }
    }).catch(err => {
      console.warn('Could not fetch database users list:', err.message);
    });
  }, []);

  const handleLoginSuccess = (user, token) => {
    localStorage.setItem('gov_subsidy_user', JSON.stringify(user));
    localStorage.setItem('gov_subsidy_token', token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('gov_subsidy_user');
    localStorage.removeItem('gov_subsidy_token');
    setCurrentUser(null);
  };

  const handleSwitchRole = (newUser) => {
    localStorage.setItem('gov_subsidy_user', JSON.stringify(newUser));
    setCurrentUser(newUser);
  };

  return (
    <BrowserRouter>
      {currentUser ? (
        <MainAppContent 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onSwitchRole={handleSwitchRole} 
          users={dbUsers}
        />
      ) : (
        <Routes>
          <Route path="/login" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/signup" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
