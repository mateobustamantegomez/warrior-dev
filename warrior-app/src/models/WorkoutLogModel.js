/**
 * WorkoutLogModel
 * ---------------
 * MODEL layer. Shape of a logged workout day (REQUIREMENTS.md section 3)
 * and the lookup that finds the most recent weight logged for a given
 * catalog exercise, so the View can show the user their own progress.
 *
 * Section 3.1/3.2 rewrite: entries are keyed by the catalog `ejercicioId`
 * instead of a free-text name (the AI never invents names anymore, so the
 * id is the only stable key), and `reps` is gone — reps are a prescription
 * the routine already shows, not something the user reports back.
 */

export function createLogEntry(dateStr, dayIndex, dayNombre, entries) {
  return { date: dateStr, dayIndex, dayNombre, entries }
}

export function findLastEntryFor(history, ejercicioId) {
  for (let i = history.length - 1; i >= 0; i--) {
    const found = history[i].entries.find((e) => e.ejercicioId === ejercicioId)
    if (found && found.peso) return found
  }
  return null
}
