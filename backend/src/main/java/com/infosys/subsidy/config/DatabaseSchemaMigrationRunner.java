package com.infosys.subsidy.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Running sovereign DBT database schema migration checks...");
        alterColumnSafely("verification_workflows", "decision", "VARCHAR(50)");
        alterColumnSafely("verification_workflows", "stage", "VARCHAR(50)");
        alterColumnSafely("verification_workflows", "action", "VARCHAR(100)");
        alterColumnSafely("verification_workflows", "from_stage", "VARCHAR(50)");
        alterColumnSafely("verification_workflows", "to_stage", "VARCHAR(50)");
        alterColumnSafely("grant_applications", "current_stage", "VARCHAR(50)");
        alterColumnSafely("grant_applications", "status", "VARCHAR(50)");
        alterColumnSafely("staged_disbursements", "status", "VARCHAR(50)");
        log.info("Database schema migration checks completed.");
    }

    private void alterColumnSafely(String tableName, String columnName, String columnType) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY COLUMN " + columnName + " " + columnType);
            log.info("Successfully ensured column {}.{} is {}", tableName, columnName, columnType);
        } catch (Exception e) {
            log.warn("Schema migration notice for {}.{}: {}", tableName, columnName, e.getMessage());
        }
    }
}
