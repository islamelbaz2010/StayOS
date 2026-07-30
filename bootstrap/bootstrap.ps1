#Requires -Version 5.1
<#
.SYNOPSIS
    StayOS Developer Workstation Bootstrap — Windows PowerShell

.DESCRIPTION
    Installs and verifies all required development tools for StayOS on Windows.
    Idempotent: safe to run multiple times. Never reinstalls existing software.

.PARAMETER DryRun
    Preview what would be installed without making changes.

.PARAMETER SkipProject
    Skip npm install and pip install at the end.

.EXAMPLE
    .\bootstrap\bootstrap.ps1
    .\bootstrap\bootstrap.ps1 -DryRun
    .\bootstrap\bootstrap.ps1 -SkipProject

.NOTES
    Run from PowerShell as Administrator for best results.
    Required: Windows 10/11, PowerShell 5.1+
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$SkipProject
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$BootstrapVersion = "1.0.0"
$StartTime = Get-Date

# ─── Minimum Versions ─────────────────────────────────────────────────────────
$MinVersions = @{
    Node       = [Version]"20.0.0"
    Python     = [Version]"3.11.0"
    Pnpm       = [Version]"8.0.0"
    Docker     = [Version]"24.0.0"
    Terraform  = [Version]"1.5.0"
    AwsCli     = [Version]"2.0.0"
    Gh         = [Version]"2.0.0"
    Git        = [Version]"2.30.0"
}

# ─── Result Tracking ──────────────────────────────────────────────────────────
$Results = @{
    Installed = [System.Collections.Generic.List[string]]::new()
    Skipped   = [System.Collections.Generic.List[string]]::new()
    Updated   = [System.Collections.Generic.List[string]]::new()
    Errors    = [System.Collections.Generic.List[string]]::new()
    Warnings  = [System.Collections.Generic.List[string]]::new()
}

# ─── Paths ────────────────────────────────────────────────────────────────────
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot   = Split-Path -Parent $ScriptDir
$ReportFile = Join-Path $RepoRoot "BOOTSTRAP_REPORT.md"

# ─── Console Utilities ────────────────────────────────────────────────────────
function Write-Step   { param($msg) Write-Host "`n━━━  $msg" -ForegroundColor Cyan }
function Write-Pass   { param($msg) Write-Host "  [✓ OK]    $msg" -ForegroundColor Green }
function Write-Skip   { param($msg) Write-Host "  [SKIP]    $msg" -ForegroundColor DarkGray; $Results.Skipped.Add($msg) }
function Write-Warn   { param($msg) Write-Host "  [WARN]    $msg" -ForegroundColor Yellow; $Results.Warnings.Add($msg) }
function Write-Err    { param($msg) Write-Host "  [ERROR]   $msg" -ForegroundColor Red; $Results.Errors.Add($msg) }
function Write-Info   { param($msg) Write-Host "  [INFO]    $msg" -ForegroundColor Blue }
function Write-Install{ param($msg) Write-Host "  [INST]    $msg" -ForegroundColor Magenta }

function Write-Banner {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║      StayOS Developer Bootstrap v$BootstrapVersion (Windows) ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    if ($DryRun) {
        Write-Host "[DRY RUN] No software will be installed." -ForegroundColor Yellow
        Write-Host ""
    }
}

# ─── Version Parsing ──────────────────────────────────────────────────────────
function Get-ToolVersion {
    param([string]$Command, [string]$Args = "--version")
    try {
        $output = & $Command $Args.Split(' ') 2>&1 | Out-String
        if ($output -match '(\d+\.\d+[\.\d]*)') { return [Version]$Matches[1] }
    } catch {}
    return $null
}

function Test-VersionMeets {
    param([Version]$Current, [Version]$Minimum)
    return ($null -ne $Current) -and ($Current -ge $Minimum)
}

# ─── winget Utilities ─────────────────────────────────────────────────────────
function Install-Winget {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Warn "winget not found. Install App Installer from the Microsoft Store."
        Write-Warn "URL: https://apps.microsoft.com/detail/9NBLGGH4NNS1"
        $Results.Errors.Add("winget: not installed — install App Installer from Microsoft Store")
        return $false
    }
    return $true
}

function Install-WithWinget {
    param([string]$Id, [string]$Name)
    if ($DryRun) { Write-Info "[dry-run] Would install: winget install $Id"; return }
    Write-Install "Installing $Name via winget..."
    try {
        winget install --id $Id --accept-package-agreements --accept-source-agreements --silent 2>&1 | Out-Null
        Write-Pass "$Name installed"
        $Results.Installed.Add($Name)
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + `
                    [System.Environment]::GetEnvironmentVariable("PATH","User")
    } catch {
        Write-Err "Failed to install $Name via winget: $_"
    }
}

# ─── Pre-flight Checks ────────────────────────────────────────────────────────
function Test-Prerequisites {
    Write-Step "Pre-flight Checks"

    # OS Check
    $osInfo = Get-CimInstance Win32_OperatingSystem
    Write-Info "OS: $($osInfo.Caption) (Build $($osInfo.BuildNumber))"
    Write-Info "Architecture: $($env:PROCESSOR_ARCHITECTURE)"

    if ([int]$osInfo.BuildNumber -lt 19041) {
        Write-Err "Windows 10 2004 (Build 19041) or higher required."
        throw "Unsupported Windows version"
    }
    Write-Pass "Windows version supported"

    # Admin check
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if ($isAdmin) {
        Write-Pass "Running as Administrator"
    } else {
        Write-Warn "Not running as Administrator — some installations may fail"
        Write-Warn "Re-run PowerShell as Administrator for best results"
        $Results.Warnings.Add("permissions: not running as Administrator")
    }

    # Execution policy
    $policy = Get-ExecutionPolicy
    if ($policy -in @('Restricted', 'AllSigned')) {
        Write-Warn "Execution policy is '$policy' — may block installations"
        Write-Warn "Fix: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser"
        $Results.Warnings.Add("execution-policy: $policy may block script execution")
    } else {
        Write-Pass "Execution policy: $policy"
    }

    # Internet check
    try {
        $null = Invoke-WebRequest -Uri "https://1.1.1.1" -TimeoutSec 5 -UseBasicParsing
        Write-Pass "Internet connectivity confirmed"
    } catch {
        Write-Err "No internet connection detected"
        throw "No internet connection"
    }

    # Disk space
    $disk = Get-PSDrive -Name C
    $freeGB = [math]::Round($disk.Free / 1GB, 1)
    if ($freeGB -ge 20) {
        Write-Pass "Disk space: ${freeGB}GB free"
    } elseif ($freeGB -ge 10) {
        Write-Warn "Disk space is low: ${freeGB}GB free (20GB+ recommended)"
        $Results.Warnings.Add("disk: ${freeGB}GB free — 20GB+ recommended")
    } else {
        Write-Err "Critically low disk space: ${freeGB}GB free"
    }

    Install-Winget | Out-Null
}

# ─── Tool Installers ──────────────────────────────────────────────────────────
function Install-Git {
    Write-Step "Git (minimum v$($MinVersions.Git))"
    $ver = Get-ToolVersion "git" "--version"
    if (Test-VersionMeets $ver $MinVersions.Git) {
        Write-Skip "Git v$ver already installed"
        return
    }
    Install-WithWinget "Git.Git" "Git"
}

function Install-Node {
    Write-Step "Node.js (minimum v$($MinVersions.Node))"
    $ver = Get-ToolVersion "node" "--version"
    if (Test-VersionMeets $ver $MinVersions.Node) {
        Write-Skip "Node.js v$ver already installed"
        return
    }
    Install-WithWinget "OpenJS.NodeJS.LTS" "Node.js LTS"
}

function Install-Pnpm {
    Write-Step "pnpm (minimum v$($MinVersions.Pnpm))"
    $ver = Get-ToolVersion "pnpm" "--version"
    if (Test-VersionMeets $ver $MinVersions.Pnpm) {
        Write-Skip "pnpm v$ver already installed"
        return
    }
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Err "npm not found — install Node.js first"
        return
    }
    if ($DryRun) { Write-Info "[dry-run] Would run: npm install -g pnpm"; return }
    Write-Install "Installing pnpm via npm..."
    npm install -g pnpm | Out-Null
    Write-Pass "pnpm $(pnpm --version) installed"
    $Results.Installed.Add("pnpm")
}

function Install-Python {
    Write-Step "Python (minimum v$($MinVersions.Python))"
    foreach ($cmd in @("python", "python3", "py")) {
        $ver = Get-ToolVersion $cmd "--version"
        if (Test-VersionMeets $ver $MinVersions.Python) {
            Write-Skip "Python v$ver already installed ($cmd)"
            return
        }
    }
    Install-WithWinget "Python.Python.3.11" "Python 3.11"
}

function Install-Docker {
    Write-Step "Docker Desktop"
    $dockerRunning = $false
    try {
        $null = & docker info 2>&1
        $dockerRunning = $LASTEXITCODE -eq 0
    } catch {}

    if ($dockerRunning) {
        $ver = Get-ToolVersion "docker" "--version"
        Write-Skip "Docker v$ver already running"
        return
    }

    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Warn "Docker binary found but daemon not running"
        Write-Warn "Start Docker Desktop from the Start menu"
        $Results.Warnings.Add("docker: daemon not running — start Docker Desktop")
        return
    }

    # Check WSL2
    $wslCheck = & wsl --status 2>&1 | Out-String
    if ($wslCheck -notmatch 'Default Version: 2') {
        Write-Warn "WSL2 may not be configured. Docker Desktop requires WSL2."
        Write-Warn "Enable: wsl --set-default-version 2"
        Write-Warn "Install WSL: wsl --install"
        $Results.Warnings.Add("wsl2: may not be configured — required for Docker Desktop")
    }

    Install-WithWinget "Docker.DockerDesktop" "Docker Desktop"
    Write-Warn "Docker Desktop installed. Start it from the Start menu before using Docker."
    $Results.Warnings.Add("docker: start Docker Desktop from Start menu before use")
}

function Install-AwsCli {
    Write-Step "AWS CLI (minimum v$($MinVersions.AwsCli))"
    $ver = Get-ToolVersion "aws" "--version"
    if (Test-VersionMeets $ver $MinVersions.AwsCli) {
        Write-Skip "AWS CLI v$ver already installed"
        return
    }
    Install-WithWinget "Amazon.AWSCLI" "AWS CLI"
}

function Install-Terraform {
    Write-Step "Terraform (minimum v$($MinVersions.Terraform))"
    $ver = Get-ToolVersion "terraform" "version"
    if (Test-VersionMeets $ver $MinVersions.Terraform) {
        Write-Skip "Terraform v$ver already installed"
        return
    }
    Install-WithWinget "Hashicorp.Terraform" "Terraform"
}

function Install-GitHubCli {
    Write-Step "GitHub CLI (minimum v$($MinVersions.Gh))"
    $ver = Get-ToolVersion "gh" "--version"
    if (Test-VersionMeets $ver $MinVersions.Gh) {
        Write-Skip "GitHub CLI v$ver already installed"
        return
    }
    Install-WithWinget "GitHub.cli" "GitHub CLI"
}

function Install-VercelCli {
    Write-Step "Vercel CLI"
    if (Get-Command vercel -ErrorAction SilentlyContinue) {
        $ver = & vercel --version 2>&1 | Select-Object -First 1
        Write-Skip "Vercel CLI already installed ($ver)"
        return
    }
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Warn "npm not found — skipping Vercel CLI"
        $Results.Warnings.Add("vercel: npm not found, install manually: npm i -g vercel")
        return
    }
    if ($DryRun) { Write-Info "[dry-run] Would run: npm install -g vercel"; return }
    Write-Install "Installing Vercel CLI..."
    npm install -g vercel | Out-Null
    Write-Pass "Vercel CLI installed"
    $Results.Installed.Add("vercel-cli")
}

# ─── PATH Refresh ─────────────────────────────────────────────────────────────
function Update-PathFromRegistry {
    Write-Step "PATH Refresh"
    $machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    $userPath    = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $env:PATH    = "$machinePath;$userPath"
    Write-Pass "PATH refreshed from registry"
}

# ─── Version Verification ─────────────────────────────────────────────────────
function Test-AllVersions {
    Write-Step "Version Verification"

    $tools = @(
        @{ Name="git";       Cmd="git";       Args="--version"; Min=$MinVersions.Git }
        @{ Name="node";      Cmd="node";      Args="--version"; Min=$MinVersions.Node }
        @{ Name="npm";       Cmd="npm";       Args="--version"; Min=$null }
        @{ Name="pnpm";      Cmd="pnpm";      Args="--version"; Min=$MinVersions.Pnpm }
        @{ Name="python";    Cmd="python";    Args="--version"; Min=$MinVersions.Python }
        @{ Name="aws";       Cmd="aws";       Args="--version"; Min=$MinVersions.AwsCli }
        @{ Name="terraform"; Cmd="terraform"; Args="version";   Min=$MinVersions.Terraform }
        @{ Name="gh";        Cmd="gh";        Args="--version"; Min=$MinVersions.Gh }
    )

    foreach ($tool in $tools) {
        if (Get-Command $tool.Cmd -ErrorAction SilentlyContinue) {
            $ver = Get-ToolVersion $tool.Cmd $tool.Args
            if ($null -eq $tool.Min -or (Test-VersionMeets $ver $tool.Min)) {
                Write-Pass "$($tool.Name): v$ver"
            } else {
                Write-Warn "$($tool.Name): v$ver (minimum: v$($tool.Min))"
                $Results.Warnings.Add("$($tool.Name): v$ver below minimum v$($tool.Min)")
            }
        } else {
            Write-Err "$($tool.Name): NOT FOUND"
            $Results.Errors.Add("$($tool.Name): not found")
        }
    }

    # Docker special case
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $dockerRunning = $false
        try { $null = & docker info 2>&1; $dockerRunning = $LASTEXITCODE -eq 0 } catch {}
        $ver = Get-ToolVersion "docker" "--version"
        if ($dockerRunning) {
            Write-Pass "docker: v$ver (daemon running)"
        } else {
            Write-Warn "docker: v$ver (daemon NOT running — start Docker Desktop)"
            $Results.Warnings.Add("docker: daemon not running")
        }
    } else {
        Write-Err "docker: NOT FOUND"
        $Results.Errors.Add("docker: not found")
    }
}

# ─── Project Setup ────────────────────────────────────────────────────────────
function Set-ProjectUp {
    if ($SkipProject) { return }
    if ($DryRun) { Write-Info "[dry-run] Would run pnpm install + pip install"; return }

    Write-Step "Project Dependencies"

    # pnpm install
    $pnpmWorkspace = Join-Path $RepoRoot "pnpm-workspace.yaml"
    if ((Test-Path $pnpmWorkspace) -and (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Info "Running pnpm install..."
        Push-Location $RepoRoot
        & pnpm install 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Info $_ }
        Pop-Location
        Write-Pass "pnpm dependencies installed"
        $Results.Installed.Add("pnpm-workspace-deps")
    }

    # Python venv
    $reqFile = Join-Path $RepoRoot "requirements.txt"
    if (Test-Path $reqFile) {
        $venvDir = Join-Path $RepoRoot ".venv"
        if (-not (Test-Path $venvDir)) {
            Write-Info "Creating Python virtual environment..."
            & python -m venv $venvDir
            $Results.Installed.Add("python-venv")
        } else {
            Write-Skip "Python .venv already exists"
        }
        $pip = Join-Path $venvDir "Scripts\pip.exe"
        Write-Info "Installing Python dependencies..."
        & $pip install --upgrade pip --quiet
        & $pip install -r $reqFile --quiet
        $devReq = Join-Path $RepoRoot "requirements-dev.txt"
        if (Test-Path $devReq) { & $pip install -r $devReq --quiet }
        Write-Pass "Python dependencies installed"
        $Results.Installed.Add("python-deps")
    }

    # .env
    $envExample = Join-Path $RepoRoot ".env.example"
    $envFile    = Join-Path $RepoRoot ".env"
    if ((Test-Path $envExample) -and (-not (Test-Path $envFile))) {
        Copy-Item $envExample $envFile
        Write-Warn ".env created from .env.example — update with real secrets before running"
        $Results.Warnings.Add("project: .env created from .env.example — configure secrets")
    }
}

# ─── Report ───────────────────────────────────────────────────────────────────
function New-BootstrapReport {
    $duration = [math]::Round(((Get-Date) - $StartTime).TotalSeconds)
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $osInfo = Get-CimInstance Win32_OperatingSystem

    $installedLines = ($Results.Installed | ForEach-Object { "- ✅ $_" }) -join "`n"
    $skippedLines   = ($Results.Skipped   | ForEach-Object { "- ⏭️  $_" }) -join "`n"
    $warnLines      = ($Results.Warnings  | ForEach-Object { "- ⚠️  $_" }) -join "`n"
    $errLines       = ($Results.Errors    | ForEach-Object { "- ❌ $_" }) -join "`n"

    $status = if ($Results.Errors.Count -gt 0) { "⚠️  COMPLETED WITH ERRORS" } else { "✅ COMPLETE" }

    $report = @"
# BOOTSTRAP REPORT
## StayOS Developer Workstation (Windows)

**Generated:** $timestamp
**Status:** $status
**Duration:** $duration seconds
**Bootstrap Version:** $BootstrapVersion
**OS:** $($osInfo.Caption) Build $($osInfo.BuildNumber)
**Architecture:** $($env:PROCESSOR_ARCHITECTURE)
**User:** $($env:USERNAME)
**Dry Run:** $DryRun

---

## Installed

$( if ($Results.Installed.Count -gt 0) { $installedLines } else { "_Nothing was installed._" } )

---

## Skipped (Already Installed)

$( if ($Results.Skipped.Count -gt 0) { $skippedLines } else { "_Nothing was skipped._" } )

---

## Warnings

$( if ($Results.Warnings.Count -gt 0) { $warnLines } else { "_No warnings._" } )

---

## Errors

$( if ($Results.Errors.Count -gt 0) { $errLines } else { "_No errors._" } )

---

## Recommended Next Steps

1. **Start Docker Desktop** from the Start menu
2. **Configure AWS credentials:** ``aws configure``
3. **Authenticate GitHub CLI:** ``gh auth login``
4. **Configure .env:** copy ``.env.example`` to ``.env`` and fill in secrets
5. **Start local services:** ``docker compose up -d``
6. **Run backend tests:** ``.venv\Scripts\pytest tests\ -v``
7. **Start API dev server:** ``.venv\Scripts\uvicorn src.app.main:app --reload``
8. **Start web dev server:** ``cd apps\web && pnpm dev``

## Doctor Command

Run health check:
``.\bootstrap\doctor.ps1``
"@

    $report | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-Pass "BOOTSTRAP_REPORT.md generated: $ReportFile"
}

# ─── Summary ──────────────────────────────────────────────────────────────────
function Write-Summary {
    $duration = [math]::Round(((Get-Date) - $StartTime).TotalSeconds)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host " Bootstrap Complete — ${duration}s" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  Installed:  $($Results.Installed.Count) packages" -ForegroundColor Green
    Write-Host "  Skipped:    $($Results.Skipped.Count) already present" -ForegroundColor DarkGray
    Write-Host "  Warnings:   $($Results.Warnings.Count)" -ForegroundColor Yellow
    Write-Host "  Errors:     $($Results.Errors.Count)" -ForegroundColor Red
    Write-Host ""
    if ($Results.Errors.Count -eq 0) {
        Write-Host " ✓ Workstation ready for StayOS development" -ForegroundColor Green
    } else {
        Write-Host " ⚠ Bootstrap completed with errors. Review BOOTSTRAP_REPORT.md" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host " Report: $ReportFile" -ForegroundColor White
    Write-Host ""
}

# ─── Main ─────────────────────────────────────────────────────────────────────
Write-Banner
Test-Prerequisites
Install-Git
Install-Node
Install-Pnpm
Install-Python
Install-Docker
Install-AwsCli
Install-Terraform
Install-GitHubCli
Install-VercelCli
Update-PathFromRegistry
Test-AllVersions
Set-ProjectUp
New-BootstrapReport
Write-Summary
