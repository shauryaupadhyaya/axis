-- Axis Compass — Phase 11: homework.completed_at
-- Needed for the study streak ("Notes updated OR homework completed" signal) —
-- there was previously no timestamp recording *when* a homework item was
-- marked done, only its current status.
-- Applied via Supabase MCP apply_migration; mirrored here for repo history.

alter table public.homework add column if not exists completed_at timestamptz;
update public.homework set completed_at = now() where status = 'completed' and completed_at is null;
