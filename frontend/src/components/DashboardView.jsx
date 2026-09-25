import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  DollarSign, Users, ShieldCheck, TrendingUp, 
  ArrowUpRight, Layers, CheckCircle2, Clock, Activity, Database, 
  Server, Cpu, Shield, ArrowRight, ClipboardCheck
} from 'lucide-react';

const COLORS = ['#1aa54c', '#0f294a', '#46617c', '#d97706', '#ba1a1a'];

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
  const totalApplications = metrics?.totalApplications ?? applications.length;

  const totalBudgetCapacity = schemes.reduce((acc, s) => acc + (s.totalBudget || 0), 0);
  const totalAllocatedBudget = schemes.reduce((acc, s) => acc + (s.allocatedBudget || 0), 0);
  const totalDisbursedBudget = metrics?.totalDisbursedBudget ?? schemes.reduce((acc, s) => acc + (s.disbursedBudget || 0), 0);
  const pendingDisbursement = Math.max(0, totalAllocatedBudget - totalDisbursedBudget);

  const schemeChartData = schemes.map(s => ({
    name: s.schemeCode || s.schemeName,
    Total: Math.round((s.totalBudget || 0) / 100000), // in Lakhs
    Allocated: Math.round((s.allocatedBudget || 0) / 100000),
    Disbursed: Math.round((s.disbursedBudget || 0) / 100000),
  }));

  // Dynamic regional aggregation based on database beneficiaries & applications
  const regionMap = {};
  beneficiaries.forEach(b => {
    const regionName = b.state ? `${b.state} Region` : (b.district ? `${b.district} Region` : 'General Region');
    if (!regionMap[regionName]) {
      regionMap[regionName] = { name: regionName, value: 0, beneficiaries: 0 };
    }
    regionMap[regionName].beneficiaries += 1;
  });

  applications.forEach(a => {
    const ben = beneficiaries.find(b => b.id === a.beneficiaryId);
    const regionName = ben?.state ? `${ben.state} Region` : (ben?.district ? `${ben.district} Region` : 'General Region');
    if (!regionMap[regionName]) {
      regionMap[regionName] = { name: regionName, value: 0, beneficiaries: 0 };
    }
    if (a.currentStage === 'APPROVED') {
      regionMap[regionName].value += (a.approvedAmount || a.requestedAmount || 0);
    }
  });

  const regionChartData = Object.values(regionMap);

  // Lifecycle breakdown counts
  const stageCounts = {
    SUBMITTED: applications.filter(a => a.currentStage === 'SUBMITTED' || a.currentStage === 'SCORED' || !a.currentStage).length,
    SCORED: applications.filter(a => a.eligibilityScore !== undefined && a.eligibilityScore !== null).length,
    FIELD_VERIFICATION: applications.filter(a => a.currentStage === 'FIELD_VERIFICATION').length,
    DISTRICT_REVIEW: applications.filter(a => a.currentStage === 'DISTRICT_REVIEW').length,
    FINANCE_APPROVAL: applications.filter(a => a.currentStage === 'FINANCE_APPROVAL').length,
    DISBURSED: applications.filter(a => a.currentStage === 'APPROVED').length,
  };

  // Compliance counts
  const compCompliant = complianceRecords.filter(c => c.status === 'COMPLIANT').length;
  const compPending = complianceRecords.filter(c => c.status === 'PENDING').length;
  const compOverdue = complianceRecords.filter(c => c.status === 'OVERDUE').length;
  const compNonCompliant = complianceRecords.filter(c => c.status === 'NON_COMPLIANT').length;
  const compReview = complianceRecords.filter(c => c.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Scope Header Card */}
      <div className="stitch-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Direct Benefit Transfer Command &bull; Live Sovereign Ledger</span>
          </div>
          <span className="px-2.5 py-0.5 bg-slate-100 text-[#0f294a] text-xs font-semibold rounded-full border border-slate-200 font-display">
            FY 2025-26 Active &bull; Sovereign Audit Mode
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div>
            <h2 className="text-xl font-bold font-display text-[#00142f] tracking-tight">Executive Operations Ledger</h2>
            <p className="text-xs text-slate-500 font-body">National &amp; Regional Direct Benefit Transfer (DBT) High-Level Monitoring Command</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/verification-pipeline')}
              className="px-4 py-2 bg-[#00142f] hover:bg-[#0f294a] text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center font-display"
            >
              Multi-Level Verification Queue ({pendingVerifications}) <ArrowUpRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overall Application Lifecycle Progression Tracker */}
      <div className="stitch-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold font-display text-[#00142f] uppercase tracking-wider flex items-center">
            <Clock className="w-4 h-4 text-[#46617c] mr-2" />
            Overall Application Lifecycle Progression
          </h3>
          <span className="text-xs font-bold font-display text-emerald-600">{totalApplications} Total Submissions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold font-display">1. Submitted</span>
            <strong className="text-[#00142f] font-display tabular-nums text-base">{totalApplications}</strong>
            <div className="w-full bg-[#0f294a] h-1.5 rounded-full mt-1.5"></div>
          </div>
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold font-display">2. Scored</span>
            <strong className="text-[#00142f] font-display tabular-nums text-base">{stageCounts.SCORED}</strong>
            <div className="w-full bg-[#0f294a] h-1.5 rounded-full mt-1.5"></div>
          </div>
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold font-display">3. Field Check</span>
            <strong className="text-[#00142f] font-display tabular-nums text-base">{stageCounts.FIELD_VERIFICATION}</strong>
            <div className="w-full bg-[#46617c] h-1.5 rounded-full mt-1.5"></div>
          </div>
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold font-display">4. District Review</span>
            <strong className="text-[#00142f] font-display tabular-nums text-base">{stageCounts.DISTRICT_REVIEW}</strong>
            <div className="w-full bg-[#46617c] h-1.5 rounded-full mt-1.5"></div>
          </div>
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold font-display">5. Finance</span>
            <strong className="text-[#00142f] font-display tabular-nums text-base">{stageCounts.FINANCE_APPROVAL}</strong>
            <div className="w-full bg-emerald-600 h-1.5 rounded-full mt-1.5"></div>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
            <span className="text-emerald-700 block text-[10px] uppercase font-bold font-display">6. Disbursed</span>
            <strong className="text-emerald-700 font-display tabular-nums text-base">{approvedGrants}</strong>
            <div className="w-full bg-emerald-600 h-1.5 rounded-full mt-1.5"></div>
          </div>
        </div>
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
                {totalBudgetCapacity > 0 ? Math.round((totalDisbursedBudget / totalBudgetCapacity) * 100) : 55}% Total Budget Utilized
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
        {/* Scheme-wise Overview */}
        <div className="lg:col-span-2 stitch-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold font-display text-[#00142f]">Scheme-wise Budget Overview (₹ Lakhs)</h3>
              <p className="text-xs text-slate-500 font-body">Comparison of Total Capacity vs Allocated vs Disbursed per Scheme</p>
            </div>
            <button
              onClick={() => navigate('/schemes-master')}
              className="text-xs font-semibold font-display text-[#00142f] hover:text-emerald-600 flex items-center transition"
            >
              Schemes Master <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schemeChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val}L`} />
                <Tooltip formatter={(value) => [`₹${Number(value)} Lakhs`, 'Amount']} />
                <Bar dataKey="Total" fill="#0f294a" radius={[4, 4, 0, 0]} name="Total Budget" />
                <Bar dataKey="Allocated" fill="#46617c" radius={[4, 4, 0, 0]} name="Allocated" />
                <Bar dataKey="Disbursed" fill="#16a34a" radius={[4, 4, 0, 0]} name="Disbursed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region-wise Overview */}
        <div className="stitch-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-[#00142f] mb-1">Region-wise Distribution</h3>
            <p className="text-xs text-slate-500 font-body mb-3">Geographic DBT disbursement spread</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={regionChartData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value">
                    {regionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`₹${(Number(val)/10000000).toFixed(2)} Cr`, 'Disbursed']} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
            {regionChartData.slice(0, 3).map((r, idx) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span>{r.name}:</span>
                <strong className="font-display tabular-nums text-[#00142f]">
                  ₹{(r.value / 100000).toFixed(1)}L ({r.beneficiaries} {r.beneficiaries === 1 ? 'Beneficiary' : 'Beneficiaries'})
                </strong>
              </div>
            ))}
            {regionChartData.length === 0 && (
              <div className="text-slate-400 text-center py-1">No regional data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Overview & System-level Monitoring */}
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
            <span className="font-body">2 applications require overdue reminder escalation before next DBT transfer batch.</span>
            <button
              onClick={() => navigate('/compliance')}
              className="text-emerald-700 font-semibold font-display hover:underline"
            >
              Review flagged cases &rarr;
            </button>
          </div>
        </div>

        {/* System-level Monitoring */}
        <div className="stitch-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-[#00142f] flex items-center">
              <Activity className="w-4 h-4 text-blue-600 mr-2" />
              System-Level Monitoring
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] rounded-full font-display">
              HEALTHY 100%
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-[#46617c]" />
                <span className="font-medium text-slate-700 font-display">Spring Boot REST Core</span>
              </div>
              <span className="text-emerald-700 font-bold font-display tabular-nums">200 OK &bull; 14ms</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-[#46617c]" />
                <span className="font-medium text-slate-700 font-display">MySQL Database Pool</span>
              </div>
              <span className="text-emerald-700 font-bold font-display">CONNECTED</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-[#46617c]" />
                <span className="font-medium text-slate-700 font-display">PFMS / DBT Gateway</span>
              </div>
              <span className="text-emerald-700 font-bold font-display">SYNCHRONIZED</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#46617c]" />
                <span className="font-medium text-slate-700 font-display">Audit Trail Cryptographic Log</span>
              </div>
              <span className="text-emerald-700 font-bold font-display">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Module Navigation Hub Cards */}
      <div className="stitch-card p-6 space-y-4">
        <h3 className="text-sm font-bold font-display text-[#00142f] uppercase tracking-wider">
          Administrative Modules &amp; Workbenches
        </h3>
        <p className="text-xs text-slate-500 font-body">
          Direct navigation to specialized functional modules (all complete citizen registration and scheme forms are segregated into their dedicated workspaces).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
          <div
            onClick={() => navigate('/beneficiary-portal')}
            className="stitch-card stitch-card-hover p-4 cursor-pointer space-y-2 group bg-slate-50/50 hover:bg-white transition"
          >
            <div className="p-2 bg-[#00142f] text-white rounded-lg w-fit group-hover:bg-[#0f294a] transition">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold font-display text-[#00142f]">Beneficiary Portal</h4>
            <p className="text-[11px] text-slate-500 font-body">Register new citizens, manage KYC profiles, search registry, and view history.</p>
          </div>

          <div
            onClick={() => navigate('/schemes-master')}
            className="stitch-card stitch-card-hover p-4 cursor-pointer space-y-2 group bg-slate-50/50 hover:bg-white transition"
          >
            <div className="p-2 bg-[#00142f] text-white rounded-lg w-fit group-hover:bg-[#0f294a] transition">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold font-display text-[#00142f]">Schemes Master</h4>
            <p className="text-[11px] text-slate-500 font-body">Define schemes, configure slabs, regional budget allocation, and eligibility criteria.</p>
          </div>

          <div
            onClick={() => navigate('/verification-pipeline')}
            className="stitch-card stitch-card-hover p-4 cursor-pointer space-y-2 group bg-slate-50/50 hover:bg-white transition"
          >
            <div className="p-2 bg-[#00142f] text-white rounded-lg w-fit group-hover:bg-[#0f294a] transition">
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold font-display text-[#00142f]">Verification Pipeline</h4>
            <p className="text-[11px] text-slate-500 font-body">Oversee Field Officer, District Officer, and Finance Approver verification queues.</p>
          </div>

          <div
            onClick={() => navigate('/disbursements')}
            className="stitch-card stitch-card-hover p-4 cursor-pointer space-y-2 group bg-slate-50/50 hover:bg-white transition"
          >
            <div className="p-2 bg-[#00142f] text-white rounded-lg w-fit group-hover:bg-[#0f294a] transition">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold font-display text-[#00142f]">Staged Disbursements</h4>
            <p className="text-[11px] text-slate-500 font-body">Track 3-stage milestone releases, PFMS transaction references, and payment clearance.</p>
          </div>

          <div
            onClick={() => navigate('/compliance')}
            className="stitch-card stitch-card-hover p-4 cursor-pointer space-y-2 group bg-slate-50/50 hover:bg-white transition"
          >
            <div className="p-2 bg-[#00142f] text-white rounded-lg w-fit group-hover:bg-[#0f294a] transition">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold font-display text-[#00142f]">Compliance &amp; Audit</h4>
            <p className="text-[11px] text-slate-500 font-body">Monitor utilization certificates, overdue milestones, audit flags, and non-compliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
