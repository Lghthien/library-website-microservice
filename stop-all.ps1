# =============================================
#  Library Management - Stop All Services
# =============================================

$ports = @(3000, 4000, 4001, 4002, 4003, 4004, 4005, 4006, 4007)

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Stopping All Library Services...    " -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($process) {
        Write-Host "Stopping service on port $port (PID: $process)..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Successfully stopped all services!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
