-- Run this in Supabase SQL Editor before deploying the edit/withdraw UI.
-- Server-side API performs ownership verification and moderation before edits.
-- Do not grant UPDATE or DELETE to anon or authenticated.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.community_threads to service_role;
grant select, insert, update, delete on public.community_comments to service_role;
-- No new tables or columns are needed; existing updated_at and is_hidden/is_locked are reused.
