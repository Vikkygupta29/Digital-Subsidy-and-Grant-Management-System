package com.infosys.subsidy.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scheme_masters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String schemeCode;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    private String category; // Agriculture, Renewable Energy, Education, Women Empowerment
    private Double totalBudget;
    private Double allocatedBudget;
    private Double disbursedBudget;
    private Double maxGrantAmount;

    private Double maxIncomeCriteria;
    private String targetCategories; // SC,ST,OBC,Farmer,Student
    private String targetRegion; // All or Specific Region

    @Column(columnDefinition = "TEXT")
    private String stagedMilestonesJson; // Configured milestone breakdown

    private String requiredDocuments; // Dynamic scheme required docs (e.g. Aadhaar, Land Record, Income Certificate)

    @Column(columnDefinition = "TEXT")
    private String dynamicFieldsJson; // Dynamic custom key-value specifications for the scheme

    @Builder.Default
    private Integer maxReapplyAttempts = 2; // Maximum allowed re-application attempts for this scheme (2 times)

    private boolean active;
}
