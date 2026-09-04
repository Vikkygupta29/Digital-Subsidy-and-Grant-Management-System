package com.subsidy_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchemeResponse {
    private Long id;
    private String name;
    private double grantAmount;
    private String criteriaSchema;
}
