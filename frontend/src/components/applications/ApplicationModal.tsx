import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal';
import type { ApplicationRequest, SchemeResponse, BeneficiaryResponse } from '../../types/api';
import { useAuth } from '../../hooks/useAuth';

const applicationSchema = z.object({
  schemeId: z.number().positive('Please select a subsidy scheme'),
  beneficiaryId: z.number().optional(),
  purpose: z.string().min(10, 'Purpose description must be at least 10 characters').max(500),
  requestedAmount: z.number().positive('Requested amount must be greater than 0'),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationRequest) => Promise<void>;
  schemes: SchemeResponse[];
  beneficiaries?: BeneficiaryResponse[];
  preselectedSchemeId?: number;
  isLoading?: boolean;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  schemes,
  beneficiaries = [],
  preselectedSchemeId,
  isLoading,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      schemeId: preselectedSchemeId || (schemes[0]?.id ?? 0),
      purpose: '',
      requestedAmount: 0,
    },
  });

  const selectedSchemeId = watch('schemeId');

  useEffect(() => {
    if (preselectedSchemeId) {
      setValue('schemeId', preselectedSchemeId);
      const match = schemes.find((s) => s.id === preselectedSchemeId);
      if (match) setValue('requestedAmount', match.grantAmount);
    } else if (schemes.length > 0 && !selectedSchemeId) {
      setValue('schemeId', schemes[0].id);
      setValue('requestedAmount', schemes[0].grantAmount);
    }
  }, [preselectedSchemeId, schemes, setValue, selectedSchemeId, isOpen]);

  const handleSchemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const schemeId = Number(e.target.value);
    setValue('schemeId', schemeId);
    const match = schemes.find((s) => s.id === schemeId);
    if (match) setValue('requestedAmount', match.grantAmount);
  };

  const handleFormSubmit = async (data: ApplicationFormData) => {
    await onSubmit(data as ApplicationRequest);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Subsidy & Grant Application"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {isAdmin && beneficiaries.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Select Beneficiary Account
            </label>
            <select
              {...register('beneficiaryId', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="">-- Choose Beneficiary --</option>
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.email}) - {b.region}
                </option>
              ))}
            </select>
            {errors.beneficiaryId && (
              <p className="text-xs text-red-600 mt-1">{errors.beneficiaryId.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Target Subsidy Scheme
          </label>
          <select
            {...register('schemeId', { valueAsNumber: true })}
            onChange={handleSchemeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          >
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Max: ₹{s.grantAmount.toLocaleString()})
              </option>
            ))}
          </select>
          {errors.schemeId && (
            <p className="text-xs text-red-600 mt-1">{errors.schemeId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Requested Grant Amount (₹)
          </label>
          <input
            type="number"
            {...register('requestedAmount', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          {errors.requestedAmount && (
            <p className="text-xs text-red-600 mt-1">{errors.requestedAmount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Application Purpose & Justification
          </label>
          <textarea
            rows={3}
            {...register('purpose')}
            placeholder="Explain why you are applying for this subsidy and how funds will be utilized..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          {errors.purpose && (
            <p className="text-xs text-red-600 mt-1">{errors.purpose.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplicationModal;
