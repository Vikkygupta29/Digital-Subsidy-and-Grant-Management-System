import React, { useState } from 'react';
import {
  useBeneficiaries,
  useCreateBeneficiary,
  useUpdateBeneficiary,
} from '../hooks/useBeneficiaries';
import { useAuth } from '../hooks/useAuth';
import type { BeneficiaryRequest, BeneficiaryResponse } from '../types/api';
import BeneficiaryFormModal from '../components/beneficiaries/BeneficiaryFormModal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import Toast from '../components/common/Toast';
import { Users, Plus, Search, Edit, Mail, Phone, MapPin, Tag } from 'lucide-react';

export const BeneficiariesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data: beneficiaries = [], isLoading, error } = useBeneficiaries();
  const createMutation = useCreateBeneficiary();
  const updateMutation = useUpdateBeneficiary();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<BeneficiaryResponse | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const filteredBeneficiaries = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingBeneficiary(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BeneficiaryResponse) => {
    setEditingBeneficiary(b);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: BeneficiaryRequest) => {
    try {
      if (editingBeneficiary) {
        await updateMutation.mutateAsync({ id: editingBeneficiary.id, data });
        setToast({ type: 'success', message: 'Beneficiary profile updated' });
      } else {
        await createMutation.mutateAsync(data);
        setToast({ type: 'success', message: 'Beneficiary added successfully' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to save beneficiary' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            <Users className="h-6 w-6 text-indigo-600 mr-2" /> Beneficiary Directory
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registered beneficiaries eligible for grants and subsidy schemes.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Beneficiary
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, region..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table / Cards */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm">
          Failed to load beneficiaries directory.
        </div>
      ) : filteredBeneficiaries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-800">No beneficiaries found</h3>
          <p className="text-xs text-gray-500 mt-1">Try refining your search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">ID & Name</th>
                  <th className="py-3.5 px-6">Contact Info</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Region</th>
                  {isAdmin && <th className="py-3.5 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredBeneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                          #{b.id}
                        </span>
                        <span>{b.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      <div className="space-y-0.5">
                        <div className="flex items-center text-gray-700">
                          <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" /> {b.email}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" /> {b.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <Tag className="h-3 w-3 mr-1" /> {b.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-700 font-medium">
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" /> {b.region}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <BeneficiaryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingBeneficiary}
        isLoading={createMutation.isPending || updateMutation.isPending}
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

export default BeneficiariesPage;
