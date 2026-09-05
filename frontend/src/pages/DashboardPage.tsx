import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApplications, usePendingApplications } from '../hooks/useApplications';
import { useAnalytics } from '../hooks/useAnalytics';
import { useSchemes } from '../hooks/useSchemes';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  IndianRupee,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import Badge from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const { data: applications = [], isLoading: appsLoading } = useApplications();
  const { data: pendingApps = [], isLoading: pendingLoading } = usePendingApplications();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: schemes = [] } = useSchemes();

  const isOfficer =
    role === 'FIELD_OFFICER' ||
    role === 'DISTRICT_OFFICER' ||
    role === 'FINANCE_APPROVER';

  const approvedAppsCount = applications.filter(
    (a) => a.currentStage === 'APPROVED_FUNDS_DISBURSED'
  ).length;

  const totalFundsDisbursed = applications
    .filter((a) => a.currentStage === 'APPROVED_FUNDS_DISBURSED')
    .reduce((sum, a) => sum + (a.requestedAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            {role?.replace('_', ' ')} PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.email}
          </h1>
          <p className="mt-1 text-indigo-100 text-sm max-w-xl">
            Digital Subsidy & Grant Management System. Manage applications, review
            eligibility scores, and disburse grant funds through automated verification.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/schemes"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm transition-all"
            >
              Browse Active Schemes <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
            {isOfficer && (
              <Link
                to="/review-queue"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/40 text-white hover:bg-indigo-500/60 backdrop-blur-md border border-white/20 transition-all"
              >
                View Review Queue ({pendingApps.length})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Applications
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {appsLoading ? '...' : analytics?.totalApplications ?? applications.length}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Submitted in portal</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {isOfficer ? 'Pending Review' : 'Active Pipeline'}
            </p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">
              {pendingLoading
                ? '...'
                : isOfficer
                ? pendingApps.length
                : analytics?.activeInPipeline ??
                  applications.filter(
                    (a) =>
                      a.currentStage !== 'APPROVED_FUNDS_DISBURSED' &&
                      a.currentStage !== 'REJECTED'
                  ).length}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Awaiting verification stage</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Fully Approved
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {analyticsLoading ? '...' : analytics?.fullyApproved ?? approvedAppsCount}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> Approved & verified
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Funds Disbursed
            </p>
            <h3 className="text-xl font-black text-gray-900 mt-1 flex items-center">
              ₹
              {analyticsLoading
                ? '...'
                : (analytics?.totalFundsDisbursed ?? totalFundsDisbursed).toLocaleString()}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Total grant payout</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
            <Link
              to="/applications"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>

          {appsLoading ? (
            <LoadingSkeleton count={3} />
          ) : applications.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No applications found</p>
              <p className="text-xs text-gray-500 mt-1">
                Select a subsidy scheme to submit your first application.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-gray-900">
                        #{app.id} - {app.schemeName}
                      </span>
                      <Badge stage={app.currentStage} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Beneficiary: <span className="font-medium">{app.beneficiaryName}</span> •
                      Requested: ₹{app.requestedAmount?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      Score: {app.eligibilityScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Subsidy Schemes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Award className="h-5 w-5 text-indigo-600 mr-2" /> Active Schemes
              </h2>
              <Link to="/schemes" className="text-xs font-bold text-indigo-600">
                Catalog
              </Link>
            </div>

            <div className="space-y-3">
              {schemes.slice(0, 3).map((scheme) => (
                <div
                  key={scheme.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors"
                >
                  <p className="font-bold text-sm text-gray-900">{scheme.name}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-emerald-700 font-bold">
                      Grant: ₹{scheme.grantAmount.toLocaleString()}
                    </span>
                    <Link
                      to="/applications"
                      className="text-xs text-indigo-600 font-semibold flex items-center hover:underline"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1" /> Apply
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Schemes feature automated eligibility scoring criteria based on beneficiary region
              and income bounds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
