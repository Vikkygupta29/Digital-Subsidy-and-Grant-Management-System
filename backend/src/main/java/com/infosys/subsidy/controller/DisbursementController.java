package com.infosys.subsidy.controller;

import com.infosys.subsidy.entity.StagedDisbursement;
import com.infosys.subsidy.entity.User;
import com.infosys.subsidy.repository.GrantApplicationRepository;
import com.infosys.subsidy.repository.StagedDisbursementRepository;
import com.infosys.subsidy.repository.UserRepository;
import com.infosys.subsidy.service.CloudinaryService;
import com.infosys.subsidy.service.DisbursementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/disbursements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DisbursementController {

    private final DisbursementService disbursementService;
    private final StagedDisbursementRepository stagedDisbursementRepository;
    private final GrantApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @GetMapping
    public ResponseEntity<List<StagedDisbursement>> getAllDisbursements() {
        return ResponseEntity.ok(stagedDisbursementRepository.findAll());
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<List<StagedDisbursement>> getByApplication(@PathVariable Long applicationId) {
        return applicationRepository.findById(applicationId)
                .map(app -> ResponseEntity.ok(stagedDisbursementRepository.findByApplication(app)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/submit-proof")
    public ResponseEntity<?> submitComplianceProof(
            @PathVariable Long id,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam(value = "proofFile", required = false) MultipartFile proofFile
    ) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        String proofUrl = null;
        if (proofFile != null && !proofFile.isEmpty()) {
            proofUrl = cloudinaryService.uploadFile(proofFile);
        } else {
            proofUrl = "https://res.cloudinary.com/hkxztbcu/image/upload/v1726830000/subsidy_grant_docs/sample_milestone_proof.pdf";
        }

        StagedDisbursement disbursement = disbursementService.submitComplianceProof(id, proofUrl, remarks, user);
        return ResponseEntity.ok(disbursement);
    }

    @PostMapping("/{id}/release-fund")
    public ResponseEntity<?> releaseFund(
            @PathVariable Long id,
            @RequestParam(value = "approverId", required = false) Long approverId
    ) {
        User approver = approverId != null ? userRepository.findById(approverId).orElse(null) : null;
        StagedDisbursement disbursement = disbursementService.approveComplianceAndReleaseFund(id, approver);
        return ResponseEntity.ok(disbursement);
    }

    @PostMapping("/{id}/flag-non-compliant")
    public ResponseEntity<?> flagNonCompliant(
            @PathVariable Long id,
            @RequestParam("reason") String reason,
            @RequestParam(value = "officerId", required = false) Long officerId
    ) {
        User officer = officerId != null ? userRepository.findById(officerId).orElse(null) : null;
        StagedDisbursement disbursement = disbursementService.flagNonCompliance(id, reason, officer);
        return ResponseEntity.ok(disbursement);
    }
}
