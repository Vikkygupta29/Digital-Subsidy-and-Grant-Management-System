package com.infosys.subsidy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "staged_disbursements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StagedDisbursement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "application_id")
    private GrantApplication application;

    private Integer stageNumber;
    private String milestoneName;
    private Double grantPercentage;
    private Double scheduledAmount;
    private Double disbursedAmount;

    private LocalDate dueDate;

    private String complianceProofUrl; // Cloudinary URL
    private String proofRemarks;

    @Enumerated(EnumType.STRING)
    private MilestoneStatus status;

    private LocalDateTime disbursedAt;
    private String transactionRef;

    public enum MilestoneStatus {
        PENDING_COMPLIANCE,
        PROOF_SUBMITTED,
        COMPLIANCE_APPROVED,
        FUND_RELEASED,
        NON_COMPLIANT
    }
}
