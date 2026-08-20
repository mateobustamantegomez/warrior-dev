/**
 * appStateService
 * ---------------
 * SERVICE layer. Persists the player's app state (profile, xp, routine,
 * split progress, workout history) in Supabase Postgres — one row per
 * user in `app_state`, protected by RLS (see supabase/schema.sql and
 * REQUIREMENTS.md section 0.1). Replaces the old localStorage-based
 * storageService now that real accounts exist.
 */
import { supabase } from './supabaseClient.js'

export const DEFAULT_APP_STATE = {
  profile: null,
  xp: 0,
  routine: null,
  currentDayIndex: 0,
  history: [],
  lastCompletedDate: null,
  // In-progress workout session (REQUIREMENTS.md 3.1/3.4 step 4).
  currentExerciseIndex: 0,
  sessionEntries: [],
}

function rowToState(row) {
  if (!row) return { ...DEFAULT_APP_STATE }
  return {
    profile: row.profile ?? null,
    xp: row.xp ?? 0,
    routine: row.routine ?? null,
    currentDayIndex: row.current_day_index ?? 0,
    history: row.history ?? [],
    lastCompletedDate: row.last_completed_date ?? null,
    currentExerciseIndex: row.current_exercise_index ?? 0,
    sessionEntries: row.session_entries ?? [],
  }
}

function stateToRow(userId, state) {
  return {
    user_id: userId,
    profile: state.profile,
    xp: state.xp,
    routine: state.routine,
    current_day_index: state.currentDayIndex,
    history: state.history,
    last_completed_date: state.lastCompletedDate,
    current_exercise_index: state.currentExerciseIndex,
    session_entries: state.sessionEntries,
    updated_at: new Date().toISOString(),
  }
}

export async function loadAppState(userId) {
  const { data, error } = await supabase
    .from('app_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return rowToState(data)
}

export async function saveAppState(userId, state) {
  const { error } = await supabase.from('app_state').upsert(stateToRow(userId, state))
  if (error) throw new Error(error.message)
}
