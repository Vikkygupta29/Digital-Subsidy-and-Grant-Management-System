package com.example.subsidysystem.repository;

import com.example.subsidysystem.entity.Scheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface SchemeRepository extends JpaRepository<Scheme, String> {
    Optional<Scheme> findByCode(String code);
    List<Scheme> findByStatus(String status);
}
