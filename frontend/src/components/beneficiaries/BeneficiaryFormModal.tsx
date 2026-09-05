import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal';
import type { BeneficiaryRequest, BeneficiaryResponse } from '../../types/api';

const beneficiarySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  category: z.string().min(1, 'Category is required'),
  region: z.string().min(1, 'Region is required'),
});

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

interface BeneficiaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BeneficiaryRequest) => Promise<void>;
  initialData?: BeneficiaryResponse | null;
  isLoading?: boolean;
}

export const BeneficiaryFormModal: React.FC<BeneficiaryFormModalProps> = ({
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
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      category: 'Farmer',
      region: 'North District',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        category: initialData.category,
        region: initialData.region,
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        category: 'Farmer',
        region: 'North District',
      });
    }
  }, [initialData, reset, isOpen]);

  const handleFormSubmit = async (data: BeneficiaryFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Beneficiary Profile' : 'Add New Beneficiary'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="John Doe"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="john@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Phone Number
          </label>
          <input
            type="text"
            {...register('phone')}
            placeholder="9876543210"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="Farmer">Farmer</option>
              <option value="Small Business">Small Business</option>
              <option value="Artisan">Artisan</option>
              <option value="Student">Student</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Region / District
            </label>
            <input
              type="text"
              {...register('region')}
              placeholder="North District"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
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
            {isLoading ? 'Saving...' : initialData ? 'Update Profile' : 'Save Beneficiary'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BeneficiaryFormModal;
