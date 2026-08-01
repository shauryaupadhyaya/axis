-- Axis Compass — Phase 10: Academic Hub
-- (Subjects/Exams split, chapter status expansion, homework rework,
--  Pomodoro, Flashcards, study attachments)
-- Applied via Supabase MCP apply_migration; mirrored here for repo history.

-- ============ SUBJECTS: new table, seeded from existing exams rows ============
-- "exams" previously conflated Subject + a single exam date. We split it by
-- creating subjects with the SAME id as the old exams row they came from —
-- this means every existing chapters/homework/study_sessions.subject_id
-- (which currently points at exams.id) instantly resolves to the right
-- subjects.id too, once we repoint the FK below. No child rows change.
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text,
  color text,
  syllabus_text text,
  created_at timestamptz not null default now()
);
create index if not exists subjects_user_id_idx on public.subjects (user_id);

insert into public.subjects (id, user_id, name, created_at)
select id, user_id, subject_name, now() from public.exams
on conflict (id) do nothing;

-- Repoint child tables from exams -> subjects (data untouched, ids already match).
alter table public.chapters drop constraint if exists chapters_subject_id_fkey;
alter table public.chapters add constraint chapters_subject_id_fkey
  foreign key (subject_id) references public.subjects (id) on delete cascade;

alter table public.homework drop constraint if exists homework_subject_id_fkey;
alter table public.homework add constraint homework_subject_id_fkey
  foreign key (subject_id) references public.subjects (id) on delete cascade;

alter table public.study_sessions drop constraint if exists study_sessions_subject_id_fkey;
alter table public.study_sessions add constraint study_sessions_subject_id_fkey
  foreign key (subject_id) references public.subjects (id) on delete set null;

-- ============ EXAMS: repurpose as real exam records (many per subject) ============
-- Each pre-existing exams row becomes the first exam record *for its own new
-- subject* (subject_id = its own id) so its exam_date isn't lost.
alter table public.exams add column if not exists subject_id uuid references public.subjects (id) on delete cascade;
update public.exams set subject_id = id where subject_id is null;
alter table public.exams alter column subject_id set not null;

alter table public.exams add column if not exists name text;
update public.exams set name = coalesce(name, subject_name || ' Exam') where name is null;
alter table public.exams alter column name set not null;

alter table public.exams add column if not exists chapters_covered uuid[] not null default '{}';
alter table public.exams add column if not exists weightage numeric;
alter table public.exams add column if not exists notes text;

alter table public.exams drop column if exists subject_name;
alter table public.exams drop column if exists chapters_total;
alter table public.exams drop column if exists chapters_mastered;

create index if not exists exams_subject_id_idx on public.exams (subject_id, exam_date);

-- ============ CHAPTERS: expanded status workflow ============
update public.chapters set status = 'revised_once' where status = 'revised';
alter table public.chapters drop constraint if exists chapters_status_check;
alter table public.chapters add constraint chapters_status_check
  check (status in ('not_started', 'learning', 'in_progress', 'revised_once', 'revised_twice', 'mastered'));
alter table public.chapters add column if not exists revision_count int not null default 0;

-- ============ HOMEWORK: chapter linkage + explicit status ============
alter table public.homework add column if not exists chapter_id uuid references public.chapters (id) on delete set null;
alter table public.homework add column if not exists status text not null default 'not_started'
  check (status in ('not_started', 'in_progress', 'completed'));
update public.homework set status = case when done then 'completed' else 'not_started' end;
alter table public.homework drop column if exists done;
create index if not exists homework_chapter_id_idx on public.homework (chapter_id);

-- ============ NOTE FOLDERS: nesting ============
alter table public.note_folders add column if not exists parent_folder_id uuid references public.note_folders (id) on delete cascade;

-- ============ POMODORO SESSIONS ============
create table if not exists public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  chapter_id uuid references public.chapters (id) on delete set null,
  note_id uuid references public.notes (id) on delete set null,
  planned_minutes int not null check (planned_minutes > 0),
  actual_minutes int not null default 0,
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists pomodoro_sessions_user_id_idx on public.pomodoro_sessions (user_id, started_at);

-- ============ FLASHCARDS ============
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  note_id uuid references public.notes (id) on delete set null,
  front text not null,
  back text not null,
  status text not null default 'learning' check (status in ('learning', 'reviewing', 'mastered')),
  review_count int not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists flashcards_subject_id_idx on public.flashcards (subject_id);
create index if not exists flashcards_chapter_id_idx on public.flashcards (chapter_id);

-- ============ STUDY ATTACHMENTS (PDFs, worksheets, etc. per chapter) ============
create table if not exists public.study_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  size_bytes int not null default 0,
  mime_type text,
  created_at timestamptz not null default now()
);
create index if not exists study_attachments_chapter_id_idx on public.study_attachments (chapter_id);

-- ============ RLS ============
alter table public.subjects enable row level security;
alter table public.pomodoro_sessions enable row level security;
alter table public.flashcards enable row level security;
alter table public.study_attachments enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['subjects', 'pomodoro_sessions', 'flashcards', 'study_attachments']
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

-- ============ STORAGE: study-attachments bucket (private, owner-scoped) ============
insert into storage.buckets (id, name, public)
values ('study-attachments', 'study-attachments', false)
on conflict (id) do nothing;

create policy "study_attachments_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'study-attachments' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "study_attachments_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'study-attachments' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "study_attachments_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'study-attachments' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "study_attachments_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'study-attachments' and (select auth.uid())::text = (storage.foldername(name))[1]);
