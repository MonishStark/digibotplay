<!-- @format -->

# 🚀 DigiBot CI/CD Setup Guide

## 📋 What We've Created

You now have a complete GitHub Actions CI/CD pipeline that will:

- ✅ Run on every Pull Request to `main` or `develop` branches
- ✅ Spin up MySQL + Redis + Backend in Docker containers
- ✅ Auto-seed test database with test users
- ✅ Run all 87 comprehensive smoke test suites (~2,606 tests)
- ✅ Generate HTML test report
- ✅ Upload report to Google Drive
- ✅ Comment on PR with test results
- ✅ Send email notification

---

## 📁 Files Created

```
├── .github/
│   └── workflows/
│       └── pr-tests.yml              # GitHub Actions workflow
├── backend/
│   └── Dockerfile.ci                 # Docker image for backend
├── scripts/
│   └── uploadToDrive.js              # Google Drive upload script
├── sql/
│   └── seed-test-users.sql           # Test user data
└── docker-compose.ci.yml             # Docker services definition
```

---

## 🔧 Step-by-Step Setup Instructions

### STEP 1: Add Health Endpoint to Backend

You need to add a health check endpoint to `backend/server.js`. Add this code near the top of your routes:

```javascript
// Health check endpoint for CI/CD
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
```

**Where to add it**: After your middleware setup, before your other routes.

---

### STEP 2: Update Test User Passwords

The seed file has placeholder password hashes. You need to generate real bcrypt hashes.

**Run this in Node.js** (in backend folder):

```javascript
const bcrypt = require("bcrypt");
const password = "Test@1234";
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

**Then update** `sql/seed-test-users.sql` and replace all the password hashes with the real one you generated.

---

### STEP 3: Set Up GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

#### Database & BigQuery Secrets:

```
GOOGLE_PROJECT_ID=your-project-id
BIGQUERY_DATASET_ID=your-dataset-id
BIGQUERY_TABLE=your-table-name
BIGQUERY_CONNECTION_ID=your-connection-id
BIGQUERY_AI_MODEL_ID=your-model-id
BIGQUERY_MAX_OUTPUT_TOKEN=8192
BIGQUERY_LOCATION=us-central1
UUID_NAMESPACE=your-uuid-namespace
```

#### Google Drive Secrets (for uploading reports):

```
GDRIVE_CLIENT_ID=your-google-oauth-client-id
GDRIVE_CLIENT_SECRET=your-google-oauth-client-secret
GDRIVE_REFRESH_TOKEN=your-google-refresh-token
```

#### Email Notification Secrets:

```
REPORT_FROM_MAIL=your-email@domain.com
REPORT_FROM_PASSWORD=your-email-password
REPORT_TO_MAILS=recipient1@domain.com,recipient2@domain.com
```

---

### STEP 4: Get Google Drive OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Drive API**
4. Go to **APIs & Services** → **Credentials**
5. Create **OAuth 2.0 Client ID**
   - Application type: **Desktop app**
   - Download credentials JSON
6. Use [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) to get refresh token:
   - Click gear icon → Use your own OAuth credentials
   - Paste Client ID and Client Secret
   - Authorize API: `https://www.googleapis.com/auth/drive.file`
   - Exchange authorization code for tokens
   - Copy the **Refresh Token**

---

### STEP 5: Verify Test Data Schema

Check if your database schema has these tables (from `sql/seed-test-users.sql`):

- ✅ `users`
- ✅ `companies`
- ✅ `users_meta`
- ✅ `teams`
- ✅ `team_users`
- ✅ `app_data`

If table names are different, update `sql/seed-test-users.sql` accordingly.

---

### STEP 6: Test Locally with Docker (Optional but Recommended)

Before pushing to GitHub, test locally:

```bash
# 1. Make sure Docker Desktop is running

# 2. Start services
docker-compose -f docker-compose.ci.yml up -d

# 3. Check if services are healthy
docker ps

# 4. Check backend logs
docker logs digibot-backend-ci

# 5. Test health endpoint
curl http://localhost:5050/health

# 6. Run tests from e2e folder
cd e2e
npx playwright test tests/smoke/ --workers=1

# 7. Stop services
cd ..
docker-compose -f docker-compose.ci.yml down -v
```

---

### STEP 7: Push to GitHub and Create PR

```bash
git add .
git commit -m "feat: Add CI/CD pipeline for smoke tests"
git push origin your-branch
```

Then create a Pull Request on GitHub → main/develop branch.

---

## 🎯 What Happens on PR?

1. **GitHub Actions triggers** when PR is opened/updated
2. **Docker containers start**: MySQL, Redis, Backend
3. **Database setup**: Runs ddl.sql → dml.sql → seed-test-users.sql
4. **Backend starts** on port 5050
5. **Tests run**: All 87 smoke test suites (~10 minutes)
6. **Report generates**: HTML report with test results
7. **Upload to Drive**: Zips and uploads report
8. **PR comment**: Posts summary with link to full report
9. **Email sent**: Notification to configured emails
10. **Cleanup**: Stops and removes all Docker containers

---

## 📊 Expected Results

When everything works correctly, you'll see:

✅ **PR Comment** like:

```
🎉 DigiBot Smoke Test Results 🎉
Status: ✅ PASSED
Pass Rate: 82.7%

📊 Test Summary
✅ Passed: 2,156
❌ Failed: 299 (placeholder tests)
⏭️ Skipped: 132
📝 Total: 2,587

📂 Test Report
https://drive.google.com/file/d/xxxxx/view
```

✅ **Email** with test results and Drive link

✅ **Downloadable report artifact** in GitHub Actions

---

## 🐛 Troubleshooting

### If backend fails to start:

- Check logs: `docker logs digibot-backend-ci`
- Verify health endpoint exists in server.js
- Check if all npm dependencies installed

### If database connection fails:

- Verify MySQL is healthy: `docker ps`
- Check database credentials in docker-compose.ci.yml
- Verify tables exist: `docker exec digibot-mysql-ci mysql -u test_user -ptest_password team_ai -e "SHOW TABLES;"`

### If tests fail:

- Check if test users were seeded: `docker exec digibot-mysql-ci mysql -u test_user -ptest_password team_ai -e "SELECT * FROM users;"`
- Verify backend is accessible: `curl http://localhost:5050/health`
- Check test output in GitHub Actions logs

### If Drive upload fails:

- Verify all Google Drive secrets are set correctly
- Check OAuth refresh token is valid
- Ensure Drive API is enabled in Google Cloud Console

---

## 📝 Notes

- **Test Users**:
  - admin1@test.com / Test@1234
  - admin2@test.com / Test@1234
  - superadmin@test.com / Test@1234
- **Placeholder Tests**: 431 tests are intentionally marked as placeholders (they're TODOs for future implementation)

- **Sequential Execution**: Tests run with `--workers=1` for stability

- **Docker Cleanup**: All containers and volumes are removed after tests complete

---

## 🎉 Next Steps

1. Complete Step 1-7 above
2. Create a test PR to verify everything works
3. Monitor GitHub Actions run
4. Check PR comment for results
5. Download report from Google Drive
6. Celebrate! 🎊

---

**Need Help?** Check the GitHub Actions logs for detailed error messages and stack traces.
