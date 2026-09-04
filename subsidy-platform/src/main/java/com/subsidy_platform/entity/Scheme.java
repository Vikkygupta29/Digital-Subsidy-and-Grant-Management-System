package com.subsidy_platform.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "schemes")
public class Scheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private double grantAmount;

    @Column(columnDefinition = "TEXT")
    private String criteriaSchema;
}
