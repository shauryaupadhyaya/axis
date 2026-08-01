-- Axis Compass — Phase 9: Premium Health module
-- (Gym, Water, Skincare, Progress Photos, unified Health Dashboard)
-- Applied via Supabase MCP apply_migration; mirrored here for repo history.

-- ============ USER SETTINGS: hydration profile ============
alter table public.user_settings add column if not exists age int;
alter table public.user_settings add column if not exists weight_kg numeric;
alter table public.user_settings add column if not exists height_cm numeric;
alter table public.user_settings add column if not exists activity_level text not null default 'moderate'
  check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active'));
alter table public.user_settings add column if not exists preferred_container_ml int not null default 250;

-- ============ WATER: custom containers (presets are defined in app code) ============
create table if not exists public.water_containers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  volume_ml int not null check (volume_ml > 0),
  icon text not null default 'glass',
  position int not null default 0
);
create index if not exists water_containers_user_id_idx on public.water_containers (user_id, position);

-- ============ SKINCARE: products, journal, richer steps ============
create table if not exists public.skincare_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  product_type text not null default 'other'
    check (product_type in ('cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'retinol', 'exfoliant', 'mask', 'other')),
  ingredients text,
  purchase_date date,
  expiry_date date,
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists skincare_products_user_id_idx on public.skincare_products (user_id);

alter table public.skincare_steps drop constraint if exists skincare_steps_period_check;
alter table public.skincare_steps add constraint skincare_steps_period_check
  check (period in ('am', 'pm', 'weekly', 'monthly', 'mask', 'eye_mask', 'hair', 'lip', 'foot', 'nail', 'custom'));
alter table public.skincare_steps add column if not exists routine_name text;
alter table public.skincare_steps add column if not exists step_type text not null default 'other'
  check (step_type in ('cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'retinol', 'exfoliant', 'mask', 'other'));
alter table public.skincare_steps add column if not exists duration_seconds int not null default 60;
alter table public.skincare_steps add column if not exists instructions text;
alter table public.skincare_steps add column if not exists product_id uuid references public.skincare_products (id) on delete set null;
alter table public.skincare_steps add column if not exists notes text;

create table if not exists public.skin_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_date date not null default current_date,
  acne int not null default 0 check (acne between 0 and 10),
  redness int not null default 0 check (redness between 0 and 10),
  dryness int not null default 0 check (dryness between 0 and 10),
  oiliness int not null default 0 check (oiliness between 0 and 10),
  irritation int not null default 0 check (irritation between 0 and 10),
  sensitivity int not null default 0 check (sensitivity between 0 and 10),
  mood text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, logged_date)
);
create index if not exists skin_journal_user_id_idx on public.skin_journal (user_id, logged_date);

-- ============ GYM: favorites, templates ============
-- The exercise library itself is static content shipped in app code (no DB
-- table) — exercise_id below is that library's slug, not a foreign key.
create table if not exists public.exercise_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists workout_templates_user_id_idx on public.workout_templates (user_id);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id text,
  custom_name text,
  muscle_group text not null default 'General',
  set_type text not null default 'standard'
    check (set_type in ('standard', 'superset', 'dropset', 'giant_set', 'circuit', 'amrap', 'emom')),
  group_key text,
  target_sets int not null default 3,
  target_reps text not null default '8-12',
  notes text,
  position int not null default 0
);
create index if not exists workout_template_exercises_template_id_idx on public.workout_template_exercises (template_id, position);

-- ============ GYM: richer workout tracking ============
alter table public.workouts add column if not exists template_id uuid references public.workout_templates (id) on delete set null;
alter table public.workouts add column if not exists started_at timestamptz;
alter table public.workouts add column if not exists ended_at timestamptz;
alter table public.workouts add column if not exists notes text;

alter table public.workout_exercises add column if not exists exercise_id text;
alter table public.workout_exercises add column if not exists set_type text not null default 'standard'
  check (set_type in ('standard', 'superset', 'dropset', 'giant_set', 'circuit', 'amrap', 'emom'));
alter table public.workout_exercises add column if not exists group_key text;
alter table public.workout_exercises add column if not exists notes text;

alter table public.workout_sets add column if not exists duration_seconds int;
alter table public.workout_sets add column if not exists distance_m numeric;
alter table public.workout_sets add column if not exists rpe numeric(3,1) check (rpe between 0 and 10);
alter table public.workout_sets add column if not exists rir int check (rir between 0 and 10);
alter table public.workout_sets add column if not exists tempo text;
alter table public.workout_sets add column if not exists notes text;

-- ============ PROGRESS PHOTOS + MEASUREMENTS ============
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null default 'gym'
    check (category in ('gym', 'weight_loss', 'muscle_gain', 'skincare', 'face', 'custom')),
  custom_category text,
  angle text not null default 'front' check (angle in ('front', 'left', 'right', 'back', 'other')),
  storage_path text not null,
  caption text,
  taken_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists progress_photos_user_id_idx on public.progress_photos (user_id, taken_at);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_date date not null default current_date,
  weight_kg numeric,
  body_fat_pct numeric,
  chest_cm numeric,
  waist_cm numeric,
  arms_cm numeric,
  thighs_cm numeric,
  neck_cm numeric,
  created_at timestamptz not null default now(),
  unique (user_id, logged_date)
);
create index if not exists body_measurements_user_id_idx on public.body_measurements (user_id, logged_date);

-- ============ RLS ============
alter table public.water_containers enable row level security;
alter table public.skincare_products enable row level security;
alter table public.skin_journal enable row level security;
alter table public.exercise_favorites enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.progress_photos enable row level security;
alter table public.body_measurements enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'water_containers', 'skincare_products', 'skin_journal', 'exercise_favorites',
    'workout_templates', 'workout_template_exercises', 'progress_photos', 'body_measurements'
  ]
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

-- ============ STORAGE: progress-photos + skincare-products (private, owner-scoped) ============
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "progress_photos_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'progress-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "progress_photos_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'progress-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "progress_photos_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'progress-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "progress_photos_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'progress-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);

insert into storage.buckets (id, name, public)
values ('skincare-products', 'skincare-products', false)
on conflict (id) do nothing;

create policy "skincare_products_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'skincare-products' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "skincare_products_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'skincare-products' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "skincare_products_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'skincare-products' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "skincare_products_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'skincare-products' and (select auth.uid())::text = (storage.foldername(name))[1]);
