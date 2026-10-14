import { useEffect, useState } from 'react'
import { ClipboardList, Eye, X } from 'lucide-react'
import { adminApi } from '../services/liveApi'
import './admin.css'

const TESTS = [['', 'All tests'], ['ppdt', 'PPDT'], ['wat', 'WAT'], ['tat', 'TAT'], ['sdt', 'SDT'], ['sct', 'SCT']]
const testName = (value) => value ? value.toUpperCase() : 'All tests'
const fmtDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

function AnswerSection({ title, value }) {
  if (value == null || value === '') return null
  return <section className="admin-answer-section"><h3>{title}</h3><p>{typeof value === 'string' ? value : JSON.stringify(value)}</p></section>
}

function ResponseAnswers({ response }) {
  const payload = response.payload || {}
  const answers = Array.isArray(payload.responses) ? payload.responses : []
  const fields = response.test_type === 'ppdt'
    ? [['Observation', payload.spot_text], ['Action plan', payload.action_text], ['Story', payload.story_text], ['Reasoning', payload.logic_text]]
    : response.test_type === 'tat' ? [['Story', payload.story_text]] : []

  return <div className="admin-response-detail-body">
    <div className="admin-response-meta"><span>Test <strong>{testName(response.test_type)}</strong></span><span>Submitted <strong>{fmtDate(response.created_at)}</strong></span><span>Candidate ref <strong>{response.candidate_ref}</strong></span><span>Score <strong>{response.score == null ? 'Not scored' : `${Number(response.score).toFixed(1)} / 10`}</strong></span></div>
    {fields.map(([title, value]) => <AnswerSection key={title} title={title} value={value} />)}
    {answers.length > 0 && <section className="admin-answer-section"><h3>Responses <span>{answers.length}</span></h3><div className="admin-answer-list">{answers.map((item, index) => <article key={`${index}-${item.word || item.stem || item.prompt || ''}`}><div><strong>{item.word || item.stem || item.prompt || `Response ${index + 1}`}</strong>{item.response_time_ms != null && <small>{(Number(item.response_time_ms) / 1000).toFixed(1)} sec</small>}</div><p>{item.response || 'No response provided.'}</p></article>)}</div></section>}
    {payload.feedback && <details className="admin-feedback-disclosure"><summary>Assessment feedback</summary><pre>{JSON.stringify(payload.feedback, null, 2)}</pre></details>}
    {!fields.some(([, value]) => value) && !answers.length && <p className="admin-empty">No response text is stored for this attempt.</p>}
  </div>
}

export default function AdminResponsesPage() {
  const [testType, setTestType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => { setPage(1) }, [testType, dateFrom, dateTo])
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    const from = dateFrom ? `${dateFrom}T00:00:00` : ''
    const to = dateTo ? `${dateTo}T23:59:59.999999` : ''
    adminApi.responses({ testType, dateFrom: from, dateTo: to, page, limit: 25 })
      .then((data) => { if (active) setResult(data) })
      .catch((loadError) => { if (active) setError(loadError.message || 'Responses could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [testType, dateFrom, dateTo, page])

  async function openResponse(item) {
    setSelected(item); setDetail(null); setDetailLoading(true); setError('')
    try { setDetail(await adminApi.response(item.test_type, item.session_id)) }
    catch (loadError) { setError(loadError.message || 'The response detail could not be loaded.') }
    finally { setDetailLoading(false) }
  }

  return <section className="admin-page" aria-labelledby="admin-responses-title">
    <div className="admin-heading-row"><div><p className="admin-eyebrow"><ClipboardList size={15} /> RESPONSE REVIEW</p><h1 id="admin-responses-title">Test responses</h1><p className="admin-subtitle">Filter attempts by test and date. Candidate answers stay pseudonymous in the list.</p></div></div>
    {error && !selected && <div className="admin-alert" role="alert">{error}</div>}
    <section className="admin-surface admin-responses-panel">
      <div className="admin-response-filters"><label>Test type<select value={testType} onChange={(event) => setTestType(event.target.value)}>{TESTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>Through<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label><span>{Number(result?.total || 0).toLocaleString()} attempts</span></div>
      <div className="admin-table-scroll"><table className="admin-user-table admin-response-table"><thead><tr><th>Test</th><th>Submitted</th><th>Candidate</th><th>Answers</th><th>Score</th><th><span className="sr-only">Review answers</span></th></tr></thead><tbody>
        {loading && !result && <tr><td colSpan="6" className="admin-empty">Loading test responses…</td></tr>}
        {!loading && result?.items?.length === 0 && <tr><td colSpan="6" className="admin-empty">No attempts match those filters.</td></tr>}
        {result?.items?.map((item) => <tr key={`${item.test_type}-${item.session_id}`}><td><span className={`admin-test-pill ${item.test_type}`}>{testName(item.test_type)}</span></td><td>{fmtDate(item.created_at)}</td><td><code>{item.candidate_ref}</code></td><td>{Number(item.response_count || 0).toLocaleString()}</td><td>{item.score == null ? '—' : `${Number(item.score).toFixed(1)} / 10`}</td><td><button className="admin-row-open" onClick={() => openResponse(item)}><Eye size={14} /> Review</button></td></tr>)}
      </tbody></table></div>
      <div className="admin-pagination"><span>Page {result?.page || page} of {Math.max(result?.pages || 0, 1)}</span><div><button className="admin-secondary-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1}>Previous</button><button className="admin-secondary-button" onClick={() => setPage((value) => value + 1)} disabled={loading || page >= (result?.pages || 1)}>Next</button></div></div>
    </section>
    <p className="admin-privacy-note">Opening an answer is recorded in the administrator activity log. Candidate identity is intentionally hidden in response review.</p>
    {selected && <div className="admin-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><aside className="admin-response-drawer" role="dialog" aria-modal="true" aria-labelledby="response-detail-title"><header><div><p className="admin-eyebrow">{testName(selected.test_type)} · RESPONSE DETAIL</p><h2 id="response-detail-title">Candidate answer</h2><small>Reference {selected.candidate_ref}</small></div><button className="admin-icon-button" aria-label="Close response detail" onClick={() => setSelected(null)}><X size={18} /></button></header>{error && <div className="admin-alert" role="alert">{error}</div>}{detailLoading ? <p className="admin-empty">Loading response details…</p> : detail && <ResponseAnswers response={detail} />}</aside></div>}
  </section>
}
