package com.infosys.subsidy.repository;

import com.infosys.subsidy.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop100ByOrderByTimestampDesc();
    List<AuditLog> findByPerformedByUsernameOrderByTimestampDesc(String username);
}
