package com.subsidy_platform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsidy_platform.entity.Application;
import com.subsidy_platform.entity.ApplicationStatus;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class EligibilityEngine {

    private final ObjectMapper mapper;

    public EligibilityEngine(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public void evaluate(Application application) {
        try {
            String criteriaJson = application.getScheme().getCriteriaSchema();

            if (criteriaJson == null || criteriaJson.isBlank()) {
                route(application, 0);
                return;
            }

            Map<String, Object> criteria = mapper.readValue(
                    criteriaJson,
                    new TypeReference<Map<String, Object>>() {}
            );

            if (criteria.isEmpty()) {
                route(application, 0);
                return;
            }

            Map<String, Object> data = new HashMap<>();
            data.put("category", application.getBeneficiary().getCategory());
            data.put("region", application.getBeneficiary().getRegion());
            data.put("requestedAmount", application.getRequestedAmount());

            int matched = 0;

            for (Map.Entry<String, Object> entry : criteria.entrySet()) {
                String key = entry.getKey();
                Object actual = resolveActualValue(data, key);

                if (actual != null && matches(key, actual, entry.getValue())) {
                    matched++;
                }
            }

            int score = (int) Math.round(
                    matched * 100.0 / criteria.size()
            );

            route(application, score);

        } catch (Exception ignored) {
            // Invalid criteria must never accidentally approve an application.
            route(application, 0);
        }
    }

    private Object resolveActualValue(Map<String, Object> data, String criteriaKey) {
        if (data.containsKey(criteriaKey)) {
            return data.get(criteriaKey);
        }

        // Supports criteria such as minRequestedAmount / maxRequestedAmount.
        if (criteriaKey.startsWith("min") || criteriaKey.startsWith("max")) {
            String baseKey = criteriaKey.substring(3);
            if (!baseKey.isEmpty()) {
                baseKey = Character.toLowerCase(baseKey.charAt(0)) + baseKey.substring(1);
                return data.get(baseKey);
            }
        }

        return null;
    }

    private void route(Application application, int score) {
        application.setEligibilityScore(score);
        application.setEligibilityResult(
                score >= 80 ? "HIGHLY_ELIGIBLE" :
                score >= 60 ? "ELIGIBLE" :
                score >= 40 ? "REQUIRES_REVIEW" :
                        "NOT_ELIGIBLE"
        );

        if (score < 40) {
            setWorkflow(
                    application,
                    ApplicationStatus.REJECTED,
                    "REJECTED",
                    "NONE"
            );
        } else if (score >= 90) {
            // High-score cases are fast-tracked to district review.
            setWorkflow(
                    application,
                    ApplicationStatus.DISTRICT_REVIEW,
                    "DISTRICT_REVIEW",
                    "DISTRICT_OFFICER"
            );
        } else {
            setWorkflow(
                    application,
                    ApplicationStatus.FIELD_VERIFICATION,
                    "FIELD_VERIFICATION",
                    "FIELD_OFFICER"
            );
        }
    }

    private void setWorkflow(
            Application application,
            ApplicationStatus status,
            String currentStage,
            String currentLevel
    ) {
        application.setStatus(status);
        application.setCurrentStage(currentStage);
        application.setCurrentLevel(currentLevel);
    }

    private boolean matches(String key, Object actual, Object expected) {
        Double actualNumber = toDouble(actual);
        Double expectedNumber = toDouble(expected);

        if (actualNumber != null && expectedNumber != null) {
            if (key.startsWith("min")) {
                return actualNumber >= expectedNumber;
            }
            if (key.startsWith("max")) {
                return actualNumber <= expectedNumber;
            }
            return Double.compare(actualNumber, expectedNumber) == 0;
        }

        return String.valueOf(actual)
                .equalsIgnoreCase(String.valueOf(expected));
    }

    private Double toDouble(Object value) {
        try {
            return Double.valueOf(String.valueOf(value));
        } catch (Exception ignored) {
            return null;
        }
    }
}
