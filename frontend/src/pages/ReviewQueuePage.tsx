import React, { useState } from 'react';
import { usePendingApplications, useVerifyApplication } from '../hooks/useApplications';
import { useAuth } from '../hooks/useAuth';
import type { ApplicationResponse, VerificationRequest } from '../types/api';
import VerificationModal from '../components/applications/VerificationModal';
import Badge from '../components/common/Badge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import Toast from '../components/common/Toast';
import { CheckCircle2, UserCheck, Search } from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const { user } = useAuth();
  const { data: pendingApps = [], isLoading, error } = usePendingApplications();
  const verifyMutation = useVerifyApplication();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<ApplicationResponse | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const filteredApps = pendingApps.filter(
    (app) =>
      app.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toString().includes(searchQuery)
  );

  const handleOpenVerify = (app: ApplicationResponse) => {
    setSelectedApp(app);
    setIsVerifyModalOpen(true);
  };

  const handleVerificationSubmit = async (id: number, data: VerificationRequest) => {
    try {
      await verifyMutation.mutateAsync({ id, data });
      setToast({
        type: 'success',
        message: `Decision '${data.decision}' submitted successfully for App #${id}.`,
      });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Verification submission failed' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
          <CheckCircle2 className="h-6 w-6 text-indigo-600 mr-2" /> Officer Review Queue
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Applications requiring review for your stage role: <span className="font-bold text-indigo-700">{user?.role}</span>
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter pending review queue..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Queue Content */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm">
          Failed to load pending queue.
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-gray-200">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-800">All clear! Queue is empty.</h3>
          <p className="text-xs text-gray-500 mt-1">
            No pending applications require verification at your stage right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                    App #{app.id}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{app.schemeName}</h3>
                  <Badge stage={app.currentStage} />
                </div>

                <p className="text-xs text-gray-600">
                  Beneficiary: <span className="font-semibold text-gray-900">{app.beneficiaryName}</span> (ID #{app.beneficiaryId})
                </p>

                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-gray-500">
                    Grant Requested: <strong className="text-emerald-700">₹{app.requestedAmount?.toLocaleString()}</strong>
                  </span>
                  <span className="text-gray-500">
                    Eligibility Score:{' '}
                    <strong className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                      {app.eligibilityScore}% ({app.eligibilityResult})
                    </strong>
                  </span>
                </div>

                <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100 max-w-2xl">
                  "{app.purpose}"
                </p>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-center">
                <button
                  onClick={() => handleOpenVerify(app)}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
                >
                  <UserCheck className="h-4 w-4 mr-1.5" /> Verify & Action
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      <VerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onSubmit={handleVerificationSubmit}
        application={selectedApp}
        isLoading={verifyMutation.isPending}
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

export default ReviewQueuePage;
