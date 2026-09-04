package com.subsidy_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String category;
    private String region;
}
