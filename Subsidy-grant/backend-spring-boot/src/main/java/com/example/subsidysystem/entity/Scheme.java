package com.example.subsidysystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schemes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Scheme {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String department;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_budget", nullable = false)
    private BigDecimal totalBudget;

    @Column(name = "allocated_amount")
    private BigDecimal allocatedAmount;

    @Column(name = "disbursed_amount")
    private BigDecimal disbursedAmount;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "grant_amount_min", nullable = false)
    private BigDecimal grantAmountMin;

    @Column(name = "grant_amount_max", nullable = false)
    private BigDecimal grantAmountMax;

    @Column(name = "max_income_limit", nullable = false)
    private BigDecimal maxIncomeLimit;

    @Column(name = "max_land_limit")
    private Double maxLandLimit;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @OneToMany(mappedBy = "scheme", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Application> applications = new ArrayList<>();
}
