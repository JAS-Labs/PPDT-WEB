import { ArrowLeft, CheckSquare, LoaderCircle, UserPlus, LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../services/liveApi'
import { useApp } from '../state/AppContext'

export default function LoginPage({ initialMode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { saveProfile, refreshHistory, setToken, isAuthenticated } = useApp()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from || '/', { replace: true })
    }
  }, [isAuthenticated, location.state?.from, navigate])

  const [mode, setMode] = useState(() => {
    if (
      initialMode === 'signup' ||
      location.pathname === '/signup' ||
      location.state?.mode === 'signup'
    ) {
      return 'signup'
    }
    return 'signin'
  })
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
  const [slowLoading, setSlowLoading] = useState(false)

  useEffect(() => {
    let timer
    if (loading) {
      timer = setTimeout(() => {
        setSlowLoading(true)
      }, 2500)
    } else {
      setSlowLoading(false)
    }
    return () => clearTimeout(timer)
  }, [loading])

  const submit = async (event) => {
    if (event) event.preventDefault()
    setLoading(true)
    setError('')

    const email = form.email.trim()
    const password = form.password

    // Client-side validations
    if (!email) {
      setError('Please enter your email address.')
      setLoading(false)
      return
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    try {
      let result
      if (mode === 'signup') {
        const name = form.name.trim()
        if (!name) {
          setError('Please enter your full name.')
          setLoading(false)
          return
        }
        if (name.length > 100) {
          setError('Full name must be 100 characters or fewer.')
          setLoading(false)
          return
        }
        if (!password || password.length < 8) {
          setError('Password must be at least 8 characters long.')
          setLoading(false)
          return
        }
        if (password.length > 128) {
          setError('Password must be 128 characters or fewer.')
          setLoading(false)
          return
        }
        const ageNum = parseInt(form.age, 10)
        if (isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
          setError('Age must be between 10 and 100 years.')
          setLoading(false)
          return
        }
        const nationality = form.nationality.trim()
        if (!nationality || nationality.length < 2) {
          setError('Nationality must be at least 2 characters.')
          setLoading(false)
          return
        }
        if (nationality.length > 100) {
          setError('Nationality must be 100 characters or fewer.')
          setLoading(false)
          return
        }
        if (!form.research_consent) {
          setError('You must agree to the research use of your responses to register.')
          setLoading(false)
          return
        }

        result = await authApi.signup({
          email,
          password,
          name,
          age: ageNum,
          nationality,
          research_consent: Boolean(form.research_consent),
        })
      } else {
        if (!password) {
          setError('Please enter your password.')
          setLoading(false)
          return
        }
        result = await authApi.login(email, password)
      }

      if (result.access_token) {
        localStorage.setItem('issb-token', result.access_token)
        setToken(result.access_token)
      } else {
        setMode('signin')
        setError('Account created successfully! Please sign in with your email and password.')
        setLoading(false)
        return
      }

      saveProfile({
        name: result.user?.name || form.name.trim() || email.split('@')[0],
        email: result.user?.email || email,
        age: result.user?.age ?? (form.age ? parseInt(form.age, 10) : undefined),
        nationality: result.user?.nationality || form.nationality.trim() || 'Bangladeshi',
        verified: true,
        mode: 'account',
      })

      try {
        await refreshHistory()
      } catch (histErr) {
        // Initial history fetch failure on a fresh signup should not abort successful onboarding
        console.warn('Initial history refresh skipped after onboarding:', histErr)
      }

      navigate(location.state?.from || '/')
    } catch (err) {
      let msg = err.message
      if (!msg || msg === 'Failed to fetch' || err.name === 'TypeError') {
        msg = 'Unable to connect to the authentication server. The backend service may be waking up from idle (~25s on Azure Container Apps) or experiencing temporary network issues. Please wait a moment and try again.'
      }
      setError(msg)
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
                maxLength={100}
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
              maxLength={254}
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
              maxLength={128}
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
                    maxLength={100}
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

          {slowLoading && loading && (
            <div className="auth-status-hint" role="status">
              <LoaderCircle className="spin" size={16} />
              <span>Connecting to live service (Azure Container may take ~20s to wake up if idle)…</span>
            </div>
          )}

          {error && (
            <div className="form-error" role="alert">
              <p>{error}</p>
              {(error.includes('waking up') ||
                error.includes('offline') ||
                error.includes('Unable to connect') ||
                error.includes('temporarily unavailable') ||
                error.includes('Cross-origin') ||
                error.includes('proxy') ||
                error.includes('routing') ||
                error.includes('HTTP 5') ||
                error.includes('timeout') ||
                error.includes('network')) && (
                <button
                  type="button"
                  className="retry-btn"
                  onClick={() => submit()}
                  disabled={loading}
                >
                  Try again
                </button>
              )}
            </div>
          )}

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
