package com.infosys.subsidy.service;

import com.infosys.subsidy.entity.AuditLog;
import com.infosys.subsidy.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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
                .ipAddress(resolveClientIp())
                .build();
        auditLogRepository.save(auditLog);
    }

    private String resolveClientIp() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return "SYSTEM";
        }
        HttpServletRequest request = attributes.getRequest();
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        return realIp != null && !realIp.isBlank() ? realIp : request.getRemoteAddr();
    }
}
