# ============================================
# QUICK FRONTEND CHECK
# Fast validation without full build
# ============================================

Write-Host ""
Write-Host "🔍 QUICK FRONTEND CHECK" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$hasErrors = $false

# 1. TypeScript Check
Write-Host "📝 Checking TypeScript..." -ForegroundColor Yellow
$tscResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ No TypeScript errors" -ForegroundColor Green
} else {
    Write-Host "   ✗ TypeScript errors found:" -ForegroundColor Red
    $tscResult | Select-Object -First 20 | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    $hasErrors = $true
}
Write-Host ""

# 2. ESLint Check
Write-Host "🔧 Checking ESLint..." -ForegroundColor Yellow
$lintResult = npm run lint 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ No linting errors" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Linting issues found:" -ForegroundColor Yellow
    $lintResult | Select-Object -First 15 | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
}
Write-Host ""

# 3. Check for common issues
Write-Host "🔎 Checking common issues..." -ForegroundColor Yellow

# Check for console.log
$consoleLogs = Get-ChildItem -Path "src" -Recurse -Filter "*.tsx","*.ts" | 
    Select-String -Pattern "console\.(log|error|warn)" | 
    Select-Object -First 5

if ($consoleLogs) {
    Write-Host "   ⚠ Found console statements (should be removed in production):" -ForegroundColor Yellow
    $consoleLogs | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "   ✓ No console statements found" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
if ($hasErrors) {
    Write-Host "❌ Issues found - Please fix errors above" -ForegroundColor Red
} else {
    Write-Host "✅ Quick check passed!" -ForegroundColor Green
}
Write-Host ""
