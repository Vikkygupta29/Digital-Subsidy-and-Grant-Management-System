package com.subsidy_platform.service;

import com.subsidy_platform.dto.ApplicationRequest;
import com.subsidy_platform.dto.ApplicationResponse;
import com.subsidy_platform.dto.VerificationRequest;

import java.util.List;

public interface ApplicationService {
    List<ApplicationResponse> getAll();
    List<ApplicationResponse> getForRole(String role, String email);
    ApplicationResponse getById(Long id, String role, String email);
    ApplicationResponse create(ApplicationRequest request, String role, String email);
    ApplicationResponse verify(Long id, String role, VerificationRequest request);
    ApplicationResponse reverify(Long id, String role, String remarks);
}
