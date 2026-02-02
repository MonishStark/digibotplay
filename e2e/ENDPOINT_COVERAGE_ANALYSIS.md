<!-- @format -->

# Endpoint Coverage Analysis

## Summary

- **Total Backend Routes**: 91 route definitions
- **Tested Endpoints**: ~98 endpoint/method combinations (some routes have multiple methods)
- **Coverage Status**: Partial - several untested endpoints identified

---

## Backend Routes by File

### 1. user.js (55 routes)

#### ✅ TESTED Endpoints

- `/auth/register` - POST ✅
- `/auth/refresh` - POST ✅
- `/auth/email/check` - POST ✅
- `/auth/payment/status` - GET ✅
- `/auth/verify-account` - POST ✅
- `/me/verification/resend` - POST ✅
- `/me/usage` - GET ✅
- `/auth/login` - POST ✅
- `/auth/verify-otp` - POST ✅
- `/me/profile` - GET/PATCH ✅
- `/auth/password/forgot` - POST ✅
- `/auth/password/reset` - POST ✅
- `/auth/reset-password` - POST ✅
- `/me/password` - PUT ✅
- `/me/password/set` - POST ✅
- `/me/email` - PATCH ✅
- `/me/2fa` - GET/PUT ✅
- `/companies/:companyId/2fa` - PATCH ✅
- `/invitations` - GET/POST ✅
- `/invitations/verify` - POST ✅
- `/companies/:companyId/invitations/:invitationId` - DELETE ✅
- `/companies/:companyId/invitations/:invitationId/resend` - POST ✅
- `/invitation/decline` - POST ✅
- `/admin/users/:userId` - GET/DELETE ✅
- `/admin/get-superAdmin-detail` - GET ✅
- `/admin/users/:userId/verify` - PATCH ✅
- `/admin/users/:userId/2fa` - PUT ✅
- `/admin/users/:userId/password` - PUT ✅
- `/admin/users/:userId/account-status` - PATCH ✅
- `/me/subscription` - GET ✅
- `/user/delete-profile` - DELETE ✅
- `/user/delete-team-profile` - DELETE ✅
- `/auth/invite` - POST ✅
- `/auth/invite/decline/:email/:token` - GET ✅

#### ❌ UNTESTED Endpoints

- `/integrations` - GET ❌ **MISSING**
- `/integrations/:integrationId` - PATCH ❌ **MISSING**
- `/integrations/:integrationId/files` - GET ❌ **MISSING**
- `/integrations/:integrationId/files/:fileId/import` - GET ❌ **MISSING**
- `/super-admin/clients` - GET ❌ **MISSING**
- `/super-admin/companies` - GET ❌ **MISSING**
- `/get/user/users` - GET ❌ **MISSING**
- `/user/create-account-for-super-user` - POST ❌ **MISSING**
- `/super-user-email` - POST ❌ **MISSING**
- `/remove-suoer-user` - DELETE ❌ **MISSING**

#### Commented Out / Deprecated

- `/user/googleDrive/files` - (commented)
- `/user/oneDrive/files` - (commented)
- `/user/dropbox/files` - (commented)
- `/user/wordpress/files` - (commented)
- `/user/slack/files` - (commented)
- `/auth/invited-user` - (commented)
- `/user-role` - (commented)
- `/admin/change-lock-status` - (commented)
- `/admin/blacklist-user` - (commented)

---

### 2. team.js (6 routes)

#### ✅ TESTED Endpoints

- `/teams` - GET/POST ✅
- `/teams/:teamId` - GET ✅
- `/teams/shared` - GET ✅
- `/teams/:teamId/status` - PATCH ✅
- `/teams/active` - GET ✅

**Coverage: 6/6 (100%)** ✅

---

### 3. chat.js (7 routes)

#### ✅ TESTED Endpoints

- `/teams/:teamId/chats` - GET/POST/DELETE ✅
- `/chat/get-histories` - GET ✅
- `/teams/:teamId/chats/:chatId` - GET/DELETE ✅
- `/teams/:teamId/chats/:chatId/messages` - GET/POST ✅

**Coverage: 7/7 (100%)** ✅

---

### 4. document.js (13 routes)

#### ✅ TESTED Endpoints

- `/teams/:teamId/folders` - GET/POST ✅
- `/teams/:teamId/files` - GET ✅
- `/teams/:teamId/files/:fileId` - GET/PATCH/DELETE ✅
- `/companies/:companyId/usage` - GET ✅
- `/companies/:companyId/profile` - PATCH ✅
- `/teams/:teamId/folders/:folderId` - PATCH/DELETE ✅
- `/teams/:teamId/files/:fileId/name` - PATCH ✅
- `/teams/:teamId/folders/:parentId/tree` - GET ✅

**Coverage: 13/13 (100%)** ✅

---

### 5. superAdmin.js (9 routes)

#### ✅ TESTED Endpoints

- `/super-admin/users/:userId/role` - PATCH ✅
- `/super-admin/environment` - GET/POST ✅
- `/super-admin/email/templates` - GET ✅
- `/super-admin/email/templates/:templateId` - PATCH ✅
- `/super-admin/companies/:companyId/usage` - GET ✅
- `/super-admin/users/:userId/usage` - GET ✅
- `/super-admin/companies/:companyId` - DELETE ✅

**Coverage: 9/9 (100%)** ✅

---

### 6. appdata.js (1 route)

#### ✅ TESTED Endpoints

- `/app-data` - GET ✅

**Coverage: 1/1 (100%)** ✅

---

## Missing Test Coverage

### Critical Untested Endpoints (Should be tested)

1. **Cloud Integrations** (4 endpoints)
   - `GET /integrations` - List user's cloud integrations
   - `PATCH /integrations/:integrationId` - Update integration settings
   - `GET /integrations/:integrationId/files` - List files from cloud provider
   - `GET /integrations/:integrationId/files/:fileId/import` - Import file from cloud

2. **Super Admin Features** (6 endpoints)
   - `GET /super-admin/clients` - List all clients
   - `GET /super-admin/companies` - List all companies
   - `GET /get/user/users` - Get user list
   - `POST /user/create-account-for-super-user` - Create super user account
   - `POST /super-user-email` - Super user email operations
   - `DELETE /remove-suoer-user` - Remove super user (typo in route name)

---

## Recommendations

### 1. Add Missing Tests

Create new test files for untested endpoints:

- `e2e/tests/smoke/integrations.spec.ts` - Test cloud integration endpoints
- `e2e/tests/smoke/super_admin_extended.spec.ts` - Test missing super admin endpoints

### 2. Fix Typo in Backend Route

- Route `/remove-suoer-user` should be `/remove-super-user` (typo: "suoer" → "super")

### 3. Document Deprecated Routes

The commented-out routes should either be:

- Removed from codebase if truly deprecated
- Re-enabled and tested if still needed
- Clearly documented as deprecated

### 4. Update TEST_REPORT.md

Current TEST_REPORT.md claims "comprehensive testing" but is missing 10 active endpoints (~11% of total routes). Should be updated with honest coverage assessment.

---

## Coverage Statistics

| Route File    | Total Routes | Tested | Untested | Coverage % |
| ------------- | ------------ | ------ | -------- | ---------- |
| user.js       | 55           | 45     | 10       | 82%        |
| team.js       | 6            | 6      | 0        | 100%       |
| chat.js       | 7            | 7      | 0        | 100%       |
| document.js   | 13           | 13     | 0        | 100%       |
| superAdmin.js | 9            | 9      | 0        | 100%       |
| appdata.js    | 1            | 1      | 0        | 100%       |
| **TOTAL**     | **91**       | **81** | **10**   | **89%**    |

---

## Next Steps

1. ✅ Document complete - this analysis file created
2. ⏳ Create tests for 10 missing endpoints
3. ⏳ Update TEST_REPORT.md with accurate coverage metrics
4. ⏳ Report typo in `/remove-suoer-user` route to backend team
