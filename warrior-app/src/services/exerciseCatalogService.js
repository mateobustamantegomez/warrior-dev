/**
 * exerciseCatalogService
 * -----------------------
 * SERVICE layer. Reads the closed exercise catalog from Supabase
 * (`public.exercise_catalog`, seeded from RepDB — see REQUIREMENTS.md
 * section 3.2 and scripts/build-exercise-catalog-seed.js). The AI only
 * ever returns catalog `id`s; this is where the app resolves them to the
 * actual name/images/instructions to render.
 */
import { supabase } from './supabaseClient.js'

function rowToExercise(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    grupo: row.grupo,
    equipo: row.equipo,
    instrucciones: row.instrucciones || [],
    tips: row.tips || [],
    imagenStart: row.imagen_start,
    imagenPeak: row.imagen_peak,
    imagenMain: row.imagen_main,
  }
}

/**
 * Fetches catalog rows for a given set of ids and returns them as a
 * `Map<id, exercise>` for O(1) lookup while rendering a day's exercise
 * list. Ignores ids that don't resolve (defensive — see the
 * hallucinated-id guard in the generate-routine Edge Function) rather than
 * throwing, so one bad id doesn't blank the whole screen.
 */
export async function fetchExerciseMap(ids) {
  const uniqueIds = [...new Set(ids)].filter(Boolean)
  if (uniqueIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('exercise_catalog')
    .select('*')
    .in('id', uniqueIds)

  if (error) throw new Error(error.message)

  const map = new Map()
  for (const row of data) map.set(row.id, rowToExercise(row))
  return map
}
