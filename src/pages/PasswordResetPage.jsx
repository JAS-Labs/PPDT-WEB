import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../services/liveApi'
import './auth.css'

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      if (!sent) {
        await authApi.requestPasswordReset(email.trim())
        setSent(true)
        setMessage('If an account exists for this email, a recovery email will arrive shortly. Enter the code from that email.')
      } else {
        await authApi.confirmPasswordReset({ email: email.trim(), code, password })
        setDone(true); setPassword(''); setCode('')
        setMessage('Password changed. Sign in with your new password.')
      }
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  return <main className="auth-page auth-refresh">
    <header className="auth-topbar"><Link className="auth-logo" to="/"><img src="/app-logo.png" alt="" />ISSB Prep</Link><Link className="back-link" to="/login">Back to sign in</Link></header>
    <section className="auth-card recovery-card">
      <h1>Reset your password</h1>
      <p>Use the email address associated with your account.</p>
      {!done && <form className="auth-form" onSubmit={submit}>
        <label>Email address<input type="email" autoComplete="email" value={email} disabled={sent} required onChange={(event) => setEmail(event.target.value)} /></label>
        {sent && <>
          <label>Recovery code<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,10}" required value={code} onChange={(event) => setCode(event.target.value)} /></label>
          <label>New password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        </>}
        <button className="primary-button" disabled={busy}>{busy ? 'Please wait…' : sent ? 'Save new password' : 'Send recovery email'}</button>
        {sent && <button className="text-button" type="button" disabled={busy} onClick={() => { setSent(false); setCode(''); setPassword(''); setMessage('') }}>Request another code</button>}
      </form>}
      {message && <p role="status">{message}</p>}
      {done && <Link to="/login" className="primary-button">Sign in</Link>}
    </section>
  </main>
}
