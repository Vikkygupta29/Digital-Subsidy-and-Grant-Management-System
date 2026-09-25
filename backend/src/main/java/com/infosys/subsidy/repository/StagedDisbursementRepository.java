package com.infosys.subsidy.repository;

import com.infosys.subsidy.entity.StagedDisbursement;
import com.infosys.subsidy.entity.GrantApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StagedDisbursementRepository extends JpaRepository<StagedDisbursement, Long> {
    List<StagedDisbursement> findByApplication(GrantApplication application);
    List<StagedDisbursement> findByStatus(StagedDisbursement.MilestoneStatus status);
}
