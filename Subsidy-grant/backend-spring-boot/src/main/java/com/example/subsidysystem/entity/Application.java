package com.example.subsidysystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "application_number", nullable = false, unique = true, length = 50)
    private String applicationNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheme_id", nullable = false)
    private Scheme scheme;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beneficiary_id", nullable = false)
    private User beneficiary;

    @Column(nullable = false, length = 50)
    private String district;

    @Column(nullable = false, length = 50)
    private String state;

    @Column(name = "requested_amount", nullable = false)
    private BigDecimal requestedAmount;

    @Column(name = "sanctioned_amount")
    private BigDecimal sanctionedAmount;

    @Column(name = "sanction_order_number", length = 50)
    private String sanctionOrderNumber;

    @Column(name = "current_status", nullable = false, length = 50)
    private String currentStatus;

    @Column(name = "current_stage", nullable = false, length = 30)
    private String currentStage;

    @Column(name = "eligibility_score", nullable = false)
    private Integer eligibilityScore;

    @Column(name = "priority_band", nullable = false, length = 30)
    private String priorityBand;

    @Column(name = "is_high_value")
    private Boolean isHighValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_field_officer_id")
    private User assignedFieldOfficer;

    @Column(name = "submission_date")
    private LocalDateTime submissionDate;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DisbursementMilestone> milestones = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VerificationRecord> verificationHistory = new ArrayList<>();
}
