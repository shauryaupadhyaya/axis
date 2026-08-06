-- Axis Compass — Phase 12: homework.given_at
-- Tracks the date homework was assigned, alongside the existing due_at,
-- so homework can be tracked by both given date and due date.
-- Applied via Supabase MCP apply_migration; mirrored here for repo history.

alter table public.homework add column if not exists given_at date;
