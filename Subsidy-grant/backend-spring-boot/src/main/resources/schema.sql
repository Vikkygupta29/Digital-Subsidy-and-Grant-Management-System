-- =============================================================================
-- Digital Subsidy & Grant Administration Platform - MySQL Relational Schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL, -- BENEFICIARY, FIELD_OFFICER, DISTRICT_OFFICER, FINANCE_APPROVER, ADMIN
    district VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beneficiary_profiles (
    user_id VARCHAR(50) PRIMARY KEY,
    aadhaar_hash VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- SMALL_FARMER, MARGINAL_FARMER, RURAL_ARTISAN, WOMEN_ENTREPRENEUR, SC_ST_GENERAL
    annual_income DECIMAL(15, 2) NOT NULL,
    land_holding_acres DECIMAL(8, 2) DEFAULT 0.0,
    bank_account_number VARCHAR(30) NOT NULL,
    bank_ifsc VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    pan_number VARCHAR(20),
    age INT NOT NULL,
    gender VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schemes (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    description TEXT,
    total_budget DECIMAL(15, 2) NOT NULL,
    allocated_amount DECIMAL(15, 2) DEFAULT 0.0,
    disbursed_amount DECIMAL(15, 2) DEFAULT 0.0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    grant_amount_min DECIMAL(15, 2) NOT NULL,
    grant_amount_max DECIMAL(15, 2) NOT NULL,
    max_income_limit DECIMAL(15, 2) NOT NULL,
    max_land_limit DECIMAL(8, 2) DEFAULT 5.0,
    min_age INT DEFAULT 18,
    max_age INT DEFAULT 75,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_budgets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scheme_id VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    allocated_amount DECIMAL(15, 2) NOT NULL,
    spent_amount DECIMAL(15, 2) DEFAULT 0.0,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE CASCADE,
    UNIQUE KEY uq_scheme_district (scheme_id, district)
);

CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(50) PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL UNIQUE,
    scheme_id VARCHAR(50) NOT NULL,
    beneficiary_id VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    requested_amount DECIMAL(15, 2) NOT NULL,
    sanctioned_amount DECIMAL(15, 2),
    sanction_order_number VARCHAR(50),
    current_status VARCHAR(50) NOT NULL, -- SUBMITTED, UNDER_FIELD_VERIFICATION, UNDER_DISTRICT_REVIEW, DISTRICT_APPROVED, ESCALATED_SCRUTINY, FINANCE_APPROVED, SANCTIONED, DISBURSEMENT_IN_PROGRESS, COMPLETED, REJECTED
    current_stage VARCHAR(30) NOT NULL,  -- FIELD_VERIFICATION, DISTRICT_REVIEW, FINANCE_APPROVAL, DISBURSEMENT, CLOSED
    eligibility_score INT NOT NULL,
    priority_band VARCHAR(30) NOT NULL,  -- FAST_TRACK, STANDARD, SCRUTINY_FLAGGED
    is_high_value BOOLEAN DEFAULT FALSE,
    assigned_field_officer_id VARCHAR(50),
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    rejection_reason TEXT,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id),
    FOREIGN KEY (beneficiary_id) REFERENCES users(id),
    FOREIGN KEY (assigned_field_officer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS verification_records (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL,
    stage VARCHAR(30) NOT NULL,
    officer_id VARCHAR(50) NOT NULL,
    officer_role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL, -- RECOMMENDED, APPROVED, REJECTED, RE_VERIFICATION_REQUESTED, ESCALATED
    decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT NOT NULL,
    geo_coordinates VARCHAR(100),
    findings_json JSON,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS disbursement_milestones (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL,
    milestone_number INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL, -- SCHEDULED, PENDING_VERIFICATION, VERIFIED, DISBURSED, OVERDUE, NON_COMPLIANT
    proof_document_path VARCHAR(255),
    proof_submitted_date TIMESTAMP NULL,
    verified_by_id VARCHAR(50) NULL,
    verification_date TIMESTAMP NULL,
    disbursed_date TIMESTAMP NULL,
    transaction_ref VARCHAR(100),
    utr_number VARCHAR(100),
    remarks TEXT,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor_id VARCHAR(50) NOT NULL,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    previous_state VARCHAR(50),
    new_state VARCHAR(50),
    remarks TEXT,
    ip_address VARCHAR(45)
);

-- Indices for performance
CREATE INDEX idx_app_status ON applications(current_status);
CREATE INDEX idx_app_district ON applications(district);
CREATE INDEX idx_milestone_status ON disbursement_milestones(status);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
