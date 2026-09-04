package com.subsidy_platform.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SchemeRequest {
    @NotBlank(message = "Name is required") private String name;
    @NotNull @Min(1000) private Double grantAmount;
    @NotBlank private String criteriaSchema;
}
