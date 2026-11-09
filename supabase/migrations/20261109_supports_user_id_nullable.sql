-- Allow public / unauthenticated support tickets (no matched user).
-- Deactivated users are still looked up by phone and linked when possible.

ALTER TABLE public.supports
  ALTER COLUMN user_id DROP NOT NULL;
