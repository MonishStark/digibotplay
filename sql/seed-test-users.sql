-- @format
-- Seed test users for Playwright E2E tests
-- Password for all users: Test@1234
-- Password hash: $2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK
-- This file should be executed after ddl.sql and dml.sql

-- Clean up existing test data (if re-running)
DELETE FROM user_company_role_relationship WHERE userId >= 1000 AND userId <= 1004;
DELETE FROM teams WHERE id >= 200 AND id <= 202;
DELETE FROM users WHERE id >= 1000 AND id <= 1004;
DELETE FROM companies WHERE id >= 100 AND id <= 101;

-- Insert test companies
-- Note: adminId references the user IDs we create below
INSERT INTO companies (id, adminId, company_name, company_phone_country_code, company_phone, company_type, created, updated) VALUES
(100, 1000, 'Test Company A', '+1', '1234567890', 'Technology', NOW(), NOW()),
(101, 1004, 'Test Company B', '+1', '0987654321', 'Finance', NOW(), NOW());

-- Insert test users
-- Schema: id, email, password, firstName, lastName, role, phone, verified, active, created, updated
-- Note: role field in users table can be NULL - actual company roles are in user_company_role_relationship
INSERT INTO users (id, email, password, firstName, lastName, role, phone, verified, active, created, updated) VALUES
(1000, 'admin1@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'Admin', 'One', NULL, '1234567890', 1, 1, NOW(), NOW()),
(1001, 'admin2@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'Admin', 'Two', NULL, '1234567891', 1, 1, NOW(), NOW()),
(1002, 'superadmin@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'Super', 'Admin', NULL, '1234567892', 1, 1, NOW(), NOW()),
(1003, 'user1@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'User', 'One', NULL, '1234567893', 1, 1, NOW(), NOW()),
(1004, 'user2@test.com', '$2b$10$I1N2PXH5VkQUxiInYI22de97fBpwblSxbFLLdcVz0lxlHJNw.6zmK', 'User', 'Two', NULL, '1234567894', 1, 1, NOW(), NOW());

-- Link users to companies with roles via user_company_role_relationship
-- role values from roles table: 1=Administrator, 2=Standard, 3=View Only, 4=System Administrator
-- Schema: id (auto), userId, company (company ID), role, created, updated
INSERT INTO user_company_role_relationship (userId, company, role, created, updated) VALUES
(1000, 100, 1, NOW(), NOW()),  -- admin1 is Administrator of Company A
(1001, 100, 1, NOW(), NOW()),  -- admin2 is Administrator of Company A
(1002, 100, 4, NOW(), NOW()),  -- superadmin is System Administrator of Company A
(1002, 101, 4, NOW(), NOW()),  -- superadmin is System Administrator of Company B (cross-company access)
(1003, 100, 2, NOW(), NOW()),  -- user1 is Standard user of Company A
(1004, 101, 1, NOW(), NOW());  -- user2 is Administrator of Company B

-- Insert test teams
-- Schema: id, companyId, creatorId, teamName, teamAlias, active, uuid, created, updated
INSERT INTO teams (id, companyId, creatorId, teamName, teamAlias, active, uuid, created, updated) VALUES
(200, 100, 1000, 'Team Alpha', 'alpha-team', 1, UUID(), NOW(), NOW()),
(201, 100, 1001, 'Team Beta', 'beta-team', 1, UUID(), NOW(), NOW()),
(202, 101, 1004, 'Team Gamma', 'gamma-team', 1, UUID(), NOW(), NOW());

-- Insert company metadata (optional - for subscription types)
INSERT INTO companies_meta (companyId, metaKey, metaValue, created, updated) VALUES
(100, 'subscription_type', 'team', NOW(), NOW()),
(100, 'max_users', '50', NOW(), NOW()),
(101, 'subscription_type', 'solo', NOW(), NOW()),
(101, 'max_users', '10', NOW(), NOW());

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
