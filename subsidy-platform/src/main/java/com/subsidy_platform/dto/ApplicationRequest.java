package com.subsidy_platform.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ApplicationRequest {

    // Required only when an ADMIN creates an application.
    // A BENEFICIARY application uses the logged-in user's email.
    private Long beneficiaryId;

    @NotNull(message = "Scheme ID is required")
    @Positive(message = "Scheme ID must be positive")
    private Long schemeId;

    @Size(max = 500, message = "Purpose must not exceed 500 characters")
    private String purpose;

    @NotNull(message = "Requested amount is required")
    @Positive(message = "Requested amount must be greater than 0")
    private BigDecimal requestedAmount;
}
