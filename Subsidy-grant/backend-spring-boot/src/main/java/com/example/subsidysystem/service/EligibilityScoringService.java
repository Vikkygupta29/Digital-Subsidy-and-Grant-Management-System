package com.example.subsidysystem.service;

import com.example.subsidysystem.entity.BeneficiaryProfile;
import com.example.subsidysystem.entity.Scheme;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class EligibilityScoringService {

    @Getter
    @Builder
    public static class ScoringResult {
        private int totalScore;
        private String priorityBand; // FAST_TRACK, STANDARD, SCRUTINY_FLAGGED
        private boolean eligible;
        private boolean highValue;
        private List<String> notes;
        private List<String> flags;
    }

    public ScoringResult evaluate(BeneficiaryProfile profile, Scheme scheme, BigDecimal requestedAmount, int documentCount) {
        int score = 0;
        List<String> notes = new ArrayList<>();
        List<String> flags = new ArrayList<>();

        // 1. Income Evaluation (Max 30)
        BigDecimal halfLimit = scheme.getMaxIncomeLimit().multiply(BigDecimal.valueOf(0.5));
        if (profile.getAnnualIncome().compareTo(halfLimit) <= 0) {
            score += 30;
            notes.add("Income is well below 50% of threshold (+30 points)");
        } else if (profile.getAnnualIncome().compareTo(scheme.getMaxIncomeLimit()) <= 0) {
            score += 20;
            notes.add("Income meets threshold (+20 points)");
        } else {
            score += 5;
            flags.add("Income exceeds threshold limit");
        }

        // 2. Category Priority (Max 30)
        String cat = profile.getCategory();
        if ("WOMEN_ENTREPRENEUR".equalsIgnoreCase(cat)) {
            score += 30;
            notes.add("Priority affirmative incentive for Women Enterprise (+30 points)");
        } else if ("MARGINAL_FARMER".equalsIgnoreCase(cat)) {
            score += 28;
            notes.add("High priority for Marginal Agricultural Producers (+28 points)");
        } else if ("SMALL_FARMER".equalsIgnoreCase(cat) || "RURAL_ARTISAN".equalsIgnoreCase(cat)) {
            score += 25;
            notes.add("Priority aligned category (+25 points)");
        } else {
            score += 15;
        }

        // 3. Land Holding (Max 20)
        if (scheme.getMaxLandLimit() == null || profile.getLandHoldingAcres() <= scheme.getMaxLandLimit()) {
            if (profile.getLandHoldingAcres() <= 2.5) {
                score += 20;
                notes.add("Small/Marginal land holding confirmed (+20 points)");
            } else {
                score += 15;
            }
        } else {
            score += 5;
            flags.add("Land holding exceeds scheme boundary");
        }

        // 4. Documentation & Age (Max 20)
        if (documentCount >= 4) {
            score += 10;
        } else {
            score += 5;
            flags.add("Incomplete documentation provided");
        }

        if (profile.getAge() >= scheme.getMinAge() && profile.getAge() <= scheme.getMaxAge()) {
            score += 10;
        } else {
            flags.add("Age outside preferred bracket");
        }

        boolean isHighValue = requestedAmount.compareTo(BigDecimal.valueOf(75000)) >= 0;
        String priorityBand = "STANDARD";
        if (score >= 75 && flags.isEmpty()) {
            priorityBand = "FAST_TRACK";
        } else if (score < 60 || !flags.isEmpty() || isHighValue) {
            priorityBand = "SCRUTINY_FLAGGED";
        }

        boolean eligible = score >= 50;

        return ScoringResult.builder()
                .totalScore(score)
                .priorityBand(priorityBand)
                .eligible(eligible)
                .highValue(isHighValue)
                .notes(notes)
                .flags(flags)
                .build();
    }
}
