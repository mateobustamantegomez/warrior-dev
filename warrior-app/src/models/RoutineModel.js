/**
 * RoutineModel
 * ------------
 * MODEL layer. Pure helpers for navigating a generated weekly split
 * (REQUIREMENTS.md section 2). The routine is always shaped as
 * `{ saludo, dias: [{ nombre, enfoque, ejercicios }] }` — Basica just
 * happens to have a single entry in `dias`, so the rest of the app never
 * needs to special-case tiers.
 *
 * The split rotates by completed session, not by calendar day: finishing
 * a day advances to the next one in the array regardless of the date.
 */

export function getDayForIndex(routine, dayIndex) {
  if (!routine || !routine.dias || routine.dias.length === 0) return null
  return routine.dias[dayIndex % routine.dias.length]
}

export function nextDayIndex(dayIndex, totalDias) {
  return (dayIndex + 1) % totalDias
}

/**
 * Every catalog `id` referenced anywhere in the routine, across all days —
 * used to batch-resolve names/images for RoutineSummaryView in one fetch
 * instead of one per day.
 */
export function allExerciseIds(routine) {
  if (!routine || !routine.dias) return []
  return routine.dias.flatMap((dia) => dia.ejercicios.map((ex) => ex.id))
}
