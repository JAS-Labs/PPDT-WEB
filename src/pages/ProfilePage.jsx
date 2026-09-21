import {
  BarChart3,
  BellRing,
  BookOpen,
  Download,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  Volume2,
  Rows3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, historyApi } from '../services/liveApi'
import { useApp } from '../state/AppContext'
import { TESTS } from '../data/tests'

const options = [
  { key: 'reminders', title: 'Daily practice reminder', detail: 'Stay consistent with one short session.', icon: BellRing },
  { key: 'sounds', title: 'Timer sounds', detail: 'Play an audio cue when each prompt changes.', icon: Volume2 },
  { key: 'compact', title: 'Compact mode', detail: 'Fit more information on larger screens.', icon: Rows3 },
]

export default function ProfilePage() {
  const { profile, saveProfile, setToken, settings, updateSettings, stats, history, refreshHistory, isAuthenticated } = useApp()
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState('')

  const initial = profile.name?.[0]?.toUpperCase() || 'S'
  const isAccount = profile.mode === 'account' && Boolean(localStorage.getItem('issb-token'))

  const testStats = useMemo(() => {
    return TESTS.map((t) => {
      const attempts = history.filter((i) => i.type?.toUpperCase() === t.name)
      const count = attempts.length
      const avg = count > 0
        ? (attempts.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / count).toFixed(1)
        : '—'
      const best = count > 0
        ? Math.max(...attempts.map((item) => Number(item.score) || 0)).toFixed(1)
        : '—'
      return { ...t, count, avg, best }
    })
  }, [history])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore network failure on logout
    }
    try { localStorage.removeItem('issb-token') } catch {}
    if (setToken) setToken(null)
    saveProfile({ name: 'Candidate', email: '', nationality: 'Bangladeshi', verified: false, mode: 'candidate' })
    await refreshHistory()
    navigate('/login', { replace: true })
  }

  const handleExport = async () => {
    setExporting(true)
    setMessage('')
    try {
      const data = await historyApi.exportHistory()
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`
      const a = document.createElement('a')
      a.href = jsonString
      a.download = `issb-prep-history-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setMessage('Export downloaded successfully.')
    } catch (err) {
      setMessage(err.message || 'Could not export history.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page profile-page">
      <section className="surface profile-surface">
        {/* Profile Hero Header */}
        <div className="profile-hero">
          <span className="large-avatar">{initial}</span>
          <div>
            <h2>{profile.name}</h2>
            <span>
              <ShieldCheck size={16} /> {isAccount ? 'Verified Candidate' : 'Candidate Account'}
            </span>
            {profile.email && <small className="profile-email">{profile.email}</small>}
          </div>

          <div className="profile-hero-actions">
            {isAuthenticated ? (
              <button className="secondary-button logout-btn" onClick={handleLogout}>
                <LogOut size={16} /> Sign out
              </button>
            ) : (
              <Link to="/login" className="secondary-button">
                <LogIn size={16} /> Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Demographics / Account Info */}
        {(profile.age || profile.nationality) && (
          <div className="profile-details-strip">
            {profile.age && <span>Age: <b>{profile.age} years</b></span>}
            {profile.nationality && <span>Nationality: <b>{profile.nationality}</b></span>}
            <span>Status: <b className="text-teal">Active Live Candidate</b></span>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="profile-stats">
          <div>
            <strong>{stats.sessions}</strong>
            <span>Sessions</span>
          </div>
          <div>
            <strong>{stats.average}</strong>
            <span>Average</span>
          </div>
          <div>
            <strong>{stats.best}</strong>
            <span>Best</span>
          </div>
        </div>

        {/* Per-Test Performance Breakdown */}
        <div className="profile-test-breakdown">
          <h3 className="profile-subhead">Test Performance Breakdown</h3>
          <div className="profile-test-grid">
            {testStats.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.id} className="profile-test-card">
                  <div className="profile-test-card-top">
                    <span className={`test-icon-sm ${item.color}`}><Icon size={16} /></span>
                    <strong>{item.name}</strong>
                    <span className="test-count">{item.count} tests</span>
                  </div>
                  <div className="profile-test-card-scores">
                    <div>
                      <small>Avg Score</small>
                      <b>{item.avg}</b>
                    </div>
                    <div>
                      <small>Best</small>
                      <b>{item.best}</b>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Direct Links to Analytics & Guide */}
        <div className="profile-shortcuts-grid">
          <Link to="/analytics" className="shortcut-card">
            <span className="shortcut-icon teal"><BarChart3 size={20} /></span>
            <div>
              <strong>Progress Analytics</strong>
              <small>View AI psychological assessment & percentile benchmarks</small>
            </div>
          </Link>

          <Link to="/guide" className="shortcut-card">
            <span className="shortcut-icon blue"><BookOpen size={20} /></span>
            <div>
              <strong>Evaluation Guide</strong>
              <small>Learn the 9 Officer Like Qualities and test scoring rubrics</small>
            </div>
          </Link>

          <button
            className="shortcut-card text-left"
            onClick={handleExport}
            disabled={exporting}
          >
            <span className="shortcut-icon violet"><Download size={20} /></span>
            <div>
              <strong>{exporting ? 'Exporting…' : 'Export Full History'}</strong>
              <small>Download your complete test responses as JSON</small>
            </div>
          </button>
        </div>

        {message && (
          <p className="profile-message-note">
            <CheckCircle2 size={16} /> {message}
          </p>
        )}

        {/* Settings List */}
        <div className="settings-list">
          {options.map(({ key, title, detail, icon: Icon }) => (
            <div className="setting-row" key={key}>
              <span className="setting-icon"><Icon size={19} /></span>
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
              <button
                className={`switch ${settings[key] ? 'on' : ''}`}
                onClick={() => updateSettings(key)}
                aria-label={`Toggle ${title}`}
                aria-pressed={settings[key]}
              >
                <span />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
