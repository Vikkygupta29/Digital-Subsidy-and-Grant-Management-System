package com.example.subsidysystem.repository;

import com.example.subsidysystem.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, String> {
    Optional<Application> findByApplicationNumber(String applicationNumber);
    List<Application> findByBeneficiaryId(String beneficiaryId);
    List<Application> findByDistrict(String district);
    List<Application> findByCurrentStatus(String currentStatus);
    List<Application> findBySchemeId(String schemeId);
    List<Application> findByAssignedFieldOfficerId(String officerId);
}
