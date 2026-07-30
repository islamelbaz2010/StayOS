#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║              StayOS — Developer Workstation Bootstrap v2.0                  ║
# ║              Architecture: Official Installer First, Homebrew Optional      ║
# ║              Supports: macOS Intel · macOS Apple Silicon · Ubuntu           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./bootstrap/bootstrap.sh                   # Default: official installers
#   ./bootstrap/bootstrap.sh --dry-run         # Preview plan with sizes + times
#   ./bootstrap/bootstrap.sh --official-only   # Same as default (explicit)
#   ./bootstrap/bootstrap.sh --package-manager # Allow Homebrew as fallback
#   ./bootstrap/bootstrap.sh --minimal         # Only git, node, pnpm, python, docker
#   ./bootstrap/bootstrap.sh --developer       # All tools including optional (default)
#   ./bootstrap/bootstrap.sh --upgrade         # Upgrade tools that are below minimum
#   ./bootstrap/bootstrap.sh --repair          # Re-verify and repair broken installs
#   ./bootstrap/bootstrap.sh --skip-project    # Skip npm install / pip install
#   ./bootstrap/bootstrap.sh --help
#
# Installation priority (per tool):
#   1. Already installed + meets version → SKIP (never reinstall)
#   2. Official binary / official installer
#   3. Package manager (Homebrew / apt) — only with --package-manager
#   4. Source compilation — NEVER (forbidden)

set -uo pipefail
IFS=$'\n\t'

BOOTSTRAP_VERSION="2.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPORT_FILE="${REPO_ROOT}/BOOTSTRAP_REPORT.md"
START_TIME=$(date +%s)

# ─── Minimum Version Requirements ────────────────────────────────────────────
readonly MIN_NODE_VERSION="20"
readonly MIN_PYTHON_VERSION="3.11"
readonly MIN_PNPM_VERSION="8"
readonly MIN_DOCKER_VERSION="24"
readonly MIN_TERRAFORM_VERSION="1.5"
readonly MIN_AWS_CLI_VERSION="2"
readonly MIN_GH_VERSION="2"
readonly MIN_GIT_VERSION="2.30"

# ─── Mode Flags ───────────────────────────────────────────────────────────────
DRY_RUN=false
USE_PACKAGE_MANAGER=false   # Homebrew / apt — false means official-only
TOOL_MODE="developer"       # minimal | developer
UPGRADE_MODE=false          # Upgrade tools below minimum
REPAIR_MODE=false           # Re-verify + repair
SKIP_PROJECT=false

# ─── Parse Arguments ──────────────────────────────────────────────────────────
for arg in "$@"; do
  case "${arg}" in
    --dry-run)          DRY_RUN=true ;;
    --official-only)    USE_PACKAGE_MANAGER=false ;;
    --package-manager)  USE_PACKAGE_MANAGER=true ;;
    --minimal)          TOOL_MODE="minimal" ;;
    --developer)        TOOL_MODE="developer" ;;
    --upgrade)          UPGRADE_MODE=true ;;
    --repair)           REPAIR_MODE=true ;;
    --skip-project)     SKIP_PROJECT=true ;;
    --help|-h)
      cat <<HELP
StayOS Developer Bootstrap v${BOOTSTRAP_VERSION}

Usage: $0 [OPTIONS]

Modes:
  --official-only     Use official installers only (DEFAULT)
  --package-manager   Allow Homebrew/apt as fallback when official fails
  --minimal           Install only: git, node, pnpm, python, docker
  --developer         Install all tools including aws, terraform, gh, vercel (DEFAULT)
  --upgrade           Upgrade tools that are below minimum version
  --repair            Re-verify and repair all installed tools

Execution:
  --dry-run           Preview what would be installed (sizes, times, methods)
  --skip-project      Skip npm install and pip install at the end
  --help              Show this help

Installation priority:
  1. Already installed → SKIP (never reinstall)
  2. Official binary / official installer
  3. Homebrew/apt (only with --package-manager)
  4. Source build → FORBIDDEN

Examples:
  $0                              # Standard setup
  $0 --dry-run                    # Preview only
  $0 --minimal --official-only    # Minimal + no Homebrew
  $0 --package-manager            # Allow Homebrew fallback
  $0 --upgrade                    # Upgrade outdated tools
HELP
      exit 0
      ;;
    *)
      echo "Unknown argument: ${arg}. Run with --help for usage." >&2
      exit 1
      ;;
  esac
done

# Export flags so sourced lib files can read them
export DRY_RUN USE_PACKAGE_MANAGER TOOL_MODE UPGRADE_MODE REPAIR_MODE
export MIN_NODE_VERSION MIN_PYTHON_VERSION MIN_PNPM_VERSION MIN_DOCKER_VERSION
export MIN_TERRAFORM_VERSION MIN_AWS_CLI_VERSION MIN_GH_VERSION MIN_GIT_VERSION

# ─── Source Common Utilities ──────────────────────────────────────────────────
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

# ─── Banner ───────────────────────────────────────────────────────────────────
print_banner() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${CYAN}║   StayOS Developer Bootstrap v${BOOTSTRAP_VERSION}            ║${RESET}"
  echo -e "${BOLD}${CYAN}║   Official Installer First · Homebrew Optional       ║${RESET}"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}"
  echo ""
  echo -e "  Mode:     ${BOLD}${TOOL_MODE}${RESET}"
  echo -e "  Strategy: ${BOLD}$([ "${USE_PACKAGE_MANAGER}" == "true" ] && echo "official + package-manager" || echo "official-only")${RESET}"
  echo -e "  Upgrade:  ${BOLD}${UPGRADE_MODE}${RESET}"
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo ""
    echo -e "${YELLOW}${BOLD}  ▸ DRY RUN — No software will be installed${RESET}"
  fi
  echo ""
}

# ─── Safety Checks ────────────────────────────────────────────────────────────
check_not_root() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    log_error "Do not run as root or with sudo."
    log_error "The script requests sudo only when specific operations require it."
    exit 1
  fi
}

detect_environment() {
  log_step "Environment Detection"
  OS=$(detect_os)
  ARCH=$(detect_arch)
  export OS ARCH

  if [[ "${OS}" == "unsupported" ]]; then
    log_error "Unsupported OS: $(uname -s)"
    log_error "Supported: macOS, Ubuntu/Debian"
    log_error "Windows: run bootstrap/bootstrap.ps1 in PowerShell"
    exit 1
  fi

  log_info "OS:            ${OS} ($(uname -s) $(uname -r))"
  log_info "Architecture:  ${ARCH}"
  [[ "${OS}" == "macos" ]] && log_info "macOS:         $(detect_macos_version)"
  log_info "Shell:         ${SHELL:-unknown}"
  log_info "User:          ${USER:-$(whoami)}"
  log_info "Repo root:     ${REPO_ROOT}"

  if ! check_internet; then
    log_error "No internet connection. Bootstrap requires network access."
    exit 1
  fi
  log_success "Network reachable"

  if ! check_disk_space 10; then
    log_warn "Less than 10GB free disk space"
    WARNINGS+=("disk: less than 10GB free")
  fi
}

# ─── Source Platform Library ──────────────────────────────────────────────────
source_platform_lib() {
  case "${OS}" in
    macos) source "${SCRIPT_DIR}/lib/macos.sh" ;;
    linux) source "${SCRIPT_DIR}/lib/linux.sh" ;;
  esac
}

# ─── Cross-Platform Installers ────────────────────────────────────────────────

install_pnpm() {
  local min_version="${MIN_PNPM_VERSION}"
  log_step "pnpm (minimum v${min_version})"

  if command_exists pnpm; then
    local current
    current=$(get_version pnpm --version)
    if version_gte "${current}" "${min_version}"; then
      log_skip "pnpm v${current} already present"
      record_result "pnpm" "skipped" "already-present"
      [[ "${DRY_RUN}" == "true" ]] && add_dry_run_item "pnpm" "SKIP" "Already present (v${current})" 0 0 "no"
      return 0
    fi
    log_warn "pnpm v${current} < minimum v${min_version}"
  fi

  if ! command_exists npm; then
    log_error "npm not found — install Node.js first"
    ERRORS+=("pnpm: npm not found, install Node.js first")
    return 1
  fi

  local size_mb=5 est_time=15

  if [[ "${DRY_RUN}" == "true" ]]; then
    add_dry_run_item "pnpm" "INSTALL" "npm install -g pnpm (never brew)" "${size_mb}" "${est_time}" "no"
    return 0
  fi

  # pnpm is always installed via npm — never via Homebrew
  log_install "Installing pnpm via npm install -g pnpm..."
  npm install -g pnpm@latest 2>&1 | tail -3
  log_success "pnpm $(pnpm --version) installed"
  record_result "pnpm" "installed" "npm-global" "0" "${size_mb}"
  INSTALLED+=("pnpm")
}

install_vercel() {
  log_step "Vercel CLI"

  if command_exists vercel; then
    local current
    current=$(vercel --version 2>/dev/null | head -1 || echo "unknown")
    log_skip "Vercel CLI already present (${current})"
    record_result "vercel" "skipped" "already-present"
    [[ "${DRY_RUN}" == "true" ]] && add_dry_run_item "Vercel CLI" "SKIP" "Already present (${current})" 0 0 "no"
    return 0
  fi

  if ! command_exists npm; then
    log_warn "npm not found — skipping Vercel CLI"
    WARNINGS+=("vercel: install manually with: npm i -g vercel")
    return 0
  fi

  local size_mb=5 est_time=15

  [[ "${DRY_RUN}" == "true" ]] && {
    add_dry_run_item "Vercel CLI" "INSTALL" "npm install -g vercel (never brew)" "${size_mb}" "${est_time}" "no"
    return 0
  }

  log_install "Installing Vercel CLI via npm install -g vercel..."
  npm install -g vercel 2>&1 | tail -3
  log_success "Vercel CLI $(vercel --version 2>/dev/null | head -1) installed"
  record_result "vercel" "installed" "npm-global" "0" "${size_mb}"
  INSTALLED+=("vercel-cli")
}

# ─── PATH Verification and Repair ────────────────────────────────────────────
verify_path() {
  log_step "PATH Verification"
  ensure_path

  local minimal_tools=(git node npm pnpm python3 docker)
  local developer_tools=(aws terraform gh vercel)
  local tools=("${minimal_tools[@]}")
  [[ "${TOOL_MODE}" == "developer" ]] && tools+=("${developer_tools[@]}")

  local missing=()
  for tool in "${tools[@]}"; do
    command_exists "${tool}" || missing+=("${tool}")
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    log_warn "Not in PATH: ${missing[*]}"
    log_warn "Restart your terminal or source your shell config to pick up new tools."
    for t in "${missing[@]}"; do
      WARNINGS+=("PATH: ${t} not found")
    done
  else
    log_success "All required tools found in PATH"
  fi
}

# ─── Version Verification ────────────────────────────────────────────────────
verify_all() {
  log_step "Version Verification"

  _chk() {
    local label="$1" cmd="$2" min="$3"; shift 3
    if command_exists "${cmd}"; then
      local ver
      ver=$(get_version "${cmd}" "$@")
      if [[ -z "${min}" ]] || version_gte "${ver}" "${min}"; then
        log_success "${label}: v${ver}"
      else
        log_warn "${label}: v${ver} (below minimum v${min})"
      fi
    else
      log_error "${label}: NOT FOUND"
    fi
  }

  _chk "Git"        git        "${MIN_GIT_VERSION}"       --version
  _chk "Node.js"    node       "${MIN_NODE_VERSION}"      --version
  _chk "npm"        npm        ""                         --version
  _chk "pnpm"       pnpm       "${MIN_PNPM_VERSION}"      --version
  _chk "Python"     python3    "${MIN_PYTHON_VERSION}"    --version

  # Docker: check daemon separately
  if command_exists docker; then
    local dver
    dver=$(get_version docker --version)
    if docker info &>/dev/null 2>&1; then
      log_success "Docker: v${dver} (daemon running)"
    else
      log_warn "Docker: v${dver} (daemon NOT running)"
    fi
    docker compose version &>/dev/null 2>&1 && log_success "Docker Compose V2: available" || \
      log_warn "Docker Compose V2: not available"
  else
    log_error "Docker: NOT FOUND"
  fi

  if [[ "${TOOL_MODE}" == "developer" ]]; then
    _chk "AWS CLI"    aws        "${MIN_AWS_CLI_VERSION}"   --version
    _chk "Terraform"  terraform  "${MIN_TERRAFORM_VERSION}" version
    _chk "GitHub CLI" gh         "${MIN_GH_VERSION}"        --version
    if command_exists vercel; then
      log_success "Vercel CLI: $(vercel --version 2>/dev/null | head -1)"
    else
      log_warn "Vercel CLI: not found"
    fi
  fi
}

# ─── Project Setup ────────────────────────────────────────────────────────────
setup_project() {
  [[ "${SKIP_PROJECT}" == "true" ]] && return 0
  [[ "${DRY_RUN}" == "true" ]] && {
    log_info "[dry-run] Would run: pnpm install + pip install -r requirements.txt"
    return 0
  }

  log_step "Project Dependencies"

  if [[ -f "${REPO_ROOT}/pnpm-workspace.yaml" ]] && command_exists pnpm; then
    log_info "Installing Node.js workspace dependencies (pnpm install)..."
    (cd "${REPO_ROOT}" && pnpm install 2>&1 | tail -5)
    log_success "Node.js dependencies installed"
    record_result "pnpm-deps" "installed" "pnpm-install"
    INSTALLED+=("pnpm-workspace-deps")
  fi

  if [[ -f "${REPO_ROOT}/requirements.txt" ]]; then
    local venv_dir="${REPO_ROOT}/.venv"
    if [[ ! -d "${venv_dir}" ]]; then
      log_info "Creating Python virtual environment (.venv)..."
      python3 -m venv "${venv_dir}" || python3.11 -m venv "${venv_dir}"
      record_result "python-venv" "installed" "python-venv"
      INSTALLED+=("python-venv")
    else
      log_skip ".venv already exists"
    fi
    log_info "Installing Python dependencies..."
    "${venv_dir}/bin/pip" install --upgrade pip --quiet
    "${venv_dir}/bin/pip" install -r "${REPO_ROOT}/requirements.txt" --quiet
    [[ -f "${REPO_ROOT}/requirements-dev.txt" ]] && \
      "${venv_dir}/bin/pip" install -r "${REPO_ROOT}/requirements-dev.txt" --quiet
    log_success "Python dependencies installed in .venv"
    record_result "python-deps" "installed" "pip-install"
    INSTALLED+=("python-deps")
  fi

  # Seed .env
  if [[ -f "${REPO_ROOT}/.env.example" ]] && [[ ! -f "${REPO_ROOT}/.env" ]]; then
    cp "${REPO_ROOT}/.env.example" "${REPO_ROOT}/.env"
    log_warn ".env created from .env.example — populate with real secrets"
    WARNINGS+=("project: .env created — update with real secrets before running")
  fi
}

# ─── Report Generation ────────────────────────────────────────────────────────
generate_report() {
  local end_time
  end_time=$(date +%s)
  local duration=$(( end_time - START_TIME ))
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Build install log table rows
  local log_rows=""
  local i
  for (( i = 0; i < ${#LOG_NAMES[@]}; i++ )); do
    local name="${LOG_NAMES[i]}"
    local status="${LOG_STATUSES[i]}"
    local method="${LOG_METHODS[i]}"
    local dur="${LOG_DURATIONS[i]}"
    local sz="${LOG_SIZES[i]}"
    local status_icon
    case "${status}" in
      installed) status_icon="✅ Installed" ;;
      skipped)   status_icon="⏭️  Skipped" ;;
      warned)    status_icon="⚠️  Warned" ;;
      error)     status_icon="❌ Error" ;;
      *)         status_icon="${status}" ;;
    esac
    local dur_str size_str
    dur_str=$([ "${dur}" -gt 0 ] && echo "${dur}s" || echo "—")
    size_str=$([ "${sz}" -gt 0 ] && echo "~${sz} MB" || echo "—")
    log_rows="${log_rows}| ${name} | ${status_icon} | ${method} | ${size_str} | ${dur_str} |
"
  done

  cat > "${REPORT_FILE}" <<REPORT
# BOOTSTRAP REPORT
## StayOS Developer Workstation v${BOOTSTRAP_VERSION}

**Generated:** ${timestamp}
**Duration:** ${duration}s
**Bootstrap Version:** ${BOOTSTRAP_VERSION}
**Mode:** ${TOOL_MODE}
**Strategy:** $([ "${USE_PACKAGE_MANAGER}" == "true" ] && echo "official + package-manager" || echo "official-only")
**Upgrade:** ${UPGRADE_MODE}
**Dry Run:** ${DRY_RUN}
**OS:** ${OS} ($(uname -s) $(uname -r))
**Architecture:** ${ARCH}
**User:** ${USER:-$(whoami)}

---

## Installation Log

| Tool | Status | Method | Download | Duration |
|------|--------|--------|----------|----------|
${log_rows}
---

## Errors

$([ ${#ERRORS[@]} -gt 0 ] && printf '- ❌ %s\n' "${ERRORS[@]}" || echo "_None_")

## Warnings

$([ ${#WARNINGS[@]} -gt 0 ] && printf '- ⚠️  %s\n' "${WARNINGS[@]}" || echo "_None_")

---

## Environment Summary

| Tool | Version | Path |
|------|---------|------|
| git | $(git --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "—") | $(command -v git 2>/dev/null || echo "not found") |
| node | $(node --version 2>/dev/null || echo "—") | $(command -v node 2>/dev/null || echo "not found") |
| npm | $(npm --version 2>/dev/null || echo "—") | $(command -v npm 2>/dev/null || echo "not found") |
| pnpm | $(pnpm --version 2>/dev/null || echo "—") | $(command -v pnpm 2>/dev/null || echo "not found") |
| python3 | $(python3 --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "—") | $(command -v python3 2>/dev/null || echo "not found") |
| docker | $(docker --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "—") | $(command -v docker 2>/dev/null || echo "not found") |
| aws | $(aws --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "—") | $(command -v aws 2>/dev/null || echo "not found") |
| terraform | $(terraform version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "—") | $(command -v terraform 2>/dev/null || echo "not found") |
| gh | $(gh --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "—") | $(command -v gh 2>/dev/null || echo "not found") |
| vercel | $(vercel --version 2>/dev/null | head -1 || echo "—") | $(command -v vercel 2>/dev/null || echo "not found") |

---

## Recommended Next Steps

1. **Configure AWS:** \`aws configure\` (region: me-central-1)
2. **Authenticate GitHub CLI:** \`gh auth login\`
3. **Authenticate Vercel:** \`vercel login\`
4. **Configure secrets:** edit \`.env\` with real values
5. **Start local services:** \`docker compose up -d\`
6. **Run migrations:** \`.venv/bin/alembic upgrade head\`
7. **Run tests:** \`.venv/bin/pytest tests/ -v\`
8. **Start API:** \`.venv/bin/uvicorn src.app.main:app --reload\`
9. **Start web:** \`cd apps/web && pnpm dev\`

## Doctor

\`\`\`bash
./bootstrap/doctor.sh
\`\`\`

$([ ${#ERRORS[@]} -gt 0 ] && echo "## ⚠️ Completed with ${#ERRORS[@]} error(s). Run doctor.sh for details." || echo "## ✅ Bootstrap complete. Workstation ready.")
REPORT

  log_success "BOOTSTRAP_REPORT.md written to ${REPORT_FILE}"
  cleanup_tmpdir
}

# ─── Summary ──────────────────────────────────────────────────────────────────
print_summary() {
  local end_time
  end_time=$(date +%s)
  local duration=$(( end_time - START_TIME ))
  echo ""
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${BOLD} Bootstrap v${BOOTSTRAP_VERSION} — ${duration}s${RESET}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "  ${GREEN}Installed:${RESET}  ${#INSTALLED[@]}"
  echo -e "  ${DIM}Skipped:${RESET}    ${#SKIPPED[@]}"
  echo -e "  ${YELLOW}Warnings:${RESET}   ${#WARNINGS[@]}"
  echo -e "  ${RED}Errors:${RESET}     ${#ERRORS[@]}"
  echo ""
  [[ ${#ERRORS[@]} -gt 0 ]] && {
    echo -e "${RED}${BOLD} Errors:${RESET}"
    for e in "${ERRORS[@]}"; do echo -e "  ${RED}• ${e}${RESET}"; done
    echo ""
  }
  [[ ${#WARNINGS[@]} -gt 0 ]] && {
    echo -e "${YELLOW}${BOLD} Warnings:${RESET}"
    for w in "${WARNINGS[@]}"; do echo -e "  ${YELLOW}• ${w}${RESET}"; done
    echo ""
  }
  echo -e " Report:  ${REPORT_FILE}"
  echo -e " Doctor:  ./bootstrap/doctor.sh"
  echo ""
  if [[ ${#ERRORS[@]} -eq 0 ]]; then
    echo -e "${GREEN}${BOLD} ✓ Workstation ready${RESET}"
  else
    echo -e "${YELLOW}${BOLD} ⚠ Completed with errors${RESET}"
  fi
  echo ""
}

# ─── Main Orchestration ───────────────────────────────────────────────────────
main() {
  print_banner
  check_not_root
  detect_environment
  source_platform_lib

  # Homebrew install only if --package-manager mode is active
  [[ "${OS}" == "macos" ]] && install_homebrew

  case "${OS}" in
    macos)
      install_xcode_clt
      install_git_macos
      install_node_macos
      install_pnpm
      install_python_macos
      install_docker_macos
      if [[ "${TOOL_MODE}" == "developer" ]]; then
        install_aws_cli_macos
        install_terraform_macos
        install_gh_macos
        install_vercel
      fi
      ;;
    linux)
      check_apt
      install_linux_base
      install_git_linux
      install_node_linux
      install_pnpm
      install_python_linux
      install_docker_linux
      install_docker_compose_linux
      if [[ "${TOOL_MODE}" == "developer" ]]; then
        install_aws_cli_linux
        install_terraform_linux
        install_gh_linux
        install_vercel
      fi
      ;;
  esac

  if [[ "${DRY_RUN}" == "true" ]]; then
    print_dry_run_table
    log_info "Dry run complete. No changes made."
    log_info "Remove --dry-run to execute."
    cleanup_tmpdir
    exit 0
  fi

  verify_path
  verify_all
  setup_project
  generate_report
  print_summary
}

main "$@"
