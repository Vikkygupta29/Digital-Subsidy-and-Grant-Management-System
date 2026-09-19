package com.example.subsidysystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationRecord {

    @Id
    @Column(length = 50)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(nullable = false, length = 30)
    private String stage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "officer_id", nullable = false)
    private User officer;

    @Column(name = "officer_role", nullable = false, length = 30)
    private String officerRole;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "decision_date")
    private LocalDateTime decisionDate;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "geo_coordinates", length = 100)
    private String geoCoordinates;

    @Column(name = "findings_json", columnDefinition = "TEXT")
    private String findingsJson;
}
