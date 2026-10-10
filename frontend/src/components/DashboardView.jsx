import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, Users, TrendingUp, ArrowUpRight, Layers, CheckCircle2, Clock, Shield, ArrowRight
} from 'lucide-react';

export default function DashboardView({ metrics, schemes = [], applications = [], beneficiaries = [], complianceRecords = [], loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-600 font-medium">
        <div className="w-6 h-6 border-2 border-[#1aa54c] border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading Executive Operations Ledger...
      </div>
    );
  }

  // Calculate live aggregates if backend metrics are not yet aggregated
  const totalBeneficiaries = metrics?.totalBeneficiaries ?? beneficiaries.length;
  const totalSchemes = metrics?.totalSchemes ?? schemes.length;
  const approvedGrants = metrics?.approvedGrants ?? applications.filter(a => a.currentStage === 'APPROVED').length;
  const pendingVerifications = metrics?.pendingVerifications ?? applications.filter(a => ['FIELD_VERIFICATION', 'DISTRICT_REVIEW', 'FINANCE_APPROVAL'].includes(a.currentStage)).length;
  const totalBudgetCapacity = metrics?.totalBudgetCapacity ?? schemes.reduce((acc, s) => acc + (s.totalBudget || 0), 0);
  const totalAllocatedBudget = metrics?.totalAllocatedBudget ?? schemes.reduce((acc, s) => acc + (s.allocatedBudget || 0), 0);
  const totalDisbursedBudget = metrics?.totalDisbursedBudget ?? schemes.reduce((acc, s) => acc + (s.disbursedBudget || 0), 0);
  const pendingDisbursement = Math.max(0, totalAllocatedBudget - totalDisbursedBudget);

  const schemeChartData = (metrics?.schemeMetrics || schemes).map(s => ({
    name: s.schemeName || s.name || s.schemeCode,
    Allocated: Math.round((s.allocatedBudget || 0) / 100000),
    Disbursed: Math.round((s.disbursedBudget || 0) / 100000),
  }));

  const regionChartData = (metrics?.regionMetrics || []).map(region => ({
    name: region.regionName,
    value: region.totalDisbursedAmount || 0,
    beneficiaries: region.beneficiaryCount || 0,
  }));

  // Compliance counts
  const compCompliant = complianceRecords.filter(c => c.status === 'COMPLIANT').length;
  const compPending = complianceRecords.filter(c => c.status === 'PENDING').length;
  const compOverdue = complianceRecords.filter(c => c.status === 'OVERDUE').length;
  const compNonCompliant = complianceRecords.filter(c => c.status === 'NON_COMPLIANT').length;
  const compReview = complianceRecords.filter(c => c.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6 pt-2 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-[#00142f] tracking-tight">Admin Dashboard</h2>
          <p className="text-xs text-slate-500 font-body">Live overview of beneficiaries, applications, schemes, and funds.</p>
        </div>
        <button
          onClick={() => navigate('/verification-pipeline')}
          className="px-4 py-2 bg-[#00142f] hover:bg-[#0f294a] text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center font-display"
        >
          Review pending applications ({pendingVerifications}) <ArrowUpRight className="w-4 h-4 ml-1.5" />
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stitch-card stitch-card-hover p-5 space-y-2 border-t-2 border-t-[#0f294a]">
          <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold font-display">
            <span>Total Beneficiaries</span>
            <Users className="w-4 h-4 text-[#46617c]" />
          </div>
          <div className="text-2xl font-bold text-[#00142f] font-display tabular-nums">{totalBeneficiaries}</div>
          <div className="text-xs text-emerald-600 font-medium flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Direct Benefit Registry Active
          </div>
        </div>

        <div className="stitch-card stitch-card-hover p-5 space-y-2 border-t-2 border-t-[#46617c]">
          <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold font-display">
            <span>Active Schemes</span>
            <Layers className="w-4 h-4 text-[#46617c]" />
          </div>
          <div className="text-2xl font-bold text-[#00142f] font-display tabular-nums">{totalSchemes}</div>
          <div className="text-xs text-slate-500">Central &amp; State Master Data</div>
        </div>

        <div className="stitch-card stitch-card-hover p-5 space-y-2 border-t-2 border-t-emerald-600">
          <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold font-display">
            <span>Approved Grants</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-display tabular-nums">{approvedGrants}</div>
          <div className="text-xs text-slate-500">Multi-Level Verified</div>
        </div>

        <div className="stitch-card stitch-card-hover p-5 space-y-2 border-t-2 border-t-amber-500">
          <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold font-display">
            <span>Pending Verification</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-display tabular-nums">{pendingVerifications}</div>
          <div className="text-xs text-slate-500">Field &amp; District Queues</div>
        </div>

        {/* Hero Budget Banner - Overall Disbursement Status */}
        <div className="sm:col-span-2 lg:col-span-4 bg-[#0f294a] text-white rounded-xl p-6 shadow-sm space-y-4 border border-slate-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center font-display">
              <DollarSign className="w-4 h-4 mr-1 text-emerald-400" /> Overall Disbursement Status (PFMS/DBT Direct Transfer)
            </span>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-xs font-semibold text-emerald-300 border border-white/20 font-display">
                {totalBudgetCapacity > 0 ? Math.round((totalDisbursedBudget / totalBudgetCapacity) * 100) : 0}% Total Budget Utilized
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-500/30 font-display">
                DBT Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block font-display">Total Disbursed Funds</span>
              <h3 className="text-2xl lg:text-3xl font-extrabold font-display tabular-nums tracking-tight text-white">
                ₹{totalDisbursedBudget.toLocaleString()}
              </h3>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block font-display">Allocated Under Active Schemes</span>
              <h3 className="text-2xl lg:text-3xl font-extrabold font-display tabular-nums tracking-tight text-blue-200">
                ₹{totalAllocatedBudget.toLocaleString()}
              </h3>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block font-display">Total Scheme Budget Capacity</span>
              <h3 className="text-2xl lg:text-3xl font-extrabold font-display tabular-nums tracking-tight text-slate-300">
                ₹{totalBudgetCapacity.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalDisbursedBudget / totalBudgetCapacity) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-display tabular-nums">
              <span>Disbursed: ₹{(totalDisbursedBudget / 10000000).toFixed(2)} Cr</span>
              <span>Pending Pipeline: ₹{(pendingDisbursement / 10000000).toFixed(2)} Cr</span>
              <span>Total Cap: ₹{(totalBudgetCapacity / 10000000).toFixed(2)} Cr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Compliance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple Scheme Funding Overview */}
        <div className="lg:col-span-2 stitch-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold font-display text-[#00142f]">Scheme Funding</h3>
              <p className="text-xs text-slate-500 font-body">Clear view of approved and paid funds</p>
            </div>
            <button
              onClick={() => navigate('/schemes-master')}
              className="text-xs font-semibold font-display text-[#00142f] hover:text-emerald-600 flex items-center transition"
            >
              Schemes Master <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {schemeChartData.map((scheme) => {
              const allocated = scheme.Allocated * 100000;
              const disbursed = scheme.Disbursed * 100000;
              const paidPercent = allocated > 0 ? Math.min(100, (disbursed / allocated) * 100) : 0;
              return (
                <div key={scheme.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-700 truncate">{scheme.name}</span>
                    <span className="shrink-0 text-slate-500">
                      ₹{disbursed.toLocaleString()} paid / ₹{allocated.toLocaleString()} allocated
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${paidPercent}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-400">{Math.round(paidPercent)}% paid</div>
                </div>
              );
            })}
            {schemeChartData.length === 0 && <div className="text-slate-400 text-center py-8 text-xs">No scheme funding data available</div>}
          </div>
        </div>

        {/* Simple Region Overview */}
        <div className="stitch-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-[#00142f] mb-1">Regional Payments</h3>
            <p className="text-xs text-slate-500 font-body mb-4">Paid amount and beneficiaries by region</p>
            <div className="space-y-4">
              {regionChartData.map((region) => {
                const largestPayment = Math.max(...regionChartData.map(item => item.value), 1);
                return (
                  <div key={region.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{region.name}</span>
                      <strong className="text-[#00142f]">₹{(region.value / 100000).toFixed(1)}L</strong>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${(region.value / largestPayment) * 100}%` }}></div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{region.beneficiaries} {region.beneficiaries === 1 ? 'beneficiary' : 'beneficiaries'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {regionChartData.length === 0 && <div className="text-slate-400 text-center py-8 text-xs">No regional payment data available</div>}
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Overview */}
        <div className="lg:col-span-2 stitch-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-display text-[#00142f] flex items-center">
                <Shield className="w-4 h-4 text-emerald-600 mr-2" />
                Compliance Overview &amp; Milestones Audit
              </h3>
              <p className="text-xs text-slate-500 font-body">Utilization certificate status across all approved grant disbursements</p>
            </div>
            <button
              onClick={() => navigate('/compliance')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-[#00142f] text-xs font-semibold rounded-lg border border-slate-200 flex items-center transition font-display"
            >
              Open Compliance Module <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block font-display">Compliant</span>
              <strong className="text-emerald-800 text-lg font-display tabular-nums font-bold">{compCompliant}</strong>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-amber-800 font-bold uppercase block font-display">Pending</span>
              <strong className="text-amber-800 text-lg font-display tabular-nums font-bold">{compPending}</strong>
            </div>
            <div className="bg-orange-50/70 border border-orange-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-orange-800 font-bold uppercase block font-display">Under Review</span>
              <strong className="text-orange-800 text-lg font-display tabular-nums font-bold">{compReview}</strong>
            </div>
            <div className="bg-red-50/70 border border-red-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-red-800 font-bold uppercase block font-display">Overdue</span>
              <strong className="text-red-800 text-lg font-display tabular-nums font-bold">{compOverdue}</strong>
            </div>
            <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-lg text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-purple-800 font-bold uppercase block font-display">Non-Compliant</span>
              <strong className="text-purple-800 text-lg font-display tabular-nums font-bold">{compNonCompliant}</strong>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="font-body">
              {compOverdue > 0 ? `${compOverdue} compliance item${compOverdue === 1 ? '' : 's'} need attention.` : 'No overdue compliance items.'}
            </span>
            <button
              onClick={() => navigate('/compliance')}
              className="text-emerald-700 font-semibold font-display hover:underline"
            >
              Review flagged cases &rarr;
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
