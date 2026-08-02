-- Lesson planner: a manual weekly schedule the teacher fills in and
-- downloads. No AI involvement — just structured, persisted, editable data.
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  grade text,
  notes text,
  periods jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_plans_user_id_idx on public.lesson_plans(user_id);

alter table public.lesson_plans enable row level security;

drop policy if exists "lesson_plans: owner full access" on public.lesson_plans;
create policy "lesson_plans: owner full access" on public.lesson_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
