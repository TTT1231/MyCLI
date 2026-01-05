# Unlink trw CLI from global
Write-Host "Unlinking trw from global..." -ForegroundColor Green

# Remove from global node_modules
pnpm remove -g trw

# Check if successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Removed from global node_modules" -ForegroundColor Green
}

# Remove executable files from bin directory
$binPath = "$env:LOCALAPPDATA\pnpm"
$trwFiles = @("trw", "trw.CMD", "trw.ps1")

foreach ($file in $trwFiles) {
    $fullPath = "$binPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force -ErrorAction SilentlyContinue
        Write-Host "Removed: $fullPath" -ForegroundColor Green
    }
}

Write-Host "Global unlink complete!" -ForegroundColor Green
