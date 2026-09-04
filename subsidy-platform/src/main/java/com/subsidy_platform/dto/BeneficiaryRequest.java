package com.subsidy_platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BeneficiaryRequest {
    @NotBlank private String name;
    @NotBlank @Email private String email;
    @NotBlank private String phone;
    @NotBlank private String category;
    @NotBlank private String region;
}
