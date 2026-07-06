# PYQ Papers Platform

## What This Project Is

A platform to provide **free, previous year question papers (PYQs)** for Indian competitive exams — government jobs, banking, SSC, police, teaching exams, university exams, and admission tests — **without requiring login or signup**.

### The Problem Being Solved
Most platforms that provide PYQ papers require login/signup before download, or push users toward paid subscriptions (e.g. Testbook). This project aims to provide a clean, fast, no-login experience for casual users who just want to download a specific paper quickly via Google search.

### Target User
Casual users who land on the site via Google search (e.g. searching "SSC CGL 2023 question paper PDF"). Not built to compete with full test-prep platforms like Testbook — focused purely on quick, frictionless PDF access.

### Project Context / Background
- Built by two React frontend engineers (husband and wife) as a **learning project** to upskill in Node.js, backend architecture, and SEO.
- One of us was recently laid off and is job hunting — this project also serves as a portfolio piece.
- This is NOT primarily a business venture (though light monetization like ads may be added later) — primary goals are: (1) solve a small real-world problem, (2) learn full-stack + SEO skills relevant to the job market.

---

## Architecture

Two separate frontend apps + one backend:

```
User Portal (Next.js)        Admin Portal (React + Vite)
       |                              |
       |                              |
       └────────── REST API ──────────┘
                     |
               Node.js + Express
                     |
                PostgreSQL (metadata)
                     |
                  AWS S3 (PDF files)
```

### Why this stack
- **Next.js for User Portal**: Public-facing pages need strong SEO (server-side rendering, unique metadata per paper page, sitemap generation). Plain React SPA is bad for SEO.
- **React + Vite for Admin Portal**: Internal tool only, no SEO needed, prioritize fast dev experience.
- **Node.js + Express**: Backend learning goal is job-market relevant skills; Express chosen over NestJS/Fastify to learn fundamentals first.
- **PostgreSQL**: Data is relational (Category → Exam → Paper → Year), and SQL skills are in high demand.
- **AWS S3**: Already have an existing S3 bucket; used for storing PDF files. Backend never handles raw file bytes — uses **presigned URLs** for both upload (admin) and download (user).
- **Docker**: Used to run PostgreSQL locally for consistent dev environment across both engineers' machines.

---

## Database Schema (planned)

```
Category
  - id
  - name (e.g. SSC, Banking, Police, UPSC)
  - slug

Exam
  - id
  - category_id (FK)
  - name (e.g. SSC CGL, SBI PO)
  - slug

Paper
  - id
  - exam_id (FK)
  - year
  - shift (optional)
  - language (Hindi / English / Both)
  - s3_key
  - file_size
  - download_count
  - uploaded_at
```

---

## Folder Structure (Backend)

```
pyq-backend/
├── src/
│   ├── config/          → database connection, env setup
│   ├── routes/          → API route definitions
│   ├── controllers/     → business logic for each route
│   ├── models/          → database queries
│   ├── middleware/       → auth checks, error handling
│   ├── types/            → TypeScript interfaces
│   └── server.ts         → entry point
├── .env                  → secrets (gitignored, never commit)
├── .env.example           → committed template of required env vars
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Core Flows

### Admin Upload Flow
1. Admin fills form (category, exam, year, shift, language)
2. Backend generates a **presigned upload URL** from S3
3. Frontend uploads PDF directly to S3 using that URL
4. Backend saves metadata (exam, year, s3_key, etc.) to PostgreSQL

### User Download Flow
1. User finds paper via SEO-optimized page (from Google search) or browsing
2. User clicks download
3. Backend generates a temporary **presigned download URL** (short expiry, e.g. 60s)
4. File downloads directly from S3
5. Backend increments `download_count`

---

## SEO Strategy (User Portal)

- URL structure: `/category/exam/year/shift` (e.g. `/ssc/ssc-cgl/2023/tier-1-shift-1`) — never query-param based
- Unique `<title>` and meta description per paper page, matching real search intent
- ISR (Incremental Static Regeneration) in Next.js for paper pages — fast + auto-updates when new papers added
- Auto-generated `sitemap.xml` from database
- Structured data (Schema.org) on paper pages
- Each exam landing page (e.g. `/ssc/ssc-cgl`) lists all years + a description of the exam, targets broader search terms
- Strategy: target long-tail keywords (e.g. "SSC CGL 2023 Tier 1 Shift 1 question paper PDF") rather than competing for broad terms

---

## Current Status / Progress Log

- [x] Decided on full architecture and stack
- [x] Backend project initialized (`npm init`, TypeScript configured)
- [x] Folder structure created (config, routes, controllers, models, middleware, types)
- [x] `.gitignore` and `.env` / `.env.example` set up
- [x] Docker installed and configured
- [x] `docker-compose.yml` for local PostgreSQL created
- [x] Database connection code (`src/config/db.ts`) with connection pooling
- [x] `src/server.ts` with Express, CORS, middleware, health check endpoint
- [x] Database schema/migrations (`src/migrations/001_create_tables.sql`)
- [x] Migration runner script (`src/config/migrate.ts`)
- [ ] TypeScript interfaces (`src/types/`) — next step
- [ ] Model files (category, exam, paper DB queries) — not yet built
- [ ] Route files (`src/routes/`) — not yet built
- [ ] Controller files (`src/controllers/`) — not yet built
- [ ] JWT auth middleware for admin — not yet built
- [ ] S3 presigned URL integration — not yet built
- [ ] Admin portal (React + Vite) — not started
- [ ] User portal (Next.js) — not started

---

## Learning Goals (keep in mind when suggesting approaches)

- Treat this as a teaching project, not just "build it for me" — explain concepts step by step (separation of concerns, env vars, presigned URLs, SSR/ISR, etc.)
- Prioritize patterns and practices that are **resume-worthy / interview-relevant**, not just "fastest way to ship"
- Both developers are confident in React but new to backend (Node.js) — explain backend concepts assuming junior/intern-level backend knowledge
- Stack/tooling choices should lean toward what's currently valued in the job market (TypeScript, PostgreSQL, Docker, Next.js, AWS)

---

## How to Resume Work With Claude

If starting a new chat session, share this README and say:
> "This is my project, please read the README and continue 
> from where I left off, following the same teaching style 
> and architecture decisions."

### What to tell the next session:
- Stack is fixed — do not suggest changing anything
- Teach like a senior dev to an intern — explain the why, 
  not just the what
- Make me write code myself first before correcting me
- Next step is: TypeScript interfaces in `src/types/` (Phase 2)

See `ROADMAP.md` for the full phase-by-phase build plan and current progress.
