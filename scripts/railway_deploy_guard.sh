#!/usr/bin/env bash
# Railway staging deployment guard.
#
# Prevents accidental deployment of stale `main` code to the StayOS
# staging/acceptance Railway environment. The Railway service source is
# configured to track `main`, but `main` lacks the current acceptance
# hardening (admin accept/reject 403, booking expiration eager-load,
# discovery stats fix, host profile i18n). Acceptance deployments must
# come from the review branch working tree via `railway up`.
#
# Usage:
#   scripts/railway_deploy_guard.sh            # check only
#   scripts/railway_deploy_guard.sh --deploy   # check + railway up
#
# The guard verifies:
#   1. Current git branch is the accepted review branch.
#   2. Working tree HEAD matches the accepted commit.
#   3. No uncommitted tracked changes (untracked files are allowed).
#   4. `main` is NOT the branch being deployed.
#
# It then invokes `railway up` (directory upload of the working tree),
# which is the established safe mechanism. It NEVER uses
# `railway redeploy --from-source`, which would pull `main`.

set -euo pipefail

cd "$(dirname "$0")/.."

ACCEPTED_BRANCH="product-completion-review"
# Minimum accepted commit — the guard verifies the current HEAD is at or
# ahead of this commit on the review branch. This is the commit that
# introduced the admin accept/reject 403 hardening, booking expiration
# eager-load, discovery stats fix, and host profile i18n.
MINIMUM_ACCEPTED_COMMIT="53660ad6817a8479cf012e389c0bce719c3ddb44"

current_branch="$(git branch --show-current)"
current_commit="$(git rev-parse HEAD)"

echo "=== Railway staging deployment guard ==="
echo "Accepted branch : $ACCEPTED_BRANCH"
echo "Min accepted    : $MINIMUM_ACCEPTED_COMMIT"
echo "Current branch  : $current_branch"
echo "Current commit  : $current_commit"

# 1. Branch check
if [[ "$current_branch" != "$ACCEPTED_BRANCH" ]]; then
    echo "ERROR: current branch '$current_branch' is not the accepted review branch '$ACCEPTED_BRANCH'." >&2
    echo "       Switch to '$ACCEPTED_BRANCH' before deploying." >&2
    exit 1
fi
echo "OK: branch matches accepted review branch."

# 2. Commit ancestry check — current HEAD must be at or ahead of the
#    minimum accepted commit (contains the admin hardening fix).
if ! git merge-base --is-ancestor "$MINIMUM_ACCEPTED_COMMIT" "$current_commit"; then
    echo "ERROR: current commit $current_commit does not contain the minimum accepted commit $MINIMUM_ACCEPTED_COMMIT." >&2
    echo "       The admin accept/reject 403 hardening is missing." >&2
    exit 1
fi
echo "OK: commit contains the minimum accepted hardening."

# 3. Uncommitted tracked changes check
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERROR: uncommitted tracked changes present. Commit or stash before deploying." >&2
    git status --short | head -10 >&2
    exit 1
fi
echo "OK: no uncommitted tracked changes."

# 4. Explicitly warn about the unsafe mechanism
echo ""
echo "WARNING: do NOT use 'railway redeploy --from-source' — it pulls main"
echo "         (which lacks the admin accept/reject 403 hardening)."
echo "         This script uses 'railway up' (working-tree upload)."
echo ""

if [[ "${1:-}" != "--deploy" ]]; then
    echo "Guard checks passed. Re-run with --deploy to execute 'railway up'."
    exit 0
fi

echo "Executing: railway up"
exec railway up
