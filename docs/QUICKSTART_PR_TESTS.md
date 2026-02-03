<!-- @format -->

# Quick Start: Fix Auth Tests & Run PR Smoke Tests

## TL;DR - What You Need to Do

1. **Fix 33 failing auth tests** (or they'll fail in PR runs)
2. **Commit workflow file** to enable GitHub Actions
3. **Create PR** to trigger automated smoke tests

## Immediate Action Items

### 1. Debug Why Auth Tests Fail (10 minutes)

Test the endpoints manually to see what's wrong:

```powershell
# Start your backend server
cd "C:\Users\Dhanush\Desktop\Digibot\digibot - Copy\backend"
node server.js

# In another terminal, test the endpoints:

# Test 1: Email check (should return exists: true)
curl -X POST http://localhost:5050/auth/email/check -H "Content-Type: application/json" -d '{\"email\":\"admin1@test.com\"}'
# Expected: {"success":true,"exists":true}
# Getting: {"success":true,"exists":false}  ❌

# Test 2: Login (should return 200)
curl -X POST http://localhost:5050/auth/login -H "Content-Type: application/json" -d '{\"email\":\"admin1@test.com\",\"password\":\"Test@1234\",\"loginType\":\"standard\"}'
# Expected: 200 with user data
# Getting: 404 ❌
```

**Most likely issue:** Test users aren't in the database you're testing against

**Quick fix:**

```powershell
# Make sure you're using the right database
# Check which DB your backend .env points to:
cat "C:\Users\Dhanush\Desktop\Digibot\digibot - Copy\backend\.env" | Select-String "DATABASE_NAME"

# Should be: DATABASE_NAME=community_aid

# Re-seed test users:
cd "C:\Users\Dhanush\Desktop\Digibot\digibot - Copy"
wsl bash -c "mysql -uroot -proot community_aid < sql/seed-test-users.sql"

# Verify users exist:
wsl bash -c "mysql -uroot -proot community_aid -e 'SELECT id, email FROM users WHERE id >= 1000;'"
```

### 2. Commit Workflow File (2 minutes)

```powershell
cd "C:\Users\Dhanush\Desktop\Digibot\digibot - Copy - Copy"
git add .github/workflows/smoke-tests.yml
git add docs/SMOKE_TESTS_GITHUB_SETUP.md
git commit -m "Add smoke tests GitHub Actions workflow"
```

### 3. Run Full Test Suite Locally (15 minutes)

```powershell
cd e2e
npx playwright test tests/smoke/ --grep="comprehensive" --reporter=html
```

Wait for completion, then check `playwright-report/index.html`

### 4. Create PR (2 minutes)

```powershell
git checkout -b feature/smoke-tests-ci
git push origin feature/smoke-tests-ci
```

Then create PR on GitHub - tests will run automatically!

## What Happens in GitHub Actions

When you create PR:

1. **Services Start** (1 min)
   - MySQL 8.0 container spins up
   - Redis 7 container spins up
   - Health checks verify they're ready

2. **Database Init** (1 min)
   - Runs DDL (schema)
   - Runs DML (base data)
   - Runs seed-test-users.sql

3. **Backend Starts** (30 sec)
   - npm installs dependencies
   - Starts server on port 5050
   - Waits for health check

4. **Tests Run** (15-20 min)
   - Playwright installs browsers
   - Runs all comprehensive tests
   - Generates HTML report

5. **Results** (30 sec)
   - Uploads HTML report as artifact
   - Shows summary in PR
   - ✅ or ❌ status check

## Expected Results

**First run:**

- ⚠️ Might have some failures (33 auth tests)
- ✅ Most tests should pass (2,400+)
- 📊 Detailed report in artifacts

**After fixes:**

- ✅ All tests passing
- 🚀 PR checks green
- 🎯 Ready to merge

## If Tests Fail in GitHub Actions

1. **Go to Actions tab** in GitHub repo
2. **Click latest workflow run**
3. **Download artifacts:**
   - `playwright-report` - See which tests failed
   - `server-logs` - Check if backend had issues

4. **Common issues:**
   - Database not initialized → Check "Initialize Database Schema" step
   - Backend won't start → Check "Start Backend Server" step
   - Tests timeout → Increase timeout in workflow

## The Big Picture

### Before (Current State)

- ❌ No automated tests on PRs
- ❌ Manual testing required
- ❌ Bugs slip through to production

### After (With Smoke Tests)

- ✅ Every PR runs 2,474 tests automatically
- ✅ Instant feedback on changes
- ✅ Catch bugs before merge
- ✅ Confidence in deployments

## File Locations

All files are ready:

```
digibot - Copy - Copy/
├── .github/
│   └── workflows/
│       └── smoke-tests.yml          ← Workflow (commit this!)
├── docs/
│   └── SMOKE_TESTS_GITHUB_SETUP.md  ← Full docs (commit this!)
├── sql/
│   ├── ddl.sql                       ← Already exists
│   ├── dml.sql                       ← Already exists
│   └── seed-test-users.sql           ← Already exists
└── e2e/
    └── tests/
        └── smoke/
            └── *_comprehensive.spec.ts  ← 89 test files
```

## Success Metrics

**When you're done:**

- ✅ 290+ tests passing locally
- ✅ Workflow file committed
- ✅ PR created with passing checks
- ✅ HTML report shows results
- ✅ Team can see test status on every PR

## Time Estimate

- Fix auth tests: **15-30 minutes**
- Commit & push: **5 minutes**
- First PR run: **20-25 minutes**
- Total: **~1 hour** to full automation! 🎉

## Need Help?

Check these files:

- Full setup guide: `docs/SMOKE_TESTS_GITHUB_SETUP.md`
- Workflow config: `.github/workflows/smoke-tests.yml`
- Test data: `sql/seed-test-users.sql`

---

**You're 95% done!** Just need to fix those auth tests and commit. 🚀
