# Tech Stack

## Backend (this repo)
- **Runtime**: Node.js
- **Language**: TypeScript (strict mode)
- **Framework**: Express 5
- **Database**: PostgreSQL via the `pg` library (using a connection `Pool`)
- **Config**: `dotenv` for environment variables
- **Middleware**: `cors`, `express.json()`
- **Dev tooling**: `ts-node-dev` (respawn + transpile-only for fast reloads)

## File Storage
- **AWS S3** for PDF files. The backend never streams file bytes — it issues **presigned URLs** for upload and download.

## Local Infrastructure
- **Docker Compose** runs PostgreSQL locally (`postgres:16`) for a consistent dev environment. See `docker-compose.yml`.

## Frontends (separate repos, not here)
- **User Portal**: Next.js (SSR/ISR, SEO-critical)
- **Admin Portal**: React + Vite (internal tool)

## Common Commands
```bash
# Install dependencies
npm install

# Run dev server with hot reload (ts-node-dev)
npm run dev

# Compile TypeScript to ./dist
npm run build

# Run the compiled production build
npm start

# Start local PostgreSQL (Docker)
docker compose up -d

# Stop local PostgreSQL
docker compose down
```

## TypeScript Conventions
- `strict: true` is on. Also enabled: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`.
- Because of `verbatimModuleSyntax`, use `import type { ... }` for type-only imports.
- Source lives in `src/`, compiled output goes to `dist/`. Entry point is `src/server.ts`.
- Module resolution is `nodenext`, target `esnext`.

## Environment Variables
Defined in `.env` (gitignored) with a committed template in `.env.example`:
- `PORT` — server port (default 5000)
- `DATABASE_URL` — Postgres connection string
- `NODE_ENV` — `development` / `production`

Never commit `.env` or real secrets. Load env vars via `dotenv.config()` before using them.

## Notes / Gotchas
- `src/server.ts` currently reads `process.env` instead of `process.env.PORT` for the port — fix when touching that area.
- Prefer parameterized queries (`pool.query(text, values)`) to avoid SQL injection.
