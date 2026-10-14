-- Adds per-user conversation hiding without deleting or modifying messages.
-- hidden_at is a history cutoff for that user's view. Reopening retains the cutoff.
-- Apply this migration to Supabase before deploying the backend/frontend changes.
BEGIN;

CREATE TABLE IF NOT EXISTS public.conversation_hides (
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reopened_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE public.conversation_hides
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ;

COMMIT;
