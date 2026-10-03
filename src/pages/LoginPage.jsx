import { ArrowLeft, BookOpen, Clock3, TrendingUp, LoaderCircle, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../services/liveApi'
import { useApp } from '../state/AppContext'
import './auth.css'

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
    research_consent: false,
  })
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slowLoading, setSlowLoading] = useState(false)
  const [policies, setPolicies] = useState(null)
  const [policiesLoading, setPoliciesLoading] = useState(false)
  const [policiesError, setPoliciesError] = useState('')
  const [policyReload, setPolicyReload] = useState(0)

  useEffect(() => {
    if (mode !== 'signup') return
    let active = true
    setPoliciesLoading(true)
    setPoliciesError('')
    setTermsAccepted(false)
    setForm((current) => ({ ...current, research_consent: false }))
    authApi.policies().then((catalog) => {
      if (!active) return
      if (!catalog || !Array.isArray(catalog.policies) || (catalog.enforced && !catalog.ready)) {
        throw new Error('Current approved policies are unavailable.')
      }
      setPolicies(catalog)
    }).catch((err) => {
      if (!active) return
      if (err.status === 404) {
        // An older backend has no versioned contract. Never invent versions.
        setPolicies({ enforced: false, ready: false, policies: [] })
      } else {
        setPolicies(null)
        setPoliciesError('Policies could not be loaded. Please reload them before registering.')
      }
    }).finally(() => { if (active) setPoliciesLoading(false) })
    return () => { active = false }
  }, [mode, policyReload])

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
        if (policiesLoading || !policies || policiesError) {
          setError('Please load the current policies before creating your account.')
          return
        }
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
        if (!termsAccepted) {
          setError('Please accept the Terms and Conditions to create your account.')
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
          ...(policies.ready ? {
            terms_accepted: termsAccepted,
            privacy_acknowledged: termsAccepted,
            ...Object.fromEntries(policies.policies.map((document) => [`${document.document_type}_version`, document.version])),
          } : {}),
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
        name: result.user?.name || (mode === 'signup' ? form.name.trim() : '') || email.split('@')[0],
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
      if (mode === 'signup' && err.status === 409) {
        setTermsAccepted(false)
        setForm((current) => ({ ...current, research_consent: false }))
        setPolicyReload((current) => current + 1)
      }
      let msg = err.message
      if (!msg || msg === 'Failed to fetch' || err.name === 'TypeError') {
        msg = 'Unable to connect to the authentication server. Please wait a moment and try again.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page auth-refresh">
      <header className="auth-topbar">
        <Link to="/" className="auth-logo"><img src="/app-logo.png" alt="" />ISSB Prep</Link>
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to home</Link>
      </header>
      <div className="auth-content">
        <section className="auth-brand">
          <p className="auth-kicker">YOUR PRACTICE STARTS HERE</p>
          <h1>Practice with focus.<br /><span>Review with clarity.</span></h1>
          <p className="auth-description">A quiet space to prepare, understand your responses, and make your next session count.</p>
          <ul className="auth-benefits">
            <li><Clock3 />Timed practice across five test formats</li>
            <li><BookOpen />Personal feedback you can learn from</li>
            <li><TrendingUp />Your progress, together in one place</li>
          </ul>
        </section>
        <section className="auth-form-wrap" aria-label={mode === 'signin' ? 'Sign-in form' : 'Registration form'}>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-mode-switch">
            <button
              type="button"
              className={`mode-btn ${mode === 'signin' ? 'active' : ''}`}
              aria-pressed={mode === 'signin'}
              disabled={loading}
              onClick={() => { setMode('signin'); setError(''); }}
            >
              <LogIn size={15} /> Sign in
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
              aria-pressed={mode === 'signup'}
              disabled={loading}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              <UserPlus size={15} /> Create account
            </button>
          </div>

          <h2>
            {mode === 'signin' ? 'Sign in to continue' : 'Create candidate account'}
          </h2>

          <p className="auth-intro">
            {mode === 'signin'
              ? 'Pick up your practice and review your progress.'
              : 'Create your profile to save sessions and learn from your feedback.'}
          </p>

          {mode === 'signup' && (
            <label>
              Full Name
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Saifur Rahman"
                maxLength={100}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              maxLength={254}
              required
            />
          </label>

          <div className="auth-password-group">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-password-field">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
              minLength={mode === 'signup' ? 8 : 1}
              maxLength={128}
              required
            />
          <button type="button" className="password-visibility" aria-pressed={showPassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((visible) => !visible)}>
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
            </div>
          </div>
          {mode === 'signup' && <p className="auth-account-note">Use at least 8 characters. Avoid reusing a password from another account.</p>}

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
                  disabled={policiesLoading || Boolean(policiesError)}
                  onChange={(e) => setForm({ ...form, research_consent: e.target.checked })}
                  required
                />
                <span>I agree that my anonymized responses may be used for ISSB psychometric research.</span>
              </label>
              <label className="checkbox-label terms-checkbox">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  disabled={policiesLoading || Boolean(policiesError)}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                />
                <span>{policies?.ready ? 'I accept the Terms and Conditions and acknowledge the Privacy Notice below.' : 'I accept the Terms and Conditions below.'}</span>
              </label>
              <details className="auth-terms">
                <summary>Read Terms and Conditions</summary>
                {policies?.ready ? policies.policies.map((document) => (
                  <section className="auth-policy-document" key={document.document_type}>
                    <h3>{({ terms: 'Terms and Conditions', privacy: 'Privacy Notice', research: 'Research Consent' })[document.document_type]} · {document.version}</h3>
                    <p>{document.content}</p>
                  </section>
                )) : <>
                  <p>ISSB Prep is a practice tool. Its feedback is for preparation only, is not an official ISSB assessment, and does not guarantee selection.</p>
                  <p>Keep your account credentials private, provide accurate profile details, and use the service responsibly. Your practice responses are sent to the service to generate feedback and save your history. Research consent is requested separately above.</p>
                  <p>Versioned policies are not available on this server yet. This brief product notice is not an approved comprehensive policy.</p>
                </>}
              </details>
              {policiesLoading && <p className="auth-account-note" role="status">Loading current policies…</p>}
              {policiesError && <div className="form-error" role="alert"><p>{policiesError}</p>
                <button type="button" className="retry-btn" onClick={() => setPolicyReload((current) => current + 1)}>Reload policies</button>
              </div>}
            </>
          )}

          {slowLoading && loading && (
            <div className="auth-status-hint" role="status">
              <LoaderCircle className="spin" size={16} />
              <span>This is taking a moment. We’re working on it.</span>
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

          {mode === 'signin' && <Link className="text-button" to="/reset-password">Forgot password?</Link>}
          <button className="primary-button" disabled={loading || (mode === 'signup' && (policiesLoading || Boolean(policiesError)))}>
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
      </div>
      <footer className="auth-footer">PPDT · WAT · TAT · SDT · SCT</footer>
    </main>
  )
}
