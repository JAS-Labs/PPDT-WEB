import { useEffect, useState } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { adminApi } from '../services/liveApi'
import './admin.css'

const fmtDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const pretty = (value) => String(value || 'activity').replaceAll('_', ' ')

export default function AdminActivityPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function load() {
    setLoading(true); setError('')
    try { const result = await adminApi.activity(100); setItems(result.items || []) }
    catch (loadError) { setError(loadError.message || 'Activity could not be loaded.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  return <section className="admin-page" aria-labelledby="admin-activity-title">
    <div className="admin-heading-row"><div><p className="admin-eyebrow"><Activity size={15} /> AUDIT TRAIL</p><h1 id="admin-activity-title">Admin activity</h1><p className="admin-subtitle">Review profile edits, role changes, password reset requests, and access to individual responses.</p></div><button className="admin-secondary-button" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'admin-spinning' : ''} /> Refresh</button></div>
    {error && <div className="admin-alert" role="alert">{error}</div>}
    <section className="admin-surface admin-audit-panel"><div className="admin-audit-heading"><strong>Recent events</strong><small>Up to 100 most recent events · response text is never copied into this log</small></div><div className="admin-audit-list">
      {loading && !items.length && <p className="admin-empty">Loading administrator activity…</p>}
      {!loading && !items.length && <p className="admin-empty">No administrator actions have been recorded yet.</p>}
      {items.map((item) => <article key={item.id} className="admin-audit-event"><span className={`admin-audit-icon ${item.action}`}><Activity size={16} /></span><div className="admin-audit-event-main"><strong>{pretty(item.action)}</strong><span>{item.actor_name || 'Administrator'}{item.target_name ? ` · ${item.target_name}` : ''}</span>{item.metadata?.test_type && <small>Test: {String(item.metadata.test_type).toUpperCase()}{item.metadata.session_id ? ` · Attempt ${item.metadata.session_id}` : ''}</small>}{Array.isArray(item.metadata?.changed_fields) && <small>Changed: {item.metadata.changed_fields.join(', ')}</small>}{item.metadata?.old_role && <small>{item.metadata.old_role} → {item.metadata.new_role}</small>}</div><time>{fmtDate(item.created_at)}</time></article>)}
    </div></section>
  </section>
}
