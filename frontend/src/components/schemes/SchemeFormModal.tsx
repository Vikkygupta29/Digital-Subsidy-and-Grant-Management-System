import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal';
import type { SchemeRequest, SchemeResponse } from '../../types/api';

const schemeSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  grantAmount: z.number().min(1000, 'Grant amount must be at least 1,000'),
  criteriaSchema: z.string().min(5, 'Criteria schema is required'),
});

type SchemeFormData = z.infer<typeof schemeSchema>;

interface SchemeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SchemeRequest) => Promise<void>;
  initialData?: SchemeResponse | null;
  isLoading?: boolean;
}

export const SchemeFormModal: React.FC<SchemeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchemeFormData>({
    resolver: zodResolver(schemeSchema),
    defaultValues: {
      name: '',
      grantAmount: 50000,
      criteriaSchema: '{"minIncome": 0, "maxIncome": 250000, "category": "ALL"}',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        grantAmount: initialData.grantAmount,
        criteriaSchema: initialData.criteriaSchema,
      });
    } else {
      reset({
        name: '',
        grantAmount: 50000,
        criteriaSchema: '{"minIncome": 0, "maxIncome": 250000, "category": "ALL"}',
      });
    }
  }, [initialData, reset, isOpen]);

  const handleFormSubmit = async (data: SchemeFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Subsidy Scheme' : 'Create New Subsidy Scheme'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Scheme Name
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g., Agricultural Technology Support Grant"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Grant Amount (₹)
          </label>
          <input
            type="number"
            {...register('grantAmount', { valueAsNumber: true })}
            placeholder="50000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          {errors.grantAmount && (
            <p className="text-xs text-red-600 mt-1">
              {errors.grantAmount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Criteria Rules (JSON or Text)
          </label>
          <textarea
            rows={4}
            {...register('criteriaSchema')}
            placeholder='{"minIncome": 0, "maxIncome": 250000}'
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs"
          />
          {errors.criteriaSchema && (
            <p className="text-xs text-red-600 mt-1">
              {errors.criteriaSchema.message}
            </p>
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
            {isLoading ? 'Saving...' : initialData ? 'Update Scheme' : 'Create Scheme'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SchemeFormModal;
