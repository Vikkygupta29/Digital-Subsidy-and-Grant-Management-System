import React, { useState } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle2, Clock, 
  Search, Eye, AlertOctagon, Send, X
} from 'lucide-react';
import { toast } from '../context/ToastContext';

export default function ComplianceDashboardView({ 
  complianceRecords = [], 
  onRefresh, 
  onResolveFlag 
}) {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProofModal, setActiveProofModal] = useState(null);

  // Status counts
  const totalCompliant = complianceRecords.filter(c => c.status === 'COMPLIANT').length;
  const totalPending = complianceRecords.filter(c => c.status === 'PENDING').length;
  const totalOverdue = complianceRecords.filter(c => c.status === 'OVERDUE').length;
  const totalNonCompliant = complianceRecords.filter(c => c.status === 'NON_COMPLIANT').length;
  const totalReview = complianceRecords.filter(c => c.status === 'UNDER_REVIEW').length;
  const totalFlagged = complianceRecords.filter(c => c.flagged).length;

  const filteredRecords = complianceRecords.filter(r => {
    const matchesSearch = 
      (r.applicationNo && r.applicationNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.beneficiaryName && r.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.schemeName && r.schemeName.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (selectedStatus === 'FLAGGED') {
      matchesStatus = r.flagged;
    } else if (selectedStatus !== 'ALL') {
      matchesStatus = r.status === selectedStatus;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3 h-3 mr-1" /> COMPLIANT</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><Clock className="w-3 h-3 mr-1" /> PENDING</span>;
      case 'OVERDUE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300"><AlertOctagon className="w-3 h-3 mr-1" /> OVERDUE</span>;
      case 'NON_COMPLIANT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300"><AlertTriangle className="w-3 h-3 mr-1" /> NON-COMPLIANT</span>;
      case 'UNDER_REVIEW':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300"><Clock className="w-3 h-3 mr-1" /> UNDER REVIEW</span>;
    }
  };

  const handleResolve = (record) => {
    if (!window.confirm(`Clear non-compliance flag and approve utilization proof for ${record.applicationNo}?`)) return;
    if (onResolveFlag) onResolveFlag(record.id);
    if (onRefresh) onRefresh();
    toast.success(`Compliance flag cleared for ${record.applicationNo}!`);
  };

  const handleSendReminder = (record) => {
    toast.info(`Automated SMS / Notice reminder dispatched to beneficiary ${record.beneficiaryName} for milestone "${record.milestoneName}".`);
  };

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Scope Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#00142f] rounded-2xl text-white shadow-md">
              <Shield className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-[#00142f] tracking-tight">Compliance Dashboard</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  Statutory & Utilization Audit
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Milestone Proof Inspection &bull; Overdue Monitoring &bull; Non-Compliance Flag Management &bull; Sovereign Audit Trail
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-mono">Status Standard: ISO/IEC 27001 Public Trust</span>
          </div>
        </div>

        {/* Primary 5 KPI Status Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
          <div 
            onClick={() => setSelectedStatus('COMPLIANT')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer text-center space-y-1 ${
              selectedStatus === 'COMPLIANT' ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">COMPLIANT</span>
            <strong className="text-xl font-black font-mono text-emerald-800">{totalCompliant}</strong>
            <span className="text-[10px] text-emerald-600 block">Proofs Approved</span>
          </div>

          <div 
            onClick={() => setSelectedStatus('PENDING')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer text-center space-y-1 ${
              selectedStatus === 'PENDING' ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="text-[10px] text-amber-700 font-bold uppercase block">PENDING</span>
            <strong className="text-xl font-black font-mono text-amber-800">{totalPending}</strong>
            <span className="text-[10px] text-amber-600 block">Awaiting Due Date</span>
          </div>

          <div 
            onClick={() => setSelectedStatus('UNDER_REVIEW')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer text-center space-y-1 ${
              selectedStatus === 'UNDER_REVIEW' ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-500' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span className="text-[10px] text-blue-700 font-bold uppercase block">UNDER REVIEW</span>
            <strong className="text-xl font-black font-mono text-blue-800">{totalReview}</strong>
            <span className="text-[10px] text-blue-600 block">Proof Submitted</span>
          </div>

          <div 
            onClick={() => setSelectedStatus('OVERDUE')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer text-center space-y-1 ${
              selectedStatus === 'OVERDUE' ? 'bg-red-100 border-red-400 ring-2 ring-red-500' : 'bg-red-50 border-red-200 hover:bg-red-100'
            }`}
          >
            <span className="text-[10px] text-red-700 font-bold uppercase block">OVERDUE</span>
            <strong className="text-xl font-black font-mono text-red-800">{totalOverdue}</strong>
            <span className="text-[10px] text-red-600 block">Notice Dispatched</span>
          </div>

          <div 
            onClick={() => setSelectedStatus('NON_COMPLIANT')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer text-center space-y-1 ${
              selectedStatus === 'NON_COMPLIANT' ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-500' : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span className="text-[10px] text-purple-700 font-bold uppercase block">NON-COMPLIANT</span>
            <strong className="text-xl font-black font-mono text-purple-800">{totalNonCompliant}</strong>
            <span className="text-[10px] text-purple-600 block">Audit Breached</span>
          </div>

          <div 
            onClick={() => setSelectedStatus('FLAGGED')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer text-center space-y-1 ${
              selectedStatus === 'FLAGGED' ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-slate-900' : 'bg-[#f8f9ff] border-slate-200 hover:bg-[#eff4ff]'
            }`}
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase block">FLAGGED CASES</span>
            <strong className="text-xl font-black font-mono text-[#00142f]">{totalFlagged}</strong>
            <span className="text-[10px] text-slate-500 block">Requires Action</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Application No, Beneficiary Name, Scheme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-[#00142f] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedStatus === 'ALL' ? 'bg-[#0f294a] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Records ({complianceRecords.length})
          </button>
          <button
            onClick={() => setSelectedStatus('FLAGGED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedStatus === 'FLAGGED' ? 'bg-red-600 text-white shadow' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Flagged Only ({totalFlagged})
          </button>
        </div>
      </div>

      {/* Compliance Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-[#f8f9ff] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00142f]">
            Statutory Milestone Compliance Tracking ({filteredRecords.length} Records)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Mandatory DBT Utilization Verification
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#00142f]">
            <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-4">Application & Scheme</th>
                <th className="p-4">Beneficiary</th>
                <th className="p-4">Milestone & Tranche</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Compliance Status</th>
                <th className="p-4">Reminder Status</th>
                <th className="p-4">Utilization Proof</th>
                <th className="p-4 text-right">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No compliance records match the search and status filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className={`hover:bg-[#f8f9ff] transition ${r.flagged ? 'bg-red-50/40' : ''}`}>
                    <td className="p-4">
                      <div className="font-mono font-bold text-[#00142f]">{r.applicationNo}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">{r.schemeName}</div>
                      {r.flagged && (
                        <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full mt-1">
                          <AlertTriangle className="w-3 h-3 mr-1" /> FLAG: {r.flagReason}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <strong className="text-[#00142f] text-sm">{r.beneficiaryName}</strong>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-800">Stage {r.stageNumber}: {r.milestoneName}</div>
                      <div className="font-mono text-[#1aa54c] font-bold">₹{(r.scheduledAmount || 0).toLocaleString()}</div>
                    </td>

                    <td className="p-4 whitespace-nowrap font-mono text-slate-600">
                      {r.dueDate}
                    </td>

                    <td className="p-4">
                      {getStatusBadge(r.status)}
                    </td>

                    <td className="p-4 text-slate-600 text-[11px]">
                      {r.reminderStatus || 'Scheduled'}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {r.proofDocumentUrl ? (
                        <button
                          onClick={() => setActiveProofModal(r)}
                          className="px-2.5 py-1 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00142f] rounded-lg border border-[#c4e0ff] font-bold text-[11px] inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" /> View Proof
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not Uploaded</span>
                      )}
                    </td>

                    <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                      {r.status === 'OVERDUE' && (
                        <button
                          onClick={() => handleSendReminder(r)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-[11px] inline-flex items-center"
                        >
                          <Send className="w-3 h-3 mr-1" /> Notice
                        </button>
                      )}

                      {r.flagged ? (
                        <button
                          onClick={() => handleResolve(r)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] inline-flex items-center"
                        >
                          Clear Flag
                        </button>
                      ) : (
                        r.status === 'UNDER_REVIEW' && (
                          <button
                            onClick={() => handleResolve(r)}
                            className="px-2.5 py-1 bg-[#00142f] hover:bg-[#0f294a] text-white rounded-lg font-bold text-[11px] inline-flex items-center"
                          >
                            Approve Proof
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Utilization Proof Document & History Modal */}
      {activeProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                  {activeProofModal.applicationNo}
                </span>
                <h3 className="text-base font-extrabold text-[#00142f] mt-1">
                  Utilization Certificate & Compliance Proof
                </h3>
              </div>
              <button onClick={() => setActiveProofModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-1.5">
                <div>Beneficiary: <strong className="text-[#00142f]">{activeProofModal.beneficiaryName}</strong></div>
                <div>Milestone: <strong className="text-[#00142f]">{activeProofModal.milestoneName}</strong></div>
                <div>Tranche Amount: <strong className="font-mono text-[#1aa54c]">₹{(activeProofModal.scheduledAmount || 0).toLocaleString()}</strong></div>
                <div>Observations / Proof Remarks: <strong className="text-slate-700">{activeProofModal.proofRemarks || 'Invoice submitted'}</strong></div>
              </div>

              {/* Document Image Preview */}
              {activeProofModal.proofDocumentUrl && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 block">Uploaded Supporting Document (Cloudinary Registry):</span>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100 flex items-center justify-center">
                    <img 
                      src={activeProofModal.proofDocumentUrl} 
                      alt="Compliance Proof"
                      className="w-full h-full object-cover max-h-64"
                    />
                  </div>
                </div>
              )}

              {/* Compliance Audit Trail */}
              {activeProofModal.history && (
                <div className="space-y-2 pt-1">
                  <span className="font-bold text-slate-700 block uppercase text-[11px]">Audit Event Trail:</span>
                  <div className="space-y-1.5 border-l-2 border-[#1aa54c] pl-3">
                    {activeProofModal.history.map((h, i) => (
                      <div key={i} className="text-[11px] text-slate-600">
                        <strong className="text-[#00142f]">{h.date}</strong> &bull; {h.action} <span className="text-slate-400">({h.by})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveProofModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close Preview
              </button>
              {activeProofModal.status === 'UNDER_REVIEW' && (
                <button
                  onClick={() => {
                    handleResolve(activeProofModal);
                    setActiveProofModal(null);
                  }}
                  className="px-4 py-2 bg-[#00142f] text-white font-bold rounded-xl text-xs shadow hover:bg-[#0f294a]"
                >
                  Approve Compliance Proof
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
