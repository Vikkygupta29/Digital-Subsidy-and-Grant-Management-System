package com.subsidy_platform.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsidy_platform.dto.SchemeRequest;
import com.subsidy_platform.dto.SchemeResponse;
import com.subsidy_platform.entity.Scheme;
import com.subsidy_platform.exception.BadRequestException;
import com.subsidy_platform.exception.ResourceNotFoundException;
import com.subsidy_platform.repository.SchemeRepository;
import com.subsidy_platform.service.SchemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class SchemeServiceImpl implements SchemeService {

    private final SchemeRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SchemeResponse> getAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SchemeResponse getById(Long id) {
        return toResponse(find(id));
    }

    @Override
    public SchemeResponse create(SchemeRequest request) {
        validateCriteria(request.getCriteriaSchema());

        Scheme scheme = new Scheme();
        apply(scheme, request);
        return toResponse(repository.save(scheme));
    }

    @Override
    public SchemeResponse update(Long id, SchemeRequest request) {
        validateCriteria(request.getCriteriaSchema());

        Scheme scheme = find(id);
        apply(scheme, request);
        return toResponse(repository.save(scheme));
    }

    private void validateCriteria(String criteriaSchema) {
        try {
            Map<String, Object> criteria = objectMapper.readValue(
                    criteriaSchema,
                    new TypeReference<Map<String, Object>>() {}
            );

            if (criteria == null) {
                throw new BadRequestException("Eligibility criteria must be a JSON object");
            }
        } catch (JsonProcessingException e) {
            throw new BadRequestException(
                    "Eligibility criteria must be valid JSON"
            );
        }
    }

    private Scheme find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Scheme not found: " + id
                ));
    }

    private void apply(Scheme scheme, SchemeRequest request) {
        scheme.setName(request.getName().trim());
        scheme.setGrantAmount(request.getGrantAmount());
        scheme.setCriteriaSchema(request.getCriteriaSchema().trim());
    }

    private SchemeResponse toResponse(Scheme scheme) {
        return SchemeResponse.builder()
                .id(scheme.getId())
                .name(scheme.getName())
                .grantAmount(scheme.getGrantAmount())
                .criteriaSchema(scheme.getCriteriaSchema())
                .build();
    }
}
