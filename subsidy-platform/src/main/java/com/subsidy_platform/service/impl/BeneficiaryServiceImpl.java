package com.subsidy_platform.service.impl;

import com.subsidy_platform.dto.BeneficiaryRequest;
import com.subsidy_platform.dto.BeneficiaryResponse;
import com.subsidy_platform.entity.Beneficiary;
import com.subsidy_platform.exception.BadRequestException;
import com.subsidy_platform.exception.ResourceNotFoundException;
import com.subsidy_platform.repository.BeneficiaryRepository;
import com.subsidy_platform.service.BeneficiaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BeneficiaryServiceImpl implements BeneficiaryService {

    private final BeneficiaryRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<BeneficiaryResponse> getAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BeneficiaryResponse getById(Long id) {
        return toResponse(find(id));
    }

    @Override
    public BeneficiaryResponse create(BeneficiaryRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (repository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Beneficiary email already exists");
        }

        Beneficiary beneficiary = new Beneficiary();
        apply(beneficiary, request, email);

        return toResponse(repository.save(beneficiary));
    }

    @Override
    public BeneficiaryResponse update(Long id, BeneficiaryRequest request) {
        Beneficiary beneficiary = find(id);
        String email = normalizeEmail(request.getEmail());

        if (!beneficiary.getEmail().equalsIgnoreCase(email)
                && repository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Beneficiary email already exists");
        }

        apply(beneficiary, request, email);
        return toResponse(repository.save(beneficiary));
    }

    private Beneficiary find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Beneficiary not found: " + id
                ));
    }

    private void apply(
            Beneficiary beneficiary,
            BeneficiaryRequest request,
            String email
    ) {
        beneficiary.setName(request.getName().trim());
        beneficiary.setEmail(email);
        beneficiary.setPhone(request.getPhone().trim());
        beneficiary.setCategory(request.getCategory().trim().toUpperCase());
        beneficiary.setRegion(request.getRegion().trim().toUpperCase());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private BeneficiaryResponse toResponse(Beneficiary beneficiary) {
        return BeneficiaryResponse.builder()
                .id(beneficiary.getId())
                .name(beneficiary.getName())
                .email(beneficiary.getEmail())
                .phone(beneficiary.getPhone())
                .category(beneficiary.getCategory())
                .region(beneficiary.getRegion())
                .build();
    }
}
