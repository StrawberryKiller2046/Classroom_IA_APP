-- Classroom Activity Generator — initial schema
-- Auth is handled by Supabase's built-in `auth.users` table.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- purchases (manually seeded for testing until a payment gateway is wired up)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hotmart_transaction_id text not null,
  plan text not null default 'standard',
  status text not null default 'active' check (status in ('active', 'pending', 'cancelled', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases(user_id);

-- ─────────────────────────────────────────────────────────────
-- usage_counters — server-side generation quota, checked by the Edge Function
-- before every Gemini call. Never trust a client-side counter.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null, -- 'YYYY-MM'
  generations_used integer not null default 0,
  primary key (user_id, month)
);

-- ─────────────────────────────────────────────────────────────
-- activities
-- ─────────────────────────────────────────────────────────────
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- classroom_id references public.classrooms(id), added as an ALTER TABLE
  -- further down once that table exists (it's defined after this one).
  classroom_id uuid,
  exam_name text not null,
  subject text not null,
  country text not null,
  education_level text not null,
  grade text not null,
  topic text,
  exercise_type text not null,
  difficulty text not null,
  num_exercises integer not null,
  include_answer_sheet boolean not null default false,
  exercises jsonb not null default '[]'::jsonb,
  answer_key jsonb,
  pdf_url text,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_id_idx on public.activities(user_id);
create index if not exists activities_classroom_id_idx on public.activities(classroom_id);

-- ─────────────────────────────────────────────────────────────
-- classrooms
-- ─────────────────────────────────────────────────────────────
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  grade text not null,
  subject text not null,
  created_at timestamptz not null default now()
);

create index if not exists classrooms_user_id_idx on public.classrooms(user_id);

-- activities.classroom_id references classrooms, which is defined after it —
-- add the FK now that both tables exist.
alter table public.activities
  drop constraint if exists activities_classroom_id_fkey;
alter table public.activities
  add constraint activities_classroom_id_fkey
  foreign key (classroom_id) references public.classrooms(id) on delete set null;

-- ─────────────────────────────────────────────────────────────
-- students
-- ─────────────────────────────────────────────────────────────
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists students_classroom_id_idx on public.students(classroom_id);

-- ─────────────────────────────────────────────────────────────
-- grading_results
-- ─────────────────────────────────────────────────────────────
create table if not exists public.grading_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score numeric not null,
  graded_at timestamptz not null default now()
);

create index if not exists grading_results_student_id_idx on public.grading_results(student_id);
create index if not exists grading_results_activity_id_idx on public.grading_results(activity_id);

-- ═════════════════════════════════════════════════════════════
-- Row Level Security — every table is scoped to the owning teacher
-- ═════════════════════════════════════════════════════════════
alter table public.purchases enable row level security;
alter table public.usage_counters enable row level security;
alter table public.activities enable row level security;
alter table public.classrooms enable row level security;
alter table public.students enable row level security;
alter table public.grading_results enable row level security;

drop policy if exists "purchases: owner read" on public.purchases;
create policy "purchases: owner read" on public.purchases
  for select using (auth.uid() = user_id);

drop policy if exists "usage_counters: owner read" on public.usage_counters;
create policy "usage_counters: owner read" on public.usage_counters
  for select using (auth.uid() = user_id);
-- inserts/updates to usage_counters happen only via the service-role key inside the Edge Function

drop policy if exists "activities: owner full access" on public.activities;
create policy "activities: owner full access" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "classrooms: owner full access" on public.classrooms;
create policy "classrooms: owner full access" on public.classrooms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "students: owner full access via classroom" on public.students;
create policy "students: owner full access via classroom" on public.students
  for all using (
    exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid())
  );

drop policy if exists "grading_results: owner full access via student" on public.grading_results;
create policy "grading_results: owner full access via student" on public.grading_results
  for all using (
    exists (
      select 1 from public.students s
      join public.classrooms c on c.id = s.classroom_id
      where s.id = student_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.students s
      join public.classrooms c on c.id = s.classroom_id
      where s.id = student_id and c.user_id = auth.uid()
    )
  );
