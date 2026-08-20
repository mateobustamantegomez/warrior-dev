-- Adds the exercise_catalog table (REQUIREMENTS.md section 3.2) and the
-- two new app_state columns for in-progress workout sessions (section
-- 3.4 step 4). Only the NEW pieces live here — app_state itself and its
-- original 4 policies already exist on the live project from before this
-- repo used CLI-tracked migrations, and re-declaring those policies
-- (no `if not exists` support for policies in Postgres) would error.
-- supabase/schema.sql stays the full reference for setting up a project
-- from scratch; this file is what actually ships via `supabase db push`.

alter table public.app_state add column if not exists current_exercise_index integer not null default 0;
alter table public.app_state add column if not exists session_entries jsonb not null default '[]'::jsonb;

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

create policy "Authenticated users can read the exercise catalog"
  on public.exercise_catalog for select
  using (auth.role() = 'authenticated');
