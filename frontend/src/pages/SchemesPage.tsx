import React, { useState } from 'react';
import { useSchemes, useCreateScheme, useUpdateScheme } from '../hooks/useSchemes';
import { useCreateApplication } from '../hooks/useApplications';
import { useBeneficiaries } from '../hooks/useBeneficiaries';
import type { SchemeResponse, SchemeRequest, ApplicationRequest } from '../types/api';
import { useAuth } from '../hooks/useAuth';
import SchemeCard from '../components/schemes/SchemeCard';
import SchemeFormModal from '../components/schemes/SchemeFormModal';
import ApplicationModal from '../components/applications/ApplicationModal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import Toast from '../components/common/Toast';
import { FolderKanban, Plus, Search } from 'lucide-react';

export const SchemesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data: schemes = [], isLoading, error } = useSchemes();
  const { data: beneficiaries = [] } = useBeneficiaries();

  const createSchemeMutation = useCreateScheme();
  const updateSchemeMutation = useUpdateScheme();
  const createApplicationMutation = useCreateApplication();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState<boolean>(false);
  const [editingScheme, setEditingScheme] = useState<SchemeResponse | null>(null);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | undefined>();

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const filteredSchemes = schemes.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingScheme(null);
    setIsSchemeModalOpen(true);
  };

  const handleOpenEdit = (scheme: SchemeResponse) => {
    setEditingScheme(scheme);
    setIsSchemeModalOpen(true);
  };

  const handleOpenApply = (scheme: SchemeResponse) => {
    setSelectedSchemeId(scheme.id);
    setIsApplyModalOpen(true);
  };

  const handleSchemeSubmit = async (data: SchemeRequest) => {
    try {
      if (editingScheme) {
        await updateSchemeMutation.mutateAsync({ id: editingScheme.id, data });
        setToast({ type: 'success', message: 'Scheme updated successfully' });
      } else {
        await createSchemeMutation.mutateAsync(data);
        setToast({ type: 'success', message: 'Scheme created successfully' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to save scheme' });
    }
  };

  const handleApplySubmit = async (data: ApplicationRequest) => {
    try {
      await createApplicationMutation.mutateAsync(data);
      setToast({
        type: 'success',
        message: 'Application submitted successfully! Track progress in Applications tab.',
      });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Application submission failed' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            <FolderKanban className="h-6 w-6 text-indigo-600 mr-2" /> Subsidy & Grant Schemes
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Browse active government subsidy programs and grant amounts.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create New Scheme
          </button>
        )}
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search schemes by name..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm">
          Failed to load subsidy schemes. Please check backend connection.
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-800">No schemes found</h3>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              onEdit={handleOpenEdit}
              onApply={handleOpenApply}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <SchemeFormModal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        onSubmit={handleSchemeSubmit}
        initialData={editingScheme}
        isLoading={createSchemeMutation.isPending || updateSchemeMutation.isPending}
      />

      <ApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplySubmit}
        schemes={schemes}
        beneficiaries={beneficiaries}
        preselectedSchemeId={selectedSchemeId}
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

export default SchemesPage;
