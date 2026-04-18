Write-Host ""
Write-Host "🤖 Installing Playwright for Automated Testing..." -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Installing Playwright package..." -ForegroundColor Yellow
npm install --save-dev @playwright/test@latest

Write-Host ""
Write-Host "[2/2] Installing browsers (Chrome, Firefox, WebKit)..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
npx playwright install

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run tests with:" -ForegroundColor White
Write-Host "  .\run-tests.ps1" -ForegroundColor Cyan
Write-Host ""
