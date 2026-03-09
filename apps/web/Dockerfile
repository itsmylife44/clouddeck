FROM node:22-alpine AS base

# ─── Dependencies ───────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace root + all package.json files
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/datalix-client/package.json ./packages/datalix-client/

# Copy Prisma schema so postinstall "prisma generate" works
COPY apps/web/src/prisma ./apps/web/src/prisma

RUN npm ci

# ─── Build ──────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/datalix-client/node_modules ./packages/datalix-client/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build the datalix-client package first, then the web app
RUN npm run build --workspace=@clouddeck/datalix-client && \
    npm run build --workspace=@clouddeck/web

# ─── Production ────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
