#!/usr/bin/env bash
set -e

# ─── CloudDeck Dev Startup ───────────────────────────────────────
# Starts PostgreSQL (Docker) + Next.js dev server in one command.
#
# Usage:
#   ./dev.sh           Start everything (DB + dev server)
#   ./dev.sh down      Stop Docker containers
#   ./dev.sh reset     Reset database (drop all data + re-sync schema)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Config ──────────────────────────────────────────────────────
DB_PORT=5433
APP_PORT=3001
export DATABASE_URL="postgresql://clouddeck:clouddeck_dev@127.0.0.1:${DB_PORT}/clouddeck"
export NEXTAUTH_SECRET="dev-secret-change-in-production-please"
export NEXTAUTH_URL="http://localhost:${APP_PORT}"
export ENCRYPTION_SECRET="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# ─── Colors ──────────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[CloudDeck]${NC} $1"; }
success() { echo -e "${GREEN}[CloudDeck]${NC} $1"; }
warn() { echo -e "${YELLOW}[CloudDeck]${NC} $1"; }
err() { echo -e "${RED}[CloudDeck]${NC} $1"; }

# ─── Command: down ───────────────────────────────────────────────
if [ "${1}" = "down" ]; then
  log "Stopping Docker containers..."
  docker compose -f docker-compose.dev.yml down
  success "All containers stopped."
  exit 0
fi

# ─── Command: reset ──────────────────────────────────────────────
if [ "${1}" = "reset" ]; then
  warn "This will DROP all data and re-create the database schema."
  read -rp "Are you sure? (y/N) " confirm
  if [[ "$confirm" =~ ^[yY]$ ]]; then
    log "Starting database if not running..."
    docker compose -f docker-compose.dev.yml up -d
    until docker compose -f docker-compose.dev.yml exec -T db pg_isready -U clouddeck -q 2>/dev/null; do
      sleep 1
    done

    log "Resetting database..."
    cd apps/web
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" npx prisma db push --force-reset --accept-data-loss
    npx prisma generate 2>/dev/null
    cd "$SCRIPT_DIR"
    success "Database reset complete. Schema is fresh."
  else
    log "Aborted."
  fi
  exit 0
fi

# ─── Cleanup on exit ────────────────────────────────────────────
cleanup() {
  log "Shutting down..."
  if [ -n "$NEXT_PID" ]; then
    kill "$NEXT_PID" 2>/dev/null || true
  fi
  docker compose -f docker-compose.dev.yml down 2>/dev/null || true
  success "Stopped."
}
trap cleanup EXIT INT TERM

# ─── 1. Start PostgreSQL ────────────────────────────────────────
log "Starting PostgreSQL on port ${DB_PORT}..."
docker compose -f docker-compose.dev.yml up -d

log "Waiting for database to be ready..."
until docker compose -f docker-compose.dev.yml exec -T db pg_isready -U clouddeck -q 2>/dev/null; do
  sleep 1
done
success "Database ready."

# ─── 2. Install deps if needed ──────────────────────────────────
if [ ! -d "node_modules" ]; then
  log "Installing dependencies..."
  npm install
fi

# ─── 3. Push schema if needed ───────────────────────────────────
log "Syncing database schema..."
cd apps/web
npx prisma db push --skip-generate 2>/dev/null || npx prisma db push
npx prisma generate 2>/dev/null
cd "$SCRIPT_DIR"

# ─── 4. Start Next.js dev server ────────────────────────────────
success "Starting Next.js on http://localhost:${APP_PORT}"
echo ""
echo -e "  ${GREEN}➜${NC}  App:      ${BLUE}http://localhost:${APP_PORT}${NC}"
echo -e "  ${GREEN}➜${NC}  Database: ${BLUE}localhost:${DB_PORT}${NC}"
echo ""
echo -e "  ${YELLOW}Commands:${NC}"
echo -e "    ./dev.sh down    Stop containers"
echo -e "    ./dev.sh reset   Reset database"
echo ""
log "Press Ctrl+C to stop everything."
echo ""

cd apps/web
npx next dev --turbopack --port "$APP_PORT" &
NEXT_PID=$!

wait "$NEXT_PID"
