package com.infosys.subsidy.repository;

import com.infosys.subsidy.entity.SchemeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface SchemeMasterRepository extends JpaRepository<SchemeMaster, Long> {
    Optional<SchemeMaster> findBySchemeCode(String schemeCode);
    List<SchemeMaster> findByActiveTrue();
    List<SchemeMaster> findByCategory(String category);
}
