import { BeneficiaryProfile, Scheme } from './data';

export interface ScoreResult {
  totalScore: number;
  priorityBand: 'FAST_TRACK' | 'STANDARD' | 'SCRUTINY_FLAGGED';
  isEligible: boolean;
  isHighValue: boolean;
  scoreBreakdown: {
    incomeScore: number;
    categoryScore: number;
    landScore: number;
    documentationScore: number;
    ageScore: number;
    total: number;
  };
  eligibilityReasons: string[];
  flags: string[];
}

export function calculateEligibilityScore(
  profile: BeneficiaryProfile,
  scheme: Scheme,
  requestedAmount: number,
  attachedDocumentsCount: number
): ScoreResult {
  const criteria = scheme.eligibilityCriteria;
  const reasons: string[] = [];
  const flags: string[] = [];

  // 1. Income Score (Max 30)
  let incomeScore = 0;
  if (profile.annualIncome <= criteria.maxIncome * 0.5) {
    incomeScore = 30;
    reasons.push('High priority: Income below 50% of threshold limit.');
  } else if (profile.annualIncome <= criteria.maxIncome * 0.8) {
    incomeScore = 24;
    reasons.push('Standard priority: Income below 80% of threshold limit.');
  } else if (profile.annualIncome <= criteria.maxIncome) {
    incomeScore = 16;
    reasons.push('Marginal priority: Income conforms to scheme ceiling.');
  } else {
    incomeScore = 5;
    flags.push(`Income ₹${profile.annualIncome.toLocaleString()} exceeds scheme limit ₹${criteria.maxIncome.toLocaleString()}.`);
  }

  // 2. Category Priority Score (Max 30)
  let categoryScore = 0;
  if (criteria.eligibleCategories.includes(profile.category)) {
    if (profile.category === 'WOMEN_ENTREPRENEUR') {
      categoryScore = 30;
      reasons.push('Direct affirmative incentive for Women Enterprise.');
    } else if (profile.category === 'MARGINAL_FARMER') {
      categoryScore = 28;
      reasons.push('High priority for Marginal Agri-holdings.');
    } else if (profile.category === 'SMALL_FARMER' || profile.category === 'RURAL_ARTISAN') {
      categoryScore = 25;
      reasons.push('Priority category aligned with scheme mandate.');
    } else {
      categoryScore = 20;
    }
  } else {
    categoryScore = 10;
    flags.push(`Category ${profile.category} is not in primary target group.`);
  }

  // 3. Land Holding Score (Max 20)
  let landScore = 0;
  if (criteria.maxLandHoldingAcres === 0 || profile.landHoldingAcres <= criteria.maxLandHoldingAcres) {
    if (profile.landHoldingAcres <= 2.5) {
      landScore = 20;
      reasons.push('Land size is small/marginal (<= 2.5 acres).');
    } else {
      landScore = 15;
    }
  } else {
    landScore = 5;
    flags.push(`Land holding ${profile.landHoldingAcres} acres exceeds limit ${criteria.maxLandHoldingAcres} acres.`);
  }

  // 4. Documentation Completeness (Max 10)
  const reqCount = criteria.requiredDocuments.length;
  let docScore = 0;
  if (attachedDocumentsCount >= reqCount) {
    docScore = 10;
    reasons.push('Full prerequisite documentation verified.');
  } else if (attachedDocumentsCount >= Math.floor(reqCount / 2)) {
    docScore = 6;
    flags.push(`Incomplete documentation: ${attachedDocumentsCount} of ${reqCount} required proofs provided.`);
  } else {
    docScore = 2;
    flags.push(`Severe documentation deficiency: Only ${attachedDocumentsCount} provided.`);
  }

  // 5. Age Validity (Max 10)
  let ageScore = 0;
  if (profile.age >= criteria.minAge && profile.age <= criteria.maxAge) {
    ageScore = 10;
  } else {
    ageScore = 0;
    flags.push(`Age ${profile.age} outside allowed range [${criteria.minAge}-${criteria.maxAge}].`);
  }

  const totalScore = incomeScore + categoryScore + landScore + docScore + ageScore;
  const isHighValue = requestedAmount >= 75000;

  let priorityBand: 'FAST_TRACK' | 'STANDARD' | 'SCRUTINY_FLAGGED' = 'STANDARD';
  if (totalScore >= 75 && flags.length === 0) {
    priorityBand = 'FAST_TRACK';
  } else if (totalScore < 60 || flags.length > 0 || isHighValue) {
    priorityBand = 'SCRUTINY_FLAGGED';
  } else {
    priorityBand = 'STANDARD';
  }

  const isEligible = totalScore >= 50 && (profile.annualIncome <= criteria.maxIncome * 1.1);

  return {
    totalScore,
    priorityBand,
    isEligible,
    isHighValue,
    scoreBreakdown: {
      incomeScore,
      categoryScore,
      landScore,
      documentationScore: docScore,
      ageScore,
      total: totalScore
    },
    eligibilityReasons: reasons,
    flags
  };
}
