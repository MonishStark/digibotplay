$smokeDir = "c:\Users\Dhanush\Desktop\Digibot\digibot - Copy - Copy\e2e\tests\smoke"

$superAdminFiles = @(
    "super_admin_company_profile_patch.spec.ts",
    "super_admin_company_avatar_put.spec.ts",
    "super_admin_clients_get.spec.ts",
    "super_admin_email_templates_get.spec.ts",
    "super_admin_email_templates_templateId_patch.spec.ts",
    "super_admin_users_userId_delete.spec.ts"
)

foreach ($file in $superAdminFiles) {
    $path = Join-Path $smokeDir $file
    if (-not (Test-Path $path)) {
        Write-Host "Skipping $file (not found)"
        continue
    }
    
    Write-Host "Processing $file..."
    $content = Get-Content $path -Raw
    
    # Add imports if not present
    if ($content -notmatch "import.*testData") {
        $content = $content -replace '(import \{ test, expect \} from "@playwright/test";)', "`$1`nimport { testData } from '../testData';`nimport { getSuperAdminToken } from '../authHelper';"
    }
    
    # Replace SUPER_ADMIN references
    $content = $content -replace 'SUPER_ADMIN\.companyId', 'testData.companies.company1.id'
    $content = $content -replace 'SUPER_ADMIN\.email', 'testData.users.superAdmin.email'
    $content = $content -replace 'SUPER_ADMIN\.password', 'testData.users.superAdmin.password'
    
    # Replace login function
    $loginPattern = '(?s)async function loginAndGetToken\(request: any\) \{.*?const res = await request\.post.*?expect\(res\.status.*?const body = await res\.json\(\);[\r\n\s]*return body\.user\?\.auth\?\.accessToken \|\| body\.token\?\.accessToken;[\r\n\s]*\}'
    $loginReplacement = 'async function loginAndGetToken(request: any) { return await getSuperAdminToken(); }'
    $content = $content -replace $loginPattern, $loginReplacement
    
    # Remove SUPER_ADMIN const
    $content = $content -replace '(?s)const SUPER_ADMIN = \{.*?\};[\r\n]+', ''
    
    Set-Content $path -Value $content -NoNewline
    Write-Host "Updated $file"
}

Write-Host "Done updating super admin test files."
