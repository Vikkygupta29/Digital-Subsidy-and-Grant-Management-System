package com.example.subsidysystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "beneficiary_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeneficiaryProfile {

    @Id
    @Column(name = "user_id", length = 50)
    private String userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "aadhaar_hash", nullable = false)
    private String aadhaarHash;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "annual_income", nullable = false)
    private BigDecimal annualIncome;

    @Column(name = "land_holding_acres")
    private Double landHoldingAcres;

    @Column(name = "bank_account_number", nullable = false)
    private String bankAccountNumber;

    @Column(name = "bank_ifsc", nullable = false)
    private String bankIfsc;

    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @Column(name = "pan_number")
    private String panNumber;

    @Column(nullable = false)
    private Integer age;

    @Column(length = 10)
    private String gender;
}
