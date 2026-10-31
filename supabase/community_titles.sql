-- Community recognition titles. Run in Supabase SQL Editor.
-- Titles are public labels, never authorization roles.
create table if not exists public.community_titles (
 id uuid primary key default gen_random_uuid(),
 name text not null unique check (char_length(btrim(name)) between 2 and 40),
 badge_color text not null default '#c18b4d' check (badge_color ~ '^#[0-9A-Fa-f]{6}$'),
 is_default boolean not null default false,
 created_at timestamptz not null default now()
);
create unique index if not exists community_titles_one_default_idx on public.community_titles(is_default) where is_default;
insert into public.community_titles(name,badge_color,is_default)
values ('Investigator','#eee8df',true)
on conflict (name) do update set is_default=true;
create table if not exists public.investigator_title_assignments (
 user_id uuid not null references public.investigator_profiles(user_id) on delete cascade,
 title_id uuid not null references public.community_titles(id) on delete cascade,
 assigned_at timestamptz not null default now(),
 primary key(user_id,title_id)
);
alter table public.community_titles enable row level security;
alter table public.investigator_title_assignments enable row level security;
grant select on public.community_titles,public.investigator_title_assignments to anon,authenticated;
drop policy if exists "Anyone can read community titles" on public.community_titles;
create policy "Anyone can read community titles" on public.community_titles for select to anon,authenticated using(true);
drop policy if exists "Anyone can read assigned community titles" on public.investigator_title_assignments;
create policy "Anyone can read assigned community titles" on public.investigator_title_assignments for select to anon,authenticated using(true);
-- No client-side write policies. Admin-only server routes will manage titles.
-- Every profile implicitly has the default Investigator title; no assignment row needed.
-- Special recognition titles are additive; no effect on moderation/admin permissions.
