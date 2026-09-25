package com.infosys.subsidy.config;

import com.infosys.subsidy.entity.*;
import com.infosys.subsidy.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.core.annotation.Order;

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
    public void run(String... args) throws Exception {
        log.info("Starting safe sovereign DBT database initialization...");

        // 1. Initialize Users for all 5 Sovereign Roles
        initUsers();

        // 2. Initialize Beneficiary KYC Profiles
        initBeneficiaryProfiles();

        // 3. Initialize Master Schemes with Policy, Slabs, Regional Budgets & Dynamic Attributes
        initSchemes();

        // 4. Initialize Grant Applications with Scoring & Dynamic Field Answers
        initApplications();

        // 5. Initialize Staged Milestone Disbursements
        initDisbursements();

        // 6. Initialize Verification Workflows
        initWorkflows();

        // 7. Initialize Audit Logs
        initAuditLogs();

        // 8. Initialize System Notifications
        initNotifications();

        log.info("Sovereign DBT database initialization completed successfully.");
    }

    private void initUsers() {
        // Admin
        if (userRepository.findByUsername("admin").isEmpty()) {
            userRepository.save(User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Shri Vikramaditya Saxena (IAS)")
                    .email("admin@subsidy.gov.in")
                    .role(User.Role.ADMIN)
                    .region("National HQ")
                    .build());
        }

        // Beneficiary 1: Rajesh
        if (userRepository.findByUsername("rajesh_farmer").isEmpty()) {
            userRepository.save(User.builder()
                    .username("rajesh_farmer")
                    .password(passwordEncoder.encode("rajesh123"))
                    .fullName("Rajesh Kumar Patel")
                    .email("rajesh.patel@gmail.com")
                    .role(User.Role.BENEFICIARY)
                    .region("North Region")
                    .build());
        }

        // Beneficiary 2: Sunita
        if (userRepository.findByUsername("sunita_women").isEmpty()) {
            userRepository.save(User.builder()
                    .username("sunita_women")
                    .password(passwordEncoder.encode("sunita123"))
                    .fullName("Sunita Devi Sharma")
                    .email("sunita.sharma@outlook.com")
                    .role(User.Role.BENEFICIARY)
                    .region("North Region")
                    .build());
        }

        // Beneficiary 3: Rafiq
        if (userRepository.findByUsername("rafiq_artisan").isEmpty()) {
            userRepository.save(User.builder()
                    .username("rafiq_artisan")
                    .password(passwordEncoder.encode("rafiq123"))
                    .fullName("Mohammad Rafiq Ansari")
                    .email("rafiq.handloom@gmail.com")
                    .role(User.Role.BENEFICIARY)
                    .region("North Region")
                    .build());
        }

        // Beneficiary 4: Lakshmi
        if (userRepository.findByUsername("lakshmi_sc").isEmpty()) {
            userRepository.save(User.builder()
                    .username("lakshmi_sc")
                    .password(passwordEncoder.encode("lakshmi123"))
                    .fullName("Lakshmi Bai Rathore")
                    .email("lakshmi.rathore@gmail.com")
                    .role(User.Role.BENEFICIARY)
                    .region("West Region")
                    .build());
        }

        // Beneficiary 5: Gurpreet
        if (userRepository.findByUsername("gurpreet_farmer").isEmpty()) {
            userRepository.save(User.builder()
                    .username("gurpreet_farmer")
                    .password(passwordEncoder.encode("gurpreet123"))
                    .fullName("Gurpreet Singh Gill")
                    .email("gurpreet.farm@yahoo.com")
                    .role(User.Role.BENEFICIARY)
                    .region("North Region")
                    .build());
        }

        // Field Officer
        if (userRepository.findByUsername("officer_field").isEmpty()) {
            userRepository.save(User.builder()
                    .username("officer_field")
                    .password(passwordEncoder.encode("field123"))
                    .fullName("Shri Manoj Kumar Yadav")
                    .email("manoj.field@subsidy.gov.in")
                    .role(User.Role.FIELD_OFFICER)
                    .region("North Region")
                    .build());
        }

        // District Officer
        if (userRepository.findByUsername("officer_district").isEmpty()) {
            userRepository.save(User.builder()
                    .username("officer_district")
                    .password(passwordEncoder.encode("district123"))
                    .fullName("Dr. Anita Roy (IAS)")
                    .email("anita.district@subsidy.gov.in")
                    .role(User.Role.DISTRICT_OFFICER)
                    .region("North Region")
                    .build());
        }

        // Finance Approver
        if (userRepository.findByUsername("officer_finance").isEmpty()) {
            userRepository.save(User.builder()
                    .username("officer_finance")
                    .password(passwordEncoder.encode("finance123"))
                    .fullName("Shri Suresh Narayanan (ICAS)")
                    .email("suresh.finance@subsidy.gov.in")
                    .role(User.Role.FINANCE_APPROVER)
                    .region("National HQ")
                    .build());
        }
    }

    private void initBeneficiaryProfiles() {
        // Rajesh
        userRepository.findByUsername("rajesh_farmer").ifPresent(user -> {
            if (beneficiaryProfileRepository.findByUser(user).isEmpty()) {
                beneficiaryProfileRepository.save(BeneficiaryProfile.builder()
                        .user(user)
                        .aadhaarNumber("XXXX-XXXX-4821")
                        .panNumber("ABCDE1234F")
                        .fullName("Rajesh Kumar Patel")
                        .category("Farmer")
                        .annualIncome(180000.0)
                        .landSizeAcres(2.8)
                        .region("North Region")
                        .address("House No. 42, Village Rampur, Near Canal Bridge, Varanasi, UP")
                        .documentType("Aadhaar Card & Land RoR")
                        .identityDocumentUrl("https://images.unsplash.com/photo-1544717305-2782549b5136?w=400")
                        .verificationStatus(BeneficiaryProfile.Status.VERIFIED)
                        .registeredAt(LocalDateTime.now().minusMonths(4))
                        .build());
            }
        });

        // Sunita
        userRepository.findByUsername("sunita_women").ifPresent(user -> {
            if (beneficiaryProfileRepository.findByUser(user).isEmpty()) {
                beneficiaryProfileRepository.save(BeneficiaryProfile.builder()
                        .user(user)
                        .aadhaarNumber("XXXX-XXXX-8912")
                        .panNumber("BKDPS9876Q")
                        .fullName("Sunita Devi Sharma")
                        .category("Women")
                        .annualIncome(120000.0)
                        .landSizeAcres(0.8)
                        .region("North Region")
                        .address("Ward 5, Shanti Nagar, Post Bilaspur, Lucknow, UP")
                        .documentType("Aadhaar Card & MCP Card")
                        .identityDocumentUrl("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400")
                        .verificationStatus(BeneficiaryProfile.Status.VERIFIED)
                        .registeredAt(LocalDateTime.now().minusMonths(3))
                        .build());
            }
        });

        // Rafiq
        userRepository.findByUsername("rafiq_artisan").ifPresent(user -> {
            if (beneficiaryProfileRepository.findByUser(user).isEmpty()) {
                beneficiaryProfileRepository.save(BeneficiaryProfile.builder()
                        .user(user)
                        .aadhaarNumber("XXXX-XXXX-3341")
                        .panNumber("CYZPA5432K")
                        .fullName("Mohammad Rafiq Ansari")
                        .category("Artisan")
                        .annualIncome(210000.0)
                        .landSizeAcres(0.0)
                        .region("North Region")
                        .address("Bunkar Colony, Mohalla Madanpura, Varanasi, UP")
                        .documentType("Udyam Registration & Aadhaar")
                        .identityDocumentUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400")
                        .verificationStatus(BeneficiaryProfile.Status.PENDING)
                        .registeredAt(LocalDateTime.now().minusMonths(2))
                        .build());
            }
        });

        // Lakshmi
        userRepository.findByUsername("lakshmi_sc").ifPresent(user -> {
            if (beneficiaryProfileRepository.findByUser(user).isEmpty()) {
                beneficiaryProfileRepository.save(BeneficiaryProfile.builder()
                        .user(user)
                        .aadhaarNumber("XXXX-XXXX-6719")
                        .panNumber("DFRPL8765M")
                        .fullName("Lakshmi Bai Rathore")
                        .category("SC")
                        .annualIncome(140000.0)
                        .landSizeAcres(1.5)
                        .region("West Region")
                        .address("Gram Panchayat Khajuria, Tehsil Malwa, Indore, MP")
                        .documentType("Caste Certificate & Aadhaar")
                        .identityDocumentUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400")
                        .verificationStatus(BeneficiaryProfile.Status.VERIFIED)
                        .registeredAt(LocalDateTime.now().minusMonths(5))
                        .build());
            }
        });

        // Gurpreet
        userRepository.findByUsername("gurpreet_farmer").ifPresent(user -> {
            if (beneficiaryProfileRepository.findByUser(user).isEmpty()) {
                beneficiaryProfileRepository.save(BeneficiaryProfile.builder()
                        .user(user)
                        .aadhaarNumber("XXXX-XXXX-9023")
                        .panNumber("EQWPG4321R")
                        .fullName("Gurpreet Singh Gill")
                        .category("Farmer")
                        .annualIncome(290000.0)
                        .landSizeAcres(4.2)
                        .region("North Region")
                        .address("VPO Gill Kalan, Barnala Road, Ludhiana, Punjab")
                        .documentType("Land Revenue Jamabandi & Aadhaar")
                        .identityDocumentUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400")
                        .verificationStatus(BeneficiaryProfile.Status.VERIFIED)
                        .registeredAt(LocalDateTime.now().minusMonths(6))
                        .build());
            }
        });
    }

    private void initSchemes() {
        // 1. PM-KISAN-2026
        if (schemeMasterRepository.findBySchemeCode("PM-KISAN-2026").isEmpty()) {
            schemeMasterRepository.save(SchemeMaster.builder()
                    .schemeCode("PM-KISAN-2026")
                    .name("PM Kisan Samman Nidhi - Direct Farmer Income Support")
                    .description("Direct cash transfer scheme for landholding farmer families across India to supplement financial needs for agricultural inputs and domestic requirements.")
                    .category("Agriculture")
                    .totalBudget(60000000.0)
                    .allocatedBudget(42000000.0)
                    .disbursedBudget(34500000.0)
                    .maxGrantAmount(60000.0)
                    .maxIncomeCriteria(300000.0)
                    .targetCategories("Farmer,Smallholder,Marginal,SC,ST")
                    .targetRegion("ALL")
                    .requiredDocuments("Aadhaar Card, Land Record / RoR, Bank Passbook")
                    .dynamicFieldsJson("[{\"key\":\"cropType\",\"label\":\"Primary Agricultural Crop\",\"type\":\"select\",\"options\":[\"Paddy (Rice)\",\"Wheat\",\"Cotton\",\"Mustard\",\"Sugarcane\",\"Pulses / Millets\"],\"required\":true},{\"key\":\"irrigationSource\",\"label\":\"Primary Irrigation Source\",\"type\":\"select\",\"options\":[\"Canal / River Water\",\"Tube-well / Deep Borewell\",\"Rainfed / Natural Drainage\",\"Drip & Sprinkler Network\"],\"required\":true},{\"key\":\"khasraKhatoniNo\",\"label\":\"Land Survey / Khasra-Khatoni Number\",\"type\":\"text\",\"placeholder\":\"e.g. Khasra 412/18-A\",\"required\":true},{\"key\":\"soilHealthCard\",\"label\":\"Soil Health Card Registered\",\"type\":\"select\",\"options\":[\"Yes - Active Soil Card\",\"No - Soil Testing Pending\"],\"required\":false}]")
                    .stagedMilestonesJson("[{\"stageNumber\":1,\"milestoneName\":\"Initial Seed & Fertilizer Subsidy\",\"percent\":40},{\"stageNumber\":2,\"milestoneName\":\"Mid-Season Crop Health Inspection\",\"percent\":30},{\"stageNumber\":3,\"milestoneName\":\"Harvest & Soil Testing Utilization Proof\",\"percent\":30}]")
                    .active(true)
                    .build());
        }

        // 2. PM-KUSUM-SOLAR
        if (schemeMasterRepository.findBySchemeCode("PM-KUSUM-SOLAR").isEmpty()) {
            schemeMasterRepository.save(SchemeMaster.builder()
                    .schemeCode("PM-KUSUM-SOLAR")
                    .name("PM-KUSUM Solar Agri Pump Installation Grant")
                    .description("Subsidized decentralized solar pump installation and solarization of grid-connected agricultural pumps for farmers and cooperatives.")
                    .category("Renewable Energy")
                    .totalBudget(45000000.0)
                    .allocatedBudget(31000000.0)
                    .disbursedBudget(24800000.0)
                    .maxGrantAmount(120000.0)
                    .maxIncomeCriteria(500000.0)
                    .targetCategories("Farmer,OBC,General,SC,ST")
                    .targetRegion("North Region,West Region")
                    .requiredDocuments("Aadhaar Card, Land Revenue Receipt, DISCOM Electricity Bill")
                    .dynamicFieldsJson("[{\"key\":\"pumpCapacityHp\",\"label\":\"Required Solar Pump Capacity (HP)\",\"type\":\"select\",\"options\":[\"3 HP Submersible Pump\",\"5 HP Submersible Pump\",\"7.5 HP High-Capacity Pump\",\"10 HP Heavy Commercial Pump\"],\"required\":true},{\"key\":\"waterTableDepthFt\",\"label\":\"Average Ground Water Depth (Feet)\",\"type\":\"number\",\"placeholder\":\"e.g. 120\",\"required\":true},{\"key\":\"discomConsumerNo\",\"label\":\"DISCOM Power Connection / Consumer ID\",\"type\":\"text\",\"placeholder\":\"e.g. UP-DISCOM-948102\",\"required\":true},{\"key\":\"solarArrayLandType\",\"label\":\"Solar Array Installation Land Ownership\",\"type\":\"select\",\"options\":[\"Self-Owned Unshaded Farm Land\",\"Family Co-Owned Farm Plot\",\"Panchayat Approved Land Area\"],\"required\":true}]")
                    .stagedMilestonesJson("[{\"stageNumber\":1,\"milestoneName\":\"Civil Works & Foundation Clearance\",\"percent\":30},{\"stageNumber\":2,\"milestoneName\":\"Solar Array & Pump Delivery Verification\",\"percent\":40},{\"stageNumber\":3,\"milestoneName\":\"Grid Synchronization & Commissioning Certificate\",\"percent\":30}]")
                    .active(true)
                    .build());
        }

        // 3. PM-MATRU-VANDANA
        if (schemeMasterRepository.findBySchemeCode("PM-MATRU-VANDANA").isEmpty()) {
            schemeMasterRepository.save(SchemeMaster.builder()
                    .schemeCode("PM-MATRU-VANDANA")
                    .name("Pradhan Mantri Matru Vandana Yojana (PMMVY)")
                    .description("Maternity benefit cash incentive program provided directly to pregnant and lactating mothers for health seeking behavior and nutritional compensation.")
                    .category("Women Empowerment")
                    .totalBudget(25000000.0)
                    .allocatedBudget(19500000.0)
                    .disbursedBudget(17200000.0)
                    .maxGrantAmount(15000.0)
                    .maxIncomeCriteria(250000.0)
                    .targetCategories("Women,BPL,SC,ST,General")
                    .targetRegion("ALL")
                    .requiredDocuments("Aadhaar Card, Mother-Child Protection (MCP) Card, Bank Passbook")
                    .dynamicFieldsJson("[{\"key\":\"pregnancyTrimester\",\"label\":\"Current Pregnancy Trimester / Status\",\"type\":\"select\",\"options\":[\"1st Trimester (0-12 Weeks)\",\"2nd Trimester (13-27 Weeks)\",\"3rd Trimester (28-40 Weeks)\",\"Post-Natal (Lactating Mother)\"],\"required\":true},{\"key\":\"mcpCardNumber\",\"label\":\"Mother-Child Protection (MCP) Card Number\",\"type\":\"text\",\"placeholder\":\"e.g. MCP-UP-2026-88192\",\"required\":true},{\"key\":\"anganwadiCenterCode\",\"label\":\"Nearest Anganwadi Center Code\",\"type\":\"text\",\"placeholder\":\"e.g. AW-VARANASI-821\",\"required\":true},{\"key\":\"antenatalCheckupDone\",\"label\":\"At least 1 Antenatal Check-up (ANC) Done\",\"type\":\"select\",\"options\":[\"Yes - Government PHC / CHC Certified\",\"Yes - Private Registered Clinic\",\"Pending Next Schedule\"],\"required\":true}]")
                    .stagedMilestonesJson("[{\"stageNumber\":1,\"milestoneName\":\"Early ANC Registration & Screening\",\"percent\":30},{\"stageNumber\":2,\"milestoneName\":\"Trimester Ultrasound & Iron-Folic Intake\",\"percent\":30},{\"stageNumber\":3,\"milestoneName\":\"Institutional Delivery & First Vaccine Cycle\",\"percent\":40}]")
                    .active(true)
                    .build());
        }

        // 4. NAT-LIVESTOCK-MIS
        if (schemeMasterRepository.findBySchemeCode("NAT-LIVESTOCK-MIS").isEmpty()) {
            schemeMasterRepository.save(SchemeMaster.builder()
                    .schemeCode("NAT-LIVESTOCK-MIS")
                    .name("National Livestock Mission - Dairy Entrepreneurship")
                    .description("Financial assistance to smallholder rural farmers and youth for establishing mini-dairy units, indigenous breed conservation, and fodder nurseries.")
                    .category("Agriculture")
                    .totalBudget(35000000.0)
                    .allocatedBudget(21000000.0)
                    .disbursedBudget(16000000.0)
                    .maxGrantAmount(85000.0)
                    .maxIncomeCriteria(400000.0)
                    .targetCategories("Farmer,OBC,SC,ST,BPL")
                    .targetRegion("ALL")
                    .requiredDocuments("Aadhaar Card, Veterinary Health Certificate, Land / Shed Deed")
                    .dynamicFieldsJson("[{\"key\":\"cattleBreedType\",\"label\":\"Livestock Breed Variety\",\"type\":\"select\",\"options\":[\"Indigenous Desi Cow (Gir / Sahiwal / Rathi)\",\"Murrah / Mehsana Buffalo\",\"Crossbreed Holstein / Jersey\",\"Goat / Sheep Commercial Unit (20+1)\"],\"required\":true},{\"key\":\"shedAreaSqFt\",\"label\":\"Available Cattle Shed Built-up Area (Sq Ft)\",\"type\":\"number\",\"placeholder\":\"e.g. 450\",\"required\":true},{\"key\":\"fodderLandAcres\",\"label\":\"Dedicated Green Fodder Land (Acres)\",\"type\":\"number\",\"placeholder\":\"e.g. 1.2\",\"required\":true},{\"key\":\"veterinaryOfficerCertNo\",\"label\":\"Veterinary Doctor Health Certification No.\",\"type\":\"text\",\"placeholder\":\"e.g. VET-MED-2026-781\",\"required\":true}]")
                    .stagedMilestonesJson("[{\"stageNumber\":1,\"milestoneName\":\"Cattle Shed Construction & Geotagging\",\"percent\":35},{\"stageNumber\":2,\"milestoneName\":\"Animal Purchase & Veterinary Tagging\",\"percent\":35},{\"stageNumber\":3,\"milestoneName\":\"Milk Yield Audit & Feed Stock Compliance\",\"percent\":30}]")
                    .active(true)
                    .build());
        }

        // 5. STANDUP-MSME-GRANT
        if (schemeMasterRepository.findBySchemeCode("STANDUP-MSME-GRANT").isEmpty()) {
            schemeMasterRepository.save(SchemeMaster.builder()
                    .schemeCode("STANDUP-MSME-GRANT")
                    .name("Stand-Up Rural Artisan & Micro Enterprise Grant")
                    .description("Seed capital and machinery grants for SC, ST, and Women entrepreneurs in rural and semi-urban clusters for agro-processing and traditional handicrafts.")
                    .category("Micro Enterprise")
                    .totalBudget(40000000.0)
                    .allocatedBudget(28000000.0)
                    .disbursedBudget(21500000.0)
                    .maxGrantAmount(100000.0)
                    .maxIncomeCriteria(450000.0)
                    .targetCategories("SC,ST,Women,Artisan")
                    .targetRegion("ALL")
                    .requiredDocuments("Aadhaar Card, Udyam Registration, Quotation for Machinery")
                    .dynamicFieldsJson("[{\"key\":\"udyamRegistrationNo\",\"label\":\"Udyam / MSME Registration Number\",\"type\":\"text\",\"placeholder\":\"e.g. UDYAM-UP-00-1234567\",\"required\":true},{\"key\":\"machineryDescription\",\"label\":\"Proposed Machinery / Equipment Quotation Details\",\"type\":\"text\",\"placeholder\":\"e.g. Semi-Automated Jacquard Handloom Unit with Motor\",\"required\":true},{\"key\":\"employedWorkersCount\",\"label\":\"Direct Workers / Artisans Employed\",\"type\":\"number\",\"placeholder\":\"e.g. 4\",\"required\":true},{\"key\":\"tradeLicenseNo\",\"label\":\"Panchayat / Municipal Trade License Number\",\"type\":\"text\",\"placeholder\":\"e.g. TL-VAR-2025-9182\",\"required\":false}]")
                    .stagedMilestonesJson("[{\"stageNumber\":1,\"milestoneName\":\"Premises Lease & Trade License\",\"percent\":30},{\"stageNumber\":2,\"milestoneName\":\"Machinery Procurement & Installation Bill\",\"percent\":40},{\"stageNumber\":3,\"milestoneName\":\"First Batch Production & GST/Udyam Filing\",\"percent\":30}]")
                    .active(true)
                    .build());
        }
    }

    private void initApplications() {
        if (grantApplicationRepository.count() > 0) {
            // Ensure top applications have score 100 for P1 priority demonstration across stages
            grantApplicationRepository.findAll().stream()
                    .filter(a -> "APP-2026-MATRU-0941".equals(a.getApplicationNo()) || "APP-2026-LIVESTOCK-0312".equals(a.getApplicationNo()))
                    .forEach(topApp -> {
                        if (topApp.getEligibilityScore() == null || topApp.getEligibilityScore() < 100) {
                            topApp.setEligibilityScore(100);
                            topApp.setFastTracked(true);
                            topApp.setScoreBreakdownJson("{\"incomeScore\":35,\"categoryScore\":25,\"regionScore\":20,\"docVerificationScore\":20,\"total\":100}");
                            grantApplicationRepository.save(topApp);
                        }
                    });

            // Ensure sample rejected application exists
            if (grantApplicationRepository.findByApplicationNo("APP-2026-REJECT-0518").isEmpty()) {
                BeneficiaryProfile gurpreet = beneficiaryProfileRepository.findByAadhaarNumber("XXXX-XXXX-9023").orElse(null);
                SchemeMaster msmeScheme = schemeMasterRepository.findBySchemeCode("STANDUP-MSME-GRANT").orElse(null);
                if (gurpreet != null && msmeScheme != null) {
                    grantApplicationRepository.save(GrantApplication.builder()
                            .applicationNo("APP-2026-REJECT-0518")
                            .beneficiary(gurpreet)
                            .scheme(msmeScheme)
                            .appliedGrantAmount(150000.0)
                            .eligibilityScore(55)
                            .scoreBreakdownJson("{\"incomeScore\":10,\"categoryScore\":20,\"regionScore\":15,\"docVerificationScore\":10,\"total\":55}")
                            .dynamicFieldAnswersJson("{\"udyamRegistrationNo\":\"UDYAM-PB-12-008219\",\"machineryDescription\":\"Automated Precision CNC Milling Unit\",\"employedWorkersCount\":12,\"tradeLicenseNo\":\"TL-AMR-2025-4491\"}")
                            .currentStage(GrantApplication.ApplicationStage.REJECTED)
                            .status("REJECTED")
                            .reapplyCount(1)
                            .maxReapplyAllowed(2)
                            .rejectionCategory("INELIGIBLE_INCOME")
                            .rejectionReason("Applicant business turnover and gross family income (₹5,20,000) exceeds maximum permissible ceiling of ₹3,00,000 under Stand-Up MSME guidelines.")
                            .rejectedBy("Smt. Priya Sharma")
                            .rejectedByRole("DISTRICT_OFFICER")
                            .rejectedAt(LocalDateTime.now().minusDays(8))
                            .appealDeadline(LocalDateTime.now().plusDays(22))
                            .remarks("Application formally rejected by District Officer: Annual income criteria exceeded statutory ceiling.")
                            .createdAt(LocalDateTime.now().minusDays(25))
                            .updatedAt(LocalDateTime.now().minusDays(8))
                            .build());
                }
            }

            // Ensure sample appeal application exists
            if (grantApplicationRepository.findByApplicationNo("APP-2026-APPEAL-0391").isEmpty()) {
                BeneficiaryProfile rafiq = beneficiaryProfileRepository.findByAadhaarNumber("XXXX-XXXX-3341").orElse(null);
                SchemeMaster msmeScheme = schemeMasterRepository.findBySchemeCode("STANDUP-MSME-GRANT").orElse(null);
                if (rafiq != null && msmeScheme != null) {
                    grantApplicationRepository.save(GrantApplication.builder()
                            .applicationNo("APP-2026-APPEAL-0391")
                            .beneficiary(rafiq)
                            .scheme(msmeScheme)
                            .appliedGrantAmount(75000.0)
                            .eligibilityScore(72)
                            .scoreBreakdownJson("{\"incomeScore\":25,\"categoryScore\":20,\"regionScore\":15,\"docVerificationScore\":12,\"total\":72}")
                            .dynamicFieldAnswersJson("{\"udyamRegistrationNo\":\"UDYAM-UP-67-0091823\",\"machineryDescription\":\"Semi-Automated Jacquard Handloom Unit\",\"employedWorkersCount\":4,\"tradeLicenseNo\":\"TL-VAR-2025-9182\"}")
                            .currentStage(GrantApplication.ApplicationStage.DISTRICT_REVIEW)
                            .status("RE_VERIFICATION_REQUESTED")
                            .reapplyCount(2)
                            .maxReapplyAllowed(2)
                            .rejectionCategory("LAND_RECORD_MISMATCH")
                            .rejectionReason("Workshop tenancy lease agreement had missing notary certification seal.")
                            .rejectedBy("Shri Manoj Kumar Yadav")
                            .rejectedByRole("FIELD_OFFICER")
                            .rejectedAt(LocalDateTime.now().minusDays(10))
                            .appealDeadline(LocalDateTime.now().plusDays(20))
                            .reVerificationAppealGrounds("Certified 10-year registered commercial lease deed with Sub-Registrar stamp duty receipt has been obtained and uploaded. Requesting fresh ground inspection.")
                            .reVerificationDocumentUrl("https://images.unsplash.com/photo-1568667256549-094345857637?w=600")
                            .reVerificationRequestedAt(LocalDateTime.now().minusDays(2))
                            .remarks("Citizen filed statutory appeal with registered commercial lease deed. Pending District Officer re-assessment.")
                            .createdAt(LocalDateTime.now().minusDays(30))
                            .updatedAt(LocalDateTime.now().minusDays(2))
                            .build());
                }
            }

            return;
        }

        SchemeMaster kisanScheme = schemeMasterRepository.findBySchemeCode("PM-KISAN-2026").orElse(null);
        SchemeMaster kusumScheme = schemeMasterRepository.findBySchemeCode("PM-KUSUM-SOLAR").orElse(null);
        SchemeMaster matruScheme = schemeMasterRepository.findBySchemeCode("PM-MATRU-VANDANA").orElse(null);
        SchemeMaster livestockScheme = schemeMasterRepository.findBySchemeCode("NAT-LIVESTOCK-MIS").orElse(null);
        SchemeMaster msmeScheme = schemeMasterRepository.findBySchemeCode("STANDUP-MSME-GRANT").orElse(null);

        BeneficiaryProfile rajesh = beneficiaryProfileRepository.findByAadhaarNumber("XXXX-XXXX-4821").orElse(null);
        BeneficiaryProfile sunita = beneficiaryProfileRepository.findByAadhaarNumber("XXXX-XXXX-8912").orElse(null);
        BeneficiaryProfile rafiq = beneficiaryProfileRepository.findByAadhaarNumber("XXXX-XXXX-3341").orElse(null);
        BeneficiaryProfile lakshmi = beneficiaryProfileRepository.findByAadhaarNumber("XXXX-XXXX-6719").orElse(null);
        BeneficiaryProfile gurpreet = beneficiaryProfileRepository.findByAadhaarNumber("XXXX-XXXX-9023").orElse(null);

        // App 1: Rajesh - Solar Pump (Finance Approval)
        if (rajesh != null && kusumScheme != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-KUSUM-0812")
                    .beneficiary(rajesh)
                    .scheme(kusumScheme)
                    .appliedGrantAmount(90000.0)
                    .eligibilityScore(88)
                    .scoreBreakdownJson("{\"incomeScore\":32,\"categoryScore\":25,\"regionScore\":20,\"docVerificationScore\":11,\"total\":88}")
                    .dynamicFieldAnswersJson("{\"pumpCapacityHp\":\"5 HP Submersible Pump\",\"waterTableDepthFt\":140,\"discomConsumerNo\":\"UP-DISCOM-948102\",\"solarArrayLandType\":\"Self-Owned Unshaded Farm Land\"}")
                    .currentStage(GrantApplication.ApplicationStage.FINANCE_APPROVAL)
                    .status("UNDER_REVIEW")
                    .reapplyCount(0)
                    .fastTracked(false)
                    .escalated(false)
                    .remarks("Field and District reviews completed with positive inspection report. Ready for staged fund release.")
                    .createdAt(LocalDateTime.now().minusDays(45))
                    .updatedAt(LocalDateTime.now().minusDays(10))
                    .build());
        }

        // App 2: Rajesh - PM Kisan (Approved)
        if (rajesh != null && kisanScheme != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-KISAN-0419")
                    .beneficiary(rajesh)
                    .scheme(kisanScheme)
                    .appliedGrantAmount(45000.0)
                    .eligibilityScore(92)
                    .scoreBreakdownJson("{\"incomeScore\":35,\"categoryScore\":25,\"regionScore\":20,\"docVerificationScore\":12,\"total\":92}")
                    .dynamicFieldAnswersJson("{\"cropType\":\"Wheat\",\"irrigationSource\":\"Tube-well / Deep Borewell\",\"khasraKhatoniNo\":\"Khasra 382/14-B\",\"soilHealthCard\":\"Yes - Active Soil Card\"}")
                    .currentStage(GrantApplication.ApplicationStage.APPROVED)
                    .status("APPROVED")
                    .reapplyCount(0)
                    .fastTracked(true)
                    .escalated(false)
                    .remarks("Approved for direct benefit transfer. Milestone 1 & 2 released successfully.")
                    .createdAt(LocalDateTime.now().minusMonths(3))
                    .updatedAt(LocalDateTime.now().minusMonths(1))
                    .build());
        }

        // App 3: Sunita - PMMVY (District Review - Score 100 Highest Priority)
        if (sunita != null && matruScheme != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-MATRU-0941")
                    .beneficiary(sunita)
                    .scheme(matruScheme)
                    .appliedGrantAmount(15000.0)
                    .eligibilityScore(100)
                    .scoreBreakdownJson("{\"incomeScore\":35,\"categoryScore\":25,\"regionScore\":20,\"docVerificationScore\":20,\"total\":100}")
                    .dynamicFieldAnswersJson("{\"pregnancyTrimester\":\"2nd Trimester (13-27 Weeks)\",\"mcpCardNumber\":\"MCP-UP-2026-88192\",\"anganwadiCenterCode\":\"AW-VARANASI-821\",\"antenatalCheckupDone\":\"Yes - Government PHC / CHC Certified\"}")
                    .currentStage(GrantApplication.ApplicationStage.DISTRICT_REVIEW)
                    .status("UNDER_REVIEW")
                    .reapplyCount(0)
                    .fastTracked(true)
                    .escalated(false)
                    .remarks("Field check verified. Awaiting District Child Development Officer administrative approval.")
                    .createdAt(LocalDateTime.now().minusDays(30))
                    .updatedAt(LocalDateTime.now().minusDays(5))
                    .build());
        }

        // App 4: Rafiq - MSME (Field Verification - Reapply Required)
        if (rafiq != null && msmeScheme != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-MSME-0773")
                    .beneficiary(rafiq)
                    .scheme(msmeScheme)
                    .appliedGrantAmount(50000.0)
                    .eligibilityScore(78)
                    .scoreBreakdownJson("{\"incomeScore\":28,\"categoryScore\":20,\"regionScore\":20,\"docVerificationScore\":10,\"total\":78}")
                    .dynamicFieldAnswersJson("{\"udyamRegistrationNo\":\"UDYAM-UP-67-0091823\",\"machineryDescription\":\"Semi-Automated Jacquard Handloom Unit with Motor\",\"employedWorkersCount\":3,\"tradeLicenseNo\":\"TL-VAR-2025-9182\"}")
                    .currentStage(GrantApplication.ApplicationStage.FIELD_VERIFICATION)
                    .status("REAPPLY_REQUIRED")
                    .reapplyCount(1)
                    .lastReapplyReason("Machinery supplier quotation is missing GST invoice details. Please upload the certified quotation with GSTIN.")
                    .lastReappliedBy("Shri Manoj Kumar Yadav")
                    .lastReappliedByRole("FIELD_OFFICER")
                    .lastReappliedAt(LocalDateTime.now().minusDays(2))
                    .fastTracked(false)
                    .escalated(false)
                    .remarks("Reapplication requested by Field Officer: Machinery quotation requires certified GST invoice.")
                    .createdAt(LocalDateTime.now().minusDays(15))
                    .updatedAt(LocalDateTime.now().minusDays(2))
                    .build());
        }

        // App 5: Lakshmi - Livestock (Field Verification)
        if (lakshmi != null && livestockScheme != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-LIVESTOCK-0312")
                    .beneficiary(lakshmi)
                    .scheme(livestockScheme)
                    .appliedGrantAmount(85000.0)
                    .eligibilityScore(84)
                    .scoreBreakdownJson("{\"incomeScore\":30,\"categoryScore\":25,\"regionScore\":20,\"docVerificationScore\":9,\"total\":84}")
                    .dynamicFieldAnswersJson("{\"cattleBreedType\":\"Indigenous Desi Cow (Gir / Sahiwal / Rathi)\",\"shedAreaSqFt\":480,\"fodderLandAcres\":1.5,\"veterinaryOfficerCertNo\":\"VET-INDORE-2026-441\"}")
                    .currentStage(GrantApplication.ApplicationStage.FIELD_VERIFICATION)
                    .status("UNDER_REVIEW")
                    .reapplyCount(0)
                    .fastTracked(false)
                    .escalated(false)
                    .remarks("Awaiting ground inspection of cattle shed construction and fodder supply.")
                    .createdAt(LocalDateTime.now().minusDays(20))
                    .updatedAt(LocalDateTime.now().minusDays(3))
                    .build());
        }

        // App 6: Gurpreet - Solar Pump (Approved)
        if (gurpreet != null && kusumScheme != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-KUSUM-0294")
                    .beneficiary(gurpreet)
                    .scheme(kusumScheme)
                    .appliedGrantAmount(120000.0)
                    .eligibilityScore(82)
                    .scoreBreakdownJson("{\"incomeScore\":26,\"categoryScore\":25,\"regionScore\":20,\"docVerificationScore\":11,\"total\":82}")
                    .dynamicFieldAnswersJson("{\"pumpCapacityHp\":\"7.5 HP High-Capacity Pump\",\"waterTableDepthFt\":180,\"discomConsumerNo\":\"PB-PSPCL-102948\",\"solarArrayLandType\":\"Self-Owned Unshaded Farm Land\"}")
                    .currentStage(GrantApplication.ApplicationStage.APPROVED)
                    .status("APPROVED")
                    .reapplyCount(0)
                    .fastTracked(false)
                    .escalated(false)
                    .remarks("7.5 HP pump sanctioned. Milestones 1 and 2 released. Milestone 3 proof submitted.")
                    .createdAt(LocalDateTime.now().minusMonths(4))
                    .updatedAt(LocalDateTime.now().minusDays(12))
                    .build());
        }

        // App 7: Gurpreet - MSME (Rejected with statutory grounds)
        if (gurpreet != null && msmeScheme != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-REJECT-0518")
                    .beneficiary(gurpreet)
                    .scheme(msmeScheme)
                    .appliedGrantAmount(150000.0)
                    .eligibilityScore(55)
                    .scoreBreakdownJson("{\"incomeScore\":10,\"categoryScore\":20,\"regionScore\":15,\"docVerificationScore\":10,\"total\":55}")
                    .dynamicFieldAnswersJson("{\"udyamRegistrationNo\":\"UDYAM-PB-12-008219\",\"machineryDescription\":\"Automated Precision CNC Milling Unit\",\"employedWorkersCount\":12,\"tradeLicenseNo\":\"TL-AMR-2025-4491\"}")
                    .currentStage(GrantApplication.ApplicationStage.REJECTED)
                    .status("REJECTED")
                    .reapplyCount(1)
                    .maxReapplyAllowed(2)
                    .rejectionCategory("INELIGIBLE_INCOME")
                    .rejectionReason("Applicant business turnover and gross family income (₹5,20,000) exceeds maximum permissible ceiling of ₹3,00,000 under Stand-Up MSME guidelines.")
                    .rejectedBy("Smt. Priya Sharma")
                    .rejectedByRole("DISTRICT_OFFICER")
                    .rejectedAt(LocalDateTime.now().minusDays(8))
                    .appealDeadline(LocalDateTime.now().plusDays(22))
                    .remarks("Application formally rejected by District Officer: Annual income criteria exceeded statutory ceiling.")
                    .createdAt(LocalDateTime.now().minusDays(25))
                    .updatedAt(LocalDateTime.now().minusDays(8))
                    .build());
        }

        // App 8: Rafiq - MSME (Re-verification Appeal in progress)
        if (rafiq != null && msmeScheme != null) {
            grantApplicationRepository.save(GrantApplication.builder()
                    .applicationNo("APP-2026-APPEAL-0391")
                    .beneficiary(rafiq)
                    .scheme(msmeScheme)
                    .appliedGrantAmount(75000.0)
                    .eligibilityScore(72)
                    .scoreBreakdownJson("{\"incomeScore\":25,\"categoryScore\":20,\"regionScore\":15,\"docVerificationScore\":12,\"total\":72}")
                    .dynamicFieldAnswersJson("{\"udyamRegistrationNo\":\"UDYAM-UP-67-0091823\",\"machineryDescription\":\"Semi-Automated Jacquard Handloom Unit\",\"employedWorkersCount\":4,\"tradeLicenseNo\":\"TL-VAR-2025-9182\"}")
                    .currentStage(GrantApplication.ApplicationStage.DISTRICT_REVIEW)
                    .status("RE_VERIFICATION_REQUESTED")
                    .reapplyCount(2)
                    .maxReapplyAllowed(2)
                    .rejectionCategory("LAND_RECORD_MISMATCH")
                    .rejectionReason("Workshop tenancy lease agreement had missing notary certification seal.")
                    .rejectedBy("Shri Manoj Kumar Yadav")
                    .rejectedByRole("FIELD_OFFICER")
                    .rejectedAt(LocalDateTime.now().minusDays(10))
                    .appealDeadline(LocalDateTime.now().plusDays(20))
                    .reVerificationAppealGrounds("Certified 10-year registered commercial lease deed with Sub-Registrar stamp duty receipt has been obtained and uploaded. Requesting fresh ground inspection.")
                    .reVerificationDocumentUrl("https://images.unsplash.com/photo-1568667256549-094345857637?w=600")
                    .reVerificationRequestedAt(LocalDateTime.now().minusDays(2))
                    .remarks("Citizen filed statutory appeal with registered commercial lease deed. Pending District Officer re-assessment.")
                    .createdAt(LocalDateTime.now().minusDays(30))
                    .updatedAt(LocalDateTime.now().minusDays(2))
                    .build());
        }
    }

    private void initDisbursements() {
        if (stagedDisbursementRepository.count() > 0) return;

        GrantApplication appKisanRajesh = grantApplicationRepository.findByApplicationNo("APP-2026-KISAN-0419").orElse(null);
        GrantApplication appKusumGurpreet = grantApplicationRepository.findByApplicationNo("APP-2026-KUSUM-0294").orElse(null);
        GrantApplication appKusumRajesh = grantApplicationRepository.findByApplicationNo("APP-2026-KUSUM-0812").orElse(null);

        // Disb 1: Rajesh PM-Kisan Stage 1
        if (appKisanRajesh != null) {
            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(appKisanRajesh)
                    .stageNumber(1)
                    .milestoneName("Initial Seed & Fertilizer Subsidy")
                    .grantPercentage(40.0)
                    .scheduledAmount(18000.0)
                    .disbursedAmount(18000.0)
                    .dueDate(LocalDate.now().minusMonths(2))
                    .complianceProofUrl("https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400")
                    .proofRemarks("Verified seed purchase bill from Government Agro Service Center.")
                    .status(StagedDisbursement.MilestoneStatus.FUND_RELEASED)
                    .disbursedAt(LocalDateTime.now().minusMonths(2))
                    .transactionRef("PFMS-DBT-2025-9812401")
                    .build());

            // Disb 2: Rajesh PM-Kisan Stage 2
            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(appKisanRajesh)
                    .stageNumber(2)
                    .milestoneName("Mid-Season Crop Health Inspection")
                    .grantPercentage(30.0)
                    .scheduledAmount(13500.0)
                    .disbursedAmount(13500.0)
                    .dueDate(LocalDate.now().minusMonths(1))
                    .complianceProofUrl("https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400")
                    .proofRemarks("Geotagged field crop photograph and inspection clearance certificate.")
                    .status(StagedDisbursement.MilestoneStatus.FUND_RELEASED)
                    .disbursedAt(LocalDateTime.now().minusMonths(1))
                    .transactionRef("PFMS-DBT-2026-1029482")
                    .build());

            // Disb 3: Rajesh PM-Kisan Stage 3
            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(appKisanRajesh)
                    .stageNumber(3)
                    .milestoneName("Harvest & Soil Testing Utilization Proof")
                    .grantPercentage(30.0)
                    .scheduledAmount(13500.0)
                    .disbursedAmount(0.0)
                    .dueDate(LocalDate.now().plusMonths(1))
                    .status(StagedDisbursement.MilestoneStatus.PENDING_COMPLIANCE)
                    .transactionRef("PFMS-DBT-PENDING")
                    .build());
        }

        // Disb 4, 5, 6: Gurpreet PM-KUSUM
        if (appKusumGurpreet != null) {
            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(appKusumGurpreet)
                    .stageNumber(1)
                    .milestoneName("Civil Works & Foundation Clearance")
                    .grantPercentage(30.0)
                    .scheduledAmount(36000.0)
                    .disbursedAmount(36000.0)
                    .dueDate(LocalDate.now().minusMonths(3))
                    .complianceProofUrl("https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400")
                    .proofRemarks("Concrete foundation structure and mounting frame photo inspected.")
                    .status(StagedDisbursement.MilestoneStatus.FUND_RELEASED)
                    .disbursedAt(LocalDateTime.now().minusMonths(3))
                    .transactionRef("PFMS-DBT-2025-7819204")
                    .build());

            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(appKusumGurpreet)
                    .stageNumber(2)
                    .milestoneName("Solar Array & Pump Delivery Verification")
                    .grantPercentage(40.0)
                    .scheduledAmount(48000.0)
                    .disbursedAmount(48000.0)
                    .dueDate(LocalDate.now().minusMonths(1))
                    .complianceProofUrl("https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=400")
                    .proofRemarks("Certified pump delivery voucher with MNRE hologram serial tags.")
                    .status(StagedDisbursement.MilestoneStatus.FUND_RELEASED)
                    .disbursedAt(LocalDateTime.now().minusMonths(1))
                    .transactionRef("PFMS-DBT-2026-8910241")
                    .build());

            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(appKusumGurpreet)
                    .stageNumber(3)
                    .milestoneName("Grid Synchronization & Commissioning Certificate")
                    .grantPercentage(30.0)
                    .scheduledAmount(36000.0)
                    .disbursedAmount(0.0)
                    .dueDate(LocalDate.now().plusWeeks(2))
                    .complianceProofUrl("https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400")
                    .proofRemarks("Commissioning certificate uploaded by DISCOM engineer. Under compliance review.")
                    .status(StagedDisbursement.MilestoneStatus.PROOF_SUBMITTED)
                    .transactionRef("PFMS-DBT-PENDING")
                    .build());
        }

        // Disb 7: Rajesh Solar Pump Stage 1
        if (appKusumRajesh != null) {
            stagedDisbursementRepository.save(StagedDisbursement.builder()
                    .application(appKusumRajesh)
                    .stageNumber(1)
                    .milestoneName("Civil Works & Foundation Clearance")
                    .grantPercentage(30.0)
                    .scheduledAmount(27000.0)
                    .disbursedAmount(0.0)
                    .dueDate(LocalDate.now().plusWeeks(3))
                    .status(StagedDisbursement.MilestoneStatus.PENDING_COMPLIANCE)
                    .transactionRef("PFMS-DBT-PENDING")
                    .build());
        }
    }

    private void initWorkflows() {
        if (verificationWorkflowRepository.count() > 0) return;

        User fieldOfficer = userRepository.findByUsername("officer_field").orElse(null);
        User districtOfficer = userRepository.findByUsername("officer_district").orElse(null);

        GrantApplication appKusumRajesh = grantApplicationRepository.findByApplicationNo("APP-2026-KUSUM-0812").orElse(null);
        if (appKusumRajesh != null && fieldOfficer != null) {
            verificationWorkflowRepository.save(VerificationWorkflow.builder()
                    .application(appKusumRajesh)
                    .stage(VerificationWorkflow.WorkflowStage.FIELD_VERIFICATION)
                    .action("FIELD_OFFICER_APPROVED")
                    .fromStage("FIELD_VERIFICATION")
                    .toStage("DISTRICT_REVIEW")
                    .performedBy(fieldOfficer)
                    .performedByUsername(fieldOfficer.getUsername())
                    .performedByRole("FIELD_OFFICER")
                    .decision(VerificationWorkflow.ActionDecision.APPROVED)
                    .reason("Site inspected and passed ground verification.")
                    .groundNotes("Physical site inspected. Agricultural borewell working order confirmed.")
                    .proofDocumentUrl("https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=400")
                    .actionTimestamp(LocalDateTime.now().minusDays(20))
                    .build());
        }

        if (appKusumRajesh != null && districtOfficer != null) {
            verificationWorkflowRepository.save(VerificationWorkflow.builder()
                    .application(appKusumRajesh)
                    .stage(VerificationWorkflow.WorkflowStage.DISTRICT_REVIEW)
                    .action("DISTRICT_OFFICER_APPROVED")
                    .fromStage("DISTRICT_REVIEW")
                    .toStage("FINANCE_APPROVAL")
                    .performedBy(districtOfficer)
                    .performedByUsername(districtOfficer.getUsername())
                    .performedByRole("DISTRICT_OFFICER")
                    .decision(VerificationWorkflow.ActionDecision.APPROVED)
                    .reason("Recommended by District Agriculture Officer. Budget allocated under North Region Solar Pump allocation.")
                    .groundNotes("Recommended by District Agriculture Officer. Budget allocated under North Region Solar Pump allocation.")
                    .actionTimestamp(LocalDateTime.now().minusDays(10))
                    .build());
        }

        GrantApplication appMsmeRafiq = grantApplicationRepository.findByApplicationNo("APP-2026-MSME-0773").orElse(null);
        if (appMsmeRafiq != null && fieldOfficer != null) {
            verificationWorkflowRepository.save(VerificationWorkflow.builder()
                    .application(appMsmeRafiq)
                    .stage(VerificationWorkflow.WorkflowStage.FIELD_VERIFICATION)
                    .action("FIELD_OFFICER_REAPPLIED")
                    .fromStage("FIELD_VERIFICATION")
                    .toStage("FIELD_VERIFICATION")
                    .performedBy(fieldOfficer)
                    .performedByUsername(fieldOfficer.getUsername())
                    .performedByRole("FIELD_OFFICER")
                    .decision(VerificationWorkflow.ActionDecision.REAPPLY)
                    .reason("Machinery supplier quotation is missing GST invoice details. Please upload the certified quotation with GSTIN.")
                    .groundNotes("Physical site verified. Quotation requires official GST vendor invoice.")
                    .actionTimestamp(LocalDateTime.now().minusDays(2))
                    .build());
        }
    }

    private void initAuditLogs() {
        if (auditLogRepository.count() > 0) return;

        auditLogRepository.save(AuditLog.builder()
                .action("SYSTEM_INITIALIZED")
                .performedByUsername("SYSTEM")
                .userRole("SYSTEM")
                .entityType("Platform")
                .entityId("0")
                .details("Digital Subsidy & Grant Administration Platform sovereign database initialized.")
                .timestamp(LocalDateTime.now().minusMonths(6))
                .build());

        auditLogRepository.save(AuditLog.builder()
                .action("SCHEME_CONFIGURED")
                .performedByUsername("admin")
                .userRole("ADMIN")
                .entityType("SchemeMaster")
                .entityId("1")
                .details("Configured master policy: PM Kisan Samman Nidhi with dynamic attributes.")
                .timestamp(LocalDateTime.now().minusMonths(5))
                .build());
    }

    private void initNotifications() {
        if (notificationRepository.count() > 0) return;

        User sunita = userRepository.findByUsername("sunita_sharma").orElse(null);
        User rajesh = userRepository.findByUsername("rajesh_patel").orElse(null);
        User rafiq = userRepository.findByUsername("rafiq_ansari").orElse(null);
        User fieldOfficer = userRepository.findByUsername("field_varanasi").orElse(null);
        User districtOfficer = userRepository.findByUsername("district_varanasi").orElse(null);
        User financeOfficer = userRepository.findByUsername("finance_up").orElse(null);

        // 1. Sunita: Correction Requested Alert (Urgent)
        if (sunita != null) {
            notificationRepository.save(Notification.builder()
                    .user(sunita)
                    .recipientRole("BENEFICIARY")
                    .applicationNo("APP-2026-MSME-0021")
                    .title("🚨 Action Required: Application Correction Requested")
                    .message("Field Officer requested re-upload of machinery supplier quotation with GSTIN. You have 1 attempt remaining (Attempt 1 of 2).")
                    .type("ACTION_REQUIRED")
                    .channel("BOTH")
                    .isRead(false)
                    .actionUrl("/beneficiary/applications")
                    .smsRecipient("+91 XXXXX-8821")
                    .smsDeliveryStatus("DELIVERED_VIA_CDAC_SMS_GATEWAY")
                    .createdAt(LocalDateTime.now().minusHours(2))
                    .build());
        }

        // 2. Rajesh: DBT Fund Credit Notification
        if (rajesh != null) {
            notificationRepository.save(Notification.builder()
                    .user(rajesh)
                    .recipientRole("BENEFICIARY")
                    .applicationNo("APP-2026-KISAN-0012")
                    .title("💰 DBT Subsidy Installment Credited (₹25,000)")
                    .message("First milestone installment of ₹25,000 for Kisan Solar Pump Scheme was credited to your Aadhaar-seeded bank account. UTR: SBIN202609001928.")
                    .type("SUCCESS")
                    .channel("BOTH")
                    .isRead(false)
                    .actionUrl("/beneficiary/disbursements")
                    .smsRecipient("+91 XXXXX-1122")
                    .smsDeliveryStatus("DELIVERED_VIA_CDAC_SMS_GATEWAY")
                    .createdAt(LocalDateTime.now().minusDays(1))
                    .build());
        }

        // 3. Rafiq: Statutory Appeal Filed Status
        if (rafiq != null) {
            notificationRepository.save(Notification.builder()
                    .user(rafiq)
                    .recipientRole("BENEFICIARY")
                    .applicationNo("APP-2026-APPEAL-0391")
                    .title("⚖️ Grievance Appeal Awaiting Hearing")
                    .message("Your statutory appeal against rejection under Land Records criteria was registered with District Authority. Appeal hearing scheduled.")
                    .type("APPEAL")
                    .channel("IN_APP")
                    .isRead(false)
                    .actionUrl("/beneficiary/applications")
                    .createdAt(LocalDateTime.now().minusDays(2))
                    .build());
        }

        // 4. Field Officer: Inspection Assigned
        notificationRepository.save(Notification.builder()
                .user(fieldOfficer)
                .recipientRole("FIELD_OFFICER")
                .applicationNo("APP-2026-AQUAC-0089")
                .title("📋 New Physical Inspection Task Assigned")
                .message("New Matsya Sampada Aquaculture grant application submitted by Vikram Singh (Varanasi circle). Geo-tagged photo verification required.")
                .type("INFO")
                .channel("IN_APP")
                .isRead(false)
                .actionUrl("/field/verification-queue")
                .createdAt(LocalDateTime.now().minusHours(4))
                .build());

        // 5. District Officer: Statutory Appeal Pending Hearing
        notificationRepository.save(Notification.builder()
                .user(districtOfficer)
                .recipientRole("DISTRICT_OFFICER")
                .applicationNo("APP-2026-APPEAL-0391")
                .title("⚖️ Statutory Citizen Appeal Pending Disposal")
                .message("Beneficiary Rafiq Ansari filed a formal appeal under Section 14 with registered tenancy deed proofs. Awaiting judicial review.")
                .type("ACTION_REQUIRED")
                .channel("IN_APP")
                .isRead(false)
                .actionUrl("/district/sanction-queue")
                .createdAt(LocalDateTime.now().minusHours(6))
                .build());

        // 6. Finance Approver: Mandate Clearance
        notificationRepository.save(Notification.builder()
                .user(financeOfficer)
                .recipientRole("FINANCE_APPROVER")
                .applicationNo("APP-2026-MICRO-0044")
                .title("🏦 Treasury Sanction Mandate Awaiting Authorization")
                .message("Micro Irrigation Grant (₹45,000) sanctioned by District Board. Please verify budget slab clearance for electronic release.")
                .type("INFO")
                .channel("IN_APP")
                .isRead(false)
                .actionUrl("/finance/approval-queue")
                .createdAt(LocalDateTime.now().minusHours(1))
                .build());
    }
}
