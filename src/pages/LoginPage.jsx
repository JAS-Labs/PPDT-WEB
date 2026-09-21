import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../services/liveApi'
import { useApp } from '../state/AppContext'

export default function LoginPage() {
  const navigate = useNavigate(); const location = useLocation(); const { saveProfile, refreshHistory } = useApp()
  const [form, setForm] = useState({ email: '', password: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(''); try { const result = await authApi.login(form.email, form.password); localStorage.setItem('issb-token', result.access_token); saveProfile({ name: result.user?.name || form.email.split('@')[0], email: form.email, verified: true, mode: 'account' }); await refreshHistory(); navigate(location.state?.from || '/') } catch (err) { setError(err.message) } finally { setLoading(false) } }
  return <main className="auth-page"><section className="auth-brand"><span className="brand-mark logo"><img src="/app-logo.png" alt="ISSB Prep logo" /></span><div><p>ISSB Prep</p><h1>Practice with focus.<br/>Review with clarity.</h1><span>PPDT · WAT · TAT · SDT · SCT</span></div></section><section className="auth-form-wrap"><Link to="/" className="back-link"><ArrowLeft/> Back to app</Link><form className="auth-form" onSubmit={submit}><p className="eyebrow">Live account required</p><h2>Sign in to continue</h2><p className="auth-intro">Every practice test now loads its active set from the live service and submits to the AI evaluation API.</p><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required/></label><label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" required/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? <><LoaderCircle className="spin"/> Signing in…</> : 'Sign in to live practice'}</button></form></section></main>
}
