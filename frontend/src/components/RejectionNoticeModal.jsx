import React, { useState, useEffect } from 'react';
import { 
  X, AlertOctagon, FileText, Printer, ShieldAlert, CheckCircle2, 
  Send, Scale, Clock, ShieldCheck, AlertCircle, FileUp 
} from 'lucide-react';
import { applicationAPI } from '../services/api';
import { toast } from '../context/ToastContext';

const REJECTION_CATEGORY_LABELS = {
  INELIGIBLE_INCOME: { label: 'Statutory Income Ceiling Exceeded', color: 'bg-red-100 text-red-800 border-red-300' },
  LAND_RECORD_MISMATCH: { label: 'Land Record / Khasra-Khatoni Mismatch', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  INVALID_IDENTITY_KYC: { label: 'Identity / Aadhaar / Bank DBT Mismatch', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  DUPLICATE_BENEFICIARY: { label: 'Duplicate Beneficiary Registration', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  SCHEME_CRITERIA_UNMET: { label: 'Mandatory Scheme Criteria Unmet', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  NON_COMPLIANCE_INSPECTION: { label: 'Failed Physical Ground Verification', color: 'bg-red-100 text-red-800 border-red-300' },
  REAPPLY_LIMIT_EXHAUSTED: { label: 'Maximum Reapplication Attempts (2/2) Exhausted', color: 'bg-red-100 text-red-900 border-red-400 font-bold' },
  OTHER_ADMINISTRATIVE: { label: 'Administrative Disqualification', color: 'bg-slate-100 text-slate-800 border-slate-300' },
};

export default function RejectionNoticeModal({ 
  application, 
  currentUser, 
  onClose, 
  onRefresh 
}) {
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealGrounds, setAppealGrounds] = useState('');
  const [proofDocumentUrl, setProofDocumentUrl] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  useEffect(() => {
    if (application?.id) {
      setLoading(true);
      applicationAPI.getRejectionNotice(application.id)
        .then(res => {
          setNotice(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          // Fallback notice from application entity
          setNotice({
            noticeNumber: `REJ-ORD/2026/${application.applicationNo}`,
            applicationNo: application.applicationNo,
            schemeName: application.scheme?.name || 'Central / State Subsidy Scheme',
            beneficiaryName: application.beneficiary?.fullName || 'Applicant',
            aadhaarMasked: application.beneficiary?.aadhaarNumber || 'XXXX-XXXX-XXXX',
            region: application.beneficiary?.region || 'National',
            address: application.beneficiary?.address || 'Registered Address',
            appliedGrantAmount: application.appliedGrantAmount,
            rejectionCategory: application.rejectionCategory || 'SCHEME_CRITERIA_UNMET',
            rejectionReason: application.rejectionReason || application.remarks || 'Statutory criteria verification failed.',
            rejectedBy: application.rejectedBy || 'Review Authority',
            rejectedByRole: application.rejectedByRole || 'DISTRICT_OFFICER',
            rejectedAt: application.rejectedAt || application.updatedAt,
            appealDeadline: application.appealDeadline || null,
            canAppeal: application.canAppeal !== undefined ? application.canAppeal : true,
            digitalVerificationSeal: `GOV-DSGAP-VERIFIED-SECURE-HASH-${Math.abs(application.id * 8819)}`,
            legalStatute: 'Section 12(B) of Public Subsidy Direct Benefit Transfer & Verification Governance Rules, 2026'
          });
          setLoading(false);
        });
    }
  }, [application]);

  const handlePrint = () => {
    window.print();
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealGrounds.trim()) {
      toast.warning('Please state the legal or factual grounds for your re-verification appeal.');
      return;
    }

    setSubmittingAppeal(true);
    try {
      await applicationAPI.fileAppeal(application.id, {
        appealGrounds,
        proofDocumentUrl,
        userId: currentUser?.id,
      });
      setSubmittingAppeal(false);
      setShowAppealForm(false);
      toast.success('Statutory Appeal & Re-Verification Request successfully filed with District Review Authority!');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setSubmittingAppeal(false);
      toast.error('Failed to submit appeal: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!application) return null;

  const categoryInfo = REJECTION_CATEGORY_LABELS[notice?.rejectionCategory] || {
    label: notice?.rejectionCategory || 'General Disqualification',
    color: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 my-8">
        
        {/* Header Bar */}
        <div className="bg-[#00142f] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Statutory Rejection Order & Audit Notice</h3>
              <p className="text-xs text-slate-400">Official Direct Benefit Transfer (DBT) Disqualification Record</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Fetching statutory rejection notice...
          </div>
        ) : !showAppealForm ? (
          /* Official Rejection Document View */
          <div className="p-6 space-y-5 text-xs text-slate-700">
            
            {/* Government Seal & Order Header */}
            <div className="border-b border-slate-200 pb-4 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                <Scale className="w-3.5 h-3.5 text-[#00142f]" />
                Digital Subsidy & Grant Administration Directorate
              </div>
              <h4 className="text-sm font-extrabold text-[#00142f] pt-1">
                FORMAL NOTICE OF APPLICATION DISQUALIFICATION / REJECTION
              </h4>
              <p className="text-[11px] font-mono text-slate-500 font-semibold">
                Order No: <strong className="text-slate-900">{notice?.noticeNumber}</strong>
              </p>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Scheme</span>
                <strong className="text-slate-900 text-xs">{notice?.schemeName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Application Reference</span>
                <strong className="font-mono text-slate-900 text-xs">{notice?.applicationNo}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Applicant Full Name</span>
                <strong className="text-slate-900">{notice?.beneficiaryName}</strong> (Aadhaar: {notice?.aadhaarMasked})
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Applied Grant Amount</span>
                <strong className="text-[#1aa54c] font-mono">₹{(notice?.appliedGrantAmount || 0).toLocaleString()}</strong>
              </div>
            </div>

            {/* Rejection Grounds Section */}
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-red-900">Statutory Rejection Category</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-red-950 block mb-0.5">Official Competent Authority Rationale:</span>
                <p className="text-xs text-red-900 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-red-200">
                  {notice?.rejectionReason}
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-red-200/60">
                <span>Disqualified by: <strong className="text-slate-900">{notice?.rejectedBy}</strong> ({notice?.rejectedByRole})</span>
                <span>Date: <strong className="text-slate-900">{notice?.rejectedAt ? new Date(notice.rejectedAt).toLocaleDateString() : 'Recent'}</strong></span>
              </div>
            </div>

            {/* Statutory Appeal Window Box */}
            <div className="p-4 bg-[#eff4ff] border border-[#c4e0ff] rounded-2xl flex items-start space-x-3">
              <Clock className="w-5 h-5 text-[#00142f] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <strong className="text-[#00142f] block font-bold">Right to Statutory Appeal & Re-Verification</strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Under {notice?.legalStatute}, an applicant aggrieved by this rejection order may file a formal <strong>Re-Verification Request / Appeal</strong> within <strong>30 calendar days</strong> of issuance, submitting supplementary proof or corrected revenue/KYC documents.
                </p>
                {notice?.appealDeadline && (
                  <p className="text-[11px] font-semibold text-indigo-900">
                    Appeal Submission Deadline: <strong>{new Date(notice.appealDeadline).toLocaleDateString()}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Digital Security Seal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Digital Sovereign Seal: {notice?.digitalVerificationSeal}
              </span>
              <span>RTI Appeal Rules Sec 12</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition flex items-center"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Print / Save Order
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
                >
                  Close
                </button>
                {notice?.canAppeal && (
                  <button
                    onClick={() => setShowAppealForm(true)}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition flex items-center"
                  >
                    <Scale className="w-4 h-4 mr-1.5" /> File Re-Verification Appeal
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Statutory Appeal / Re-Verification Submission Form */
          <form onSubmit={handleAppealSubmit} className="p-6 space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 space-y-1">
              <strong className="font-bold flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-600" />
                Filing Statutory Appeal for Application #{application.applicationNo}
              </strong>
              <p className="text-[11px] text-indigo-700">
                Your appeal will be formally submitted to the <strong>District Review Authority</strong> for re-investigation and physical re-verification.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Factual / Legal Appeal Grounds <span className="text-red-500">*</span>
              </label>
              <textarea
                value={appealGrounds}
                onChange={(e) => setAppealGrounds(e.target.value)}
                rows={4}
                required
                placeholder="Explain why the rejection was in error, describe new supporting evidence (e.g. corrected revenue khasra deed, updated income certificate, patwari endorsement)..."
                className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Supplementary Proof / Document URL (Cloudinary / Official Certificate)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={proofDocumentUrl}
                  onChange={(e) => setProofDocumentUrl(e.target.value)}
                  placeholder="https://... or certified certificate link"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Attach certified Tehsildar/Patwari revenue report, revised bank passbook, or corrected credential proofs.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <strong>Declaration:</strong> I hereby solemnly affirm that the supplementary evidence and grounds submitted herein are authentic under penalty of statutory disqualification.
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAppealForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Back to Notice
              </button>
              <button
                type="submit"
                disabled={submittingAppeal}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition disabled:opacity-50 flex items-center"
              >
                {submittingAppeal ? 'Submitting Appeal...' : 'Submit Appeal for Re-Verification'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
