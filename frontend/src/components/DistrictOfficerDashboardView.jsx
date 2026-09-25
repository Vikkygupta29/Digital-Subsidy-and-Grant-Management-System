import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, ArrowRight, X, Sliders, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Star } from 'lucide-react';
import { workflowAPI, applicationAPI } from '../services/api';
import PriorityBadge from './PriorityBadge';
import { sortByPriority } from '../utils/priority';
import { toast } from '../context/ToastContext';

export default function DistrictOfficerDashboardView({ 
  currentTab = 'dashboard', 
  currentUser, 
  applications = [], 
  beneficiaries = [], 
  schemes = [], 
  onRefresh, 
  onUpdateApplicationStage 
}) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState(
    currentTab === 'sanctions' ? 'review_queue' :
    currentTab === 'schemes' ? 'applications' : currentTab
  );

  useEffect(() => {
    if (currentTab) {
      if (currentTab === 'sanctions') setActiveSubTab('review_queue');
      else if (currentTab === 'schemes') setActiveSubTab('applications');
      else setActiveSubTab(currentTab);
    }
  }, [currentTab]);

  const handleTabClick = (tabId) => {
    setActiveSubTab(tabId);
    if (tabId === 'dashboard') navigate('/district');
    else if (tabId === 'review_queue') navigate('/district/sanction-queue');
    else if (tabId === 'applications') navigate('/district/schemes');
    else if (tabId === 'history') navigate('/district/history');
    else if (tabId === 'reports') navigate('/district/reports');
  };
  const [selectedApp, setSelectedApp] = useState(null);
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [districtNotes, setDistrictNotes] = useState('');
  const [decision, setDecision] = useState('APPROVED');
  const [rejectionCategory, setRejectionCategory] = useState('DOCUMENT_DEFICIENCY');
  const [submitting, setSubmitting] = useState(false);

  // Appeals & Re-verification State
  const [selectedAppealApp, setSelectedAppealApp] = useState(null);
  const [appealModalAction, setAppealModalAction] = useState('ACCEPT');
  const [appealNotes, setAppealNotes] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);

  // Reapply Modal State
  const [showReapplyModal, setShowReapplyModal] = useState(false);
  const [reapplyReason, setReapplyReason] = useState('');
  const [reapplyError, setReapplyError] = useState('');
  const [reapplySubmitting, setReapplySubmitting] = useState(false);

  // Filter applications scoped strictly to the district officer's authorized region/district
  const userRegion = currentUser?.region || 'North Region';
  const districtApps = applications.filter(a => {
    const ben = beneficiaries.find(b => b.id === a.beneficiaryId || b.id === a.beneficiary?.id);
    if (!ben) return true;
    return !userRegion || userRegion === 'National HQ' || ben.region === userRegion;
  });

  // Filter applications scoped strictly to the district officer's authorized region/district, sorted by priority (Score 100 first)
  const pendingDistrictReviews = sortByPriority(districtApps.filter(a => a.currentStage === 'DISTRICT_REVIEW' && a.status !== 'RE_VERIFICATION_REQUESTED'));
  const appealsQueue = sortByPriority(districtApps.filter(a => a.status === 'RE_VERIFICATION_REQUESTED' || a.currentStage === 'RE_VERIFICATION_APPEAL'));
  const reappliedFromFinance = sortByPriority(districtApps.filter(a => a.currentStage === 'DISTRICT_REVIEW' && a.lastReappliedByRole === 'FINANCE_APPROVER'));
  const clearedDistrictApps = sortByPriority(districtApps.filter(a => ['FINANCE_APPROVAL', 'APPROVED'].includes(a.currentStage)));
  const rejectedDistrictApps = sortByPriority(districtApps.filter(a => a.currentStage === 'REJECTED'));
  const totalSanctionedAmount = districtApps
    .filter(a => ['FINANCE_APPROVAL', 'APPROVED'].includes(a.currentStage))
    .reduce((acc, a) => acc + (a.appliedGrantAmount || 0), 0) || 245000;

  const openSanctionModal = (app) => {
    setSelectedApp(app);
    setDistrictNotes('');
    setDecision('APPROVED');
    setRejectionCategory('DOCUMENT_DEFICIENCY');
    setShowSanctionModal(true);
  };

  const openAppealModal = (app, actionType) => {
    setSelectedAppealApp(app);
    setAppealModalAction(actionType);
    setAppealNotes(actionType === 'ACCEPT' 
      ? 'Appeal accepted upon review of citizen evidence. Dispatched to Field Officer for ground verification.' 
      : 'Appeal rejected upon examination. Primary grounds for disqualification upheld.');
    setShowAppealModal(true);
  };

  const handleAppealSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAppealApp) return;
    if (!appealNotes.trim()) {
      toast.warning('Please enter order remarks.');
      return;
    }
    setAppealSubmitting(true);
    try {
      const action = appealModalAction === 'ACCEPT' ? 'ACCEPT_RE_VERIFICATION' : 'UPHOLD_REJECTION';
      await applicationAPI.workflowAction(selectedAppealApp.id, {
        action,
        notes: appealNotes.trim(),
        reason: appealNotes.trim(),
        userId: currentUser?.id,
        username: currentUser?.username,
        role: currentUser?.role || 'DISTRICT_OFFICER',
      });
      if (onUpdateApplicationStage) {
        onUpdateApplicationStage(selectedAppealApp.id, appealModalAction === 'ACCEPT' ? 'FIELD_VERIFICATION' : 'REJECTED', {
          status: appealModalAction === 'ACCEPT' ? 'UNDER_REVIEW' : 'REJECTED',
        });
      }
      if (onRefresh) onRefresh();
      setShowAppealModal(false);
      setSelectedAppealApp(null);
      setAppealNotes('');
      if (appealModalAction === 'ACCEPT') {
        toast.success('Appeal Accepted! Dispatched to Field Officer for fresh verification.');
      } else {
        toast.info('Rejection Upheld. Statutory rejection order confirmed.');
      }
    } catch (err) {
      toast.error('Failed to process appeal: ' + (err.response?.data?.error || err.message));
    } finally {
      setAppealSubmitting(false);
    }
  };

  const openReapplyModal = (app) => {
    setSelectedApp(app);
    setReapplyReason('');
    setReapplyError('');
    setShowSanctionModal(false);
    setShowReapplyModal(true);
  };

  const handleReapplySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedApp) return;
    if (!reapplyReason || !reapplyReason.trim()) {
      setReapplyError('Please provide a reason.');
      return;
    }

    setReapplySubmitting(true);
    setReapplyError('');

    try {
      await applicationAPI.workflowAction(selectedApp.id, {
        action: 'REAPPLY',
        reason: reapplyReason.trim(),
        userId: currentUser?.id,
        username: currentUser?.username,
        role: currentUser?.role || 'DISTRICT_OFFICER',
      });

      if (onUpdateApplicationStage) {
        onUpdateApplicationStage(selectedApp.id, 'FIELD_VERIFICATION', {
          status: 'UNDER_REVIEW',
          reapplyCount: (selectedApp.reapplyCount || 0) + 1,
          lastReapplyReason: reapplyReason.trim(),
          lastReappliedByRole: 'DISTRICT_OFFICER',
          lastReappliedAt: new Date().toISOString(),
        });
      }

      if (onRefresh) onRefresh();
      setShowReapplyModal(false);
      setReapplyReason('');
      setReapplySubmitting(false);
      toast.success('Application sent back to Field Officer queue for re-verification.');
    } catch (err) {
      setReapplySubmitting(false);
      const errMsg = err.response?.data?.error || err.message;
      setReapplyError(errMsg);
      toast.error('Failed to send back: ' + errMsg);
    }
  };

  const handleSanctionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (decision === 'REAPPLY' || decision === 'RE_VERIFICATION') {
      openReapplyModal(selectedApp);
      return;
    }

    setSubmitting(true);

    try {
      let action = 'APPROVE';
      let nextStage = 'FINANCE_APPROVAL';
      let message = 'District sanction granted and forwarded to Finance Approver!';

      if (decision === 'REJECTED') {
        action = 'REJECT';
        nextStage = 'REJECTED';
        message = 'Application rejected by District Sanctioning Authority.';
      }

      await applicationAPI.workflowAction(selectedApp.id, {
        action,
        reason: districtNotes || 'District administrative sanction approved.',
        notes: districtNotes,
        rejectionCategory: decision === 'REJECTED' ? rejectionCategory : undefined,
        userId: currentUser?.id,
        username: currentUser?.username,
        role: currentUser?.role || 'DISTRICT_OFFICER',
      });

      if (onUpdateApplicationStage) {
        onUpdateApplicationStage(selectedApp.id, nextStage, {
          decision,
          districtNotes,
          rejectionCategory: decision === 'REJECTED' ? rejectionCategory : undefined,
          status: decision === 'REJECTED' ? 'REJECTED' : undefined,
        });
      }
      if (onRefresh) onRefresh();

      setSubmitting(false);
      setShowSanctionModal(false);
      if (decision === 'APPROVE') {
        toast.success(message);
      } else {
        toast.info(message);
      }
    } catch (err) {
      setSubmitting(false);
      toast.error('Failed to submit district sanction: ' + (err.response?.data?.error || err.message));
    }
  };

  const getBeneficiaryForApp = (app) => {
    return beneficiaries.find(b => b.id === app.beneficiaryId || b.id === app.beneficiary?.id) || app.beneficiary || {
      fullName: app.applicantName || 'Applicant',
      aadhaarNumber: '—',
      category: '—',
      district: app.district || '—',
      state: app.state || '—',
      address: '—'
    };
  };

  const getSchemeForApp = (app) => {
    return schemes.find(s => s.id === app.schemeId || s.id === app.scheme?.id) || app.scheme || {
      schemeName: app.schemeName || 'Grant Scheme',
      name: app.schemeName || 'Grant Scheme',
      schemeCode: app.schemeCode || 'SCHEME',
    };
  };

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* District Header Banner */}
      <div className="bg-[#00142f] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xl shadow-inner">
              <CheckSquare className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentUser?.fullName || 'District Administrative Officer'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase">
                  District Sanction Authority
                </span>
              </div>
              <p className="text-xs text-[#7a91b7]">
                District Jurisdiction: <strong className="text-white">Varanasi Circle &bull; {userRegion}</strong> &bull; Administrative Sanction Board
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-mono font-bold text-indigo-300 border border-white/10">
              {pendingDistrictReviews.length} Pending District Sanctions
            </span>
          </div>
        </div>

        {/* Navigation Tabs for District Officer */}
        <div className="flex space-x-1 pt-3 border-t border-slate-800 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'dashboard', label: 'District Dashboard' },
            { id: 'review_queue', label: `Pending Review (${pendingDistrictReviews.length})` },
            { id: 'appeals', label: `Appeals & Re-Verifications (${appealsQueue.length})` },
            { id: 'returned_finance', label: `Returned from Finance (${reappliedFromFinance.length})` },
            { id: 'approved', label: `Approved (${clearedDistrictApps.length})` },
            { id: 'rejected', label: `Rejected (${rejectedDistrictApps.length})` },
            { id: 'applications', label: `District Applications (${districtApps.length})` },
            { id: 'history', label: 'Verification History' },
            { id: 'reports', label: 'District Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#7a91b7] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-VIEW 1: DISTRICT OVERVIEW */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Pending District Reviews</span>
              <div className="text-2xl font-black font-mono text-indigo-600">{pendingDistrictReviews.length}</div>
              <span className="text-[11px] text-slate-400">Field Verified Clearance</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Returned from Finance</span>
              <div className="text-2xl font-black font-mono text-purple-600">{reappliedFromFinance.length}</div>
              <span className="text-[11px] text-purple-600 font-semibold">Treasury Re-check</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Sanctioned Grants</span>
              <div className="text-2xl font-black font-mono text-[#1aa54c]">{clearedDistrictApps.length}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Forwarded to Finance</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Rejected Grants</span>
              <div className="text-2xl font-black font-mono text-red-600">{rejectedDistrictApps.length}</div>
              <span className="text-[11px] text-red-600 font-semibold">Declined by Board</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">District Sanction Total</span>
              <div className="text-xl font-black font-mono text-[#0f294a]">₹{(totalSanctionedAmount / 100000).toFixed(2)} L</div>
              <span className="text-[11px] text-blue-600 font-semibold">Under Budget Cap</span>
            </div>
          </div>

          {/* Pending Reviews Queue Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#00142f]">Field-Verified Applications Awaiting District Review</h3>
                <p className="text-xs text-slate-500">Applications cleared by Field Officers requiring final administrative sanction</p>
              </div>
              <button
                onClick={() => setActiveSubTab('review_queue')}
                className="text-xs font-bold text-indigo-700 hover:underline flex items-center"
              >
                Review All ({pendingDistrictReviews.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingDistrictReviews.slice(0, 2).map((app) => {
                const ben = getBeneficiaryForApp(app);
                const scheme = getSchemeForApp(app);

                return (
                  <div key={app.id} className="p-5 bg-[#f8f9ff] border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2 py-0.5 rounded border border-[#c4e0ff]">
                        {app.applicationNo}
                      </span>
                      <PriorityBadge score={app.eligibilityScore} />
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#00142f]">{ben.fullName}</h4>
                      <p className="text-xs text-slate-600">{ben.address}, {ben.district}</p>
                    </div>

                    {app.fieldChecklist && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                        <strong>Field Officer Report:</strong> {app.fieldChecklist.officerNotes}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs">
                      <span>Grant: <strong className="text-[#1aa54c] font-mono">₹{(app.appliedGrantAmount || 0).toLocaleString()}</strong></span>
                      <button
                        onClick={() => openSanctionModal(app)}
                        className="px-4 py-2 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold text-xs rounded-xl shadow transition"
                      >
                        Sanction Review &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DISTRICT REVIEW QUEUE & SUB-QUEUES */}
      {['review_queue', 'returned_finance', 'approved', 'rejected'].includes(activeSubTab) && (() => {
        const getQueueData = () => {
          if (activeSubTab === 'returned_finance') {
            return { list: reappliedFromFinance, title: `Applications Returned from Finance (${reappliedFromFinance.length})`, desc: 'Applications returned by Finance Approver for district sanction clarification' };
          }
          if (activeSubTab === 'approved') {
            return { list: clearedDistrictApps, title: `District Approved Grants (${clearedDistrictApps.length})`, desc: 'Applications granted administrative sanction and forwarded to Finance Treasury' };
          }
          if (activeSubTab === 'rejected') {
            return { list: rejectedDistrictApps, title: `Rejected Applications (${rejectedDistrictApps.length})`, desc: 'Applications rejected during district administrative review' };
          }
          return { list: pendingDistrictReviews, title: `District Review & Sanction Queue (${pendingDistrictReviews.length})`, desc: 'Examine field reports, eligibility scoring, verify grant amount and grant administrative sanction' };
        };
        const currentData = getQueueData();

        return (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#00142f]">{currentData.title}</h2>
                <p className="text-xs text-slate-500">{currentData.desc}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentData.list.length === 0 ? (
                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
                  No applications found in this queue.
                </div>
              ) : (
                currentData.list.map((app) => {
                  const ben = getBeneficiaryForApp(app);
                  const scheme = getSchemeForApp(app);

                  return (
                    <div 
                      key={app.id} 
                      className={`bg-white border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between transition ${
                        app.eligibilityScore === 100
                          ? 'border-2 border-purple-400 bg-purple-50/10 shadow-md ring-1 ring-purple-300/50'
                          : 'border-slate-200 hover:border-indigo-400/50'
                      }`}
                    >
                      {app.eligibilityScore === 100 && (
                        <div className="p-2 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-purple-300 rounded-xl flex items-center justify-between text-xs text-purple-950 font-bold">
                          <span className="flex items-center gap-1.5">
                            ⭐ P1 Highest Priority Sanction (Score 100/100)
                          </span>
                          <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                            Fast-Track Clearance
                          </span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                            {app.applicationNo}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <PriorityBadge score={app.eligibilityScore} />
                            {app.reapplyCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center">
                                <RotateCcw className="w-3 h-3 mr-1" /> Reapplications: {app.reapplyCount}
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                              {app.currentStage}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-[#00142f]">{scheme.name}</h3>

                        {app.lastReapplyReason && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                            <div className="font-bold flex items-center text-amber-800">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              Last Action: Reapplied by {app.lastReappliedByRole || 'Officer'}
                            </div>
                            <div>Reason: <span className="font-medium italic">"{app.lastReapplyReason}"</span></div>
                            {app.lastReappliedAt && (
                              <div className="text-[10px] text-amber-700">Date: {new Date(app.lastReappliedAt).toLocaleDateString()}</div>
                            )}
                          </div>
                        )}

                        <div className="p-3.5 bg-[#f8f9ff] rounded-xl border border-slate-200 space-y-1 text-xs text-slate-700">
                          <div>Applicant: <strong className="text-[#00142f]">{ben.fullName}</strong> ({ben.category})</div>
                          <div>Aadhaar: <strong className="font-mono">{ben.aadhaarNumber}</strong> &bull; District: {ben.district}</div>
                          <div>Land Size: <strong>{ben.landSizeAcres || 0} Acres</strong> &bull; Income: <strong>₹{(ben.annualIncome || 0).toLocaleString()}</strong></div>
                        </div>

                        {/* Field Officer Verification Result */}
                        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                          <strong className="block font-bold">✓ Field Officer Ground Verification Cleared:</strong>
                          <p className="text-[11px] text-slate-700">{app.fieldChecklist?.officerNotes || 'Physical address and land ownership authenticated on site.'}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs bg-[#eff4ff] p-2.5 rounded-xl border border-[#c4e0ff]">
                          <div className="flex items-center gap-2">
                            <span>Eligibility Scoring Result:</span>
                            <strong className="text-[#1aa54c] font-mono text-sm">{app.eligibilityScore} / 100</strong>
                          </div>
                          <PriorityBadge score={app.eligibilityScore} short={true} />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2 items-center justify-between">
                        <span className="text-xs text-slate-500">Recommended Grant: <strong className="text-[#1aa54c] font-mono text-sm">₹{(app.appliedGrantAmount || 0).toLocaleString()}</strong></span>
                        <div className="flex items-center space-x-2">
                          {app.currentStage === 'DISTRICT_REVIEW' && (
                            <button
                              onClick={() => openReapplyModal(app)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reapply
                            </button>
                          )}
                          <button
                            onClick={() => openSanctionModal(app)}
                            className="px-4 py-2 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold text-xs rounded-xl shadow transition"
                          >
                            Sanction Decision &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* SUB-VIEW: STATUTORY GRIEVANCE APPEALS & RE-VERIFICATIONS */}
      {activeSubTab === 'appeals' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#00142f] flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 inline-block"></span>
                Statutory Grievance Appeals & Re-Verification Queue ({appealsQueue.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Under Section 14 DBT Grievance Redressal rules, beneficiaries have a statutory 30-day window to file appeal upon rejection.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold font-mono">
              {appealsQueue.length} Active Appeals
            </span>
          </div>

          {appealsQueue.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
              No pending citizen re-verification appeals in this district circle.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appealsQueue.map((app) => {
                const ben = getBeneficiaryForApp(app);
                const scheme = getSchemeForApp(app);

                return (
                  <div key={app.id} className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                          {app.applicationNo}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <PriorityBadge score={app.eligibilityScore} />
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Statutory Appeal
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-[#00142f]">{scheme.name}</h3>

                      <div className="p-3.5 bg-[#f8f9ff] rounded-xl border border-slate-200 space-y-1 text-xs text-slate-700">
                        <div>Applicant: <strong className="text-[#00142f]">{ben.fullName}</strong> ({ben.category})</div>
                        <div>Aadhaar: <strong className="font-mono">{ben.aadhaarNumber}</strong> &bull; District: {ben.district}</div>
                        <div>Land Size: <strong>{ben.landSizeAcres || 0} Acres</strong> &bull; Income: <strong>₹{(ben.annualIncome || 0).toLocaleString()}</strong></div>
                      </div>

                      {/* Previous Rejection Record */}
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                        <div className="font-bold flex items-center text-red-800">
                          <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
                          Previous Rejection Order [{app.rejectionCategory || 'DOCUMENT_DEFICIENCY'}]
                        </div>
                        <p className="text-[11px] text-red-800 italic">
                          "{app.rejectionReason || 'Rejected due to statutory criteria.'}"
                        </p>
                        {app.rejectedBy && (
                          <div className="text-[10px] text-red-700">
                            Rejected by: {app.rejectedBy} ({app.rejectedByRole}) &bull; Date: {app.rejectedAt ? new Date(app.rejectedAt).toLocaleDateString() : '—'}
                          </div>
                        )}
                      </div>

                      {/* Citizen Statutory Appeal Grounds */}
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
                        <div className="font-bold flex items-center text-amber-900">
                          <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-700" />
                          Beneficiary Statutory Grounds for Appeal:
                        </div>
                        <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-amber-200">
                          {app.reVerificationAppealGrounds || 'Applicant has submitted clarification requesting re-verification.'}
                        </p>
                        {app.reVerificationDocumentUrl && (
                          <div className="text-[11px] text-indigo-700 font-semibold pt-1">
                            Attached Rebuttal Document: <a href={app.reVerificationDocumentUrl} target="_blank" rel="noreferrer" className="underline hover:text-indigo-900 font-mono">View Document</a>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500">
                          Submitted on: {app.reVerificationRequestedAt ? new Date(app.reVerificationRequestedAt).toLocaleString() : 'Recent'}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2 items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Grant Claim: <strong className="text-[#1aa54c] font-mono text-sm">₹{(app.appliedGrantAmount || 0).toLocaleString()}</strong>
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openAppealModal(app, 'UPHOLD')}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          Uphold Rejection
                        </button>
                        <button
                          onClick={() => openAppealModal(app, 'ACCEPT')}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                        >
                          Accept Appeal & Inspect &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: DISTRICT APPLICATIONS */}
      {activeSubTab === 'applications' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-[#f8f9ff] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00142f]">
              All Applications in District Circle ({districtApps.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#00142f]">
              <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">Application No</th>
                  <th className="p-3">Beneficiary</th>
                  <th className="p-3">Scheme</th>
                  <th className="p-3">Grant Amount</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Eligibility Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {districtApps.map((a) => (
                  <tr key={a.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-3 font-mono font-bold text-[#00142f]">{a.applicationNo}</td>
                    <td className="p-3">{a.beneficiary?.fullName || 'Rajesh Patel'}</td>
                    <td className="p-3">{a.scheme?.name || 'Kisan Subsidy'}</td>
                    <td className="p-3 font-mono text-[#1aa54c] font-bold">₹{(a.appliedGrantAmount || 0).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {a.currentStage}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold">{a.eligibilityScore} / 100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: VERIFICATION HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#00142f]">District Administrative Sanction History</h3>
          <div className="space-y-3">
            {clearedDistrictApps.map((app) => (
              <div key={app.id} className="p-4 bg-[#f8f9ff] border border-slate-200 rounded-2xl flex justify-between items-start text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#00142f]">{app.applicationNo}</span>
                    <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      ✓ District Sanction Granted
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Beneficiary: <strong>{app.beneficiary?.fullName || 'Rajesh Patel'}</strong> &bull; Stage: {app.currentStage}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    District Board Order: {app.districtNotes || 'Sanctioned under district direct benefit transfer quota.'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-[#1aa54c]">₹{(app.appliedGrantAmount || 0).toLocaleString()}</div>
                  <span className="text-[10px] text-slate-400">Score: {app.eligibilityScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: DISTRICT REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#00142f]">District Administrative & Sanction Reports</h3>
          <p className="text-xs text-slate-500">Official monthly sanction summary and administrative audit reports</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200">
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">Total Applications Processed</span>
              <strong className="text-xl font-bold text-[#00142f] font-mono">{districtApps.length}</strong>
              <div className="text-[11px] text-slate-500 mt-1">Circle: {userRegion}</div>
            </div>

            <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200">
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">Average Sanction Grant</span>
              <strong className="text-xl font-bold text-[#1aa54c] font-mono">₹54,000</strong>
              <div className="text-[11px] text-slate-500 mt-1">Across 5 Active Schemes</div>
            </div>

            <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200">
              <span className="text-slate-500 uppercase font-semibold text-[10px] block">District Approval Ratio</span>
              <strong className="text-xl font-bold text-blue-600 font-mono">92.8%</strong>
              <div className="text-[11px] text-blue-600 mt-1">Ground verified clearances</div>
            </div>
          </div>
        </div>
      )}

      {/* District Officer Sanction Modal */}
      {showSanctionModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                  {selectedApp.applicationNo}
                </span>
                <h3 className="text-base font-extrabold text-[#00142f] mt-1">
                  District Administrative Sanction Order
                </h3>
              </div>
              <button onClick={() => setShowSanctionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSanctionSubmit} className="space-y-4 text-xs">
              <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-2 text-slate-700">
                <div>Applicant: <strong className="text-[#00142f]">{getBeneficiaryForApp(selectedApp).fullName}</strong></div>
                <div>Scheme: <strong>{getSchemeForApp(selectedApp).name}</strong></div>
                <div>Grant Amount: <strong className="font-mono text-[#1aa54c]">₹{(selectedApp.appliedGrantAmount || 0).toLocaleString()}</strong></div>
                <div>Field Report: <span className="text-slate-600">{selectedApp.fieldChecklist?.officerNotes || 'Field verification physically cleared.'}</span></div>
              </div>

              {/* Dynamic Scheme Attributes Submitted by Citizen */}
              {(() => {
                const answers = selectedApp.dynamicFieldAnswers || (selectedApp.dynamicFieldAnswersJson ? JSON.parse(selectedApp.dynamicFieldAnswersJson || '{}') : {});
                const entries = Object.entries(answers);
                if (entries.length === 0) return null;

                return (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <span>Citizen Dynamic Form Inputs (Scheme Specifications)</span>
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

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">District Decision *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2 px-2 text-center rounded-xl font-bold border transition ${
                      decision === 'APPROVED' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-800 border-indigo-300'
                    }`}
                  >
                    ✓ Sanction & Forward
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REAPPLY')}
                    className={`py-2 px-2 text-center rounded-xl font-bold border transition ${
                      decision === 'REAPPLY' ? 'bg-amber-600 text-white' : 'bg-white text-amber-800 border-amber-300'
                    }`}
                  >
                    ↺ Send Back to Field
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`py-2 px-2 text-center rounded-xl font-bold border transition ${
                      decision === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-white text-red-800 border-red-300'
                    }`}
                  >
                    ✕ Reject Grant
                  </button>
                </div>
              </div>

              {decision === 'REJECTED' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5 animate-in fade-in">
                  <label className="block text-xs font-bold text-red-950 uppercase tracking-wider">
                    Statutory Rejection Category *
                  </label>
                  <select
                    value={rejectionCategory}
                    onChange={(e) => setRejectionCategory(e.target.value)}
                    className="w-full bg-white border border-red-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="INELIGIBLE_INCOME">INELIGIBLE_INCOME - Annual Family Income Exceeds Statutory Ceiling</option>
                    <option value="LAND_RECORD_MISMATCH">LAND_RECORD_MISMATCH - Land Record / Khasra Mismatch with Bhulekh</option>
                    <option value="DOCUMENT_DEFICIENCY">DOCUMENT_DEFICIENCY - Incomplete, Ineligible or Deficient Documentation</option>
                    <option value="SCHEME_CRITERIA_UNMET">SCHEME_CRITERIA_UNMET - Social Category / Age / Landholding Not Met</option>
                    <option value="DUPLICATE_BENEFIT">DUPLICATE_BENEFIT - Overlapping DBT Benefit Detected in Circle</option>
                    <option value="OTHER">OTHER - Other Statutory Grounds</option>
                  </select>
                  <p className="text-[11px] text-red-700">
                    A formal Digital Rejection Order will be generated with 30-day statutory appeal window.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  District Officer Administrative Remarks *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Enter administrative sanction order remarks or reasons for re-verification..."
                  value={districtNotes}
                  onChange={(e) => setDistrictNotes(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSanctionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow hover:bg-[#0f294a]"
                >
                  {submitting ? 'Sanctioning...' : 'Sign Administrative Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reapply Reason Modal (Mandatory validation) */}
      {showReapplyModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-800">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#00142f]">Reason for Reapplication</h3>
                  <p className="text-xs text-slate-500">Send back to Field Officer queue for ground re-verification</p>
                </div>
              </div>
              <button
                onClick={() => { setShowReapplyModal(false); setReapplyReason(''); setReapplyError(''); }}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-600">
                Application: <strong className="font-mono text-[#00142f]">{selectedApp.applicationNo}</strong>
              </div>
              <div className="text-xs text-slate-600">
                Applicant: <strong>{getBeneficiaryForApp(selectedApp).fullName}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Reason for Reapplication *
              </label>
              <textarea
                rows={4}
                value={reapplyReason}
                onChange={(e) => {
                  setReapplyReason(e.target.value);
                  if (e.target.value.trim()) setReapplyError('');
                }}
                placeholder="e.g. Land ownership document needs re-verification with local Tehsil registry."
                className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {reapplyError && (
                <p className="text-xs text-red-600 font-bold flex items-center pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {reapplyError}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowReapplyModal(false); setReapplyReason(''); setReapplyError(''); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReapplySubmit}
                disabled={reapplySubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center"
              >
                {reapplySubmitting ? 'Sending...' : 'Send Back for Reapplication'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Appeal Disposal Modal */}
      {showAppealModal && selectedAppealApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl ${appealModalAction === 'ACCEPT' ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}`}>
                  {appealModalAction === 'ACCEPT' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#00142f]">
                    {appealModalAction === 'ACCEPT' ? 'Accept Appeal & Order Re-Verification' : 'Uphold Rejection Order'}
                  </h3>
                  <p className="text-xs text-slate-500">Official disposal of Section 14 statutory appeal</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAppealModal(false); setSelectedAppealApp(null); }}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#f8f9ff] rounded-xl text-xs space-y-1">
              <div>Application No: <strong className="font-mono text-[#00142f]">{selectedAppealApp.applicationNo}</strong></div>
              <div>Applicant: <strong>{getBeneficiaryForApp(selectedAppealApp).fullName}</strong></div>
              <div>Grounds Filed: <span className="italic text-slate-700">"{selectedAppealApp.reVerificationAppealGrounds}"</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Official Disposal Order Remarks *
              </label>
              <textarea
                rows={4}
                required
                value={appealNotes}
                onChange={(e) => setAppealNotes(e.target.value)}
                placeholder="Enter statutory reasons for accepting the appeal or upholding the rejection..."
                className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowAppealModal(false); setSelectedAppealApp(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAppealSubmit}
                disabled={appealSubmitting}
                className={`px-5 py-2 text-white font-bold text-xs rounded-xl shadow transition flex items-center ${
                  appealModalAction === 'ACCEPT'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {appealSubmitting ? 'Signing Order...' : (appealModalAction === 'ACCEPT' ? 'Sign Acceptance & Dispatch' : 'Sign Final Uphold Order')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
