# ============================================
# AUTOMATED TESTING RUNNER
# Library Management System
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AUTOMATED TESTING SUITE" -ForegroundColor Cyan
Write-Host "  Library Management System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Playwright đã cài chưa
Write-Host "[1/5] Checking Playwright installation..." -ForegroundColor Yellow

if (!(Test-Path "node_modules\@playwright")) {
    Write-Host "  ⚠ Playwright not found. Installing..." -ForegroundColor Yellow
    npm install
    npx playwright install
}
else {
    Write-Host "  ✓ Playwright installed" -ForegroundColor Green
}
Write-Host ""

# Kiểm tra servers đang chạy
Write-Host "[2/5] Checking if servers are running..." -ForegroundColor Yellow

$frontendRunning = $false
$backendRunning = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $frontendRunning = $true
    Write-Host "  ✓ Frontend is running on port 3000" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Frontend is NOT running!" -ForegroundColor Red
    Write-Host "  Please run: npm run dev" -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $backendRunning = $true
    Write-Host "  ✓ Backend is running on port 3001" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠ Backend might not be running" -ForegroundColor Yellow
}

if (!$frontendRunning) {
    Write-Host ""
    Write-Host "ERROR: Frontend must be running to execute tests!" -ForegroundColor Red
    Write-Host "Please run 'npm run dev' in another terminal first." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Xóa kết quả cũ
Write-Host "[3/5] Cleaning old test results..." -ForegroundColor Yellow
if (Test-Path "test-results") {
    Remove-Item -Recurse -Force "test-results" -ErrorAction SilentlyContinue
    Write-Host "  ✓ Old results cleaned" -ForegroundColor Green
}
else {
    Write-Host "  ✓ No old results to clean" -ForegroundColor Green
}
Write-Host ""

# Chạy tests
Write-Host "[4/5] Running automated tests..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

$testStartTime = Get-Date

# Chạy Playwright tests
npx playwright test --reporter=html, list

$testEndTime = Get-Date
$testDuration = ($testEndTime - $testStartTime).TotalSeconds

Write-Host ""

# Phân tích kết quả
Write-Host "[5/5] Analyzing results..." -ForegroundColor Yellow

$resultsFile = "test-results/results.json"
if (Test-Path $resultsFile) {
    $results = Get-Content $resultsFile | ConvertFrom-Json
    
    $totalTests = 0
    $passedTests = 0
    $failedTests = 0
    $skippedTests = 0
    
    foreach ($suite in $results.suites) {
        foreach ($spec in $suite.suites) {
            foreach ($test in $spec.specs) {
                $totalTests++
                
                foreach ($result in $test.tests) {
                    foreach ($run in $result.results) {
                        if ($run.status -eq "passed") {
                            $passedTests++
                        }
                        elseif ($run.status -eq "failed") {
                            $failedTests++
                        }
                        elseif ($run.status -eq "skipped") {
                            $skippedTests++
                        }
                    }
                }
            }
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Total Tests:    $totalTests" -ForegroundColor White
    Write-Host "Passed:         $passedTests" -ForegroundColor Green
    if ($failedTests -gt 0) {
        Write-Host "Failed:         $failedTests" -ForegroundColor Red
    }
    if ($skippedTests -gt 0) {
        Write-Host "Skipped:        $skippedTests" -ForegroundColor Yellow
    }
    Write-Host ""
    
    $passRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
    Write-Host "Pass Rate:      $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 50) { "Yellow" } else { "Red" })
    Write-Host "Duration:       $([math]::Round($testDuration, 2)) seconds" -ForegroundColor White
    Write-Host ""
    
}
else {
    Write-Host "  ⚠ Could not find results.json" -ForegroundColor Yellow
    Write-Host ""
}

# Hiển thị thông tin báo cáo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VIEW DETAILED REPORT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$reportPath = "test-results\html-report\index.html"
if (Test-Path $reportPath) {
    Write-Host "HTML Report: $reportPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Opening report in browser..." -ForegroundColor Yellow
    Start-Process $reportPath
}
else {
    Write-Host "⚠ HTML report not found" -ForegroundColor Yellow
}

# Hiển thị screenshots nếu có
$screenshotsPath = "test-results"
if (Test-Path $screenshotsPath) {
    $screenshots = Get-ChildItem -Path $screenshotsPath -Filter "*.png" -Recurse
    if ($screenshots.Count -gt 0) {
        Write-Host ""
        Write-Host "Screenshots captured: $($screenshots.Count)" -ForegroundColor Yellow
        Write-Host "Location: $screenshotsPath" -ForegroundColor Gray
    }
}

Write-Host ""

# Final verdict
if ($failedTests -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  Application is ready!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "  Please check the HTML report" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}
