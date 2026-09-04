package com.subsidy_platform.service;

import com.subsidy_platform.dto.BeneficiaryRequest;
import com.subsidy_platform.dto.BeneficiaryResponse;
import java.util.List;

public interface BeneficiaryService {
    List<BeneficiaryResponse> getAll();
    BeneficiaryResponse getById(Long id);
    BeneficiaryResponse create(BeneficiaryRequest request);
    BeneficiaryResponse update(Long id, BeneficiaryRequest request);
}
