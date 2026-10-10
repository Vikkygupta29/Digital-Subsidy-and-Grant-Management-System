package com.infosys.subsidy.repository;

import com.infosys.subsidy.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("""
            SELECT auditLog
            FROM AuditLog auditLog
            WHERE auditLog.userRole IS NULL OR auditLog.userRole <> 'BENEFICIARY'
            ORDER BY auditLog.timestamp DESC
            """)
    List<AuditLog> findTop100NonBeneficiaryLogs();
    List<AuditLog> findByPerformedByUsernameOrderByTimestampDesc(String username);
}
