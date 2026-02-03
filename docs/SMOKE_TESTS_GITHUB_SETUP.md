<!-- @format -->

# Smoke Tests GitHub Actions Setup - Next Steps

## Current Status ✓

**Local Test Results:**

- 290 tests passed (partial run - interrupted)
- 33 tests failed (auth endpoints - test data issues)
- 2,283 tests not run (interrupted)

**What's Ready:**

1. ✅ 89 comprehensive test files created (2,474 total tests)
2. ✅ GitHub Actions workflow file created (`.github/workflows/smoke-tests.yml`)
3. ✅ Database seed file ready (`sql/seed-test-users.sql`)
4. ✅ Backend server running successfully
5. ✅ MySQL authentication fixed

## Issues to Fix Before PR Run

### 1. Auth Test Failures (33 tests)

**Problem:** Test users in seed file exist but auth tests are failing

**Files affected:**

- `auth_email_check_comprehensive.spec.ts` - 11 failures
- `auth_login_comprehensive.spec.ts` - 7 failures
- `auth_password_reset_comprehensive.spec.ts` - 15 failures

**Root causes:**

- Email check returning `exists: false` for existing emails (admin1@test.com, admin2@test.com)
- Login returning 404 instead of 200/401
- Password reset token validation issues

**Fix required:**

- Verify email check endpoint implementation
- Ensure test users are properly seeded before tests run
- Check if endpoint URLs are correct in tests

### 2. Test Data Seeding Order

**Action needed:**

```bash
# In GitHub Actions, ensure this order:
1. mysql < sql/ddl.sql     # Create schema
2. mysql < sql/dml.sql     # Insert base data
3. mysql < sql/seed-test-users.sql  # Insert test users
```

### 3. Environment Configuration

**Update backend .env for GitHub Actions:**

- Database credentials match Docker service
- Port 5050 for backend
- Base URL: http://localhost:5050

## Next Steps (in order)

### Step 1: Fix Test User Seeding 🔴 HIGH PRIORITY

1. Verify `seed-test-users.sql` is being executed in GitHub Actions
2. Add health check to wait for DB initialization
3. Run tests locally with clean DB to verify

### Step 2: Fix Auth Endpoint Tests 🟡 MEDIUM PRIORITY

Option A: **Fix the tests** (if endpoints work correctly)

- Update test expectations to match actual API behavior
- Fix endpoint URLs if incorrect

Option B: **Fix the endpoints** (if broken)

- Debug why email check returns false for existing users
- Debug why login returns 404

### Step 3: Create PR Checklist

Before pushing to GitHub:

- [ ] All SQL files committed to repo
- [ ] `.github/workflows/smoke-tests.yml` committed
- [ ] Backend `.env.example` file exists for reference
- [ ] Test data passwords documented (Test@1234)
- [ ] README updated with test instructions

### Step 4: Test GitHub Actions Locally (Optional)

Use **act** to test GitHub Actions locally:

```bash
# Install act (GitHub Actions runner)
choco install act-cli

# Run workflow locally
cd "C:\Users\Dhanush\Desktop\Digibot\digibot - Copy - Copy"
act pull_request
```

### Step 5: Push and Create Test PR

```bash
git checkout -b feature/add-smoke-tests
git add .github/workflows/smoke-tests.yml
git add sql/
git add e2e/
git commit -m "Add comprehensive smoke tests for PR runs"
git push origin feature/add-smoke-tests
```

Then create PR on GitHub to trigger smoke tests

### Step 6: Monitor First Run

Watch the Actions tab in GitHub:

1. Check if services (MySQL, Redis) start correctly
2. Verify database initialization completes
3. Check if backend server starts successfully
4. Review test results and artifacts

## GitHub Actions Workflow Features

**What's included:**

- ✅ MySQL 8.0 service with health checks
- ✅ Redis 7 service with health checks
- ✅ Database initialization (DDL + DML + seed)
- ✅ Backend server startup with logs
- ✅ Playwright browser installation
- ✅ HTML test report generation
- ✅ Artifact uploads (reports + logs)
- ✅ Test summary in PR

**Runs on:**

- Pull requests to `main` or `develop`
- Direct pushes to `main` or `develop`

**Timeout:** 30 minutes max

## Quick Fix Commands

### Re-run tests locally with fresh DB:

```powershell
# Reset database
wsl bash -c "mysql -uroot -proot -e 'DROP DATABASE IF EXISTS community_aid; CREATE DATABASE community_aid;'"
wsl bash -c "mysql -uroot -proot community_aid < sql/ddl.sql"
wsl bash -c "mysql -uroot -proot community_aid < sql/dml.sql"
wsl bash -c "mysql -uroot -proot community_aid < sql/seed-test-users.sql"

# Verify test users exist
wsl bash -c "mysql -uroot -proot community_aid -e 'SELECT id, email FROM users WHERE id >= 1000;'"

# Run specific failing tests
cd e2e
npx playwright test tests/smoke/auth_email_check_comprehensive.spec.ts --reporter=list
npx playwright test tests/smoke/auth_login_comprehensive.spec.ts --reporter=list
```

### Debug specific endpoints:

```powershell
# Test email check endpoint directly
curl -X POST http://localhost:5050/auth/email/check `
  -H "Content-Type: application/json" `
  -d '{"email":"admin1@test.com"}'

# Test login endpoint
curl -X POST http://localhost:5050/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin1@test.com","password":"Test@1234","loginType":"standard"}'
```

## Success Criteria

Before creating PR:

- [ ] 95%+ test pass rate locally
- [ ] All auth tests passing
- [ ] Test users properly seeded
- [ ] Backend starts successfully
- [ ] Database initializes correctly

After PR creation:

- [ ] GitHub Actions runs successfully
- [ ] All smoke tests pass in CI
- [ ] HTML report generated and accessible
- [ ] No infrastructure failures

## Resources

**Files to review:**

- `.github/workflows/smoke-tests.yml` - CI workflow
- `sql/seed-test-users.sql` - Test data
- `e2e/tests/smoke/*_comprehensive.spec.ts` - Test files
- `backend/.env` - Local config reference

**Test credentials:**

- Email: admin1@test.com, admin2@test.com, etc.
- Password: Test@1234 (all users)

**Helpful commands:**

```bash
# View workflow logs
gh run view <run-id>

# Download artifacts
gh run download <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed
```

## Recommendations

1. **Start simple:** Fix auth tests first (they're blocking)
2. **Test incrementally:** Run one test file at a time
3. **Use artifacts:** Upload logs for every failure
4. **Monitor closely:** Watch first few PR runs carefully
5. **Document issues:** Create issues for persistent failures

## Contact Points

If tests fail in GitHub Actions:

1. Check "Actions" tab → Latest workflow run
2. Download "playwright-report" artifact
3. Download "server-logs" artifact (if failed)
4. Review Summary tab for quick overview

---

**Created:** ${new Date().toISOString()}
**Status:** Ready for implementation
**Priority:** HIGH - Needed for PR automation
