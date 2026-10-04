package com.infosys.subsidy.repository;

import com.infosys.subsidy.entity.BeneficiaryProfile;
import com.infosys.subsidy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface BeneficiaryProfileRepository extends JpaRepository<BeneficiaryProfile, Long> {
    Optional<BeneficiaryProfile> findByUser(User user);
    Optional<BeneficiaryProfile> findByAadhaarNumber(String aadhaarNumber);
    List<BeneficiaryProfile> findByRegion(String region);
}
