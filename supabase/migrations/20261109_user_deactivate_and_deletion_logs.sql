-- Run in Supabase SQL editor (or via CLI) before relying on Deleted Logs / hard-delete.
-- Aligns admin "Deactivate" with self-deactivate (`status = 'inactive'`), and keeps
-- `suspended` as a legacy/admin alias that must also stay hidden in the consumer app.

-- ---------------------------------------------------------------------------
-- 1) Status conventions (no schema change if you already use these strings)
-- ---------------------------------------------------------------------------
-- active     = visible in search + posts (default / null treated as active)
-- inactive   = user self-deactivated OR admin deactivated (HIDDEN everywhere public)
-- suspended  = legacy admin ban — treat same as inactive in the consumer app
--
-- REQUIRED in the consumer (mobile/web) app for search + feeds:
--   only include users/posts where coalesce(users.status, 'active') = 'active'
-- Example:
--   .eq('status', 'active') on users
--   join posts → users and filter users.status = 'active' (or IS NULL)

-- ---------------------------------------------------------------------------
-- 2) Hard-delete audit log (profiles removed permanently still appear here)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_deletion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  posts_deleted_count integer NOT NULL DEFAULT 0,
  reason text,
  deleted_by text,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_deletion_logs_deleted_at
  ON public.user_deletion_logs (deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_deletion_logs_deleted_user_id
  ON public.user_deletion_logs (deleted_user_id);

COMMENT ON TABLE public.user_deletion_logs IS
  'Immutable log of hard-deleted user profiles (snapshot taken before delete).';
COMMENT ON COLUMN public.user_deletion_logs.snapshot IS
  'JSON copy of user row fields at delete time (name, email, phone, status, etc.).';
COMMENT ON COLUMN public.user_deletion_logs.posts_deleted_count IS
  'Number of posts removed with the user during admin hard-delete.';

ALTER TABLE public.user_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Adjust USING/WITH CHECK to match how you authorize staff (service role, claim, etc.).
-- Without a staff policy, the admin anon key cannot insert/select logs.
CREATE POLICY "Staff can read user_deletion_logs"
  ON public.user_deletion_logs FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert user_deletion_logs"
  ON public.user_deletion_logs FOR INSERT
  WITH CHECK (true);

-- Prefer tightening the above to your real admin check, e.g.:
-- USING ( (auth.jwt() ->> 'role') = 'admin' )

-- ---------------------------------------------------------------------------
-- 3) Optional: ensure posts.user_id can be cleaned up (no orphan posts)
-- ---------------------------------------------------------------------------
-- If posts.user_id has a FK to users WITHOUT ON DELETE CASCADE, admin hard-delete
-- must delete posts first (the admin app does this). Optionally:
--
-- ALTER TABLE public.posts
--   DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
-- ALTER TABLE public.posts
--   ADD CONSTRAINT posts_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
