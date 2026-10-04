package com.infosys.subsidy.controller;

import com.infosys.subsidy.entity.SchemeMaster;
import com.infosys.subsidy.repository.SchemeMasterRepository;
import com.infosys.subsidy.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schemes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SchemeController {

    private final SchemeMasterRepository schemeMasterRepository;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<List<SchemeMaster>> getAllSchemes() {
        return ResponseEntity.ok(schemeMasterRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSchemeById(@PathVariable Long id) {
        return schemeMasterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createOrUpdateScheme(@RequestBody SchemeMaster scheme) {
        if (scheme.getAllocatedBudget() == null) scheme.setAllocatedBudget(0.0);
        if (scheme.getDisbursedBudget() == null) scheme.setDisbursedBudget(0.0);
        scheme.setActive(true);

        SchemeMaster saved = schemeMasterRepository.save(scheme);

        auditService.logAction(
                "SCHEME_CONFIGURED",
                "ADMIN",
                "ADMIN",
                "SchemeMaster",
                saved.getId().toString(),
                "Configured scheme: " + saved.getName() + " [Budget: $" + saved.getTotalBudget() + "]"
        );

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateScheme(@PathVariable Long id, @RequestBody SchemeMaster schemeDetails) {
        return schemeMasterRepository.findById(id).map(existing -> {
            existing.setSchemeCode(schemeDetails.getSchemeCode());
            existing.setName(schemeDetails.getName());
            existing.setDescription(schemeDetails.getDescription());
            existing.setCategory(schemeDetails.getCategory());
            existing.setTotalBudget(schemeDetails.getTotalBudget());
            existing.setMaxGrantAmount(schemeDetails.getMaxGrantAmount());
            existing.setMaxIncomeCriteria(schemeDetails.getMaxIncomeCriteria());
            existing.setTargetCategories(schemeDetails.getTargetCategories());
            existing.setTargetRegion(schemeDetails.getTargetRegion());
            existing.setRequiredDocuments(schemeDetails.getRequiredDocuments());
            existing.setDynamicFieldsJson(schemeDetails.getDynamicFieldsJson());

            SchemeMaster updated = schemeMasterRepository.save(existing);

            auditService.logAction(
                    "SCHEME_UPDATED",
                    "ADMIN",
                    "ADMIN",
                    "SchemeMaster",
                    updated.getId().toString(),
                    "Updated scheme: " + updated.getName()
            );

            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteScheme(@PathVariable Long id) {
        return schemeMasterRepository.findById(id).map(existing -> {
            schemeMasterRepository.delete(existing);

            auditService.logAction(
                    "SCHEME_DELETED",
                    "ADMIN",
                    "ADMIN",
                    "SchemeMaster",
                    id.toString(),
                    "Deleted scheme: " + existing.getName()
            );

            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
