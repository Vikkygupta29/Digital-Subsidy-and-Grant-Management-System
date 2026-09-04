package com.subsidy_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {
    private Long id;
    private Long beneficiaryId;
    private String beneficiaryName;
    private Long schemeId;
    private String schemeName;
    private String purpose;
    private BigDecimal requestedAmount;
    private int eligibilityScore;
    private String eligibilityResult;
    private String status;
    private String currentStage;
    private String currentLevel;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
