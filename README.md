# Modern Todo App

A full-stack todo application built with a production-grade monorepo setup. This project covers everything from local development to automated deployments on a real server with a custom domain.

**Live:** https://todo.milindjamnekar.dev
**API Docs:** https://todo.milindjamnekar.dev/api/docs

---

## What's Inside

```
modern-todo-app/
├── apps/
│   ├── api/          # NestJS REST API (port 4000)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── types/        # Shared TypeScript types used by both apps
│   └── tsconfig/     # Shared TypeScript configs
├── .github/
│   └── workflows/    # CI/CD pipelines
└── docker-compose.yml
```

**Why a monorepo?** Both the API and web app share types (like `Todo`, `User`, `AuthTokens`). With a monorepo, any change to a shared type immediately shows a type error in both places — no out-of-sync interfaces across repos.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Monorepo | Turborepo + pnpm | Parallel task execution, shared cache, workspace linking |
| Backend | NestJS 10 + TypeORM | Structured, decorator-based, production patterns built-in |
| Database | PostgreSQL | Reliable relational DB with full TypeORM support |
| Frontend | Next.js 14 App Router | File-based routing, server components, great DX |
| State | TanStack Query | Server state management, caching, background refetch |
| Auth | JWT (access + refresh) | Stateless, scalable, standard pattern |
| UI | shadcn/ui + Tailwind | Accessible components, easy to customize |
| Containers | Docker + Compose | Same environment everywhere — dev, CI, production |
| CI/CD | GitHub Actions | Automated lint, test, build, deploy on every push |

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd modern-todo-app
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and set your JWT secrets (anything works locally)

# 3. Start PostgreSQL
docker compose up -d postgres

# 4. Start both apps
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api
- Swagger docs: http://localhost:4000/api/docs

The API auto-creates database tables on startup (`DATABASE_SYNCHRONIZE=true` in dev).

---

## Environment Variables

Create a `.env` file at the root (copy from `.env.example`):

```env
# Database (matches docker-compose postgres service)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=todo_db
DATABASE_SYNCHRONIZE=true   # auto-creates tables, set false in production
DATABASE_SSL=false           # set true if your DB requires SSL

# JWT — change these in production!
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production-too
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API server
API_PORT=4000
API_PREFIX=api

# Frontend (points to the API)
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# CORS — which origins the API accepts requests from
ALLOWED_ORIGINS=http://localhost:3000
```

---

## Project Structure

### Backend — `apps/api`

```
src/
├── auth/          # Login, register, logout, token refresh
├── todos/         # CRUD for todos with filtering and pagination
├── users/         # User management
└── common/        # Global filters, interceptors, decorators
```

**Auth flow:**
1. `POST /api/auth/register` — creates user, returns access + refresh tokens
2. `POST /api/auth/login` — validates credentials, returns tokens
3. Access token lasts 15 minutes. When it expires, the frontend automatically calls `POST /api/auth/refresh` to get a new one using the refresh token (7 days)
4. All todo endpoints require a valid access token in the `Authorization: Bearer <token>` header

**Todo endpoints:**
- `GET /api/todos` — list with pagination, status filter, title search
- `POST /api/todos` — create
- `PATCH /api/todos/:id` — update
- `DELETE /api/todos/:id` — delete
- `GET /api/todos/stats` — count per status (used for the stats bar)

Every response is wrapped in `{ success: true, data: ... }` by a global interceptor. Errors return `{ success: false, message: "..." }`.

### Frontend — `apps/web`

```
src/
├── app/
│   ├── (auth)/login       # Login page
│   ├── (auth)/register    # Register page
│   └── (dashboard)/todos  # Main todo dashboard
├── components/            # UI components (TodoList, TodoForm, Filters, etc.)
├── hooks/                 # useAuth, useTodos — TanStack Query wrappers
├── lib/
│   ├── api.ts             # Axios instance with auto token refresh
│   ├── auth.ts            # Token helpers, login/register/logout functions
│   └── todos.ts           # Todo API functions
├── providers/             # QueryProvider, ThemeProvider
└── middleware.ts          # Redirects unauthenticated users to /login
```

**How auth works on the frontend:**
- After login, tokens are stored in cookies (`accessToken`, `refreshToken`)
- Every API request automatically attaches the access token via an Axios interceptor
- If a request returns 401, the interceptor pauses all pending requests, refreshes the token, then retries them — completely transparent to the UI
- Next.js middleware checks for the `accessToken` cookie on every page load and redirects to `/login` if missing

### Shared Types — `packages/types`

Both apps import from `@repo/types`:

```typescript
import { Todo, TodoStatus, TodoPriority, User, AuthTokens } from '@repo/types';
```

This prevents the API and frontend from drifting apart. If you rename a field in the type, TypeScript will immediately show errors in both places.

---

## Testing

```bash
# Unit tests (services and controllers)
pnpm --filter @repo/api test

# Unit tests with coverage report
pnpm --filter @repo/api test:cov

# End-to-end tests (full HTTP lifecycle)
pnpm --filter @repo/api test:e2e
```

**Unit tests** (45 tests) test each service and controller in isolation using Jest mocks.

**E2E tests** (36 tests) spin up the full NestJS app with an in-memory SQLite database and fire real HTTP requests using Supertest. No PostgreSQL needed — they run in CI without any external services.

SQLite compatibility note: we use `type: 'simple-enum'` instead of `type: 'enum'` in entities because SQLite doesn't support native enum columns.

---

## Docker

### Run everything with Docker Compose

```bash
docker compose up
```

This starts PostgreSQL, the API, and the web app together.

### How the Dockerfiles work

Both Dockerfiles use **multi-stage builds** to keep production images small:

1. **deps stage** — installs all dependencies
2. **build stage** — compiles TypeScript / builds Next.js
3. **runner stage** — copies only what's needed to run the app, no source files or dev dependencies

The build context is the **monorepo root** (not the app folder), because the Dockerfiles need access to `pnpm-lock.yaml` and `pnpm-workspace.yaml` at the root. This is why the CD pipeline uses:

```yaml
context: .
file: apps/api/Dockerfile
```

---

## CI/CD Pipeline

### CI — runs on every push and pull request

**File:** `.github/workflows/ci.yml`

```
push/PR → setup → lint → type-check → test:unit → test:e2e → build
```

All jobs run in parallel where possible. Dependencies are cached using pnpm store caching to keep runs fast.

### CD — runs after CI passes on `main`

**File:** `.github/workflows/cd.yml`

```
CI passes → build API image → build Web image → deploy via SSH
                ↓                    ↓
           push to GHCR         push to GHCR
                         ↓
               SSH into server
               docker compose up
               health check
```

The CD workflow uses `workflow_run` trigger instead of `push` — this ensures deployment only happens after the full CI suite passes, not simultaneously.

Docker images are pushed to GitHub Container Registry (GHCR) with these tags:
- `latest` — always points to the newest main branch build
- `sha-<commit>` — immutable tag for each build
- `main` — branch tag

### PR Checks

**File:** `.github/workflows/pr-checks.yml`

- **Conventional Commits** — PR titles must follow the format `feat: ...`, `fix: ...`, `chore: ...`, etc.
- **PR size labels** — automatically labels PRs as `xs`, `s`, `m`, `l` based on lines changed

### Dependency Updates

**File:** `.github/dependabot.yml`

Dependabot runs weekly and groups related updates into single PRs:
- `nestjs` group — all `@nestjs/*` packages together
- `next` + `react` group — frontend framework packages
- `testing` group — Jest, Supertest, etc.

This avoids 20 individual PRs every week.

---

## Deployment

The app runs on a DigitalOcean Droplet behind Nginx with SSL from Let's Encrypt.

### Server setup (one-time)

1. Create a VPS (Ubuntu 22.04)
2. Create a deploy user, add your SSH public key
3. Install Docker and Docker Compose
4. Create `~/todo-app/docker-compose.yml` with your environment variables

### GitHub Secrets required

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server IP address |
| `DEPLOY_USER` | SSH username on server |
| `DEPLOY_SSH_KEY` | Private SSH key for deploy user |
| `JWT_SECRET` | Production JWT signing secret |
| `JWT_REFRESH_SECRET` | Production refresh token secret |
| `DATABASE_PASSWORD` | Production database password |

### GitHub Variables required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://todo.milindjamnekar.dev/api` |
| `APP_URL` | `https://todo.milindjamnekar.dev` |

### Nginx reverse proxy

Nginx sits in front of both apps and routes traffic:

```
https://todo.milindjamnekar.dev/      → localhost:3000 (Next.js)
https://todo.milindjamnekar.dev/api   → localhost:4000 (NestJS)
```

SSL certificates are managed by Certbot (Let's Encrypt) and auto-renew every 90 days.

### How a deploy works end-to-end

1. You push to `main`
2. CI runs — lint, type-check, unit tests, e2e tests, build
3. If CI passes, CD starts automatically
4. CD builds Docker images for `linux/amd64` and `linux/arm64` (multi-platform for compatibility)
5. Images are pushed to GHCR
6. CD SSHes into the server, pulls the new images, runs `docker compose up -d`
7. Health check hits `/api/health` to confirm the deployment worked
8. If anything fails, a comment is posted on the relevant GitHub issue

---

## Available Scripts

```bash
# Run all apps in dev mode
pnpm dev

# Build all packages
pnpm build

# Lint everything
pnpm lint

# Type-check everything
pnpm type-check

# Run API unit tests
pnpm --filter @repo/api test

# Run API e2e tests
pnpm --filter @repo/api test:e2e

# Format all files
pnpm format

# Clean build outputs and cache
pnpm clean
```
