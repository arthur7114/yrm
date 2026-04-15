begin;

-- Add last_event_occurred_at to track the timestamp of the last PROCESSED event.
-- This ensures "Last Event Wins" logic even if webhooks arrive out of order.
alter table if exists public.leads
  add column if not exists last_event_occurred_at timestamptz;

comment on column public.leads.last_event_occurred_at is 'Timestamp of the last integration event that meaningfully updated the lead state.';

commit;
