package com.infosys.subsidy.controller;

import java.util.Map;
import com.infosys.subsidy.config.DatabaseSchemaMigrationRunner;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final DatabaseSchemaMigrationRunner schemaMigrationRunner;

    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "message", "Backend is successfully running"
        ));
    }

    @PostMapping("/schema-migrate")
    public ResponseEntity<Map<String, String>> triggerSchemaMigration() {
        schemaMigrationRunner.run();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Database schema migration executed successfully."
        ));
    }
}
