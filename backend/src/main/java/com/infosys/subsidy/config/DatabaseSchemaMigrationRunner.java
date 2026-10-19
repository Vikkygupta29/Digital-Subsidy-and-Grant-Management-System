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
        alterColumnSafely("grant_applications", "scheme_document_url", "LONGTEXT");
        alterColumnSafely("grant_applications", "re_verification_document_url", "LONGTEXT");
        alterColumnSafely("grant_applications", "dynamic_field_answers_json", "LONGTEXT");
        alterColumnSafely("grant_applications", "score_breakdown_json", "LONGTEXT");
        alterColumnSafely("grant_applications", "rejection_reason", "TEXT");
        alterColumnSafely("grant_applications", "last_reapply_reason", "TEXT");
        alterColumnSafely("grant_applications", "re_verification_appeal_grounds", "TEXT");
        alterColumnSafely("grant_applications", "re_verification_disposal_notes", "TEXT");
        alterColumnSafely("grant_applications", "remarks", "TEXT");
        alterColumnSafely("beneficiary_profiles", "identity_document_url", "LONGTEXT");
        alterColumnSafely("beneficiary_profiles", "aadhaar_number", "VARCHAR(100) NULL");

        // Add demographic, bank, and location columns to beneficiary_profiles
        addColumnSafely("beneficiary_profiles", "dob", "VARCHAR(50)");
        addColumnSafely("beneficiary_profiles", "gender", "VARCHAR(50)");
        addColumnSafely("beneficiary_profiles", "mobile_number", "VARCHAR(50)");
        addColumnSafely("beneficiary_profiles", "bank_name", "VARCHAR(100)");
        addColumnSafely("beneficiary_profiles", "bank_account_number", "VARCHAR(100)");
        addColumnSafely("beneficiary_profiles", "ifsc_code", "VARCHAR(50)");
        addColumnSafely("beneficiary_profiles", "state", "VARCHAR(100)");
        addColumnSafely("beneficiary_profiles", "district", "VARCHAR(100)");
        addColumnSafely("beneficiary_profiles", "block", "VARCHAR(100)");

        // Clean up legacy dummy addresses in database
        try {
            jdbcTemplate.execute("UPDATE beneficiary_profiles SET address = NULL WHERE address = 'Registered Citizen Address'");
        } catch (Exception ignored) {}

        alterColumnSafely("schemes", "dynamic_fields_json", "LONGTEXT");
        alterColumnSafely("schemes", "staged_milestones_json", "LONGTEXT");
        alterColumnSafely("schemes", "required_documents", "TEXT");
        alterColumnSafely("staged_disbursements", "status", "VARCHAR(50)");
        alterColumnSafely("staged_disbursements", "compliance_proof_url", "LONGTEXT");
        alterColumnSafely("staged_disbursements", "proof_remarks", "TEXT");
        alterColumnSafely("staged_disbursements", "rejection_reason", "TEXT");
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

    private void addColumnSafely(String tableName, String columnName, String columnType) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnType);
            log.info("Successfully added column {}.{} as {}", tableName, columnName, columnType);
        } catch (Exception e) {
            // Column may already exist - safe to ignore
        }
    }
}
