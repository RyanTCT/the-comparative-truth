-- Community completion: one-level evidence replies, validated mentions, and likes.
-- REVIEW and run in Supabase SQL Editor before enabling the corresponding UI.
-- Existing comments remain top-level; no guessed parent relationships are assigned.

alter table public.community_comments
  add column if not exists parent_comment_id uuid
  references public.community_comments(id) on delete set null;

create index if not exists community_comments_parent_idx
  on public.community_comments(parent_comment_id);

create or replace function public.validate_community_reply_parent()
returns trigger language plpgsql set search_path = public as $$
declare parent_thread uuid; parent_parent uuid;
begin
  if new.parent_comment_id is null then return new; end if;
  if new.parent_comment_id = new.id then
    raise exception 'A contribution cannot reply to itself.';
  end if;
  select thread_id, parent_comment_id into parent_thread, parent_parent
    from public.community_comments where id = new.parent_comment_id and not is_hidden;
  if parent_thread is null or parent_thread <> new.thread_id then
    raise exception 'Reply parent must be a visible contribution in the same investigation.';
  end if;
  if parent_parent is not null then
    raise exception 'Only one level of nested replies is permitted.';
  end if;
  return new;
end $$;

drop trigger if exists community_reply_parent_guard on public.community_comments;
create trigger community_reply_parent_guard
before insert or update of parent_comment_id, thread_id on public.community_comments
for each row execute function public.validate_community_reply_parent();

-- Mentions are linked to permanent account IDs, not username strings.
create table if not exists public.community_mentions (
  comment_id uuid not null references public.community_comments(id) on delete cascade,
  mentioned_user_id uuid not null references public.investigator_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, mentioned_user_id)
);
create index if not exists community_mentions_recipient_idx
  on public.community_mentions(mentioned_user_id, created_at desc);
alter table public.community_mentions enable row level security;
grant select on public.community_mentions to anon, authenticated;
drop policy if exists "Public may read community mentions" on public.community_mentions;
create policy "Public may read community mentions"
  on public.community_mentions for select to anon, authenticated
  using (exists (select 1 from public.community_comments c
                where c.id = comment_id and not c.is_hidden));
-- Mention creation/deletion is server-only, following content validation.

create table if not exists public.community_comment_likes (
  comment_id uuid not null references public.community_comments(id) on delete cascade,
  user_id uuid not null references public.investigator_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create index if not exists community_comment_likes_comment_idx
  on public.community_comment_likes(comment_id);
alter table public.community_comment_likes enable row level security;
grant select on public.community_comment_likes to anon, authenticated;
drop policy if exists "Public may read community likes" on public.community_comment_likes;
create policy "Public may read community likes"
  on public.community_comment_likes for select to anon, authenticated using (true);
-- Likes are written only by the authenticated, verified server route, which
-- must reject self-likes and likes on hidden or locked investigations.
