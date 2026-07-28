-- Axis Compass — Phase 7 schema: homework, calendar events, push notifications, avatars

create table if not exists public.homework (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.exams (id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists homework_subject_id_idx on public.homework (subject_id);
create index if not exists homework_user_id_idx on public.homework (user_id, due_at);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  event_date date not null,
  event_type text not null default 'event' check (event_type in ('event', 'birthday')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists calendar_events_user_id_idx on public.calendar_events (user_id, event_date);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.user_settings add column if not exists last_notified_at timestamptz;

alter table public.homework enable row level security;
alter table public.calendar_events enable row level security;
alter table public.push_subscriptions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['homework', 'calendar_events', 'push_subscriptions']
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

-- Public avatars bucket: public read via the storage public-URL endpoint,
-- writes restricted to the owner's own folder (userId/...), matching the
-- task-attachments bucket's write-policy pattern.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "avatars_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "avatars_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
