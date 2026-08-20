/**
 * AuthErrorModel
 * --------------
 * MODEL layer. Supabase Auth returns error messages in English with no
 * localization support. This maps the known ones to Spanish; anything
 * unrecognized falls back to a generic Spanish message instead of
 * leaking raw English text to the user.
 */
const TRANSLATIONS = [
  { match: /invalid login credentials/i, es: 'Correo o contraseña incorrectos' },
  { match: /user already registered/i, es: 'Ya existe una cuenta con ese correo' },
  { match: /password should be at least/i, es: 'La contraseña debe tener al menos 6 caracteres' },
  { match: /unable to validate email address/i, es: 'El correo no tiene un formato válido' },
  { match: /email not confirmed/i, es: 'Debes confirmar tu correo antes de iniciar sesión' },
  { match: /anonymous sign-?ins? (is|are) disabled/i, es: 'El modo invitado no está habilitado todavía' },
  { match: /rate limit|after \d+ seconds/i, es: 'Espera unos segundos antes de intentar de nuevo' },
  { match: /network/i, es: 'Problema de conexión, intenta de nuevo' },
]

export function translateAuthError(message) {
  if (!message) return 'Ocurrió un error inesperado'
  const found = TRANSLATIONS.find((t) => t.match.test(message))
  return found ? found.es : 'Ocurrió un error, intenta de nuevo'
}
