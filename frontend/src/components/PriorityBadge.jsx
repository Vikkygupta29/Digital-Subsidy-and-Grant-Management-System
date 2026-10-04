import React from 'react';
import { Sparkles, Star, Zap, ShieldAlert, ArrowUpCircle } from 'lucide-react';
import { getApplicationPriority } from '../utils/priority';

export default function PriorityBadge({ score, short = false, showScore = true, className = '' }) {
  const priority = getApplicationPriority(score);

  if (priority.level === 'HIGHEST') {
    return (
      <span 
        title={priority.description}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white shadow-sm border border-amber-300 ring-2 ring-purple-400/30 ${className}`}
      >
        <Star className="w-3 h-3 text-amber-200 fill-amber-300" />
        {short ? '⭐ HIGHEST (100)' : priority.label}
      </span>
    );
  }

  if (priority.level === 'HIGH') {
    return (
      <span 
        title={priority.description}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 ${className}`}
      >
        <ArrowUpCircle className="w-3 h-3 text-emerald-600" />
        {short ? 'P2 HIGH' : priority.label}
      </span>
    );
  }

  if (priority.level === 'MEDIUM') {
    return (
      <span 
        title={priority.description}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 ${className}`}
      >
        <Zap className="w-2.5 h-2.5 text-amber-600" />
        {short ? 'P3 MED' : priority.label}
      </span>
    );
  }

  return (
    <span 
      title={priority.description}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
    >
      {short ? 'P4 LOW' : priority.label}
    </span>
  );
}
