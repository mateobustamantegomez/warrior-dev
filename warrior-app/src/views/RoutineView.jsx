import { useWorkoutSessionController } from '../controllers/useWorkoutSessionController.js'

/**
 * RoutineView
 * -----------
 * VIEW layer. Section 3.1 rewrite: one exercise at a time instead of a
 * flat list with weight/reps inputs. Shows the exercise's image(s), name,
 * prescription (series x reps, read-only), the last weight logged for it,
 * and a single editable weight field. Prev/Next move through the day;
 * "Terminar entrenamiento" appears only on the last exercise.
 *
 * All the state (which exercise, what's typed, saving on advance) lives in
 * useWorkoutSessionController — this component is display-only. Mount it
 * with a `key` tied to the day index in the parent, same as before: a new
 * day needs a fresh controller instance.
 */
function ExerciseImage({ exercise }) {
  // Section 3.3: RepDB's flat-style illustrations sit on a light backdrop
  // that clashes hard with the black HUD. Rather than fight that with blend
  // modes (unpredictable across ~250 varied images, term 5 of RepDB's
  // license also rules out any generative-AI cleanup), the frame leans into
  // it: the light rectangle reads as a lit instrument-panel readout, with
  // HUD viewfinder corners selling the "ficha técnica" framing on purpose.
  if (exercise.imagenStart && exercise.imagenPeak) {
    return (
      <div className="exercise-image-pair">
        <div className="exercise-image-frame">
          <span className="frame-corner frame-corner--tl" />
          <span className="frame-corner frame-corner--br" />
          <img src={exercise.imagenStart} alt={`${exercise.nombre} — posición inicial`} loading="lazy" />
        </div>
        <span className="exercise-image-arrow" aria-hidden="true">&rsaquo;&rsaquo;</span>
        <div className="exercise-image-frame">
          <span className="frame-corner frame-corner--tl" />
          <span className="frame-corner frame-corner--br" />
          <img src={exercise.imagenPeak} alt={`${exercise.nombre} — posición final`} loading="lazy" />
        </div>
      </div>
    )
  }

  if (exercise.imagenMain) {
    return (
      <div className="exercise-image-frame exercise-image-frame--wide">
        <span className="frame-corner frame-corner--tl" />
        <span className="frame-corner frame-corner--br" />
        <img src={exercise.imagenMain} alt={exercise.nombre} loading="lazy" />
      </div>
    )
  }

  return null
}

function RoutineView({ saludo, day, dayPosition, totalDias, history, completedToday, persisted, onPersist, onFinish }) {
  const session = useWorkoutSessionController({ day, history, persisted, onPersist, onFinish })

  if (completedToday) {
    return (
      <div className="routine-view">
        {totalDias > 1 && <p className="day-progress">Día {dayPosition} de {totalDias}</p>}
        <h2>{day.enfoque || day.nombre}</h2>
        <p className="status-msg">Rutina completada hoy. Vuelve mañana, guerrero.</p>
      </div>
    )
  }

  if (session.loading) {
    return (
      <div className="routine-view">
        <p className="status-msg">Cargando ejercicio...</p>
      </div>
    )
  }

  if (session.error || !session.current) {
    return (
      <div className="routine-view">
        <p className="status-msg error">{session.error || 'No se pudo cargar este ejercicio.'}</p>
      </div>
    )
  }

  const ex = session.current

  return (
    <div className="routine-view">
      {saludo && <p className="routine-greeting">{saludo}</p>}
      {totalDias > 1 && <p className="day-progress">Día {dayPosition} de {totalDias}</p>}
      <h2>{day.enfoque || day.nombre}</h2>

      <p className="exercise-counter">Ejercicio {session.index + 1} de {session.total}</p>

      <ExerciseImage exercise={ex} />

      <h3 className="exercise-name">{ex.nombre}</h3>
      <p className="exercise-prescripcion">{ex.series} series &times; {ex.reps} reps</p>

      <label>
        Peso de hoy (kg)
        <input
          type="number"
          inputMode="decimal"
          placeholder={ex.pesoAnterior ? `Antes: ${ex.pesoAnterior} kg` : 'kg'}
          value={ex.pesoHoy}
          onChange={(e) => session.setPesoHoy(e.target.value)}
        />
      </label>

      <div className="exercise-nav">
        <button type="button" className="exercise-nav-btn" onClick={session.goPrev} disabled={session.index === 0}>
          &lsaquo; Anterior
        </button>
        {session.isLast ? (
          <button type="button" className="btn-primary" onClick={session.finish}>
            Terminar entrenamiento
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={session.goNext}>
            Siguiente &rsaquo;
          </button>
        )}
      </div>
    </div>
  )
}

export default RoutineView
