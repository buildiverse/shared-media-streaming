# Shared Media Streaming

A web app where two people can share a piece of media together

This project is built using Turborepo for efficient monorepo management.

## MVP validation goal:

Can handle 10 users across the app.

Shared media playbook + basic interaction

### Features:

- Storage upload
- Database and metadata storage
- Client media player
- Realtime media sync
- Chat
- Interface

### Tech Stack

**Frontend:**
- React + Redux Toolkit (for app-wide state)
- Zustand (for local/lightweight state)
- TailwindCSS (for styling)

**Backend:**
- Node.js + Express.js for APIs
- Socket.IO for real‑time media sync

**Database:**
- MongoDB (fast iteration for MVP). If relational features become essential, we can migrate or add PostgreSQL later.

**Storage:**
- S3

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `frontend`: React application for the client interface
- `backend`: Node.js/Express.js server for APIs and real-time sync
- `@repo/shared`: Shared types and utilities between frontend and backend

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Biome](https://biomejs.dev/) for code linting and formatting
- [Prettier](https://prettier.io) for code formatting

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

To develop all apps and packages, run the following command:

```bash
# Start all applications in development mode
pnpm run dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```bash
# Start only the frontend
pnpm run dev --filter=frontend

# Start only the backend
pnpm run dev --filter=backend
```

### Build

To build all apps and packages:

```bash
pnpm run build
```

To build specific packages:

```bash
# Build backend
pnpm run build:backend

# Build shared package
pnpm run build:shared
```

### Production

To start the production server:

```bash
pnpm run start:prod
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
