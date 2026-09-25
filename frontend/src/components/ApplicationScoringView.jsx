import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Zap, ShieldAlert, FilePlus, ChevronRight, Calculator, AlertCircle, Star } from 'lucide-react';
import { applicationAPI } from '../services/api';
import PriorityBadge from './PriorityBadge';
import { sortByPriority } from '../utils/priority';
import { toast } from '../context/ToastContext';

export default function ApplicationScoringView({ applications, beneficiaries, schemes, currentUser, onRefresh }) {
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Find beneficiary profile matching currentUser
  const myProfile = beneficiaries.find(b => b.user?.id === currentUser?.id || b.fullName === currentUser?.fullName);

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState('');
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [appliedAmount, setAppliedAmount] = useState(45000);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (myProfile) {
      setSelectedBeneficiaryId(myProfile.id);
    } else if (beneficiaries.length > 0) {
      setSelectedBeneficiaryId(beneficiaries[0].id);
    }
  }, [myProfile, beneficiaries]);

  useEffect(() => {
    if (schemes.length > 0) {
      setSelectedSchemeId(schemes[0].id);
      if (schemes[0].maxGrantAmount) setAppliedAmount(schemes[0].maxGrantAmount);
    }
  }, [schemes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBeneficiaryId) {
      toast.warning('Please register your Beneficiary Profile first before applying for a scheme!');
      return;
    }

    setSubmitting(true);
    try {
      await applicationAPI.submit({
        beneficiaryId: Number(selectedBeneficiaryId),
        schemeId: Number(selectedSchemeId),
        appliedGrantAmount: Number(appliedAmount),
      });
      setSubmitting(false);
      setShowApplyModal(false);
      onRefresh();
      toast.success('Application submitted! Automated Eligibility Score computed.');
    } catch (err) {
      setSubmitting(false);
      toast.error('Submission failed: ' + (err.response?.data || err.message));
    }
  };

  // Filter application list by role: Beneficiaries see their own apps, Admins/Officers see all
  const isBeneficiary = currentUser?.role === 'BENEFICIARY';
  const rawVisibleApplications = isBeneficiary
    ? applications.filter(a => a.beneficiary?.user?.id === currentUser?.id || a.beneficiary?.fullName === currentUser?.fullName)
    : applications;
  const visibleApplications = sortByPriority(rawVisibleApplications);

  return (
    <div className="space-y-6 pt-24 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-[#00142f] flex items-center">
            <Calculator className="w-5 h-5 text-[#1aa54c] mr-2" />
            Automated Eligibility Scoring & Application Submission
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rules engine evaluates income criteria, social category, land holding, and region to compute eligibility score (0 - 100).
          </p>
        </div>
        <button
          onClick={() => {
            if (isBeneficiary && !myProfile) {
              toast.warning('Please register your Beneficiary Profile under "Schemes Master & Beneficiary Registry" or "Beneficiary Portal" first!');
              return;
            }
            setShowApplyModal(true);
          }}
          className="px-4 py-2.5 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold text-xs rounded-xl shadow transition flex items-center whitespace-nowrap"
        >
          <FilePlus className="w-4 h-4 mr-2" /> Submit Grant Application
        </button>
      </div>

      {isBeneficiary && !myProfile && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center space-x-3 text-xs text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="font-bold">Profile Pending:</strong> You haven't created a Beneficiary Profile yet. Please register your profile under <strong>Schemes Master & Beneficiary Registry</strong> or <strong>Beneficiary Portal</strong> before submitting an application.
          </div>
        </div>
      )}

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleApplications.length === 0 ? (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
            No grant applications submitted yet. Click <strong>Submit Grant Application</strong> above to calculate your eligibility score and apply!
          </div>
        ) : (
          visibleApplications.map((app) => {
            let scoreDetails = {};
            try {
              if (app.scoreBreakdownJson) scoreDetails = JSON.parse(app.scoreBreakdownJson);
            } catch (e) {}

            const isScore100 = (app.eligibilityScore || 0) >= 100;

            return (
              <div
                key={app.id}
                className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-[#1aa54c]/50 transition space-y-4 relative ${
                  isScore100 ? 'border-amber-400 ring-2 ring-amber-300 shadow-amber-50' : 'border-slate-200'
                }`}
              >
                {isScore100 && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-lg flex items-center justify-between shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current animate-pulse text-yellow-200" />
                      TOP PROCESSING PRIORITY &bull; SCORE 100/100
                    </span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">P1 Fast-Track</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                        {app.applicationNo}
                      </span>
                      <PriorityBadge score={app.eligibilityScore} size="sm" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {app.fastTracked && (
                        <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Zap className="w-3 h-3 mr-1 fill-emerald-600 text-emerald-600" /> FAST-TRACKED
                        </span>
                      )}
                      {app.escalated && (
                        <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                          <ShieldAlert className="w-3 h-3 mr-1 text-red-600" /> ESCALATED
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#00142f] mb-1">{app.scheme?.name}</h3>
                  <p className="text-xs text-slate-600 mb-3">Beneficiary: <strong>{app.beneficiary?.fullName}</strong> ({app.beneficiary?.region})</p>

                  {/* Score Card */}
                  <div className="bg-[#f8f9ff] rounded-xl p-4 border border-slate-200 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Eligibility Score Gauge</span>
                      <div className="flex items-center space-x-2">
                        <PriorityBadge score={app.eligibilityScore} size="sm" />
                        <span className={`text-lg font-extrabold font-mono ${isScore100 ? 'text-amber-600' : 'text-[#1aa54c]'}`}>
                          {app.eligibilityScore} / 100
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${
                          app.eligibilityScore >= 75 ? 'bg-[#1aa54c]' : app.eligibilityScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${app.eligibilityScore}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>Income Score: <strong className="text-[#00142f]">{scoreDetails.incomeScore || 25}/35</strong></div>
                      <div>Category Score: <strong className="text-[#00142f]">{scoreDetails.categoryScore || 25}/25</strong></div>
                      <div>Region Match: <strong className="text-[#00142f]">{scoreDetails.regionScore || 20}/20</strong></div>
                      <div>Doc Complete: <strong className="text-[#00142f]">{scoreDetails.docVerificationScore || 20}/20</strong></div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Applied Grant:</span>
                    <strong className="text-[#1aa54c] ml-1 font-mono">₹{(app.appliedGrantAmount || 0).toLocaleString()}</strong>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#0f294a] font-bold border border-[#c4e0ff]">
                    Stage: {app.currentStage}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#00142f] flex items-center">
              <FilePlus className="w-5 h-5 text-[#1aa54c] mr-2" />
              New Grant Application Submission
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Beneficiary Profile</label>
                {isBeneficiary && myProfile ? (
                  <div className="p-3 bg-[#eff4ff] border border-[#c4e0ff] rounded-xl text-[#00142f] font-bold">
                    {myProfile.fullName} ({myProfile.category} - {myProfile.region}) [Aadhaar: {myProfile.aadhaarNumber}]
                  </div>
                ) : (
                  <select
                    value={selectedBeneficiaryId}
                    onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  >
                    {beneficiaries.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fullName} ({b.category} - {b.region}) [Income: ₹{b.annualIncome}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Select Target Scheme</label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => {
                    setSelectedSchemeId(e.target.value);
                    const found = schemes.find(s => s.id === Number(e.target.value));
                    if (found && found.maxGrantAmount) setAppliedAmount(found.maxGrantAmount);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                >
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} [{s.schemeCode}] - Max Grant: ₹{s.maxGrantAmount}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Applied Grant Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={appliedAmount}
                  onChange={(e) => setAppliedAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a] font-mono text-sm"
                />
              </div>

              <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#c4e0ff] text-[11px] text-[#0f294a]">
                ⚡ <strong>Automated Scoring Engine:</strong> Scores &ge; 75 for grant amounts &le; ₹50,000 are fast-tracked directly to Finance Approval.
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Scoring & Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
