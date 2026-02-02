$smokeDir = "c:\Users\Dhanush\Desktop\Digibot\digibot - Copy - Copy\e2e\tests\smoke"

$filesToUpdate = @(
    "companies_profile.spec.ts",
    "companies_avatar.spec.ts",
    "companies_profile_patch.spec.ts",
    "files_upload.spec.ts",
    "files_fileId.spec.ts",
    "me_profile.spec.ts",
    "me_usage.spec.ts",
    "me_subscription.spec.ts",
    "chat_messages_post.spec.ts",
    "notifications_get.spec.ts",
    "notifications_viewed_patch.spec.ts",
    "notification_id_delete.spec.ts",
    "settings_max_uploads_get.spec.ts",
    "settings_recording_prompt_time_get.spec.ts",
    "file_summary.spec.ts",
    "put_files.spec.ts",
    "settings_audio.spec.ts"
)

foreach ($file in $filesToUpdate) {
    $path = Join-Path $smokeDir $file
    if (-not (Test-Path $path)) {
        Write-Host "Skipping $file (not found)"
        continue
    }
    
    Write-Host "Processing $file..."
    $content = Get-Content $path -Raw
    
    # Add imports if not present
    if ($content -notmatch "import.*testData") {
        $content = $content -replace '(import \{ test, expect \} from "@playwright/test";)', "`$1`nimport { testData } from '../testData';`nimport { getAdmin1Token, getAdmin2Token, getSuperAdminToken } from '../authHelper';"
    }
    
    # Replace DB.users references
    $content = $content -replace 'DB\.users\[0\]\.teamId', 'testData.teams.team1.id'
    $content = $content -replace 'DB\.users\[1\]\.teamId', 'testData.teams.team2.id'
    $content = $content -replace 'DB\.users\[0\]\.companyId', 'testData.companies.company1.id'
    $content = $content -replace 'DB\.users\[1\]\.companyId', 'testData.companies.company2.id'
    $content = $content -replace 'DB\.users\[0\]\.id', 'testData.users.admin1.id'
    $content = $content -replace 'DB\.users\[1\]\.id', 'testData.users.admin2.id'
    $content = $content -replace 'DB\.users\[0\]\.email', 'testData.users.admin1.email'
    $content = $content -replace 'DB\.users\[1\]\.email', 'testData.users.admin2.email'
    $content = $content -replace 'DB\.users\[0\]', 'testData.users.admin1'
    $content = $content -replace 'DB\.users\[1\]', 'testData.users.admin2'
    $content = $content -replace 'DB\.users\[userIndex\]\.email', 'user.email'
    $content = $content -replace 'DB\.users\[userIndex\]\.password', 'user.password'
    
    # Replace login functions - handle different patterns
    $loginPattern1 = '(?s)async function loginAndGetToken\(request: any, userIndex = 0\) \{.*?return body\.user\?\.auth\?\.accessToken \|\| body\.token\?\.accessToken;[\r\n\s]*\}'
    $loginReplacement1 = 'async function loginAndGetToken(request: any, userIndex = 0) { return userIndex === 0 ? await getAdmin1Token() : await getAdmin2Token(); }'
    $content = $content -replace $loginPattern1, $loginReplacement1
    
    $loginPattern2 = '(?s)async function loginAndGetToken\(request: any, userIndex = 1\) \{.*?return body\.user\?\.auth\?\.accessToken \|\| body\.token\?\.accessToken;[\r\n\s]*\}'
    $loginReplacement2 = 'async function loginAndGetToken(request: any, userIndex = 1) { return userIndex === 0 ? await getAdmin1Token() : await getAdmin2Token(); }'
    $content = $content -replace $loginPattern2, $loginReplacement2
    
    $loginPattern3 = '(?s)async function loginAndGetToken\(request: any\) \{.*?return body\.user\?\.auth\?\.accessToken \|\| body\.token\?\.accessToken;[\r\n\s]*\}'
    $loginReplacement3 = 'async function loginAndGetToken(request: any) { return await getAdmin1Token(); }'
    $content = $content -replace $loginPattern3, $loginReplacement3
    
    # Remove DB const declarations
    $content = $content -replace '(?s)// Keep fixtures.*?const DB = \{.*?\];[\r\n\s]*\};[\r\n]+', ''
    $content = $content -replace '(?s)const DB = \{.*?\];[\r\n\s]*\};[\r\n]+', ''
    
    Set-Content $path -Value $content -NoNewline
    Write-Host "Updated $file"
}

Write-Host "Done updating smoke test files."
