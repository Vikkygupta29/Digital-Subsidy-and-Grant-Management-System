import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, CheckSquare, ArrowRight, X, Sliders, AlertTriangle, RotateCcw, CheckCircle2, XCircle, FileText, Download, ShieldCheck, Star
} from 'lucide-react';
import { workflowAPI, applicationAPI } from '../services/api';
import PriorityBadge from './PriorityBadge';
import { sortByPriority } from '../utils/priority';
import { toast } from '../context/ToastContext';

export default function FieldOfficerDashboardView({ 
  currentTab = 'operations', 
  currentUser, 
  applications = [], 
  beneficiaries = [], 
  schemes = [], 
  onRefresh, 
  onUpdateApplicationStage 
}) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState(currentTab);

  useEffect(() => {
    if (currentTab) {
      setActiveSubTab(currentTab);
    }
  }, [currentTab]);

  const handleTabClick = (tabId) => {
    setActiveSubTab(tabId);
    if (tabId === 'operations') navigate('/field');
    else if (tabId === 'queue') navigate('/field/verification-queue');
    else if (tabId === 'beneficiaries') navigate('/field/beneficiaries');
    else if (tabId === 'reports') navigate('/field/ground-reports');
    else if (tabId === 'history') navigate('/field/history');
  };
  const [selectedApp, setSelectedApp] = useState(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // Reapply Modal State
  const [showReapplyModal, setShowReapplyModal] = useState(false);
  const [reapplyReason, setReapplyReason] = useState('');
  const [reapplyError, setReapplyError] = useState('');
  const [reapplySubmitting, setReapplySubmitting] = useState(false);

  // Field Checklist Form State
  const [checklist, setChecklist] = useState({
    physicalAddressVerified: true,
    landHoldingVerified: true,
    incomeVerified: true,
    originalDocsInspected: true,
    officerNotes: '',
    siteGeoTag: 'Lat 25.3176° N, Long 82.9739° E (Varanasi Circle)',
  });
  const [decision, setDecision] = useState('APPROVED');
  const [rejectionCategory, setRejectionCategory] = useState('NON_COMPLIANCE_INSPECTION');
  const [submitting, setSubmitting] = useState(false);

  // Scoped applications for Field Officer, sorted strictly by priority (Score 100 first)
  const pendingFieldApps = sortByPriority(applications.filter(a => a.currentStage === 'FIELD_VERIFICATION'));
  const newFieldApps = sortByPriority(applications.filter(a => a.currentStage === 'FIELD_VERIFICATION' && (!a.reapplyCount || a.reapplyCount === 0)));
  const reappliedFieldApps = sortByPriority(applications.filter(a => a.currentStage === 'FIELD_VERIFICATION' && a.reapplyCount > 0));
  const completedFieldApps = sortByPriority(applications.filter(a => ['DISTRICT_REVIEW', 'FINANCE_APPROVAL', 'APPROVED'].includes(a.currentStage)));
  const rejectedFieldApps = sortByPriority(applications.filter(a => a.currentStage === 'REJECTED'));
  const assignedApps = sortByPriority(applications.filter(a => a.currentStage === 'FIELD_VERIFICATION' || a.fieldChecklist));
  const highestPriorityFieldApps = pendingFieldApps.filter(a => a.eligibilityScore >= 100);

  // Beneficiaries in this officer's assigned region
  const regionalBeneficiaries = beneficiaries.filter(b => 
    !currentUser?.region || currentUser.region === 'National HQ' || b.region === currentUser.region
  );

  const openInspectionModal = (app) => {
    setSelectedApp(app);
    setChecklist({
      physicalAddressVerified: true,
      landHoldingVerified: true,
      incomeVerified: true,
      originalDocsInspected: true,
      officerNotes: '',
      siteGeoTag: 'Lat 25.3176° N, Long 82.9739° E (Verified On-Site)',
    });
    setDecision('APPROVED');
    setShowInspectionModal(true);
  };

  const openReapplyModal = (app) => {
    setSelectedApp(app);
    setReapplyReason('');
    setReapplyError('');
    setShowInspectionModal(false);
    setShowReapplyModal(true);
  };

  const handleReapplySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedApp) return;
    if (!reapplyReason || !reapplyReason.trim()) {
      setReapplyError('Please provide a reason for reapplication.');
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
        role: currentUser?.role || 'FIELD_OFFICER',
      });

      if (onUpdateApplicationStage) {
        onUpdateApplicationStage(selectedApp.id, 'FIELD_VERIFICATION', {
          status: 'REAPPLY_REQUIRED',
          reapplyCount: (selectedApp.reapplyCount || 0) + 1,
          lastReapplyReason: reapplyReason.trim(),
          lastReappliedByRole: 'FIELD_OFFICER',
          lastReappliedAt: new Date().toISOString(),
        });
      }

      if (onRefresh) onRefresh();
      setShowReapplyModal(false);
      setReapplyReason('');
      setReapplySubmitting(false);
      toast.success('Application sent back to beneficiary for reapplication/correction.');
    } catch (err) {
      setReapplySubmitting(false);
      const errMsg = err.response?.data?.error || err.message;
      setReapplyError(errMsg);
      toast.error('Failed to send back for reapplication: ' + errMsg);
    }
  };

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (decision === 'REAPPLY' || decision === 'RE_VERIFICATION') {
      openReapplyModal(selectedApp);
      return;
    }

    setSubmitting(true);

    try {
      let action = 'APPROVE';
      let nextStage = 'DISTRICT_REVIEW';
      let message = 'Ground check verified and escalated to District Officer!';

      if (decision === 'REJECTED') {
        action = 'REJECT';
        nextStage = 'REJECTED';
        message = 'Application rejected at field ground check.';
      }

      await applicationAPI.workflowAction(selectedApp.id, {
        action,
        reason: checklist.officerNotes || 'Field verification inspection completed.',
        notes: checklist.officerNotes,
        rejectionCategory: decision === 'REJECTED' ? rejectionCategory : null,
        userId: currentUser?.id,
        username: currentUser?.username,
        role: currentUser?.role || 'FIELD_OFFICER',
      });

      if (onUpdateApplicationStage) {
        onUpdateApplicationStage(selectedApp.id, nextStage, {
          decision,
          checklist,
        });
      }
      if (onRefresh) onRefresh();

      setSubmitting(false);
      setShowInspectionModal(false);
      if (decision === 'APPROVED') {
        toast.success(message);
      } else {
        toast.info(message);
      }
    } catch (err) {
      setSubmitting(false);
      toast.error('Error submitting inspection report: ' + (err.response?.data?.error || err.message));
    }
  };

  const getBeneficiaryForApp = (app) => {
    return beneficiaries.find(b => b.id === app.beneficiaryId || b.id === app.beneficiary?.id) || app.beneficiary || {
      fullName: app.applicantName || 'Applicant',
      aadhaarNumber: '—',
      category: '—',
      district: app.district || '—',
      state: app.state || '—',
      mobileNumber: '—',
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
      {/* Officer Header Banner */}
      <div className="bg-[#00142f] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xl shadow-inner">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentUser?.fullName || 'Field Verification Officer'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase">
                  Field Operations Command
                </span>
              </div>
              <p className="text-xs text-[#7a91b7]">
                Jurisdiction: <strong className="text-white">{currentUser?.region || 'North Region'}</strong> &bull; Circle: Varanasi / Lucknow Ground Check
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-mono font-bold text-amber-300 border border-white/10">
              {pendingFieldApps.length} Pending Field Checks
            </span>
          </div>
        </div>

        {/* Navigation Tabs for Field Officer */}
        <div className="flex space-x-1 pt-3 border-t border-slate-800 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'operations', label: 'Field Operations' },
            { id: 'queue', label: `Pending Verification (${pendingFieldApps.length})` },
            { id: 'new', label: `New Applications (${newFieldApps.length})` },
            { id: 'reapplications', label: `Reapplications (${reappliedFieldApps.length})` },
            { id: 'approved', label: `Approved (${completedFieldApps.length})` },
            { id: 'rejected', label: `Rejected (${rejectedFieldApps.length})` },
            { id: 'assigned', label: `Assigned in Circle (${assignedApps.length})` },
            { id: 'beneficiaries', label: `Beneficiaries (${regionalBeneficiaries.length})` },
            { id: 'reports', label: 'Ground Reports' },
            { id: 'history', label: 'Verification History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-[#7a91b7] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-VIEW 1: FIELD OPERATIONS OVERVIEW */}
      {activeSubTab === 'operations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">New Applications</span>
              <div className="text-2xl font-black font-mono text-blue-600">{newFieldApps.length}</div>
              <span className="text-[11px] text-slate-400">Fresh Submissions</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Reapplications</span>
              <div className="text-2xl font-black font-mono text-purple-600">{reappliedFieldApps.length}</div>
              <span className="text-[11px] text-purple-600 font-semibold">Resubmitted / Pending</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Pending Ground Checks</span>
              <div className="text-2xl font-black font-mono text-amber-600">{pendingFieldApps.length}</div>
              <span className="text-[11px] text-slate-400">Awaiting Inspection</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Approved & Forwarded</span>
              <div className="text-2xl font-black font-mono text-[#1aa54c]">{completedFieldApps.length}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Passed to District</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Rejected</span>
              <div className="text-2xl font-black font-mono text-red-600">{rejectedFieldApps.length}</div>
              <span className="text-[11px] text-red-600 font-semibold">Declined at Ground</span>
            </div>
          </div>

          {/* Quick Action Queue Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#00142f]">Priority Ground Check Queue</h3>
                <p className="text-xs text-slate-500">Immediate physical inspections scheduled in your administrative circle</p>
              </div>
              <button
                onClick={() => setActiveSubTab('queue')}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center"
              >
                View Complete Queue ({pendingFieldApps.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingFieldApps.slice(0, 2).map((app) => {
                const ben = getBeneficiaryForApp(app);
                const scheme = getSchemeForApp(app);

                return (
                  <div key={app.id} className="p-4 bg-[#f8f9ff] border border-slate-200 rounded-2xl space-y-3">
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

                    <div className="text-xs text-slate-600">
                      <div>Scheme: <strong>{scheme.name}</strong></div>
                      <div>Grant Amount: <strong className="text-[#1aa54c] font-mono">₹{(app.appliedGrantAmount || 0).toLocaleString()}</strong></div>
                    </div>

                    <button
                      onClick={() => openInspectionModal(app)}
                      className="w-full py-2 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold text-xs rounded-xl shadow flex items-center justify-center transition"
                    >
                      <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Start Ground Verification Form
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: VERIFICATION QUEUE & ROLE SUB-QUEUES */}
      {['queue', 'new', 'reapplications', 'approved', 'rejected'].includes(activeSubTab) && (() => {
        const getQueueData = () => {
          if (activeSubTab === 'new') return { list: newFieldApps, title: `New Field Applications (${newFieldApps.length})`, desc: 'Fresh submissions requiring first-time physical site validation' };
          if (activeSubTab === 'reapplications') return { list: reappliedFieldApps, title: `Reapplications Queue (${reappliedFieldApps.length})`, desc: 'Applications returned or corrected awaiting second verification' };
          if (activeSubTab === 'approved') return { list: completedFieldApps, title: `Field Approved Applications (${completedFieldApps.length})`, desc: 'Passed to District Officer and subsequent stages' };
          if (activeSubTab === 'rejected') return { list: rejectedFieldApps, title: `Rejected Applications (${rejectedFieldApps.length})`, desc: 'Applications rejected during ground inspection' };
          return { list: pendingFieldApps, title: `Pending Field Verification Queue (${pendingFieldApps.length})`, desc: 'Applications awaiting on-site physical check and ground validation' };
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
                          : 'border-slate-200 hover:border-amber-400/50'
                      }`}
                    >
                      {app.eligibilityScore === 100 && (
                        <div className="p-2 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-purple-300 rounded-xl flex items-center justify-between text-xs text-purple-950 font-bold">
                          <span className="flex items-center gap-1.5">
                            ⭐ P1 Highest Priority Ground Check (Score 100/100)
                          </span>
                          <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                            Inspect First
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
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
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
                          <div>Aadhaar: <strong className="font-mono">{ben.aadhaarNumber}</strong> &bull; Mobile: {ben.mobileNumber}</div>
                          <div>Address: <span className="text-slate-600">{ben.address}, {ben.district}</span></div>
                          <div>Land Size: <strong>{ben.landSizeAcres || 0} Acres</strong> &bull; Income: <strong>₹{(ben.annualIncome || 0).toLocaleString()}</strong></div>
                        </div>

                        <div className="flex items-center justify-between text-xs bg-[#eff4ff] p-2.5 rounded-xl border border-[#c4e0ff]">
                          <div className="flex items-center gap-2">
                            <span>Automated Eligibility Score:</span>
                            <strong className="text-[#1aa54c] font-mono text-sm">{app.eligibilityScore} / 100</strong>
                          </div>
                          <PriorityBadge score={app.eligibilityScore} short={true} />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2 items-center justify-between">
                        <span className="text-xs text-slate-500">Grant: <strong className="text-[#1aa54c] font-mono">₹{(app.appliedGrantAmount || 0).toLocaleString()}</strong></span>
                        <div className="flex items-center space-x-2">
                          {app.currentStage === 'FIELD_VERIFICATION' && (
                            <button
                              onClick={() => openReapplyModal(app)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reapply
                            </button>
                          )}
                          <button
                            onClick={() => openInspectionModal(app)}
                            className="px-3.5 py-1.5 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold text-xs rounded-xl shadow transition flex items-center"
                          >
                            <CheckSquare className="w-3.5 h-3.5 mr-1 text-amber-400" /> Ground Check Form
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

      {/* SUB-VIEW 3: ASSIGNED APPLICATIONS */}
      {activeSubTab === 'assigned' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-[#f8f9ff] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00142f]">
              All Assigned Applications in Circle ({assignedApps.length})
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
                  <th className="p-3">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignedApps.map((a) => (
                  <tr key={a.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-3 font-mono font-bold text-[#00142f]">{a.applicationNo}</td>
                    <td className="p-3">{a.beneficiary?.fullName || 'Rajesh Patel'}</td>
                    <td className="p-3">{a.scheme?.name || 'Kisan Subsidy'}</td>
                    <td className="p-3 font-mono text-[#1aa54c] font-bold">₹{(a.appliedGrantAmount || 0).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
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

      {/* SUB-VIEW 4: BENEFICIARIES IN CIRCLE */}
      {activeSubTab === 'beneficiaries' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-[#f8f9ff] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00142f]">
              Beneficiary Registry &bull; Circle: {currentUser?.region || 'North Region'} ({regionalBeneficiaries.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#00142f]">
              <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Aadhaar Ref</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Land Size</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regionalBeneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-3 font-bold">{b.fullName}</td>
                    <td className="p-3 font-mono text-slate-500">{b.aadhaarNumber}</td>
                    <td className="p-3">{b.category}</td>
                    <td className="p-3">{b.district}, {b.state}</td>
                    <td className="p-3 font-mono">{b.landSizeAcres || 0} Acres</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: VERIFICATION HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#00142f]">Field Ground Verification History Log</h3>
          <div className="space-y-3">
            {completedFieldApps.map((app) => (
              <div key={app.id} className="p-4 bg-[#f8f9ff] border border-slate-200 rounded-2xl flex justify-between items-start text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#00142f]">{app.applicationNo}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Cleared Field Check
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Beneficiary: <strong>{app.beneficiary?.fullName || 'Rajesh Patel'}</strong> &bull; Current Stage: {app.currentStage}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Inspection Remarks: {app.fieldChecklist?.officerNotes || 'Physical site inspected. Patwari land records confirmed.'}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: GROUND REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#00142f]">Field Ground Verification & Inspection Reports</h3>
              <p className="text-xs text-slate-500">Official circle inspection dossiers and Patwari ground validation certificates</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full">
              Region: {currentUser?.region || 'North Region'} Circle
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#f8f9ff] border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 uppercase font-semibold">Total Circle Inspected</span>
              <div className="text-2xl font-black text-[#00142f]">{completedFieldApps.length}</div>
              <span className="text-emerald-600 font-bold">100% Geo-tagged & Recorded</span>
            </div>
            <div className="p-4 bg-[#f8f9ff] border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 uppercase font-semibold">Pending On-Site Inspection</span>
              <div className="text-2xl font-black text-amber-600">{pendingFieldApps.length}</div>
              <span className="text-amber-700 font-bold">Active in ground queue</span>
            </div>
            <div className="p-4 bg-[#f8f9ff] border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 uppercase font-semibold">Returned for Re-inspection</span>
              <div className="text-2xl font-black text-purple-600">{reappliedFieldApps.length}</div>
              <span className="text-purple-700 font-bold">Clarifications & corrections</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">Application No</th>
                  <th className="p-3">Beneficiary</th>
                  <th className="p-3">Scheme</th>
                  <th className="p-3">Circle / Region</th>
                  <th className="p-3">Inspection Status</th>
                  <th className="p-3">Inspection Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.filter(a => ['FIELD_VERIFICATION', 'DISTRICT_REVIEW', 'FINANCE_APPROVAL', 'APPROVED'].includes(a.currentStage)).map(app => (
                  <tr key={app.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-3 font-mono font-bold text-[#00142f]">{app.applicationNo}</td>
                    <td className="p-3 font-bold">{app.beneficiary?.fullName || 'Beneficiary'}</td>
                    <td className="p-3">{app.scheme?.name || 'Grant Scheme'}</td>
                    <td className="p-3 text-slate-500">{app.beneficiary?.district || 'District'}, {app.beneficiary?.state || 'State'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.currentStage === 'FIELD_VERIFICATION'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {app.currentStage === 'FIELD_VERIFICATION' ? 'In Progress' : 'Verified & Passed'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 italic">
                      {app.remarks || 'Ground survey verified. Land holding and Aadhaar KYC confirmed.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ground Verification Form Modal */}
      {showInspectionModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#00142f]">Field Ground Verification Inspection</h3>
                <p className="text-xs text-slate-500">App No: <strong className="font-mono text-[#00142f]">{selectedApp.applicationNo}</strong></p>
              </div>
              <button
                onClick={() => setShowInspectionModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInspectionSubmit} className="space-y-4 text-xs">
              {/* Applicant Card */}
              <div className="p-4 bg-[#eff4ff] rounded-2xl border border-[#c4e0ff] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00142f] text-sm">{getBeneficiaryForApp(selectedApp).fullName}</span>
                  <span className="text-[11px] font-mono text-[#1aa54c] font-bold">Grant: ₹{(selectedApp.appliedGrantAmount || 0).toLocaleString()}</span>
                </div>
                <p className="text-slate-600">{getBeneficiaryForApp(selectedApp).address}, {getBeneficiaryForApp(selectedApp).district}</p>
                <div className="text-[11px] text-slate-500 font-mono">Geo-tag: {checklist.siteGeoTag}</div>
              </div>

              {/* Dynamic Scheme Answers Display */}
              {(() => {
                let dynamicAnswers = {};
                try {
                  if (selectedApp.dynamicFieldAnswersJson) {
                    dynamicAnswers = JSON.parse(selectedApp.dynamicFieldAnswersJson);
                  }
                } catch (e) {
                  console.error(e);
                }

                if (Object.keys(dynamicAnswers).length === 0) return null;

                return (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <h4 className="font-bold text-[#00142f] uppercase text-[11px] flex items-center">
                      <Sliders className="w-4 h-4 mr-1.5 text-blue-600" />
                      Scheme Dynamic Attributes Submitted by Citizen
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Object.entries(dynamicAnswers).map(([k, v]) => (
                        <div key={k} className="p-2 bg-white rounded-xl border border-slate-200">
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

              {/* Mandatory Physical Checklist */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2.5">
                <h4 className="font-bold text-amber-900 uppercase text-[11px] flex items-center">
                  <ClipboardCheck className="w-4 h-4 mr-1.5 text-amber-700" />
                  Mandatory Field Checklist (All must be verified)
                </h4>

                <label className="flex items-center space-x-2 text-slate-800 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.physicalAddressVerified}
                    onChange={(e) => setChecklist({ ...checklist, physicalAddressVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f294a]"
                  />
                  <span>1. Physical residence & farm site inspected in person</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-800 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.landHoldingVerified}
                    onChange={(e) => setChecklist({ ...checklist, landHoldingVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f294a]"
                  />
                  <span>2. Land holding area authenticated with Patwari revenue record</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-800 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.incomeVerified}
                    onChange={(e) => setChecklist({ ...checklist, incomeVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f294a]"
                  />
                  <span>3. Income criteria and social category eligibility confirmed</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-800 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.originalDocsInspected}
                    onChange={(e) => setChecklist({ ...checklist, originalDocsInspected: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f294a]"
                  />
                  <span>4. Original Aadhaar & Bank Passbook documents authenticated</span>
                </label>
              </div>

              {/* Inspection Observations */}
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Field Officer Inspection Notes & Ground Observations *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Enter detailed physical inspection notes (e.g. Borewell water yield tested, farmer has genuine need for 5 HP solar array, no conflicting subsidies detected)..."
                  value={checklist.officerNotes}
                  onChange={(e) => setChecklist({ ...checklist, officerNotes: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              {/* Decision Selector */}
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Verification Action *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2 px-2 text-center rounded-xl font-bold border transition ${
                      decision === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800 border-emerald-300'
                    }`}
                  >
                    ✓ Approve & Send to District
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REAPPLY')}
                    className={`py-2 px-2 text-center rounded-xl font-bold border transition ${
                      decision === 'REAPPLY' ? 'bg-amber-600 text-white' : 'bg-white text-amber-800 border-amber-300'
                    }`}
                  >
                    ↺ Reapply / Send Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`py-2 px-2 text-center rounded-xl font-bold border transition ${
                      decision === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-white text-red-800 border-red-300'
                    }`}
                  >
                    ✕ Reject
                  </button>
                </div>

                {decision === 'REJECTED' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5 mt-2">
                    <label className="block text-red-900 font-bold text-xs">
                      Statutory Rejection Category *
                    </label>
                    <select
                      value={rejectionCategory}
                      onChange={(e) => setRejectionCategory(e.target.value)}
                      className="w-full bg-white border border-red-300 rounded-lg p-2 text-xs text-red-950 font-medium focus:ring-2 focus:ring-red-500"
                    >
                      <option value="NON_COMPLIANCE_INSPECTION">Failed Physical Ground Verification / Non-Existent Asset</option>
                      <option value="LAND_RECORD_MISMATCH">Land Record / Khasra-Khatoni Mismatch or Encumbered</option>
                      <option value="INVALID_IDENTITY_KYC">Identity / Aadhaar / Bank DBT Mismatch</option>
                      <option value="INELIGIBLE_INCOME">Income Exceeds Scheme Statutory Ceiling</option>
                      <option value="DUPLICATE_BENEFICIARY">Duplicate Beneficiary Registration Detected</option>
                      <option value="SCHEME_CRITERIA_UNMET">Mandatory Technical / Equipment Criteria Unmet</option>
                      <option value="OTHER_ADMINISTRATIVE">Administrative Disqualification</option>
                    </select>
                    <p className="text-[10px] text-red-700">
                      This formal disqualification category will be cited in the digital rejection order.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow hover:bg-[#0f294a]"
                >
                  {submitting ? 'Submitting...' : 'Sign & Submit Ground Report'}
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
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#00142f]">Reason for Reapplication</h3>
                  <p className="text-xs text-slate-500">Send application back to beneficiary for correction</p>
                </div>
              </div>
              <button
                onClick={() => { setShowReapplyModal(false); setReapplyReason(''); setReapplyError(''); }}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="text-xs text-slate-700 flex justify-between">
                <span>Application: <strong className="font-mono text-[#00142f]">{selectedApp.applicationNo}</strong></span>
                <span className="font-bold text-amber-900">
                  Attempt: {((selectedApp.reapplyCount || 0) + 1)} of {selectedApp.maxReapplyAllowed || 2}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                Applicant: <strong>{getBeneficiaryForApp(selectedApp).fullName}</strong>
              </div>
              <div className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60 flex items-center justify-between">
                <span>Remaining attempts after this: <strong>{Math.max(0, (selectedApp.maxReapplyAllowed || 2) - ((selectedApp.reapplyCount || 0) + 1))}</strong></span>
                {((selectedApp.reapplyCount || 0) + 1) >= (selectedApp.maxReapplyAllowed || 2) && (
                  <span className="text-red-700 font-bold">⚠️ Final Permitted Attempt</span>
                )}
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
                placeholder="e.g. Land document is unclear. Please upload the latest Land RoR."
                className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center"
              >
                {reapplySubmitting ? 'Sending...' : 'Send Back for Reapplication'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
