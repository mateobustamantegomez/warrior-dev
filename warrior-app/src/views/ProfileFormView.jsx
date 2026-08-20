import { useState } from 'react'
import DropdownSelect from './shared/DropdownSelect.jsx'
import {
  TIERS,
  GENEROS,
  OBJETIVOS,
  DIAS_SEMANA,
  TIEMPOS_SESION,
  defaultProfileForTier,
} from '../models/ProfileModel.js'

/**
 * ProfileFormView
 * ---------------
 * VIEW layer. Renders onboarding fields for the given tier (Intermedia or
 * Avanzada — Basica skips this view entirely, see App.jsx). Avanzada adds
 * years of experience, injuries and free-form notes on top of the shared
 * Intermedia fields (REQUIREMENTS.md section 1).
 */
function ProfileFormView({ tier, onSubmit, onBack }) {
  const [form, setForm] = useState(() => defaultProfileForTier(tier))

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const listo = form.nombre.trim() && form.peso

  function handleSubmit(e) {
    e.preventDefault()
    if (!listo) return
    onSubmit({ ...form, nombre: form.nombre.trim() })
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <button type="button" className="back-link" onClick={onBack}>&lsaquo; Cambiar nivel</button>

      <h1>Únete como Guerrero</h1>

      <label>
        Nombre
        <input value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} placeholder="Tu nombre" />
      </label>

      <DropdownSelect label="Género" options={GENEROS} value={form.genero} onChange={(v) => setField('genero', v)} />

      <label>
        Edad
        <input type="number" value={form.edad} onChange={(e) => setField('edad', e.target.value)} placeholder="25" />
      </label>

      <label>
        Altura (cm)
        <input type="number" value={form.altura} onChange={(e) => setField('altura', e.target.value)} placeholder="170" />
      </label>

      <label>
        Peso (kg)
        <input type="number" value={form.peso} onChange={(e) => setField('peso', e.target.value)} placeholder="70" />
      </label>

      <DropdownSelect
        label="Días por semana"
        options={DIAS_SEMANA}
        value={form.diasSemana}
        onChange={(v) => setField('diasSemana', v)}
      />

      <DropdownSelect
        label="Tiempo por sesión"
        options={TIEMPOS_SESION}
        value={form.tiempoSesion}
        onChange={(v) => setField('tiempoSesion', v)}
      />

      <DropdownSelect label="Objetivo" options={OBJETIVOS} value={form.objetivo} onChange={(v) => setField('objetivo', v)} />

      {tier === TIERS.AVANZADA && (
        <>
          <label>
            Años entrenando
            <input
              type="number"
              value={form.aniosExperiencia}
              onChange={(e) => setField('aniosExperiencia', e.target.value)}
              placeholder="2"
            />
          </label>

          <label>
            Lesiones (si aplica)
            <input value={form.lesiones} onChange={(e) => setField('lesiones', e.target.value)} placeholder="Ninguna" />
          </label>

          <label>
            Notas adicionales
            <textarea
              value={form.notas}
              onChange={(e) => setField('notas', e.target.value)}
              placeholder="Cualquier cosa relevante para tu rutina"
              rows={3}
            />
          </label>
        </>
      )}

      <button type="submit" disabled={!listo}>Generar mi rutina</button>
    </form>
  )
}

export default ProfileFormView
