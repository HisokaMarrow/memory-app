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

create policy "Users can read their own game results"
on public.game_results
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own game results"
on public.game_results
for insert
to authenticated
with check (auth.uid() = user_id);

create index if not exists game_results_user_created_idx
on public.game_results (user_id, created_at desc);

