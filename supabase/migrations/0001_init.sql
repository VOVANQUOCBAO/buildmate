-- ===========================================================================
-- BuildMate ASG — initial schema
--
-- Tables mirror the mock data shapes so the same UI works whether data comes
-- from JSON fixtures (mock mode) or per-user rows here (real mode).
--   profiles          1:1 with auth.users  (BuilderProfile)
--   saved_actions     recommendations a builder bookmarks
--   journey_progress  per-phase status in the builder journey
--
-- Run via the Supabase SQL editor or `supabase db push`.
-- Row Level Security is enabled on every table: a user can only ever read or
-- write their own rows.
-- ===========================================================================

-- --- profiles --------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  name           text not null default '',
  role           text not null default '',
  goal           text not null default '',
  current_skills text[] not null default '{}',
  target_skills  text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- --- saved_actions ---------------------------------------------------------
create table if not exists public.saved_actions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  recommendation_id text not null,
  title             text not null,
  category          text not null,
  action            text not null default '',
  saved_at          timestamptz not null default now(),
  unique (user_id, recommendation_id)
);

create index if not exists saved_actions_user_id_idx on public.saved_actions (user_id);

alter table public.saved_actions enable row level security;

create policy "Saved actions are viewable by owner"
  on public.saved_actions for select
  using (auth.uid() = user_id);

create policy "Saved actions are insertable by owner"
  on public.saved_actions for insert
  with check (auth.uid() = user_id);

create policy "Saved actions are deletable by owner"
  on public.saved_actions for delete
  using (auth.uid() = user_id);

-- --- journey_progress ------------------------------------------------------
create table if not exists public.journey_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  phase      text not null,
  status     text not null default 'next',
  updated_at timestamptz not null default now(),
  unique (user_id, phase)
);

create index if not exists journey_progress_user_id_idx on public.journey_progress (user_id);

alter table public.journey_progress enable row level security;

create policy "Journey progress is viewable by owner"
  on public.journey_progress for select
  using (auth.uid() = user_id);

create policy "Journey progress is insertable by owner"
  on public.journey_progress for insert
  with check (auth.uid() = user_id);

create policy "Journey progress is updatable by owner"
  on public.journey_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --- new-user trigger ------------------------------------------------------
-- Seed a profile row whenever a new auth user is created, copying any name
-- supplied at signup (raw_user_meta_data->>'name') or from the OAuth provider
-- (full_name). Keeps the app from needing a separate "create profile" step.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
