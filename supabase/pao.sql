create table if not exists public.pao_systems (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('numbers', 'cards', 'names', 'custom')),
  fields jsonb not null default '[]'::jsonb,
  key_format text not null default 'pad2' check (key_format in ('pad2', 'pad3', 'card', 'text')),
  expected_size integer not null default 100 check (expected_size >= 0),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pao_imports (
  id text primary key,
  system_id text not null references public.pao_systems(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null,
  file_name text not null,
  file_size integer not null default 0,
  storage_path text,
  item_count integer not null,
  created_at timestamptz not null default now(),
  unique (system_id, revision)
);

create table if not exists public.pao_items (
  id text primary key,
  system_id text not null references public.pao_systems(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  display_label text not null,
  card_asset_id text,
  values jsonb not null default '{}'::jsonb,
  starred boolean not null default false,
  notes text,
  position integer not null default 0,
  unique (system_id, item_key)
);

create table if not exists public.pao_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.pao_items(id) on delete cascade,
  field text not null,
  strength integer not null default 0 check (strength between 0 and 5),
  due_at timestamptz not null default now(),
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  streak integer not null default 0,
  avg_ms integer not null default 0,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, item_id, field)
);

create index if not exists pao_systems_user_updated_idx on public.pao_systems (user_id, updated_at desc);
create index if not exists pao_imports_system_revision_idx on public.pao_imports (system_id, revision desc);
create index if not exists pao_items_system_position_idx on public.pao_items (system_id, position);
create index if not exists pao_progress_user_due_idx on public.pao_progress (user_id, due_at);

alter table public.pao_systems enable row level security;
alter table public.pao_imports enable row level security;
alter table public.pao_items enable row level security;
alter table public.pao_progress enable row level security;

drop policy if exists "Users manage their own PAO systems" on public.pao_systems;
create policy "Users manage their own PAO systems" on public.pao_systems
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own PAO imports" on public.pao_imports;
create policy "Users manage their own PAO imports" on public.pao_imports
for all to authenticated
using (auth.uid() = user_id and exists (select 1 from public.pao_systems where pao_systems.id = pao_imports.system_id and pao_systems.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.pao_systems where pao_systems.id = pao_imports.system_id and pao_systems.user_id = auth.uid()));

drop policy if exists "Users manage their own PAO items" on public.pao_items;
create policy "Users manage their own PAO items" on public.pao_items
for all to authenticated
using (auth.uid() = user_id and exists (select 1 from public.pao_systems where pao_systems.id = pao_items.system_id and pao_systems.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.pao_systems where pao_systems.id = pao_items.system_id and pao_systems.user_id = auth.uid()));

drop policy if exists "Users manage their own PAO progress" on public.pao_progress;
create policy "Users manage their own PAO progress" on public.pao_progress
for all to authenticated
using (auth.uid() = user_id and exists (select 1 from public.pao_items where pao_items.id = pao_progress.item_id and pao_items.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.pao_items where pao_items.id = pao_progress.item_id and pao_items.user_id = auth.uid()));

grant select, insert, update, delete on public.pao_systems to authenticated;
grant select, insert, update, delete on public.pao_imports to authenticated;
grant select, insert, update, delete on public.pao_items to authenticated;
grant select, insert, update, delete on public.pao_progress to authenticated;

create or replace function public.pao_replace_items(
  p_system_id text,
  p_items jsonb,
  p_expected_revision integer,
  p_file_name text default null,
  p_file_size integer default 0
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision integer;
  v_new_revision integer;
  v_item jsonb;
  v_item_id text;
  v_item_key text;
  v_old_values jsonb;
  v_new_values jsonb;
  v_field text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;

  select revision into v_revision
  from public.pao_systems
  where id = p_system_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'system_not_found' using errcode = 'P0001';
  end if;
  if v_revision <> p_expected_revision then
    raise exception 'revision_conflict: expected %, found %', p_expected_revision, v_revision using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'items_must_be_an_array' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) <> (
    select count(distinct value ->> 'item_key') from jsonb_array_elements(p_items)
  ) then
    raise exception 'duplicate_item_keys' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_item_key := nullif(v_item ->> 'item_key', '');
    if v_item_key is null then
      raise exception 'item_key_required' using errcode = 'P0001';
    end if;
    select id, values into v_item_id, v_old_values
    from public.pao_items
    where system_id = p_system_id and item_key = v_item_key;

    v_new_values := coalesce(v_item -> 'values', '{}'::jsonb);
    if found then
      for v_field in select key from jsonb_each(coalesce(v_old_values, '{}'::jsonb) || v_new_values)
      loop
        if coalesce(v_old_values ->> v_field, '') is distinct from coalesce(v_new_values ->> v_field, '') then
          delete from public.pao_progress
          where user_id = v_user_id and item_id = v_item_id and field = v_field;
        end if;
      end loop;

      update public.pao_items set
        display_label = coalesce(nullif(v_item ->> 'display_label', ''), v_item_key),
        card_asset_id = nullif(v_item ->> 'card_asset_id', ''),
        values = v_new_values,
        starred = coalesce((v_item ->> 'starred')::boolean, false),
        notes = coalesce(v_item ->> 'notes', ''),
        position = coalesce((v_item ->> 'position')::integer, 0)
      where id = v_item_id;
    else
      insert into public.pao_items (
        id, system_id, user_id, item_key, display_label, card_asset_id, values, starred, notes, position
      ) values (
        coalesce(nullif(v_item ->> 'id', ''), p_system_id || ':' || encode(convert_to(v_item_key, 'UTF8'), 'hex')),
        p_system_id,
        v_user_id,
        v_item_key,
        coalesce(nullif(v_item ->> 'display_label', ''), v_item_key),
        nullif(v_item ->> 'card_asset_id', ''),
        v_new_values,
        coalesce((v_item ->> 'starred')::boolean, false),
        coalesce(v_item ->> 'notes', ''),
        coalesce((v_item ->> 'position')::integer, 0)
      );
    end if;
  end loop;

  delete from public.pao_items existing
  where existing.system_id = p_system_id
    and not exists (
      select 1 from jsonb_array_elements(p_items) incoming
      where incoming ->> 'item_key' = existing.item_key
    );

  v_new_revision := v_revision + 1;
  update public.pao_systems
  set revision = v_new_revision, updated_at = now()
  where id = p_system_id;

  if p_file_name is not null then
    insert into public.pao_imports (id, system_id, user_id, revision, file_name, file_size, item_count)
    values (
      p_system_id || ':' || v_new_revision,
      p_system_id,
      v_user_id,
      v_new_revision,
      p_file_name,
      greatest(p_file_size, 0),
      jsonb_array_length(p_items)
    );
  end if;

  return v_new_revision;
end;
$$;

create or replace function public.pao_update_item(
  p_system_id text,
  p_item_key text,
  p_values jsonb,
  p_starred boolean,
  p_notes text,
  p_expected_revision integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision integer;
  v_item_id text;
  v_old_values jsonb;
  v_field text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;

  select revision into v_revision
  from public.pao_systems
  where id = p_system_id and user_id = v_user_id
  for update;

  if not found then raise exception 'system_not_found' using errcode = 'P0001'; end if;
  if v_revision <> p_expected_revision then
    raise exception 'revision_conflict: expected %, found %', p_expected_revision, v_revision using errcode = 'P0001';
  end if;

  select id, values into v_item_id, v_old_values
  from public.pao_items
  where system_id = p_system_id and item_key = p_item_key and user_id = v_user_id;
  if not found then raise exception 'item_not_found' using errcode = 'P0001'; end if;

  for v_field in select key from jsonb_each(coalesce(v_old_values, '{}'::jsonb) || coalesce(p_values, '{}'::jsonb))
  loop
    if coalesce(v_old_values ->> v_field, '') is distinct from coalesce(p_values ->> v_field, '') then
      delete from public.pao_progress
      where user_id = v_user_id and item_id = v_item_id and field = v_field;
    end if;
  end loop;

  update public.pao_items
  set values = coalesce(p_values, '{}'::jsonb), starred = p_starred, notes = coalesce(p_notes, '')
  where id = v_item_id;

  update public.pao_systems
  set revision = revision + 1, updated_at = now()
  where id = p_system_id
  returning revision into v_revision;

  return v_revision;
end;
$$;

revoke all on function public.pao_replace_items(text, jsonb, integer, text, integer) from public;
grant execute on function public.pao_replace_items(text, jsonb, integer, text, integer) to authenticated;
revoke all on function public.pao_update_item(text, text, jsonb, boolean, text, integer) from public;
grant execute on function public.pao_update_item(text, text, jsonb, boolean, text, integer) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('pao-uploads', 'pao-uploads', false, 5242880)
on conflict (id) do update set public = false, file_size_limit = 5242880;

drop policy if exists "Users read their own PAO uploads" on storage.objects;
create policy "Users read their own PAO uploads" on storage.objects
for select to authenticated
using (bucket_id = 'pao-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users create their own PAO uploads" on storage.objects;
create policy "Users create their own PAO uploads" on storage.objects
for insert to authenticated
with check (bucket_id = 'pao-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update their own PAO uploads" on storage.objects;
create policy "Users update their own PAO uploads" on storage.objects
for update to authenticated
using (bucket_id = 'pao-uploads' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'pao-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own PAO uploads" on storage.objects;
create policy "Users delete their own PAO uploads" on storage.objects
for delete to authenticated
using (bucket_id = 'pao-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
