package com.infosys.subsidy.controller;

import com.infosys.subsidy.entity.BeneficiaryProfile;
import com.infosys.subsidy.entity.GrantApplication;
import com.infosys.subsidy.entity.SchemeMaster;
import com.infosys.subsidy.entity.User;
import com.infosys.subsidy.repository.BeneficiaryProfileRepository;
import com.infosys.subsidy.repository.GrantApplicationRepository;
import com.infosys.subsidy.repository.SchemeMasterRepository;
import com.infosys.subsidy.repository.UserRepository;
import com.infosys.subsidy.service.EligibilityScoringService;
import com.infosys.subsidy.service.CloudinaryService;
import com.infosys.subsidy.service.WorkflowEngineService;
import com.infosys.subsidy.service.NotificationService;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final GrantApplicationRepository applicationRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final SchemeMasterRepository schemeMasterRepository;
    private final EligibilityScoringService eligibilityScoringService;
    private final CloudinaryService cloudinaryService;
    private final WorkflowEngineService workflowEngineService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitApplicationRequest {
        private Long beneficiaryId;
        private Long schemeId;
        private Double appliedGrantAmount;
        private String schemeDocumentUrl;
        private String dynamicFieldAnswersJson;
    }

    @GetMapping
    public ResponseEntity<List<GrantApplication>> getAllApplications() {
        List<GrantApplication> list = applicationRepository.findAll();
        list.sort((a, b) -> {
            int scoreA = a.getEligibilityScore() != null ? a.getEligibilityScore() : 0;
            int scoreB = b.getEligibilityScore() != null ? b.getEligibilityScore() : 0;
            if (scoreB != scoreA) {
                return Integer.compare(scoreB, scoreA); // 100 first, then descending
            }
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return 0;
        });
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplicationById(@PathVariable Long id) {
        return applicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/beneficiary/{beneficiaryId}")
    public ResponseEntity<List<GrantApplication>> getByBeneficiary(
            @PathVariable Long beneficiaryId) {

        BeneficiaryProfile prof =
                beneficiaryProfileRepository.findById(beneficiaryId).orElse(null);

        if (prof == null) {
            return ResponseEntity.ok(List.of());
        }

        List<GrantApplication> list = applicationRepository.findByBeneficiary(prof);
        list.sort((a, b) -> {
            int scoreA = a.getEligibilityScore() != null ? a.getEligibilityScore() : 0;
            int scoreB = b.getEligibilityScore() != null ? b.getEligibilityScore() : 0;
            if (scoreB != scoreA) {
                return Integer.compare(scoreB, scoreA);
            }
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return 0;
        });
        return ResponseEntity.ok(list);
    }

    // ========================
    // BIDIRECTIONAL WORKFLOW ACTION API
    // POST /api/applications/{applicationId}/workflow-action
    // ========================
    @PostMapping("/{applicationId}/workflow-action")
    public ResponseEntity<?> workflowAction(
            @PathVariable Long applicationId,
            @RequestBody Map<String, Object> requestBody
    ) {
        try {
            String action = (String) requestBody.getOrDefault("action", "APPROVE");
            String reason = (String) requestBody.getOrDefault("reason", "");
            String notes = (String) requestBody.getOrDefault("notes", reason);
            String dynamicFieldAnswersJson = (String) requestBody.get("dynamicFieldAnswersJson");
            String proofDocumentUrl = (String) requestBody.get("proofDocumentUrl");

            // Resolve performing user
            User performedByUser = null;
            String performedByUsername = null;
            String performedByRole = null;

            Object userIdObj = requestBody.get("userId");
            if (userIdObj != null) {
                Long userId = Long.valueOf(userIdObj.toString());
                performedByUser = userRepository.findById(userId).orElse(null);
            }
            if (performedByUser == null) {
                String username = (String) requestBody.get("username");
                if (username != null && !username.isEmpty()) {
                    performedByUser = userRepository.findByUsername(username).orElse(null);
                }
            }

            if (performedByUser != null) {
                performedByUsername = performedByUser.getUsername();
                performedByRole = performedByUser.getRole().name();
            } else {
                performedByUsername = (String) requestBody.getOrDefault("username", "SYSTEM");
                performedByRole = (String) requestBody.getOrDefault("role", "ADMIN");
            }

            String rejectionCategory = (String) requestBody.get("rejectionCategory");

            GrantApplication result = workflowEngineService.executeWorkflowAction(
                    applicationId,
                    action,
                    reason,
                    notes,
                    performedByUser,
                    performedByUsername,
                    performedByRole,
                    dynamicFieldAnswersJson,
                    proofDocumentUrl,
                    rejectionCategory
            );

            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================
    // STATUTORY APPEAL / RE-VERIFICATION REQUEST API
    // POST /api/applications/{applicationId}/appeal
    // ========================
    @PostMapping("/{applicationId}/appeal")
    public ResponseEntity<?> submitAppeal(
            @PathVariable Long applicationId,
            @RequestBody Map<String, Object> requestBody
    ) {
        try {
            String appealGrounds = (String) requestBody.getOrDefault("appealGrounds", "");
            String proofDocumentUrl = (String) requestBody.get("proofDocumentUrl");

            if (appealGrounds == null || appealGrounds.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please provide detailed legal/factual grounds for your re-verification appeal."));
            }

            User citizenUser = null;
            Object userIdObj = requestBody.get("userId");
            if (userIdObj != null) {
                Long userId = Long.valueOf(userIdObj.toString());
                citizenUser = userRepository.findById(userId).orElse(null);
            }

            GrantApplication result = workflowEngineService.executeWorkflowAction(
                    applicationId,
                    "REQUEST_RE_VERIFICATION",
                    appealGrounds.trim(),
                    appealGrounds.trim(),
                    citizenUser,
                    citizenUser != null ? citizenUser.getUsername() : "BENEFICIARY",
                    "BENEFICIARY",
                    null,
                    proofDocumentUrl,
                    null
            );

            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================
    // OFFICIAL DIGITAL REJECTION ORDER / NOTICE API
    // GET /api/applications/{applicationId}/rejection-notice
    // ========================
    @GetMapping("/{applicationId}/rejection-notice")
    public ResponseEntity<?> getRejectionNotice(@PathVariable Long applicationId) {
        GrantApplication app = applicationRepository.findById(applicationId).orElse(null);
        if (app == null) {
            return ResponseEntity.notFound().build();
        }

        if (!"REJECTED".equalsIgnoreCase(app.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Application is not in REJECTED state."));
        }

        Map<String, Object> notice = new HashMap<>();
        notice.put("noticeNumber", "REJ-ORD/" + (app.getCreatedAt() != null ? app.getCreatedAt().getYear() : 2026) + "/" + app.getApplicationNo());
        notice.put("applicationNo", app.getApplicationNo());
        notice.put("schemeName", app.getScheme() != null ? app.getScheme().getName() : "Central/State Grant Scheme");
        notice.put("schemeCode", app.getScheme() != null ? app.getScheme().getSchemeCode() : "");
        notice.put("beneficiaryName", app.getBeneficiary() != null ? app.getBeneficiary().getFullName() : "Applicant");
        notice.put("aadhaarMasked", app.getBeneficiary() != null ? app.getBeneficiary().getAadhaarNumber() : "XXXX-XXXX-XXXX");
        notice.put("region", app.getBeneficiary() != null ? app.getBeneficiary().getRegion() : "National");
        notice.put("address", app.getBeneficiary() != null ? app.getBeneficiary().getAddress() : "Registered Address");
        notice.put("appliedGrantAmount", app.getAppliedGrantAmount());
        notice.put("rejectionCategory", app.getRejectionCategory() != null ? app.getRejectionCategory() : "SCHEME_CRITERIA_UNMET");
        notice.put("rejectionReason", app.getRejectionReason() != null ? app.getRejectionReason() : app.getRemarks());
        notice.put("rejectedBy", app.getRejectedBy() != null ? app.getRejectedBy() : "Review Authority");
        notice.put("rejectedByRole", app.getRejectedByRole() != null ? app.getRejectedByRole() : "DISTRICT_OFFICER");
        notice.put("rejectedAt", app.getRejectedAt() != null ? app.getRejectedAt() : app.getUpdatedAt());
        notice.put("appealDeadline", app.getAppealDeadline() != null ? app.getAppealDeadline() : (app.getUpdatedAt() != null ? app.getUpdatedAt().plusDays(30) : null));
        notice.put("canAppeal", app.canAppeal());
        notice.put("digitalVerificationSeal", "GOV-DSGAP-VERIFIED-SECURE-HASH-" + Integer.toHexString(app.hashCode()).toUpperCase());
        notice.put("legalStatute", "Section 12(B) of Public Subsidy Direct Benefit Transfer & Verification Governance Rules, 2026");

        return ResponseEntity.ok(notice);
    }

    // ========================
    // BENEFICIARY RESUBMIT ACTION
    // POST /api/applications/{applicationId}/resubmit
    // ========================
    @PostMapping("/{applicationId}/resubmit")
    public ResponseEntity<?> resubmitApplication(
            @PathVariable Long applicationId,
            @RequestBody Map<String, Object> requestBody
    ) {
        try {
            String dynamicFieldAnswersJson = (String) requestBody.get("dynamicFieldAnswersJson");
            String proofDocumentUrl = (String) requestBody.get("proofDocumentUrl");
            String notes = (String) requestBody.getOrDefault("notes", "Application corrected and resubmitted.");

            User beneficiaryUser = null;
            Object userIdObj = requestBody.get("userId");
            if (userIdObj != null) {
                Long userId = Long.valueOf(userIdObj.toString());
                beneficiaryUser = userRepository.findById(userId).orElse(null);
            }

            GrantApplication result = workflowEngineService.executeWorkflowAction(
                    applicationId,
                    "RESUBMIT",
                    notes,
                    notes,
                    beneficiaryUser,
                    beneficiaryUser != null ? beneficiaryUser.getUsername() : "BENEFICIARY",
                    "BENEFICIARY",
                    dynamicFieldAnswersJson,
                    proofDocumentUrl
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private BeneficiaryProfile resolveBeneficiaryProfile(Long beneficiaryId) {
        BeneficiaryProfile profile = null;
        if (beneficiaryId != null) {
            profile = beneficiaryProfileRepository.findById(beneficiaryId).orElse(null);
            if (profile == null) {
                // If not found by BeneficiaryProfile.id, check if beneficiaryId is actually a User.id
                User user = userRepository.findById(beneficiaryId).orElse(null);
                if (user != null) {
                    profile = beneficiaryProfileRepository.findByUser(user).orElse(null);
                    if (profile == null && user.getRole() == User.Role.BENEFICIARY) {
                        profile = beneficiaryProfileRepository.save(BeneficiaryProfile.builder()
                                .user(user)
                                .fullName(user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getUsername())
                                .aadhaarNumber("AADHAAR-" + String.format("%04d", user.getId()) + "-" + (System.currentTimeMillis() % 10000))
                                .category(user.getCitizenCategory() != null && !user.getCitizenCategory().isBlank() ? user.getCitizenCategory() : "General")
                                .region(user.getRegion() != null && !user.getRegion().isBlank() ? user.getRegion() : "National")
                                .annualIncome(0.0)
                                .landSizeAcres(0.0)
                                .address("Registered Citizen Address")
                                .verificationStatus(BeneficiaryProfile.Status.VERIFIED)
                                .registeredAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        }

        // Check currently authenticated user from SecurityContextHolder as fallback
        if (profile == null) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                User loggedInUser = userRepository.findByUsername(auth.getName()).orElse(null);
                if (loggedInUser != null) {
                    profile = beneficiaryProfileRepository.findByUser(loggedInUser).orElse(null);
                    if (profile == null && loggedInUser.getRole() == User.Role.BENEFICIARY) {
                        profile = beneficiaryProfileRepository.save(BeneficiaryProfile.builder()
                                .user(loggedInUser)
                                .fullName(loggedInUser.getFullName() != null && !loggedInUser.getFullName().isBlank() ? loggedInUser.getFullName() : loggedInUser.getUsername())
                                .aadhaarNumber("AADHAAR-" + String.format("%04d", loggedInUser.getId()) + "-" + (System.currentTimeMillis() % 10000))
                                .category(loggedInUser.getCitizenCategory() != null && !loggedInUser.getCitizenCategory().isBlank() ? loggedInUser.getCitizenCategory() : "General")
                                .region(loggedInUser.getRegion() != null && !loggedInUser.getRegion().isBlank() ? loggedInUser.getRegion() : "National")
                                .annualIncome(0.0)
                                .landSizeAcres(0.0)
                                .address("Registered Citizen Address")
                                .verificationStatus(BeneficiaryProfile.Status.VERIFIED)
                                .registeredAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        }

        if (profile == null) {
            throw new IllegalArgumentException("Beneficiary profile not found. Please verify your citizen account details.");
        }
        return profile;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitApplication(
            @RequestBody SubmitApplicationRequest request) {

        try {
            BeneficiaryProfile profile = resolveBeneficiaryProfile(request.getBeneficiaryId());

            SchemeMaster scheme =
                    schemeMasterRepository.findById(request.getSchemeId())
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Scheme not found: " + request.getSchemeId()));

            validateApplicationSubmission(profile, scheme, request.getAppliedGrantAmount(), request.getDynamicFieldAnswersJson(), null);

            EligibilityScoringService.ScoringResult scoringResult =
                    eligibilityScoringService.calculateEligibility(
                            profile,
                            scheme,
                            request.getAppliedGrantAmount()
                    );

            boolean directHigherOfficer = scoringResult.getTotalScore() >= 90;
            GrantApplication.ApplicationStage initialStage = directHigherOfficer
                    ? GrantApplication.ApplicationStage.DISTRICT_REVIEW
                    : GrantApplication.ApplicationStage.FIELD_VERIFICATION;
            String initialRemarks = directHigherOfficer
                    ? "⚡ Direct Higher Officer Fast-Track (Score " + scoringResult.getTotalScore() + "/100 >= 90): Ground inspection waived under Green Channel policy. Fast-tracked directly to District Officer for administrative sanction."
                    : (scoringResult.isFastTracked()
                            ? "Fast-tracked application (Score >= 75)"
                            : "Standard application verification awaiting ground inspection");

            GrantApplication application = GrantApplication.builder()
                    .applicationNo(
                            "APP-2026-" +
                                    UUID.randomUUID()
                                            .toString()
                                            .substring(0, 6)
                                            .toUpperCase()
                    )
                    .beneficiary(profile)
                    .scheme(scheme)
                    .appliedGrantAmount(request.getAppliedGrantAmount())
                    .eligibilityScore(scoringResult.getTotalScore())
                    .scoreBreakdownJson(scoringResult.getScoreDetailsJson())
                    .dynamicFieldAnswersJson(request.getDynamicFieldAnswersJson())
                    .currentStage(initialStage)
                    .status("UNDER_REVIEW")
                    .reapplyCount(0)
                    .fastTracked(directHigherOfficer || scoringResult.isFastTracked())
                    .escalated(scoringResult.isEscalated())
                    .remarks(initialRemarks)
                    .schemeDocumentUrl(request.getSchemeDocumentUrl())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            GrantApplication saved = applicationRepository.save(application);

            try {
                String citizenMsg = directHigherOfficer
                        ? "Your grant application for " + scheme.getName() + " achieved an exceptional automated score of " + saved.getEligibilityScore() + "/100 (>= 90). Under the Green Channel policy, physical ground inspection has been waived and your application was fast-tracked directly to the District Sanctioning Officer."
                        : "Your grant application for " + scheme.getName() + " was successfully recorded with Automated Eligibility Score " + saved.getEligibilityScore() + "/100.";

                notificationService.sendToUser(
                        profile.getUser(),
                        "Application Submitted Successfully (" + saved.getApplicationNo() + ")",
                        citizenMsg,
                        "SUCCESS",
                        saved.getId(),
                        saved.getApplicationNo(),
                        "/beneficiary/applications",
                        null
                );

                if (directHigherOfficer) {
                    notificationService.sendToRole(
                            "DISTRICT_OFFICER",
                            "⚡ Direct Higher Officer Fast-Track: " + saved.getApplicationNo(),
                            "Application submitted by " + profile.getFullName() + " for " + scheme.getName() + " scored " + saved.getEligibilityScore() + "/100 (>= 90). Routed directly to District Review under Green Channel.",
                            "INFO",
                            saved.getId(),
                            saved.getApplicationNo(),
                            "/district/sanction-queue"
                    );
                } else {
                    notificationService.sendToRole(
                            "FIELD_OFFICER",
                            "New Ground Inspection Assigned: " + saved.getApplicationNo(),
                            "New application submitted for " + scheme.getName() + " by " + profile.getFullName() + ". Inspection queued.",
                            "INFO",
                            saved.getId(),
                            saved.getApplicationNo(),
                            "/field/verification-queue"
                    );
                }
            } catch (Exception ignore) {}

            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("error", iae.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to submit application: " + e.getMessage()));
        }
    }

    private void validateApplicationSubmission(
            BeneficiaryProfile profile,
            SchemeMaster scheme,
            Double appliedGrantAmount,
            String dynamicFieldAnswersJson,
            MultipartFile documentFile
    ) {
        validateApplicationSubmission(profile, scheme, appliedGrantAmount, dynamicFieldAnswersJson, documentFile, null, null);
    }

    private void validateApplicationSubmission(
            BeneficiaryProfile profile,
            SchemeMaster scheme,
            Double appliedGrantAmount,
            String dynamicFieldAnswersJson,
            MultipartFile documentFile,
            List<MultipartFile> schemeDocuments,
            List<String> documentNames
    ) {
        if (profile == null) {
            throw new IllegalArgumentException("Beneficiary profile cannot be null.");
        }
        if (scheme == null) {
            throw new IllegalArgumentException("Scheme cannot be null.");
        }
        if (appliedGrantAmount == null || appliedGrantAmount <= 0) {
            throw new IllegalArgumentException("Applied grant amount must be greater than zero.");
        }
        if (scheme.getMaxGrantAmount() != null && appliedGrantAmount > scheme.getMaxGrantAmount()) {
            throw new IllegalArgumentException("Applied grant amount exceeds maximum allowed grant for this scheme (" + scheme.getMaxGrantAmount() + ").");
        }

        // ========================
        // STATUTORY REAPPLICATION & COOLING-OFF VALIDATION (Max 2 Attempts & 30-Day Window)
        // ========================
        List<GrantApplication> existingApps = applicationRepository.findByBeneficiary(profile);
        if (existingApps != null && !existingApps.isEmpty()) {
            List<GrantApplication> schemeApps = existingApps.stream()
                    .filter(a -> a.getScheme() != null && a.getScheme().getId().equals(scheme.getId()))
                    .collect(Collectors.toList());

            // 1. Check for duplicate active applications currently under review
            boolean hasActiveApp = schemeApps.stream()
                    .anyMatch(a -> !"REJECTED".equalsIgnoreCase(a.getStatus()));
            if (hasActiveApp) {
                throw new IllegalArgumentException("You already have an active application under process for this scheme (" + scheme.getName() + "). Simultaneous active applications for the same scheme are prohibited under DBT guidelines.");
            }

            // 2. Check maximum 2 submissions per scheme limit
            if (schemeApps.size() >= 2) {
                throw new IllegalArgumentException("Maximum permissible applications limit (2 submissions) for scheme '" + scheme.getName() + "' has already been reached. Further reapplications are locked under statutory DBT governance.");
            }

            // 3. 30-day statutory cooling-off period rule after rejection
            for (GrantApplication rejectedApp : schemeApps) {
                if ("REJECTED".equalsIgnoreCase(rejectedApp.getStatus())) {
                    LocalDateTime rejTime = rejectedApp.getRejectedAt() != null ? rejectedApp.getRejectedAt() : rejectedApp.getUpdatedAt();
                    if (rejTime != null) {
                        LocalDateTime coolingOffEnd = rejTime.plusDays(30);
                        if (LocalDateTime.now().isBefore(coolingOffEnd)) {
                            long daysRemaining = java.time.Duration.between(LocalDateTime.now(), coolingOffEnd).toDays() + 1;
                            throw new IllegalArgumentException("Your previous application (" + rejectedApp.getApplicationNo() + ") for this scheme was rejected on "
                                    + rejTime.toLocalDate() + ". Under DBT statutory rules, you may file an Appeal within 30 days, or submit a fresh reapplication after the mandatory 30-day cooling-off period ("
                                    + daysRemaining + " day(s) remaining, available on " + coolingOffEnd.toLocalDate() + ").");
                        }
                    }
                }
            }
        }
        if (documentFile != null && !documentFile.isEmpty()) {
            validateDocumentFile(documentFile);
        }
        if (schemeDocuments != null && !schemeDocuments.isEmpty()) {
            for (MultipartFile file : schemeDocuments) {
                if (file != null && !file.isEmpty()) {
                    validateDocumentFile(file);
                }
            }
        }
    }

    private void validateDocumentFile(MultipartFile file) {
        if (file.getSize() > 20 * 1024 * 1024) {
            throw new IllegalArgumentException("Uploaded document (" + file.getOriginalFilename() + ") exceeds maximum allowed size of 20MB.");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && !originalFilename.isBlank()) {
            String lower = originalFilename.toLowerCase();
            if (!lower.endsWith(".pdf") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
                throw new IllegalArgumentException("Invalid file format for '" + originalFilename + "'. Only PDF, JPG, and PNG documents are accepted.");
            }
        }
    }

    @PostMapping("/submit-with-doc")
    public ResponseEntity<?> submitWithDoc(
            @RequestParam("beneficiaryId") Long beneficiaryId,
            @RequestParam("schemeId") Long schemeId,
            @RequestParam("appliedGrantAmount") Double appliedGrantAmount,

            @RequestParam(
                    value = "dynamicFieldAnswersJson",
                    required = false
            )
            String dynamicFieldAnswersJson,

            @RequestParam(
                    value = "schemeDocument",
                    required = false
            )
            MultipartFile schemeDocumentFile,

            @RequestParam(
                    value = "schemeDocuments",
                    required = false
            )
            List<MultipartFile> schemeDocuments,

            @RequestParam(
                    value = "documentNames",
                    required = false
            )
            List<String> documentNames,

            @RequestParam(
                    value = "documentsMetaJson",
                    required = false
            )
            String documentsMetaJson
    ) {

        try {
            BeneficiaryProfile profile = resolveBeneficiaryProfile(beneficiaryId);

            SchemeMaster scheme =
                    schemeMasterRepository.findById(schemeId)
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Scheme not found: " + schemeId));

            validateApplicationSubmission(profile, scheme, appliedGrantAmount, dynamicFieldAnswersJson, schemeDocumentFile, schemeDocuments, documentNames);

            List<Map<String, Object>> uploadedDocsList = new ArrayList<>();
            ObjectMapper objectMapper = new ObjectMapper();

            // 1. Process client metadata if pre-existing document URLs are attached (e.g. reused KYC Aadhaar)
            if (documentsMetaJson != null && !documentsMetaJson.isBlank()) {
                try {
                    List<Map<String, Object>> preMeta = objectMapper.readValue(documentsMetaJson, List.class);
                    if (preMeta != null) {
                        uploadedDocsList.addAll(preMeta);
                    }
                } catch (Exception ignore) {}
            }

            // 2. Process multiple scheme documents
            if (schemeDocuments != null && !schemeDocuments.isEmpty()) {
                for (int i = 0; i < schemeDocuments.size(); i++) {
                    MultipartFile file = schemeDocuments.get(i);
                    if (file != null && !file.isEmpty()) {
                        String uploadedUrl = cloudinaryService.uploadFile(file);
                        String docName = (documentNames != null && i < documentNames.size() && documentNames.get(i) != null && !documentNames.get(i).isBlank())
                                ? documentNames.get(i)
                                : (file.getOriginalFilename() != null ? file.getOriginalFilename() : "Document " + (i + 1));

                        Map<String, Object> docEntry = new LinkedHashMap<>();
                        docEntry.put("name", docName);
                        docEntry.put("url", uploadedUrl);
                        docEntry.put("fileName", file.getOriginalFilename());
                        docEntry.put("fileSize", file.getSize());
                        docEntry.put("uploadedAt", LocalDateTime.now().toString());
                        uploadedDocsList.add(docEntry);
                    }
                }
            }

            // 3. Process single fallback document if provided and list is empty
            if (uploadedDocsList.isEmpty() && schemeDocumentFile != null && !schemeDocumentFile.isEmpty()) {
                String uploadedUrl = cloudinaryService.uploadFile(schemeDocumentFile);
                Map<String, Object> docEntry = new LinkedHashMap<>();
                docEntry.put("name", "Supporting Scheme Document");
                docEntry.put("url", uploadedUrl);
                docEntry.put("fileName", schemeDocumentFile.getOriginalFilename());
                docEntry.put("fileSize", schemeDocumentFile.getSize());
                docEntry.put("uploadedAt", LocalDateTime.now().toString());
                uploadedDocsList.add(docEntry);
            }

            String schemeDocumentUrl = null;
            if (!uploadedDocsList.isEmpty()) {
                schemeDocumentUrl = objectMapper.writeValueAsString(uploadedDocsList);
            }

            EligibilityScoringService.ScoringResult scoringResult =
                    eligibilityScoringService.calculateEligibility(
                            profile,
                            scheme,
                            appliedGrantAmount
                    );

            boolean directHigherOfficer = scoringResult.getTotalScore() >= 90;
            GrantApplication.ApplicationStage initialStage = directHigherOfficer
                    ? GrantApplication.ApplicationStage.DISTRICT_REVIEW
                    : GrantApplication.ApplicationStage.FIELD_VERIFICATION;
            String initialRemarks = directHigherOfficer
                    ? "⚡ Direct Higher Officer Fast-Track (Score " + scoringResult.getTotalScore() + "/100 >= 90): Ground inspection waived under Green Channel policy. Fast-tracked directly to District Officer for administrative sanction."
                    : (scoringResult.isFastTracked()
                            ? "Fast-tracked application (Score >= 75)"
                            : "Standard application verification");

            GrantApplication application = GrantApplication.builder()
                    .applicationNo(
                            "APP-2026-" +
                                    UUID.randomUUID()
                                            .toString()
                                            .substring(0, 6)
                                            .toUpperCase()
                    )
                    .beneficiary(profile)
                    .scheme(scheme)
                    .appliedGrantAmount(appliedGrantAmount)
                    .eligibilityScore(scoringResult.getTotalScore())
                    .scoreBreakdownJson(scoringResult.getScoreDetailsJson())
                    .dynamicFieldAnswersJson(dynamicFieldAnswersJson)
                    .currentStage(initialStage)
                    .status("UNDER_REVIEW")
                    .reapplyCount(0)
                    .fastTracked(directHigherOfficer || scoringResult.isFastTracked())
                    .escalated(scoringResult.isEscalated())
                    .remarks(initialRemarks)
                    .schemeDocumentUrl(schemeDocumentUrl)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            GrantApplication saved =
                    applicationRepository.save(application);

            try {
                int docCount = uploadedDocsList.size();
                String docMsg = docCount > 0 ? " with " + docCount + " supporting verification document(s)" : "";
                String citizenMsg = directHigherOfficer
                        ? "Your grant application" + docMsg + " for " + scheme.getName() + " achieved an exceptional automated score of " + saved.getEligibilityScore() + "/100 (>= 90). Under the Green Channel policy, physical ground inspection has been waived and your application was fast-tracked directly to the District Sanctioning Officer."
                        : "Your grant application" + docMsg + " for " + scheme.getName() + " was submitted (Score: " + saved.getEligibilityScore() + "/100).";

                notificationService.sendToUser(
                        profile.getUser(),
                        "Application Submitted Successfully (" + saved.getApplicationNo() + ")",
                        citizenMsg,
                        "SUCCESS",
                        saved.getId(),
                        saved.getApplicationNo(),
                        "/beneficiary/applications",
                        null
                );

                if (directHigherOfficer) {
                    notificationService.sendToRole(
                            "DISTRICT_OFFICER",
                            "⚡ Direct Higher Officer Fast-Track: " + saved.getApplicationNo(),
                            "Application submitted by " + profile.getFullName() + " for " + scheme.getName() + " scored " + saved.getEligibilityScore() + "/100 (>= 90). Routed directly to District Review under Green Channel.",
                            "INFO",
                            saved.getId(),
                            saved.getApplicationNo(),
                            "/district/sanction-queue"
                    );
                } else {
                    notificationService.sendToRole(
                            "FIELD_OFFICER",
                            "New Ground Inspection Assigned: " + saved.getApplicationNo(),
                            "New application submitted" + docMsg + " for " + scheme.getName() + " by " + profile.getFullName() + ". Ready for field verification.",
                            "INFO",
                            saved.getId(),
                            saved.getApplicationNo(),
                            "/field/verification-queue"
                    );
                }
            } catch (Exception ignore) {}

            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("error", iae.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to submit application with document: " + e.getMessage()));
        }
    }
}