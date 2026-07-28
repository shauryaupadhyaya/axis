-- Axis Compass — Notes module schema
-- Applied via Supabase MCP apply_migration; mirrored here for repo history.

create table if not exists public.note_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  position int not null default 0
);
create index if not exists note_folders_user_id_idx on public.note_folders (user_id);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid references public.note_folders (id) on delete set null,
  chapter_id uuid references public.chapters (id) on delete set null,
  title text not null default 'Untitled',
  content text not null default '',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_id_idx on public.notes (user_id, updated_at);
create index if not exists notes_folder_id_idx on public.notes (folder_id);

alter table public.note_folders enable row level security;
alter table public.notes enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['note_folders', 'notes']
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
