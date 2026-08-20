/**
 * routineService
 * --------------
 * SERVICE layer. Calls the `generate-routine` Supabase Edge Function,
 * which in turn calls the Groq API. The Groq key never reaches this file
 * or the browser — it lives only in the Edge Function's secrets (see
 * supabase/functions/generate-routine/index.ts).
 */
import { supabase } from './supabaseClient.js'

/**
 * Requests an AI-generated weekly split for the given profile.
 * Throws with a user-facing message on failure.
 */
export async function generarRutina(profile) {
  const { data, error } = await supabase.functions.invoke('generate-routine', {
    body: profile,
  })

  if (error) throw new Error(error.message || 'Error generando la rutina')
  if (data?.error) throw new Error(data.error)
  return data
}
