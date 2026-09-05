import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal';
import type { ApplicationResponse, VerificationRequest } from '../../types/api';
import { CheckCircle2, XCircle, RefreshCw, UserCheck } from 'lucide-react';

const verificationSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REVERIFY']),
  remarks: z.string().optional(),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: VerificationRequest) => Promise<void>;
  application: ApplicationResponse | null;
  isLoading?: boolean;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  application,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      decision: 'APPROVE',
      remarks: '',
    },
  });

  const selectedDecision = watch('decision');

  if (!application) return null;

  const handleFormSubmit = async (data: VerificationFormData) => {
    await onSubmit(application.id, data as VerificationRequest);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Officer Verification - App #${application.id}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Application details summary card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Beneficiary Name:</span>
            <span className="font-bold text-slate-900">{application.beneficiaryName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Subsidy Scheme:</span>
            <span className="font-medium text-slate-800">{application.schemeName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Requested Amount:</span>
            <span className="font-bold text-emerald-700">
              ₹{application.requestedAmount?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Eligibility Score:</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">
              {application.eligibilityScore}% ({application.eligibilityResult})
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-700 block mb-1">Purpose Statement:</span>
            <p className="text-slate-600 bg-white p-2 rounded border border-slate-200 italic">
              "{application.purpose}"
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Verification Decision
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setValue('decision', 'APPROVE')}
                className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedDecision === 'APPROVE'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                APPROVE
              </button>

              <button
                type="button"
                onClick={() => setValue('decision', 'REVERIFY')}
                className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedDecision === 'REVERIFY'
                    ? 'bg-orange-50 border-orange-600 text-orange-700 ring-2 ring-orange-500/20'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <RefreshCw className="h-4 w-4 mr-1.5 text-orange-600" />
                REVERIFY
              </button>

              <button
                type="button"
                onClick={() => setValue('decision', 'REJECT')}
                className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedDecision === 'REJECT'
                    ? 'bg-rose-50 border-rose-600 text-rose-700 ring-2 ring-rose-500/20'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <XCircle className="h-4 w-4 mr-1.5 text-rose-600" />
                REJECT
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Officer Inspection & Verification Remarks
            </label>
            <textarea
              rows={3}
              {...register('remarks')}
              placeholder="Add verification notes, field check observations, or reasons for decision..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            {errors.remarks && (
              <p className="text-xs text-red-600 mt-1">{errors.remarks.message}</p>
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
              className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              {isLoading ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default VerificationModal;
