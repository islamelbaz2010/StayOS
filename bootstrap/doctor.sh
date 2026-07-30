#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║              StayOS — Bootstrap Doctor v2.0                                 ║
# ║              Diagnoses your workstation. Never modifies anything.           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./bootstrap/doctor.sh           # Print report to terminal
#   ./bootstrap/doctor.sh --json    # Machine-readable JSON output
#   ./bootstrap/doctor.sh --quiet   # Only print errors/warnings
#
# The doctor ONLY diagnoses. Run bootstrap.sh to fix problems.

set -uo pipefail
IFS=$'\n\t'

DOCTOR_VERSION="2.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPORT_FILE="${REPO_ROOT}/DOCTOR_REPORT.md"

# ─── Flags ────────────────────────────────────────────────────────────────────
JSON_MODE=false
QUIET_MODE=false
for arg in "$@"; do
  case "${arg}" in
    --json)  JSON_MODE=true ;;
    --quiet) QUIET_MODE=true ;;
    --help|-h)
      echo "Usage: $0 [--json] [--quiet] [--help]"
      echo "  --json    Machine-readable output"
      echo "  --quiet   Only print failures and warnings"
      exit 0
      ;;
    *) echo "Unknown flag: ${arg}" >&2 ;;
  esac
done

# ─── Source common lib ────────────────────────────────────────────────────────
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

# ─── Minimum Versions ────────────────────────────────────────────────────────
readonly MIN_NODE_VERSION="20"
readonly MIN_PYTHON_VERSION="3.11"
readonly MIN_PNPM_VERSION="8"
readonly MIN_DOCKER_VERSION="24"
readonly MIN_TERRAFORM_VERSION="1.5"
readonly MIN_AWS_CLI_VERSION="2"
readonly MIN_GH_VERSION="2"
readonly MIN_GIT_VERSION="2.30"

# ─── Counters ─────────────────────────────────────────────────────────────────
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

# ─── Result tracking ──────────────────────────────────────────────────────────
declare -a CHECK_NAMES=()
declare -a CHECK_STATUSES=()   # PASS | WARN | FAIL
declare -a CHECK_DETAILS=()
declare -a CHECK_FIXES=()

record_check() {
  # record_check <name> <status> <detail> <fix>
  CHECK_NAMES+=("$1")
  CHECK_STATUSES+=("$2")
  CHECK_DETAILS+=("$3")
  CHECK_FIXES+=("$4")
  case "$2" in
    PASS) PASS_COUNT=$(( PASS_COUNT + 1 )) ;;
    WARN) WARN_COUNT=$(( WARN_COUNT + 1 )) ;;
    FAIL) FAIL_COUNT=$(( FAIL_COUNT + 1 )) ;;
  esac
}

# ─── Banner ───────────────────────────────────────────────────────────────────
if [[ "${QUIET_MODE}" == "false" ]] && [[ "${JSON_MODE}" == "false" ]]; then
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${CYAN}║   StayOS Workstation Doctor v${DOCTOR_VERSION}               ║${RESET}"
  echo -e "${BOLD}${CYAN}║   Read-only diagnostic — modifies nothing           ║${RESET}"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}"
  echo ""
  echo -e "  OS:   $(uname -s) $(uname -r)"
  echo -e "  Arch: $(uname -m)"
  echo -e "  User: ${USER:-$(whoami)}"
  echo ""
fi

# ─── Check Functions ──────────────────────────────────────────────────────────

check_tool() {
  # check_tool <display_name> <cmd> <min_version> <version_flag> <official_installer_hint>
  local name="$1" cmd="$2" min="$3" flag="$4" fix="$5"
  local status detail

  if ! command_exists "${cmd}"; then
    record_check "${name}" "FAIL" "${cmd} not found in PATH" "${fix}"
    return
  fi

  local raw_version
  raw_version=$("${cmd}" "${flag}" 2>&1 | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 || true)

  if [[ -z "${raw_version}" ]]; then
    record_check "${name}" "WARN" "${cmd} found but version unreadable" "Run: ${cmd} ${flag}"
    return
  fi

  if [[ -n "${min}" ]]; then
    if version_gte "${raw_version}" "${min}"; then
      status="PASS"
      detail="v${raw_version} (minimum v${min} ✓)"
    else
      status="WARN"
      detail="v${raw_version} — below minimum v${min}"
      fix="Upgrade: ${fix}"
    fi
  else
    status="PASS"
    detail="v${raw_version}"
  fi

  record_check "${name}" "${status}" "${detail}" "${fix}"
}

check_docker() {
  local name="Docker"

  if ! command_exists docker; then
    record_check "${name}" "FAIL" "docker not found in PATH" \
      "Official DMG: https://desktop.docker.com/mac/main/amd64/Docker.dmg (Intel) or arm64/Docker.dmg (Apple Silicon). Or run: ./bootstrap/bootstrap.sh"
    return
  fi

  local ver
  ver=$(docker --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "unknown")
  local detail="v${ver}"

  if ! docker info &>/dev/null 2>&1; then
    record_check "${name}" "WARN" "${detail} — daemon not running" \
      "Start Docker Desktop from /Applications/Docker.app (macOS) or: sudo systemctl start docker (Linux)"
    return
  fi

  # Docker Compose V2
  if ! docker compose version &>/dev/null 2>&1; then
    record_check "Docker Compose" "WARN" "docker compose plugin not available" \
      "Install Docker Desktop (includes Compose V2) or: sudo apt install docker-compose-plugin (Ubuntu)"
  else
    local cv
    cv=$(docker compose version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1)
    record_check "Docker Compose" "PASS" "v${cv} (V2 plugin)" ""
  fi

  if version_gte "${ver}" "${MIN_DOCKER_VERSION}"; then
    record_check "${name}" "PASS" "${detail} — daemon running" ""
  else
    record_check "${name}" "WARN" "${detail} — below minimum v${MIN_DOCKER_VERSION}" \
      "Upgrade Docker Desktop from https://docs.docker.com/desktop/install/"
  fi
}

check_python_venv() {
  if [[ -f "${REPO_ROOT}/.venv/bin/python" ]]; then
    local ver
    ver=$("${REPO_ROOT}/.venv/bin/python" --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    record_check "Python venv" "PASS" ".venv active, python v${ver}" ""
  elif [[ -f "${REPO_ROOT}/requirements.txt" ]]; then
    record_check "Python venv" "WARN" ".venv not found — project deps not installed" \
      "Run: ./bootstrap/bootstrap.sh  (or: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt)"
  else
    record_check "Python venv" "PASS" "No requirements.txt — skipped" ""
  fi
}

check_pnpm_workspace() {
  if [[ -f "${REPO_ROOT}/pnpm-workspace.yaml" ]]; then
    if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
      record_check "pnpm workspace" "WARN" "node_modules not installed" \
        "Run: pnpm install  (from repo root)"
    else
      record_check "pnpm workspace" "PASS" "node_modules present" ""
    fi
  else
    record_check "pnpm workspace" "PASS" "No pnpm-workspace.yaml — skipped" ""
  fi
}

check_env_file() {
  if [[ -f "${REPO_ROOT}/.env" ]]; then
    record_check ".env file" "PASS" ".env present" ""
    if grep -q "CHANGE_ME\|your-secret\|xxx\|<.*>" "${REPO_ROOT}/.env" 2>/dev/null; then
      record_check ".env values" "WARN" ".env may contain placeholder secrets" \
        "Edit .env and set real values for all placeholder entries"
    fi
  else
    record_check ".env file" "WARN" ".env not found" \
      "Run: cp .env.example .env  then fill in real secrets"
  fi
}

check_git_config() {
  local name="Git config"
  local user_name user_email
  user_name=$(git config --global user.name 2>/dev/null || true)
  user_email=$(git config --global user.email 2>/dev/null || true)

  if [[ -z "${user_name}" ]] || [[ -z "${user_email}" ]]; then
    record_check "${name}" "WARN" "git user.name or user.email not set" \
      "Run: git config --global user.name 'Your Name' && git config --global user.email 'you@example.com'"
  else
    record_check "${name}" "PASS" "${user_name} <${user_email}>" ""
  fi
}

check_aws_credentials() {
  if ! command_exists aws; then return; fi
  if aws sts get-caller-identity &>/dev/null 2>&1; then
    local account
    account=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "unknown")
    record_check "AWS auth" "PASS" "authenticated (account: ${account})" ""
  else
    record_check "AWS auth" "WARN" "AWS CLI found but not authenticated" \
      "Run: aws configure  (set region: me-central-1 for MENA)"
  fi
}

check_gh_auth() {
  if ! command_exists gh; then return; fi
  if gh auth status &>/dev/null 2>&1; then
    local user
    user=$(gh api user --jq .login 2>/dev/null || echo "unknown")
    record_check "GitHub CLI auth" "PASS" "authenticated as ${user}" ""
  else
    record_check "GitHub CLI auth" "WARN" "gh CLI found but not authenticated" \
      "Run: gh auth login"
  fi
}

check_vercel_auth() {
  if ! command_exists vercel; then return; fi
  if vercel whoami &>/dev/null 2>&1; then
    local who
    who=$(vercel whoami 2>/dev/null | tail -1 || echo "unknown")
    record_check "Vercel auth" "PASS" "authenticated as ${who}" ""
  else
    record_check "Vercel auth" "WARN" "vercel CLI found but not authenticated" \
      "Run: vercel login"
  fi
}

check_ports() {
  local -a required_ports=(5432 6379 8000 3000)
  local -a port_names=(PostgreSQL Redis FastAPI Next.js)
  local i
  for (( i = 0; i < ${#required_ports[@]}; i++ )); do
    local port="${required_ports[i]}"
    local service="${port_names[i]}"
    if lsof -nP -iTCP:"${port}" -sTCP:LISTEN &>/dev/null 2>&1; then
      record_check "Port ${port} (${service})" "PASS" "listening" ""
    else
      record_check "Port ${port} (${service})" "WARN" "not listening" \
        "Start service: docker compose up -d  (or check if service crashed)"
    fi
  done
}

check_disk_space_doctor() {
  local available_kb
  available_kb=$(df -k / | awk 'NR==2 {print $4}')
  local available_gb=$(( available_kb / 1024 / 1024 ))
  if [[ "${available_gb}" -lt 5 ]]; then
    record_check "Disk space" "FAIL" "Only ${available_gb}GB free on /" \
      "Free up disk space — minimum 10GB recommended for Docker images"
  elif [[ "${available_gb}" -lt 10 ]]; then
    record_check "Disk space" "WARN" "${available_gb}GB free (recommend 10+GB)" \
      "Consider freeing up disk space before pulling Docker images"
  else
    record_check "Disk space" "PASS" "${available_gb}GB free" ""
  fi
}

check_internet_doctor() {
  if check_internet; then
    record_check "Internet" "PASS" "reachable" ""
  else
    record_check "Internet" "FAIL" "no connection" \
      "Check your network connection"
  fi
}

# ─── Run All Checks ───────────────────────────────────────────────────────────
run_checks() {
  check_internet_doctor
  check_disk_space_doctor

  check_tool "Git" git "${MIN_GIT_VERSION}" "--version" \
    "macOS: xcode-select --install  or  https://git-scm.com/downloads"

  check_tool "Node.js" node "${MIN_NODE_VERSION}" "--version" \
    "Official .pkg: https://nodejs.org/dist/v20.18.0/node-v20.18.0.pkg  (or run: ./bootstrap/bootstrap.sh)"

  check_tool "npm" npm "" "--version" \
    "npm is bundled with Node.js. Reinstall Node: https://nodejs.org/dist/"

  check_tool "pnpm" pnpm "${MIN_PNPM_VERSION}" "--version" \
    "npm install -g pnpm  (NEVER: brew install pnpm)"

  check_tool "Python 3" python3 "${MIN_PYTHON_VERSION}" "--version" \
    "Official .pkg: https://www.python.org/ftp/python/3.11.10/python-3.11.10-macos11.pkg  (or run: ./bootstrap/bootstrap.sh)"

  check_docker

  check_tool "AWS CLI" aws "${MIN_AWS_CLI_VERSION}" "--version" \
    "Official .pkg: https://awscli.amazonaws.com/AWSCLIV2.pkg  (NEVER: brew install awscli)"
  check_aws_credentials

  check_tool "Terraform" terraform "${MIN_TERRAFORM_VERSION}" "version" \
    "Official binary: https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_darwin_amd64.zip  (NEVER: brew tap hashicorp)"

  check_tool "GitHub CLI" gh "${MIN_GH_VERSION}" "--version" \
    "Official zip: https://github.com/cli/cli/releases/download/v2.57.0/gh_2.57.0_macOS_amd64.zip  (or run: ./bootstrap/bootstrap.sh)"
  check_gh_auth

  if command_exists vercel; then
    local ver
    ver=$(vercel --version 2>/dev/null | head -1 || echo "unknown")
    record_check "Vercel CLI" "PASS" "${ver}" ""
    check_vercel_auth
  else
    record_check "Vercel CLI" "WARN" "not installed (required for frontend deploys)" \
      "npm install -g vercel  (NEVER: brew install vercel)"
  fi

  if command_exists flutter; then
    local fver
    fver=$(flutter --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "unknown")
    record_check "Flutter" "PASS" "v${fver}" ""
  else
    record_check "Flutter" "WARN" "not installed (required for mobile)" \
      "Official download: https://docs.flutter.dev/get-started/install  (direct tar.xz, not brew)"
  fi

  check_git_config
  check_env_file
  check_python_venv
  check_pnpm_workspace
  check_ports
}

# ─── Print Terminal Report ────────────────────────────────────────────────────
print_terminal_report() {
  local i
  echo ""
  printf "${BOLD}%-28s %-8s %s${RESET}\n" "Check" "Status" "Detail"
  printf "%s\n" "────────────────────────────────────────────────────────────────────────────────"

  for (( i = 0; i < ${#CHECK_NAMES[@]}; i++ )); do
    local n="${CHECK_NAMES[i]}" s="${CHECK_STATUSES[i]}" d="${CHECK_DETAILS[i]}"
    local status_colored
    case "${s}" in
      PASS) status_colored="${GREEN}PASS${RESET}" ;;
      WARN) status_colored="${YELLOW}WARN${RESET}" ;;
      FAIL) status_colored="${RED}FAIL${RESET}" ;;
    esac
    printf "%-28s " "${n}"
    echo -e "${status_colored}    ${d}"
  done

  echo ""
  printf "%s\n" "────────────────────────────────────────────────────────────────────────────────"
  echo -e "  ${GREEN}PASS: ${PASS_COUNT}${RESET}   ${YELLOW}WARN: ${WARN_COUNT}${RESET}   ${RED}FAIL: ${FAIL_COUNT}${RESET}"
  echo ""

  local have_issues=false
  for (( i = 0; i < ${#CHECK_NAMES[@]}; i++ )); do
    local s="${CHECK_STATUSES[i]}" f="${CHECK_FIXES[i]}"
    if [[ "${s}" != "PASS" ]] && [[ -n "${f}" ]]; then
      if [[ "${have_issues}" == "false" ]]; then
        echo -e "${BOLD}Fix Recommendations:${RESET}"
        have_issues=true
      fi
      local n="${CHECK_NAMES[i]}"
      local bullet
      case "${s}" in
        WARN) bullet="${YELLOW}▸${RESET}" ;;
        FAIL) bullet="${RED}▶${RESET}" ;;
      esac
      echo -e "  ${bullet} ${BOLD}${n}:${RESET} ${f}"
    fi
  done
  [[ "${have_issues}" == "true" ]] && echo ""
  echo -e "${DIM}Run ./bootstrap/bootstrap.sh to auto-install missing tools${RESET}"
  echo ""
}

# ─── JSON Report ─────────────────────────────────────────────────────────────
print_json_report() {
  local i
  printf '{"doctor_version":"%s","timestamp":"%s","pass":%d,"warn":%d,"fail":%d,"checks":[' \
    "${DOCTOR_VERSION}" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    "${PASS_COUNT}" "${WARN_COUNT}" "${FAIL_COUNT}"
  local first=true
  for (( i = 0; i < ${#CHECK_NAMES[@]}; i++ )); do
    [[ "${first}" == "false" ]] && printf ','
    printf '{"name":"%s","status":"%s","detail":"%s","fix":"%s"}' \
      "${CHECK_NAMES[i]}" "${CHECK_STATUSES[i]}" \
      "${CHECK_DETAILS[i]//\"/\\\"}" "${CHECK_FIXES[i]//\"/\\\"}"
    first=false
  done
  printf ']}\n'
}

# ─── Markdown Report ─────────────────────────────────────────────────────────
write_markdown_report() {
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local i

  local rows=""
  for (( i = 0; i < ${#CHECK_NAMES[@]}; i++ )); do
    local s="${CHECK_STATUSES[i]}"
    local icon
    case "${s}" in
      PASS) icon="✅" ;;
      WARN) icon="⚠️" ;;
      FAIL) icon="❌" ;;
    esac
    rows="${rows}| ${CHECK_NAMES[i]} | ${icon} ${s} | ${CHECK_DETAILS[i]} |
"
  done

  local fix_rows=""
  for (( i = 0; i < ${#CHECK_NAMES[@]}; i++ )); do
    local s="${CHECK_STATUSES[i]}" f="${CHECK_FIXES[i]}"
    if [[ "${s}" != "PASS" ]] && [[ -n "${f}" ]]; then
      fix_rows="${fix_rows}### ${CHECK_NAMES[i]} (${s})
\`${f}\`

"
    fi
  done

  cat > "${REPORT_FILE}" <<REPORT
# DOCTOR REPORT
## StayOS Workstation Diagnostic v${DOCTOR_VERSION}

**Generated:** ${timestamp}
**OS:** $(uname -s) $(uname -r)
**Architecture:** $(uname -m)
**User:** ${USER:-$(whoami)}

---

## Summary

| ✅ PASS | ⚠️  WARN | ❌ FAIL |
|---------|---------|---------|
| ${PASS_COUNT} | ${WARN_COUNT} | ${FAIL_COUNT} |

---

## Results

| Check | Status | Detail |
|-------|--------|--------|
${rows}

---

## Fix Recommendations

${fix_rows:-_No fixes needed._}

---

## How to Fix Everything

\`\`\`bash
./bootstrap/bootstrap.sh
\`\`\`

## Installation Strategy (v2.0 — Official Installer First)

| Tool | Correct Method | Never Do This |
|------|----------------|---------------|
| Docker | Official DMG from docker.com | brew install --cask docker |
| Node.js | nodejs.org .pkg installer | brew install node |
| pnpm | \`npm install -g pnpm\` | brew install pnpm |
| Python | python.org .pkg installer | brew install python |
| AWS CLI | awscli.amazonaws.com AWSCLIV2.pkg | brew install awscli |
| Terraform | releases.hashicorp.com binary zip | brew tap hashicorp |
| GitHub CLI | github.com/cli/cli releases zip | (brew install gh is ok) |
| Vercel CLI | \`npm install -g vercel\` | brew install vercel |
| Flutter | docs.flutter.dev direct download | brew install flutter |

To allow Homebrew as fallback: \`./bootstrap/bootstrap.sh --package-manager\`

$([ "${FAIL_COUNT}" -gt 0 ] && echo "## ❌ ${FAIL_COUNT} critical issue(s) — run bootstrap.sh" || \
  echo "## ✅ No critical issues.")
REPORT

  log_success "DOCTOR_REPORT.md written to ${REPORT_FILE}"
}

# ─── Entry Point ──────────────────────────────────────────────────────────────
run_checks

if [[ "${JSON_MODE}" == "true" ]]; then
  print_json_report
elif [[ "${QUIET_MODE}" == "true" ]]; then
  local i
  for (( i = 0; i < ${#CHECK_NAMES[@]}; i++ )); do
    [[ "${CHECK_STATUSES[i]}" != "PASS" ]] && \
      printf "[%s] %s: %s\n" "${CHECK_STATUSES[i]}" "${CHECK_NAMES[i]}" "${CHECK_DETAILS[i]}"
  done
  write_markdown_report
else
  print_terminal_report
  write_markdown_report
fi

exit "${FAIL_COUNT}"
