create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_color text not null default '#E85D2A',
  avatar_image_uri text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_color, avatar_image_uri)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'athlete'),
    coalesce(new.raw_user_meta_data ->> 'avatar_color', '#E85D2A'),
    coalesce(new.raw_user_meta_data ->> 'avatar_image_uri', '')
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    avatar_color = excluded.avatar_color,
    avatar_image_uri = excluded.avatar_image_uri,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.profiles (id, display_name, avatar_color, avatar_image_uri)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', split_part(users.email, '@', 1), 'athlete'),
  coalesce(users.raw_user_meta_data ->> 'avatar_color', '#E85D2A'),
  coalesce(users.raw_user_meta_data ->> 'avatar_image_uri', '')
from auth.users
on conflict (id) do nothing;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favourite_game_ids text[] not null default '{}'::text[],
  goals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users can read their own preferences" on public.user_preferences;
create policy "Users can read their own preferences"
on public.user_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own preferences" on public.user_preferences;
create policy "Users can insert their own preferences"
on public.user_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own preferences" on public.user_preferences;
create policy "Users can update their own preferences"
on public.user_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.vault_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  tree_id text not null,
  completed_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, tree_id)
);

alter table public.vault_progress enable row level security;

drop policy if exists "Users can read their own vault progress" on public.vault_progress;
create policy "Users can read their own vault progress"
on public.vault_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own vault progress" on public.vault_progress;
create policy "Users can insert their own vault progress"
on public.vault_progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own vault progress" on public.vault_progress;
create policy "Users can update their own vault progress"
on public.vault_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.game_results (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  game_title text not null,
  created_at timestamptz not null default now(),
  mode text not null,
  exercise_seconds integer not null,
  time_taken_seconds integer not null,
  numbers_shown integer not null,
  numbers_correct integer not null,
  digits_shown integer not null,
  digits_correct integer not null,
  accuracy integer not null,
  settings jsonb not null default '{}'::jsonb
);

alter table public.game_results enable row level security;

drop policy if exists "Users can read their own game results" on public.game_results;
create policy "Users can read their own game results"
on public.game_results
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own game results" on public.game_results;
create policy "Users can insert their own game results"
on public.game_results
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own game results" on public.game_results;
create policy "Users can update their own game results"
on public.game_results
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists game_results_user_created_idx
on public.game_results (user_id, created_at desc);

create or replace view public.leaderboard_xp as
select
  profiles.id as user_id,
  coalesce(profiles.display_name, 'athlete') as display_name,
  profiles.avatar_color,
  profiles.avatar_image_uri,
  count(game_results.id)::integer as results_count,
  (
    coalesce(sum(game_results.numbers_correct * 3), 0) +
    case
      when jsonb_typeof(user_preferences.goals) = 'object'
      then coalesce((user_preferences.goals ->> 'questXp')::integer, 0)
      else 0
    end
  )::integer as xp,
  dense_rank() over (
    order by (
      coalesce(sum(game_results.numbers_correct * 3), 0) +
      case
        when jsonb_typeof(user_preferences.goals) = 'object'
        then coalesce((user_preferences.goals ->> 'questXp')::integer, 0)
        else 0
      end
    ) desc, profiles.created_at asc
  )::integer as rank
from public.profiles
left join public.game_results on game_results.user_id = profiles.id
left join public.user_preferences on user_preferences.user_id = profiles.id
group by profiles.id, profiles.display_name, profiles.avatar_color, profiles.avatar_image_uri, profiles.created_at, user_preferences.goals;

grant select on public.leaderboard_xp to authenticated;
