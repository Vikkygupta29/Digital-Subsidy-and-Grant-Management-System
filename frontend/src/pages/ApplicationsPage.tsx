import React, { useState } from 'react';
import {
  useApplications,
  useCreateApplication,
  useReverifyApplication,
} from '../hooks/useApplications';
import { useSchemes } from '../hooks/useSchemes';
import { useBeneficiaries } from '../hooks/useBeneficiaries';
import ApplicationPipeline from '../components/applications/ApplicationPipeline';
import ApplicationModal from '../components/applications/ApplicationModal';
import Badge from '../components/common/Badge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import Toast from '../components/common/Toast';
import type { ApplicationRequest, ApplicationResponse } from '../types/api';
import { FileCheck2, Plus, RefreshCw, Search } from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const { data: applications = [], isLoading, error } = useApplications();
  const { data: schemes = [] } = useSchemes();
  const { data: beneficiaries = [] } = useBeneficiaries();

  const createApplicationMutation = useCreateApplication();
  const reverifyApplicationMutation = useReverifyApplication();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toString().includes(searchQuery);

    const matchesStage = stageFilter === 'ALL' || app.currentStage === stageFilter;

    return matchesSearch && matchesStage;
  });

  const handleApplySubmit = async (data: ApplicationRequest) => {
    try {
      await createApplicationMutation.mutateAsync(data);
      setToast({
        type: 'success',
        message: 'Application submitted! Eligibility score evaluated.',
      });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Submission failed' });
    }
  };

  const handleReverify = async (app: ApplicationResponse) => {
    try {
      await reverifyApplicationMutation.mutateAsync({
        id: app.id,
        remarks: 'Resubmitted updated documentation for reverification.',
      });
      setToast({
        type: 'success',
        message: 'Application resubmitted for officer reverification.',
      });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Reverification request failed' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileCheck2 className="h-6 w-6 text-indigo-600 mr-2" /> Subsidy Applications
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track workflow progress across verification stages.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Submit New Application
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, scheme, name..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500 uppercase">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Stages</option>
            <option value="FIELD_REVIEW">Field Review</option>
            <option value="DISTRICT_REVIEW">District Review</option>
            <option value="FINANCE_REVIEW">Finance Review</option>
            <option value="APPROVED_FUNDS_DISBURSED">Approved & Disbursed</option>
            <option value="REVERIFY_REQUESTED">Reverify Requested</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm">
          Failed to load applications.
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <FileCheck2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-800">No applications match criteria</h3>
          <p className="text-xs text-gray-500 mt-1">Submit a new application to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md">
                      App #{app.id}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{app.schemeName}</h3>
                    <Badge stage={app.currentStage} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Beneficiary: <span className="font-semibold text-gray-800">{app.beneficiaryName}</span> •
                    Requested: <span className="font-bold text-emerald-700">₹{app.requestedAmount?.toLocaleString()}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block uppercase font-semibold">
                      Eligibility Score
                    </span>
                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {app.eligibilityScore}% ({app.eligibilityResult})
                    </span>
                  </div>

                  {app.currentStage === 'REVERIFY_REQUESTED' && (
                    <button
                      onClick={() => handleReverify(app)}
                      disabled={reverifyApplicationMutation.isPending}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Resubmit Info
                    </button>
                  )}
                </div>
              </div>

              {/* Purpose & Remarks */}
              <div className="my-3 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                <p>
                  <strong className="text-gray-700">Purpose:</strong> {app.purpose}
                </p>
                {app.remarks && (
                  <p className="mt-1 text-indigo-900 font-medium">
                    <strong className="text-indigo-700">Officer Remarks:</strong> {app.remarks}
                  </p>
                )}
              </div>

              {/* Multi-Stage Visual Pipeline */}
              <ApplicationPipeline currentStage={app.currentStage} />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplySubmit}
        schemes={schemes}
        beneficiaries={beneficiaries}
        isLoading={createApplicationMutation.isPending}
      />

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ApplicationsPage;
