# Test Runner Script - Run all comprehensive tests one by one
$ErrorActionPreference = 'Continue'
$testDir = "tests/smoke"
$files = Get-ChildItem $testDir -Filter "*comprehensive*.spec.ts" | Sort-Object Name

$results = @()
$totalPassed = 0
$totalFailed = 0
$fileNumber = 1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RUNNING $($files.Count) TEST FILES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($file in $files) {
    Write-Host "[$fileNumber/$($files.Count)] Testing: $($file.Name)" -ForegroundColor Yellow
    
    $output = npx playwright test "tests/smoke/$($file.Name)" --workers=1 --reporter=line 2>&1 | Out-String
    
    # Extract pass/fail counts
    if ($output -match '(\d+)\s+passed') {
        $passed = [int]$Matches[1]
    } else {
        $passed = 0
    }
    
    if ($output -match '(\d+)\s+failed') {
        $failed = [int]$Matches[1]
    } else {
        $failed = 0
    }
    
    $totalPassed += $passed
    $totalFailed += $failed
    
    $status = if ($failed -eq 0) { "✅ PASS" } else { "❌ FAIL" }
    $statusColor = if ($failed -eq 0) { "Green" } else { "Red" }
    
    Write-Host "  Result: $status - $passed passed, $failed failed" -ForegroundColor $statusColor
    
    $results += [PSCustomObject]@{
        File = $file.Name
        Passed = $passed
        Failed = $failed
        Status = $status
    }
    
    # If failed, capture details
    if ($failed -gt 0) {
        Write-Host "  ⚠️  Failures detected in this file!" -ForegroundColor Red
        $output | Select-String -Pattern "Error:|Expected|Received" | Select-Object -First 3 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor Gray
        }
    }
    
    $fileNumber++
    Write-Host ""
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests Passed: $totalPassed" -ForegroundColor Green
Write-Host "Total Tests Failed: $totalFailed" -ForegroundColor Red
Write-Host "Pass Rate: $('{0:P1}' -f ($totalPassed / ($totalPassed + $totalFailed)))" -ForegroundColor Yellow

Write-Host "`n Files with failures:" -ForegroundColor Red
$results | Where-Object { $_.Failed -gt 0 } | ForEach-Object {
    Write-Host "  - $($_.File): $($_.Failed) failures" -ForegroundColor Red
}

Write-Host "`n Exporting results to test-results-summary.csv..." -ForegroundColor Cyan
$results | Export-Csv -Path "test-results-summary.csv" -NoTypeInformation
Write-Host "✅ Done! Results saved to test-results-summary.csv" -ForegroundColor Green
