-- Investigator public display names (run once in Supabase SQL Editor).
-- Emails remain in auth.users and are never exposed through this table.
create table if not exists public.investigator_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  name_changed_at timestamptz not null default now()
);

create unique index if not exists investigator_profiles_display_name_unique
  on public.investigator_profiles (lower(display_name));

alter table public.investigator_profiles enable row level security;

-- Only public display names and account IDs are exposed; never email addresses.
drop policy if exists "Public can read Investigator display names" on public.investigator_profiles;
create policy "Public can read Investigator display names"
  on public.investigator_profiles for select to anon, authenticated
  using (true);

-- No client-side insert/update/delete policies: all changes go through a validated RPC.
create or replace function public.set_investigator_display_name(requested_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  clean_name text := btrim(requested_name);
  previous_changed timestamptz;
begin
  if uid is null then
    raise exception 'You must be signed in to choose an Investigator name.';
  end if;
  if not exists (
    select 1 from auth.users
    where id = uid and email_confirmed_at is not null
  ) then
    raise exception 'Verify your email address before choosing an Investigator name.';
  end if;
  if clean_name is null or clean_name !~ '^[A-Za-z0-9_]{3,24}$' then
    raise exception 'Use 3–24 letters, numbers, or underscores.';
  end if;
  if clean_name ~* '(admin|moderator|comparativetruth|official|support)' then
    raise exception 'That name is reserved.';
  end if;

  -- Serialize changes per account to enforce the 30-day cooldown.
  perform 1 from auth.users where id = uid for update;
  select name_changed_at into previous_changed
    from public.investigator_profiles where user_id = uid;

  if previous_changed is not null
     and previous_changed > now() - interval '30 days' then
    raise exception 'You can change your Investigator name once every 30 days.';
  end if;

  insert into public.investigator_profiles(user_id, display_name, name_changed_at)
  values (uid, clean_name, now())
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        name_changed_at = now();

  return clean_name;
exception
  when unique_violation then
    raise exception 'That Investigator name is already taken.';
end;
$$;

revoke all on function public.set_investigator_display_name(text) from public;
revoke all on function public.set_investigator_display_name(text) from anon;
grant execute on function public.set_investigator_display_name(text) to authenticated;

-- Discussion post/comment policies must also require an existing profile,
-- verified email and author_id = auth.uid() when those tables are created.
