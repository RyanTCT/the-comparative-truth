-- Run once in Supabase SQL Editor before publishing Weigh In.
-- Service-role-only writes: public results are served through /api/weigh-in.
create table if not exists public.weigh_in_questions (
 id uuid primary key default gen_random_uuid(),
 episode_number integer not null check(episode_number between 1 and 999),
 question text not null,
 published boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.weigh_in_options (
 id uuid primary key default gen_random_uuid(),
 question_id uuid not null references public.weigh_in_questions(id) on delete cascade,
 option_text text not null,
 display_order integer not null default 1
);
create table if not exists public.weigh_in_votes (
 id uuid primary key default gen_random_uuid(),
 question_id uuid not null references public.weigh_in_questions(id) on delete cascade,
 option_id uuid not null references public.weigh_in_options(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique(question_id,user_id)
);
create unique index if not exists weigh_in_one_vote_per_investigator on public.weigh_in_votes(question_id,user_id);
create index if not exists weigh_in_options_question_idx on public.weigh_in_options(question_id,display_order);
create index if not exists weigh_in_votes_question_idx on public.weigh_in_votes(question_id);
alter table public.weigh_in_questions enable row level security;
alter table public.weigh_in_options enable row level security;
alter table public.weigh_in_votes enable row level security;
-- The API uses the server-side secret; direct anonymous and authenticated table writes remain denied.
revoke all on public.weigh_in_votes from anon,authenticated;
revoke insert,update,delete on public.weigh_in_questions,public.weigh_in_options from anon,authenticated;
-- Seed drafts only when the episode does not already have a question.
do $$ declare n integer; q uuid; prompt text; begin
 for n in 1..3 loop
  if not exists(select 1 from public.weigh_in_questions where episode_number=n) then
   prompt:=case n when 1 then 'Is Technology Destroying Our Attention Span?' when 2 then 'Are We Capable of Containing AI?' else 'Is Technology Empowering Scammers?' end;
   insert into public.weigh_in_questions(episode_number,question,published) values(n,prompt,false) returning id into q;
   if n=2 then
    insert into public.weigh_in_options(question_id,option_text,display_order) values
     (q,'Yes — Humanity can maintain control over AI.',1),
     (q,'No — AI will eventually exceed our ability to contain it.',2),
     (q,'Undecided — I haven''t reached a conclusion.',3);
   else
    insert into public.weigh_in_options(question_id,option_text,display_order) values
     (q,'Yes',1),(q,'No',2),(q,'Undecided',3);
   end if;
  end if;
 end loop;
end $$;
-- Review the draft answer choices for episodes 01 and 03 in the Investigator Desk before publishing.
