package com.subsidy_platform.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsidy_platform.dto.ApplicationRequest;
import com.subsidy_platform.dto.ApplicationResponse;
import com.subsidy_platform.dto.VerificationRequest;
import com.subsidy_platform.entity.Application;
import com.subsidy_platform.entity.ApplicationStatus;
import com.subsidy_platform.entity.Beneficiary;
import com.subsidy_platform.entity.Scheme;
import com.subsidy_platform.entity.User;
import com.subsidy_platform.exception.BadRequestException;
import com.subsidy_platform.exception.ResourceNotFoundException;
import com.subsidy_platform.repository.ApplicationRepository;
import com.subsidy_platform.repository.BeneficiaryRepository;
import com.subsidy_platform.repository.SchemeRepository;
import com.subsidy_platform.repository.UserRepository;
import com.subsidy_platform.service.ApplicationService;
import com.subsidy_platform.service.EligibilityEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final SchemeRepository schemeRepository;
    private final UserRepository userRepository;
    private final EligibilityEngine eligibilityEngine;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getAll() {
        return applicationRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getForRole(String role, String email) {
        return switch (role) {
            case "ADMIN" -> getAll();
            case "FIELD_OFFICER" -> mapApplications(
                    applicationRepository.findByStatusAndCurrentLevel(
                            ApplicationStatus.FIELD_VERIFICATION,
                            "FIELD_OFFICER"
                    )
            );
            case "DISTRICT_OFFICER" -> mapApplications(
                    applicationRepository.findByStatusAndCurrentLevel(
                            ApplicationStatus.DISTRICT_REVIEW,
                            "DISTRICT_OFFICER"
                    )
            );
            case "FINANCE_APPROVER" -> mapApplications(
                    applicationRepository.findByStatusAndCurrentLevel(
                            ApplicationStatus.FINANCE_APPROVAL,
                            "FINANCE_APPROVER"
                    )
            );
            case "BENEFICIARY" -> {
                Beneficiary beneficiary = findBeneficiaryByEmail(email);
                yield mapApplications(applicationRepository.findByBeneficiaryId(beneficiary.getId()));
            }
            default -> List.of();
        };
    }

    @Override
    @Transactional(readOnly = true)
    public ApplicationResponse getById(Long id, String role, String email) {
        Application application = find(id);

        if ("BENEFICIARY".equals(role)) {
            Beneficiary beneficiary = findBeneficiaryByEmail(email);
            if (application.getBeneficiary() == null
                    || !application.getBeneficiary().getId().equals(beneficiary.getId())) {
                throw new ResourceNotFoundException("Application not found: " + id);
            }
        }

        return toResponse(application);
    }

    @Override
    public ApplicationResponse create(ApplicationRequest request, String role, String email) {
        Scheme scheme = schemeRepository.findById(request.getSchemeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Scheme not found: " + request.getSchemeId()
                ));

        if (request.getRequestedAmount().compareTo(
                java.math.BigDecimal.valueOf(scheme.getGrantAmount())) > 0) {
            throw new BadRequestException(
                    "Requested amount cannot exceed scheme grant amount"
            );
        }

        User applicant = findUser(email);
        Beneficiary beneficiary;

        if ("BENEFICIARY".equals(role)) {
            beneficiary = beneficiaryRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new BadRequestException(
                            "Beneficiary profile not found for logged-in email. " +
                            "Ask an administrator to create the beneficiary profile."
                    ));
        } else if ("ADMIN".equals(role)) {
            if (request.getBeneficiaryId() == null) {
                throw new BadRequestException(
                        "beneficiaryId is required when ADMIN creates an application"
                );
            }

            beneficiary = beneficiaryRepository.findById(request.getBeneficiaryId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Beneficiary not found: " + request.getBeneficiaryId()
                    ));
        } else {
            throw new BadRequestException("Only ADMIN and BENEFICIARY can create applications");
        }

        Application application = new Application();
        application.setApplicant(applicant);
        application.setBeneficiary(beneficiary);
        application.setScheme(scheme);
        application.setPurpose(request.getPurpose());
        application.setRequestedAmount(request.getRequestedAmount());

        try {
            application.setSubmittedData(objectMapper.writeValueAsString(Map.of(
                    "purpose", request.getPurpose() == null ? "" : request.getPurpose(),
                    "requestedAmount", request.getRequestedAmount()
            )));
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Unable to prepare application data");
        }

        eligibilityEngine.evaluate(application);

        return toResponse(applicationRepository.save(application));
    }

    @Override
    public ApplicationResponse verify(Long id, String role, VerificationRequest request) {
        Application application = find(id);
        String decision = request.getDecision().trim().toUpperCase();

        validateRoleForStage(application, role);

        switch (decision) {
            case "APPROVE" -> moveForward(application, role);
            case "REJECT" -> setStage(
                    application,
                    ApplicationStatus.REJECTED,
                    "REJECTED",
                    "NONE"
            );
            case "REVERIFY" -> setStage(
                    application,
                    ApplicationStatus.REVERIFICATION,
                    "REVERIFICATION",
                    role
            );
            default -> throw new BadRequestException(
                    "Decision must be APPROVE, REJECT or REVERIFY"
            );
        }

        application.setRemarks(request.getRemarks());
        return toResponse(applicationRepository.save(application));
    }

    @Override
    public ApplicationResponse reverify(Long id, String role, String remarks) {
        Application application = find(id);

        if (!"REVERIFICATION".equals(application.getCurrentStage())
                || !role.equals(application.getCurrentLevel())) {
            throw new BadRequestException(
                    "Application is not awaiting re-verification by " + role
            );
        }

        ApplicationStatus status = stageForRole(role);
        setStage(application, status, status.name(), role);
        application.setRemarks(remarks);

        return toResponse(applicationRepository.save(application));
    }

    private void moveForward(Application application, String role) {
        switch (role) {
            case "FIELD_OFFICER" -> setStage(
                    application,
                    ApplicationStatus.DISTRICT_REVIEW,
                    "DISTRICT_REVIEW",
                    "DISTRICT_OFFICER"
            );
            case "DISTRICT_OFFICER" -> setStage(
                    application,
                    ApplicationStatus.FINANCE_APPROVAL,
                    "FINANCE_APPROVAL",
                    "FINANCE_APPROVER"
            );
            case "FINANCE_APPROVER" -> setStage(
                    application,
                    ApplicationStatus.APPROVED,
                    "APPROVED",
                    "NONE"
            );
            default -> throw new BadRequestException(
                    "Role cannot verify applications"
            );
        }
    }

    private void validateRoleForStage(Application application, String role) {
        if (!role.equals(application.getCurrentLevel())) {
            throw new BadRequestException(
                    "Application is not assigned to " + role
            );
        }

        String expectedStage = switch (role) {
            case "FIELD_OFFICER" -> "FIELD_VERIFICATION";
            case "DISTRICT_OFFICER" -> "DISTRICT_REVIEW";
            case "FINANCE_APPROVER" -> "FINANCE_APPROVAL";
            default -> null;
        };

        if (expectedStage == null
                || !expectedStage.equals(application.getCurrentStage())) {
            throw new BadRequestException(
                    "Application is not currently at the required stage for " + role
            );
        }
    }

    private ApplicationStatus stageForRole(String role) {
        return switch (role) {
            case "FIELD_OFFICER" -> ApplicationStatus.FIELD_VERIFICATION;
            case "DISTRICT_OFFICER" -> ApplicationStatus.DISTRICT_REVIEW;
            case "FINANCE_APPROVER" -> ApplicationStatus.FINANCE_APPROVAL;
            default -> throw new BadRequestException("Invalid officer role");
        };
    }

    private void setStage(
            Application application,
            ApplicationStatus status,
            String currentStage,
            String currentLevel
    ) {
        application.setStatus(status);
        application.setCurrentStage(currentStage);
        application.setCurrentLevel(currentLevel);
    }

    private User findUser(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("User not found: " + email);
        }
        return user;
    }

    private Beneficiary findBeneficiaryByEmail(String email) {
        return beneficiaryRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Beneficiary profile not found for email: " + email
                ));
    }

    private Application find(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application not found: " + id
                ));
    }

    private List<ApplicationResponse> mapApplications(List<Application> applications) {
        return applications.stream()
                .map(this::toResponse)
                .toList();
    }

    private ApplicationResponse toResponse(Application application) {
        return ApplicationResponse.builder()
                .id(application.getId())
                .beneficiaryId(application.getBeneficiary() != null
                        ? application.getBeneficiary().getId() : null)
                .beneficiaryName(application.getBeneficiary() != null
                        ? application.getBeneficiary().getName() : null)
                .schemeId(application.getScheme() != null
                        ? application.getScheme().getId() : null)
                .schemeName(application.getScheme() != null
                        ? application.getScheme().getName() : null)
                .purpose(application.getPurpose())
                .requestedAmount(application.getRequestedAmount())
                .eligibilityScore(application.getEligibilityScore())
                .eligibilityResult(application.getEligibilityResult())
                .status(application.getStatus() == null
                        ? null : application.getStatus().name())
                .currentStage(application.getCurrentStage())
                .currentLevel(application.getCurrentLevel())
                .remarks(application.getRemarks())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}
