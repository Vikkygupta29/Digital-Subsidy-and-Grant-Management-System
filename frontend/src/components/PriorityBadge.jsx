import React from 'react';
import { CheckCircle2, FileText, Zap } from 'lucide-react';
import { getApplicationPriority } from '../utils/priority';

export default function PriorityBadge({ score, short = false, showScore = true, className = '' }) {
  const priority = getApplicationPriority(score);

  if (priority.level === 'FAST_TRACK') {
    return (
      <span 
        title={priority.description}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 ${className}`}
      >
        <Zap className="w-3.5 h-3.5 text-emerald-600" />
        {short ? priority.shortLabel : priority.label}
      </span>
    );
  }

  if (priority.level === 'HIGH') {
    return (
      <span 
        title={priority.description}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
        {short ? priority.shortLabel : priority.label}
      </span>
    );
  }

  if (priority.level === 'MEDIUM') {
    return (
      <span 
        title={priority.description}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
      >
        <FileText className="w-3.5 h-3.5 text-slate-500" />
        {short ? priority.shortLabel : priority.label}
      </span>
    );
  }

  return (
    <span 
      title={priority.description}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
    >
      {short ? priority.shortLabel : priority.label}
    </span>
  );
}
