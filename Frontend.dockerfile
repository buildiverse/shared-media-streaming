FROM node:24-alpine

RUN corepack enable

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ./apps/frontend/package.json ./apps/frontend/

RUN pnpm install --no-frozen-lockfile

COPY apps/frontend/ .

EXPOSE 5173

CMD ["npx", "turbo", "run", "dev", "--filter=frontend", "--parallel", "--", "--host"]