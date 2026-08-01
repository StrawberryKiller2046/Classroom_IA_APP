# Classroom Activity Generator — Product Spec (Practice Build)

Single mobile-installable PWA. All copy and UI in English.

---

## 1. Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **AI:** Gemini API (Flash model)
- **PDF export:** jsPDF (client-side) or server-side HTML-to-PDF in an Edge Function
- **PWA:** manifest.json + service worker ("Install app")

## 2. Gemini API — where to get it and how limits work

- Get the key at **aistudio.google.com** → Get API key. Enable billing in Google Cloud Console before real users touch the app (avoids free-tier rate limits killing the app during traffic spikes).
- Store the key **only** as a Supabase Edge Function secret (`GEMINI_API_KEY`), never in client code.
- **Generation limits are enforced server-side.** Add a `usage_counters` table (`user_id`, `month`, `generations_used`). The Edge Function checks the counter **before** calling Gemini and rejects the request if the user is over their monthly quota. The frontend only reflects what the server says — never trust a client-side counter.

## 3. Main Product — Activity Generator

Form fields (matches the reference app, English labels):
- Country / curriculum region
- Education level
- Grade / year
- Subject
- Specific topic (optional)
- Exercise type
- Difficulty
- Number of exercises

**New requirements from this session:**
- **Exam name field** — free text, defaults to something like `{Subject} - {Grade} - {Date}`, editable before generating.
- **"Include answer sheet" toggle** — when on, the Gemini response includes the answer key in the same structured JSON as the exercises.
- **Critical:** the answer key must be **saved to the database** (`activities.answer_key` JSON column) at generation time, not only baked into the PDF. This is what lets the Auto-Corrector pull the answer key directly without anyone downloading or re-parsing a PDF.

Gemini call must return structured JSON, not free text:
```json
{
  "exam_name": "string",
  "exercises": [
    { "id": "string", "question": "string", "type": "mc|tf|short", "options": ["..."]?, "correct_answer": "string" }
  ]
}
```

## 4. Bonus 1 — Classroom Management + Auto-Corrector

- Create/edit **classrooms**: name, grade, subject
- Add **students** to a classroom (name, optional notes)
- Link a generated activity to a classroom
- **Quick-capture grading screen:** teacher transcribes each student's answers, one student at a time, question by question
  - Adaptive keyboard per question type: numeric pad, TF buttons, A/B/C/D buttons, short-text field
  - Short-text comparison is **normalized** before matching: lowercase, strip accents, trim whitespace — otherwise correct answers get marked wrong over trivial formatting differences
  - Pulls `correct_answer` directly from `activities.answer_key` in the DB — zero AI cost, zero PDF handling
- **Results summary per classroom:** average score, which questions the group missed most, per-student breakdown

## 5. Bonus 2 — Multi-Classroom Management

- Dashboard view across **all** of a teacher's classrooms simultaneously (not just one at a time)
- Aggregate stats: compare performance across classrooms/grades
- Filter/sort classrooms by subject, grade, or recent activity

## 6. Data Model (Supabase tables)

- `users` (Supabase Auth)
- `purchases` (Hotmart transaction id, plan, status)
- `usage_counters` (user_id, month, generations_used)
- `activities` (user_id, exam_name, subject, country, grade, topic, difficulty, exercises JSON, answer_key JSON, pdf_url)
- `classrooms` (user_id, name, grade, subject)
- `students` (classroom_id, name, notes)
- `grading_results` (student_id, activity_id, answers JSON, score, graded_at)

## 7. Explicitly Out of Scope for This Build

- No Bonus 3 / support system — focus is the app itself.
- No payment gateway integration yet — assume `purchases` table is seeded manually for testing.

---

# Setup Instructions

## A. Push everything to your GitHub

1. Create an empty repo on GitHub (via the website, or `gh repo create your-username/classroom-app --private --source=. --remote=origin` if you have the GitHub CLI installed).
2. In your project folder, initialize git if it isn't already:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/classroom-app.git
   git push -u origin main
   ```
3. Add a `.gitignore` with at minimum:
   ```
   node_modules/
   .env
   dist/
   ```
4. Once you connect this repo to Lovable later, point Lovable at this **existing** repo instead of letting it create a new one — it will import this code as its starting point and sync from there.

## B. VS Code with a phone-sized preview

There's no built-in "phone frame" panel in VS Code, but you can get an embedded, resizable preview without leaving the editor:

1. Install the **"Live Preview"** extension by Microsoft (`ms-vscode.live-server`) from the Extensions panel.
2. Run your dev server as usual: `npm run dev` (Vite will serve on something like `localhost:5173`).
3. Open the Command Palette (`Cmd/Ctrl+Shift+P`) → **"Live Preview: Show Preview"**, point it at your local dev server URL. This opens an embedded browser tab inside VS Code.
4. Resize that panel to roughly phone width (~390px), or use the device-emulation dropdown if your Live Preview version has one, to approximate an iPhone viewport while you work.

If later you want a *true* device simulator (not just a resized browser), that requires Chrome DevTools' device toolbar (outside VS Code) or migrating to Expo/React Native with an actual simulator — bigger scope than this practice build needs.

## C. Using your Claude Code skills (Impeccable, design-taste-frontend, emil-design-eng)

- Confirm the skills live in `.claude/skills/` inside this project (or `~/.claude/skills/` for personal, cross-project use). If you created them elsewhere, copy the folders in.
- Claude Code **auto-triggers** a skill when your prompt matches its description — you don't have to invoke it manually. For UI work, just describing what you want (e.g. *"build the activity generator form"*) should be enough for `design-taste-frontend` and `impeccable` to kick in, since their descriptions cover exactly this kind of frontend work.
- To force one explicitly, reference it by name directly in your prompt: *"Using the emil-design-eng skill, polish the transition on the grading screen."*
- Good first prompt to Claude Code, once the repo above is pushed:
  > "Using this spec (paste product-spec.md), scaffold the React + Vite + Tailwind + shadcn/ui frontend and the Supabase schema. Apply the impeccable and design-taste-frontend skills for the UI. Start with the Activity Generator screen."
