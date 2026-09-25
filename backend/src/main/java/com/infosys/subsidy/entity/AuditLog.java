package com.infosys.subsidy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;
    private String performedByUsername;
    private String userRole;
    private String entityType;
    private String entityId;

    @Column(length = 1000)
    private String details;

    private LocalDateTime timestamp;
    private String ipAddress;
}
