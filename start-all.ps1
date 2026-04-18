# =============================================
#  Library Management - Start All Services
# =============================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$services = @(
  @{ name = "auth-service";         port = 4001; tag = "[AUTH]";    script = "start:dev"; color = "#E06C75" },
  @{ name = "catalog-service";      port = 4002; tag = "[CATALOG]"; script = "start:dev"; color = "#98C379" },
  @{ name = "reader-service";       port = 4005; tag = "[READER]";  script = "start:dev"; color = "#E5C07B" },
  @{ name = "loan-service";         port = 4006; tag = "[LOAN]";    script = "start:dev"; color = "#61AFEF" },
  @{ name = "parameter-service";    port = 4007; tag = "[PARAM]";   script = "start:dev"; color = "#C678DD" },
  @{ name = "report-service";       port = 4003; tag = "[REPORT]";  script = "start:dev"; color = "#56B6C2" },
  @{ name = "notification-service"; port = 4004; tag = "[NOTIF]";   script = "start:dev"; color = "#ABB2BF" },
  @{ name = "gateway";              port = 4000; tag = "[GATEWAY]"; script = "start:dev"; color = "#D19A66" },
  @{ name = "frontend";             port = 3000; tag = "[FRONTEND]"; script = "dev";      color = "#61AFEF" }
)

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Library Management - Microservices   " -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Sync .env to services if missing
foreach ($svc in $services) {
  $svcPath = Join-Path $root $svc.name
  $targetEnv = Join-Path $svcPath ".env"
  $rootEnv = Join-Path $root ".env"
  
  if (Test-Path $rootEnv) {
    if (-not (Test-Path $targetEnv)) {
      Write-Host "🔑 Syncing .env to $($svc.name)..." -ForegroundColor Magenta
      Copy-Item $rootEnv $targetEnv
    }
  }
}

# Install dependencies if node_modules missing
foreach ($svc in $services) {
  $svcPath = Join-Path $root $svc.name
  $nodeModules = Join-Path $svcPath "node_modules"
  if (-not (Test-Path $nodeModules)) {
    Write-Host "Installing dependencies for $($svc.name)..." -ForegroundColor Yellow
    Push-Location $svcPath
    npm install --silent
    Pop-Location
  }
}

Write-Host ""
Write-Host "Starting all services..." -ForegroundColor Green
Write-Host ""

# Check if Windows Terminal is available
$useWT = Get-Command wt.exe -ErrorAction SilentlyContinue

if ($useWT) {
    Write-Host "Using Windows Terminal for tabbed interface..." -ForegroundColor Gray
    
    $wtCommandParts = @()
    foreach ($svc in $services) {
        $svcPath = Join-Path $root $svc.name
        $title = "$($svc.tag) $($svc.name)"
        $command = "npm run $($svc.script)"
        
        # Build raw string for each tab to ensure quoting is preserved
        # Subcommand 'nt' (new-tab)
        $tabCmd = "nt -p `"PowerShell`" -d `"$svcPath`" --title `"$title`" --tabColor `"$($svc.color)`" powershell -NoExit -Command `"$command`""
        $wtCommandParts += $tabCmd
    }
    
    $fullWtArgs = $wtCommandParts -join " `; "
    Start-Process wt -ArgumentList $fullWtArgs
} else {
    Write-Host "Windows Terminal not found. Falling back to separate windows..." -ForegroundColor Yellow
    # Start each service in a new terminal window (Fallback)
    foreach ($svc in $services) {
      $svcPath = Join-Path $root $svc.name
      $title = "$($svc.tag) $($svc.name) :$($svc.port)"
      $command = "npm run $($svc.script)"
      
      Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$svcPath'; `$host.ui.RawUI.WindowTitle = '$title'; $command" -WindowStyle Normal
      Write-Host "  Started $($svc.tag) $($svc.name) -> http://localhost:$($svc.port)" -ForegroundColor Green
      Start-Sleep -Milliseconds 500
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  All services initiated!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
