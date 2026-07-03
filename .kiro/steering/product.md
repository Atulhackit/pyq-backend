# Product

## What This Is
PYQ Papers Platform — a website providing **free previous year question papers (PYQs)** for Indian competitive exams (SSC, banking, police, UPSC, teaching, university, etc.), with **no login or signup required**.

## The Problem
Most PYQ sites gate downloads behind login/signup or push paid subscriptions. This project offers a clean, fast, frictionless experience for users who just want to grab a specific paper.

## Target User
Casual users arriving via Google search (e.g. "SSC CGL 2023 question paper PDF"). This is not a test-prep competitor — the focus is purely quick, no-login PDF access. SEO is therefore a first-class concern.

## This Repository
`pyq-backend` — the Node.js + Express + PostgreSQL REST API. It serves two separate frontends (not in this repo): a public **User Portal** (Next.js, SEO-focused) and an internal **Admin Portal** (React + Vite).

## Core Flows
- **Admin upload**: Admin submits paper metadata → backend returns an S3 **presigned upload URL** → frontend uploads the PDF directly to S3 → backend saves metadata to PostgreSQL.
- **User download**: User opens an SEO page → clicks download → backend returns a short-lived S3 **presigned download URL** → file downloads directly from S3 → backend increments `download_count`.

Key rule: the backend **never handles raw PDF bytes**. All file transfer happens directly between the client and S3 via presigned URLs.

## Context for Working on This Project
- This is a **learning project** built by two React engineers new to backend/Node.js. It doubles as a portfolio/job-hunting piece.
- Treat it as a **teaching project**: explain backend concepts (separation of concerns, env vars, presigned URLs, SSR/ISR) at a junior backend level.
- Prefer patterns that are **resume-worthy and interview-relevant** over the fastest way to ship.
- Monetization (light ads) may come later but is not a primary goal.
