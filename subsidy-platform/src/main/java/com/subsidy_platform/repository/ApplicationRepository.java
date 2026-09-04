package com.subsidy_platform.repository;

import com.subsidy_platform.entity.Application;
import com.subsidy_platform.entity.ApplicationStatus;
import com.subsidy_platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByStatus(ApplicationStatus status);

    List<Application> findByStatusAndCurrentLevel(
            ApplicationStatus status,
            String currentLevel
    );

    List<Application> findByCurrentStage(String currentStage);

    List<Application> findByBeneficiaryId(Long beneficiaryId);

    List<Application> findByApplicant(User applicant);
}
