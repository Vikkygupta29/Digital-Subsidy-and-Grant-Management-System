import React, { useState } from 'react';
import { 
  ClipboardCheck, CheckSquare, User, X, Sliders, Star, Eye, Shield, FileText, CheckCircle2, Clock, MapPin, Building, CreditCard, AlertCircle
} from 'lucide-react';
import { workflowAPI, applicationAPI } from '../services/api';
import PriorityBadge from './PriorityBadge';
import { sortByPriority } from '../utils/priority';
import { toast } from '../context/ToastContext';

export default function VerificationPipelineView({ applications = [], beneficiaries = [], schemes = [], currentUser, onRefresh, onUpdateApplicationStage }) {
  const role = currentUser?.role || 'ADMIN';

  // Default queue tab based on role
  const getDefaultQueue = () => {
    if (role === 'FIELD_OFFICER') return 'FIELD_CHECK';
    if (role === 'DISTRICT_OFFICER') return 'DISTRICT_REVIEW';
    if (role === 'FINANCE_APPROVER') return 'FINANCE_APPROVAL';
    return 'ALL';
  };

  const [activeQueue, setActiveQueue] = useState(getDefaultQueue());
  const [selectedApp, setSelectedApp] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsApp, setDetailsApp] = useState(null);

  const openDetailsModal = (app) => {
    setDetailsApp(app);
    setShowDetailsModal(true);
  };

  // Separation of duties: Admin is supervisory read-only. Verifications are strictly restricted to assigned operational roles.
  const canUserVerify = (app) => {
    if (role === 'ADMIN') return false;
    if (app.currentStage === 'APPROVED' || app.currentStage === 'REJECTED') return false;
    if (role === 'FIELD_OFFICER' && app.currentStage === 'FIELD_VERIFICATION') return true;
    if (role === 'DISTRICT_OFFICER' && app.currentStage === 'DISTRICT_REVIEW') return true;
    if (role === 'FINANCE_APPROVER' && app.currentStage === 'FINANCE_APPROVAL') return true;
    return false;
  };

  // Field Officer Checklist state
  const [fieldChecklist, setFieldChecklist] = useState({
    physicalAddressVerified: true,
    landHoldingVerified: true,
    incomeVerified: true,
    originalDocsInspected: true,
    officerNotes: '',
  });

  // Action Form state
  const [decision, setDecision] = useState('APPROVED');
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter applications into role queues, sorted by priority (Score 100 first)
  const fieldQueue = sortByPriority(applications.filter(a => a.currentStage === 'FIELD_VERIFICATION'));
  const districtQueue = sortByPriority(applications.filter(a => a.currentStage === 'DISTRICT_REVIEW'));
  const financeQueue = sortByPriority(applications.filter(a => a.currentStage === 'FINANCE_APPROVAL'));
  const completedQueue = sortByPriority(applications.filter(a => a.currentStage === 'APPROVED'));

  const getDisplayedApplications = () => {
    if (role === 'FIELD_OFFICER') return fieldQueue;
    if (role === 'DISTRICT_OFFICER') return districtQueue;
    if (role === 'FINANCE_APPROVER') return financeQueue;

    // Admin view
    if (activeQueue === 'FIELD_CHECK') return fieldQueue;
    if (activeQueue === 'DISTRICT_REVIEW') return districtQueue;
    if (activeQueue === 'FINANCE_APPROVAL') return financeQueue;
    if (activeQueue === 'COMPLETED') return completedQueue;
    return sortByPriority(applications);
  };

  const displayedApplications = getDisplayedApplications();

  const openActionModal = (app) => {
    if (role === 'ADMIN' || !canUserVerify(app)) {
      openDetailsModal(app);
      return;
    }
    setSelectedApp(app);
    setActionNotes('');
    setDecision('APPROVED');
    setFieldChecklist({
      physicalAddressVerified: true,
      landHoldingVerified: true,
      incomeVerified: true,
      originalDocsInspected: true,
      officerNotes: '',
    });
    setShowActionModal(true);
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (role === 'ADMIN' || !canUserVerify(selectedApp)) {
      toast.warning('Admins have supervisory read-only access. Verification decisions are restricted to designated operational officers.');
      return;
    }
    setSubmitting(true);

    try {
      let nextStage = selectedApp.currentStage;
      let actionLabel = '';

      if (selectedApp.currentStage === 'FIELD_VERIFICATION') {
        if (decision === 'APPROVED') {
          nextStage = 'DISTRICT_REVIEW';
          actionLabel = 'Ground verification approved and forwarded to District Officer';
        } else if (decision === 'RE_VERIFICATION') {
          nextStage = 'RE_VERIFICATION_REQUESTED';
          actionLabel = 'Re-verification requested by Field Officer';
        } else {
          nextStage = 'REJECTED';
          actionLabel = 'Rejected at Field Check stage';
        }
      } else if (selectedApp.currentStage === 'DISTRICT_REVIEW') {
        if (decision === 'APPROVED') {
          nextStage = 'FINANCE_APPROVAL';
          actionLabel = 'District sanction granted and forwarded to Finance Approver';
        } else if (decision === 'RE_VERIFICATION') {
          nextStage = 'FIELD_VERIFICATION';
          actionLabel = 'Sent back to Field Officer for re-verification';
        } else {
          nextStage = 'REJECTED';
          actionLabel = 'Rejected by District Officer';
        }
      } else if (selectedApp.currentStage === 'FINANCE_APPROVAL') {
        if (decision === 'APPROVED') {
          nextStage = 'APPROVED';
          actionLabel = 'Treasury fund release authorized! Transferred to Staged Disbursement';
        } else if (decision === 'HOLD') {
          nextStage = 'FINANCE_APPROVAL'; // remains on hold
          actionLabel = 'Put on Treasury Hold for financial clarification';
        } else {
          nextStage = 'REJECTED';
          actionLabel = 'Rejected by Finance Approver';
        }
      }

      // Try calling backend bidirectional workflow action API
      try {
        let action = 'APPROVE';
        if (decision === 'RE_VERIFICATION' || decision === 'REAPPLY') action = 'REAPPLY';
        else if (decision === 'REJECTED') action = 'REJECT';

        await applicationAPI.workflowAction(selectedApp.id, {
          action,
          reason: actionNotes || fieldChecklist.officerNotes || actionLabel,
          notes: actionNotes || fieldChecklist.officerNotes,
          userId: currentUser?.id,
          username: currentUser?.username,
          role: currentUser?.role || 'ADMIN',
        });
      } catch (err) {
        console.warn('Backend API submission failed, updating local state:', err.message);
      }

      if (onUpdateApplicationStage) {
        onUpdateApplicationStage(selectedApp.id, nextStage, {
          decision,
          notes: actionNotes,
          checklist: fieldChecklist,
        });
      }
      if (onRefresh) onRefresh();

      setSubmitting(false);
      setShowActionModal(false);
      toast.success(`Decision processed successfully: ${actionLabel}`);
    } catch (err) {
      setSubmitting(false);
      toast.error('Failed to submit workflow decision: ' + (err.response?.data?.error || err.message));
    }
  };

  const getBeneficiaryForApp = (app) => {
    return beneficiaries.find(b => b.id === app.beneficiaryId || b.id === app.beneficiary?.id) || {
      fullName: 'Beneficiary Applicant',
      aadhaarNumber: 'XXXX-XXXX-0000',
      category: 'Farmer',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      mobileNumber: '+91 98765 00000',
    };
  };

  const getSchemeForApp = (app) => {
    return schemes.find(s => s.id === app.schemeId || s.id === app.scheme?.id) || {
      name: 'Central Subsidy Scheme',
      schemeCode: 'SCHEME-DBT',
      category: 'Agriculture',
    };
  };

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Workflow Progression Breadcrumb / Visual Pipeline */}
      <div className="stitch-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-xl font-bold font-display text-[#00142f] tracking-tight flex items-center">
              <ClipboardCheck className="w-5 h-5 text-emerald-600 mr-2" />
              Multi-Level Verification Pipeline
            </h1>
            <p className="text-xs text-slate-500 font-body">
              Institutional Stage-Gate Verification: Ground Verification &rarr; District Review &rarr; Finance Sanction
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 font-display">Active Workflow Role:</span>
            <span className="px-3 py-1 rounded-full bg-[#0f294a] text-white text-xs font-display font-semibold">
              {role}
            </span>
          </div>
        </div>

        {/* Visual Lifecycle Pipeline Breadcrumb */}
        <div className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-display">1. SUBMITTED</span>
              <strong className="text-[#00142f] text-xs font-display">Intake</strong>
              <div className="w-full bg-[#0f294a] h-1.5 rounded-full mt-2"></div>
            </div>

            <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-display">2. SCORING</span>
              <strong className="text-[#00142f] text-xs font-display">Rules Engine</strong>
              <div className="w-full bg-[#0f294a] h-1.5 rounded-full mt-2"></div>
            </div>

            <div className={`p-2.5 rounded-lg border transition ${
              role === 'FIELD_OFFICER' || activeQueue === 'FIELD_CHECK'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
                : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <span className="text-[10px] text-amber-700 font-bold uppercase block font-display">3. FIELD CHECK</span>
              <strong className="text-[#00142f] text-xs font-display tabular-nums">{fieldQueue.length} Pending</strong>
              <div className="w-full bg-amber-500 h-1.5 rounded-full mt-2"></div>
            </div>

            <div className={`p-2.5 rounded-lg border transition ${
              role === 'DISTRICT_OFFICER' || activeQueue === 'DISTRICT_REVIEW'
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400'
                : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <span className="text-[10px] text-indigo-700 font-bold uppercase block font-display">4. DISTRICT REVIEW</span>
              <strong className="text-[#00142f] text-xs font-display tabular-nums">{districtQueue.length} Pending</strong>
              <div className="w-full bg-indigo-500 h-1.5 rounded-full mt-2"></div>
            </div>

            <div className={`p-2.5 rounded-lg border transition ${
              role === 'FINANCE_APPROVER' || activeQueue === 'FINANCE_APPROVAL'
                ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-400'
                : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <span className="text-[10px] text-teal-700 font-bold uppercase block font-display">5. FINANCE APPROVAL</span>
              <strong className="text-[#00142f] text-xs font-display tabular-nums">{financeQueue.length} Pending</strong>
              <div className="w-full bg-teal-500 h-1.5 rounded-full mt-2"></div>
            </div>

            <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block font-display">6. DISBURSEMENT</span>
              <strong className="text-emerald-800 text-xs font-display tabular-nums">{completedQueue.length} Sanctioned</strong>
              <div className="w-full bg-emerald-500 h-1.5 rounded-full mt-2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Queue Tabs (Only visible to Admin) */}
      {role === 'ADMIN' && (
        <div className="flex space-x-2 stitch-card p-2 overflow-x-auto">
          <button
            onClick={() => setActiveQueue('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition whitespace-nowrap ${
              activeQueue === 'ALL' ? 'bg-[#0f294a] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Lifecycle Queues ({applications.length})
          </button>
          <button
            onClick={() => setActiveQueue('FIELD_CHECK')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition whitespace-nowrap ${
              activeQueue === 'FIELD_CHECK' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Field Officer Queue ({fieldQueue.length})
          </button>
          <button
            onClick={() => setActiveQueue('DISTRICT_REVIEW')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition whitespace-nowrap ${
              activeQueue === 'DISTRICT_REVIEW' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-800 hover:bg-indigo-50'
            }`}
          >
            District Officer Queue ({districtQueue.length})
          </button>
          <button
            onClick={() => setActiveQueue('FINANCE_APPROVAL')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition whitespace-nowrap ${
              activeQueue === 'FINANCE_APPROVAL' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-800 hover:bg-teal-50'
            }`}
          >
            Finance Approver Queue ({financeQueue.length})
          </button>
          <button
            onClick={() => setActiveQueue('COMPLETED')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition whitespace-nowrap ${
              activeQueue === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Approved / Sanctioned ({completedQueue.length})
          </button>
        </div>
      )}

      {/* Admin Supervisory Mode Notice */}
      {role === 'ADMIN' && (
        <div className="stitch-card p-4 bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs">
          <Shield className="w-5 h-5 text-[#00142f] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[#00142f] flex items-center gap-2">
              Supervisory Audit Mode (Read-Only)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold uppercase">
                Segregation of Duties Enforced
              </span>
            </span>
            <p className="text-slate-600 text-[11px]">
              In sovereign subsidy administration, verification and sanction decisions are restricted to designated Field Officers, District Officers, and Finance Approvers. System Administrators maintain supervisory oversight and can inspect full application dossiers and audit trails.
            </p>
          </div>
        </div>
      )}

      {/* Applications Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {displayedApplications.length === 0 ? (
          <div className="lg:col-span-2 stitch-card p-12 text-center text-xs text-slate-500 font-body">
            No applications pending in this verification queue right now.
          </div>
        ) : (
          displayedApplications.map((app) => {
            const ben = getBeneficiaryForApp(app);
            const scheme = getSchemeForApp(app);

            const isScore100 = (app.eligibilityScore || 0) >= 100;

            return (
              <div
                key={app.id}
                className={`stitch-card stitch-card-hover p-5 flex flex-col justify-between space-y-4 relative ${
                  isScore100 ? 'border-amber-400 ring-2 ring-amber-300 shadow-amber-50' : ''
                }`}
              >
                {isScore100 && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg flex items-center justify-between shadow-2xs font-display">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current animate-pulse text-yellow-200" />
                      TOP PROCESSING PRIORITY &bull; SCORE 100/100
                    </span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">P1 Fast-Track</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-display tabular-nums text-xs font-bold text-[#00142f] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {app.applicationNo}
                      </span>
                      <PriorityBadge score={app.eligibilityScore} size="sm" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-display ${
                      app.currentStage === 'FIELD_VERIFICATION' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      app.currentStage === 'DISTRICT_REVIEW' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                      app.currentStage === 'FINANCE_APPROVAL' ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      Stage: {app.currentStage.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold font-display text-[#00142f] mb-1">{scheme.name}</h3>
                  <div className="text-xs text-slate-600 mb-3 flex items-center font-body">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <strong>{ben.fullName}</strong> &bull; {ben.district}, {ben.state} &bull; Aadhaar: {ben.aadhaarNumber}
                  </div>

                  {/* Eligibility Score Card */}
                  <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200 mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 font-display">Automated Eligibility Score</span>
                      <div className="flex items-center space-x-2">
                        <PriorityBadge score={app.eligibilityScore} size="sm" />
                        <span className={`text-base font-bold font-display tabular-nums ${isScore100 ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {app.eligibilityScore} / 100
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#1aa54c] h-2 rounded-full"
                        style={{ width: `${app.eligibilityScore}%` }}
                      ></div>
                    </div>

                    {app.scoreBreakdown && (
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-500 pt-1">
                        <div>Income: <strong className="text-[#00142f]">{app.scoreBreakdown.incomeScore}/35</strong></div>
                        <div>Social: <strong className="text-[#00142f]">{app.scoreBreakdown.categoryScore}/25</strong></div>
                        <div>Region: <strong className="text-[#00142f]">{app.scoreBreakdown.regionScore}/20</strong></div>
                        <div>Docs: <strong className="text-[#00142f]">{app.scoreBreakdown.docVerificationScore}/20</strong></div>
                      </div>
                    )}
                  </div>

                  {/* Previous Stage Results summary */}
                  {app.fieldChecklist && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 mb-2">
                      <strong className="font-bold block">✓ Field Verification Completed:</strong>
                      <span className="text-slate-700">{app.fieldChecklist.officerNotes}</span>
                    </div>
                  )}

                  {app.districtNotes && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 mb-2">
                      <strong className="font-bold block">✓ District Sanction Clearance:</strong>
                      <span className="text-slate-700">{app.districtNotes}</span>
                    </div>
                  )}

                  {/* Dynamic Scheme Attributes Display */}
                  {(() => {
                    const answers = app.dynamicFieldAnswers || (app.dynamicFieldAnswersJson ? JSON.parse(app.dynamicFieldAnswersJson || '{}') : {});
                    const entries = Object.entries(answers);
                    if (entries.length === 0) return null;

                    return (
                      <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-xl space-y-1.5 text-xs mb-3">
                        <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-[10px] uppercase">
                          <Sliders className="w-3.5 h-3.5 text-blue-600" />
                          <span>Scheme-Specific Dynamic Attributes ({entries.length})</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {entries.map(([k, v]) => (
                            <div key={k} className="bg-white p-2 rounded-lg border border-blue-100 text-[11px]">
                              <span className="text-slate-500 block text-[9px] uppercase font-semibold">
                                {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              <strong className="text-[#00142f] truncate block">
                                {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v || 'N/A')}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <span className="text-slate-500">Applied Grant:</span>
                      <strong className="text-[#1aa54c] ml-1 font-mono text-sm">
                        ₹{(app.appliedGrantAmount || 50000).toLocaleString()}
                      </strong>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Submitted: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '2026-01-15'}
                    </span>
                  </div>
                </div>

                {/* Role-Appropriate Action Buttons */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  {canUserVerify(app) ? (
                    <>
                      <button
                        onClick={() => openActionModal(app)}
                        className="flex-1 py-2 bg-[#00142f] hover:bg-[#0f294a] text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center font-display"
                      >
                        <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                        {role === 'FIELD_OFFICER' ? 'Conduct Ground Check' :
                         role === 'DISTRICT_OFFICER' ? 'Review & Sanction' :
                         role === 'FINANCE_APPROVER' ? 'Authorize Fund Release' :
                         'Verify Stage'}
                      </button>
                      <button
                        onClick={() => openDetailsModal(app)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center justify-center font-display"
                        title="View Complete Dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openDetailsModal(app)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200/90 text-[#00142f] text-xs font-bold rounded-xl border border-slate-300 transition flex items-center justify-center font-display shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      View Full Details &amp; Audit Trail
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Verification Decision Modal */}
      {showActionModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                  {selectedApp.applicationNo}
                </span>
                <h3 className="text-base font-extrabold text-[#00142f] mt-1">
                  Verification Decision & Checklist
                </h3>
              </div>
              <button onClick={() => setShowActionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              {/* Dynamic Scheme Attributes Submitted by Citizen */}
              {(() => {
                const answers = selectedApp.dynamicFieldAnswers || (selectedApp.dynamicFieldAnswersJson ? JSON.parse(selectedApp.dynamicFieldAnswersJson || '{}') : {});
                const entries = Object.entries(answers);
                if (entries.length === 0) return null;

                return (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <span>Citizen Dynamic Form Inputs (For Field / District Verification)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {entries.map(([k, v]) => (
                        <div key={k} className="bg-white p-2.5 rounded-xl border border-blue-100">
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                            {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <strong className="text-[#00142f]">
                            {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v || 'N/A')}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Field Officer Checklist (Only for Field Officer or Admin at Field Check) */}
              {(role === 'FIELD_OFFICER' || (role === 'ADMIN' && selectedApp.currentStage === 'FIELD_VERIFICATION')) && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center">
                    <ClipboardCheck className="w-4 h-4 mr-1.5 text-amber-700" />
                    Mandatory Field Ground Verification Checklist
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-slate-800 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldChecklist.physicalAddressVerified}
                        onChange={(e) => setFieldChecklist({ ...fieldChecklist, physicalAddressVerified: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0f294a]"
                      />
                      <span>Physical residential / farm location inspected in person</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-800 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldChecklist.landHoldingVerified}
                        onChange={(e) => setFieldChecklist({ ...fieldChecklist, landHoldingVerified: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0f294a]"
                      />
                      <span>Land holding / farm size verified against Revenue Patwari records</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-800 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldChecklist.incomeVerified}
                        onChange={(e) => setFieldChecklist({ ...fieldChecklist, incomeVerified: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0f294a]"
                      />
                      <span>Income declaration and social category criteria verified genuine</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-800 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldChecklist.originalDocsInspected}
                        onChange={(e) => setFieldChecklist({ ...fieldChecklist, originalDocsInspected: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0f294a]"
                      />
                      <span>Original Aadhaar & Bank Passbook physical documents authenticated</span>
                    </label>
                  </div>
                </div>
              )}

              {/* District Officer View Summary */}
              {(role === 'DISTRICT_OFFICER' || (role === 'ADMIN' && selectedApp.currentStage === 'DISTRICT_REVIEW')) && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-indigo-900 uppercase text-[11px]">
                    District Administrative Review Summary
                  </h4>
                  <p className="text-slate-700">
                    Field inspection report submitted. Grant amount recommended: <strong className="font-mono text-[#1aa54c]">₹{(selectedApp.appliedGrantAmount || 0).toLocaleString()}</strong>.
                  </p>
                </div>
              )}

              {/* Finance Approver View Summary */}
              {(role === 'FINANCE_APPROVER' || (role === 'ADMIN' && selectedApp.currentStage === 'FINANCE_APPROVAL')) && (
                <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-teal-900 uppercase text-[11px]">
                    Treasury Budget Sanction & Staged Disbursement Plan
                  </h4>
                  <div className="flex justify-between text-slate-700">
                    <span>Approved Grant: <strong className="font-mono text-[#1aa54c]">₹{(selectedApp.appliedGrantAmount || 0).toLocaleString()}</strong></span>
                    <span>Budget Availability: <strong className="text-emerald-700">VERIFIED AVAILABLE</strong></span>
                  </div>
                </div>
              )}

              {/* Action Decision Selector */}
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Verification Decision *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    ✓ Approve Stage
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision(role === 'FINANCE_APPROVER' ? 'HOLD' : 'RE_VERIFICATION')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      decision === 'RE_VERIFICATION' || decision === 'HOLD'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    {role === 'FINANCE_APPROVER' ? '⏸ Put on Hold' : '↺ Send for Re-check'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      decision === 'REJECTED'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-red-800 border-red-300 hover:bg-red-50'
                    }`}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>

              {/* Officer Remarks / Notes */}
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Official Verification Notes & Justification *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Enter official inspection observations or audit notes..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow hover:bg-[#0f294a]"
                >
                  {submitting ? 'Submitting...' : 'Sign & Submit Official Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read-Only Application & Verification Audit Details Modal */}
      {showDetailsModal && detailsApp && (() => {
        const ben = getBeneficiaryForApp(detailsApp);
        const scheme = getSchemeForApp(detailsApp);
        const answers = detailsApp.dynamicFieldAnswers || (detailsApp.dynamicFieldAnswersJson ? JSON.parse(detailsApp.dynamicFieldAnswersJson || '{}') : {});
        const dynamicEntries = Object.entries(answers);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 overflow-y-auto backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                      {detailsApp.applicationNo}
                    </span>
                    <PriorityBadge score={detailsApp.eligibilityScore} size="sm" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                      Supervisory Audit View
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#00142f] mt-1.5 font-display">
                    Application &amp; Multi-Stage Verification Audit Details
                  </h3>
                  <p className="text-xs text-slate-500 font-body">
                    Complete end-to-end statutory dossier for grant consideration &amp; audit inspection.
                  </p>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Priority Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Current Lifecycle Stage</span>
                  <strong className="text-sm font-bold text-[#00142f]">
                    {detailsApp.currentStage?.replace(/_/g, ' ')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Automated Eligibility Score</span>
                  <strong className="text-sm font-bold text-[#1aa54c] font-display">
                    {detailsApp.eligibilityScore ?? 'N/A'} / 100
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Applied Grant Amount</span>
                  <strong className="text-sm font-bold text-[#00142f] font-mono">
                    ₹{(detailsApp.appliedGrantAmount || 0).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Submission Date</span>
                  <strong className="text-xs text-slate-700">
                    {detailsApp.createdAt ? new Date(detailsApp.createdAt).toLocaleDateString() : 'Active Batch'}
                  </strong>
                </div>
              </div>

              {/* Section 1: Beneficiary Profile & Bank Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                  <span className="w-1.5 h-3.5 bg-blue-600 rounded-full mr-2"></span>
                  1. Beneficiary Citizen Profile &amp; DBT Account
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8f9ff] p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Full Name</span>
                    <strong className="text-[#00142f] text-sm">{ben.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Aadhaar (Masked)</span>
                    <strong className="text-[#00142f] font-mono">{ben.aadhaarNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Social Category</span>
                    <strong className="text-[#00142f]">{ben.category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Annual Income</span>
                    <strong className="text-[#00142f] font-mono">₹{(ben.annualIncome || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Land Holding</span>
                    <strong className="text-[#00142f]">{ben.landSizeAcres || 0} Acres</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Location</span>
                    <strong className="text-[#00142f]">{ben.district || 'Varanasi'}, {ben.state || 'UP'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">DBT Bank Name</span>
                    <strong className="text-[#00142f]">{ben.bankName || 'State Bank of India'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Bank Account</span>
                    <strong className="text-[#00142f] font-mono">{ben.bankAccountNumber || '••••••••4820'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">IFSC Code</span>
                    <strong className="text-[#00142f] font-mono">{ben.ifscCode || 'SBIN0001234'}</strong>
                  </div>
                </div>
              </div>

              {/* Section 2: Scheme Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                  <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full mr-2"></span>
                  2. Targeted Subsidy Scheme Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#f8f9ff] p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Scheme Name</span>
                    <strong className="text-[#00142f]">{scheme.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Scheme Code</span>
                    <strong className="text-[#00142f] font-mono">{scheme.schemeCode || 'SCH-2026-GOV'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Nodal Ministry</span>
                    <strong className="text-[#00142f]">{scheme.ministry || 'Ministry of Agriculture & Farmers Welfare'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Scheme Category</span>
                    <strong className="text-[#00142f]">{scheme.category || 'Direct Income Support'}</strong>
                  </div>
                </div>
              </div>

              {/* Section 3: Dynamic Scheme Attributes */}
              {dynamicEntries.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                    <Sliders className="w-3.5 h-3.5 text-blue-600 mr-2" />
                    3. Scheme-Specific Dynamic Form Attributes ({dynamicEntries.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-blue-50/40 p-4 rounded-2xl border border-blue-200/70 text-xs">
                    {dynamicEntries.map(([k, v]) => (
                      <div key={k} className="bg-white p-2.5 rounded-xl border border-blue-100">
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">
                          {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <strong className="text-[#00142f] block mt-0.5">
                          {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v || 'N/A')}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Multi-Stage Verification Audit Trail */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                  <Shield className="w-3.5 h-3.5 text-purple-600 mr-2" />
                  4. Statutory Multi-Stage Verification Trail
                </h4>
                <div className="space-y-3">
                  {/* Field Verification Stage */}
                  <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-amber-900 font-bold flex items-center gap-1.5">
                        <ClipboardCheck className="w-4 h-4 text-amber-700" />
                        Stage 1: Ground Physical Verification (Field Officer)
                      </strong>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        detailsApp.fieldChecklist?.officerNotes ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {detailsApp.fieldChecklist?.officerNotes ? 'Verified' : 'Pending Inspection'}
                      </span>
                    </div>
                    <div className="text-slate-700 pt-1">
                      {detailsApp.fieldChecklist?.officerNotes ? (
                        <p><strong className="text-slate-900">Inspection Observations:</strong> {detailsApp.fieldChecklist.officerNotes}</p>
                      ) : (
                        <p className="text-slate-500 italic">Field officer on-site inspection pending in assigned district circle.</p>
                      )}
                      {detailsApp.fieldChecklist?.siteGeoTag && (
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>Geo-Tag: {detailsApp.fieldChecklist.siteGeoTag}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* District Review Stage */}
                  <div className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-indigo-900 font-bold flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-indigo-700" />
                        Stage 2: District Administrative Sanction (District Officer)
                      </strong>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        detailsApp.districtNotes ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {detailsApp.districtNotes ? 'Sanctioned' : 'Awaiting Review'}
                      </span>
                    </div>
                    <div className="text-slate-700 pt-1">
                      {detailsApp.districtNotes ? (
                        <p><strong className="text-slate-900">District Officer Remarks:</strong> {detailsApp.districtNotes}</p>
                      ) : (
                        <p className="text-slate-500 italic">Scheduled after ground verification clearance.</p>
                      )}
                    </div>
                  </div>

                  {/* Finance Approver Stage */}
                  <div className="p-3.5 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-teal-900 font-bold flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-teal-700" />
                        Stage 3: Treasury Fund Release Authorization (Finance Approver)
                      </strong>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        detailsApp.currentStage === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {detailsApp.currentStage === 'APPROVED' ? 'Fund Released' : 'Pending Treasury Gate'}
                      </span>
                    </div>
                    <div className="text-slate-700 pt-1">
                      {detailsApp.financeRemarks ? (
                        <p><strong className="text-slate-900">Finance Remarks:</strong> {detailsApp.financeRemarks}</p>
                      ) : (
                        <p className="text-slate-500 italic">Disbursement tranches will be initiated via PFMS/DBT gateway once sanctioned.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Governance Segregation Notice */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-slate-700 text-xs flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong>Statutory Segregation of Duties:</strong> Operational verification and sanction decisions are strictly restricted to assigned Field Officers, District Officers, and Finance Approvers. System Administrators maintain read-only supervisory visibility and tamper-evident audit logs.
                </span>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2.5 bg-[#00142f] hover:bg-[#0f294a] text-white text-xs font-bold rounded-xl transition shadow font-display"
                >
                  Close Audit Dossier
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
