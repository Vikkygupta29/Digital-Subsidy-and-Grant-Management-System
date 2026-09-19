package com.example.subsidysystem.controller;

import com.example.subsidysystem.entity.Application;
import com.example.subsidysystem.entity.User;
import com.example.subsidysystem.repository.ApplicationRepository;
import com.example.subsidysystem.repository.UserRepository;
import com.example.subsidysystem.service.WorkflowEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final WorkflowEngineService workflowEngineService;

    public ApplicationController(ApplicationRepository applicationRepository,
                                 UserRepository userRepository,
                                 WorkflowEngineService workflowEngineService) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.workflowEngineService = workflowEngineService;
    }

    @GetMapping
    public ResponseEntity<List<Application>> getAllApplications(@RequestParam(required = false) String status,
                                                               @RequestParam(required = false) String district) {
        if (status != null) {
            return ResponseEntity.ok(applicationRepository.findByCurrentStatus(status));
        }
        if (district != null) {
            return ResponseEntity.ok(applicationRepository.findByDistrict(district));
        }
        return ResponseEntity.ok(applicationRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> getApplicationById(@PathVariable String id) {
        return applicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/field-verify")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<Application> fieldVerify(@PathVariable String id,
                                                   @RequestBody Map<String, String> payload,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        User officer = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        String action = payload.get("action");
        String remarks = payload.get("remarks");
        String geo = payload.get("geoCoordinates");

        Application updated = workflowEngineService.processFieldVerification(id, officer, action, remarks, geo);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/district-review")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'ADMIN')")
    public ResponseEntity<Application> districtReview(@PathVariable String id,
                                                      @RequestBody Map<String, String> payload,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        User officer = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        String action = payload.get("action");
        String remarks = payload.get("remarks");

        Application updated = workflowEngineService.processDistrictReview(id, officer, action, remarks);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/finance-sanction")
    @PreAuthorize("hasAnyRole('FINANCE_APPROVER', 'ADMIN')")
    public ResponseEntity<Application> financeSanction(@PathVariable String id,
                                                       @RequestBody Map<String, Object> payload,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        User officer = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        BigDecimal sanctionedAmount = new BigDecimal(payload.get("sanctionedAmount").toString());
        String remarks = (String) payload.get("remarks");

        Application updated = workflowEngineService.processFinanceSanction(id, officer, sanctionedAmount, remarks);
        return ResponseEntity.ok(updated);
    }
}
