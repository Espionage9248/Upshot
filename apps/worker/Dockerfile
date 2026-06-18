# apps/worker/Dockerfile  —  build context: repo root
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH="/pnpm/bin:/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS pruner
RUN pnpm add -g turbo@^2.9
COPY . .
RUN turbo prune @upshot/worker --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
RUN pnpm turbo build --filter @upshot/worker

FROM base AS runner
ENV NODE_ENV=production MIGRATIONS_DIR=/app/packages/db/drizzle
RUN groupadd -r app && useradd -r -g app app
COPY --from=builder --chown=app:app /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder --chown=app:app /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/packages/db/drizzle ./packages/db/drizzle
RUN find . -name "*.node" -path "*better-sqlite3*" | grep -q . \
  || (echo "FATAL: native better-sqlite3 .node missing from worker image" && exit 1)
USER app
CMD ["node", "apps/worker/dist/index.js"]
