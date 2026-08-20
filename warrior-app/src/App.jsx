import { useEffect, useState } from 'react'
import './App.css'
import HomeView from './views/HomeView.jsx'
import TierSelectView from './views/TierSelectView.jsx'
import FocusSelectView from './views/FocusSelectView.jsx'
import ProfileFormView from './views/ProfileFormView.jsx'
import RoutineSummaryView from './views/RoutineSummaryView.jsx'
import RoutineView from './views/RoutineView.jsx'
import SessionSummaryView from './views/SessionSummaryView.jsx'
import RankBadge from './views/shared/RankBadge.jsx'
import BadgeGalleryView from './views/BadgeGalleryView.jsx'
import { useAuthController } from './controllers/useAuthController.js'
import { getLevelData, xpProgressPct } from './models/RankModel.js'
import { TIERS, NOMBRE_POR_DEFECTO, defaultProfileForTier } from './models/ProfileModel.js'
import { getDayForIndex, nextDayIndex } from './models/RoutineModel.js'
import { createLogEntry } from './models/WorkoutLogModel.js'
import { XP_POR_ENTRENAMIENTO } from './models/WorkoutSessionModel.js'
import { DEFAULT_APP_STATE, loadAppState, saveAppState } from './services/appStateService.js'
import { generarRutina } from './services/routineService.js'

/**
 * App
 * ---
 * Composition root. Wires Controllers (auth) and app state to Views.
 * Deliberately thin — no business logic lives here beyond routing between
 * screens; see controllers/ and models/ for that.
 */

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function App() {
  const { auth, authLoading, continueAsGuest, signIn, signUp, logout } = useAuthController()
  const [state, setState] = useState(DEFAULT_APP_STATE)
  const [stateLoading, setStateLoading] = useState(true)
  const [tier, setTier] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [justGenerated, setJustGenerated] = useState(false)
  const [askingFocus, setAskingFocus] = useState(false)
  const [sessionSummary, setSessionSummary] = useState(null)

  useEffect(() => {
    // Reset local state before the async Supabase fetch below whenever the
    // signed-in user changes (login/logout/switch) — not derivable from
    // render, since it must happen exactly once per user-id transition.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(DEFAULT_APP_STATE)
    setStateLoading(true)

    if (!auth.userId) return

    loadAppState(auth.userId)
      .then((loaded) => setState(loaded))
      .catch((err) => setError(err.message))
      .finally(() => setStateLoading(false))
  }, [auth.userId])

  function persist(next) {
    setState(next)
    saveAppState(auth.userId, next).catch((err) => setError(err.message))
  }

  async function handleProfileSubmit(profile) {
    setCargando(true)
    setError(null)
    try {
      const routine = await generarRutina(profile)
      persist({ ...state, profile, routine })
      setJustGenerated(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  // Fired on every Prev/Next inside the exercise-by-exercise view — NOT on
  // every keystroke (REQUIREMENTS.md 3.1.4) — so closing the app mid-gym-
  // session resumes at the right exercise with what was already typed.
  function handleSessionPersist(partial) {
    persist({ ...state, ...partial })
  }

  function handleFinishSession(logEntries) {
    const totalDias = state.routine.dias.length
    const day = getDayForIndex(state.routine, state.currentDayIndex)
    const logEntry = createLogEntry(todayStr(), state.currentDayIndex, day.nombre, logEntries)
    const rankBefore = getLevelData(state.xp).current
    const newXp = state.xp + XP_POR_ENTRENAMIENTO
    const rankAfter = getLevelData(newXp).current

    persist({
      ...state,
      xp: newXp,
      lastCompletedDate: todayStr(),
      history: [...state.history, logEntry],
      currentDayIndex: nextDayIndex(state.currentDayIndex, totalDias),
      currentExerciseIndex: 0,
      sessionEntries: [],
    })
    setSessionSummary({ xpGanado: XP_POR_ENTRENAMIENTO, rankBefore, rankAfter })
  }

  function handleTierSelect(selectedTier) {
    if (selectedTier === TIERS.BASICA) {
      if (auth.isAnonymous) {
        setAskingFocus(true)
      } else {
        handleProfileSubmit(defaultProfileForTier(TIERS.BASICA))
      }
    } else {
      setTier(selectedTier)
    }
  }

  function handleFocusSelect({ enfoque, tiempoSesion }) {
    setAskingFocus(false)
    handleProfileSubmit({ ...defaultProfileForTier(TIERS.BASICA), enfoque, tiempoSesion })
  }

  // Dev/demo insignia gallery — checked after the hooks above so the hook
  // order stays stable. Not reachable from the normal flow.
  if (new URLSearchParams(window.location.search).has('badges')) {
    return (
      <div className="app-shell">
        <BadgeGalleryView />
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="app-shell">
        <p className="status-msg">Cargando...</p>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="app-shell">
        <HomeView onSignIn={signIn} onSignUp={signUp} onGuestEnter={continueAsGuest} />
      </div>
    )
  }

  if (stateLoading) {
    return (
      <div className="app-shell">
        <p className="status-msg">Cargando tu progreso...</p>
      </div>
    )
  }

  if (!state.profile || !state.routine) {
    return (
      <div className="app-shell">
        {askingFocus ? (
          <FocusSelectView onSelect={handleFocusSelect} onBack={() => setAskingFocus(false)} />
        ) : !tier ? (
          <>
            <button className="logout-link" onClick={logout}>Salir</button>
            <TierSelectView onSelect={handleTierSelect} isGuest={auth.isAnonymous} />
          </>
        ) : (
          <ProfileFormView tier={tier} onSubmit={handleProfileSubmit} onBack={() => setTier(null)} />
        )}
        {cargando && <p className="status-msg">Generando tu rutina...</p>}
        {error && <p className="status-msg error">{error}</p>}
      </div>
    )
  }

  if (justGenerated) {
    return (
      <div className="app-shell">
        <RoutineSummaryView
          saludo={state.routine.saludo}
          dias={state.routine.dias}
          onStart={() => setJustGenerated(false)}
        />
      </div>
    )
  }

  if (sessionSummary) {
    return (
      <div className="app-shell">
        <SessionSummaryView
          xpGanado={sessionSummary.xpGanado}
          rankBefore={sessionSummary.rankBefore}
          rankAfter={sessionSummary.rankAfter}
          onContinue={() => setSessionSummary(null)}
        />
      </div>
    )
  }

  const { current, next } = getLevelData(state.xp)
  const completedToday = state.lastCompletedDate === todayStr()
  const totalDias = state.routine.dias.length
  const day = getDayForIndex(state.routine, state.currentDayIndex)

  return (
    <div className="app-shell">
      <header className="dashboard-header">
        <button className="logout-link" onClick={logout}>Salir</button>
        <div className="rank-block">
          <RankBadge insignia={current.insignia} title={current.title} />
          <p className="rank-title">{current.title}</p>
          {/* Only show a name the user actually gave us — the Basica
              placeholder is filler and just crowds the badge. */}
          {state.profile.nombre !== NOMBRE_POR_DEFECTO && (
            <p className="warrior-name">{state.profile.nombre}</p>
          )}
        </div>
      </header>

      {/* Doubles as the divider under the header: the rule that used to
          separate badge from content IS the XP bar now. Shows progress only
          — the next rank's name is deliberately left out. */}
      <div className="xp-strip">
        <div className="xp-strip-fill" style={{ width: `${xpProgressPct(state.xp)}%` }} />
        <p className="xp-strip-label">
          {next
            ? `${state.xp.toLocaleString('es')} XP / ${next.xpRequired.toLocaleString('es')}`
            : `${state.xp.toLocaleString('es')} XP · Máximo`}
        </p>
      </div>

      <RoutineView
        key={state.currentDayIndex}
        saludo={state.routine.saludo}
        day={day}
        dayPosition={(state.currentDayIndex % totalDias) + 1}
        totalDias={totalDias}
        history={state.history}
        completedToday={completedToday}
        persisted={{ currentExerciseIndex: state.currentExerciseIndex, sessionEntries: state.sessionEntries }}
        onPersist={handleSessionPersist}
        onFinish={handleFinishSession}
      />

      {error && <p className="status-msg error">{error}</p>}

      {/* RepDB license term 2: visible attribution is required wherever the
          exercise data/images are used. */}
      <p className="attribution">Exercise data by RepDB (repdb.co)</p>
    </div>
  )
}

export default App
