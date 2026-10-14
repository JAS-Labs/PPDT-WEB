import { useEffect, useState } from 'react'
import { Activity, ArrowRight, ClipboardList, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminApi } from '../services/liveApi'
import './admin.css'

const TESTS = [['ppdt', 'PPDT'], ['wat', 'WAT'], ['tat', 'TAT'], ['sdt', 'SDT'], ['sct', 'SCT']]
const number = (value) => new Intl.NumberFormat().format(Number(value || 0))

export default function AdminPage() {
  const [overview, setOverview] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const [metrics, log] = await Promise.all([adminApi.overview(), adminApi.activity(8)])
      setOverview(metrics); setActivity(log.items || [])
    } catch (loadError) { setError(loadError.message || 'Admin overview is unavailable.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  const maxAttempts = Math.max(1, ...TESTS.map(([key]) => Number(overview?.attempts_by_test?.[key] || 0)))

  return <section className="admin-page" aria-labelledby="admin-title">
    <div className="admin-heading-row">
      <div><p className="admin-eyebrow"><ShieldCheck size={15} /> ADMIN OVERVIEW</p><h1 id="admin-title">Good to see you.</h1><p className="admin-subtitle">A clear snapshot of practice, accounts, and administrator activity.</p></div>
      <button className="admin-secondary-button" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'admin-spinning' : ''} /> Refresh</button>
    </div>
    {error && <div className="admin-alert" role="alert">{error}</div>}
    <div className="admin-stats-grid">
      <article className="admin-stat-card"><span className="admin-stat-icon"><Users size={19} /></span><span className="admin-stat-label">Registered accounts</span><strong>{loading && !overview ? '—' : number(overview?.users_total)}</strong><small>{number(overview?.new_users_30d)} joined in the last 30 days</small></article>
      <article className="admin-stat-card"><span className="admin-stat-icon"><ClipboardList size={19} /></span><span className="admin-stat-label">Practice attempts</span><strong>{loading && !overview ? '—' : number(overview?.attempts_total)}</strong><small>Across all five practice tests</small></article>
      <article className="admin-stat-card"><span className="admin-stat-icon"><ShieldCheck size={19} /></span><span className="admin-stat-label">Administrators</span><strong>{loading && !overview ? '—' : number(overview?.admins_total)}</strong><small>Accounts with platform access</small></article>
    </div>
    <div className="admin-overview-columns">
      <section className="admin-surface admin-activity" aria-labelledby="practice-activity-title">
        <div className="admin-section-title"><div className="admin-title-icon"><Activity size={18} /></div><div><h2 id="practice-activity-title">Practice by test</h2><p>Attempts recorded across the platform</p></div></div>
        <div className="admin-test-bars">{TESTS.map(([key, label]) => {
          const count = Number(overview?.attempts_by_test?.[key] || 0)
          return <div className="admin-test-bar" key={key}><span>{label}</span><div className="admin-bar-track"><i style={{ width: `${count ? Math.max(3, count / maxAttempts * 100) : 0}%` }} /></div><strong>{number(count)}</strong></div>
        })}</div>
        <Link className="admin-inline-link" to="/admin/responses">Review candidate responses <ArrowRight size={15} /></Link>
      </section>
      <section className="admin-surface admin-quick-links" aria-labelledby="admin-tools-title">
        <div className="admin-section-title"><div className="admin-title-icon"><ShieldCheck size={18} /></div><div><h2 id="admin-tools-title">Admin tools</h2><p>Manage platform operations</p></div></div>
        <Link to="/admin/users"><span className="admin-quick-icon"><Users size={17} /></span><span><strong>User profiles</strong><small>Review profile details and test history</small></span><ArrowRight size={16} /></Link>
        <Link to="/admin/responses"><span className="admin-quick-icon"><ClipboardList size={17} /></span><span><strong>Test responses</strong><small>Browse answers by test type and date</small></span><ArrowRight size={16} /></Link>
        <Link to="/admin/activity"><span className="admin-quick-icon"><Activity size={17} /></span><span><strong>Admin activity</strong><small>See profile and access changes</small></span><ArrowRight size={16} /></Link>
      </section>
    </div>
    <section className="admin-surface admin-recent-activity" aria-labelledby="recent-admin-activity-title">
      <div className="admin-recent-heading"><div className="admin-section-title"><div className="admin-title-icon"><Activity size={18} /></div><div><h2 id="recent-admin-activity-title">Recent administrator activity</h2><p>Access to responses and changes to user accounts</p></div></div><Link className="admin-inline-link" to="/admin/activity">View activity log <ArrowRight size={15} /></Link></div>
      {loading && !overview ? <p className="admin-empty">Loading recent activity…</p> : activity.length ? <div className="admin-activity-list">{activity.map((event) => <div className="admin-activity-item" key={event.id}><span className={`admin-action-dot ${event.action}`} /><div><strong>{event.action.replaceAll('_', ' ')}</strong><small>{event.actor_name || 'Administrator'}{event.target_name ? ` · ${event.target_name}` : ''}</small></div><time>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.created_at))}</time></div>)}</div> : <p className="admin-empty">No administrator activity recorded yet.</p>}
    </section>
  </section>
}
