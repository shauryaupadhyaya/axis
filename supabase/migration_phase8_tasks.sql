-- Axis Compass — Phase 8 schema extensions (Tasks rebuild)
-- Run after migration_phase7.sql.
-- Adds nested subtasks (via self-reference), recurrence, reminders, and comments to tasks.

-- Unlimited nested subtasks: a subtask is just a task with a parent.
alter table public.tasks add column if not exists parent_task_id uuid references public.tasks (id) on delete cascade;
create index if not exists tasks_parent_task_id_idx on public.tasks (parent_task_id);

alter table public.tasks add column if not exists recurrence jsonb;
alter table public.tasks add column if not exists reminder_at timestamptz;
alter table public.tasks add column if not exists completed_at timestamptz;

-- Migrate existing flat task_subtasks rows into tasks, then retire the table.
insert into public.tasks (id, user_id, title, done, parent_task_id, created_at)
select id, user_id, title, done, task_id, now()
from public.task_subtasks
on conflict (id) do nothing;

drop table if exists public.task_subtasks;

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists task_comments_task_id_idx on public.task_comments (task_id);

alter table public.task_comments enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['task_comments']
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
