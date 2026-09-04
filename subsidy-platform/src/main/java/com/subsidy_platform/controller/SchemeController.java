package com.subsidy_platform.controller;

import com.subsidy_platform.dto.SchemeRequest;
import com.subsidy_platform.dto.SchemeResponse;
import com.subsidy_platform.service.SchemeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schemes")
@RequiredArgsConstructor
public class SchemeController {

    private final SchemeService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','BENEFICIARY','FIELD_OFFICER','DISTRICT_OFFICER','FINANCE_APPROVER')")
    public List<SchemeResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','BENEFICIARY','FIELD_OFFICER','DISTRICT_OFFICER','FINANCE_APPROVER')")
    public SchemeResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SchemeResponse create(@Valid @RequestBody SchemeRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public SchemeResponse update(
            @PathVariable Long id,
            @Valid @RequestBody SchemeRequest request
    ) {
        return service.update(id, request);
    }
}
