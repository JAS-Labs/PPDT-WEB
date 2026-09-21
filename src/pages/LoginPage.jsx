import { ArrowLeft, CheckSquare, LoaderCircle, UserPlus, LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../services/liveApi'
import { useApp } from '../state/AppContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { saveProfile, refreshHistory, setToken, isAuthenticated } = useApp()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from || '/', { replace: true })
    }
  }, [isAuthenticated, location.state?.from, navigate])

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '21',
    nationality: 'Bangladeshi',
    research_consent: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      let result
      if (mode === 'signup') {
        const ageNum = parseInt(form.age, 10)
        if (isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
          throw new Error('Age must be between 10 and 100 years.')
        }
        if (!form.research_consent) {
          throw new Error('You must agree to the research use of your responses to register.')
        }
        result = await authApi.signup({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim() || undefined,
          age: ageNum,
          nationality: form.nationality.trim(),
          research_consent: Boolean(form.research_consent),
        })
      } else {
        result = await authApi.login(form.email.trim(), form.password)
      }

      if (result.access_token) {
        localStorage.setItem('issb-token', result.access_token)
        setToken(result.access_token)
      }

      saveProfile({
        name: result.user?.name || form.name.trim() || form.email.split('@')[0],
        email: result.user?.email || form.email.trim(),
        age: result.user?.age ?? (form.age ? parseInt(form.age, 10) : undefined),
        nationality: result.user?.nationality || form.nationality || 'Bangladeshi',
        verified: true,
        mode: 'account',
      })

      await refreshHistory()
      navigate(location.state?.from || '/')
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <span className="brand-mark logo">
          <img src="/app-logo.png" alt="ISSB Prep logo" />
        </span>
        <div>
          <p>ISSB Prep</p>
          <h1>Practice with focus.<br />Review with clarity.</h1>
          <span>PPDT · WAT · TAT · SDT · SCT</span>
        </div>
      </section>

      <section className="auth-form-wrap">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-mode-switch">
            <button
              type="button"
              className={`mode-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => { setMode('signin'); setError(''); }}
            >
              <LogIn size={15} /> Sign in
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              <UserPlus size={15} /> Create account
            </button>
          </div>

          <p className="eyebrow">
            {mode === 'signin' ? 'Live account required' : 'Candidate Registration'}
          </p>

          <h2>
            {mode === 'signin' ? 'Sign in to continue' : 'Create candidate account'}
          </h2>

          <p className="auth-intro">
            {mode === 'signin'
              ? 'Every practice test loads its active item set from the live service and submits to the AI evaluation API.'
              : 'Register to synchronize test history, unlock cumulative psychological profiles, and benchmark your progress.'}
          </p>

          {mode === 'signup' && (
            <label>
              Full Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ali Khan"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
              minLength={mode === 'signup' ? 8 : 1}
              required
            />
          </label>

          {mode === 'signup' && (
            <>
              <div className="signup-demographics-row">
                <label>
                  Age (years)
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Nationality
                  <input
                    type="text"
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    placeholder="e.g. Bangladeshi"
                    required
                  />
                </label>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.research_consent}
                  onChange={(e) => setForm({ ...form, research_consent: e.target.checked })}
                  required
                />
                <span>I agree that my anonymized responses may be used for ISSB psychometric research.</span>
              </label>
            </>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="primary-button" disabled={loading}>
            {loading ? (
              <><LoaderCircle className="spin" size={18} /> Processing…</>
            ) : mode === 'signin' ? (
              'Sign in to live practice'
            ) : (
              'Create account & start'
            )}
          </button>
        </form>
      </section>
    </main>
  )
}
