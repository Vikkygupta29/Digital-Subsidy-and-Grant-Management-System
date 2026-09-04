package com.subsidy_platform.controller;

import com.subsidy_platform.dto.BeneficiaryRequest;
import com.subsidy_platform.dto.BeneficiaryResponse;
import com.subsidy_platform.service.BeneficiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
public class BeneficiaryController {

    private final BeneficiaryService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FIELD_OFFICER','DISTRICT_OFFICER','FINANCE_APPROVER')")
    public List<BeneficiaryResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FIELD_OFFICER','DISTRICT_OFFICER','FINANCE_APPROVER')")
    public BeneficiaryResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public BeneficiaryResponse create(@Valid @RequestBody BeneficiaryRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BeneficiaryResponse update(@PathVariable Long id,
                                      @Valid @RequestBody BeneficiaryRequest request) {
        return service.update(id, request);
    }
}
