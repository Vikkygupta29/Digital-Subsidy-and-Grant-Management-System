package com.subsidy_platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerificationRequest {
    @NotBlank
    private String decision; // APPROVE, REJECT, REVERIFY
    private String remarks;
}
