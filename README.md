# Clase Rápida

A mobile-installable PWA for teachers: generate curriculum-aligned exams with AI, export them to PDF, manage classrooms and students, and grade submissions in class with a quick-capture screen that pulls answers straight from the database.

## Demo mode

Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` set, the app runs entirely on local sample data (`src/lib/mock-store.ts`, persisted to `localStorage`) instead of erroring out — a seeded classroom, students, and a graded activity are there from the first load, and every screen (including "AI" generation, which returns clearly-labeled `[Demo]` placeholder questions) is fully clickable. This is what's live on GitHub Pages right now. Setting those two env vars — locally in `.env`, or as repo secrets for the deployed build — switches every screen over to the real Supabase-backed implementation with no other code changes.

## Tech stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **AI:** Gemini API (Flash model), called server-side only
- **PDF export:** jsPDF (client-side)
- **PWA:** `vite-plugin-pwa` (manifest + service worker, installable)

## Project structure

```
src/
  pages/            route-level screens (ActivityGenerator, Classrooms, ClassroomDetail, GradingScreen, Dashboard)
  components/ui/    shadcn/ui primitives
  components/       feature components (activities, classrooms, grading, layout)
  lib/               supabase client, API wrappers, PDF export, auth context, answer normalization
  types/database.ts  types mirroring the Supabase schema
supabase/
  migrations/0001_init.sql       full schema + RLS policies
  functions/generate-activity/    Edge Function that calls Gemini and persists activities
```

## Try it on your phone (GitHub Pages)

Every push to `main` builds and deploys automatically via `.github/workflows/deploy-pages.yml` to:

```
https://<your-github-username>.github.io/<this-repo-name>/
```

One-time setup after the first push: in the repo, go to **Settings → Pages → Source** and select **GitHub Actions**. The workflow will then run and the URL above will go live a minute or two later — open it on your phone to add it to your home screen (it's a PWA).

No Supabase/Gemini credentials are required for this to build and load — the UI renders fully; screens just show a friendly "couldn't start a session" message until a backend is connected (see below).

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/0001_init.sql` against your project (SQL editor, or `supabase db push` with the CLI).
3. **Enable Anonymous sign-ins**: Authentication → Providers → Anonymous. There is no login screen — every visitor gets a Supabase anonymous session automatically on first load, and all data is scoped to that session's `auth.uid()` via RLS, same as a regular signed-in user would be.
4. Copy `.env.example` to `.env` and fill in your project URL and anon key for local dev:
   ```bash
   cp .env.example .env
   ```
5. For the deployed GitHub Pages build, add the same two values as repo secrets: **Settings → Secrets and variables → Actions → New repository secret** — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The next push (or a manual re-run of the "Deploy to GitHub Pages" workflow) will pick them up.
6. Seed a row in `purchases` manually for any test user until the payment gateway is wired up (out of scope for this build).

## 2. Set up Gemini

1. Get an API key at **aistudio.google.com** → Get API key.
2. Enable billing in Google Cloud Console before real users touch the app, to avoid free-tier rate limits during traffic spikes.
3. Set it as a Supabase Edge Function secret — **never** in client code:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-key-here
   ```

## 3. Deploy the Edge Function

```bash
supabase functions deploy generate-activity
```

The function checks `usage_counters` **before** calling Gemini and rejects requests over the monthly quota (30 generations/month by default — see `MONTHLY_GENERATION_LIMIT` in `supabase/functions/generate-activity/index.ts`). The frontend only ever reflects what the server reports; it never enforces quota itself.

## 4. Run the app

```bash
npm install
npm run dev
```

Vite serves on `http://localhost:5173`.

## 5. Install as a PWA

Once deployed to a real HTTPS origin, browsers will offer an "Install app" prompt (or use the browser menu → Install). Icons and manifest live in `public/icons/` and are wired up in `vite.config.ts`.

## Data model

See `supabase/migrations/0001_init.sql` for the full schema. Summary:

- `activities` — generated exams, including `exercises` and `answer_key` JSON columns. The answer key is persisted at generation time regardless of whether the answer sheet is printed on the PDF, so the Auto-Corrector never needs to parse a PDF.
- `classrooms` / `students` — teacher-owned classrooms and their rosters.
- `grading_results` — one row per graded submission (`answers` JSON + computed `score`).
- `usage_counters` — server-authoritative monthly generation count.
- `purchases` — manually seeded for now; no payment gateway integration yet.

All tables are protected by Row Level Security scoped to the owning teacher (`auth.uid()`).

## Notes on the Auto-Corrector

The quick-capture grading screen adapts its input per question type (multiple choice buttons, True/False buttons, or a text/numeric field depending on the expected answer). Short-answer comparisons are normalized — lowercased, accent-stripped, and trimmed — before matching against `answer_key`, so trivial formatting differences don't mark a correct answer wrong.

## Out of scope for this build

- Bonus 3 / support system
- Payment gateway integration (`purchases` is seeded manually for testing)
