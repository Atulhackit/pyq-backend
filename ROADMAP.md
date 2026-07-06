# PYQ Backend — Build Roadmap & Progress Tracker

This is our learning plan. We build in **phases**, each phase produces something you can run and test, and each teaches a specific backend concept. Check items off as we go so you can always see your progress.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

> **Current position:** Phase 1 done ✅ — next up is a seed script, then Phase 2 (Categories, full stack).

---

## Phase 0 — Foundations ✅
**Goal:** a running server that can talk to a database.
**Concepts:** project setup, TypeScript compilation, environment variables, Docker for local infra.

- [x] `npm init`, TypeScript configured (`tsconfig.json`)
- [x] Express server with `cors` + `express.json()` (`src/server.ts`)
- [x] PostgreSQL connection pool (`src/config/db.ts`)
- [x] `/health` route that pings the DB
- [x] `docker-compose.yml` for local Postgres (host port **5433** → container 5432)
- [x] Fixed bug: `PORT` now reads `process.env.PORT || 5000`
- [ ] Known issue to revisit: `tsc` build fails due to `verbatimModuleSyntax` + `"type": "commonjs"` mismatch (works fine under `ts-node-dev`; fix before Phase 7 build/deploy)

---

## Phase 1 — Database Layer ✅
**Goal:** turn our schema into real tables, repeatably.
**Concepts:** SQL DDL, primary/foreign keys, migrations, seeding, why we don't create tables by hand in production.

- [x] Write schema (`src/migrations/001_create_tables.sql`) with correct commas, FKs, unique slugs
- [x] Write a migration runner (`src/config/migrate.ts`) + `npm run migrate`
- [x] Run migration against Docker Postgres and confirm tables exist (`\dt`)
- [ ] Add a seed script with a few sample categories/exams/papers to test against

### Debugging lessons learned (Phase 1 war stories)
- Node was v10 (EOL) → upgraded to v20 LTS. Libraries declare required Node "engines".
- `.env` didn't exist (it's gitignored) → must be created from `.env.example`.
- Postgres bakes credentials on **first volume init**; `docker compose down -v` resets them.
- A **native Windows Postgres** was squatting on port 5432 → moved Docker to host port **5433** to avoid the conflict.
- Key skill: `psql` via socket uses `trust` (no password); TCP uses real password auth — they test different things.

---

## Phase 2 — First Feature: Categories (the full stack, end to end)
**Goal:** build ONE resource through every layer so you learn separation of concerns.
**Concepts:** the `routes → controller → model → db` flow, typed request/response, parameterized queries.

- [ ] `src/types/category.ts` — the `Category` interface
- [ ] `src/models/category.model.ts` — SQL queries (getAll, getBySlug, create)
- [ ] `src/controllers/category.controller.ts` — request handling, calls the model
- [ ] `src/routes/category.routes.ts` — defines `GET /api/categories` etc.
- [ ] Wire routes into `server.ts`
- [ ] Test each endpoint (browser / curl / REST client)

> This phase is the most important for learning. Once you understand it, Exams and Papers are the same pattern repeated.

---

## Phase 3 — Exams & Papers
**Goal:** repeat the layered pattern for the remaining resources, including nested data.
**Concepts:** foreign keys in practice, JOINs, nested routes.

- [ ] Exams: type, model, controller, routes (`GET /api/categories/:slug/exams`)
- [ ] Papers: type, model, controller, routes (`GET /api/exams/:slug/papers`)
- [ ] A "get one paper by full slug path" query (needed for the SEO pages)

---

## Phase 4 — Error Handling & Validation
**Goal:** stop copy-pasting try/catch everywhere; validate input before it hits the DB.
**Concepts:** Express error middleware, custom error classes, an async wrapper, input validation (e.g. `zod`).

- [ ] Central error-handling middleware (`src/middleware/errorHandler.ts`)
- [ ] Custom `AppError` class + consistent error JSON shape
- [ ] Async wrapper so controllers don't each need try/catch
- [ ] Validate request bodies/params (introduce `zod`)

---

## Phase 5 — File Storage with S3 (the core feature)
**Goal:** upload and download PDFs without the backend ever touching the bytes.
**Concepts:** AWS S3, presigned URLs, why this pattern is secure and scalable.

- [ ] Add AWS SDK + S3 config (bucket name, region, credentials via env)
- [ ] `POST /api/admin/papers/upload-url` → returns a presigned **upload** URL
- [ ] Save paper metadata after successful upload
- [ ] `GET /api/papers/:id/download-url` → returns a short-lived presigned **download** URL
- [ ] Increment `download_count` on download

---

## Phase 6 — Admin Authentication
**Goal:** protect the admin-only endpoints (upload, create, delete).
**Concepts:** auth middleware, secrets, why public read routes stay open but writes are locked.

- [ ] Choose a simple approach first (API key or JWT) and understand the tradeoffs
- [ ] Auth middleware guarding `/api/admin/*` routes
- [ ] Keep all public read routes open (no login for users — core product rule)

---

## Phase 7 — Polish & Production-Readiness
**Goal:** the things that make it resume-worthy.
**Concepts:** config validation, logging, pagination, slugs, deployment.

- [ ] Fix the `tsc` build (module/verbatimModuleSyntax config) so `npm run build` works
- [ ] Validate env vars on startup (fail fast if missing)
- [ ] Request logging (e.g. `morgan`)
- [ ] Pagination on list endpoints
- [ ] Auto-generate slugs from names
- [ ] Prepare for deployment (build, env, hosting)

---

## After the Backend
- [ ] Admin Portal (React + Vite) — consumes the admin API
- [ ] User Portal (Next.js) — SEO pages, presigned downloads, sitemap

---

## How We Work Together
- We go **one phase at a time**. I explain the concept first, you write the code, then I review it.
- I'll treat you as a frontend dev learning backend — I'll relate new ideas to things you already know from React when it helps.
- You drive the pace. Say "next" to continue, or ask "why" any time you want a deeper explanation.
