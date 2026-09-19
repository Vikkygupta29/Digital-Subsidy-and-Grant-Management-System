package com.example.subsidysystem.repository;

import com.example.subsidysystem.entity.DisbursementMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MilestoneRepository extends JpaRepository<DisbursementMilestone, String> {
    List<DisbursementMilestone> findByApplicationId(String applicationId);
    List<DisbursementMilestone> findByStatus(String status);
    List<DisbursementMilestone> findByStatusAndDueDateBefore(String status, LocalDateTime date);
}
