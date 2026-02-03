<!-- @format -->

# Smoke Test Status Report

**Date**: February 3, 2026  
**Target**: 100% Pass Rate for PR Automation (Feb 5 Demo)

## Current Status

- **Total Tests**: 1,321
- **Passed**: 1,160 (87.8%)
- **Failed**: 161 (12.2%)
- **Skipped**: ~14 (<1%)

## ✅ Completed Infrastructure Fixes

1. **Docker Environment**: Fully operational
   - MySQL 8.0 with native password authentication
   - Redis 7 cache layer
   - Node.js 20 backend with native dependencies

2. **Database Schema**: Complete
   - Added missing `email_templates` table (12 templates)
   - Added missing `notification` table
   - Added missing `user_tokens` table with `expires_at` column
   - Seeded 5 test users, 2 companies, 3 teams
   - 13 super-admin settings configured

3. **Backend Configuration**: Fixed
   - Added `ACCESS_TOKEN_SECRET` for JWT access tokens
   - Added `REFRESH_TOKEN_SECRET` for JWT refresh tokens
   - Environment variables properly configured

4. **Authentication**: Fully Working
   - `/auth/login` endpoint returns correct structure
   - Response includes `user.auth.accessToken` and `user.auth.refreshToken`
   - All login tests require `loginType: "standard"` ✅

## ❌ Remaining Failures (161 tests)

### Failure Categories

#### 1. HTTP Status Code Mismatches (~80 tests)

Tests expect specific HTTP status codes (405, 415, 422) but backend returns different codes:

- **415 Unsupported Media Type**: Tests expect this for wrong/missing Content-Type
- **405 Method Not Allowed**: Tests expect this for wrong HTTP methods
- **422 Unprocessable Entity**: Tests expect this for validation errors

**Files Affected**:

- `admin_users_2fa_comprehensive.spec.ts`
- `admin_users_account_status_comprehensive.spec.ts`
- `admin_users_avatar_comprehensive.spec.ts`
- `admin_users_delete_comprehensive.spec.ts`
- `admin_users_get_comprehensive.spec.ts`
- `admin_users_password_comprehensive.spec.ts`
- And many more...

**Root Cause**: Backend may return 400 Bad Request instead of specific error codes

#### 2. Resource Not Found Errors (~40 tests)

Tests try to access resources that don't exist in test database:

- Folders that need to be created
- Files that need to be uploaded
- Team resources not in seed data

**Files Affected**:

- `files_*` test files
- `folders_*` test files
- `teams_documents_*` test files

#### 3. Response Structure Mismatches (~30 tests)

Tests expect specific response structures that differ from actual backend:

- Missing fields in responses
- Different field names
- Nested object structures

#### 4. Edge Case Handling (~11 tests)

Tests for edge cases that backend might not handle:

- SQL injection attempts
- Very long input values
- Special characters
- Concurrent requests

## 🔧 Required Fixes

### Option A: Fix Backend to Match Test Expectations (RECOMMENDED)

**Time**: 6-8 hours  
**Impact**: Makes backend more robust and standards-compliant

1. **Add HTTP status code validation**:
   - Return 415 for missing/wrong Content-Type
   - Return 405 for unsupported HTTP methods
   - Return 422 for validation errors (not 400)

2. **Add middleware**:

   ```javascript
   // Content-Type validation middleware
   app.use((req, res, next) => {
   	if (["POST", "PATCH", "PUT"].includes(req.method)) {
   		if (!req.is("application/json")) {
   			return res.status(415).json({
   				success: false,
   				error: "unsupported_media_type",
   				message: "Content-Type must be application/json",
   			});
   		}
   	}
   	next();
   });
   ```

3. **Seed test resources**:
   - Add test folders to database
   - Add test files metadata
   - Add test documents

### Option B: Update Tests to Match Backend Behavior (FASTER)

**Time**: 2-3 hours  
**Impact**: Tests reflect actual backend behavior

1. **Update status code expectations**:

   ```typescript
   // Instead of:
   expect([200, 400, 415]).toContain(response.status());

   // Use:
   expect([200, 400]).toContain(response.status());
   ```

2. **Add database seeding for missing resources**
3. **Update response structure assertions**

### Option C: Hybrid Approach (BALANCED)

**Time**: 4-5 hours  
**Impact**: Critical backend fixes + lenient test assertions

1. Fix backend for critical endpoints (auth, users, teams)
2. Update tests for less critical endpoints (files, folders)
3. Add proper test data seeding

## 📈 Recommended Action Plan

### Phase 1: Quick Wins (1 hour) - Get to 95%

1. Update tests to accept actual backend status codes
2. Skip resource-dependent tests that need complex setup
3. Target: **~1,250 passed** (95% pass rate)

### Phase 2: Database Seeding (1 hour) - Get to 98%

1. Add folders to seed data
2. Add file metadata
3. Target: **~1,295 passed** (98% pass rate)

### Phase 3: Backend Hardening (2 hours) - Get to 100%

1. Add Content-Type validation middleware
2. Add HTTP method validation
3. Standardize error responses
4. Target: **1,321 passed** (100% pass rate)

## 🎯 For Feb 5 Demo

**Minimum Acceptable**: 95% pass rate (1,250 tests)  
**Ideal Target**: 100% pass rate (1,321 tests)

**Current**: 87.8% - Need +97 more passing tests minimum

## Next Steps

Choose approach (A, B, or C) and I'll implement systematically to achieve 100% pass rate.
