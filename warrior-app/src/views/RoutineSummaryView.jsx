import { useExerciseCatalogController } from '../controllers/useExerciseCatalogController.js'
import { allExerciseIds } from '../models/RoutineModel.js'

/**
 * RoutineSummaryView
 * ------------------
 * VIEW layer. Shows the full generated split (every day, every exercise)
 * right after generation, before the user starts logging day one — so they
 * see the whole plan up front instead of being dropped straight into
 * today's workout.
 *
 * Wording keys off dias.length, not guest status: Basica generates a
 * single day for guests AND for real accounts, and "semana" would be a lie
 * in both cases.
 *
 * Section 3.2: the routine only carries catalog `id`s now, so names are
 * resolved here via the catalog controller instead of being read straight
 * off the exercise object.
 */
function RoutineSummaryView({ saludo, dias, onStart }) {
  const unSoloDia = dias.length === 1
  const { catalog, loading } = useExerciseCatalogController(allExerciseIds({ dias }))

  return (
    <div className="routine-summary">
      {saludo && <p className="routine-greeting">{saludo}</p>}
      <h1>{unSoloDia ? 'Tu plan del día' : 'Tu plan de la semana'}</h1>

      {loading ? (
        <p className="status-msg">Cargando tu plan...</p>
      ) : (
        <div className="summary-days">
          {dias.map((day, i) => (
            <div key={i} className="summary-day-card">
              <p className="summary-day-title">
                {/* On a single-day plan "Dia 1" is noise — the focus is the
                    only meaningful label. */}
                {unSoloDia
                  ? (day.enfoque || day.nombre)
                  : `${day.nombre}${day.enfoque ? ` · ${day.enfoque}` : ''}`}
              </p>
              <ul className="summary-exercise-list">
                {day.ejercicios.map((ex, j) => (
                  <li key={j}>
                    <span className="ejercicio">{catalog.get(ex.id)?.nombre ?? '...'}</span>
                    <span className="detalle">{ex.series} x {ex.reps}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <button className="btn-primary" onClick={onStart}>Comenzar mi entrenamiento</button>
    </div>
  )
}

export default RoutineSummaryView
