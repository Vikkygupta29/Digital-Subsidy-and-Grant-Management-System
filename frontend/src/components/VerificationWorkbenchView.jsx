import React, { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Upload, Eye, ExternalLink, Star } from 'lucide-react';
import { workflowAPI } from '../services/api';
import PriorityBadge from './PriorityBadge';
import { sortByPriority } from '../utils/priority';
import { toast } from '../context/ToastContext';

export default function VerificationWorkbenchView({ applications, currentUser, onRefresh }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);

  // Action Form
  const [stage, setStage] = useState('FIELD_VERIFICATION');
  const [decision, setDecision] = useState('APPROVED');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedApp) {
      workflowAPI.getHistoryByApplication(selectedApp.id)
        .then(res => setWorkflows(res.data))
        .catch(() => {
          workflowAPI.getByApplication(selectedApp.id)
            .then(res => setWorkflows(res.data))
            .catch(err => console.error(err));
        });
    }
  }, [selectedApp]);

  const handleProcessDecision = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('applicationId', selectedApp.id);
      formData.append('stage', stage);
      formData.append('performedById', currentUser ? currentUser.id : 1);
      formData.append('decision', decision);
      formData.append('notes', notes);
      if (proofFile) formData.append('proofDocument', proofFile);

      await workflowAPI.submitDecision(formData);
      setSubmitting(false);
      setShowActionModal(false);
      setNotes('');
      setProofFile(null);
      onRefresh();

      // Refresh local workflow audit timeline
      const updated = await workflowAPI.getHistoryByApplication(selectedApp.id);
      setWorkflows(updated.data);

      toast.success(`Workflow action (${decision}) processed successfully!`);
    } catch (err) {
      setSubmitting(false);
      toast.error('Failed to process action: ' + (err.response?.data || err.message));
    }
  };

  // Filter applications by role relevance
  const role = currentUser ? currentUser.role : 'ADMIN';
  const pendingApps = sortByPriority(applications.filter(a => {
    if (role === 'FIELD_OFFICER') return a.currentStage === 'FIELD_VERIFICATION';
    if (role === 'DISTRICT_OFFICER') return a.currentStage === 'DISTRICT_REVIEW' || a.escalated;
    if (role === 'FINANCE_APPROVER') return a.currentStage === 'FINANCE_APPROVAL';
    return true;
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Verification Queue List */}
      <div className="lg:col-span-1 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center">
              <ClipboardCheck className="w-4 h-4 text-emerald-400 mr-2" />
              Verification Queue
            </h3>
            <p className="text-[11px] text-slate-400">Queue for Role: <strong className="text-emerald-400">{role}</strong></p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full">
            {pendingApps.length} Pending
          </span>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {pendingApps.map((app) => {
            const isScore100 = (app.eligibilityScore || 0) >= 100;
            return (
              <div
                key={app.id}
                onClick={() => {
                  setSelectedApp(app);
                  if (role === 'FIELD_OFFICER') setStage('FIELD_VERIFICATION');
                  else if (role === 'DISTRICT_OFFICER') setStage('DISTRICT_REVIEW');
                  else if (role === 'FINANCE_APPROVER') setStage('FINANCE_APPROVAL');
                }}
                className={`p-4 rounded-xl border transition cursor-pointer relative ${
                  isScore100 ? 'border-amber-400 ring-1 ring-amber-400/50 bg-slate-900/90' :
                  selectedApp?.id === app.id
                    ? 'bg-slate-700/80 border-emerald-500 shadow-md shadow-emerald-950'
                    : 'bg-slate-900/80 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                {isScore100 && (
                  <div className="mb-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> TOP PRIORITY (100)
                    </span>
                    <span>P1 Fast-Track</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs font-bold text-emerald-400">{app.applicationNo}</span>
                    <PriorityBadge score={app.eligibilityScore} size="sm" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {app.currentStage}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{app.scheme?.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1">Applicant: <strong className="text-slate-200">{app.beneficiary?.fullName}</strong></p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  <span>Score: <strong className="text-emerald-400 font-mono">{app.eligibilityScore}/100</strong></span>
                  <span>Amount: <strong className="text-white font-mono">₹{(app.appliedGrantAmount || 0).toLocaleString()}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Application Details & Workflow Timeline */}
      <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-lg space-y-6">
        {selectedApp ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-extrabold text-emerald-400">{selectedApp.applicationNo}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedApp.currentStage}
                  </span>
                  {selectedApp.reapplyCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Reapplications: {selectedApp.reapplyCount}
                    </span>
                  )}
                  {selectedApp.status === 'REAPPLY_REQUIRED' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      REAPPLICATION REQUIRED
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{selectedApp.scheme?.name}</h2>
              </div>
              <button
                onClick={() => setShowActionModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" /> Take Verification Action
              </button>
            </div>

            {/* Last Reapplication Alert */}
            {selectedApp.lastReapplyReason && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center text-amber-300">
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  Last Action: Reapplied by {selectedApp.lastReappliedByRole || 'Officer'}
                </div>
                <div>Reason: <span className="italic font-medium">"{selectedApp.lastReapplyReason}"</span></div>
                {selectedApp.lastReappliedAt && (
                  <div className="text-[10px] text-amber-400/80">Date: {new Date(selectedApp.lastReappliedAt).toLocaleString()}</div>
                )}
              </div>
            )}

            {/* Applicant Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block">Beneficiary Name</span>
                <strong className="text-white">{selectedApp.beneficiary?.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Aadhaar / ID</span>
                <strong className="text-slate-200 font-mono">{selectedApp.beneficiary?.aadhaarNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Category / Region</span>
                <strong className="text-amber-300">{selectedApp.beneficiary?.category} ({selectedApp.beneficiary?.region})</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Identity Document</span>
                {selectedApp.beneficiary?.identityDocumentUrl ? (
                  <a
                    href={selectedApp.beneficiary?.identityDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center font-bold"
                  >
                    View Cloudinary File <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                ) : (
                  <span className="text-slate-500 italic">No file</span>
                )}
              </div>
            </div>

            {/* Workflow Timeline */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                <RefreshCw className="w-4 h-4 text-emerald-400 mr-2" />
                Complete Bidirectional Workflow History & Audit Trail
              </h3>
              {workflows.length === 0 ? (
                <div className="p-6 bg-slate-900/60 rounded-xl border border-slate-700/40 text-center text-xs text-slate-400 italic">
                  No verification actions recorded yet for this application.
                </div>
              ) : (
                <div className="space-y-3">
                  {workflows.map((wf) => (
                    <div key={wf.id} className="p-4 bg-slate-900/90 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            wf.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            wf.decision === 'REAPPLY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            wf.decision === 'RESUBMITTED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            wf.decision === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {wf.action || wf.decision}
                          </span>
                          {(wf.fromStage || wf.toStage) && (
                            <span className="font-mono text-[11px] text-slate-400">
                              {wf.fromStage || wf.stage} ➔ {wf.toStage || wf.stage}
                            </span>
                          )}
                          <span className="text-slate-500">by</span>
                          <strong className="text-emerald-400">{wf.performedBy?.fullName || wf.performedByUsername || 'Officer'}</strong>
                          {wf.performedByRole && (
                            <span className="text-[10px] text-slate-400">({wf.performedByRole})</span>
                          )}
                        </div>
                        {(wf.reason || wf.groundNotes) && (
                          <p className="text-slate-300 pt-1">
                            <strong>Remarks:</strong> {wf.reason || wf.groundNotes}
                          </p>
                        )}
                        {wf.proofDocumentUrl && (
                          <a
                            href={wf.proofDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-blue-400 hover:underline pt-1 text-[11px]"
                          >
                            <Upload className="w-3 h-3 mr-1" /> View Evidence Document
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{new Date(wf.actionTimestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400">
            <ClipboardCheck className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">Select an Application from the Queue</p>
            <p className="text-xs text-slate-500 mt-1">Review ground details, uploaded identity proofs, and execute multi-level approval sign-offs.</p>
          </div>
        )}
      </div>

      {/* Workflow Action Modal */}
      {showActionModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center">
              <ClipboardCheck className="w-5 h-5 text-emerald-400 mr-2" />
              Verification Sign-off for {selectedApp.applicationNo}
            </h3>
            <form onSubmit={handleProcessDecision} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Verification Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="FIELD_VERIFICATION">Field Officer Ground Verification</option>
                  <option value="DISTRICT_REVIEW">District Officer Review</option>
                  <option value="FINANCE_APPROVAL">Finance Approver Fund Release Sign-off</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Decision Action</label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="APPROVED">APPROVED (Advance to next stage / Final approve)</option>
                  <option value="FLAGGED_ESCALATED">FLAGGED FOR ESCALATION (Escalate to District Officer)</option>
                  <option value="RE_VERIFICATION_REQUESTED">REQUEST RE-VERIFICATION (Send back to Field Officer)</option>
                  <option value="REJECTED">REJECT APPLICATION</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Verification Ground Notes & Remarks</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter detailed ground verification findings, document checks, or escalation reason..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {(role === 'FIELD_OFFICER' || stage === 'FIELD_VERIFICATION') && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Field Site Photo / Inspection Document (Uploads to Cloudinary)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-300 focus:outline-none"
                  />
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    Cloudinary destination: hkxztbcu/subsidy_grant_docs
                  </span>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  {submitting ? 'Submitting to Cloudinary...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
