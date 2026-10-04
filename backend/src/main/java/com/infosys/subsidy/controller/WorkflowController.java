package com.infosys.subsidy.controller;

import com.infosys.subsidy.entity.User;
import com.infosys.subsidy.entity.VerificationWorkflow;
import com.infosys.subsidy.repository.GrantApplicationRepository;
import com.infosys.subsidy.repository.UserRepository;
import com.infosys.subsidy.repository.VerificationWorkflowRepository;
import com.infosys.subsidy.service.CloudinaryService;
import com.infosys.subsidy.service.WorkflowEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkflowController {

    private final WorkflowEngineService workflowEngineService;
    private final VerificationWorkflowRepository workflowRepository;
    private final GrantApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<List<VerificationWorkflow>> getWorkflowsByApplication(@PathVariable Long applicationId) {
        return applicationRepository.findById(applicationId)
                .map(app -> ResponseEntity.ok(workflowRepository.findByApplication(app)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Complete workflow history ordered chronologically
    @GetMapping("/history/{applicationId}")
    public ResponseEntity<List<VerificationWorkflow>> getWorkflowHistory(@PathVariable Long applicationId) {
        return applicationRepository.findById(applicationId)
                .map(app -> ResponseEntity.ok(workflowRepository.findByApplicationOrderByActionTimestampAsc(app)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/decision")
    public ResponseEntity<?> processDecision(
            @RequestParam("applicationId") Long applicationId,
            @RequestParam("stage") VerificationWorkflow.WorkflowStage stage,
            @RequestParam("performedById") Long performedById,
            @RequestParam("decision") VerificationWorkflow.ActionDecision decision,
            @RequestParam("notes") String notes,
            @RequestParam(value = "proofDocument", required = false) MultipartFile proofDocument
    ) {
        User officer = userRepository.findById(performedById).orElse(null);

        String proofUrl = null;
        if (proofDocument != null && !proofDocument.isEmpty()) {
            proofUrl = cloudinaryService.uploadFile(proofDocument);
        }

        VerificationWorkflow workflow = workflowEngineService.processWorkflowDecision(
                applicationId,
                stage,
                officer,
                decision,
                notes,
                proofUrl
        );

        return ResponseEntity.ok(workflow);
    }
}
