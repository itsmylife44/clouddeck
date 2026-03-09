#!/usr/bin/env bash
set -euo pipefail

# ─── CloudDeck Environment Setup ─────────────────────────────────
# Generates all required secrets and writes a production-ready .env file.
#
# Usage:
#   ./setup-env.sh              Create .env with generated secrets
#   ./setup-env.sh --force      Overwrite existing .env

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[Setup]${NC} $1"; }
success() { echo -e "${GREEN}[Setup]${NC} $1"; }
warn() { echo -e "${YELLOW}[Setup]${NC} $1"; }
err() { echo -e "${RED}[Setup]${NC} $1"; }

# ─── Check dependencies ─────────────────────────────────────────
if ! command -v openssl >/dev/null 2>&1; then
  err "openssl is required but not found. Install it and retry."
  exit 1
fi

# ─── Check if .env already exists ────────────────────────────────
if [ -f "$ENV_FILE" ] && [ "${1:-}" != "--force" ]; then
  warn ".env already exists. Use --force to overwrite."
  exit 0
fi

# ─── Generate secrets ────────────────────────────────────────────
log "Generating secrets..."

generate_password() {
  local pw
  pw=$(openssl rand -base64 48 | tr -d '/+=')
  printf '%s' "${pw:0:32}"
}

generate_base64() {
  openssl rand -base64 32 | tr -d '\n#'
}

generate_hex() {
  openssl rand -hex 32
}

DB_PASSWORD="$(generate_password)"
NEXTAUTH_SECRET="$(generate_base64)"
ENCRYPTION_SECRET="$(generate_hex)"

# Validate all secrets were generated
for var_name in DB_PASSWORD NEXTAUTH_SECRET ENCRYPTION_SECRET; do
  if [ -z "${!var_name}" ]; then
    err "Secret generation failed for $var_name. Is openssl working?"
    exit 1
  fi
done

# ─── Write .env ──────────────────────────────────────────────────
cat > "$ENV_FILE" <<EOF
# ─── Database ────────────────────────────────────────────────────
DB_PASSWORD="${DB_PASSWORD}"
DATABASE_URL="postgresql://clouddeck:${DB_PASSWORD}@localhost:5432/clouddeck"

# ─── Auth ────────────────────────────────────────────────────────
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL=http://localhost:3000

# ─── Encryption (AES-256-GCM for API key storage) ───────────────
ENCRYPTION_SECRET="${ENCRYPTION_SECRET}"

# ─── App ─────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=production
EOF

chmod 600 "$ENV_FILE"

# ─── Summary ─────────────────────────────────────────────────────
echo ""
success ".env created at $ENV_FILE (permissions: 600)"
echo ""
echo -e "  DB_PASSWORD:       ${YELLOW}generated${NC} (32 chars)"
echo -e "  NEXTAUTH_SECRET:   ${YELLOW}generated${NC} (base64)"
echo -e "  ENCRYPTION_SECRET: ${YELLOW}generated${NC} (64 hex chars)"
echo ""
warn "Review .env and adjust NEXTAUTH_URL for your domain before deploying."
echo ""
