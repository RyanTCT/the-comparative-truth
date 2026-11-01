-- Batch 2: moderator designation only. Run in Supabase SQL Editor after review.
-- Moderator designations do not grant access until role-aware authorization is added.
-- Administrators remain exclusively defined by public.admin_users.
create table if not exists public.investigator_moderators (
 user_id uuid primary key references public.investigator_profiles(user_id) on delete cascade,
 granted_by uuid references auth.users(id),
 granted_at timestamptz not null default now()
);
alter table public.investigator_moderators enable row level security;
revoke all on public.investigator_moderators from anon,authenticated;
grant all on public.investigator_moderators to service_role;
