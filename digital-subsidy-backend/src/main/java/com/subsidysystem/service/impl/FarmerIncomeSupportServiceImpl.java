package com.subsidysystem.service.impl;

import com.subsidysystem.entity.Beneficiary;
import com.subsidysystem.entity.EligibilityResult;
import com.subsidysystem.entity.Scheme;
import com.subsidysystem.service.SchemeService;
import org.springframework.stereotype.Service;

@Service
public class FarmerIncomeSupportServiceImpl implements SchemeService {
    @Override
    public EligibilityResult evaluateEligibility(Beneficiary beneficiary, Scheme scheme) {
        return null;
    }
}
