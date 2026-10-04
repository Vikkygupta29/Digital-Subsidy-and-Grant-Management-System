package com.infosys.subsidy.service;

import com.infosys.subsidy.entity.*;
import com.infosys.subsidy.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkflowEngineService {

    private final GrantApplicationRepository applicationRepository;
    private final VerificationWorkflowRepository workflowRepository;
    private final StagedDisbursementRepository stagedDisbursementRepository;
    private final SchemeMasterRepository schemeMasterRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public GrantApplication executeWorkflowAction(
            Long applicationId,
            String actionInput,
            String reason,
            String notes,
            User performedByUser,
            String performedByUsername,
            String performedByRole,
            String dynamicFieldAnswersJson,
            String proofDocumentUrl
    ) {
        return executeWorkflowAction(
                applicationId, actionInput, reason, notes,
                performedByUser, performedByUsername, performedByRole,
                dynamicFieldAnswersJson, proofDocumentUrl, null
        );
    }

    public GrantApplication executeWorkflowAction(
            Long applicationId,
            String actionInput,
            String reason,
            String notes,
            User performedByUser,
            String performedByUsername,
            String performedByRole,
            String dynamicFieldAnswersJson,
            String proofDocumentUrl,
            String rejectionCategory
    ) {
        GrantApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        String normalizedAction = (actionInput != null ? actionInput.trim().toUpperCase() : "APPROVE");
        String actorName = performedByUser != null ? performedByUser.getFullName() : (performedByUsername != null ? performedByUsername : "Authorized Officer");
        String actorUsername = performedByUser != null ? performedByUser.getUsername() : (performedByUsername != null ? performedByUsername : "SYSTEM");
        String actorRole = performedByUser != null ? performedByUser.getRole().name() : (performedByRole != null ? performedByRole : "ADMIN");

        String fromStage = app.getCurrentStage() != null ? app.getCurrentStage().name() : "SUBMITTED";
        String toStage = fromStage;
        String actionRecordName = "";
        VerificationWorkflow.WorkflowStage workflowStage = VerificationWorkflow.WorkflowStage.FIELD_VERIFICATION;
        VerificationWorkflow.ActionDecision workflowDecision = VerificationWorkflow.ActionDecision.APPROVED;

        // Role-based permission validation
        if (!"ADMIN".equalsIgnoreCase(actorRole)) {
            if ("BENEFICIARY".equalsIgnoreCase(actorRole)) {
                if (!"RESUBMIT".equalsIgnoreCase(normalizedAction) && !"REQUEST_RE_VERIFICATION".equalsIgnoreCase(normalizedAction) && !"APPEAL".equalsIgnoreCase(normalizedAction)) {
                    throw new IllegalStateException("Beneficiaries can only resubmit applications requiring correction or file appeals.");
                }
            } else if ("DISTRICT_OFFICER".equalsIgnoreCase(actorRole)) {
                if ("ACCEPT_RE_VERIFICATION".equalsIgnoreCase(normalizedAction) || "UPHOLD_REJECTION".equalsIgnoreCase(normalizedAction)) {
                    // Allowed for District Officer reviewing grievance appeals
                } else if (app.getCurrentStage() != GrantApplication.ApplicationStage.DISTRICT_REVIEW) {
                    throw new IllegalStateException("District Officer can only review applications in DISTRICT_REVIEW stage.");
                }
            } else if ("FIELD_OFFICER".equalsIgnoreCase(actorRole) && app.getCurrentStage() != GrantApplication.ApplicationStage.FIELD_VERIFICATION) {
                throw new IllegalStateException("Field Officer can only review applications in FIELD_VERIFICATION stage.");
            } else if ("FINANCE_APPROVER".equalsIgnoreCase(actorRole) && app.getCurrentStage() != GrantApplication.ApplicationStage.FINANCE_APPROVAL) {
                throw new IllegalStateException("Finance Approver can only review applications in FINANCE_APPROVAL stage.");
            }
        }

        // Validate reapply reason
        if ("REAPPLY".equalsIgnoreCase(normalizedAction)) {
            if (reason == null || reason.trim().isEmpty()) {
                throw new IllegalArgumentException("Please provide a reason for reapplication.");
            }
        }

        // Execute State Machine Transitions
        switch (normalizedAction) {
            case "APPROVE":
            case "APPROVED":
                workflowDecision = VerificationWorkflow.ActionDecision.APPROVED;
                if (app.getCurrentStage() == GrantApplication.ApplicationStage.FIELD_VERIFICATION) {
                    workflowStage = VerificationWorkflow.WorkflowStage.FIELD_VERIFICATION;
                    toStage = "DISTRICT_REVIEW";
                    actionRecordName = "FIELD_OFFICER_APPROVED";
                    app.setCurrentStage(GrantApplication.ApplicationStage.DISTRICT_REVIEW);
                    app.setStatus("UNDER_REVIEW");
                    app.setRemarks("Ground verification approved by " + actorName + ". Forwarded to District Review.");
                } else if (app.getCurrentStage() == GrantApplication.ApplicationStage.DISTRICT_REVIEW) {
                    workflowStage = VerificationWorkflow.WorkflowStage.DISTRICT_REVIEW;
                    toStage = "FINANCE_APPROVAL";
                    actionRecordName = "DISTRICT_OFFICER_APPROVED";
                    app.setCurrentStage(GrantApplication.ApplicationStage.FINANCE_APPROVAL);
                    app.setStatus("UNDER_REVIEW");
                    app.setRemarks("District sanction approved by " + actorName + ". Forwarded to Finance Treasury.");
                } else if (app.getCurrentStage() == GrantApplication.ApplicationStage.FINANCE_APPROVAL) {
                    workflowStage = VerificationWorkflow.WorkflowStage.FINANCE_APPROVAL;
                    toStage = "APPROVED";
                    actionRecordName = "FINANCE_APPROVED";
                    app.setCurrentStage(GrantApplication.ApplicationStage.APPROVED);
                    app.setStatus("APPROVED");
                    app.setRemarks("Finance and treasury sanction released by " + actorName + ". Ready for PFMS/DBT disbursement.");
                    if (stagedDisbursementRepository.findByApplication(app).isEmpty()) {
                        generateStagedDisbursements(app);
                    }
                } else {
                    toStage = "APPROVED";
                    actionRecordName = "ADMIN_APPROVED";
                    app.setCurrentStage(GrantApplication.ApplicationStage.APPROVED);
                    app.setStatus("APPROVED");
                    if (stagedDisbursementRepository.findByApplication(app).isEmpty()) {
                        generateStagedDisbursements(app);
                    }
                }
                break;

            case "REAPPLY":
            case "SEND_BACK":
                int currentCount = (app.getReapplyCount() != null ? app.getReapplyCount() : 0);
                int maxAllowed = (app.getMaxReapplyAllowed() != null ? app.getMaxReapplyAllowed() : 2);

                // Enforce Statutory Reapply Limit (Real DBT Reference: Max 2 Attempts)
                if (currentCount >= maxAllowed) {
                    workflowDecision = VerificationWorkflow.ActionDecision.REJECTED;
                    toStage = "REJECTED";
                    actionRecordName = actorRole + "_REAPPLY_EXHAUSTED_REJECTED";
                    app.setCurrentStage(GrantApplication.ApplicationStage.REJECTED);
                    app.setStatus("REJECTED");
                    app.setRejectionCategory("REAPPLY_LIMIT_EXHAUSTED");
                    app.setRejectionReason("Maximum statutory reapplication attempts (" + maxAllowed + "/" + maxAllowed + ") exhausted without resolving discrepancies. Application formally closed under scheme rules.");
                    app.setRejectedBy(actorName);
                    app.setRejectedByRole(actorRole);
                    app.setRejectedAt(LocalDateTime.now());
                    app.setAppealDeadline(LocalDateTime.now().plusDays(30));
                    app.setRemarks("Application formally closed: Reapplication attempts limit (" + maxAllowed + ") reached.");
                    break;
                }

                workflowDecision = VerificationWorkflow.ActionDecision.REAPPLY;
                int newCount = currentCount + 1;
                app.setReapplyCount(newCount);
                app.setLastReapplyReason(reason != null ? reason.trim() : notes);
                app.setLastReappliedBy(actorName);
                app.setLastReappliedByRole(actorRole);
                app.setLastReappliedAt(LocalDateTime.now());

                if (app.getCurrentStage() == GrantApplication.ApplicationStage.FIELD_VERIFICATION) {
                    // FIELD OFFICER REAPPLY -> Sends back to BENEFICIARY for correction
                    workflowStage = VerificationWorkflow.WorkflowStage.FIELD_VERIFICATION;
                    toStage = "FIELD_VERIFICATION";
                    actionRecordName = "FIELD_OFFICER_REAPPLIED";
                    app.setCurrentStage(GrantApplication.ApplicationStage.FIELD_VERIFICATION);
                    app.setStatus("REAPPLY_REQUIRED");
                    app.setRemarks("Reapplication requested by Field Officer (Attempt " + newCount + " of " + maxAllowed + "): " + reason);
                } else if (app.getCurrentStage() == GrantApplication.ApplicationStage.DISTRICT_REVIEW) {
                    // DISTRICT OFFICER REAPPLY -> Returns to FIELD OFFICER
                    workflowStage = VerificationWorkflow.WorkflowStage.DISTRICT_REVIEW;
                    toStage = "FIELD_VERIFICATION";
                    actionRecordName = "DISTRICT_OFFICER_REAPPLIED";
                    app.setCurrentStage(GrantApplication.ApplicationStage.FIELD_VERIFICATION);
                    app.setStatus("UNDER_REVIEW");
                    app.setRemarks("Sent back to Field Officer by District Review Authority: " + reason);
                } else if (app.getCurrentStage() == GrantApplication.ApplicationStage.FINANCE_APPROVAL) {
                    // FINANCE APPROVER REAPPLY -> Returns to DISTRICT OFFICER
                    workflowStage = VerificationWorkflow.WorkflowStage.FINANCE_APPROVAL;
                    toStage = "DISTRICT_REVIEW";
                    actionRecordName = "FINANCE_REAPPLIED";
                    app.setCurrentStage(GrantApplication.ApplicationStage.DISTRICT_REVIEW);
                    app.setStatus("UNDER_REVIEW");
                    app.setRemarks("Sent back to District Review by Finance Approver: " + reason);
                } else {
                    workflowStage = VerificationWorkflow.WorkflowStage.FIELD_VERIFICATION;
                    toStage = "FIELD_VERIFICATION";
                    actionRecordName = "REAPPLIED";
                    app.setCurrentStage(GrantApplication.ApplicationStage.FIELD_VERIFICATION);
                    app.setStatus("REAPPLY_REQUIRED");
                    app.setRemarks("Reapplication requested: " + reason);
                }
                break;

            case "RESUBMIT":
            case "RESUBMITTED":
                int curCount = (app.getReapplyCount() != null ? app.getReapplyCount() : 0);
                int limit = (app.getMaxReapplyAllowed() != null ? app.getMaxReapplyAllowed() : 2);
                if (curCount > limit) {
                    throw new IllegalStateException("Maximum permitted reapplication attempts (" + limit + ") have already been exhausted. Resubmission is not permitted.");
                }

                workflowDecision = VerificationWorkflow.ActionDecision.RESUBMITTED;
                workflowStage = VerificationWorkflow.WorkflowStage.BENEFICIARY_RESUBMISSION;
                fromStage = "REAPPLY_REQUIRED";
                toStage = "FIELD_VERIFICATION";
                actionRecordName = "BENEFICIARY_RESUBMITTED";
                app.setCurrentStage(GrantApplication.ApplicationStage.FIELD_VERIFICATION);
                app.setStatus("UNDER_REVIEW");
                app.setRemarks("Application corrected and resubmitted by beneficiary (Attempt " + curCount + " of " + limit + "). Ready for Field Officer ground review.");

                if (dynamicFieldAnswersJson != null && !dynamicFieldAnswersJson.trim().isEmpty()) {
                    app.setDynamicFieldAnswersJson(dynamicFieldAnswersJson);
                }
                if (proofDocumentUrl != null && !proofDocumentUrl.trim().isEmpty()) {
                    app.setSchemeDocumentUrl(proofDocumentUrl);
                }
                break;

            case "REJECT":
            case "REJECTED":
                workflowDecision = VerificationWorkflow.ActionDecision.REJECTED;
                toStage = "REJECTED";
                actionRecordName = actorRole + "_REJECTED";
                app.setCurrentStage(GrantApplication.ApplicationStage.REJECTED);
                app.setStatus("REJECTED");

                String assignedCat = rejectionCategory != null && !rejectionCategory.trim().isEmpty()
                        ? rejectionCategory.trim()
                        : "SCHEME_CRITERIA_UNMET";
                app.setRejectionCategory(assignedCat);
                app.setRejectionReason(reason != null && !reason.trim().isEmpty() ? reason.trim() : (notes != null ? notes.trim() : "Application rejected by reviewing officer."));
                app.setRejectedBy(actorName);
                app.setRejectedByRole(actorRole);
                app.setRejectedAt(LocalDateTime.now());
                app.setAppealDeadline(LocalDateTime.now().plusDays(30)); // Statutory 30 days window
                app.setRemarks("Formal rejection by " + actorName + " (" + actorRole + "): [" + assignedCat + "] " + app.getRejectionReason());
                break;

            case "REQUEST_RE_VERIFICATION":
            case "RE_VERIFICATION_REQUESTED":
            case "APPEAL":
                if (!"REJECTED".equalsIgnoreCase(app.getStatus())) {
                    throw new IllegalStateException("Only rejected applications can be submitted for re-verification / statutory appeal.");
                }
                if (app.getAppealDeadline() != null && LocalDateTime.now().isAfter(app.getAppealDeadline())) {
                    throw new IllegalStateException("Statutory appeal window (30 days from rejection) has expired. Application cannot be appealed.");
                }
                workflowDecision = VerificationWorkflow.ActionDecision.RE_VERIFICATION_REQUESTED;
                workflowStage = VerificationWorkflow.WorkflowStage.RE_VERIFICATION_APPEAL;
                fromStage = "REJECTED";
                toStage = "DISTRICT_REVIEW";
                actionRecordName = "BENEFICIARY_APPEAL_FILED";
                app.setCurrentStage(GrantApplication.ApplicationStage.DISTRICT_REVIEW);
                app.setStatus("RE_VERIFICATION_REQUESTED");
                app.setReVerificationAppealGrounds(reason != null ? reason.trim() : notes);
                if (proofDocumentUrl != null && !proofDocumentUrl.trim().isEmpty()) {
                    app.setReVerificationDocumentUrl(proofDocumentUrl);
                }
                app.setReVerificationRequestedAt(LocalDateTime.now());
                app.setRemarks("Statutory appeal / re-verification request filed by applicant: " + app.getReVerificationAppealGrounds());
                break;

            case "ACCEPT_RE_VERIFICATION":
            case "RE_VERIFY_ACCEPTED":
                workflowDecision = VerificationWorkflow.ActionDecision.APPEAL_ACCEPTED;
                workflowStage = VerificationWorkflow.WorkflowStage.DISTRICT_REVIEW;
                fromStage = "RE_VERIFICATION_REQUESTED";
                toStage = "FIELD_VERIFICATION";
                actionRecordName = "DISTRICT_APPEAL_ACCEPTED";
                app.setCurrentStage(GrantApplication.ApplicationStage.FIELD_VERIFICATION);
                app.setStatus("UNDER_REVIEW");
                app.setReVerificationDisposalNotes(reason != null ? reason.trim() : notes);
                app.setReVerificationDisposedBy(actorName);
                app.setReVerificationDisposedAt(LocalDateTime.now());
                app.setRemarks("Re-verification appeal accepted by District Authority (" + actorName + "). Dispatched to Field Officer for fresh physical inspection: " + app.getReVerificationDisposalNotes());
                break;

            case "UPHOLD_REJECTION":
            case "DISMISS_APPEAL":
                workflowDecision = VerificationWorkflow.ActionDecision.REJECTION_UPHELD;
                workflowStage = VerificationWorkflow.WorkflowStage.DISTRICT_REVIEW;
                fromStage = "RE_VERIFICATION_REQUESTED";
                toStage = "REJECTED";
                actionRecordName = "DISTRICT_APPEAL_DISMISSED";
                app.setCurrentStage(GrantApplication.ApplicationStage.REJECTED);
                app.setStatus("REJECTED");
                app.setReVerificationDisposalNotes(reason != null ? reason.trim() : notes);
                app.setReVerificationDisposedBy(actorName);
                app.setReVerificationDisposedAt(LocalDateTime.now());
                app.setRemarks("Statutory appeal formally dismissed and rejection upheld by District Authority (" + actorName + "): " + app.getReVerificationDisposalNotes());
                break;

            default:
                throw new IllegalArgumentException("Unknown workflow action: " + actionInput);
        }

        app.setUpdatedAt(LocalDateTime.now());

        // 1. Save Workflow History record (Every forward & backward step preserved)
        VerificationWorkflow workflow = VerificationWorkflow.builder()
                .application(app)
                .stage(workflowStage)
                .action(actionRecordName)
                .fromStage(fromStage)
                .toStage(toStage)
                .performedBy(performedByUser)
                .performedByUsername(actorUsername)
                .performedByRole(actorRole)
                .decision(workflowDecision)
                .reason(reason != null ? reason : notes)
                .groundNotes(notes != null ? notes : reason)
                .proofDocumentUrl(proofDocumentUrl)
                .actionTimestamp(LocalDateTime.now())
                .build();

        workflowRepository.save(workflow);

        // 2. Save Updated Application
        GrantApplication savedApp = applicationRepository.save(app);

        // 3. Log into Sovereign Audit Trail
        auditService.logAction(
                actionRecordName,
                actorUsername,
                actorRole,
                "GrantApplication",
                savedApp.getId().toString(),
                "From: " + fromStage + " -> To: " + toStage + " | App: " + savedApp.getApplicationNo() + " | Reason: " + (reason != null ? reason : notes)
        );

        // 4. Dispatch Automated Multi-Channel Notifications
        try {
            dispatchWorkflowNotifications(savedApp, normalizedAction, reason, notes, actorName, actorRole);
        } catch (Exception ex) {
            // Log but ensure workflow transaction completes
        }

        return savedApp;
    }

    private void dispatchWorkflowNotifications(
            GrantApplication app,
            String action,
            String reason,
            String notes,
            String actorName,
            String actorRole
    ) {
        User beneficiaryUser = app.getBeneficiary() != null ? app.getBeneficiary().getUser() : null;
        String applicantName = app.getBeneficiary() != null ? app.getBeneficiary().getFullName() : "Beneficiary";
        String effectiveReason = reason != null && !reason.isBlank() ? reason.trim() : (notes != null ? notes.trim() : "Standard workflow progression.");

        switch (action) {
            case "REAPPLY":
            case "SEND_BACK":
                if ("REAPPLY_REQUIRED".equalsIgnoreCase(app.getStatus())) {
                    notificationService.sendToUser(
                            beneficiaryUser,
                            "Action Required: Correction Requested (" + app.getApplicationNo() + ")",
                            "Review Officer " + actorName + " (" + actorRole + ") requested application corrections: \"" + effectiveReason + "\". Attempts remaining: " + app.getRemainingReapplies() + " of " + (app.getMaxReapplyAllowed() != null ? app.getMaxReapplyAllowed() : 2) + ".",
                            "ACTION_REQUIRED",
                            app.getId(),
                            app.getApplicationNo(),
                            "/beneficiary/applications",
                            null
                    );
                } else if (app.getCurrentStage() == GrantApplication.ApplicationStage.FIELD_VERIFICATION) {
                    notificationService.sendToRole(
                            "FIELD_OFFICER",
                            "Ground Re-Inspection Required: " + app.getApplicationNo(),
                            "District Authority " + actorName + " returned application for re-verification: \"" + effectiveReason + "\"",
                            "WARNING",
                            app.getId(),
                            app.getApplicationNo(),
                            "/field/verification-queue"
                    );
                } else if (app.getCurrentStage() == GrantApplication.ApplicationStage.DISTRICT_REVIEW) {
                    notificationService.sendToRole(
                            "DISTRICT_OFFICER",
                            "Application Returned by Treasury: " + app.getApplicationNo(),
                            "Finance Approver " + actorName + " returned application for budget clarification: \"" + effectiveReason + "\"",
                            "WARNING",
                            app.getId(),
                            app.getApplicationNo(),
                            "/district/sanction-queue"
                    );
                }
                break;

            case "RESUBMIT":
            case "RESUBMITTED":
                notificationService.sendToRole(
                        "FIELD_OFFICER",
                        "Application Resubmitted by Citizen: " + app.getApplicationNo(),
                        "Applicant " + applicantName + " resubmitted corrected documents (Attempt " + app.getReapplyCount() + " of " + (app.getMaxReapplyAllowed() != null ? app.getMaxReapplyAllowed() : 2) + "). Ready for inspection.",
                        "INFO",
                        app.getId(),
                        app.getApplicationNo(),
                        "/field/verification-queue"
                );
                notificationService.sendToUser(
                        beneficiaryUser,
                        "Resubmission Acknowledged (" + app.getApplicationNo() + ")",
                        "Your updated records have been received and assigned to Field Officer for ground verification.",
                        "SUCCESS",
                        app.getId(),
                        app.getApplicationNo(),
                        "/beneficiary/applications",
                        null
                );
                break;

            case "APPROVE":
                if (app.getCurrentStage() == GrantApplication.ApplicationStage.DISTRICT_REVIEW) {
                    notificationService.sendToRole(
                            "DISTRICT_OFFICER",
                            "Field Verification Cleared: " + app.getApplicationNo(),
                            "Field Officer " + actorName + " cleared ground inspection for " + applicantName + " (Score: " + app.getEligibilityScore() + "/100). Awaiting administrative sanction.",
                            "INFO",
                            app.getId(),
                            app.getApplicationNo(),
                            "/district/sanction-queue"
                    );
                } else if (app.getCurrentStage() == GrantApplication.ApplicationStage.FINANCE_APPROVAL) {
                    notificationService.sendToRole(
                            "FINANCE_APPROVER",
                            "District Administrative Sanction Granted: " + app.getApplicationNo(),
                            "District Sanction order signed for ₹" + (app.getAppliedGrantAmount() != null ? app.getAppliedGrantAmount().longValue() : 0) + ". Awaiting treasury mandate clearance.",
                            "INFO",
                            app.getId(),
                            app.getApplicationNo(),
                            "/finance/approval-queue"
                    );
                } else if (app.getCurrentStage() == GrantApplication.ApplicationStage.APPROVED) {
                    notificationService.sendToUser(
                            beneficiaryUser,
                            "🎉 Grant Sanctioned & Disbursed (" + app.getApplicationNo() + ")",
                            "Treasury fund release authorized! Total grant of ₹" + (app.getAppliedGrantAmount() != null ? app.getAppliedGrantAmount().longValue() : 0) + " released under PFMS DBT mandate.",
                            "SUCCESS",
                            app.getId(),
                            app.getApplicationNo(),
                            "/beneficiary/disbursements",
                            null
                    );
                }
                break;

            case "REJECT":
            case "REJECTED":
                notificationService.sendToUser(
                        beneficiaryUser,
                        "Statutory Disqualification Notice (" + app.getApplicationNo() + ")",
                        "Your application was disqualified under category [" + (app.getRejectionCategory() != null ? app.getRejectionCategory() : "CRITERIA_UNMET") + "]: " + (app.getRejectionReason() != null ? app.getRejectionReason() : effectiveReason) + ". You have a 30-day window to file a statutory appeal.",
                        "REJECTION",
                        app.getId(),
                        app.getApplicationNo(),
                        "/beneficiary/applications",
                        null
                );
                break;

            case "REQUEST_RE_VERIFICATION":
            case "APPEAL":
                notificationService.sendToRole(
                        "DISTRICT_OFFICER",
                        "⚖️ Statutory Appeal Filed: " + app.getApplicationNo(),
                        "Applicant " + applicantName + " submitted a statutory appeal against rejection: \"" + (app.getReVerificationAppealGrounds() != null ? app.getReVerificationAppealGrounds() : effectiveReason) + "\"",
                        "APPEAL",
                        app.getId(),
                        app.getApplicationNo(),
                        "/district/sanction-queue"
                );
                break;

            case "ACCEPT_RE_VERIFICATION":
                notificationService.sendToUser(
                        beneficiaryUser,
                        "⚖️ Statutory Appeal Accepted (" + app.getApplicationNo() + ")",
                        "District Authority accepted your grievance appeal. Application dispatched to Field Officer for fresh ground verification.",
                        "SUCCESS",
                        app.getId(),
                        app.getApplicationNo(),
                        "/beneficiary/applications",
                        null
                );
                notificationService.sendToRole(
                        "FIELD_OFFICER",
                        "Re-Inspection Ordered under Appeal Mandate: " + app.getApplicationNo(),
                        "District Sanction Authority accepted citizen appeal. Please perform fresh physical ground verification.",
                        "ACTION_REQUIRED",
                        app.getId(),
                        app.getApplicationNo(),
                        "/field/verification-queue"
                );
                break;

            case "UPHOLD_REJECTION":
                notificationService.sendToUser(
                        beneficiaryUser,
                        "⚖️ Final Statutory Order: Rejection Upheld (" + app.getApplicationNo() + ")",
                        "District Review Authority examined appeal records and upheld the rejection order. Application stands formally closed.",
                        "REJECTION",
                        app.getId(),
                        app.getApplicationNo(),
                        "/beneficiary/applications",
                        null
                );
                break;
        }
    }

    @Transactional
    public VerificationWorkflow processWorkflowDecision(
            Long applicationId,
            VerificationWorkflow.WorkflowStage stage,
            User performedBy,
            VerificationWorkflow.ActionDecision decision,
            String notes,
            String proofUrl
    ) {
        String actionStr = "APPROVE";
        if (decision == VerificationWorkflow.ActionDecision.REJECTED) {
            actionStr = "REJECT";
        } else if (decision == VerificationWorkflow.ActionDecision.REAPPLY || decision == VerificationWorkflow.ActionDecision.RE_VERIFICATION_REQUESTED) {
            actionStr = "REAPPLY";
        }

        executeWorkflowAction(
                applicationId,
                actionStr,
                notes,
                notes,
                performedBy,
                performedBy != null ? performedBy.getUsername() : "SYSTEM",
                performedBy != null ? performedBy.getRole().name() : "ADMIN",
                null,
                proofUrl
        );

        return workflowRepository.findByApplicationOrderByIdAsc(
                applicationRepository.findById(applicationId).orElseThrow()
        ).stream().reduce((first, second) -> second).orElse(null);
    }

    private void generateStagedDisbursements(GrantApplication app) {
        SchemeMaster scheme = app.getScheme();
        Double totalAmount = app.getAppliedGrantAmount() != null ? app.getAppliedGrantAmount() : 50000.0;

        // Update allocated budget in scheme
        if (scheme != null) {
            if (scheme.getAllocatedBudget() == null) scheme.setAllocatedBudget(0.0);
            scheme.setAllocatedBudget(scheme.getAllocatedBudget() + totalAmount);
            schemeMasterRepository.save(scheme);
        }

        // Default 3 Staged Milestones: 30% Advance, 40% Mid-term proof, 30% Final completion
        StagedDisbursement stage1 = StagedDisbursement.builder()
                .application(app)
                .stageNumber(1)
                .milestoneName("Stage 1: Advance Grant Release & Documentation Verification")
                .grantPercentage(30.0)
                .scheduledAmount(totalAmount * 0.30)
                .disbursedAmount(0.0)
                .dueDate(LocalDate.now().plusDays(7))
                .status(StagedDisbursement.MilestoneStatus.PENDING_COMPLIANCE)
                .build();

        StagedDisbursement stage2 = StagedDisbursement.builder()
                .application(app)
                .stageNumber(2)
                .milestoneName("Stage 2: Mid-Term Implementation & Field Utilization Proof")
                .grantPercentage(40.0)
                .scheduledAmount(totalAmount * 0.40)
                .disbursedAmount(0.0)
                .dueDate(LocalDate.now().plusDays(30))
                .status(StagedDisbursement.MilestoneStatus.PENDING_COMPLIANCE)
                .build();

        StagedDisbursement stage3 = StagedDisbursement.builder()
                .application(app)
                .stageNumber(3)
                .milestoneName("Stage 3: Project Completion & Final Audit Compliance")
                .grantPercentage(30.0)
                .scheduledAmount(totalAmount * 0.30)
                .disbursedAmount(0.0)
                .dueDate(LocalDate.now().plusDays(60))
                .status(StagedDisbursement.MilestoneStatus.PENDING_COMPLIANCE)
                .build();

        stagedDisbursementRepository.saveAll(List.of(stage1, stage2, stage3));
    }
}
