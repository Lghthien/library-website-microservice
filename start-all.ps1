# =============================================
#  Library Management - Start All Services
# =============================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$services = @(
  @{ name = "auth-service";         port = 4001; emoji = "🔐" },
  @{ name = "catalog-service";      port = 4002; emoji = "📚" },
  @{ name = "reader-service";       port = 4005; emoji = "👤" },
  @{ name = "loan-service";         port = 4006; emoji = "🔄" },
  @{ name = "parameter-service";    port = 4007; emoji = "⚙️" },
  @{ name = "report-service";       port = 4003; emoji = "📊" },
  @{ name = "notification-service"; port = 4004; emoji = "🔔" },
  @{ name = "gateway";              port = 4000; emoji = "🌐" }
)

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Library Management - Microservices   " -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Install dependencies if node_modules missing
foreach ($svc in $services) {
  $svcPath = Join-Path $root $svc.name
  $nodeModules = Join-Path $svcPath "node_modules"
  if (-not (Test-Path $nodeModules)) {
    Write-Host "📦 Installing deps for $($svc.name)..." -ForegroundColor Yellow
    Push-Location $svcPath
    npm install --silent
    Pop-Location
  }
}

Write-Host ""
Write-Host "🚀 Starting all services..." -ForegroundColor Green
Write-Host ""

# Start each service in a new terminal window
foreach ($svc in $services) {
  $svcPath = Join-Path $root $svc.name
  $title = "$($svc.emoji) $($svc.name) :$($svc.port)"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$svcPath'; `$host.ui.RawUI.WindowTitle = '$title'; npm run start:dev" -WindowStyle Normal
  Write-Host "  Started $($svc.emoji) $($svc.name) → http://localhost:$($svc.port)" -ForegroundColor Green
  Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  All services started!" -ForegroundColor Cyan
Write-Host ""
Write-Host "  API Gateway:           http://localhost:4000" -ForegroundColor White
Write-Host "  Auth Service:          http://localhost:4001" -ForegroundColor Gray
Write-Host "  Catalog Service:       http://localhost:4002" -ForegroundColor Gray
Write-Host "  Reader Service:        http://localhost:4005" -ForegroundColor Gray
Write-Host "  Loan Service:          http://localhost:4006" -ForegroundColor Gray
Write-Host "  Parameter Service:     http://localhost:4007" -ForegroundColor Gray
Write-Host "  Report Service:        http://localhost:4003" -ForegroundColor Gray
Write-Host "  Notification Service:  http://localhost:4004" -ForegroundColor Gray
Write-Host "=======================================" -ForegroundColor Cyan
