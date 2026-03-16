# APT Attack Intelligence Analysis Platform - QuickStart Script
# For quick project startup and dependency checking

param(
    [switch]$Install,      # Auto-install missing dependencies
    [switch]$SkipCheck,    # Skip dependency check
    [switch]$Help          # Show help information
)

# Set colors
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

# Show help information
if ($Help) {
    Write-Host @"
APT Attack Intelligence Analysis Platform - QuickStart Script

Usage: .\quickstart.ps1 [Options]

Options:
    -Install      Auto-install missing dependencies
    -SkipCheck    Skip dependency check, start services directly
    -Help         Show this help information

Examples:
    .\quickstart.ps1              # Check dependencies and start
    .\quickstart.ps1 -Install     # Install dependencies and start
    .\quickstart.ps1 -SkipCheck   # Start directly without checking
"@ -ForegroundColor $InfoColor
    exit 0
}

# Get project root directory
$ProjectRoot = $PSScriptRoot
$FrontendDir = Join-Path $ProjectRoot "frontend"
$BackendDir = Join-Path $ProjectRoot "backend"

Write-Host "========================================" -ForegroundColor $InfoColor
Write-Host "  APT Attack Intelligence Analysis" -ForegroundColor $InfoColor
Write-Host "  Platform - QuickStart" -ForegroundColor $InfoColor
Write-Host "========================================" -ForegroundColor $InfoColor
Write-Host ""

# Check Node.js installation
function Check-NodeJS {
    Write-Host "[1/4] Checking Node.js environment..." -ForegroundColor $InfoColor
    try {
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        if ($nodeVersion -and $npmVersion) {
            Write-Host "      [OK] Node.js $nodeVersion installed" -ForegroundColor $SuccessColor
            Write-Host "      [OK] npm v$npmVersion installed" -ForegroundColor $SuccessColor
            return $true
        }
    } catch {
        Write-Host "      [Error] Node.js not installed" -ForegroundColor $ErrorColor
        Write-Host "      Please visit https://nodejs.org/ to download and install Node.js 20+" -ForegroundColor $WarningColor
        return $false
    }
}

# Check dependencies
function Check-Dependencies {
    param(
        [string]$Dir,
        [string]$Name
    )
    
    Write-Host "      Checking $Name dependencies..." -ForegroundColor $InfoColor
    $nodeModulesPath = Join-Path $Dir "node_modules"
    $packageJsonPath = Join-Path $Dir "package.json"
    
    if (-not (Test-Path $packageJsonPath)) {
        Write-Host "      [Error] package.json not found" -ForegroundColor $ErrorColor
        return $false
    }
    
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Host "      [Error] node_modules not found" -ForegroundColor $ErrorColor
        return $false
    }
    
    # Read package.json to check key dependencies
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    $dependencies = $packageJson.dependencies
    $devDependencies = $packageJson.devDependencies
    
    $missingDeps = @()
    
    # Check production dependencies
    if ($dependencies) {
        $dependencies.PSObject.Properties | ForEach-Object {
            $depName = $_.Name
            $depPath = Join-Path $nodeModulesPath $depName
            if (-not (Test-Path $depPath)) {
                $missingDeps += $depName
            }
        }
    }
    
    # Check development dependencies
    if ($devDependencies) {
        $devDependencies.PSObject.Properties | ForEach-Object {
            $depName = $_.Name
            $depPath = Join-Path $nodeModulesPath $depName
            if (-not (Test-Path $depPath)) {
                $missingDeps += $depName
            }
        }
    }
    
    if ($missingDeps.Count -eq 0) {
        Write-Host "      [OK] All dependencies installed" -ForegroundColor $SuccessColor
        return $true
    } else {
        Write-Host "      [Warning] Found $($missingDeps.Count) missing dependencies:" -ForegroundColor $WarningColor
        $missingDeps | ForEach-Object {
            Write-Host "        - $_" -ForegroundColor $WarningColor
        }
        return $false
    }
}

# Install dependencies
function Install-Dependencies {
    param(
        [string]$Dir,
        [string]$Name
    )
    
    Write-Host "      Installing $Name dependencies..." -ForegroundColor $InfoColor
    Push-Location $Dir
    try {
        npm install 2>&1 | ForEach-Object {
            if ($_ -match "error|ERR|failed") {
                Write-Host "      $_" -ForegroundColor $ErrorColor
            } else {
                Write-Host "      $_" -ForegroundColor $InfoColor
            }
        }
        Pop-Location
        Write-Host "      [OK] $Name dependencies installed" -ForegroundColor $SuccessColor
        return $true
    } catch {
        Pop-Location
        Write-Host "      [Error] $Name dependencies installation failed: $_" -ForegroundColor $ErrorColor
        return $false
    }
}

# Start service
function Start-Service {
    param(
        [string]$Dir,
        [string]$Name,
        [string]$Command
    )
    
    Write-Host "[4/4] Starting $Name..." -ForegroundColor $InfoColor
    Push-Location $Dir
    try {
        # Use Start-Process to start service in background
        $process = Start-Process -FilePath "npm" -ArgumentList "run", $Command -PassThru -WindowStyle Normal
        Pop-Location
        Write-Host "      [OK] $Name started (PID: $($process.Id))" -ForegroundColor $SuccessColor
        return $process
    } catch {
        Pop-Location
        Write-Host "      [Error] Failed to start $Name" -ForegroundColor $ErrorColor
        return $null
    }
}

# Check if port is in use
function Check-Port {
    param([int]$Port)
    
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        return $true
    }
    return $false
}

# Main process
Write-Host "[0/4] Project path: $ProjectRoot" -ForegroundColor $InfoColor
Write-Host ""

# 1. Check Node.js
if (-not (Check-NodeJS)) {
    Write-Host ""
    Write-Host "Please install Node.js before running this script" -ForegroundColor $ErrorColor
    exit 1
}
Write-Host ""

# 2. Check directory structure
Write-Host "[2/4] Checking project structure..." -ForegroundColor $InfoColor
if (-not (Test-Path $FrontendDir)) {
    Write-Host "      [Error] frontend directory not found" -ForegroundColor $ErrorColor
    exit 1
}
if (-not (Test-Path $BackendDir)) {
    Write-Host "      [Error] backend directory not found" -ForegroundColor $ErrorColor
    exit 1
}
Write-Host "      [OK] Project structure valid" -ForegroundColor $SuccessColor
Write-Host ""

# 3. Check dependencies
if (-not $SkipCheck) {
    Write-Host "[3/4] Checking dependency status..." -ForegroundColor $InfoColor
    
    $frontendOk = Check-Dependencies -Dir $FrontendDir -Name "Frontend"
    $backendOk = Check-Dependencies -Dir $BackendDir -Name "Backend"
    
    if (-not $frontendOk -or -not $backendOk) {
        Write-Host ""
        if ($Install) {
            Write-Host "Missing dependencies detected, installing..." -ForegroundColor $WarningColor
            Write-Host ""
            
            if (-not $frontendOk) {
                Install-Dependencies -Dir $FrontendDir -Name "Frontend"
            }
            if (-not $backendOk) {
                Install-Dependencies -Dir $BackendDir -Name "Backend"
            }
        } else {
            Write-Host "Missing dependencies detected!" -ForegroundColor $ErrorColor
            Write-Host ""
            Write-Host "Please run the following command to install dependencies:" -ForegroundColor $WarningColor
            Write-Host "  .\quickstart.ps1 -Install" -ForegroundColor $InfoColor
            Write-Host ""
            Write-Host "Or install manually:" -ForegroundColor $WarningColor
            Write-Host "  cd frontend && npm install" -ForegroundColor $InfoColor
            Write-Host "  cd backend && npm install" -ForegroundColor $InfoColor
            exit 1
        }
    }
} else {
    Write-Host "[3/4] Skipping dependency check" -ForegroundColor $WarningColor
}
Write-Host ""

# 4. Check port usage
Write-Host "[4/4] Checking port availability..." -ForegroundColor $InfoColor
$frontendPort = 5173
$backendPort = 3001

$frontendPortInUse = Check-Port -Port $frontendPort
$backendPortInUse = Check-Port -Port $backendPort

if ($frontendPortInUse) {
    Write-Host "      [Warning] Port $frontendPort is in use" -ForegroundColor $WarningColor
} else {
    Write-Host "      [OK] Port $frontendPort available" -ForegroundColor $SuccessColor
}

if ($backendPortInUse) {
    Write-Host "      [Warning] Port $backendPort is in use" -ForegroundColor $WarningColor
} else {
    Write-Host "      [OK] Port $backendPort available" -ForegroundColor $SuccessColor
}
Write-Host ""

# 5. Start services
Write-Host "========================================" -ForegroundColor $InfoColor
Write-Host "  Starting services..." -ForegroundColor $InfoColor
Write-Host "========================================" -ForegroundColor $InfoColor
Write-Host ""

# Start backend in new PowerShell window
$backendScript = @"
cd "$BackendDir"
npm run dev
pause
"@

$backendScriptPath = Join-Path $env:TEMP "start-backend.ps1"
$backendScript | Out-File -FilePath $backendScriptPath -Encoding UTF8

try {
    Start-Process powershell -ArgumentList "-NoExit", "-File", "$backendScriptPath" -WindowStyle Normal
    Write-Host "[OK] Backend service started in new window" -ForegroundColor $SuccessColor
    Write-Host "  URL: http://localhost:$backendPort" -ForegroundColor $InfoColor
} catch {
    Write-Host "[Error] Backend service failed to start" -ForegroundColor $ErrorColor
}

Write-Host ""
Start-Sleep -Seconds 2

# Start frontend in new PowerShell window
$frontendScript = @"
cd "$FrontendDir"
npm run dev
pause
"@

$frontendScriptPath = Join-Path $env:TEMP "start-frontend.ps1"
$frontendScript | Out-File -FilePath $frontendScriptPath -Encoding UTF8

try {
    Start-Process powershell -ArgumentList "-NoExit", "-File", "$frontendScriptPath" -WindowStyle Normal
    Write-Host "[OK] Frontend service started in new window" -ForegroundColor $SuccessColor
    Write-Host "  URL: http://localhost:$frontendPort" -ForegroundColor $InfoColor
} catch {
    Write-Host "[Error] Frontend service failed to start" -ForegroundColor $ErrorColor
}

Write-Host ""
Write-Host "========================================" -ForegroundColor $SuccessColor
Write-Host "  All services started!" -ForegroundColor $SuccessColor
Write-Host "========================================" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor $InfoColor
Write-Host "  Frontend: http://localhost:$frontendPort" -ForegroundColor $InfoColor
Write-Host "  Backend: http://localhost:$backendPort" -ForegroundColor $InfoColor
Write-Host ""
Write-Host "Note: Two PowerShell windows are running the services" -ForegroundColor $WarningColor
Write-Host "      Close those windows to stop the services" -ForegroundColor $WarningColor
Write-Host ""

# Wait for user to acknowledge
Write-Host "Press any key to close this window..." -ForegroundColor $InfoColor
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
