# Systematic Test Fixer - Run one file at a time, capture errors, report failures
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SYSTEMATIC TEST FIXER" -ForegroundColor Cyan
Write-Host "  Running files one-by-one" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get all test files
$testFiles = Get-ChildItem "tests/smoke/*_comprehensive.spec.ts" | Select-Object -ExpandProperty Name | Sort-Object

$totalFiles = $testFiles.Count
$filesWithFailures = @()
$allFailures = @()
$fileNumber = 0

foreach ($file in $testFiles) {
    $fileNumber++
    Write-Host "[$fileNumber/$totalFiles] Testing: $file" -ForegroundColor Yellow
    
    # Run the test and capture output
    $output = npx playwright test "tests/smoke/$file" --workers=1 --reporter=list 2>&1 | Out-String
    
    # Check if there are failures
    if ($output -match '(\d+) failed') {
        $failCount = [int]$Matches[1]
        Write-Host "  ❌ FAILURES: $failCount" -ForegroundColor Red
        
        # Extract failure details
        $failureLines = $output -split "`n" | Where-Object { $_ -match '^\s+\d+\)' }
        
        foreach ($failLine in $failureLines) {
            $failureObj = @{
                File = $file
                FailureLine = $failLine
            }
            $allFailures += $failureObj
            Write-Host "    $failLine" -ForegroundColor DarkRed
        }
        
        $filesWithFailures += @{
            File = $file
            FailCount = $failCount
        }
        
        Write-Host ""
    } else {
        # Check pass count
        if ($output -match '(\d+) passed') {
            $passCount = [int]$Matches[1]
            Write-Host "  ✅ ALL PASSED: $passCount tests" -ForegroundColor Green
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($filesWithFailures.Count -eq 0) {
    Write-Host "🎉 ALL FILES PASSED! NO FAILURES!" -ForegroundColor Green
} else {
    Write-Host "Files with failures: $($filesWithFailures.Count)" -ForegroundColor Red
    Write-Host ""
    
    foreach ($fileInfo in $filesWithFailures) {
        Write-Host "  ❌ $($fileInfo.File): $($fileInfo.FailCount) failures" -ForegroundColor Red
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  DETAILED FAILURES" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    # Export to file for analysis
    $allFailures | ConvertTo-Json -Depth 10 | Out-File "test-failures-detailed.json"
    Write-Host "Detailed failures exported to: test-failures-detailed.json" -ForegroundColor Yellow
}
