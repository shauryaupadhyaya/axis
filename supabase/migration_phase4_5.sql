-- Axis Compass — Phase 4-5 schema additions (Tasks detail, Calendar, Study chapters, Health/Gym)
-- Applied via Supabase MCP apply_migration; mirrored here for repo history.

-- Tasks: rich description, tags, 3-state board status
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists tags text[] not null default '{}';
alter table public.tasks add column if not exists in_progress boolean not null default false;

create table if not exists public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position int not null default 0
);
create index if not exists task_subtasks_task_id_idx on public.task_subtasks (task_id);

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  size_bytes int not null,
  created_at timestamptz not null default now()
);
create index if not exists task_attachments_task_id_idx on public.task_attachments (task_id);

-- Study: chapters under a subject (exams row), revision scheduling
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.exams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  status text not null default 'not_started' check (status in ('not_started', 'learning', 'revised', 'mastered')),
  position int not null default 0,
  last_revised_at timestamptz,
  revision_frequency_days int not null default 7
);
create index if not exists chapters_subject_id_idx on public.chapters (subject_id);

alter table public.study_sessions add column if not exists chapter_id uuid references public.chapters (id) on delete set null;

-- Per-user configurable goals (currently just water; the only goal editor in scope)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  water_goal_ml int not null default 3000
);

-- Health/Gym: exercises within a workout, sets within an exercise
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  muscle_group text not null,
  position int not null default 0
);
create index if not exists workout_exercises_workout_id_idx on public.workout_exercises (workout_id);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  set_number int not null,
  weight numeric not null default 0,
  reps int not null default 0,
  completed boolean not null default false,
  logged_at timestamptz
);
create index if not exists workout_sets_exercise_id_idx on public.workout_sets (workout_exercise_id);

-- Skincare
create table if not exists public.skincare_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null check (period in ('am', 'pm')),
  name text not null,
  position int not null default 0
);
create index if not exists skincare_steps_user_id_idx on public.skincare_steps (user_id);

create table if not exists public.skincare_completions (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.skincare_steps (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_at date not null default current_date,
  unique (step_id, completed_at)
);
create index if not exists skincare_completions_user_id_idx on public.skincare_completions (user_id, completed_at);

-- RLS for all new tables (same owner-scoped pattern as migration.sql)
alter table public.task_subtasks enable row level security;
alter table public.task_attachments enable row level security;
alter table public.chapters enable row level security;
alter table public.user_settings enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.skincare_steps enable row level security;
alter table public.skincare_completions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['task_subtasks', 'task_attachments', 'chapters', 'workout_exercises', 'workout_sets', 'skincare_steps', 'skincare_completions']
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

-- user_settings is keyed by user_id directly (no separate user_id column check needed beyond PK match)
create policy "user_settings_owner_select" on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_settings_owner_insert" on public.user_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_settings_owner_update" on public.user_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_settings_owner_delete" on public.user_settings for delete to authenticated using ((select auth.uid()) = user_id);

-- Storage bucket for task attachments (private; RLS scoped to the user's own folder prefix)
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

create policy "task_attachments_storage_select" on storage.objects for select to authenticated
  using (bucket_id = 'task-attachments' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "task_attachments_storage_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'task-attachments' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "task_attachments_storage_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'task-attachments' and (select auth.uid())::text = (storage.foldername(name))[1]);
