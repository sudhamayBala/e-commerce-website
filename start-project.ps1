$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "BACKEND"
$frontend = Join-Path $root "FRONTEND\appinterface"
$python = Join-Path $backend "environment\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "Backend environment not found: $python"
}

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backend'; & '$python' -m uvicorn API.home.main:app --host 127.0.0.1 --port 2026"
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontend'; npm run dev -- --host 127.0.0.1"
)

Write-Host "Backend: http://127.0.0.1:2026"
Write-Host "Frontend: http://127.0.0.1:5173"