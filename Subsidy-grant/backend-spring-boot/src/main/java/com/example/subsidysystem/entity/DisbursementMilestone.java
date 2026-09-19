package com.example.subsidysystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "disbursement_milestones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisbursementMilestone {

    @Id
    @Column(length = 50)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "milestone_number", nullable = false)
    private Integer milestoneNumber;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private BigDecimal percentage;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(nullable = false, length = 30)
    private String status; // SCHEDULED, PENDING_VERIFICATION, VERIFIED, DISBURSED, OVERDUE, NON_COMPLIANT

    @Column(name = "proof_document_path")
    private String proofDocumentPath;

    @Column(name = "proof_submitted_date")
    private LocalDateTime proofSubmittedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_id")
    private User verifiedBy;

    @Column(name = "verification_date")
    private LocalDateTime verificationDate;

    @Column(name = "disbursed_date")
    private LocalDateTime disbursedDate;

    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;

    @Column(name = "utr_number", length = 100)
    private String utrNumber;

    @Column(columnDefinition = "TEXT")
    private String remarks;
}
