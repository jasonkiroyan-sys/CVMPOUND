-- CVMPOUND workout app — schema
-- Run in the Supabase SQL editor (or via the CLI) for a fresh project.
-- v1 is single-user: no RLS, but every table carries a nullable user_id so
-- multi-user is a later migration, not a reshape.

create extension if not exists "pgcrypto";

-- ── equipment catalog ─────────────────────────────────────────────────────────
create table if not exists equipment (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  category         text not null,                 -- chest|back|legs|shoulders|arms|core|cardio|full_body
  muscle_groups    text[] not null default '{}',
  equipment_type   text not null default 'machine', -- machine|cable|free_weight|bodyweight|cardio
  photo_url        text,
  description      text,
  weight_increment numeric not null default 5,
  is_active        boolean not null default true,
  user_id          uuid,
  created_at       timestamptz not null default now()
);
create index if not exists equipment_category_idx on equipment (category);
create index if not exists equipment_active_idx on equipment (is_active);

-- ── workout sessions ──────────────────────────────────────────────────────────
create table if not exists workout_sessions (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  notes       text,
  user_id     uuid,
  created_at  timestamptz not null default now()
);
create index if not exists sessions_open_idx on workout_sessions (ended_at);

-- ── logged sets ───────────────────────────────────────────────────────────────
create table if not exists workout_sets (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references workout_sessions (id) on delete cascade,
  equipment_id  uuid not null references equipment (id),
  set_number    int not null,
  weight        numeric,                       -- null for cardio
  reps          int,                           -- null for cardio
  rest_seconds  int,
  duration_seconds int,                        -- cardio: time on the machine (strength: null)
  logged_at     timestamptz not null default now(),
  user_id       uuid
);
create index if not exists sets_session_idx on workout_sets (session_id);
create index if not exists sets_equipment_idx on workout_sets (equipment_id);

-- ── coaching goals & programs ─────────────────────────────────────────────────
create table if not exists user_goals (
  id                 uuid primary key default gen_random_uuid(),
  goal_type          text not null,               -- strength|hypertrophy|fat_loss|general_fitness
  experience         text not null,               -- beginner|intermediate|advanced
  days_per_week      int not null,
  session_length_min int,
  notes              text,
  user_id            uuid,
  created_at         timestamptz not null default now()
);

create table if not exists coaching_programs (
  id            uuid primary key default gen_random_uuid(),
  goal_id       uuid references user_goals (id),
  title         text not null,
  summary       text not null default '',
  weeks         int not null default 4,
  days_per_week int not null,
  source        text not null default 'fallback', -- claude|fallback
  raw_json      jsonb,
  is_active     boolean not null default true,
  user_id       uuid,
  created_at    timestamptz not null default now()
);
create index if not exists programs_active_idx on coaching_programs (is_active);

create table if not exists program_days (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references coaching_programs (id) on delete cascade,
  week_number int not null,
  day_number  int not null,
  focus       text not null default '',
  exercises   jsonb not null default '[]',        -- [{equipment_id, equipment_name, equipment_slug, sets, reps, rest_seconds, notes}]
  created_at  timestamptz not null default now()
);
create index if not exists program_days_program_idx on program_days (program_id);

-- ── Storage bucket for equipment photos ───────────────────────────────────────
-- Public read so the app can render <img src=publicUrl>.
insert into storage.buckets (id, name, public)
values ('equipment-photos', 'equipment-photos', true)
on conflict (id) do nothing;

-- Allow anonymous uploads/reads to the bucket (single-user v1).
-- Tighten these policies when you add auth.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'cvmpound equipment photos read'
  ) then
    create policy "cvmpound equipment photos read"
      on storage.objects for select
      using (bucket_id = 'equipment-photos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'cvmpound equipment photos write'
  ) then
    create policy "cvmpound equipment photos write"
      on storage.objects for insert
      with check (bucket_id = 'equipment-photos');
  end if;
end $$;
