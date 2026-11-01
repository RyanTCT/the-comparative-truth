-- Run once in Supabase SQL Editor before using the administrator dashboard.
create table if not exists public.community_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_at timestamptz not null default now()
);
create table if not exists public.community_moderation_log (
 id uuid primary key default gen_random_uuid(),
 admin_id uuid not null references auth.users(id),
 action text not null,
 target_type text not null,
 target_id uuid not null,
 detail text,
 created_at timestamptz not null default now()
);
create index if not exists community_moderation_log_created_idx on public.community_moderation_log(created_at desc);
alter table public.community_admins enable row level security;
alter table public.community_moderation_log enable row level security;
revoke all on public.community_admins,public.community_moderation_log from anon,authenticated;
grant all on public.community_admins,public.community_moderation_log to service_role;
alter table public.community_threads add column if not exists is_pinned boolean not null default false;
-- Replace the email below with the email address of YOUR existing verified Investigator account.
-- Only execute this insert after confirming the account is yours.
-- insert into public.community_admins(user_id)
-- select id from auth.users where email = 'YOUR-INVESTIGATOR-EMAIL@example.com'
-- on conflict (user_id) do nothing;
