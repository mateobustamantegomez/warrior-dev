/**
 * WorkoutSessionModel
 * -------------------
 * MODEL layer. Pure helpers for an in-progress exercise-by-exercise
 * session (REQUIREMENTS.md section 3.1/3.4 step 4): which exercise the
 * user is on and the weight typed for each one so far. Persisted
 * server-side as `currentExerciseIndex` + `sessionEntries` in `app_state`
 * (appStateService.js) so closing the app mid-workout and reopening it
 * resumes exactly where it left off.
 */

/**
 * Flat XP awarded per completed day (REQUIREMENTS.md section 4). Placeholder
 * until XP scales with volume (series x reps x peso) — see RankModel.js.
 */
export const XP_POR_ENTRENAMIENTO = 100

/** One draft entry per exercise in the day, weight blank until typed. */
export function createEmptySessionEntries(ejercicios) {
  return ejercicios.map((ex) => ({ ejercicioId: ex.id, peso: '' }))
}

/**
 * Reconciles saved session entries against the day's current exercise
 * list. Guards against a stale session (e.g. a day shape that changed
 * since the entries were saved) — falls back to a fresh empty session
 * rather than crashing on a length/id mismatch.
 */
export function resumeSessionEntries(ejercicios, savedEntries) {
  if (!Array.isArray(savedEntries) || savedEntries.length !== ejercicios.length) {
    return createEmptySessionEntries(ejercicios)
  }
  const byId = new Map(savedEntries.map((e) => [e.ejercicioId, e.peso]))
  return ejercicios.map((ex) => ({ ejercicioId: ex.id, peso: byId.get(ex.id) ?? '' }))
}

export function setPesoAt(entries, index, peso) {
  return entries.map((e, i) => (i === index ? { ...e, peso } : e))
}

export function isLastExercise(index, total) {
  return index >= total - 1
}

export function clampIndex(index, total) {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0))
}
