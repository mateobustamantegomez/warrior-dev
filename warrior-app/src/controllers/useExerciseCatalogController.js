/**
 * useExerciseCatalogController
 * -----------------------------
 * CONTROLLER layer. Resolves a list of catalog exercise ids to their full
 * records (name, images, instructions — see exerciseCatalogService.js) and
 * exposes loading/error state to any View that needs to render them.
 * Shared by RoutineSummaryView (the whole plan) and
 * useWorkoutSessionController (one day at a time).
 */
import { useEffect, useState } from 'react'
import { fetchExerciseMap } from '../services/exerciseCatalogService.js'

export function useExerciseCatalogController(ids) {
  const [catalog, setCatalog] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const idsKey = ids.join(',')

  useEffect(() => {
    let cancelled = false
    // Reset before the async fetch below whenever idsKey changes (e.g. a
    // new day mounts a fresh id list) — not derivable from render, since it
    // must happen exactly once per idsKey transition.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    fetchExerciseMap(idsKey ? idsKey.split(',') : [])
      .then((map) => {
        if (!cancelled) setCatalog(map)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [idsKey])

  return { catalog, loading, error }
}
