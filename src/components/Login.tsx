import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch {
      setError('Email o contraseña incorrectos')
      setBusy(false)
    }
  }

  return (
    <form className="screen centered" onSubmit={submit}>
      <h1 className="serif hero">Blog de verano</h1>
      <p className="muted">Mendoza ↔ Hawái</p>
      <div className="field">
        <label htmlFor="email" className="eyebrow">
          Email
        </label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="pass" className="eyebrow">
          Contraseña
        </label>
        <input
          id="pass"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button className="btn primary full" disabled={busy || !email || !password}>
        {busy ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
