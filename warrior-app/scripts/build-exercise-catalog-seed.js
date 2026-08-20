// build-exercise-catalog-seed.js
// -------------------------------
// One-off data prep script (REQUIREMENTS.md section 3.2). Downloads the
// RepDB free-tier dataset fresh, trims it to the fields the app actually
// uses, and writes a SQL seed file that loads it into Supabase.
//
// The seed file (supabase/seed/exercise_catalog.seed.sql) is NEVER
// committed — see .gitignore. RepDB's free-tier license (term 3)
// prohibits redistributing the dataset, even in a modified/trimmed form,
// and this repo is public. Re-run this script any time you need to
// (re)generate the seed instead of relying on a committed copy.
//
// Usage: node scripts/build-exercise-catalog-seed.js
// Then load the result into Supabase (SQL editor or `supabase db push`
// with your own access token) — this script does not touch the DB itself,
// so no service-role key is needed to run it.

import { writeFileSync, mkdirSync } from 'node:fs'

const SOURCE_URL = 'https://raw.githubusercontent.com/sergei-argutin/exercise-dataset/main/exercises.json'
// Image paths in the dataset are relative to the repo root (e.g.
// "images/flat/bench-press-start.webp") — prefix with this to get a URL
// the browser can actually load (see warrior-dev#1).
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/sergei-argutin/exercise-dataset/main/'
const OUT_DIR = new URL('../supabase/seed/', import.meta.url)
const OUT_FILE = new URL('exercise_catalog.seed.sql', OUT_DIR)

// RepDB's `body_part` values, mapped to the muscle groups the app already
// shows on the guest focus screen (REQUIREMENTS.md section 1). Two RepDB
// parts collapse into each of Piernas/Brazos, matching the coverage table
// already agreed in the requirements doc.
const GRUPO_POR_BODY_PART = {
  chest: 'Pecho',
  back: 'Espalda',
  upper_legs: 'Piernas',
  lower_legs: 'Piernas',
  shoulders: 'Hombros',
  upper_arms: 'Brazos',
  lower_arms: 'Brazos',
  core: 'Abdomen',
  full_body: 'Full Body',
}

function sqlString(value) {
  if (value === null || value === undefined) return 'null'
  return `'${String(value).replace(/'/g, "''")}'`
}

function sqlTextArray(arr) {
  if (!arr || arr.length === 0) return 'null'
  const items = arr.map((s) => sqlString(s)).join(', ')
  return `array[${items}]::text[]`
}

async function main() {
  console.log(`Descargando dataset desde ${SOURCE_URL} ...`)
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`Descarga falló: HTTP ${res.status}`)
  const data = await res.json()
  const exercises = data.exercises

  console.log(`${exercises.length} ejercicios recibidos (dataset dice count=${data.count}).`)

  const rows = []
  const gruposSinMapear = new Set()
  let sinEspanol = 0

  for (const ex of exercises) {
    const grupo = GRUPO_POR_BODY_PART[ex.body_part]
    if (!grupo) gruposSinMapear.add(ex.body_part)
    if (!ex.name_es || !ex.description_es) sinEspanol++

    const flat = ex.images?.flat || {}
    const imagenStart = flat.start ? IMAGE_BASE_URL + flat.start : null
    const imagenPeak = flat.peak ? IMAGE_BASE_URL + flat.peak : null
    const imagenMain = flat.main ? IMAGE_BASE_URL + flat.main : null

    rows.push({
      id: ex.id,
      nombre: ex.name_es,
      grupo: grupo ?? ex.body_part,
      equipo: ex.equipment ?? null,
      instrucciones: ex.instructions_es ?? [],
      tips: ex.tips_es ?? [],
      imagenStart,
      imagenPeak,
      imagenMain,
    })
  }

  if (gruposSinMapear.size > 0) {
    console.warn('ADVERTENCIA — body_part sin mapeo a grupo de la app:', [...gruposSinMapear])
  }
  if (sinEspanol > 0) {
    console.warn(`ADVERTENCIA — ${sinEspanol} ejercicios sin nombre/descripción en español.`)
  }

  const parEjercicios = rows.filter((r) => r.imagenStart && r.imagenPeak).length
  const unicaEjercicios = rows.filter((r) => !r.imagenStart && r.imagenMain).length
  const sinImagen = rows.filter((r) => !r.imagenStart && !r.imagenMain).length
  console.log(`Imagen par (start+peak): ${parEjercicios}`)
  console.log(`Imagen única (main): ${unicaEjercicios}`)
  console.log(`Sin ninguna imagen: ${sinImagen}`)

  const valuesSql = rows
    .map((r) => {
      return `  (${sqlString(r.id)}, ${sqlString(r.nombre)}, ${sqlString(r.grupo)}, ${sqlString(r.equipo)}, ${sqlTextArray(r.instrucciones)}, ${sqlTextArray(r.tips)}, ${sqlString(r.imagenStart)}, ${sqlString(r.imagenPeak)}, ${sqlString(r.imagenMain)})`
    })
    .join(',\n')

  const sql = `-- GENERADO por scripts/build-exercise-catalog-seed.js — NO editar a mano.
-- NO commitear este archivo (ver .gitignore) — RepDB prohibe redistribuir
-- el dataset y este repo es publico (REQUIREMENTS.md seccion 3.2).
-- Re-generar con: node scripts/build-exercise-catalog-seed.js
-- Cargar en Supabase: pegar en el SQL editor del dashboard, o
--   npx supabase db push  (requiere tu propio access token / login).

truncate table public.exercise_catalog;

insert into public.exercise_catalog
  (id, nombre, grupo, equipo, instrucciones, tips, imagen_start, imagen_peak, imagen_main)
values
${valuesSql}
;
`

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(OUT_FILE, sql, 'utf8')
  console.log(`\nEscrito: ${OUT_FILE.pathname.replace(/^\/([A-Za-z]:)/, '$1')}`)
  console.log(`Tamano: ${(Buffer.byteLength(sql) / 1024).toFixed(0)} KB`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
