package com.infosys.subsidy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "beneficiary_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeneficiaryProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, unique = true)
    private String aadhaarNumber;

    private String panNumber;
    private String fullName;
    private String category; // SC, ST, OBC, General, BPL, Farmer, Student
    private Double annualIncome;
    private Double landSizeAcres;
    private String region;
    private String address;

    private String documentType; // Dynamic document type e.g. "Aadhaar Card", "PAN Card", "Land Record", "Income Certificate"
    private String identityDocumentUrl; // Cloudinary URL

    @Enumerated(EnumType.STRING)
    private Status verificationStatus;

    private LocalDateTime registeredAt;

    public enum Status {
        PENDING,
        VERIFIED,
        REJECTED
    }
}
