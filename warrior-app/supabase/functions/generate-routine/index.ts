// generate-routine
// ----------------
// Supabase Edge Function. Replaces the local Express proxy — the Groq
// API key lives only in this function's secrets (Deno.env), never in the
// browser bundle. Requires an authenticated caller (anon/email session),
// enforced by Supabase's default JWT verification for Edge Functions.
//
// REQUIREMENTS.md section 3.2: the AI no longer invents exercise names.
// It picks from the closed `exercise_catalog` table (RepDB free tier) and
// returns each exercise's catalog `id` — the app resolves image,
// instructions and tips locally from that id.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Service-role client to read the catalog — it's public read-only data
// (RLS already allows any authenticated session), but the function uses
// its own privileged client so it never depends on forwarding the
// caller's JWT for this lookup.
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
  if (!GROQ_API_KEY) {
    return jsonResponse({ error: 'GROQ_API_KEY no configurada en los secrets de Supabase' }, 500)
  }

  const {
    nombre, tier, genero, edad, altura, peso, objetivo,
    diasSemana, tiempoSesion, aniosExperiencia, lesiones, notas, enfoque,
  } = await req.json()

  const perfilLines = [
    `- Nombre: ${nombre}`,
    tier && `- Nivel de perfil: ${tier}`,
    genero && `- Género: ${genero}`,
    edad && `- Edad: ${edad}`,
    altura && `- Altura: ${altura} cm`,
    peso && `- Peso: ${peso} kg`,
    objetivo && `- Objetivo: ${objetivo}`,
    diasSemana && `- Días disponibles por semana: ${diasSemana}`,
    tiempoSesion && `- Tiempo disponible por sesión: ${tiempoSesion}`,
    aniosExperiencia && `- Años entrenando: ${aniosExperiencia}`,
    lesiones && `- Lesiones o limitaciones: ${lesiones}`,
    notas && `- Notas adicionales: ${notas}`,
  ].filter(Boolean).join('\n')

  const numDias = tier === 'basica' ? 1 : (parseInt(diasSemana, 10) || 3)

  // Guests may now pick several muscle groups. Older rows in app_state
  // stored `enfoque` as a single string, so accept both shapes.
  const enfoques = (Array.isArray(enfoque) ? enfoque : enfoque ? [enfoque] : [])
    .filter((g) => g && g !== 'Full Body')

  // Exercise count has to track session length, otherwise a 30-minute
  // session and a 90-minute one come back the same size.
  const EJERCICIOS_POR_TIEMPO = {
    '30 min': '4 y 5',
    '60 min': '6 y 7',
    '90 min': '7 y 9',
    '2 horas': '9 y 11',
    // Legacy values still sitting in app_state rows from earlier profiles.
    '45 min': '5 y 6',
    '90+ min': '7 y 9',
  }
  const rangoEjercicios = EJERCICIOS_POR_TIEMPO[tiempoSesion] || '5 y 7'

  const instruccionEnfoque = numDias > 1
    ? `Distribuye los grupos musculares de forma inteligente a lo largo de los ${numDias} días (ej. empuje/tirón/pierna, upper/lower, o full body según el número de días y el objetivo).`
    : enfoques.length > 0
      ? `Genera una rutina de un solo día enfocada específicamente en estos grupos musculares: ${enfoques.join(', ')}. Reparte los ejercicios entre esos grupos de forma balanceada dentro de la misma sesión, priorizando ejercicios compuestos que los cubran bien. El campo "enfoque" del día debe nombrar esos grupos.`
      : 'Genera una rutina de un solo día, general de cuerpo completo, balanceada.'

  // Catálogo cerrado (REQUIREMENTS.md 3.2): un split multi-día necesita
  // variedad de todos los grupos para armar push/pull/legs por su cuenta;
  // un día único con enfoque específico solo necesita ese subconjunto.
  let catalogQuery = supabaseAdmin.from('exercise_catalog').select('id, nombre, grupo')
  if (numDias === 1 && enfoques.length > 0) {
    catalogQuery = catalogQuery.in('grupo', enfoques)
  }
  const { data: catalogo, error: catalogoError } = await catalogQuery

  if (catalogoError) {
    return jsonResponse({ error: 'No se pudo leer el catálogo de ejercicios', detail: catalogoError.message }, 500)
  }
  if (!catalogo || catalogo.length === 0) {
    return jsonResponse({ error: 'El catálogo de ejercicios está vacío para los grupos pedidos' }, 500)
  }

  const catalogoIds = new Set(catalogo.map((e) => e.id))
  const catalogoJson = JSON.stringify(catalogo.map((e) => ({ id: e.id, nombre: e.nombre, grupo: e.grupo })))

  const prompt = `Eres un entrenador de fitness. Diseña un split de entrenamiento semanal de EXACTAMENTE ${numDias} día(s) para este guerrero:
${perfilLines}

Ten en cuenta cualquier lesión o limitación mencionada para elegir ejercicios seguros.
${instruccionEnfoque}

CATÁLOGO DE EJERCICIOS DISPONIBLES (JSON, campos id/nombre/grupo):
${catalogoJson}

REGLA ESTRICTA: cada ejercicio que incluyas DEBE usar un "id" que exista literalmente en el catálogo de arriba. No inventes ejercicios ni ids. No repitas el mismo id más de una vez dentro del mismo día. No devuelvas el nombre del ejercicio, solo el "id" — la app resuelve el nombre localmente.

IMPORTANTE: escribe TODOS los textos en español correcto, con tildes y eñes donde corresponda (ej. "Día", "Músculo", "Sesión"). Nunca omitas los acentos. Usa los signos de apertura en preguntas y exclamaciones (¿ ¡).

Responde SOLO con JSON válido, sin texto adicional, con esta forma exacta:
{
  "saludo": "mensaje corto y épico de bienvenida al guerrero",
  "dias": [
    {
      "nombre": "Día 1",
      "enfoque": "nombre corto del enfoque de este día, ej. Empuje, Piernas, Full Body",
      "ejercicios": [
        { "id": "id-exacto-del-catalogo", "series": 3, "reps": "8-12" }
      ]
    }
  ]
}
El array "dias" debe tener EXACTAMENTE ${numDias} elemento(s). Cada día entre ${rangoEjercicios} ejercicios, para que la sesión quepa en ${tiempoSesion || '60 min'}.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        // Groq deprecated llama-3.3-70b-versatile on 2026-06-17; this is
        // their recommended replacement (also supports JSON object mode).
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return jsonResponse({ error: 'Groq API error', detail: errText }, 502)
    }

    const data = await response.json()
    const parsed = JSON.parse(data.choices[0].message.content)

    // Belt-and-suspenders: drop any hallucinated id instead of shipping a
    // routine the app can't render an image/instructions for. A real
    // catalog id always resolves — this should rarely trigger.
    let idsDescartados = 0
    if (Array.isArray(parsed.dias)) {
      for (const dia of parsed.dias) {
        if (!Array.isArray(dia.ejercicios)) continue
        const antes = dia.ejercicios.length
        dia.ejercicios = dia.ejercicios.filter((ej) => catalogoIds.has(ej.id))
        idsDescartados += antes - dia.ejercicios.length
      }
    }
    if (idsDescartados > 0) {
      console.warn(`generate-routine: descartados ${idsDescartados} ejercicio(s) con id fuera del catálogo`)
    }

    return jsonResponse(parsed)
  } catch (err) {
    return jsonResponse({ error: 'Fallo generando la rutina', detail: err.message }, 500)
  }
})
