import React from 'react';
import type { ApplicationStage } from '../../types/api';

interface BadgeProps {
  stage?: ApplicationStage | string;
  status?: string;
}

export const Badge: React.FC<BadgeProps> = ({ stage, status }) => {
  const value = stage || status || 'SUBMITTED';

  let colorClasses = 'bg-gray-100 text-gray-800 border-gray-200';
  let label = value;

  switch (value) {
    case 'APPROVED_FUNDS_DISBURSED':
    case 'APPROVED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Approved & Disbursed';
      break;
    case 'FIELD_REVIEW':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Field Review';
      break;
    case 'DISTRICT_REVIEW':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'District Review';
      break;
    case 'FINANCE_REVIEW':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'Finance Review';
      break;
    case 'ELIGIBILITY_CHECK':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = 'Eligibility Check';
      break;
    case 'REJECTED':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Rejected';
      break;
    case 'REVERIFY_REQUESTED':
      colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
      label = 'Reverification Requested';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {label}
    </span>
  );
};

export default Badge;
