import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, Check, RefreshCw, Search, Shield, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { adminApi } from '../services/liveApi'
import './admin.css'

const TESTS = [
  ['ppdt', 'PPDT'], ['wat', 'WAT'], ['tat', 'TAT'], ['sdt', 'SDT'], ['sct', 'SCT'],
]

function number(value) {
  return new Intl.NumberFormat().format(Number(value || 0))
}

function date(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function StatCard({ icon: Icon, label, value, note }) {
  return <article className="admin-stat-card">
    <span className="admin-stat-icon"><Icon aria-hidden="true" size={19} /></span>
    <span className="admin-stat-label">{label}</span>
    <strong>{number(value)}</strong>
    <small>{note}</small>
  </article>
}

export default function AdminPage() {
  const { profile } = useApp()
  const firstLoad = useRef(true)
  const loadSequence = useRef(0)
  const [overview, setOverview] = useState(null)
  const [result, setResult] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [draftRoles, setDraftRoles] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [savingId, setSavingId] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [searchInput])

  const load = useCallback(async (includeOverview = false) => {
    const requestId = ++loadSequence.current
    setLoading(true)
    setError('')
    try {
      const [users, metrics] = await Promise.all([
        adminApi.users({ search, role: roleFilter, page, limit: 25 }),
        includeOverview ? adminApi.overview() : Promise.resolve(null),
      ])
      if (requestId !== loadSequence.current) return
      if (users.error || metrics?.error) throw new Error('Administrator data could not be loaded.')
      setResult(users)
      if (metrics) setOverview(metrics)
      setDraftRoles(Object.fromEntries((users.users || []).map((user) => [user.id, user.role])))
    } catch (loadError) {
      if (requestId === loadSequence.current) setError(loadError.message || 'Administrator data could not be loaded.')
    } finally {
      if (requestId === loadSequence.current) setLoading(false)
    }
  }, [search, roleFilter, page])

  useEffect(() => {
    const includeOverview = firstLoad.current
    firstLoad.current = false
    load(includeOverview)
  }, [load])

  const maxAttempts = useMemo(() => Math.max(1, ...TESTS.map(([key]) => Number(overview?.attempts_by_test?.[key] || 0))), [overview])

  async function saveRole(user) {
    const role = draftRoles[user.id]
    if (!role || role === user.role) return
    if (!window.confirm(`Change ${user.email} from ${user.role} to ${role}?`)) return
    setSavingId(user.id)
    setError('')
    setNotice('')
    try {
      const updated = await adminApi.setUserRole(user.id, role)
      if (updated.error) throw new Error('This role change could not be completed.')
      setNotice(`Updated ${user.email} to ${updated.role}.`)
      await load(true)
    } catch (saveError) {
      setError(saveError.message || 'This role change could not be completed.')
      setDraftRoles((current) => ({ ...current, [user.id]: user.role }))
    } finally {
      setSavingId('')
    }
  }

  return <section className="page admin-page" aria-labelledby="admin-title">
    <div className="admin-heading-row">
      <div>
        <p className="admin-eyebrow"><ShieldCheck size={15} aria-hidden="true" /> PLATFORM ADMINISTRATION</p>
        <h2 id="admin-title">Admin dashboard</h2>
        <p className="admin-subtitle">A concise view of account growth, practice activity, and access roles.</p>
      </div>
      <button className="secondary-button admin-refresh" onClick={() => load(true)} disabled={loading}>
        <RefreshCw size={16} className={loading ? 'admin-spinning' : ''} /> Refresh
      </button>
    </div>

    {error && <div className="admin-alert" role="alert">{error}</div>}
    {notice && <div className="admin-notice" role="status"><Check size={16} /> {notice}</div>}

    <div className="admin-stats-grid" aria-label="Platform overview">
      <StatCard icon={Users} label="Registered accounts" value={overview?.users_total} note={`${number(overview?.new_users_30d)} joined in the last 30 days`} />
      <StatCard icon={Activity} label="Practice attempts" value={overview?.attempts_total} note="Across all five practice tests" />
      <StatCard icon={Shield} label="Administrators" value={overview?.admins_total} note="Accounts with platform access" />
    </div>

    <section className="surface admin-activity" aria-labelledby="activity-title">
      <div className="admin-section-title">
        <div className="admin-title-icon"><Activity size={18} /></div>
        <div><h3 id="activity-title">Practice activity</h3><p>Attempts recorded across the platform</p></div>
      </div>
      <div className="admin-test-bars">
        {TESTS.map(([key, label]) => {
          const count = Number(overview?.attempts_by_test?.[key] || 0)
          return <div className="admin-test-bar" key={key}>
            <span>{label}</span><div className="admin-bar-track"><i style={{ width: `${Math.max(count ? 3 : 0, count / maxAttempts * 100)}%` }} /></div><strong>{number(count)}</strong>
          </div>
        })}
      </div>
    </section>

    <section className="surface admin-users" aria-labelledby="users-title">
      <div className="admin-users-heading">
        <div className="admin-section-title">
          <div className="admin-title-icon"><Users size={18} /></div>
          <div><h3 id="users-title">User accounts</h3><p>{number(result?.total)} accounts · role changes are recorded</p></div>
        </div>
        <div className="admin-filters">
          <label className="admin-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search users</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name or email" /></label>
          <select aria-label="Filter by role" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1) }}>
            <option value="">All roles</option><option value="candidate">Candidate</option><option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-user-table">
          <thead><tr><th scope="col">Account</th><th scope="col">Joined</th><th scope="col">Attempts</th><th scope="col">Access role</th><th scope="col"><span className="sr-only">Save role</span></th></tr></thead>
          <tbody>
            {loading && !result ? <tr><td colSpan="5" className="admin-empty">Loading accounts…</td></tr> : null}
            {!loading && result?.users?.length === 0 ? <tr><td colSpan="5" className="admin-empty">No accounts match those filters.</td></tr> : null}
            {result?.users?.map((user) => <tr key={user.id}>
              <td><strong>{user.name || 'Candidate'}</strong><small>{user.email}</small></td>
              <td>{date(user.created_at)}</td>
              <td>{number(user.attempts)}</td>
              <td><span className={`admin-role-badge ${user.role}`}>{user.role === 'admin' ? 'Admin' : 'Candidate'}</span></td>
              <td className="admin-role-control">
                <select aria-label={`Change access for ${user.email}`} value={draftRoles[user.id] || user.role} onChange={(event) => setDraftRoles((current) => ({ ...current, [user.id]: event.target.value }))} disabled={user.id === profile.id}>
                  <option value="candidate">Candidate</option><option value="admin">Admin</option>
                </select>
                <button className="admin-save-role" onClick={() => saveRole(user)} disabled={savingId === user.id || draftRoles[user.id] === user.role || user.id === profile.id} aria-label={`Save role for ${user.email}`}>
                  {savingId === user.id ? 'Saving…' : 'Save'}
                </button>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <span>Page {result?.page || page} of {Math.max(result?.pages || 0, 1)}</span>
        <div>
          <button className="secondary-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1}><ArrowLeft size={15} /> Previous</button>
          <button className="secondary-button" onClick={() => setPage((value) => value + 1)} disabled={loading || page >= (result?.pages || 1)}>Next <ArrowRight size={15} /></button>
        </div>
      </div>
    </section>
    <p className="admin-footnote">Role changes are server-validated, audited, and cannot remove the last administrator. <Link to="/guide">View candidate guide</Link></p>
  </section>
}
