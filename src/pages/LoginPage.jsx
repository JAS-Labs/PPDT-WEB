import { ArrowLeft, LoaderCircle, ShieldPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { useApp } from '../state/AppContext'

export default function LoginPage() {
  const navigate = useNavigate(); const { saveProfile } = useApp()
  const [form, setForm] = useState({ email: '', password: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(''); try { const result = await login(form.email, form.password); localStorage.setItem('issb-token', result.access_token); saveProfile({ name: result.user?.name || form.email.split('@')[0], email: form.email, verified: true, mode: 'account' }); navigate('/') } catch (err) { setError(err.message) } finally { setLoading(false) } }
  const continueDemo = () => { saveProfile({ name: 'Saifur', email: '', verified: true, mode: 'guest' }); navigate('/') }
  return <main className="auth-page"><section className="auth-brand"><span className="brand-mark"><ShieldPlus/></span><div><p>ISSB Prep</p><h1>Practice with focus.<br/>Review with clarity.</h1><span>PPDT · WAT · TAT · SDT · SCT</span></div></section><section className="auth-form-wrap"><Link to="/" className="back-link"><ArrowLeft/> Back to app</Link><form className="auth-form" onSubmit={submit}><p className="eyebrow">Welcome back</p><h2>Sign in to your account</h2><p className="auth-intro">Connect to the existing PPDT service to sync your real practice history.</p><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required/></label><label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" required/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? <><LoaderCircle className="spin"/> Signing in…</> : 'Sign in'}</button><div className="or"><span>or</span></div><button type="button" className="secondary-button full" onClick={continueDemo}>Continue in demo mode</button></form></section></main>
}
