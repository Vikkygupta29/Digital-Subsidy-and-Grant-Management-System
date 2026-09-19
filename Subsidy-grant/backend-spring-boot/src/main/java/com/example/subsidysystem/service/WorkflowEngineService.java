package com.example.subsidysystem.service;

import com.example.subsidysystem.entity.Application;
import com.example.subsidysystem.entity.DisbursementMilestone;
import com.example.subsidysystem.entity.User;
import com.example.subsidysystem.entity.VerificationRecord;
import com.example.subsidysystem.repository.ApplicationRepository;
import com.example.subsidysystem.repository.MilestoneRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class WorkflowEngineService {

    private final ApplicationRepository applicationRepository;
    private final MilestoneRepository milestoneRepository;

    public WorkflowEngineService(ApplicationRepository applicationRepository, MilestoneRepository milestoneRepository) {
        this.applicationRepository = applicationRepository;
        this.milestoneRepository = milestoneRepository;
    }

    public Application processFieldVerification(String applicationId, User officer, String action, String remarks, String geo) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if ("RECOMMEND_APPROVE".equalsIgnoreCase(action)) {
            app.setCurrentStatus("UNDER_DISTRICT_REVIEW");
            app.setCurrentStage("DISTRICT_REVIEW");
        } else if ("RECOMMEND_REJECT".equalsIgnoreCase(action)) {
            app.setCurrentStatus("REJECTED");
            app.setCurrentStage("CLOSED");
            app.setRejectionReason(remarks);
        } else if ("REQUEST_REVERIFICATION".equalsIgnoreCase(action)) {
            app.setCurrentStatus("RE_VERIFICATION_REQUIRED");
        } else if ("ESCALATE".equalsIgnoreCase(action)) {
            app.setCurrentStatus("ESCALATED_SCRUTINY");
            app.setCurrentStage("DISTRICT_REVIEW");
        }

        VerificationRecord record = VerificationRecord.builder()
                .id("VR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .application(app)
                .stage("FIELD_VERIFICATION")
                .officer(officer)
                .officerRole(officer.getRole().name())
                .status(action)
                .decisionDate(LocalDateTime.now())
                .remarks(remarks)
                .geoCoordinates(geo)
                .build();

        app.getVerificationHistory().add(record);
        return applicationRepository.save(app);
    }

    public Application processDistrictReview(String applicationId, User officer, String action, String remarks) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if ("APPROVE".equalsIgnoreCase(action)) {
            app.setCurrentStatus("DISTRICT_APPROVED");
            app.setCurrentStage("FINANCE_APPROVAL");
        } else if ("REJECT".equalsIgnoreCase(action)) {
            app.setCurrentStatus("REJECTED");
            app.setCurrentStage("CLOSED");
            app.setRejectionReason(remarks);
        } else if ("ESCALATE".equalsIgnoreCase(action)) {
            app.setCurrentStatus("ESCALATED_SCRUTINY");
        }

        VerificationRecord record = VerificationRecord.builder()
                .id("VR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .application(app)
                .stage("DISTRICT_REVIEW")
                .officer(officer)
                .officerRole(officer.getRole().name())
                .status(action)
                .decisionDate(LocalDateTime.now())
                .remarks(remarks)
                .build();

        app.getVerificationHistory().add(record);
        return applicationRepository.save(app);
    }

    public Application processFinanceSanction(String applicationId, User officer, BigDecimal sanctionedAmount, String remarks) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        String sanctionNum = "SO/2025/MH/" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        app.setSanctionedAmount(sanctionedAmount);
        app.setSanctionOrderNumber(sanctionNum);
        app.setCurrentStatus("DISBURSEMENT_IN_PROGRESS");
        app.setCurrentStage("DISBURSEMENT");

        // Staged Disbursement Scheduling (30% Advance, 40% Progress, 30% Final UC)
        createMilestone(app, 1, "Stage 1: Advance Tranche", sanctionedAmount.multiply(BigDecimal.valueOf(0.30)), 30, 7);
        createMilestone(app, 2, "Stage 2: Field Installation Proof", sanctionedAmount.multiply(BigDecimal.valueOf(0.40)), 40, 30);
        createMilestone(app, 3, "Stage 3: Utilization Certificate", sanctionedAmount.multiply(BigDecimal.valueOf(0.30)), 30, 60);

        VerificationRecord record = VerificationRecord.builder()
                .id("VR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .application(app)
                .stage("FINANCE_APPROVAL")
                .officer(officer)
                .officerRole(officer.getRole().name())
                .status("APPROVED")
                .decisionDate(LocalDateTime.now())
                .remarks(remarks != null ? remarks : "Sanction Order " + sanctionNum + " released.")
                .build();

        app.getVerificationHistory().add(record);
        return applicationRepository.save(app);
    }

    private void createMilestone(Application app, int number, String title, BigDecimal amount, double pct, int days) {
        DisbursementMilestone m = DisbursementMilestone.builder()
                .id("MLS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .application(app)
                .milestoneNumber(number)
                .title(title)
                .amount(amount)
                .percentage(BigDecimal.valueOf(pct))
                .dueDate(LocalDateTime.now().plusDays(days))
                .status("SCHEDULED")
                .build();
        milestoneRepository.save(m);
    }
}
