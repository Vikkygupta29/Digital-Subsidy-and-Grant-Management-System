package com.subsidy_platform.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "beneficiaries")
public class Beneficiary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false)
    private String region;
}
