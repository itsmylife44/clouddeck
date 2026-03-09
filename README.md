# CloudDeck

A self-hosted server management dashboard for [Datalix](https://datalix.eu) VPS services. Bring your own API key, manage all your servers from one place.

> **Disclaimer:** CloudDeck is an independent, community-built project. It is **not affiliated with, endorsed by, or sponsored by Datalix** (datalix.eu). All functionality is built on top of the publicly available [Datalix API](https://datalix.eu). "Datalix" is a trademark of its respective owner.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38BDF8?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Server Management** -- Start, stop, restart, shutdown, reinstall, and extend your VPS instances
- **Live Monitoring** -- Real-time CPU, RAM, and network stats with traffic history charts
- **Network Management** -- View IPs, set reverse DNS, manage IPv4/IPv6
- **Backup & Cron** -- Create/restore backups and manage cron jobs
- **noVNC Console** -- Browser-based console access to your servers
- **Role-Based Access Control** -- Granular per-server permissions with bitmask flags (View, Power, Console, Network, Backup, Cron, Reinstall, Extend)
- **Multi-User** -- Admin and user roles with role templates (Viewer, Operator, Manager)
- **Encrypted API Keys** -- AES-256-GCM encryption, keys never leave the server
- **Docker Ready** -- One command to deploy with Docker Compose

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TanStack Query |
| Styling | Tailwind CSS 4, Radix UI, Lucide Icons |
| Backend | Next.js API Routes (BFF proxy to Datalix API) |
| Database | PostgreSQL 16 with Prisma ORM |
| Auth | NextAuth v5 (JWT sessions, bcrypt passwords) |
| Monorepo | Turborepo with npm workspaces |

## Quick Start

### Prerequisites

- **Node.js** 22+
- **Docker** (for PostgreSQL)
- A **Datalix API key** from your [Datalix account](https://datalix.eu)

### 1. Clone and install

```bash
git clone https://github.com/itsmylife44/clouddeck.git
cd clouddeck
npm install
```

### 2. Start development

The easiest way -- starts PostgreSQL in Docker, syncs the database schema, and launches the dev server:

```bash
chmod +x dev.sh
./dev.sh
```

The app will be available at **http://localhost:3001**.

On first visit, you'll be guided through creating an admin account and adding your Datalix API key.

### 3. Manual setup (alternative)

```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Start PostgreSQL
npm run docker:dev

# Sync database schema
npm run db:push

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DB_PASSWORD` | Yes | Database password (used by Docker Compose) |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret |
| `NEXTAUTH_URL` | Yes | App base URL (e.g. `http://localhost:3000`) |
| `ENCRYPTION_SECRET` | Yes | 64 hex chars for AES-256 API key encryption |
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` |

Generate all secrets automatically:

```bash
chmod +x setup-env.sh
./setup-env.sh
```

This creates a `.env` file with cryptographically secure passwords and secrets. Use `./setup-env.sh --force` to regenerate.

## Production Deployment

### Docker Compose (recommended)

```bash
# 1. Generate production secrets
./setup-env.sh

# 2. Edit .env -- set NEXTAUTH_URL to your domain
#    NEXTAUTH_URL=https://cloud.yourdomain.com

# 3. Build and start
npm run docker:prod
```

This starts PostgreSQL and the Next.js standalone server in a security-hardened configuration:

- Read-only filesystem with tmpfs for caches
- All Linux capabilities dropped (except NET_BIND_SERVICE)
- `no-new-privileges` security option
- Non-root user inside container
- Health checks on both database and app
- Database not exposed to host network

### Manual

```bash
./setup-env.sh
npm run build
cd apps/web && npm start
```

## Permissions System

CloudDeck uses a **bitmask-based RBAC** system for granular server access control:

| Flag | Value | Description |
|------|-------|-------------|
| View | 1 | See server details, status, IPs, monitoring |
| Power | 2 | Start, stop, restart, shutdown |
| Console | 4 | noVNC browser console access |
| Network | 8 | Set reverse DNS, manage IPs |
| Backup | 16 | Create, restore, delete backups |
| Cron | 32 | Manage cron jobs |
| Reinstall | 64 | Reinstall operating system |
| Extend | 128 | Extend service lifetime, hide server |

**Role templates** for quick assignment:

| Template | Flags | Mask |
|----------|-------|------|
| Viewer | View | 1 |
| Operator | View, Power, Console, Backup | 23 |
| Manager | All | 255 |

Admins have full access to all servers. Regular users see only servers they've been granted access to.

## Project Structure

```
clouddeck/
├── apps/web/                  # Next.js application
│   ├── src/
│   │   ├── app/               # Pages and API routes
│   │   │   ├── (dashboard)/   # Protected dashboard pages
│   │   │   └── api/           # BFF API routes
│   │   ├── components/        # React components
│   │   ├── hooks/             # TanStack Query hooks
│   │   └── lib/               # Utilities, auth, encryption
│   └── prisma/                # Database schema
├── packages/
│   └── datalix-client/        # Typed Datalix API client
├── docker-compose.yml         # Production setup
├── docker-compose.dev.yml     # Development setup
├── setup-env.sh               # Generate production secrets
└── dev.sh                     # One-command dev startup
```

## Scripts

| Command | Description |
|---------|-------------|
| `./setup-env.sh` | Generate production secrets into `.env` |
| `./dev.sh` | Start everything (Docker DB + dev server) |
| `./dev.sh down` | Stop all containers |
| `./dev.sh reset` | Reset database to clean state |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run docker:prod` | Production deploy |

## Security

- API keys are encrypted with **AES-256-GCM** before storage -- never stored in plaintext
- All Datalix API calls are proxied server-side -- keys never reach the browser
- Passwords hashed with **bcrypt** (12 rounds)
- User roles re-validated from database on every API request (no stale JWT bypass)
- Per-server permission checks with bitmask flags on all 13 API routes
- Server-side admin layout guard on all `/admin` routes
- Production Docker uses read-only filesystem, dropped Linux capabilities, and non-root user
- Input validation with **Zod** on all API endpoints
- Generated secrets use `openssl` with cryptographic randomness

## Disclaimer

CloudDeck is an independent, open-source project. It is **not affiliated with, endorsed by, or sponsored by Datalix** (datalix.eu) in any way. This project uses the publicly available Datalix API. All product names, trademarks, and registered trademarks are property of their respective owners. Use of this software is at your own risk.

## License

MIT
