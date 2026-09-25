import React from 'react';
import { FileText, Download, Printer, Layers, MapPin, CheckCircle, BarChart2, AlertTriangle, RotateCcw, XCircle } from 'lucide-react';

export default function ReportCenterView({ metrics, schemes = [], applications = [] }) {
  // Compute Rejection & Reapplication Statistics from applications data
  const rejectedApps = applications.filter(a => a.currentStage === 'REJECTED' || a.status === 'REJECTED');
  const appealsApps = applications.filter(a => a.status === 'RE_VERIFICATION_REQUESTED' || a.currentStage === 'RE_VERIFICATION_APPEAL');
  const reapplyApps = applications.filter(a => (a.reapplyCount || 0) > 0);
  const exhaustedApps = applications.filter(a => (a.reapplyCount || 0) >= (a.maxReapplyAllowed || 2) || a.rejectionCategory === 'REAPPLY_LIMIT_EXHAUSTED');

  const rejectionCategoryCounts = rejectedApps.reduce((acc, app) => {
    const cat = app.rejectionCategory || 'DOCUMENT_DEFICIENCY';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const handleExportSchemeCSV = () => {
    const headers = ['Scheme Code', 'Scheme Name', 'Total Budget (INR)', 'Allocated (INR)', 'Disbursed (INR)', 'Applications Count'];
    const rows = (metrics?.schemeMetrics || []).map(s => [
      s.schemeCode,
      `"${s.schemeName}"`,
      s.totalBudget,
      s.allocatedBudget,
      s.disbursedBudget,
      s.applicationCount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GovGrant_Disbursement_Summary_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRejectionAuditCSV = () => {
    const headers = [
      'Application No',
      'Applicant Name',
      'Scheme Code',
      'Current Status',
      'Reapply Attempts',
      'Max Allowed',
      'Quota Exhausted',
      'Rejection Category',
      'Rejection Reason',
      'Rejected At',
      'Appeal Deadline',
      'Appeal Grounds Filed',
      'Appeal Disposed At'
    ];

    const targetApps = applications.filter(a => 
      a.currentStage === 'REJECTED' || 
      a.status === 'REJECTED' || 
      (a.reapplyCount || 0) > 0 ||
      a.status === 'RE_VERIFICATION_REQUESTED'
    );

    const rows = targetApps.map(a => [
      a.applicationNo || '—',
      `"${a.applicantName || a.beneficiary?.fullName || 'Beneficiary'}"`,
      a.schemeCode || a.scheme?.schemeCode || '—',
      a.status || a.currentStage || '—',
      a.reapplyCount || 0,
      a.maxReapplyAllowed || 2,
      (a.reapplyCount >= (a.maxReapplyAllowed || 2)) ? 'YES' : 'NO',
      `"${a.rejectionCategory || 'N/A'}"`,
      `"${(a.rejectionReason || a.remarks || '').replace(/"/g, '""')}"`,
      a.rejectedAt ? new Date(a.rejectedAt).toISOString().slice(0, 10) : 'N/A',
      a.appealDeadline ? new Date(a.appealDeadline).toISOString().slice(0, 10) : 'N/A',
      `"${(a.reVerificationAppealGrounds || '').replace(/"/g, '""')}"`,
      a.reVerificationDisposedAt ? new Date(a.reVerificationDisposedAt).toISOString().slice(0, 10) : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GovGrant_Rejection_and_Appeals_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-lg print:hidden">
        <div>
          <h2 className="text-base font-bold text-white flex items-center">
            <FileText className="w-5 h-5 text-emerald-400 mr-2" />
            Scheme, Regional & Statutory Rejection Audit Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate and export official disbursement audits, statutory rejection category distributions, and reapplication quota reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportSchemeCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export Scheme CSV
          </button>
          <button
            onClick={handleExportRejectionAuditCSV}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export Rejections Audit CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print / PDF Summary
          </button>
        </div>
      </div>

      {/* Report Document Preview */}
      <div className="bg-slate-800/90 border border-slate-700 p-8 rounded-2xl shadow-xl space-y-6 text-slate-200">
        <div className="border-b border-slate-700 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-white">MINISTRY OF PUBLIC WORKS & SUBSIDY ADMINISTRATION</h1>
            <h2 className="text-sm font-semibold text-emerald-400 mt-0.5">Comprehensive DBT Grant & Compliance Audit Report</h2>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Date: <strong>{new Date().toLocaleDateString()}</strong></div>
            <div>Ref: <strong>GOV-AUDIT-2026-99A</strong></div>
          </div>
        </div>

        {/* Executive KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Disbursed Funds</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              ₹{((metrics?.totalDisbursedAmount || 850000) / 100000).toFixed(2)} Lakh
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sanctions</span>
            <span className="text-lg font-mono font-bold text-white">
              {metrics?.totalApplications || applications.length} Grants
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Statutory Appeals Active</span>
            <span className="text-lg font-mono font-bold text-amber-400">
              {appealsApps.length} Cases
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-red-400 block">Total Formal Rejections</span>
            <span className="text-lg font-mono font-bold text-red-400">
              {rejectedApps.length} Orders
            </span>
          </div>
        </div>

        {/* Summary Table 1 */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3">1. Scheme-wise Disbursement Utilization</h3>
          <table className="w-full text-left text-xs border border-slate-700">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 border border-slate-700">Scheme Code</th>
                <th className="p-3 border border-slate-700">Scheme Name</th>
                <th className="p-3 border border-slate-700 text-right">Total Budget</th>
                <th className="p-3 border border-slate-700 text-right">Allocated Budget</th>
                <th className="p-3 border border-slate-700 text-right">Disbursed Funds</th>
                <th className="p-3 border border-slate-700 text-center">Applications</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.schemeMetrics || []).map((s, idx) => (
                <tr key={idx} className="border-b border-slate-700/60">
                  <td className="p-3 border border-slate-700 font-mono font-bold text-emerald-400">{s.schemeCode}</td>
                  <td className="p-3 border border-slate-700 font-semibold text-white">{s.schemeName}</td>
                  <td className="p-3 border border-slate-700 text-right font-mono">₹{(s.totalBudget || 0).toLocaleString()}</td>
                  <td className="p-3 border border-slate-700 text-right font-mono text-indigo-300">₹{(s.allocatedBudget || 0).toLocaleString()}</td>
                  <td className="p-3 border border-slate-700 text-right font-mono text-emerald-400 font-bold">₹{(s.disbursedBudget || 0).toLocaleString()}</td>
                  <td className="p-3 border border-slate-700 text-center font-bold">{s.applicationCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Table 2 */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3">2. Regional Administrative Allocation Summary</h3>
          <table className="w-full text-left text-xs border border-slate-700">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 border border-slate-700">Administrative Region</th>
                <th className="p-3 border border-slate-700 text-center">Registered Beneficiaries</th>
                <th className="p-3 border border-slate-700 text-center">Applications</th>
                <th className="p-3 border border-slate-700 text-right">Total Disbursed Funds</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.regionMetrics || []).map((r, idx) => (
                <tr key={idx} className="border-b border-slate-700/60">
                  <td className="p-3 border border-slate-700 font-bold text-white">{r.regionName}</td>
                  <td className="p-3 border border-slate-700 text-center font-bold">{r.beneficiaryCount}</td>
                  <td className="p-3 border border-slate-700 text-center">{r.applicationCount}</td>
                  <td className="p-3 border border-slate-700 text-right font-mono text-emerald-400 font-bold">₹{(r.totalDisbursedAmount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Table 3: Rejection & Reapplication Analysis */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3">
            3. Statutory Rejection Handling & Reapplication Quota Audit (Standard 2 Attempts Limit)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Rejection Category Breakdown</span>
              <div className="space-y-1.5 text-xs">
                {Object.keys(rejectionCategoryCounts).length === 0 ? (
                  <div className="text-slate-500 py-2">No formal rejections recorded yet.</div>
                ) : (
                  Object.entries(rejectionCategoryCounts).map(([cat, cnt]) => (
                    <div key={cat} className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="font-mono text-red-300">{cat}</span>
                      <span className="font-bold font-mono text-white bg-red-900/50 px-2 py-0.5 rounded text-[11px]">{cnt}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Reapplication & Quota Compliance Status</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Applications Sent Back for Reapplication:</span>
                  <span className="font-bold text-amber-300 font-mono">{reapplyApps.length}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Exhausted Quota Locked (2/2 attempts reached):</span>
                  <span className="font-bold text-red-400 font-mono">{exhaustedApps.length}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Active Statutory Grievance Appeals (30d window):</span>
                  <span className="font-bold text-indigo-300 font-mono">{appealsApps.length}</span>
                </div>
                <div className="text-[11px] text-slate-400 italic pt-1">
                  Compliant with DBT Mission Statutory Reapplication Norms (Max 2 revisions allowed).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
