package com.infosys.subsidy.service;

import com.infosys.subsidy.entity.AuditLog;
import com.infosys.subsidy.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void logAction(String action, String performedBy, String userRole, String entityType, String entityId, String details) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .performedByUsername(performedBy != null ? performedBy : "SYSTEM")
                .userRole(userRole != null ? userRole : "SYSTEM")
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .timestamp(LocalDateTime.now())
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(auditLog);
    }
}
