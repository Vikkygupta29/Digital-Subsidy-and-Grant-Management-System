package com.infosys.subsidy.service;

import com.infosys.subsidy.entity.BeneficiaryProfile;
import com.infosys.subsidy.entity.SchemeMaster;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;

@Service
public class EligibilityScoringService {

    @Getter
    @AllArgsConstructor
    public static class ScoringResult {
        private int totalScore;
        private boolean fastTracked;
        private boolean escalated;
        private String scoreDetailsJson;
    }

    public ScoringResult calculateEligibility(BeneficiaryProfile profile, SchemeMaster scheme, Double appliedAmount) {
        int score = 0;
        StringBuilder details = new StringBuilder("{");

        // 1. Income criteria (up to 35 points)
        int incomeScore = 0;
        if (scheme.getMaxIncomeCriteria() != null && profile.getAnnualIncome() != null) {
            if (profile.getAnnualIncome() <= scheme.getMaxIncomeCriteria()) {
                double ratio = profile.getAnnualIncome() / scheme.getMaxIncomeCriteria();
                incomeScore = (int) Math.round(35 * (1.0 - (ratio * 0.5))); // Lower income gets higher score
            }
        } else {
            incomeScore = 25; // Default score if no threshold
        }
        score += incomeScore;
        details.append("\"incomeScore\": ").append(incomeScore).append(", ");

        // 2. Category Match (up to 25 points)
        int categoryScore = 15;
        if (scheme.getTargetCategories() != null && profile.getCategory() != null) {
            if (scheme.getTargetCategories().toLowerCase().contains(profile.getCategory().toLowerCase())
                || scheme.getTargetCategories().equalsIgnoreCase("ALL")) {
                categoryScore = 25;
            }
        }
        score += categoryScore;
        details.append("\"categoryScore\": ").append(categoryScore).append(", ");

        // 3. Region match (up to 20 points)
        int regionScore = 10;
        if (scheme.getTargetRegion() != null && profile.getRegion() != null) {
            if (scheme.getTargetRegion().equalsIgnoreCase("ALL") || scheme.getTargetRegion().equalsIgnoreCase(profile.getRegion())) {
                regionScore = 20;
            }
        }
        score += regionScore;
        details.append("\"regionScore\": ").append(regionScore).append(", ");

        // 4. Verification and Land completeness (up to 20 points)
        int docScore = 10;
        if (profile.getIdentityDocumentUrl() != null && !profile.getIdentityDocumentUrl().isEmpty()) {
            docScore += 10;
        }
        score += docScore;
        details.append("\"docVerificationScore\": ").append(docScore).append(", ");
        details.append("\"finalScore\": ").append(score).append("}");

        // Routing logic: score 100 is always highest priority and fast-tracked
        boolean fastTracked = (score >= 100) || ((score >= 75) && (appliedAmount != null && appliedAmount <= 50000.0));
        boolean escalated = (score < 100) && ((appliedAmount != null && appliedAmount >= 100000.0) || (score < 50));

        return new ScoringResult(score, fastTracked, escalated, details.toString());
    }
}
