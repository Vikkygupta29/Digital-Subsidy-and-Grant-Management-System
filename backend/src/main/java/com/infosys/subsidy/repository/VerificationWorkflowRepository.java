package com.infosys.subsidy.repository;

import com.infosys.subsidy.entity.VerificationWorkflow;
import com.infosys.subsidy.entity.GrantApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VerificationWorkflowRepository extends JpaRepository<VerificationWorkflow, Long> {
    List<VerificationWorkflow> findByApplication(GrantApplication application);
    List<VerificationWorkflow> findByApplicationOrderByIdAsc(GrantApplication application);
    List<VerificationWorkflow> findByApplicationOrderByActionTimestampAsc(GrantApplication application);
}
