-- Axis Compass — Phase 1-3 schema (tasks, habits, exams, study, water, workouts)
-- Run this in the Supabase SQL editor after creating your project.

create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on public.tasks (user_id, done, due_at);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  created_at timestamptz not null default now()
);
create index if not exists habits_user_id_idx on public.habits (user_id);

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_at date not null default current_date,
  status text not null default 'completed' check (status in ('completed', 'partial', 'skipped')),
  unique (habit_id, completed_at)
);
create index if not exists habit_completions_user_id_idx on public.habit_completions (user_id, completed_at);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_name text not null,
  exam_date date not null,
  chapters_total int not null default 0,
  chapters_mastered int not null default 0
);
create index if not exists exams_user_id_idx on public.exams (user_id, exam_date);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.exams (id) on delete set null,
  minutes int not null check (minutes > 0),
  logged_at timestamptz not null default now()
);
create index if not exists study_sessions_user_id_idx on public.study_sessions (user_id, logged_at);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_ml int not null check (amount_ml > 0),
  logged_at timestamptz not null default now()
);
create index if not exists water_logs_user_id_idx on public.water_logs (user_id, logged_at);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  scheduled_date date not null default current_date,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'skipped'))
);
create index if not exists workouts_user_id_idx on public.workouts (user_id, scheduled_date);

-- Row Level Security: every table scoped to the owning user
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.exams enable row level security;
alter table public.study_sessions enable row level security;
alter table public.water_logs enable row level security;
alter table public.workouts enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['tasks', 'habits', 'habit_completions', 'exams', 'study_sessions', 'water_logs', 'workouts']
  loop
    execute format(
      'create policy "%1$s_owner_select" on public.%1$s for select to authenticated using ((select auth.uid()) = user_id)', t
    );
    execute format(
      'create policy "%1$s_owner_insert" on public.%1$s for insert to authenticated with check ((select auth.uid()) = user_id)', t
    );
    execute format(
      'create policy "%1$s_owner_update" on public.%1$s for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t
    );
    execute format(
      'create policy "%1$s_owner_delete" on public.%1$s for delete to authenticated using ((select auth.uid()) = user_id)', t
    );
  end loop;
end $$;
