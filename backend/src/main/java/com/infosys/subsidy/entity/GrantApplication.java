package com.infosys.subsidy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "grant_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrantApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String applicationNo;

    @ManyToOne
    @JoinColumn(name = "beneficiary_id")
    private BeneficiaryProfile beneficiary;

    @ManyToOne
    @JoinColumn(name = "scheme_id")
    private SchemeMaster scheme;

    private Double appliedGrantAmount;
    private Integer eligibilityScore; // 0 to 100

    @Column(columnDefinition = "TEXT")
    private String scoreBreakdownJson;

    @Column(columnDefinition = "TEXT")
    private String dynamicFieldAnswersJson; // Citizen's answers to scheme-specific dynamic fields

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage", length = 50, columnDefinition = "VARCHAR(50)")
    private ApplicationStage currentStage;

    @Column(name = "status", length = 50)
    private String status; // SUBMITTED, UNDER_REVIEW, REAPPLY_REQUIRED, APPROVED, REJECTED

    @Builder.Default
    private Integer reapplyCount = 0;

    @Builder.Default
    private Integer maxReapplyAllowed = 2; // Maximum permitted re-application attempts (2 times standard DBT quota)

    @Column(columnDefinition = "TEXT")
    private String lastReapplyReason;

    private String lastReappliedBy;
    private String lastReappliedByRole;
    private LocalDateTime lastReappliedAt;

    // Structured Rejection Details
    private String rejectionCategory; // INELIGIBLE_INCOME, LAND_RECORD_MISMATCH, INVALID_IDENTITY_KYC, DUPLICATE_BENEFICIARY, SCHEME_CRITERIA_UNMET, NON_COMPLIANCE_INSPECTION, REAPPLY_LIMIT_EXHAUSTED, OTHER_ADMINISTRATIVE
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;
    private String rejectedBy;
    private String rejectedByRole;
    private LocalDateTime rejectedAt;
    private LocalDateTime appealDeadline; // Statutory 30-day appeal window

    // Re-Verification & Statutory Appeal Details
    @Column(columnDefinition = "TEXT")
    private String reVerificationAppealGrounds;
    private String reVerificationDocumentUrl;
    private LocalDateTime reVerificationRequestedAt;
    @Column(columnDefinition = "TEXT")
    private String reVerificationDisposalNotes;
    private String reVerificationDisposedBy;
    private LocalDateTime reVerificationDisposedAt;

    private boolean fastTracked;
    private boolean escalated;
    private String remarks;

    private String schemeDocumentUrl; // Uploaded Cloudinary document URL for scheme application

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum ApplicationStage {
        SCORED,
        FIELD_VERIFICATION,
        DISTRICT_REVIEW,
        FINANCE_APPROVAL,
        APPROVED,
        REJECTED,
        RE_VERIFICATION_REQUESTED
    }

    @com.fasterxml.jackson.annotation.JsonProperty("priorityLevel")
    public String getPriorityLevel() {
        if (eligibilityScore == null) return "LOW";
        if (eligibilityScore >= 100) return "HIGHEST";
        if (eligibilityScore >= 85) return "HIGH";
        if (eligibilityScore >= 65) return "MEDIUM";
        return "LOW";
    }

    @com.fasterxml.jackson.annotation.JsonProperty("priorityRank")
    public int getPriorityRank() {
        if (eligibilityScore == null) return 4;
        if (eligibilityScore >= 100) return 1;
        if (eligibilityScore >= 85) return 2;
        if (eligibilityScore >= 65) return 3;
        return 4;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("priorityLabel")
    public String getPriorityLabel() {
        if (eligibilityScore == null) return "P4 - Low Priority";
        if (eligibilityScore >= 100) return "⭐ P1 - Highest Priority (100)";
        if (eligibilityScore >= 85) return "P2 - High Priority";
        if (eligibilityScore >= 65) return "P3 - Medium Priority";
        return "P4 - Low Priority";
    }

    @com.fasterxml.jackson.annotation.JsonProperty("remainingReapplies")
    public int getRemainingReapplies() {
        int max = maxReapplyAllowed != null ? maxReapplyAllowed : 2;
        int current = reapplyCount != null ? reapplyCount : 0;
        return Math.max(0, max - current);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("reapplyExhausted")
    public boolean isReapplyExhausted() {
        int max = maxReapplyAllowed != null ? maxReapplyAllowed : 2;
        int current = reapplyCount != null ? reapplyCount : 0;
        return current >= max;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("canAppeal")
    public boolean canAppeal() {
        if (!"REJECTED".equalsIgnoreCase(status)) return false;
        if (appealDeadline == null) return true;
        return LocalDateTime.now().isBefore(appealDeadline);
    }
}
