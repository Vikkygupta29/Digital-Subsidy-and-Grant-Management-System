/**
 * Priority Classification Utility based on Application Eligibility Score
 * 
 * Score 100: ⭐ P1 - HIGHEST PRIORITY (Immediate Fast-Track & Top of Queue)
 * Score 85-99: P2 - HIGH PRIORITY
 * Score 65-84: P3 - MEDIUM PRIORITY
 * Score < 65: P4 - LOW PRIORITY (Detailed Scrutiny Queue)
 */

export function getApplicationPriority(score) {
  const numScore = Number(score) || 0;

  if (numScore >= 100) {
    return {
      level: 'HIGHEST',
      rank: 1,
      label: '⭐ P1 - HIGHEST PRIORITY (100)',
      shortLabel: '⭐ P1 HIGHEST (100)',
      badgeClass: 'bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white shadow-sm border border-amber-300 font-extrabold',
      cardBorderClass: 'border-2 border-purple-400 bg-purple-50/10 shadow-sm',
      textClass: 'text-purple-700 font-extrabold',
      description: 'Maximum 100/100 score: Top processing priority for immediate approval & fast-tracked disbursement.'
    };
  }

  if (numScore >= 85) {
    return {
      level: 'HIGH',
      rank: 2,
      label: 'P2 - HIGH PRIORITY',
      shortLabel: 'P2 HIGH',
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
      cardBorderClass: 'border border-emerald-200',
      textClass: 'text-emerald-700 font-bold',
      description: 'High score (85-99): Eligible for fast-track processing queue.'
    };
  }

  if (numScore >= 65) {
    return {
      level: 'MEDIUM',
      rank: 3,
      label: 'P3 - MEDIUM PRIORITY',
      shortLabel: 'P3 MEDIUM',
      badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold',
      cardBorderClass: 'border border-slate-200',
      textClass: 'text-amber-700 font-medium',
      description: 'Moderate score (65-84): Standard officer review and verification.'
    };
  }

  return {
    level: 'LOW',
    rank: 4,
    label: 'P4 - LOW PRIORITY',
    shortLabel: 'P4 LOW',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    cardBorderClass: 'border border-slate-200',
    textClass: 'text-slate-600',
    description: 'Score < 65: Requires enhanced scrutiny and document verification.'
  };
}

/**
 * Sorts an array of applications by priority (Score 100 at the top, descending)
 */
export function sortByPriority(applications = []) {
  return [...applications].sort((a, b) => {
    const scoreA = Number(a.eligibilityScore) || 0;
    const scoreB = Number(b.eligibilityScore) || 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA; // 100 first, then 99, 98, ...
    }
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}
