/**
 * useWorkoutSessionController
 * -----------------------------
 * CONTROLLER layer. Drives the exercise-by-exercise workout session
 * (REQUIREMENTS.md section 3.1/3.4): resolves today's exercises from the
 * catalog, tracks which one the user is on and the weight typed for each,
 * and persists progress to Supabase whenever the user navigates —
 * "cada vez que pasa de ejercicio se persiste" — not on every keystroke.
 *
 * `day`/`history`/`persisted` are treated as the state at mount time; the
 * View mounts a fresh instance per day (keyed by day index in App.jsx), so
 * re-running this controller for a new day is just remounting it.
 */
import { useState } from 'react'
import { useExerciseCatalogController } from './useExerciseCatalogController.js'
import { findLastEntryFor } from '../models/WorkoutLogModel.js'
import {
  resumeSessionEntries,
  setPesoAt,
  isLastExercise,
  clampIndex,
} from '../models/WorkoutSessionModel.js'

export function useWorkoutSessionController({ day, history, persisted, onPersist, onFinish }) {
  const ejercicios = day.ejercicios
  const total = ejercicios.length

  const [index, setIndex] = useState(() => clampIndex(persisted.currentExerciseIndex, total))
  const [entries, setEntries] = useState(() => resumeSessionEntries(ejercicios, persisted.sessionEntries))

  const { catalog, loading, error } = useExerciseCatalogController(ejercicios.map((e) => e.id))

  const prescripcion = ejercicios[index]
  const detalle = catalog.get(prescripcion?.id)
  const last = findLastEntryFor(history, prescripcion?.id)

  const current = detalle && {
    ...detalle,
    series: prescripcion.series,
    reps: prescripcion.reps,
    pesoAnterior: last?.peso ?? null,
    pesoHoy: entries[index]?.peso ?? '',
  }

  function setPesoHoy(value) {
    setEntries((prev) => setPesoAt(prev, index, value))
  }

  function goTo(newIndex) {
    const clamped = clampIndex(newIndex, total)
    setIndex(clamped)
    onPersist({ currentExerciseIndex: clamped, sessionEntries: entries })
  }

  function finish() {
    const logEntries = entries.map((e) => ({
      ejercicioId: e.ejercicioId,
      nombre: catalog.get(e.ejercicioId)?.nombre ?? '',
      peso: e.peso,
    }))
    onFinish(logEntries)
  }

  return {
    loading,
    error,
    current,
    index,
    total,
    isLast: isLastExercise(index, total),
    setPesoHoy,
    goNext: () => goTo(index + 1),
    goPrev: () => goTo(index - 1),
    finish,
  }
}
