#build base
FROM node:lts-alpine3.22 AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

#install dep
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json tsconfig.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/backend/tsconfig.json apps/backend/

#todo: fix --no-frozen-lockfile
RUN pnpm install --no-frozen-lockfile

#build with turborepo
FROM deps AS builder

COPY turbo.json ./
COPY apps ./apps
COPY packages ./packages

#build only backend
RUN pnpm turbo run build --filter=backend...

FROM base AS production

RUN addgroup -g 1001 -S nodejs && adduser -S backend -u 1001

WORKDIR /app

#copy only minimal runtime requirements
COPY pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY package.json tsconfig.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/backend/tsconfig.json apps/backend/

RUN pnpm install --no-frozen-lockfile --prod

#copy built from build stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

RUN mkdir -p logs && chown -R backend:nodejs logs

USER backend

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["pnpm", "start", "--filter", "backend..."]