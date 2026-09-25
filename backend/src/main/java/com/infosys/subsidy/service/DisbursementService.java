package com.infosys.subsidy.service;

import com.infosys.subsidy.entity.*;
import com.infosys.subsidy.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DisbursementService {

    private final StagedDisbursementRepository disbursementRepository;
    private final SchemeMasterRepository schemeMasterRepository;
    private final AuditService auditService;

    @Transactional
    public StagedDisbursement submitComplianceProof(Long milestoneId, String proofUrl, String remarks, User user) {
        StagedDisbursement milestone = disbursementRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        milestone.setComplianceProofUrl(proofUrl);
        milestone.setProofRemarks(remarks);
        milestone.setStatus(StagedDisbursement.MilestoneStatus.PROOF_SUBMITTED);
        disbursementRepository.save(milestone);

        auditService.logAction(
                "MILESTONE_PROOF_SUBMITTED",
                user != null ? user.getUsername() : "BENEFICIARY",
                user != null ? user.getRole().name() : "BENEFICIARY",
                "StagedDisbursement",
                milestone.getId().toString(),
                "Submitted proof URL: " + proofUrl + ", Remarks: " + remarks
        );

        return milestone;
    }

    @Transactional
    public StagedDisbursement approveComplianceAndReleaseFund(Long milestoneId, User approver) {
        StagedDisbursement milestone = disbursementRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        milestone.setStatus(StagedDisbursement.MilestoneStatus.FUND_RELEASED);
        milestone.setDisbursedAmount(milestone.getScheduledAmount());
        milestone.setDisbursedAt(LocalDateTime.now());
        milestone.setTransactionRef("TREASURY-TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        disbursementRepository.save(milestone);

        // Update Scheme Disbursed Budget
        GrantApplication app = milestone.getApplication();
        SchemeMaster scheme = app.getScheme();
        if (scheme.getDisbursedBudget() == null) scheme.setDisbursedBudget(0.0);
        scheme.setDisbursedBudget(scheme.getDisbursedBudget() + milestone.getDisbursedAmount());
        schemeMasterRepository.save(scheme);

        auditService.logAction(
                "TREASURY_FUND_RELEASED",
                approver != null ? approver.getUsername() : "FINANCE_OFFICER",
                approver != null ? approver.getRole().name() : "FINANCE_APPROVER",
                "StagedDisbursement",
                milestone.getId().toString(),
                "Amount Released: $" + milestone.getDisbursedAmount() + ", TxnRef: " + milestone.getTransactionRef()
        );

        return milestone;
    }

    @Transactional
    public StagedDisbursement flagNonCompliance(Long milestoneId, String reason, User officer) {
        StagedDisbursement milestone = disbursementRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        milestone.setStatus(StagedDisbursement.MilestoneStatus.NON_COMPLIANT);
        milestone.setProofRemarks("FLAGGED NON-COMPLIANT: " + reason);
        disbursementRepository.save(milestone);

        auditService.logAction(
                "MILESTONE_NON_COMPLIANT",
                officer != null ? officer.getUsername() : "OFFICER",
                officer != null ? officer.getRole().name() : "FIELD_OFFICER",
                "StagedDisbursement",
                milestone.getId().toString(),
                "Flagged non-compliant: " + reason
        );

        return milestone;
    }
}
