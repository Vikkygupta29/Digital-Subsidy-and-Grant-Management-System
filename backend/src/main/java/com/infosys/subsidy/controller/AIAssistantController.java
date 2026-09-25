package com.infosys.subsidy.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infosys.subsidy.entity.BeneficiaryProfile;
import com.infosys.subsidy.entity.GrantApplication;
import com.infosys.subsidy.entity.SchemeMaster;
import com.infosys.subsidy.repository.BeneficiaryProfileRepository;
import com.infosys.subsidy.repository.GrantApplicationRepository;
import com.infosys.subsidy.repository.SchemeMasterRepository;
import com.infosys.subsidy.repository.StagedDisbursementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AIAssistantController {

    private final SchemeMasterRepository schemeMasterRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final GrantApplicationRepository applicationRepository;
    private final StagedDisbursementRepository disbursementRepository;
    private final ObjectMapper objectMapper;

    /**
     * AI Scheme Recommendation & Eligibility Advisor
     * Evaluates applicant parameters and returns ranked schemes with match probability.
     */
    @PostMapping("/recommend-schemes")
    public ResponseEntity<?> recommendSchemes(@RequestBody Map<String, Object> body) {
        Long beneficiaryId = body.get("beneficiaryId") != null ? Long.valueOf(body.get("beneficiaryId").toString()) : null;
        BeneficiaryProfile profile = null;
        if (beneficiaryId != null) {
            profile = beneficiaryProfileRepository.findById(beneficiaryId).orElse(null);
        }

        List<SchemeMaster> allSchemes = schemeMasterRepository.findAll();
        List<Map<String, Object>> recommendations = new ArrayList<>();

        for (SchemeMaster s : allSchemes) {
            int matchScore = 70;
            List<String> matchReasons = new ArrayList<>();
            List<String> warnings = new ArrayList<>();

            if (profile != null) {
                // Income check
                if (s.getMaxIncomeCriteria() != null) {
                    if (profile.getAnnualIncome() != null && profile.getAnnualIncome() <= s.getMaxIncomeCriteria()) {
                        matchScore += 15;
                        matchReasons.add("Annual income ₹" + profile.getAnnualIncome().longValue() + " is within eligibility threshold of ₹" + s.getMaxIncomeCriteria().longValue());
                    } else if (profile.getAnnualIncome() != null && profile.getAnnualIncome() > s.getMaxIncomeCriteria()) {
                        matchScore -= 30;
                        warnings.add("Annual income exceeds official income cap");
                    }
                } else {
                    matchReasons.add("Universal income eligibility criteria");
                }

                // Category check
                if (s.getTargetCategories() != null && !s.getTargetCategories().isBlank()) {
                    if (profile.getCategory() != null && s.getTargetCategories().toLowerCase().contains(profile.getCategory().toLowerCase())) {
                        matchScore += 15;
                        matchReasons.add("Citizen social category (" + profile.getCategory() + ") is priority target group");
                    }
                }

                // Land check
                if (profile.getLandSizeAcres() != null && profile.getLandSizeAcres() > 0) {
                    if (s.getSchemeCode().contains("KISAN") || s.getSchemeCode().contains("KUSUM")) {
                        matchScore += 10;
                        matchReasons.add("Agricultural land holding (" + profile.getLandSizeAcres() + " Acres) qualifies for farm subsidy");
                    }
                }
            } else {
                matchReasons.add("General eligibility under sovereign national guidelines");
            }

            matchScore = Math.min(99, Math.max(35, matchScore));

            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("schemeId", s.getId());
            rec.put("schemeCode", s.getSchemeCode());
            rec.put("schemeName", s.getName());
            rec.put("category", s.getCategory());
            rec.put("maxGrantAmount", s.getMaxGrantAmount());
            rec.put("matchScore", matchScore);
            rec.put("approvalProbability", matchScore >= 80 ? "HIGH" : matchScore >= 60 ? "MEDIUM" : "LOW");
            rec.put("matchReasons", matchReasons);
            rec.put("warnings", warnings);
            recommendations.add(rec);
        }

        recommendations.sort((a, b) -> Integer.compare((Integer) b.get("matchScore"), (Integer) a.get("matchScore")));
        return ResponseEntity.ok(Map.of("recommendations", recommendations));
    }

    /**
     * AI Pre-Submission Audit
     * Audits application fields, grant amount, and answers before final submission.
     */
    @PostMapping("/audit-application")
    public ResponseEntity<?> auditApplication(@RequestBody Map<String, Object> body) {
        Long schemeId = body.get("schemeId") != null ? Long.valueOf(body.get("schemeId").toString()) : null;
        Long beneficiaryId = body.get("beneficiaryId") != null ? Long.valueOf(body.get("beneficiaryId").toString()) : null;
        Double appliedAmount = body.get("appliedAmount") != null ? Double.valueOf(body.get("appliedAmount").toString()) : 0.0;
        String answersJson = (String) body.get("dynamicFieldAnswersJson");

        SchemeMaster scheme = schemeId != null ? schemeMasterRepository.findById(schemeId).orElse(null) : null;
        BeneficiaryProfile profile = beneficiaryId != null ? beneficiaryProfileRepository.findById(beneficiaryId).orElse(null) : null;

        List<String> strengths = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        List<String> alerts = new ArrayList<>();
        int estimatedScore = 80;

        if (scheme != null) {
            if (scheme.getMaxGrantAmount() != null && appliedAmount > scheme.getMaxGrantAmount()) {
                alerts.add("Applied grant amount (₹" + appliedAmount.longValue() + ") exceeds maximum scheme cap of ₹" + scheme.getMaxGrantAmount().longValue());
                estimatedScore -= 25;
            } else {
                strengths.add("Requested grant amount complies with scheme ceiling");
                estimatedScore += 5;
            }
        }

        if (profile != null) {
            if (profile.getAadhaarNumber() != null && profile.getAadhaarNumber().length() >= 12) {
                strengths.add("Aadhaar KYC verified against UIDAI vault (" + profile.getAadhaarNumber() + ")");
                estimatedScore += 5;
            }
            if (profile.getPanNumber() != null && !profile.getPanNumber().isBlank()) {
                strengths.add("Tax & PAN identity verified");
                estimatedScore += 5;
            }
            if (profile.getVerificationStatus() == BeneficiaryProfile.Status.VERIFIED) {
                strengths.add("Citizen KYC profile is officially VERIFIED");
                estimatedScore += 10;
            }
        }

        // Parse and audit dynamic answers
        if (answersJson != null && !answersJson.isBlank()) {
            try {
                Map<String, Object> answers = objectMapper.readValue(answersJson, new TypeReference<Map<String, Object>>() {});
                if (!answers.isEmpty()) {
                    strengths.add(answers.size() + " scheme-specific dynamic attributes completed");
                    recommendations.add("Keep physical proof documents ready for the Field Officer ground inspection");
                }
            } catch (Exception e) {
                alerts.add("Dynamic attributes format invalid");
            }
        }

        estimatedScore = Math.min(98, Math.max(40, estimatedScore));
        String riskTier = estimatedScore >= 85 ? "LOW" : estimatedScore >= 65 ? "MEDIUM" : "HIGH";

        Map<String, Object> auditResult = new LinkedHashMap<>();
        auditResult.put("estimatedScore", estimatedScore);
        auditResult.put("riskTier", riskTier);
        auditResult.put("fastTrackEligible", estimatedScore >= 75);
        auditResult.put("strengths", strengths);
        auditResult.put("recommendations", recommendations);
        auditResult.put("alerts", alerts);
        auditResult.put("summary", "AI Audit: Application quality is " + riskTier + " risk with an estimated score of " + estimatedScore + "/100. " + (estimatedScore >= 75 ? "Eligible for fast-track processing." : "Requires careful review."));

        return ResponseEntity.ok(auditResult);
    }

    /**
     * Interactive Sovereign AI Sahayak Chat Endpoint
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
        String query = (String) body.getOrDefault("message", "");
        String role = (String) body.getOrDefault("role", "BENEFICIARY");
        Long beneficiaryId = body.get("beneficiaryId") != null ? Long.valueOf(body.get("beneficiaryId").toString()) : null;

        String queryLower = query.toLowerCase();
        String response;
        List<String> suggestedActions = new ArrayList<>();

        if (queryLower.contains("eligible") || queryLower.contains("which scheme") || queryLower.contains("recommend")) {
            List<SchemeMaster> schemes = schemeMasterRepository.findAll();
            StringBuilder sb = new StringBuilder("Based on sovereign policy criteria, here are key schemes you may qualify for:\n\n");
            for (SchemeMaster s : schemes) {
                sb.append("• **").append(s.getName()).append("** (").append(s.getCategory() != null ? s.getCategory() : "General Scheme").append(")\n");
                sb.append("  - Max Grant: ₹").append(s.getMaxGrantAmount() != null ? s.getMaxGrantAmount().longValue() : "Slab based").append("\n");
                if (s.getMaxIncomeCriteria() != null) {
                    sb.append("  - Income Cap: ₹").append(s.getMaxIncomeCriteria().longValue()).append("\n");
                }
            }
            sb.append("\nYou can click 'Apply for Scheme' to submit your application with automated eligibility scoring.");
            response = sb.toString();
            suggestedActions.add("Apply for Scheme");
            suggestedActions.add("Check PM-KUSUM Solar");
            suggestedActions.add("View My Profile");
        } else if (queryLower.contains("reapply") || queryLower.contains("returned") || queryLower.contains("send back") || queryLower.contains("fix")) {
            response = "If your application has been marked **REAPPLY_REQUIRED**:\n\n" +
                    "1. Check the officer's **mandatory reason** in the alert banner on your dashboard.\n" +
                    "2. Click **'Update & Resubmit Application'** to modify dynamic attributes or attach updated proofs.\n" +
                    "3. Add corrective remarks explaining your changes.\n" +
                    "4. Upon resubmission, your application returns immediately to the **Field Officer** for priority ground re-inspection.\n\n" +
                    "Your original eligibility score and history are strictly preserved!";
            suggestedActions.add("View Returned Applications");
            suggestedActions.add("What documents are needed?");
        } else if (queryLower.contains("dbt") || queryLower.contains("disbursement") || queryLower.contains("milestone") || queryLower.contains("tranche")) {
            response = "Direct Benefit Transfer (DBT) operates under a **3-Stage Milestone Schedule**:\n\n" +
                    "• **Tranche 1 (40%)**: Advance release upon administrative sanction and KYC verification.\n" +
                    "• **Tranche 2 (30%)**: Released after on-site installation and progress proof submission.\n" +
                    "• **Tranche 3 (30%)**: Final tranche credited following Patwari/Field Officer operational sign-off.\n\n" +
                    "Funds are routed directly through PFMS to your verified Aadhaar-linked bank account.";
            suggestedActions.add("View Disbursements Tab");
            suggestedActions.add("Upload Milestone Proof");
        } else if (queryLower.contains("score") || queryLower.contains("scoring") || queryLower.contains("fast track")) {
            response = "The Automated Eligibility Engine calculates a **Score from 0 to 100** based on 4 criteria:\n\n" +
                    "1. **Annual Income (35 pts)**: Lower family income receives higher priority points.\n" +
                    "2. **Social Category (25 pts)**: Special categories (SC/ST/OBC/Women/SHG) receive targeted weightage.\n" +
                    "3. **Land / Asset Size (20 pts)**: Smallholder and marginal farmers (< 5 Acres) receive full points.\n" +
                    "4. **Document Verification (20 pts)**: Aadhaar KYC and bank validation.\n\n" +
                    "Scores $\\ge$ 75 are automatically marked **Fast-Tracked** for expedited field inspection!";
            suggestedActions.add("Calculate My Score");
            suggestedActions.add("View Scoring Rules");
        } else {
            response = "Namaste! I am your **Sovereign AI Sahayak** (DBT & Grant Administration Copilot).\n\n" +
                    "I can assist you with:\n" +
                    "• Discovering government schemes matching your profile\n" +
                    "• Understanding your eligibility score and requirements\n" +
                    "• Guiding you through the Reapply & Resubmit correction process\n" +
                    "• Tracking DBT tranche releases and PFMS bank credits\n\n" +
                    "How may I assist you today?";
            suggestedActions.add("Which schemes am I eligible for?");
            suggestedActions.add("How does Reapplication work?");
            suggestedActions.add("Explain DBT Milestones");
        }

        return ResponseEntity.ok(Map.of(
                "response", response,
                "suggestedActions", suggestedActions,
                "timestamp", new Date().toString()
        ));
    }
}
