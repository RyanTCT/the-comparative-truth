-- Comparative Truth community boards: foundation only.
-- Run in Supabase SQL Editor. No existing Investigator records are changed.
create table if not exists public.community_categories (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 title text not null,
 description text not null,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.community_threads (
 id uuid primary key default gen_random_uuid(),
 category_id uuid not null references public.community_categories(id),
 author_id uuid not null references public.investigator_profiles(user_id),
 title text not null check (char_length(btrim(title)) between 5 and 160),
 body text not null check (char_length(btrim(body)) between 10 and 15000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 is_locked boolean not null default false,
 is_hidden boolean not null default false
);
create table if not exists public.community_comments (
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references public.community_threads(id) on delete cascade,
 author_id uuid not null references public.investigator_profiles(user_id),
 body text not null check (char_length(btrim(body)) between 2 and 10000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 is_hidden boolean not null default false
);
create index if not exists community_threads_category_created_idx on public.community_threads(category_id,created_at desc);
create index if not exists community_comments_thread_created_idx on public.community_comments(thread_id,created_at);
insert into public.community_categories(slug,title,description,sort_order) values
 ('episode-investigations','Episode Investigations','Discuss evidence and arguments from published episodes.',1),
 ('evidence-room','The Evidence Room','Share research, discoveries, and credible sources.',2),
 ('open-investigations','Open Investigations','Propose topics and explore new questions.',3)
on conflict (slug) do nothing;
alter table public.community_categories enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_comments enable row level security;
grant usage on schema public to anon,authenticated;
grant select on public.community_categories,public.community_threads,public.community_comments to anon,authenticated;
grant insert on public.community_threads,public.community_comments to authenticated;
drop policy if exists "Everyone can browse categories" on public.community_categories;
create policy "Everyone can browse categories" on public.community_categories for select to anon,authenticated using(true);
drop policy if exists "Everyone can browse visible threads" on public.community_threads;
create policy "Everyone can browse visible threads" on public.community_threads for select to anon,authenticated using(not is_hidden);
drop policy if exists "Everyone can browse visible comments" on public.community_comments;
create policy "Everyone can browse visible comments" on public.community_comments for select to anon,authenticated using(not is_hidden and exists(select 1 from public.community_threads t where t.id=thread_id and not t.is_hidden));
-- Enforce authorship, verified email, and existing public display name.
drop policy if exists "Verified Investigators create threads" on public.community_threads;
create policy "Verified Investigators create threads" on public.community_threads for insert to authenticated with check (
 author_id=auth.uid() and not is_hidden and not is_locked
 and exists(select 1 from public.investigator_profiles p where p.user_id=auth.uid())
 and exists(select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null)
);
drop policy if exists "Verified Investigators create comments" on public.community_comments;
create policy "Verified Investigators create comments" on public.community_comments for insert to authenticated with check (
 author_id=auth.uid() and not is_hidden
 and exists(select 1 from public.investigator_profiles p where p.user_id=auth.uid())
 and exists(select 1 from public.community_threads t where t.id=thread_id and not t.is_hidden and not t.is_locked)
 and exists(select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null)
);
-- No client-side update/delete permissions. Moderation will use protected server routes.
