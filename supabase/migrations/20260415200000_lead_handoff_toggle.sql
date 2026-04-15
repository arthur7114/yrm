begin;

-- Add explicit handoff toggle to leads table.
-- is_human_handoff = false → IA is the active responder.
-- is_human_handoff = true  → Human is the active responder; AI should not reply.
alter table if exists public.leads
  add column if not exists is_human_handoff boolean not null default false;

-- Fast lookup when filtering AI-only leads.
create index if not exists leads_human_handoff_idx
  on public.leads(user_id, is_human_handoff)
  where is_human_handoff = true;

-- Audit columns on lead_handoffs: who accepted and when.
alter table if exists public.lead_handoffs
  add column if not exists accepted_at timestamptz,
  add column if not exists accepted_by text,
  add column if not exists reverted_at timestamptz,
  add column if not exists reverted_by text;

commit;
