import React from 'react';
import type { SchemeResponse } from '../../types/api';
import { IndianRupee, Code2, Edit, PlusCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SchemeCardProps {
  scheme: SchemeResponse;
  onEdit?: (scheme: SchemeResponse) => void;
  onApply?: (scheme: SchemeResponse) => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  onEdit,
  onApply,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isBeneficiary = user?.role === 'BENEFICIARY';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-900 leading-snug">
            {scheme.name}
          </h3>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <IndianRupee className="h-3 w-3 mr-1" />
            {scheme.grantAmount.toLocaleString()} Grant
          </span>
        </div>

        <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center">
            <Code2 className="h-3.5 w-3.5 mr-1 text-gray-400" /> Eligibility Criteria Schema
          </p>
          <pre className="text-xs text-gray-700 font-mono overflow-x-auto whitespace-pre-wrap">
            {scheme.criteriaSchema}
          </pre>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
        {isAdmin && onEdit && (
          <button
            onClick={() => onEdit(scheme)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Scheme
          </button>
        )}

        {(isBeneficiary || isAdmin) && onApply && (
          <button
            onClick={() => onApply(scheme)}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm ml-auto"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" /> Apply Now
          </button>
        )}
      </div>
    </div>
  );
};

export default SchemeCard;
