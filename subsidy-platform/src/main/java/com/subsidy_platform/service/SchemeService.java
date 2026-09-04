package com.subsidy_platform.service;

import com.subsidy_platform.dto.SchemeRequest;
import com.subsidy_platform.dto.SchemeResponse;
import java.util.List;

public interface SchemeService {
    List<SchemeResponse> getAll();
    SchemeResponse getById(Long id);
    SchemeResponse create(SchemeRequest request);
    SchemeResponse update(Long id, SchemeRequest request);
}
