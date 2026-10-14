import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronRight, Search, UserRound, X } from 'lucide-react'
import { adminApi } from '../services/liveApi'
import { useApp } from '../state/AppContext'
import './admin.css'

const TEST_LABELS = { ppdt: 'PPDT', wat: 'WAT', tat: 'TAT', sdt: 'SDT', sct: 'SCT' }
const fmtDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : '—'

export default function AdminUsersPage() {
  const { profile: currentProfile } = useApp()
  const [result, setResult] = useState(null)
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [form, setForm] = useState({ name: '', age: '', nationality: '' })
  const [saving, setSaving] = useState(false)
  const [roleDraft, setRoleDraft] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(queryInput.trim()); setPage(1) }, 250)
    return () => clearTimeout(timer)
  }, [queryInput])

  const loadUsers = useCallback(async () => {
    setLoading(true); setError('')
    try { setResult(await adminApi.users({ search: query, role, page, limit: 25 })) }
    catch (loadError) { setError(loadError.message || 'User accounts could not be loaded.') }
    finally { setLoading(false) }
  }, [query, role, page])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function openProfile(user) {
    setSelected(user); setDetail(null); setDetailLoading(true); setError(''); setNotice('')
    try {
      const profile = await adminApi.userProfile(user.id)
      setDetail(profile)
      setRoleDraft(profile.role)
      setForm({ name: profile.name || '', age: profile.age ?? '', nationality: profile.nationality || '' })
    } catch (loadError) { setError(loadError.message || 'The profile could not be loaded.') }
    finally { setDetailLoading(false) }
  }

  async function saveProfile(event) {
    event.preventDefault()
    if (!selected) return
    setSaving(true); setError(''); setNotice('')
    try {
      const updated = await adminApi.updateUserProfile(selected.id, {
        name: form.name.trim(),
        age: form.age === '' ? null : Number(form.age),
        nationality: form.nationality.trim(),
      })
      setDetail((current) => ({ ...current, ...updated }))
      setNotice('Profile details saved.')
      await loadUsers()
    } catch (saveError) { setError(saveError.message || 'The profile could not be saved.') }
    finally { setSaving(false) }
  }

  async function saveRole() {
    if (!selected || roleDraft === detail?.role) return
    if (!window.confirm(`Change ${detail.email} from ${detail.role} to ${roleDraft}?`)) return
    setSaving(true); setError(''); setNotice('')
    try {
      const updated = await adminApi.setUserRole(selected.id, roleDraft)
      setDetail((current) => ({ ...current, role: updated.role }))
      setNotice(`Access role changed to ${updated.role}.`)
      await loadUsers()
    } catch (saveError) { setError(saveError.message || 'The access role could not be updated.') }
    finally { setSaving(false) }
  }

  return <section className="admin-page" aria-labelledby="admin-users-title">
    <div className="admin-heading-row"><div><p className="admin-eyebrow"><UserRound size={15} /> ACCOUNTS</p><h1 id="admin-users-title">User profiles</h1><p className="admin-subtitle">Review account details and progress; edit only basic profile fields.</p></div></div>
    {error && !selected && <div className="admin-alert" role="alert">{error}</div>}
    {notice && !selected && <div className="admin-success" role="status"><Check size={15} />{notice}</div>}
    <section className="admin-surface admin-users-panel">
      <div className="admin-users-heading"><div><strong>{Number(result?.total || 0).toLocaleString()} accounts</strong><small>Emails and profile details are visible only to administrators.</small></div><div className="admin-filters"><label className="admin-search"><Search size={16} /><span className="sr-only">Search by name or email</span><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Search name or email" /></label><select aria-label="Filter accounts by role" value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }}><option value="">All roles</option><option value="candidate">Candidates</option><option value="admin">Administrators</option></select></div></div>
      <div className="admin-table-scroll"><table className="admin-user-table"><thead><tr><th>Account</th><th>Joined</th><th>Attempts</th><th>Role</th><th><span className="sr-only">Profile details</span></th></tr></thead><tbody>
        {loading && !result && <tr><td colSpan="5" className="admin-empty">Loading accounts…</td></tr>}
        {!loading && result?.users?.length === 0 && <tr><td colSpan="5" className="admin-empty">No accounts match those filters.</td></tr>}
        {result?.users?.map((user) => <tr key={user.id}><td><strong>{user.name || 'Candidate'}</strong><small>{user.email}</small></td><td>{fmtDate(user.created_at)}</td><td>{Number(user.attempts || 0).toLocaleString()}</td><td><span className={`admin-role-badge ${user.role}`}>{user.role === 'admin' ? 'Admin' : 'Candidate'}</span></td><td><button className="admin-row-open" onClick={() => openProfile(user)}>View profile <ChevronRight size={15} /></button></td></tr>)}
      </tbody></table></div>
      <div className="admin-pagination"><span>Page {result?.page || page} of {Math.max(result?.pages || 0, 1)}</span><div><button className="admin-secondary-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1}>Previous</button><button className="admin-secondary-button" onClick={() => setPage((value) => value + 1)} disabled={loading || page >= (result?.pages || 1)}>Next</button></div></div>
    </section>
    {selected && <div className="admin-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
      <aside className="admin-profile-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-profile-title">
        <header><div><p className="admin-eyebrow">ACCOUNT PROFILE</p><h2 id="admin-profile-title">{detail?.name || selected.name || 'Candidate'}</h2><small>{detail?.email || selected.email}</small></div><button className="admin-icon-button" aria-label="Close profile" onClick={() => setSelected(null)}><X size={18} /></button></header>
        {error && <div className="admin-alert" role="alert">{error}</div>}{notice && <div className="admin-success" role="status"><Check size={15} />{notice}</div>}
        {detailLoading ? <p className="admin-empty">Loading profile…</p> : detail && <>
          <div className="admin-profile-meta"><span>Joined <strong>{fmtDate(detail.created_at)}</strong></span><span>Role <strong>{detail.role === 'admin' ? 'Administrator' : 'Candidate'}</strong></span><span>Research consent <strong>{detail.research_consent ? 'Granted' : 'Not granted'}</strong></span>{detail.research_consent_at && <span>Consent recorded <strong>{fmtDate(detail.research_consent_at)}</strong></span>}</div>
          <section className="admin-profile-stats"><h3>Practice by test</h3><div>{Object.entries(detail.tests || {}).length ? Object.entries(detail.tests).map(([test, stats]) => <article key={test}><strong>{TEST_LABELS[test] || test.toUpperCase()}</strong><span>{stats.attempts} attempts</span><span>{stats.average_score == null ? 'No scored attempts' : `${Number(stats.average_score).toFixed(1)} avg score`}</span><small>Last attempt {fmtDate(stats.last_attempt_at)}</small></article>) : <p className="admin-empty">No practice attempts yet.</p>}</div></section>
          <form className="admin-profile-form" onSubmit={saveProfile}><h3>Edit profile</h3><label>Name<input maxLength="120" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><div><label>Age<input type="number" min="13" max="100" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} /></label><label>Nationality<input maxLength="100" value={form.nationality} onChange={(event) => setForm({ ...form, nationality: event.target.value })} /></label></div><p>Email and research consent are read-only here. Consent must never be changed by an administrator.</p><button className="admin-primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></form>
          <section className="admin-profile-form admin-role-form"><h3>Access role</h3><div><select aria-label="Account access role" value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)} disabled={detail.id === currentProfile.id}><option value="candidate">Candidate</option><option value="admin">Administrator</option></select><button className="admin-secondary-button" onClick={saveRole} disabled={saving || roleDraft === detail.role || detail.id === currentProfile.id}>Update role</button></div><small>Role changes are audited. The API prevents self-promotion and removing the last administrator.</small></section>
        </>}
      </aside>
    </div>}
  </section>
}
