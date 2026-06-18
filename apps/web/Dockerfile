# apps/web/Dockerfile  —  build context: repo root
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH="/pnpm/bin:/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# 1. Prune the monorepo to just what @upshot/web needs.
FROM base AS pruner
RUN pnpm add -g turbo@^2.9
COPY . .
RUN turbo prune @upshot/web --docker

# 2. Install deps (cached on the pruned lockfile) + build.
FROM base AS builder
ARG SERVER_ACTIONS_ALLOWED_ORIGINS=upshot.example.com
ENV SERVER_ACTIONS_ALLOWED_ORIGINS=$SERVER_ACTIONS_ALLOWED_ORIGINS
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# turbo prune does not copy root tsconfig.base.json; apps/web/tsconfig.json extends it.
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
# Env-free build — no secrets present; auth/db construct lazily at runtime.
RUN pnpm turbo build --filter @upshot/web

# 3. Minimal runtime: Next standalone server + traced deps (incl. the native .node).
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd -r app && useradd -r -g app app
COPY --from=builder --chown=app:app /app/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /app/apps/web/public ./apps/web/public
# Fail the build loudly if the native encrypted-sqlite binary was not traced in.
RUN find . -name "*.node" -path "*better-sqlite3*" | grep -q . \
  || (echo "FATAL: native better-sqlite3 .node missing from standalone output" && exit 1)
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
