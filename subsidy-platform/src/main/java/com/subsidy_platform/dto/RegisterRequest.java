package com.subsidy_platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;

    // Kept for compatibility with the existing frontend.
    // The backend always creates a BENEFICIARY account through public registration.
    private String role;
}
