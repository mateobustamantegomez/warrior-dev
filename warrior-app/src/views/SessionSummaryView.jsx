import RankBadge from './shared/RankBadge.jsx'

/**
 * SessionSummaryView
 * -------------------
 * VIEW layer. Section 3.4 step 6 — the reward screen shown after the last
 * exercise of the day ("Terminar entrenamiento"): XP earned, and a
 * promotion callout if the session pushed the warrior into a new rank.
 * Named distinctly from RoutineSummaryView, which shows the generated
 * plan up front rather than what was just earned.
 */
function SessionSummaryView({ xpGanado, rankBefore, rankAfter, onContinue }) {
  const ascendio = rankAfter.level > rankBefore.level

  return (
    <div className="session-summary">
      <p className="session-summary-eyebrow">Entrenamiento completado</p>
      <h1 className="session-summary-xp">+{xpGanado} XP</h1>

      {ascendio ? (
        <div className="session-summary-promotion">
          <RankBadge insignia={rankAfter.insignia} title={rankAfter.title} />
          <p className="session-summary-promotion-label">Ascendiste a</p>
          <p className="session-summary-promotion-title">{rankAfter.title}</p>
        </div>
      ) : (
        <div className="session-summary-promotion">
          <RankBadge insignia={rankAfter.insignia} title={rankAfter.title} />
          <p className="session-summary-promotion-title">{rankAfter.title}</p>
        </div>
      )}

      <button type="button" className="btn-primary" onClick={onContinue}>Continuar</button>
    </div>
  )
}

export default SessionSummaryView
