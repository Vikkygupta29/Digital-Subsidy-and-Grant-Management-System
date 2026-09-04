package com.subsidy_platform.controller;

import com.subsidy_platform.dto.ApplicationRequest;
import com.subsidy_platform.dto.ApplicationResponse;
import com.subsidy_platform.dto.VerificationRequest;
import com.subsidy_platform.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService service;

    @GetMapping
    public List<ApplicationResponse> getAll(Authentication authentication) {
        return service.getForRole(
                getRole(authentication),
                authentication.getName()
        );
    }

    @GetMapping("/pending")
    public List<ApplicationResponse> getPending(Authentication authentication) {
        return service.getForRole(
                getRole(authentication),
                authentication.getName()
        );
    }

    @GetMapping("/{id}")
    public ApplicationResponse getById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return service.getById(
                id,
                getRole(authentication),
                authentication.getName()
        );
    }

    @PostMapping
    public ApplicationResponse create(
            @Valid @RequestBody ApplicationRequest request,
            Authentication authentication
    ) {
        return service.create(
                request,
                getRole(authentication),
                authentication.getName()
        );
    }

    @PutMapping("/{id}/verify")
    public ApplicationResponse verify(
            @PathVariable Long id,
            @Valid @RequestBody VerificationRequest request,
            Authentication authentication
    ) {
        return service.verify(id, getRole(authentication), request);
    }

    @PutMapping("/{id}/reverify")
    public ApplicationResponse reverify(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        String remarks = body == null ? null : body.get("remarks");
        return service.reverify(id, getRole(authentication), remarks);
    }

    private String getRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("User role not found"));
    }
}
