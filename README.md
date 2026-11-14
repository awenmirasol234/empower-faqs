# EMPOWER FAQs — Video Library & Admin CMS

A React + TypeScript + Tailwind CSS web application replicating the EMPOWER FAQ / Video Library experience (`https://empower-faqs.vercel.app`) with a protected Admin CMS backed by Vercel Serverless Functions and **Upstash Redis**.

## Features

- **Public Website (`/`)**:
  - Sticky header with live search (`?q=`), responsive category filter (`?category=` pills on desktop, dropdown on mobile), and `All` / `Popular` / `Newest` sort tabs.
  - Supports both **YouTube Video Cards** (auto-generated thumbnails, `"Most Viewed"` badge, embedded player modal, view counter, transcript & metadata) and **FAQ (Q&A) Cards**.
  - Draft and hidden cards are never exposed by the public API (`GET /api/content`).
- **Protected Admin CMS (`/admin/login`, `/admin`)**:
  - Server-side password verification (`ADMIN_PASSWORD_HASH` via `scrypt` / `sha256` with `crypto.timingSafeEqual`) and signed HTTP-only session cookies stored in Upstash Redis with 24-hour TTL.
  - IP-based login rate limiting (max 5 failed attempts per 15 minutes).
  - Dashboard statistics (Total Cards, Published Cards, Draft Cards, Total Categories).
  - Full CRUD + reordering for categories, video cards, and FAQ cards, with live YouTube URL parsing (`watch?v=`, `youtu.be/`, `shorts/`, `embed/`), thumbnail preview, draft/publish workflows, preview modal, confirmation dialogs, and JSON backup export.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate an admin password hash and copy `.env.example` to `.env.local` (optional for local dev; without Upstash env vars, the dev server uses an in-memory fallback seeded with the reference data):
   ```bash
   npm run hash-password -- "your-admin-password"
   ```

3. Start the Vite dev server (includes `/api/*` middleware):
   ```bash
   npm run dev
   ```

4. Run checks:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

## Environment Variables (Vercel)

Configure these in Vercel Project Settings:

- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (or Vercel Marketplace's `KV_REST_API_URL` & `KV_REST_API_TOKEN`) — From Vercel Marketplace -> Upstash Redis
- `ADMIN_PASSWORD_HASH` — Generated via `npm run hash-password -- "your-password"`
- `SESSION_SECRET` — Random 32+ character secret for signing session cookies
