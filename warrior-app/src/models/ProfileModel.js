/**
 * ProfileModel
 * ------------
 * MODEL layer. Defines the three onboarding tiers (REQUIREMENTS.md
 * section 1), their option lists, and the default profile shape for each
 * tier. Pure data — no React, no storage access.
 */

export const TIERS = {
  BASICA: 'basica',
  INTERMEDIA: 'intermedia',
  AVANZADA: 'avanzada',
}

export const TIER_INFO = [
  {
    id: TIERS.BASICA,
    label: 'Básica',
    description: 'Sin datos. Arranca ya con una rutina general.',
  },
  {
    id: TIERS.INTERMEDIA,
    label: 'Intermedia',
    description: 'Género, edad, altura, peso, días/semana y objetivo.',
  },
  {
    id: TIERS.AVANZADA,
    label: 'Avanzada',
    description: 'Todo lo anterior + experiencia, lesiones y notas.',
  },
]

export const GENEROS = ['Hombre', 'Mujer', 'Prefiero no decir']
export const OBJETIVOS = ['Ganar músculo', 'Perder grasa', 'Mantenerme', 'Rendimiento deportivo']
export const DIAS_SEMANA = ['2', '3', '4', '5', '6']
export const TIEMPOS_SESION = ['30 min', '60 min', '90 min', '2 horas']

/** Preselected session length so the guest flow never starts empty. */
export const DEFAULT_TIEMPO_SESION = TIEMPOS_SESION[1]

/**
 * Muscle-group options asked only of guests before generating their
 * one-day sample routine (REQUIREMENTS.md guest rule). Kept separate from
 * FULL_BODY because the two behave differently: specific groups are
 * multi-selectable, Full Body is the mutually-exclusive catch-all.
 */
export const GRUPOS_MUSCULARES = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Abdomen']
export const FULL_BODY = 'Full Body'

/**
 * Cap on specific groups per sample day — it is a single session, and
 * beyond three groups the routine stops being a coherent workout.
 */
export const MAX_ENFOQUES = 3

/**
 * Pure selection rule for the guest focus screen. Returns the next
 * selection array given the current one and the group that was tapped:
 * - Full Body clears everything else (and toggles itself off)
 * - picking a specific group drops Full Body
 * - taps past MAX_ENFOQUES are ignored, not silently swapped
 */
export function toggleEnfoque(seleccion, grupo) {
  if (grupo === FULL_BODY) {
    return seleccion.includes(FULL_BODY) ? [] : [FULL_BODY]
  }

  const especificos = seleccion.filter((g) => g !== FULL_BODY)

  if (especificos.includes(grupo)) {
    return especificos.filter((g) => g !== grupo)
  }

  return especificos.length >= MAX_ENFOQUES ? especificos : [...especificos, grupo]
}

/**
 * Builds the initial (empty) profile object for a given tier.
 * Basica intentionally has no personal-data fields (see REQUIREMENTS.md);
 * `nombre` still defaults so the dashboard has something to display.
 */
/**
 * Placeholder name for tiers that never ask for one. Exported so the
 * dashboard can tell "the user told us their name" from "we made one up"
 * and skip rendering the filler.
 */
export const NOMBRE_POR_DEFECTO = 'Guerrero'

export function defaultProfileForTier(tier) {
  if (tier === TIERS.BASICA) {
    return { tier, nombre: NOMBRE_POR_DEFECTO }
  }

  const base = {
    tier,
    nombre: '',
    genero: GENEROS[0],
    edad: '',
    altura: '',
    peso: '',
    diasSemana: DIAS_SEMANA[1],
    tiempoSesion: TIEMPOS_SESION[1],
    objetivo: OBJETIVOS[0],
  }

  if (tier === TIERS.AVANZADA) {
    return { ...base, aniosExperiencia: '', lesiones: '', notas: '' }
  }

  return base
}
