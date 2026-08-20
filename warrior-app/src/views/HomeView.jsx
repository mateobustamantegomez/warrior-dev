import { useState } from 'react'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(email, password, mode) {
  if (!email.trim()) return 'Escribe tu correo'
  if (!EMAIL_PATTERN.test(email.trim())) return 'El correo no tiene un formato válido'
  if (!password) return 'Escribe tu contraseña'
  if (mode === 'signup' && password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
  return null
}

/**
 * HomeView
 * --------
 * VIEW layer. Landing screen: real email/password auth (sign in or sign
 * up, toggled) plus the "Entrar como invitado" anonymous-auth path — see
 * REQUIREMENTS.md section 0.1. Every action is delegated to the
 * Controller via props; this component only holds form/UI state.
 */
function HomeView({ onSignIn, onSignUp, onGuestEnter }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)

    const validationError = validate(email, password, mode)
    if (validationError) {
      setMessage(validationError)
      return
    }

    setLoading(true)
    const action = mode === 'signin' ? onSignIn : onSignUp
    const result = await action(email, password)
    setLoading(false)
    if (!result.ok) {
      setMessage(result.message)
    } else if (mode === 'signup') {
      setMessage('Cuenta creada. Ya puedes entrenar.')
    }
  }

  async function handleGuestClick() {
    setLoading(true)
    setMessage(null)
    const result = await onGuestEnter()
    setLoading(false)
    if (!result.ok) setMessage(result.message)
  }

  function toggleMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setMessage(null)
  }

  return (
    <div className="home-view">
      <h1 className="home-title">WARRIOR APP</h1>
      <p className="home-tagline">Conviértete en guerrero</p>

      <form className="home-form" onSubmit={handleSubmit} noValidate>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Un momento...' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <button type="button" className="mode-toggle" onClick={toggleMode}>
        {mode === 'signin' ? 'No tengo cuenta, crear una' : 'Ya tengo cuenta, iniciar sesión'}
      </button>

      {message && <p className="status-msg">{message}</p>}

      <div className="home-divider">o</div>

      <button className="guest-btn" onClick={handleGuestClick} disabled={loading}>
        Entrar como invitado
      </button>
    </div>
  )
}

export default HomeView
