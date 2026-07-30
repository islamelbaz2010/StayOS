#Requires -Version 5.1
<#
.SYNOPSIS
    StayOS Developer Environment Doctor — Windows PowerShell

.DESCRIPTION
    Diagnoses the developer workstation health. Generates DOCTOR_REPORT.md.
    Run before starting development or when experiencing environment issues.

.PARAMETER Fix
    Attempt to repair issues by running bootstrap.ps1.

.EXAMPLE
    .\bootstrap\doctor.ps1
    .\bootstrap\doctor.ps1 -Fix
#>

[CmdletBinding()]
param([switch]$Fix)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot   = Split-Path -Parent $ScriptDir
$ReportFile = Join-Path $RepoRoot "DOCTOR_REPORT.md"

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

$PassList = [System.Collections.Generic.List[string]]::new()
$WarnList = [System.Collections.Generic.List[string]]::new()
$FailList = [System.Collections.Generic.List[string]]::new()

function Write-Section { param($msg) Write-Host "`n  ──  $msg  ──" -ForegroundColor Cyan }
function Write-Pass    { param($msg) Write-Host "    [✓ PASS]  $msg" -ForegroundColor Green;  $PassList.Add($msg) }
function Write-Warn    { param($msg) Write-Host "    [⚠ WARN]  $msg" -ForegroundColor Yellow; $WarnList.Add($msg) }
function Write-Fail    { param($msg) Write-Host "    [✗ FAIL]  $msg" -ForegroundColor Red;    $FailList.Add($msg) }
function Write-Info    { param($msg) Write-Host "    [ℹ INFO]  $msg" -ForegroundColor Blue }

function Get-ToolVersion {
    param([string]$Command, [string]$Args = "--version")
    try {
        $output = & $Command $Args.Split(' ') 2>&1 | Out-String
        if ($output -match '(\d+\.\d+[\.\d]*)') { return [Version]$Matches[1] }
    } catch {}
    return $null
}

# ─── Checks ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      StayOS Environment Doctor (Windows)             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Section "Operating System"
$os = Get-CimInstance Win32_OperatingSystem
Write-Info "OS: $($os.Caption) (Build $($os.BuildNumber))"
if ([int]$os.BuildNumber -ge 19041) { Write-Pass "Windows version supported (Build $($os.BuildNumber))" }
else { Write-Fail "Windows version too old (Build $($os.BuildNumber)) — requires 19041+" }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) { Write-Pass "Running as Administrator" }
else { Write-Warn "Not running as Administrator — some features may be limited" }

Write-Section "Disk Space"
$disk  = Get-PSDrive -Name C
$freeGB = [math]::Round($disk.Free / 1GB, 1)
if ($freeGB -ge 20)     { Write-Pass "Disk space: ${freeGB}GB free" }
elseif ($freeGB -ge 10) { Write-Warn "Disk space low: ${freeGB}GB (20GB+ recommended)" }
else                    { Write-Fail "Critically low disk space: ${freeGB}GB" }

Write-Section "Network"
try { $null = Invoke-WebRequest -Uri "https://1.1.1.1" -TimeoutSec 5 -UseBasicParsing; Write-Pass "Internet reachable" }
catch { Write-Fail "No internet connection" }
try { $null = Invoke-WebRequest -Uri "https://github.com" -TimeoutSec 5 -UseBasicParsing; Write-Pass "GitHub reachable" }
catch { Write-Warn "GitHub unreachable" }
try { $null = Invoke-WebRequest -Uri "https://registry.npmjs.org" -TimeoutSec 5 -UseBasicParsing; Write-Pass "npm registry reachable" }
catch { Write-Warn "npm registry unreachable" }

Write-Section "Git"
if (Get-Command git -ErrorAction SilentlyContinue) {
    $ver = Get-ToolVersion "git" "--version"
    if ($ver -ge $MinVersions.Git) { Write-Pass "git v$ver" }
    else { Write-Warn "git v$ver below minimum $($MinVersions.Git)" }
    $gitName  = git config --global user.name  2>$null
    $gitEmail = git config --global user.email 2>$null
    if ($gitName)  { Write-Pass "git user.name: $gitName" }  else { Write-Warn "git user.name not configured" }
    if ($gitEmail) { Write-Pass "git user.email: $gitEmail" } else { Write-Warn "git user.email not configured" }
} else { Write-Fail "git not found" }

Write-Section "Node.js"
if (Get-Command node -ErrorAction SilentlyContinue) {
    $ver = Get-ToolVersion "node" "--version"
    if ($ver -ge $MinVersions.Node) { Write-Pass "node v$ver" }
    else { Write-Fail "node v$ver below minimum $($MinVersions.Node)" }
} else { Write-Fail "node not found" }

if (Get-Command npm -ErrorAction SilentlyContinue) { Write-Pass "npm $(npm --version)" }
else { Write-Fail "npm not found" }

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $ver = Get-ToolVersion "pnpm" "--version"
    if ($ver -ge $MinVersions.Pnpm) { Write-Pass "pnpm v$ver" }
    else { Write-Warn "pnpm v$ver below minimum $($MinVersions.Pnpm)" }
} else { Write-Fail "pnpm not found" }

Write-Section "Python"
$pyFound = $false
foreach ($cmd in @("python", "python3", "py")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $ver = Get-ToolVersion $cmd "--version"
        if ($null -ne $ver -and $ver -ge $MinVersions.Python) {
            Write-Pass "Python v$ver ($cmd)"
            $pyFound = $true
            break
        }
    }
}
if (-not $pyFound) { Write-Fail "Python >= $($MinVersions.Python) not found" }
$venvDir = Join-Path $RepoRoot ".venv"
if (Test-Path $venvDir) { Write-Pass "Project .venv exists" }
else { Write-Warn "Project .venv not found — run: .\bootstrap\bootstrap.ps1" }

Write-Section "Docker"
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $ver = Get-ToolVersion "docker" "--version"
    if ($ver -ge $MinVersions.Docker) { Write-Pass "docker v$ver" }
    else { Write-Warn "docker v$ver below minimum $($MinVersions.Docker)" }
    $dockerRunning = $false
    try { $null = & docker info 2>&1; $dockerRunning = $LASTEXITCODE -eq 0 } catch {}
    if ($dockerRunning) { Write-Pass "Docker daemon running" }
    else { Write-Fail "Docker daemon not running — start Docker Desktop" }
    try {
        $dcVer = & docker compose version 2>&1 | Select-String '\d+\.\d+' | Select-Object -First 1
        Write-Pass "Docker Compose V2 available"
    } catch { Write-Fail "Docker Compose V2 not available" }
} else { Write-Fail "docker not found" }

Write-Section "AWS CLI"
if (Get-Command aws -ErrorAction SilentlyContinue) {
    $ver = Get-ToolVersion "aws" "--version"
    if ($ver -ge $MinVersions.AwsCli) { Write-Pass "aws-cli v$ver" }
    else { Write-Warn "aws-cli v$ver below minimum $($MinVersions.AwsCli)" }
    try {
        $identity = & aws sts get-caller-identity --query Account --output text 2>$null
        if ($identity) { Write-Pass "AWS credentials configured (account: $identity)" }
        else { Write-Warn "AWS credentials not configured — run: aws configure" }
    } catch { Write-Warn "AWS credentials not configured — run: aws configure" }
    $region = aws configure get region 2>$null
    if ($region) {
        Write-Pass "AWS region: $region"
        if ($region -ne "me-central-1") { Write-Warn "AWS region is '$region' — StayOS uses me-central-1 (UAE)" }
    } else { Write-Warn "AWS region not set — run: aws configure set region me-central-1" }
} else { Write-Fail "aws-cli not found" }

Write-Section "Terraform"
if (Get-Command terraform -ErrorAction SilentlyContinue) {
    $ver = Get-ToolVersion "terraform" "version"
    if ($ver -ge $MinVersions.Terraform) { Write-Pass "terraform v$ver" }
    else { Write-Warn "terraform v$ver below minimum $($MinVersions.Terraform)" }
} else { Write-Fail "terraform not found" }

Write-Section "GitHub CLI"
if (Get-Command gh -ErrorAction SilentlyContinue) {
    $ver = Get-ToolVersion "gh" "--version"
    if ($ver -ge $MinVersions.Gh) { Write-Pass "gh v$ver" }
    else { Write-Warn "gh v$ver below minimum $($MinVersions.Gh)" }
    try { $null = & gh auth status 2>&1; Write-Pass "GitHub CLI authenticated" }
    catch { Write-Warn "GitHub CLI not authenticated — run: gh auth login" }
} else { Write-Fail "gh not found" }

Write-Section "Project Setup"
$envFile = Join-Path $RepoRoot ".env"
if (Test-Path $envFile) { Write-Pass ".env file exists" }
else { Write-Warn ".env not found — copy .env.example to .env" }

$pnpmLock = Join-Path $RepoRoot "pnpm-lock.yaml"
if (Test-Path $pnpmLock) { Write-Pass "pnpm dependencies installed" }
else { Write-Warn "pnpm dependencies not installed — run: pnpm install" }

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " Doctor Summary" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  ✓ Pass:  $($PassList.Count)" -ForegroundColor Green
Write-Host "  ⚠ Warn:  $($WarnList.Count)" -ForegroundColor Yellow
Write-Host "  ✗ Fail:  $($FailList.Count)" -ForegroundColor Red
Write-Host ""

# Generate DOCTOR_REPORT.md
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$status = if ($FailList.Count -gt 0) { "🔴 FAILING" } elseif ($WarnList.Count -gt 0) { "🟡 WARNING" } else { "🟢 HEALTHY" }

$passLines = ($PassList | ForEach-Object { "- ✅ $_" }) -join "`n"
$warnLines = ($WarnList | ForEach-Object { "- ⚠️  $_" }) -join "`n"
$failLines = ($FailList | ForEach-Object { "- ❌ $_" }) -join "`n"

@"
# DOCTOR REPORT — Windows
## StayOS Developer Environment Health Check

**Generated:** $timestamp
**Overall Status:** $status
**OS:** $($os.Caption) Build $($os.BuildNumber)
**User:** $($env:USERNAME)

---

## Failed Checks

$( if ($FailList.Count -gt 0) { $failLines } else { "_No failed checks._" } )

## Warnings

$( if ($WarnList.Count -gt 0) { $warnLines } else { "_No warnings._" } )

## Passed

$passLines

---

## Fix

```.ps1
.\bootstrap\bootstrap.ps1
```
"@ | Out-File -FilePath $ReportFile -Encoding UTF8

Write-Host " Report: $ReportFile" -ForegroundColor White
Write-Host ""

if ($FailList.Count -gt 0) {
    Write-Host " ✗ Environment has $($FailList.Count) critical issue(s)" -ForegroundColor Red
    if ($Fix) { & "$ScriptDir\bootstrap.ps1" }
} elseif ($WarnList.Count -gt 0) {
    Write-Host " ⚠ Environment has $($WarnList.Count) warning(s)" -ForegroundColor Yellow
    if ($Fix) { & "$ScriptDir\bootstrap.ps1" }
} else {
    Write-Host " ✓ Environment is healthy" -ForegroundColor Green
}
Write-Host ""
exit $(if ($FailList.Count -gt 0) { 1 } elseif ($WarnList.Count -gt 0) { 2 } else { 0 })
