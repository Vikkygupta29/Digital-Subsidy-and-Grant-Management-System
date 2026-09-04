package com.subsidy_platform.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "beneficiary_id", nullable = false)
    private Beneficiary beneficiary;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scheme_id", nullable = false)
    private Scheme scheme;

    // Kept for compatibility with applications created by the previous backend.
    @ManyToOne(fetch = FetchType.LAZY)
    private User applicant;

    @Column(columnDefinition = "TEXT")
    private String submittedData;

    @Column(length = 50)
    private String currentStage;

    @Column(length = 500)
    private String purpose;

    @Column(precision = 15, scale = 2)
    private BigDecimal requestedAmount;

    private int eligibilityScore;

    @Column(length = 50)
    private String eligibilityResult;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ApplicationStatus status;

    @Column(length = 50)
    private String currentLevel;

    @Column(length = 1000)
    private String remarks;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
