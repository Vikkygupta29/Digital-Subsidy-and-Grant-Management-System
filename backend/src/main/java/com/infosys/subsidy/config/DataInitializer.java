package com.infosys.subsidy.config;

import com.infosys.subsidy.entity.*;
import com.infosys.subsidy.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@Order(100)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final SchemeMasterRepository schemeMasterRepository;
    private final GrantApplicationRepository grantApplicationRepository;
    private final StagedDisbursementRepository stagedDisbursementRepository;
    private final VerificationWorkflowRepository verificationWorkflowRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Starting GrantSetu demo database initialization...");

        initUsers();
        initBeneficiaryProfiles();
        initSchemes();
        initApplications();
        initDisbursements();
        initWorkflows();
        initAuditLogs();
        initNotifications();

        log.info("GrantSetu demo database initialization completed successfully.");
    }

    // ============================================================
    // USERS
    // 2 Citizens + Admin + all application-processing officers
    // ============================================================
    private void initUsers() {
        createUser("admin", "admin123", "Harsh Raj",
                "admin@subsidy.gov.in", User.Role.ADMIN, "National HQ");

        createUser("rajesh_farmer", "rajesh123", "Rajesh Kumar Patel",
                "rajesh.patel@gmail.com", User.Role.BENEFICIARY, "North Region");

        createUser("ananya_student", "ananya123", "Ananya Sharma",
                "ananya.sharma@gmail.com", User.Role.BENEFICIARY, "North Region");

        createUser("officer_field", "field123", "Shri Manoj Kumar Yadav",
                "manoj.field@subsidy.gov.in", User.Role.FIELD_OFFICER, "North Region");

        createUser("officer_district", "district123", "Anita Roy",
                "anita.district@subsidy.gov.in", User.Role.DISTRICT_OFFICER, "North Region");

        createUser("officer_finance", "finance123", "Shri Suresh Narayanan",
                "suresh.finance@subsidy.gov.in", User.Role.FINANCE_APPROVER, "National HQ");
    }

    private void createUser(String username, String password, String fullName,
                            String email, User.Role role, String region) {
        if (userRepository.findByUsername(username).isEmpty()) {
            userRepository.save(User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(password))
                    .fullName(fullName)
                    .email(email)
                    .role(role)
                    .region(region)
                    .build());
        }
    }

    // ============================================================
    // BENEFICIARY PROFILES
    // ============================================================
    private void initBeneficiaryProfiles() {
        createRajeshProfile();
        createAnanyaProfile();
    }

    private void createRajeshProfile() {
        userRepository.findByUsername("rajesh_farmer").ifPresent(user -> {
            if (beneficiaryProfileRepository.findByUser(user).isEmpty()) {
                beneficiaryProfileRepository.save(BeneficiaryProfile.builder()
                        .user(user)
                        .aadhaarNumber("2312-8754-4821")
                        .panNumber("ABCDE1234F")
                        .fullName("Rajesh Kumar")
                        .category("Farmer")
                        .annualIncome(180000.0)
                        .landSizeAcres(2.8)
                        .region("North Region")
                        .address("Village Rampur, Varanasi, Uttar Pradesh")
                        .documentType("Aadhaar Card & Land Record")
                        .identityDocumentUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400")
                        .verificationStatus(BeneficiaryProfile.Status.VERIFIED)
                        .registeredAt(LocalDateTime.now().minusMonths(4))
                        .build());
            }
        });
    }

    private void createAnanyaProfile() {
        userRepository.findByUsername("ananya_student").ifPresent(user -> {
            if (beneficiaryProfileRepository.findByUser(user).isEmpty()) {
                beneficiaryProfileRepository.save(BeneficiaryProfile.builder()
                        .user(user)
                        .aadhaarNumber("5873-9845-7354")
                        .panNumber("FGHPS5678L")
                        .fullName("Ananya Sharma")
                        .category("Student")
                        .annualIncome(240000.0)
                        .landSizeAcres(0.0)
                        .region("North Region")
                        .address("Shastri Nagar, Dehradun, Uttarakhand")
                        .documentType("Aadhaar Card & College ID")
                        .identityDocumentUrl("https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400")
                        .verificationStatus(BeneficiaryProfile.Status.VERIFIED)
                        .registeredAt(LocalDateTime.now().minusMonths(2))
                        .build());
            }
        });
    }

    // ============================================================
    // REAL GOVERNMENT SCHEMES
    // The names/categories are real schemes. Monetary/budget values
    // below are demo seed values for the GrantSetu UI, not official
    // policy calculations.
    // ============================================================
    private void initSchemes() {
        createScheme(
                "PM-KISAN",
                "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
                "Central Sector Scheme providing income support to eligible landholding farmer families through DBT.",
                "Agriculture",
                60000000.0, 42000000.0, 34500000.0,
                6000.0, 500000.0,
                "Farmer,Smallholder,Marginal,SC,ST",
                "ALL",
                "Aadhaar Card, Land Record / RoR, Bank Passbook",
                "[{\"key\":\"cropType\",\"label\":\"Primary Crop\",\"type\":\"select\",\"options\":[\"Wheat\",\"Rice\",\"Maize\",\"Pulses\",\"Vegetables\"],\"required\":true},{\"key\":\"landRecordNo\",\"label\":\"Land Record / Khasra Number\",\"type\":\"text\",\"placeholder\":\"e.g. Khasra-382-14B\",\"required\":true},{\"key\":\"bankAccountSeeded\",\"label\":\"Aadhaar-seeded Bank Account\",\"type\":\"select\",\"options\":[\"Yes\",\"No\"],\"required\":true}]",
                "[{\"stageNumber\":1,\"milestoneName\":\"Application Verification\",\"percent\":40},{\"stageNumber\":2,\"milestoneName\":\"Beneficiary Approval\",\"percent\":30},{\"stageNumber\":3,\"milestoneName\":\"DBT Release\",\"percent\":30}]"
        );

        createScheme(
                "PM-USP-CSSS",
                "PM-USP Central Sector Scheme of Scholarship for College and University Students",
                "Central scholarship scheme for meritorious students pursuing higher education, administered through the National Scholarship Portal.",
                "Education",
                30000000.0, 21000000.0, 15500000.0,
                20000.0, 450000.0,
                "Student,General,OBC,SC,ST",
                "ALL",
                "Aadhaar Card, College ID, Previous Examination Marksheet, Income Certificate, Bank Details",
                "[{\"key\":\"courseLevel\",\"label\":\"Course Level\",\"type\":\"select\",\"options\":[\"UG\",\"PG\"],\"required\":true},{\"key\":\"percentage\",\"label\":\"Previous Examination Percentage\",\"type\":\"number\",\"placeholder\":\"e.g. 88\",\"required\":true},{\"key\":\"institutionName\",\"label\":\"College / University\",\"type\":\"text\",\"placeholder\":\"Enter institution name\",\"required\":true},{\"key\":\"familyIncome\",\"label\":\"Annual Family Income\",\"type\":\"number\",\"placeholder\":\"e.g. 240000\",\"required\":true}]",
                "[{\"stageNumber\":1,\"milestoneName\":\"Document Verification\",\"percent\":30},{\"stageNumber\":2,\"milestoneName\":\"Scholarship Approval\",\"percent\":40},{\"stageNumber\":3,\"milestoneName\":\"Scholarship Disbursement\",\"percent\":30}]"
        );

        createScheme(
                "PMAY-G",
                "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
                "Government housing assistance programme for eligible rural households for construction of a pucca house.",
                "Housing",
                50000000.0, 35000000.0, 24000000.0,
                120000.0, 300000.0,
                "Rural Household,BPL,SC,ST",
                "ALL",
                "Aadhaar Card, Rural Residence Proof, Bank Details, Household Verification Documents",
                "[{\"key\":\"ruralResidence\",\"label\":\"Rural Residence\",\"type\":\"select\",\"options\":[\"Yes\",\"No\"],\"required\":true},{\"key\":\"currentHouseType\",\"label\":\"Current House Type\",\"type\":\"select\",\"options\":[\"Kutcha\",\"Semi-Pucca\",\"No House\",\"Pucca\"],\"required\":true},{\"key\":\"landAvailable\",\"label\":\"Land Available for House Construction\",\"type\":\"select\",\"options\":[\"Yes\",\"No\"],\"required\":true},{\"key\":\"bankAccountSeeded\",\"label\":\"Bank Account Available\",\"type\":\"select\",\"options\":[\"Yes\",\"No\"],\"required\":true}]",
                "[{\"stageNumber\":1,\"milestoneName\":\"Site Verification\",\"percent\":30},{\"stageNumber\":2,\"milestoneName\":\"House Construction Progress\",\"percent\":40},{\"stageNumber\":3,\"milestoneName\":\"Completion Verification\",\"percent\":30}]"
        );

        createScheme(
                "PMMVY",
                "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
                "Maternity benefit scheme providing financial support to eligible pregnant and lactating women through DBT.",
                "Women & Child",
                25000000.0, 19500000.0, 17200000.0,
                15000.0, 300000.0,
                "Women,SC,ST,BPL",
                "ALL",
                "Aadhaar Card, MCP Card, Bank Details, Pregnancy / Health Records",
                "[{\"key\":\"pregnancyStatus\",\"label\":\"Pregnancy / Post-natal Status\",\"type\":\"select\",\"options\":[\"Pregnant\",\"Post-natal\"],\"required\":true},{\"key\":\"mcpCardNumber\",\"label\":\"MCP Card Number\",\"type\":\"text\",\"placeholder\":\"Enter MCP card number\",\"required\":true},{\"key\":\"ancCheckup\",\"label\":\"Antenatal Check-up Completed\",\"type\":\"select\",\"options\":[\"Yes\",\"No\"],\"required\":true}]",
                "[{\"stageNumber\":1,\"milestoneName\":\"Registration Verification\",\"percent\":30},{\"stageNumber\":2,\"milestoneName\":\"Health Check Verification\",\"percent\":30},{\"stageNumber\":3,\"milestoneName\":\"DBT Release\",\"percent\":40}]"
        );

        createScheme(
                "PM-SVANIDHI",
                "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
                "Central scheme supporting eligible street vendors with working-capital assistance and digital transaction incentives.",
                "Livelihood",
                20000000.0, 14000000.0, 9000000.0,
                10000.0, 300000.0,
                "Street Vendor,Urban Poor",
                "ALL",
                "Aadhaar Card, Certificate / Letter of Recommendation for Street Vending, Bank Details",
                "[{\"key\":\"vendorType\",\"label\":\"Type of Street Vending\",\"type\":\"select\",\"options\":[\"Food\",\"Clothes\",\"Fruits & Vegetables\",\"Other\"],\"required\":true},{\"key\":\"vendingCertificate\",\"label\":\"Vending Certificate / LoR Available\",\"type\":\"select\",\"options\":[\"Yes\",\"No\"],\"required\":true},{\"key\":\"loanAmount\",\"label\":\"Requested Working Capital\",\"type\":\"number\",\"placeholder\":\"e.g. 10000\",\"required\":true}]",
                "[{\"stageNumber\":1,\"milestoneName\":\"Vendor Verification\",\"percent\":40},{\"stageNumber\":2,\"milestoneName\":\"Loan Sanction\",\"percent\":30},{\"stageNumber\":3,\"milestoneName\":\"Loan Disbursement\",\"percent\":30}]"
        );
    }

    private void createScheme(String code, String name, String description, String category,
                              Double totalBudget, Double allocatedBudget, Double disbursedBudget,
                              Double maxGrantAmount, Double maxIncomeCriteria,
                              String targetCategories, String targetRegion, String requiredDocuments,
                              String dynamicFieldsJson, String stagedMilestonesJson) {
        if (schemeMasterRepository.findBySchemeCode(code).isEmpty()) {
            schemeMasterRepository.save(SchemeMaster.builder()
                    .schemeCode(code)
                    .name(name)
                    .description(description)
                    .category(category)
                    .totalBudget(totalBudget)
                    .allocatedBudget(allocatedBudget)
                    .disbursedBudget(disbursedBudget)
                    .maxGrantAmount(maxGrantAmount)
                    .maxIncomeCriteria(maxIncomeCriteria)
                    .targetCategories(targetCategories)
                    .targetRegion(targetRegion)
                    .requiredDocuments(requiredDocuments)
                    .dynamicFieldsJson(dynamicFieldsJson)
                    .stagedMilestonesJson(stagedMilestonesJson)
                    .active(true)
                    .build());
        }
    }

    // ============================================================
    // APPLICATIONS
    // ============================================================
    private void initApplications() {
        if (grantApplicationRepository.count() > 0) {
            return;
        }

        SchemeMaster kisan = schemeMasterRepository.findBySchemeCode("PM-KISAN").orElse(null);
        SchemeMaster scholarship = schemeMasterRepository.findBySchemeCode("PM-USP-CSSS").orElse(null);
        SchemeMaster pmay = schemeMasterRepository.findBySchemeCode("PMAY-G").orElse(null);

        BeneficiaryProfile rajesh = beneficiaryProfileRepository.findByAadhaarNumber("2322-9566-4821").orElse(null);
        BeneficiaryProfile ananya = beneficiaryProfileRepository.findByAadhaarNumber("7856-2354-7354").orElse(null);

        // Rajesh: completed PM-KISAN application
        if (rajesh != null && kisan != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-KISAN-0001")
                    .beneficiary(rajesh)
                    .scheme(kisan)
                    .appliedGrantAmount(6000.0)
                    .eligibilityScore(94)
                    .scoreBreakdownJson("{\"incomeScore\":34,\"categoryScore\":25,\"regionScore\":20,\"docVerificationScore\":15,\"total\":94}")
                    .dynamicFieldAnswersJson("{\"cropType\":\"Wheat\",\"landRecordNo\":\"Khasra-382-14B\",\"bankAccountSeeded\":\"Yes\"}")
                    .currentStage(GrantApplication.ApplicationStage.APPROVED)
                    .status("APPROVED")
                    .reapplyCount(0)
                    .maxReapplyAllowed(2)
                    .fastTracked(true)
                    .escalated(false)
                    .remarks("Application verified and approved for DBT release.")
                    .createdAt(LocalDateTime.now().minusMonths(2))
                    .updatedAt(LocalDateTime.now().minusDays(10))
                    .build());
        }

        // Rajesh: PMAY-G currently at district review
        if (rajesh != null && pmay != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-PMAY-0002")
                    .beneficiary(rajesh)
                    .scheme(pmay)
                    .appliedGrantAmount(120000.0)
                    .eligibilityScore(86)
                    .scoreBreakdownJson("{\"incomeScore\":31,\"categoryScore\":20,\"regionScore\":20,\"docVerificationScore\":15,\"total\":86}")
                    .dynamicFieldAnswersJson("{\"ruralResidence\":\"Yes\",\"currentHouseType\":\"Kutcha\",\"landAvailable\":\"Yes\",\"bankAccountSeeded\":\"Yes\"}")
                    .currentStage(GrantApplication.ApplicationStage.DISTRICT_REVIEW)
                    .status("UNDER_REVIEW")
                    .reapplyCount(0)
                    .maxReapplyAllowed(2)
                    .fastTracked(false)
                    .escalated(false)
                    .remarks("Field verification completed. Awaiting District Officer decision.")
                    .createdAt(LocalDateTime.now().minusDays(18))
                    .updatedAt(LocalDateTime.now().minusDays(3))
                    .build());
        }

        // Ananya: education scholarship at field/document verification
        if (ananya != null && scholarship != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-EDU-0003")
                    .beneficiary(ananya)
                    .scheme(scholarship)
                    .appliedGrantAmount(20000.0)
                    .eligibilityScore(91)
                    .scoreBreakdownJson("{\"incomeScore\":32,\"categoryScore\":20,\"regionScore\":20,\"docVerificationScore\":19,\"total\":91}")
                    .dynamicFieldAnswersJson("{\"courseLevel\":\"UG\",\"percentage\":88,\"institutionName\":\"Government College Dehradun\",\"familyIncome\":240000}")
                    .currentStage(GrantApplication.ApplicationStage.FIELD_VERIFICATION)
                    .status("UNDER_REVIEW")
                    .reapplyCount(0)
                    .maxReapplyAllowed(2)
                    .fastTracked(true)
                    .escalated(false)
                    .remarks("Academic and income documents submitted. Field Officer verification pending.")
                    .createdAt(LocalDateTime.now().minusDays(8))
                    .updatedAt(LocalDateTime.now().minusDays(1))
                    .build());
        }
    }

    // ============================================================
    // DISBURSEMENT
    // ============================================================
    private void initDisbursements() {
        if (stagedDisbursementRepository.count() > 0) {
            return;
        }

        GrantApplication kisan = grantApplicationRepository
                .findByApplicationNo("APP-2026-KISAN-0001").orElse(null);

        if (kisan != null) {
            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(kisan)
                    .stageNumber(1)
                    .milestoneName("Application Verification")
                    .grantPercentage(40.0)
                    .scheduledAmount(2400.0)
                    .disbursedAmount(2400.0)
                    .dueDate(LocalDate.now().minusDays(30))
                    .complianceProofUrl("https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400")
                    .proofRemarks("Beneficiary documents verified.")
                    .status(StagedDisbursement.MilestoneStatus.FUND_RELEASED)
                    .disbursedAt(LocalDateTime.now().minusDays(25))
                    .transactionRef("PFMS-DEMO-2026-0001")
                    .build());

            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(kisan)
                    .stageNumber(2)
                    .milestoneName("Beneficiary Approval")
                    .grantPercentage(30.0)
                    .scheduledAmount(1800.0)
                    .disbursedAmount(1800.0)
                    .dueDate(LocalDate.now().minusDays(10))
                    .status(StagedDisbursement.MilestoneStatus.FUND_RELEASED)
                    .disbursedAt(LocalDateTime.now().minusDays(8))
                    .transactionRef("PFMS-DEMO-2026-0002")
                    .build());

            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(kisan)
                    .stageNumber(3)
                    .milestoneName("DBT Release")
                    .grantPercentage(30.0)
                    .scheduledAmount(1800.0)
                    .disbursedAmount(0.0)
                    .dueDate(LocalDate.now().plusDays(20))
                    .status(StagedDisbursement.MilestoneStatus.PENDING_COMPLIANCE)
                    .transactionRef("PFMS-DEMO-PENDING")
                    .build());
        }
    }

    // ============================================================
    // VERIFICATION WORKFLOW
    // ============================================================
    private void initWorkflows() {
        if (verificationWorkflowRepository.count() > 0) {
            return;
        }

        User fieldOfficer = userRepository.findByUsername("officer_field").orElse(null);
        User districtOfficer = userRepository.findByUsername("officer_district").orElse(null);

        GrantApplication pmay = grantApplicationRepository
                .findByApplicationNo("APP-2026-PMAY-0002").orElse(null);
        GrantApplication scholarship = grantApplicationRepository
                .findByApplicationNo("APP-2026-EDU-0003").orElse(null);

        if (pmay != null && fieldOfficer != null) {
            verificationWorkflowRepository.save(VerificationWorkflow.builder()
                    .application(pmay)
                    .stage(VerificationWorkflow.WorkflowStage.FIELD_VERIFICATION)
                    .action("FIELD_OFFICER_APPROVED")
                    .fromStage("FIELD_VERIFICATION")
                    .toStage("DISTRICT_REVIEW")
                    .performedBy(fieldOfficer)
                    .performedByUsername(fieldOfficer.getUsername())
                    .performedByRole("FIELD_OFFICER")
                    .decision(VerificationWorkflow.ActionDecision.APPROVED)
                    .reason("Rural residence and household documents verified.")
                    .groundNotes("Physical verification completed successfully.")
                    .actionTimestamp(LocalDateTime.now().minusDays(3))
                    .build());
        }

        // Keep the district officer available in the seed data. The PMAY
        // application is intentionally left at DISTRICT_REVIEW so the UI
        // can demonstrate the next approval step.
        if (pmay != null && districtOfficer != null) {
            log.info("PMAY-G application {} is ready for District Officer {}",
                    pmay.getApplicationNo(), districtOfficer.getUsername());
        }
    }

    // ============================================================
    // AUDIT LOGS
    // ============================================================
    private void initAuditLogs() {
        if (auditLogRepository.count() > 0) {
            return;
        }

        auditLogRepository.save(AuditLog.builder()
                .action("SYSTEM_INITIALIZED")
                .performedByUsername("SYSTEM")
                .userRole("SYSTEM")
                .entityType("Platform")
                .entityId("0")
                .details("GrantSetu Digital Subsidy & Grant Platform demo database initialized.")
                .timestamp(LocalDateTime.now())
                .build());

        auditLogRepository.save(AuditLog.builder()
                .action("SCHEMES_CONFIGURED")
                .performedByUsername("admin")
                .userRole("ADMIN")
                .entityType("SchemeMaster")
                .entityId("MASTER")
                .details("Configured five real government schemes: PM-KISAN, PM-USP CSSS, PMAY-G, PMMVY and PM SVANidhi.")
                .timestamp(LocalDateTime.now())
                .build());
    }

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    private void initNotifications() {
        if (notificationRepository.count() > 0) {
            return;
        }

        User rajesh = userRepository.findByUsername("rajesh_farmer").orElse(null);
        User ananya = userRepository.findByUsername("ananya_student").orElse(null);
        User fieldOfficer = userRepository.findByUsername("officer_field").orElse(null);
        User districtOfficer = userRepository.findByUsername("officer_district").orElse(null);
        User financeOfficer = userRepository.findByUsername("officer_finance").orElse(null);

        if (rajesh != null) {
            notificationRepository.save(Notification.builder()
                    .user(rajesh)
                    .recipientRole("BENEFICIARY")
                    .applicationNo("APP-2026-KISAN-0001")
                    .title("PM-KISAN application approved")
                    .message("Your PM-KISAN application has been approved and is ready for DBT processing.")
                    .type("SUCCESS")
                    .channel("IN_APP")
                    .isRead(false)
                    .actionUrl("/beneficiary/applications")
                    .createdAt(LocalDateTime.now().minusDays(2))
                    .build());
        }

        if (ananya != null) {
            notificationRepository.save(Notification.builder()
                    .user(ananya)
                    .recipientRole("BENEFICIARY")
                    .applicationNo("APP-2026-EDU-0003")
                    .title("Scholarship verification pending")
                    .message("Your PM-USP Central Sector Scholarship application is awaiting Field Officer document verification.")
                    .type("ACTION_REQUIRED")
                    .channel("IN_APP")
                    .isRead(false)
                    .actionUrl("/beneficiary/applications")
                    .createdAt(LocalDateTime.now().minusHours(5))
                    .build());
        }

        if (fieldOfficer != null) {
            notificationRepository.save(Notification.builder()
                    .user(fieldOfficer)
                    .recipientRole("FIELD_OFFICER")
                    .applicationNo("APP-2026-EDU-0003")
                    .title("New education scholarship verification")
                    .message("Verify Ananya Sharma's academic and income documents for the PM-USP scholarship application.")
                    .type("ACTION_REQUIRED")
                    .channel("IN_APP")
                    .isRead(false)
                    .actionUrl("/field/verification-queue")
                    .createdAt(LocalDateTime.now().minusHours(4))
                    .build());
        }

        if (districtOfficer != null) {
            notificationRepository.save(Notification.builder()
                    .user(districtOfficer)
                    .recipientRole("DISTRICT_OFFICER")
                    .applicationNo("APP-2026-PMAY-0002")
                    .title("PMAY-G application awaiting review")
                    .message("Rajesh Kumar Patel's PMAY-G application has completed Field Officer verification and is ready for District review.")
                    .type("ACTION_REQUIRED")
                    .channel("IN_APP")
                    .isRead(false)
                    .actionUrl("/district/sanction-queue")
                    .createdAt(LocalDateTime.now().minusDays(2))
                    .build());
        }

        if (financeOfficer != null) {
            notificationRepository.save(Notification.builder()
                    .user(financeOfficer)
                    .recipientRole("FINANCE_APPROVER")
                    .applicationNo("APP-2026-KISAN-0001")
                    .title("PM-KISAN DBT release ready")
                    .message("The approved PM-KISAN application has reached the finance stage for DBT processing.")
                    .type("INFO")
                    .channel("IN_APP")
                    .isRead(false)
                    .actionUrl("/finance/approval-queue")
                    .createdAt(LocalDateTime.now().minusHours(1))
                    .build());
        }
    }
}
