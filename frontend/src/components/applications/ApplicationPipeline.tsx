import React from 'react';
import type { ApplicationStage } from '../../types/api';
import { CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';

interface ApplicationPipelineProps {
  currentStage: ApplicationStage;
}

export const ApplicationPipeline: React.FC<ApplicationPipelineProps> = ({
  currentStage,
}) => {
  const stages: { stage: ApplicationStage; label: string }[] = [
    { stage: 'ELIGIBILITY_CHECK', label: '1. Eligibility Check' },
    { stage: 'FIELD_REVIEW', label: '2. Field Review' },
    { stage: 'DISTRICT_REVIEW', label: '3. District Review' },
    { stage: 'FINANCE_REVIEW', label: '4. Finance Review' },
    { stage: 'APPROVED_FUNDS_DISBURSED', label: '5. Disbursed' },
  ];

  const isRejected = currentStage === 'REJECTED';
  const isReverify = currentStage === 'REVERIFY_REQUESTED';

  const getStageIndex = (stage: ApplicationStage) => {
    switch (stage) {
      case 'ELIGIBILITY_CHECK':
        return 0;
      case 'FIELD_REVIEW':
        return 1;
      case 'DISTRICT_REVIEW':
        return 2;
      case 'FINANCE_REVIEW':
        return 3;
      case 'APPROVED_FUNDS_DISBURSED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0" />

        {stages.map((item, idx) => {
          const isPassed = !isRejected && idx < currentIndex;
          const isCurrent = !isRejected && !isReverify && idx === currentIndex;
          const isComplete = !isRejected && currentIndex === 4 && idx === 4;

          let icon = <Clock className="h-4 w-4 text-gray-400" />;
          let circleBg = 'bg-white border-2 border-gray-300 text-gray-400';

          if (isPassed || isComplete) {
            icon = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
            circleBg = 'bg-emerald-50 border-2 border-emerald-600 text-emerald-600';
          } else if (isCurrent) {
            icon = <Clock className="h-4 w-4 text-indigo-600 animate-pulse" />;
            circleBg = 'bg-indigo-50 border-2 border-indigo-600 text-indigo-600 shadow-md';
          } else if (isRejected) {
            circleBg = 'bg-rose-50 border-2 border-rose-300 text-rose-400';
          }

          return (
            <div
              key={item.stage}
              className="flex flex-col items-center relative z-10 bg-white px-1"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${circleBg}`}>
                {icon}
              </div>
              <span className="text-[10px] font-semibold text-gray-600 mt-1 text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {isRejected && (
        <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center text-xs text-rose-800 font-medium">
          <XCircle className="h-4 w-4 mr-2 text-rose-600 flex-shrink-0" />
          Application rejected during verification review.
        </div>
      )}

      {isReverify && (
        <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2.5 flex items-center text-xs text-orange-800 font-medium">
          <RefreshCw className="h-4 w-4 mr-2 text-orange-600 flex-shrink-0 animate-spin" />
          Additional info requested by officer. Application in reverification.
        </div>
      )}
    </div>
  );
};

export default ApplicationPipeline;
