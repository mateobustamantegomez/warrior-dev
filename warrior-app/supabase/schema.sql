-- Warrior App — app_state table
-- One row per user, JSONB-shaped to mirror the old localStorage state
-- (see REQUIREMENTS.md section 0.1). RLS ensures each user only ever
-- reads/writes their own row.

create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb,
  xp integer not null default 0,
  routine jsonb,
  current_day_index integer not null default 0,
  history jsonb not null default '[]'::jsonb,
  last_completed_date date,
  -- In-progress workout session (REQUIREMENTS.md 3.1/3.4 step 4): which
  -- exercise the user is on and the weight typed so far, so closing the
  -- app mid-gym-session and reopening it resumes exactly where it left off.
  current_exercise_index integer not null default 0,
  session_entries jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Added 2026-08-20 (section 3.4 step 4) for rows created before this
-- column pair existed — safe to re-run.
alter table public.app_state add column if not exists current_exercise_index integer not null default 0;
alter table public.app_state add column if not exists session_entries jsonb not null default '[]'::jsonb;

alter table public.app_state enable row level security;

create policy "Users can view their own app_state"
  on public.app_state for select
  using (auth.uid() = user_id);

create policy "Users can insert their own app_state"
  on public.app_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own app_state"
  on public.app_state for update
  using (auth.uid() = user_id);

create policy "Users can delete their own app_state"
  on public.app_state for delete
  using (auth.uid() = user_id);

-- Warrior App — exercise_catalog table
-- Closed catalog of exercises (REQUIREMENTS.md section 3.2). The AI picks
-- an `id` from this table instead of inventing exercise names, so the app
-- can resolve image/instructions locally. Source data is RepDB free tier
-- (repdb.co) — read-only for the app, seeded separately (see
-- scripts/build-exercise-catalog-seed.js). The seed data itself is never
-- committed to this repo: RepDB's license forbids redistributing the
-- dataset and this repo is public.

create table if not exists public.exercise_catalog (
  id text primary key,
  nombre text not null,
  grupo text not null,
  equipo text,
  instrucciones text[] not null default '{}',
  tips text[] not null default '{}',
  imagen_start text,
  imagen_peak text,
  imagen_main text
);

alter table public.exercise_catalog enable row level security;

-- Read-only for any authenticated session — anonymous-auth guests count as
-- "authenticated" in Supabase's sense, so this also covers "Entrar como
-- invitado". No insert/update/delete policy: writes happen only via the
-- seed script run with a service-role key, never from the client.
create policy "Authenticated users can read the exercise catalog"
  on public.exercise_catalog for select
  using (auth.role() = 'authenticated');
