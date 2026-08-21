#!/usr/bin/env bash
#
# Push local env values into GitHub Actions secrets.
#
#   ./scripts/push-github-secrets.sh            # dry run - lists names only
#   ./scripts/push-github-secrets.sh --commit   # actually sets them
#
# Values are piped straight from the source file into `gh secret set` via stdin.
# They are never passed as command-line arguments (which would expose them in
# `ps` output and shell history) and are never echoed. The script prints secret
# NAMES only.
#
# ---------------------------------------------------------------------------
# WARNING: every value these files contain was committed to git history and
# must be treated as compromised. See SECRET_ROTATION.md. Running this stores
# the LEAKED values in GitHub. Prefer rotating first, then running this once
# against the new values.
# ---------------------------------------------------------------------------

set -euo pipefail

REPO="${REPO:-RhyminTyman/mover-item-identifier-video-email}"
COMMIT=0
[ "${1:-}" = "--commit" ] && COMMIT=1

# Precedence order. .env.vercel is a `vercel env pull` export and is the
# authoritative production config; .env.local.backup only fills gaps.
#
# This ordering matters: .env.local.backup contains DUPLICATE, TRUNCATED Clerk
# keys (28 and 21 chars, versus the real 50 and 59). Naive dotenv "last value
# wins" parsing picks the broken ones and silently breaks auth in CI.
SOURCES=(".env.vercel" ".env.local.backup")

# Secrets referenced by .github/workflows/*.yml
SECRETS=(
  AWS_REGION
  CLERK_SECRET_KEY
  DATABASE_URL
  DIRECT_URL
  NEXT_PUBLIC_BASE_URL
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  OPENAI_API_KEY
  RESEND_API_KEY
  UPSTASH_REDIS_REST_TOKEN
  UPSTASH_REDIS_REST_URL
)

command -v gh >/dev/null || { echo "error: gh CLI not installed" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "error: run 'gh auth login' first" >&2; exit 1; }

# Emit one variable's value on stdout, or exit 1 if not found.
# First real (non-placeholder) occurrence wins, searching SOURCES in order.
extract() {
  python3 - "$1" "${SOURCES[@]}" <<'PY'
import sys, os, re
name, files = sys.argv[1], sys.argv[2:]
placeholder = re.compile(r'^(your_|your-|\?|changeme|placeholder|xxx|ep-xxx|username)', re.I)
for f in files:
    if not os.path.exists(f):
        continue
    for line in open(f):
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, _, v = line.partition('=')
        if k.strip() != name:
            continue
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in '"\'':
            v = v[1:-1]
        if v and not placeholder.match(v):
            sys.stdout.write(v)
            sys.exit(0)
sys.exit(1)
PY
}

echo "repo:    $REPO"
echo "sources: ${SOURCES[*]}"
[ "$COMMIT" -eq 1 ] && echo "mode:    COMMIT" || echo "mode:    dry run (pass --commit to apply)"
echo

missing=0
for name in "${SECRETS[@]}"; do
  if ! extract "$name" >/dev/null 2>&1; then
    printf '  %-36s no value found - set manually\n' "$name"
    missing=$((missing + 1))
    continue
  fi

  if [ "$COMMIT" -eq 1 ]; then
    if extract "$name" | gh secret set "$name" --repo "$REPO" >/dev/null 2>&1; then
      printf '  %-36s set\n' "$name"
    else
      printf '  %-36s FAILED\n' "$name"
    fi
  else
    printf '  %-36s would set\n' "$name"
  fi
done

echo
echo "Not sourceable from any local file - set these by hand:"
echo "  AWS_ACCESS_KEY_ID      AWS_SECRET_ACCESS_KEY   AWS_S3_BUCKET"
echo "  VERCEL_TOKEN           VERCEL_ORG_ID           VERCEL_PROJECT_ID"
echo
echo "  gh secret set VERCEL_TOKEN --repo $REPO      # prompts, value not echoed"
echo
[ "$missing" -gt 0 ] && echo "note: $missing of the listed secrets had no usable local value."
echo "Verify with:  gh secret list --repo $REPO"
echo "Reminder: these values are compromised until rotated - see SECRET_ROTATION.md"
