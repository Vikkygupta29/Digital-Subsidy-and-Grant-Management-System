package com.subsidy_platform.repository;

import com.subsidy_platform.entity.Beneficiary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Beneficiary> findByEmailIgnoreCase(String email);
}
