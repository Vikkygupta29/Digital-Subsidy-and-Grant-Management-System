package com.infosys.subsidy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "verification_workflows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationWorkflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "application_id")
    private GrantApplication application;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", length = 50, columnDefinition = "VARCHAR(50)")
    private WorkflowStage stage;

    @Column(name = "action", length = 100)
    private String action; // FIELD_OFFICER_APPROVED, FIELD_OFFICER_REAPPLIED, DISTRICT_OFFICER_APPROVED, etc.

    @Column(name = "from_stage", length = 50)
    private String fromStage;

    @Column(name = "to_stage", length = 50)
    private String toStage;

    @ManyToOne
    @JoinColumn(name = "performed_by_id")
    private User performedBy;

    private String performedByUsername;
    private String performedByRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", length = 50, columnDefinition = "VARCHAR(50)")
    private ActionDecision decision;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(length = 1000)
    private String groundNotes;

    private String proofDocumentUrl; // Cloudinary URL

    private LocalDateTime actionTimestamp;

    public enum WorkflowStage {
        FIELD_VERIFICATION,
        DISTRICT_REVIEW,
        FINANCE_APPROVAL,
        BENEFICIARY_RESUBMISSION,
        APPLICATION_SUBMITTED,
        RE_VERIFICATION_APPEAL
    }

    public enum ActionDecision {
        APPROVED,
        REJECTED,
        REAPPLY,
        FLAGGED_ESCALATED,
        RE_VERIFICATION_REQUESTED,
        RESUBMITTED,
        APPEAL_ACCEPTED,
        REJECTION_UPHELD
    }
}
