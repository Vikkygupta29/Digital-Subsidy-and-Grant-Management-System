package com.subsidysystem.controller;

import com.subsidysystem.dto.FarmerEvaluationRequest;
import com.subsidysystem.entity.EligibilityResult;
import com.subsidysystem.entity.Scheme;
import com.subsidysystem.repository.SchemeRepository;
import com.subsidysystem.service.SchemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schemes/farmer")
@RequiredArgsConstructor
public class FarmerIncomeSupportController {

    @Qualifier("farmerService")
    private final SchemeService schemeService;

    private final SchemeRepository schemeRepository;

    @PostMapping("/create-scheme")
    public ResponseEntity<Scheme> createScheme(@RequestBody Scheme scheme) {
        Scheme savedScheme = schemeRepository.save(scheme);
        return new ResponseEntity<>(savedScheme, HttpStatus.CREATED);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<EligibilityResult> evaluateFarmerEligibility(
            @RequestBody FarmerEvaluationRequest request) {

        Scheme scheme = schemeRepository.findById(request.getSchemeId())
                .orElseThrow(() -> new RuntimeException("Scheme not found"));

        EligibilityResult result = schemeService.evaluateEligibility(
                request.getBeneficiary(),
                scheme
        );

        return ResponseEntity.ok(result);
    }
}
