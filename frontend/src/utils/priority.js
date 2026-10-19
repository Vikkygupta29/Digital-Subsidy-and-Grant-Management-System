/**
 * Application Eligibility Score & Status Utility
 * Simple, professional government portal scoring status.
 */

export function getApplicationPriority(score) {
  const numScore = Number(score) || 0;

  if (numScore >= 90) {
    return {
      level: 'FAST_TRACK',
      rank: 1,
      isDirectHigherOfficer: true,
      label: `⚡ Direct Higher Officer • Score: ${numScore}/100`,
      shortLabel: `⚡ Direct Higher Officer (${numScore})`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold',
      cardBorderClass: 'border border-emerald-300 bg-emerald-50/10',
      textClass: 'text-emerald-800 font-bold',
      description: `Eligibility Score: ${numScore}/100 (>= 90). Direct Higher Officer Fast-Track: Physical ground inspection waived under DBT Green Channel policy.`
    };
  }

  if (numScore >= 75) {
    return {
      level: 'HIGH',
      rank: 2,
      isDirectHigherOfficer: false,
      label: `Score: ${numScore}/100 • Eligible`,
      shortLabel: `Score: ${numScore}`,
      badgeClass: 'bg-blue-50 text-blue-800 border border-blue-200 font-semibold',
      cardBorderClass: 'border border-slate-200',
      textClass: 'text-blue-800 font-semibold',
      description: `Eligibility Score: ${numScore}/100. Standard verification queue.`
    };
  }

  if (numScore >= 60) {
    return {
      level: 'MEDIUM',
      rank: 3,
      isDirectHigherOfficer: false,
      label: `Score: ${numScore}/100`,
      shortLabel: `Score: ${numScore}`,
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
      cardBorderClass: 'border border-slate-200',
      textClass: 'text-slate-700',
      description: `Eligibility Score: ${numScore}/100. Regular scrutiny queue.`
    };
  }

  return {
    level: 'LOW',
    rank: 4,
    isDirectHigherOfficer: false,
    label: `Score: ${numScore}/100 • Review`,
    shortLabel: `Score: ${numScore}`,
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 font-medium',
    cardBorderClass: 'border border-slate-200',
    textClass: 'text-amber-800',
    description: `Eligibility Score: ${numScore}/100. Requires manual document inspection.`
  };
}

/**
 * Sorts an array of applications by score (highest score first)
 */
export function sortByPriority(applications = []) {
  return [...applications].sort((a, b) => {
    const scoreA = Number(a.eligibilityScore) || 0;
    const scoreB = Number(b.eligibilityScore) || 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}
