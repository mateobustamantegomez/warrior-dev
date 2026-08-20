import { useState } from 'react'
import {
  GRUPOS_MUSCULARES,
  FULL_BODY,
  MAX_ENFOQUES,
  TIEMPOS_SESION,
  DEFAULT_TIEMPO_SESION,
  toggleEnfoque,
} from '../models/ProfileModel.js'

/**
 * FocusSelectView
 * ---------------
 * VIEW layer. Guest-only step before generating the one-day sample
 * routine: asks which muscle groups to train today (multi-select up to
 * MAX_ENFOQUES, or Full Body as the mutually-exclusive catch-all) and how
 * long the session should be. Selection rules live in
 * ProfileModel.toggleEnfoque — see REQUIREMENTS.md guest rule.
 */
function FocusSelectView({ onSelect, onBack }) {
  const [seleccion, setSeleccion] = useState([])
  const [tiempoSesion, setTiempoSesion] = useState(DEFAULT_TIEMPO_SESION)

  const fullBodyActivo = seleccion.includes(FULL_BODY)
  const enTope = seleccion.filter((g) => g !== FULL_BODY).length >= MAX_ENFOQUES

  function renderGrupo(grupo, { wide = false } = {}) {
    const activo = seleccion.includes(grupo)
    // Dim what a tap can no longer add, so a dead tap looks intentional.
    const bloqueado = !activo && (grupo === FULL_BODY ? seleccion.length > 0 : fullBodyActivo || enTope)

    return (
      <button
        key={grupo}
        type="button"
        aria-pressed={activo}
        className={[
          'focus-tile',
          wide ? 'focus-tile--wide' : '',
          activo ? 'is-selected' : '',
          bloqueado ? 'is-muted' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => setSeleccion(toggleEnfoque(seleccion, grupo))}
      >
        <span className="focus-tile-label">{grupo}</span>
      </button>
    )
  }

  return (
    <div className="tier-select">
      <button type="button" className="back-link" onClick={onBack}>&lsaquo; Cambiar nivel</button>

      <h1>¿Qué deseas trabajar hoy?</h1>

      <div className="focus-section">
        <p className="focus-legend">Grupos musculares · hasta {MAX_ENFOQUES}</p>
        <div className="focus-grid">
          {GRUPOS_MUSCULARES.map((grupo) => renderGrupo(grupo))}
          {renderGrupo(FULL_BODY, { wide: true })}
        </div>
      </div>

      <div className="focus-section">
        <p className="focus-legend">¿Cuánto tiempo tienes hoy?</p>
        <div className="focus-grid focus-grid--time">
          {TIEMPOS_SESION.map((tiempo) => (
            <button
              key={tiempo}
              type="button"
              aria-pressed={tiempo === tiempoSesion}
              className={[
                'focus-tile',
                'focus-tile--compact',
                tiempo === tiempoSesion ? 'is-selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setTiempoSesion(tiempo)}
            >
              <span className="focus-tile-label">{tiempo}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="focus-footer">
        <p className="focus-counter">
          {seleccion.length === 0
            ? 'Elige al menos un grupo muscular'
            : fullBodyActivo
              ? `Sesión completa balanceada · ${tiempoSesion}`
              : `${seleccion.length} de ${MAX_ENFOQUES} seleccionados · ${tiempoSesion}`}
        </p>

        <button
          type="button"
          className="btn-primary"
          disabled={seleccion.length === 0}
          onClick={() => onSelect({ enfoque: seleccion, tiempoSesion })}
        >
          Generar mi rutina
        </button>
      </div>
    </div>
  )
}

export default FocusSelectView
