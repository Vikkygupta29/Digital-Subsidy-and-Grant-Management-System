package com.example.subsidysystem.repository;

import com.example.subsidysystem.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findAllByOrderByTimestampDesc();
    List<AuditLog> findByTargetIdOrderByTimestampDesc(String targetId);
    List<AuditLog> findByActorRole(String actorRole);
}
