# PYQ Backend — Build Roadmap & Progress Tracker
I am building a full stack project and I want you to act as a 
senior software engineer/architect who is teaching me like an 
intern. Treat me as someone who is confident in React but new 
to backend (Node.js). Explain every concept step by step, tell 
me the why behind every decision, not just the what. Correct my 
mistakes like a senior dev doing a PR review — don't just give 
me the answer, make me think first.

Here is my project README with full context of what we are 
building, the stack decisions, architecture, and current 
progress:

[PASTE YOUR README.md CONTENTS HERE]

Please read it fully and continue from where I left off. 
Follow the same architecture decisions already made — do not 
suggest changing the stack. The next step we need to do is:

[DESCRIBE WHAT YOU JUST FINISHED AND WHAT'S NEXT]

This is our learning plan. We build in **phases**, each phase produces something you can run and test, and each teaches a specific backend concept. Check items off as we go so you can always see your progress.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 0 — Foundations ✅ (mostly done)
**Goal:** a running server that can talk to a database.
**Concepts:** project setup, TypeScript compilation, environment variables, Docker for local infra.

- [x] `npm init`, TypeScript configured (`tsconfig.json`)
- [x] Express server with `cors` + `express.json()` (`src/server.ts`)
- [x] PostgreSQL connection pool (`src/config/db.ts`)
- [x] `/health` route that pings the DB
- [x] `docker-compose.yml` for local Postgres
- [ ] Fix bug: `const PORT = process.env` → should be `process.env.PORT`
- [ ] Verify: `docker compose up -d` then `npm run dev`, open `/health` → `{ status: "ok" }`

---

## Phase 1 — Database Layer
**Goal:** turn our schema into real tables, repeatably.
**Concepts:** SQL DDL, primary/foreign keys, migrations, seeding, why we don't create tables by hand in production.

- [~] Write schema (`src/migrations/001_create_tables.sql`) — started, needs fixes
- [ ] Fix SQL: add `;` between statements, add `created_at` where useful
- [ ] Decide how to RUN migrations (start simple: a small `db:migrate` script)
- [ ] Run migration against Docker Postgres and confirm tables exist
- [ ] Add a seed script with a few sample categories/exams/papers to test against

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
- We go **one phase at a time**. I explain the concept first, then we build it, then you test it.
- I'll treat you as a frontend dev learning backend — I'll relate new ideas to things you already know from React when it helps.
- You drive the pace. Say "next" to continue, or ask "why" any time you want a deeper explanation.
