# Warrior App — MVP Requirements (v1)

**Deadline:** 1 semana (reto personal)
**Audiencia:** Se le va a mostrar EN VIVO a otra persona al final de la semana
**Criterio de éxito:** Que se sienta como un producto real (UX + gamificación), no una demo técnica cruda
**Identidad visual:** Estilo Monolith — negro/azul, estética HUD militar (igual a dashboard.html)

---

## 0. Home page / Login

- Pantalla inicial con campos de **email** y **contraseña**, más un botón **"Entrar como invitado"**.
- **Cambio de alcance (2026-07-26):** el login pasó de ser solo visual a **real**, usando Supabase Auth (email/contraseña + anonymous auth para invitado). Ver sección 0.1. La razón original de dejarlo fuera de alcance (evitar backend propio de cuentas + cifrado) ya no aplica porque Supabase provee eso mismo, no lo construimos desde cero.
- Se cambió el campo de "Usuario" a **Email** porque Supabase Auth trabaja nativamente con email — mantener "usuario" hubiera requerido una tabla adicional de mapeo, sin beneficio real para esta semana.

## 0.1 Persistencia y cuentas reales (Supabase)

Decisión tomada el 2026-07-26, revirtiendo lo que decía la sección 6 original ("Supabase fuera de alcance"). Motivo: a Mateo dejó de convencerle que el progreso viviera solo en el localStorage del navegador, y no quería seguir con el ciclo manual de reiniciar el servidor local a mano. Con 6 días restantes se considera manejable.

- **Auth:** Supabase Auth — signup/login real con email+contraseña; "Entrar como invitado" usa *anonymous auth* de Supabase (persiste en la nube igual, solo que sin email asociado).
- **Datos:** una sola tabla `app_state` en Postgres (una fila por usuario, protegida con RLS para que cada quien solo lea/escriba la suya) guardando perfil, xp, rutina, día actual del split e historial como JSONB — mismo shape que tenía el estado en localStorage, para que la migración sea mecánica y no un rediseño relacional completo.
- **Backend de IA:** el proxy de Groq se muda de Express local a una **Supabase Edge Function** — se elimina el `npm run server` y el reinicio manual.
- Mateo crea el proyecto de Supabase y provee Project URL + anon key (seguras de compartir). La key de Groq y cualquier secreto van directo a los secrets de Supabase, nunca pegados en el chat.

## 1. Onboarding — 3 niveles de perfil

El usuario elige uno de los tres al arrancar:

| Nivel | Datos que pide |
|---|---|
| **Básica** | Ninguno — arranca directo |
| **Intermedia** | Género, edad, altura, peso, días/semana, tiempo por sesión, objetivo |
| **Avanzada** | Todo lo de Intermedia + años de experiencia entrenando + lesiones + notas relevantes |

> Nota de implementación: se agregó **Nombre** como campo en Intermedia/Avanzada (no estaba en la lista original) porque el dashboard y el saludo de la IA ya lo necesitaban para personalizar. Básica sigue sin pedir nada — usa "Guerrero" por defecto.

> **Regla de invitado (2026-07-27):** una cuenta invitada (anonymous auth) solo puede elegir **Básica** — Intermedia y Avanzada aparecen bloqueadas ("Requiere cuenta"). La intención NO es que alguien viva como invitado, sino darle una muestra de un día antes de convertir a cuenta real.
>
> Antes de generar esa rutina de muestra, al invitado siempre se le pregunta **"¿Qué deseas trabajar hoy?"** con una lista de grupos musculares (Pecho, Espalda, Piernas, Hombros, Brazos, Abdomen) + **Full Body**. La IA genera el único día de la rutina enfocado en esos grupos (o balanceado si eligió Full Body).
>
> **Cambio de alcance (2026-07-29):** la selección pasó de **un solo grupo** a **selección múltiple**, por decisión de Mateo. Reglas:
> - Se pueden elegir **hasta 3 grupos específicos** (tope definido en `MAX_ENFOQUES`). El límite existe porque es **una sola sesión** — más de 3 grupos deja de ser un entrenamiento coherente.
> - **Full Body es mutuamente excluyente**: elegirlo limpia los demás, y elegir un grupo específico lo desactiva.
> - Ya no se genera al primer tap: hay un botón **"Generar mi rutina"**, deshabilitado hasta que haya al menos un grupo seleccionado.
> - Los tiles que ya no pueden sumar aparecen atenuados, para que un tap sin efecto se lea como intencional y no como un bug.
> - Dato: `profile.enfoque` pasó de `string` a `string[]`. La Edge Function acepta ambas formas para no romper perfiles ya guardados en `app_state`.
>
> **Cambio de alcance (2026-07-29) — tiempo de sesión en invitado:** en la misma pantalla el invitado ahora elige también **cuánto tiempo tiene hoy** (30 / 45 / 60 / 90+ min), con **45 min preseleccionado** para que el flujo nunca arranque vacío. Esto matiza la regla de que Básica "no pide ningún dato" (sección 1): el invitado da 2 datos — enfoque y tiempo — porque sin ellos la rutina de muestra sale genérica y no vende el producto.
> - El número de ejercicios ahora es **proporcional al tiempo** (30 min → 4-5, 45 → 5-6, 60 → 6-7, 90+ → 7-9). Antes el prompt pedía 5-7 fijo, así que el tiempo no cambiaba nada.
> - Un usuario **con cuenta real** que elige Básica sigue sin pasar por esta pantalla; en ese caso la Edge Function cae a su default de 45 min / 5-7 ejercicios.

## 2. Generación de rutina (IA)

- Con el nivel Básica: rutina genérica balanceada (sin personalización real).
- Con Intermedia/Avanzada: la IA genera un **split semanal** basado en los días/semana indicados (ej. si dijo 4 días → 4 rutinas distintas: empuje/tirón/piernas/full body, no la misma rutina repetida).
- La rutina de la semana se genera **una vez**; no se regenera automáticamente cada día (evita depender de la IA en cada interacción — más confiable para la demo en vivo).

## 3. Registro diario de entrenamiento

- Cada día el usuario ve la rutina que le toca (según el split).
- ~~**Por cada ejercicio**, registra peso y/o repeticiones~~ — reemplazado, ver 3.1.
- Al terminar la sesión → se otorga XP.

### 3.1 Vista ejercicio por ejercicio (cambio de alcance 2026-07-29)

**Rediseño completo del registro diario.** La lista con campos de peso y reps se reemplaza por una vista de **un ejercicio a la vez**.

**Por qué:** si la app ya le prescribe al usuario cuántas repeticiones hacer (`3 x 8-12`), preguntarle cuántas hizo es redundante. Y una lista plana no enseña a entrenar — no dice *cómo* se hace el ejercicio.

**Qué muestra cada pantalla de ejercicio:**

| Elemento | Detalle |
|---|---|
| Imagen | Posición inicial + posición final del ejercicio, al centro |
| Nombre | En español |
| Prescripción | Series × reps (ej. `3 × 8-12`) — solo lectura |
| Peso anterior | El último peso que el usuario levantó en ESE ejercicio |
| Peso de hoy | Único campo editable |
| Navegación | Anterior / Siguiente |
| Progreso | Ejercicio N de M |

**Decisiones cerradas (2026-07-29):**

1. **Solo peso**, un valor por ejercicio. El peso por serie queda para una versión futura (decisión explícita de Mateo, no un olvido).
2. **No se pregunta cuántas reps hizo.** Las reps son prescripción, no registro.
3. **Resumen al final:** en el último ejercicio aparece "Terminar entrenamiento" → pantalla de resumen con el XP ganado y el ascenso de rango si aplica. Es el momento de recompensa de la app.
4. **Guarda al avanzar:** cada vez que pasa de ejercicio se persiste en Supabase. Puede cerrar la app en el gym y retomar donde iba.

### 3.2 Catálogo de ejercicios (cambio arquitectónico 2026-07-29)

Para garantizar una imagen por ejercicio, **la IA ya no puede inventar nombres**. Pasa a elegir de un catálogo cerrado.

**Fuente: RepDB free tier** — https://github.com/sergei-argutin/exercise-dataset
JSON: `https://raw.githubusercontent.com/sergei-argutin/exercise-dataset/main/exercises.json` (1.29 MB, las 400 en `data.exercises`)
Imágenes: `https://raw.githubusercontent.com/sergei-argutin/exercise-dataset/main/` + la ruta que trae cada registro

**DECISIÓN CERRADA (2026-07-29):** se eligió RepDB (opción A) sobre `free-exercise-db` (opción B) después de comparar ambas en maquetas HTML lado a lado. Motivo de Mateo: *"se ve más clara con una animación en vez de con personas"* — las ilustraciones enseñan el movimiento mejor que las fotos, además de venir en español. La opción B queda descartada (fotos reales, nombres e instrucciones solo en inglés).

Verificado el 2026-07-29, **re-verificado y corregido el 2026-08-20** (el dataset cambió de tamaño/forma entre ambas fechas — RepDB lo actualiza; los números de abajo son los reales al bajar el JSON hoy):

- ~~400 ejercicios~~ → **250 ejercicios, los 250 con imagen.** El dataset trae `"note": "Free 250-exercise tier of RepDB"` — el tier gratuito se redujo (o el conteo de 400 nunca fue exacto). Ninguno se queda sin imagen.
- Nombres, descripciones, instrucciones y tips **en español** (0 faltantes)
- ~~Llaves top-level `start`/`peak`/`main`~~ → las imágenes viven anidadas en `images.flat.{start,peak}` o `images.flat.main` (estilo "flat"; RepDB ofrece un estilo "classic" en el tier pago).

**Dos formas de imagen — hay que manejar ambas:**

| Forma | Cuántos | Llaves | Qué es |
|---|---|---|---|
| Par | 215 | `images.flat.start` + `images.flat.peak` | Ejercicios con movimiento: posición inicial y final |
| Única | 35 | `images.flat.main` | Isométricos y estiramientos (ej. Plancha) — no hay dos posiciones que mostrar |

La UI debe usar el par cuando existe y caer a la imagen única cuando no, a ancho completo (mismo criterio que antes, solo cambian los conteos).

**Cobertura por grupo con el dataset actual** (reemplaza la tabla de abajo, que citaba conteos de la corrida anterior): Pecho 34, Espalda 46, Piernas 59 (upper+lower), Hombros 31, Brazos 36 (upper+lower), Abdomen 24, Full Body 20. Ningún grupo queda con menos de 20 ejercicios — sigue siendo suficiente para el generador.

**Licencia — término nuevo detectado el 2026-08-20:** la licencia ahora incluye explícitamente un término 5, "No generative-AI derivation" — las imágenes no pueden pasar por modelos generativos (image-to-image, style transfer, fine-tuning) ni para "resolver" el problema de fondo de §3.3. Elimina la opción 3 de esa sección si implicaba una herramienta de IA para quitar fondos; el recorte/recoloreo clásico (CSS o procesamiento no generativo) sigue permitido (término 4).

Cobertura por grupo muscular:

| Grupo | `body_part` del dataset | Ejercicios |
|---|---|---|
| Pecho | `chest` | 46 |
| Espalda | `back` | 72 |
| Piernas | `upper_legs` + `lower_legs` | 104 |
| Hombros | `shoulders` | 53 |
| Brazos | `upper_arms` + `lower_arms` | 56 |
| Abdomen | `core` | 39 |
| Full Body | `full_body` | 30 |

**Cambio en el prompt:** la Edge Function recibirá el catálogo filtrado por los grupos pedidos y la IA deberá devolver **el `id` del catálogo**, no un nombre libre. Con eso la app resuelve imagen, instrucciones y tips localmente.

**Cambio en el modelo de datos:**
- `RoutineModel`: cada ejercicio pasa a llevar `id` del catálogo además de series/reps
- `WorkoutLogModel`: las entradas guardan `{ ejercicioId, nombre, peso }` — se va el campo `reps`
- Nuevo estado de sesión en progreso: `currentExerciseIndex` + registros parciales

**Almacenamiento — DECISIÓN CERRADA (2026-08-20):** el repo `warrior-dev` es **público**, así que comitear el catálogo (aunque sea recortado) cuenta como redistribuir el dataset — prohibido por la licencia. Vive en **Supabase**, tabla `public.exercise_catalog` (schema en `supabase/schema.sql`, sí commiteado — no tiene datos). Los datos se generan y cargan aparte: `scripts/build-exercise-catalog-seed.js` descarga el dataset, lo recorta a (id, nombre, grupo, equipo, instrucciones, tips, imagen_start, imagen_peak, imagen_main) y escribe `supabase/seed/exercise_catalog.seed.sql` — **ese archivo generado nunca se commitea** (`.gitignore`). Tamaño real recortado (250 ejercicios): 158 KB en SQL, frente a ~758 KB del JSON original bajado hoy (trae EN/DE/ES completos).

Lectura protegida con RLS: solo sesiones autenticadas (incluye invitado vía anonymous auth). Escritura: nadie desde el cliente — solo el seed script con una service-role key, corrido manualmente.

> **Licencia y atribución — atención.** RepDB free tier es gratis para uso personal Y comercial dentro de una app, pero exige **atribución visible**: `Exercise data by RepDB (repdb.co)`. Hay que ponerla en la app (footer o pantalla de créditos) — pendiente, ver paso 7 de §3.4.

> **Pendiente técnico:** las imágenes se sirven por ahora desde `raw.githubusercontent.com`, que **no es un CDN para producción** (tiene límites de tasa). Para el demo alcanza. Para producción hay que bajarlas (353 × 2 × ~17 KB ≈ 12 MB) o pasarlas a Supabase Storage.

> **Nota de secuencia:** este cambio reescribe el prompt de la Edge Function, así que el deploy pendiente (grupos múltiples, tiempo, acentos) se absorbe aquí. No tiene sentido desplegar dos veces — decisión de Mateo el 2026-07-29.

### 3.3 Problema abierto a resolver en la implementación

**El fondo celeste claro de las ilustraciones choca con el HUD negro.** Es el único punto débil conocido de la opción A y hay que atacarlo al construir la vista, no después.

Se nota poco cuando son dos imágenes chicas lado a lado, y **mucho** en los 47 ejercicios de imagen única, que van a ancho completo — un bloque celeste enorme sobre fondo negro.

Ideas a probar, en orden de preferencia:
1. Tratamiento CSS del `<img>` (`mix-blend-mode`, `filter`, overlay con el azul de marca) para integrarlo al tema oscuro sin tocar los archivos
2. Recuadro/marco que enmarque la imagen a propósito, en vez de pelear con el fondo — asumirlo como "ficha técnica" iluminada dentro del HUD
3. Procesar las imágenes (quitar/oscurecer el fondo plano) y servirlas desde Supabase Storage — resuelve de paso el tema del CDN

### 3.4 Orden de implementación acordado

**Catálogo primero, vista después.** Construir la vista contra la rutina actual (que no tiene `id` de catálogo, o sea sin imágenes) implicaría rehacerla. Decisión de Mateo el 2026-07-29.

1. ✅ Bajar el dataset, recortarlo a los campos usados, resolver dónde vive (ver nota de licencia)
2. ✅ Reescribir el prompt de la Edge Function para que elija del catálogo y devuelva `id` (absorbe los 3 cambios pendientes) — **código listo, falta el deploy** (requiere el access token de Mateo)
3. ✅ `RoutineModel` / `WorkoutLogModel`: agregar `ejercicioId`, quitar `reps` del registro
4. ✅ Estado de sesión en progreso (`currentExerciseIndex` + parciales) con guardado al avanzar
5. ✅ La vista ejercicio por ejercicio (§3.1), atacando de entrada el problema de §3.3 (tratamiento de marco/HUD, opción 2 de la lista — ver nota abajo)
6. ✅ Pantalla de resumen de fin de sesión (`SessionSummaryView`)
7. ✅ Atribución visible de RepDB (footer del dashboard)

> **Estado 2026-08-20: código completo para los 7 pasos, sin probar en el navegador todavía.** `npm run build` y `eslint` pasan limpios, pero nadie ha visto la vista ejercicio-por-ejercicio renderizada ni el tratamiento del fondo celeste contra imágenes reales — validar eso es el siguiente paso, no darlo por bueno solo porque compila. Dos cosas requieren que Mateo actúe con sus propias credenciales antes de poder probar en vivo:
> - **Cargar el catálogo en Supabase:** correr el SQL de `supabase/schema.sql` (tabla `exercise_catalog` + columnas nuevas de `app_state`) y luego el contenido de `supabase/seed/exercise_catalog.seed.sql` (generado por `node scripts/build-exercise-catalog-seed.js`, no está en git) — pegar ambos en el SQL Editor del dashboard de Supabase, en ese orden.
> - **Desplegar la Edge Function actualizada** (`supabase/functions/generate-routine/index.ts`) — copiar/pegar en el dashboard, o `npx supabase functions deploy generate-routine` desde su propia terminal con su access token.
>
> Sin esos dos pasos, generar una rutina fallará (la función intentará leer una tabla que no existe todavía en su proyecto, o seguirá corriendo el prompt viejo si no se despliega).
>
> **Elección de tratamiento §3.3:** se usó la opción 2 (marco/ficha técnica) en vez de la 1 (blend modes CSS) — sin poder previsualizar las ~250 ilustraciones reales en este entorno, un blend mode arriesgaba resultados inconsistentes (podía oscurecer el arte de línea junto con el fondo); el marco con esquinas HUD da un resultado predecible para cualquier imagen. Revisar en el navegador si el efecto convence o si vale la pena iterar hacia la opción 1 después de verlo.

## 4. Progresión y gamificación

- **XP diaria** al completar el registro de un día.
- **Rango** (Recruit → Legend, reusando la lógica de `xp.js` que ya existe).

### 4.1 Escalera de rangos e insignias (cambio de alcance 2026-07-29)

Los **7 rangos originales pasaron a 22**. Los nombres siguen en inglés (decisión de Mateo) y adoptan la escalera militar real — la misma estructura que usa Call of Duty: Modern Warfare, que entrega 55 niveles a partir de ~19 nombres de rango usando tiers I/II/III.

`Recruit` y `Legend` se conservan como extremos de marca (no son rangos militares); los 20 del medio sí lo son. Salen `Enforcer`, `Specialist`, `Elite` y `Operator` por no ser rangos reales.

```
1  Recruit          0        12 First Lieutenant     6.600
2  Private          100      13 Captain              7.800
3  Private F. Class 300      14 Major                9.100
4  Lance Corporal   600      15 Lieutenant Colonel  10.500
5  Corporal         1.000    16 Colonel             12.000
6  Sergeant         1.500    17 Brigadier General   14.000
7  Staff Sergeant   2.100    18 Major General       16.500
8  Gunnery Sergeant 2.800    19 Lieutenant General  19.500
9  Master Sergeant  3.600    20 General             23.000
10 Master Gny Sgt   4.500    21 Commander           27.000
11 Second Lieut.    5.500    22 Legend              32.000
```

**Insignias:** cada rango tiene una insignia propia, renderizada como **SVG inline** (`views/shared/RankBadge.jsx`) — sin imágenes externas, así escala sin pesar en el bundle. Se muestra **encima del nombre del rango** en el header del dashboard.

El lenguaje visual sigue la insignia militar real — chevrones y rockers para tropa, barras y hojas para oficiales, estrellas para generales — con dos simplificaciones deliberadas: el "diamante" sustituye la hoja de roble y la corona de laurel sustituye el águila del Colonel (a 44px un águila fiel se ve como un borrón; manda la legibilidad).

**Rampa de color** (definida por Mateo el 2026-07-29), un salto cada 5 rangos:

| Color | Rangos |
|---|---|
| Gris / acero | Recruit → Corporal (1-5) |
| Bronce | Sergeant → Master Gunnery Sergeant (6-10) |
| Blanco brillante | Second Lieutenant → Lieutenant Colonel (11-15) |
| Dorado | Colonel → General (16-20) |
| Azul | Commander, Legend (21-22) |

No es decorativa: los glifos de rangos vecinos se diferencian sólo por el conteo de chevrones/rockers/estrellas, y a 44px eso casi no se lee. El cambio de color es lo que hace visible el ascenso.

> **Umbrales de XP = PLACEHOLDER.** Están calibrados contra el XP plano actual de 100 por día registrado: primer ascenso con **un solo entrenamiento** (clave para que la demo en vivo muestre progresión), Legend a ~320 entrenamientos. Mateo definió que la progresión debe ser **por experiencia y no por días** — pero mientras el XP sea plano por día, ambas cosas son idénticas en la práctica. Recalibrar cuando el XP escale por volumen (series × reps × peso). Decisión de posponerlo: 2026-07-29.

**Nombre del guerrero:** el header ya no muestra el nombre cuando es el placeholder `Guerrero` (los niveles que no piden nombre). Solo se muestra si el usuario realmente lo dio. Constante `NOMBRE_POR_DEFECTO` en `ProfileModel.js`.

**Galería de insignias:** `?badges` renderiza los 22 badges de una para revisarlos sin acumular XP (`views/BadgeGalleryView.jsx`). No está enlazada desde el flujo normal — es la primera pieza del Modo Demo (sección 5).

### 4.2 Header del dashboard y barra de XP (cambio de alcance 2026-07-29)

Rediseño pedido por Mateo: la barra de XP arriba a la derecha no cuadraba con el badge.

- **La línea divisoria ES la barra de XP.** El separador entre el header y el contenido se convirtió en una barra de 28px de alto, ancho completo, con el número **dentro**: `0 XP / 100`.
- **No se muestra el nombre del próximo rango.** Solo progreso — la barra llenándose y el número subiendo. Antes decía "· 100 para Private".
- **Insignia + nombre del rango centrados**; `Salir` a la izquierda, el mismo lado donde está en las demás pantallas. El header es un grid de `1fr auto 1fr` para que el bloque central quede centrado sin importar el ancho del botón.
- El relleno de la barra es un azul atenuado (`rgba(0,163,255,0.45)`, el mismo de los tiles seleccionados) con un **borde de avance brillante** de 2px, en lugar de un azul sólido: con `--blue` a full el texto blanco encima quedaba en ~2.6:1 de contraste. En nivel máximo el texto pasa a `32.000 XP · Máximo`.
- **Badges/logros** por hitos. Propuesta inicial (ajustable):
  - Primera rutina generada
  - Primer día registrado
  - Primera semana completa (cumpliste tus días/semana definidos)
  - Racha de 2 semanas / 4 semanas
  - Nuevo PR de peso en un ejercicio (comparado contra tu registro anterior de ese mismo ejercicio)
- **Racha semanal:** cuenta semanas consecutivas donde el usuario completó **al menos** los días/semana que definió en su perfil (ej. dijo 4 días/semana → la semana "cuenta" si registró ≥4 días esa semana). Se rompe si una semana no llega al mínimo.
- El propio historial de peso/reps por ejercicio es la prueba de progreso real (no la app subiendo la dificultad automáticamente).

## 5. Modo Demo

- Pantalla separada (accesible vía `?demo` en la URL, no visible en el flujo normal) donde se puede:
  - Adelantar la fecha simulada (día por día o semana por semana)
  - Forzar XP, racha y badges manualmente
  - Objetivo: poder armar el escenario exacto (ej. "llevo 4 semanas de racha") antes de la presentación en vivo, sin depender del tiempo real.

## 6. Fuera de alcance para este MVP

- Ajuste automático de dificultad por IA o reglas — el usuario ve su propio progreso, no lo decide el sistema
- Diagramas musculares, animaciones de ejercicios
- Recuperación de contraseña, verificación de email, roles/permisos — Supabase Auth lo soporta pero no lo estamos configurando esta semana

> Nota: "Cuentas/login" y "Backend/base de datos en la nube" estaban aquí originalmente y ya NO aplican — ver sección 0.1 (decisión revertida el 2026-07-26).

---

## Decisiones cerradas

1. **Registro por ejercicio:** peso Y reps, ambos habilitados, ninguno obligatorio.
2. **Badges:** los 5 propuestos en la sección 4, confirmados tal cual.
3. **Modo Demo:** pantalla separada vía `?demo`, no botones sueltos en la UI normal.
4. **Racha en nivel Básica:** no aplica. Básica solo trackea XP y días registrados — sin racha semanal ni objetivo de días/semana. La racha semanal solo existe en Intermedia y Avanzada (donde sí se define días/semana).

Requisitos cerrados. Listo para construir.
