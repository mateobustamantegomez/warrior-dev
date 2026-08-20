import { TIERS, TIER_INFO } from '../models/ProfileModel.js'

/**
 * TierSelectView
 * --------------
 * VIEW layer. Lets the user pick onboarding depth (REQUIREMENTS.md
 * section 1). Reports the choice via `onSelect` — the composition root
 * decides what happens next (Basica skips straight to routine generation).
 *
 * Guests only get a taste of the product: Intermedia/Avanzada are locked
 * behind a real account, so `isGuest` disables everything but Basica.
 */
function TierSelectView({ onSelect, isGuest }) {
  return (
    <div className="tier-select">
      <h1>Elige tu nivel</h1>
      <p className="tier-subtitle">
        {isGuest
          ? 'Modo invitado: prueba una rutina de un día. Crea una cuenta para desbloquear planes completos.'
          : 'Entre más nos cuentes, más personalizada será tu rutina'}
      </p>

      <div className="tier-cards">
        {TIER_INFO.map((tier) => {
          const locked = isGuest && tier.id !== TIERS.BASICA
          return (
            <button
              key={tier.id}
              type="button"
              className={`tier-card${locked ? ' locked' : ''}`}
              disabled={locked}
              onClick={() => onSelect(tier.id)}
            >
              <span className="tier-card-label">
                {tier.label}
                {locked && <span className="tier-card-lock"> · Requiere cuenta</span>}
              </span>
              <span className="tier-card-desc">{tier.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TierSelectView
