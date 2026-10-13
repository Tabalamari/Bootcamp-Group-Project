-- Preserves direct-message history when a user permanently deletes their account.
-- Review and apply to the target Supabase database before deploying code that
-- expects anonymized participants. This migration does not delete existing data.
BEGIN;

ALTER TABLE public.conversations
  ALTER COLUMN participant1_id DROP NOT NULL,
  ALTER COLUMN participant2_id DROP NOT NULL;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey,
  DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey,
  ADD CONSTRAINT conversations_participant1_id_fkey
    FOREIGN KEY (participant1_id) REFERENCES public.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT conversations_participant2_id_fkey
    FOREIGN KEY (participant2_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.messages
  ALTER COLUMN sender_id DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;

COMMIT;
