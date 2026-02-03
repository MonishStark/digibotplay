-- @format
-- Seed test users for Playwright E2E tests
-- Password for all users: Test@1234
-- Password hash: $2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK
-- This file should be executed after ddl.sql and dml.sql

-- Clean up existing test data (if re-running)
DELETE FROM user_company_role_relationship WHERE userId >= 1000 AND userId <= 1004;
DELETE FROM teams WHERE id >= 200 AND id <= 202;
DELETE FROM companies WHERE id >= 100 AND id <= 101;
DELETE FROM users WHERE id >= 1000 AND id <= 1004;

-- Insert test users FIRST (before companies due to foreign key constraint)
-- Schema: id, firstname, lastname, email, mobileNumber, password, accountStatus, createdAt, updatedAt
INSERT INTO users (id, email, password, firstname, lastname, mobileNumber, accountStatus, createdAt, updatedAt) VALUES
(1000, 'admin1@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'Admin', 'One', '1234567890', 1, NOW(), NOW()),
(1001, 'admin2@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'Admin', 'Two', '1234567891', 1, NOW(), NOW()),
(1002, 'superadmin@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'Super', 'Admin', '1234567892', 1, NOW(), NOW()),
(1003, 'user1@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'User', 'One', '1234567893', 1, NOW(), NOW()),
(1004, 'user2@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'User', 'Two', '1234567894', 1, NOW(), NOW());

-- Insert test companies (after users due to adminId foreign key)
INSERT INTO companies (id, adminId, company_name, company_phone, company_type, createdAt, updatedAt) VALUES
(100, 1000, 'Test Company A', '1234567890', 'Technology', NOW(), NOW()),
(101, 1004, 'Test Company B', '0987654321', 'Finance', NOW(), NOW());

-- Link users to companies with roles via user_company_role_relationship
-- role values from roles table: 1=Administrator, 2=Standard, 3=View Only, 4=System Administrator
-- Schema: id (auto), userId, company (company ID), role, createdAt, updatedAt
INSERT INTO user_company_role_relationship (userId, company, role, createdAt, updatedAt) VALUES
(1000, 100, 1, NOW(), NOW()),  -- admin1 is Administrator of Company A
(1001, 100, 1, NOW(), NOW()),  -- admin2 is Administrator of Company A
(1002, 100, 4, NOW(), NOW()),  -- superadmin is System Administrator of Company A
(1002, 101, 4, NOW(), NOW()),  -- superadmin is System Administrator of Company B (cross-company access)
(1003, 100, 2, NOW(), NOW()),  -- user1 is Standard user of Company A
(1004, 101, 1, NOW(), NOW());  -- user2 is Administrator of Company B

-- Insert test teams
-- Schema: id, companyId, creatorId, teamName, teamAlias, active, uuid, createdAt, updatedAt
INSERT INTO teams (id, companyId, creatorId, teamName, teamAlias, active, uuid, createdAt, updatedAt) VALUES
(200, 100, 1000, 'Team Alpha', 'alpha-team', 1, UUID(), NOW(), NOW()),
(201, 100, 1001, 'Team Beta', 'beta-team', 1, UUID(), NOW(), NOW()),
(202, 101, 1004, 'Team Gamma', 'gamma-team', 1, UUID(), NOW(), NOW());

-- Insert company metadata (optional - for subscription types)
INSERT INTO companies_meta (companyId, metaKey, metaValue) VALUES
(100, 'subscription_type', 'team'),
(100, 'max_users', '50'),
(101, 'subscription_type', 'solo'),
(101, 'max_users', '10');

-- Insert super admin settings (required for app initialization)
INSERT INTO `super-admin-settings` (meta_key, meta_value, createdAt) VALUES
('app_name', 'Digibot Test', NOW()),
('max_upload_size', '10', NOW()),
('recording_limit', '300', NOW()),
('recording_prompt_time', '10', NOW()),
('MAX_STORAGE', '100', NOW()),
('MAX_FILE_UPLOADS', '50', NOW()),
('USER_RECORDING_PROMPT', '10', NOW()),
('RECORDING_MONTHLY_LIMIT', '300', NOW()),
('MAX_TEAMS', '10', NOW()),
('MAX_QUERY', '1000', NOW()),
('MAX_USERS', '100', NOW()),
('FILE_UPLOAD_EXPIRY', '30', NOW()),
('LOG_LEVEL', 'info', NOW());

-- Note: roles table is already populated with:
-- 1 = Administrator
-- 2 = Standard
-- 3 = View Only
-- 4 = System Administrator

-- Note: subscription-packages table is already populated with:
-- solo and team packages

-- Summary of test users:
-- admin1@test.com     - Administrator of Test Company A (Password: Test@1234)
-- admin2@test.com     - Administrator of Test Company A (Password: Test@1234)
-- superadmin@test.com - System Administrator (access to both companies) (Password: Test@1234)
-- user1@test.com      - Standard user of Test Company A (Password: Test@1234)
-- user2@test.com      - Administrator of Test Company B (Password: Test@1234)
