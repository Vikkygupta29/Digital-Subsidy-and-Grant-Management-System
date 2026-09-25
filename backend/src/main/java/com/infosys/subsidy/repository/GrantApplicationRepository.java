package com.infosys.subsidy.repository;

import com.infosys.subsidy.entity.GrantApplication;
import com.infosys.subsidy.entity.BeneficiaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import java.util.Optional;

public interface GrantApplicationRepository extends JpaRepository<GrantApplication, Long> {
    Optional<GrantApplication> findByApplicationNo(String applicationNo);
    List<GrantApplication> findByBeneficiary(BeneficiaryProfile beneficiary);
    List<GrantApplication> findByCurrentStage(GrantApplication.ApplicationStage currentStage);
    List<GrantApplication> findByEscalatedTrue();
    List<GrantApplication> findByFastTrackedTrue();
}
