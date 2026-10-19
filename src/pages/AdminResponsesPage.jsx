import { useEffect, useState } from 'react'
import { AlertTriangle, Award, Check, ClipboardList, Download, Eye, Lightbulb, Sparkles, X } from 'lucide-react'
import { adminApi } from '../services/liveApi'
import './admin.css'

const TESTS = [['', 'All tests'], ['ppdt', 'PPDT'], ['wat', 'WAT'], ['tat', 'TAT'], ['sdt', 'SDT'], ['sct', 'SCT']]
const testName = (value) => value ? value.toUpperCase() : 'All tests'
const fmtDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

function AnswerSection({ title, value }) {
  if (value == null || value === '') return null
  return <section className="admin-answer-section"><h3>{title}</h3><p>{typeof value === 'string' ? value : JSON.stringify(value)}</p></section>
}

function ResponsePromptImage({ testType, payload }) {
  const [failed, setFailed] = useState(false)
  if (!['ppdt', 'tat'].includes(testType) || !payload.image_id) return null
  const imageUrl = payload.image_url
  let safeImageUrl = ''
  try {
    const parsed = new URL(imageUrl)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') safeImageUrl = parsed.href
  } catch { /* Older response records may not have a prompt URL. */ }

  return <figure className="admin-response-prompt-image">
    {safeImageUrl && !failed
      ? <img src={safeImageUrl} alt={`${testName(testType)} prompt image`} loading="lazy" onError={() => setFailed(true)} />
      : <div className="admin-response-prompt-unavailable">Prompt image unavailable</div>}
    <figcaption>Original {testName(testType)} picture <span>{payload.image_id}</span></figcaption>
  </figure>
}

const OLQ_LABELS = {
  LDR: 'Leadership', EMS: 'Emotional stability', SOI: 'Social intelligence',
  DEM: 'Decision making', POO: 'Positive outlook', MNT: 'Mental toughness',
  COM: 'Communication', MOI: 'Moral integrity', SOR: 'Sense of responsibility',
}

function titleCase(value) {
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function displayValue(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : JSON.stringify(item)).join(' · ')
  return ''
}

function downloadFeedbackJson(feedback, response) {
  const test = String(response.test_type || 'test').toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  const session = String(response.session_id || 'attempt').replace(/[^a-zA-Z0-9-]+/g, '-').slice(0, 64)
  const blob = new Blob([JSON.stringify(feedback, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${test}-${session}-feedback.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function FeedbackScore({ label, value, compact = false }) {
  const score = Number(value)
  if (!Number.isFinite(score)) return null
  const bounded = Math.max(0, Math.min(10, score))
  return <div className={`admin-feedback-score ${compact ? 'compact' : ''}`}>
    <div><span>{label}</span><strong>{score.toFixed(1)}<small> / 10</small></strong></div>
    <div className="admin-feedback-meter" role="progressbar" aria-label={`${label} score`} aria-valuemin="0" aria-valuemax="10" aria-valuenow={bounded}><i style={{ width: `${bounded * 10}%` }} /></div>
  </div>
}

function FeedbackList({ title, values, tone = 'positive' }) {
  if (!Array.isArray(values) || values.length === 0) return null
  const Icon = tone === 'focus' ? Lightbulb : Sparkles
  const items = values.map((value) => OLQ_LABELS[value] || value).filter(Boolean)
  if (!items.length) return null
  return <section className={`admin-feedback-list ${tone}`}>
    <h4><Icon size={16} />{title}</h4>
    <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
  </section>
}

function AssessmentFeedback({ feedback, response }) {
  const summary = feedback.psychological_analysis || feedback.personality_assessment || feedback.self_perception_summary || feedback.summary || feedback.detailed_feedback
  const strengths = feedback.strengths || feedback.positive_traits || feedback.top_strengths
  const improvements = feedback.areas_of_improvement || feedback.areas_of_improvement_text || feedback.areas_of_concern || feedback.improvement_areas
  const recommendation = feedback.recommendation || feedback.next_step
  const sections = Object.entries(feedback).filter(([key, value]) => key.endsWith('_feedback') && value && typeof value === 'object' && !Array.isArray(value))
  const olqScores = feedback.olq_scores && typeof feedback.olq_scores === 'object' ? Object.entries(feedback.olq_scores) : []
  const redFlags = feedback.red_flags && typeof feedback.red_flags === 'object'
    ? Object.entries(feedback.red_flags).filter(([key, value]) => key !== 'flag_details' && value === true)
    : []
  const handled = new Set([
    'overall_score', 'composite_score', 'assessor_confidence', 'psychological_analysis',
    'personality_assessment', 'self_perception_summary', 'summary', 'detailed_feedback',
    'strengths', 'positive_traits', 'top_strengths', 'areas_of_improvement',
    'areas_of_improvement_text', 'areas_of_concern', 'improvement_areas', 'recommendation',
    'next_step', 'olq_scores', 'red_flags', ...sections.map(([key]) => key),
  ])
  const insights = Object.entries(feedback).filter(([key, value]) => !handled.has(key) && typeof value === 'string' && value.trim())

  return <section className="admin-assessment-feedback" aria-labelledby="assessment-feedback-title">
    <div className="admin-feedback-heading">
      <div><p className="admin-eyebrow"><Sparkles size={14} />ASSESSMENT REVIEW</p><h3 id="assessment-feedback-title">Assessment feedback</h3><p>A readable summary of the evaluation, with the original JSON available whenever you need it.</p></div>
      <button className="admin-secondary-button" onClick={() => downloadFeedbackJson(feedback, response)}><Download size={15} />Download JSON</button>
    </div>
    <div className="admin-feedback-hero">
      <div className="admin-feedback-hero-score"><span>Overall score</span><strong>{Number.isFinite(Number(feedback.overall_score)) ? Number(feedback.overall_score).toFixed(1) : '—'}<small> / 10</small></strong><div className="admin-feedback-meter" role="progressbar" aria-label="Overall score" aria-valuemin="0" aria-valuemax="10" aria-valuenow={Math.max(0, Math.min(10, Number(feedback.overall_score) || 0))}><i style={{ width: `${Math.max(0, Math.min(100, (Number(feedback.overall_score) || 0) * 10))}%` }} /></div>{feedback.composite_score != null && <small className="admin-feedback-composite">Composite {Number(feedback.composite_score).toFixed(1)} / 10</small>}</div>
      <div className="admin-feedback-summary"><span>Evaluator summary</span><p>{summary || 'A narrative summary was not included for this assessment.'}</p>{feedback.assessor_confidence && <small><Award size={13} /> Assessor confidence: {titleCase(feedback.assessor_confidence)}</small>}</div>
    </div>

    {sections.length > 0 && <section className="admin-feedback-block"><div className="admin-feedback-block-title"><h4>Scored dimensions</h4><span>Section-level observations</span></div><div className="admin-feedback-sections">{sections.map(([key, section]) => {
      const details = Object.entries(section).filter(([field, value]) => field !== 'score' && displayValue(value))
      return <article className="admin-feedback-section-card" key={key}><div className="admin-feedback-section-title"><h5>{titleCase(key.replace(/_feedback$/, ''))}</h5>{section.score != null && <strong>{Number(section.score).toFixed(1)}<small> / 10</small></strong>}</div>{section.score != null && <FeedbackScore label="Section score" value={section.score} compact />}{details.map(([field, value]) => <div className="admin-feedback-detail" key={field}><span>{titleCase(field)}</span><p>{displayValue(value)}</p></div>)}</article>
    })}</div></section>}

    {(Array.isArray(strengths) && strengths.length > 0 || Array.isArray(improvements) && improvements.length > 0) && <div className="admin-feedback-lists"><FeedbackList title="Strengths" values={strengths} /><FeedbackList title="Growth areas" values={improvements} tone="focus" /></div>}

    {olqScores.length > 0 && <section className="admin-feedback-block"><div className="admin-feedback-block-title"><h4>Leadership qualities</h4><span>OLQ profile</span></div><div className="admin-feedback-olqs">{olqScores.map(([code, raw]) => {
      const item = typeof raw === 'object' && raw !== null ? raw : { score: raw }
      return <article key={code}><div className="admin-feedback-olq-heading"><span>{code}</span><strong>{OLQ_LABELS[code] || titleCase(code)}</strong><b>{Number.isFinite(Number(item.score)) ? Number(item.score).toFixed(1) : '—'}</b></div>{item.score != null && <div className="admin-feedback-meter"><i style={{ width: `${Math.max(0, Math.min(100, Number(item.score) * 10))}%` }} /></div>}{item.evidence && <p>{item.evidence}</p>}{item.confidence && <small>Confidence: {titleCase(item.confidence)}</small>}</article>
    })}</div></section>}

    {insights.length > 0 && <section className="admin-feedback-block"><div className="admin-feedback-block-title"><h4>Additional observations</h4></div><div className="admin-feedback-insights">{insights.map(([key, value]) => <article key={key}><span>{titleCase(key)}</span><p>{value}</p></article>)}</div></section>}
    {recommendation && <section className="admin-feedback-recommendation"><span><Lightbulb size={16} />Recommended next step</span><p>{recommendation}</p></section>}
    {feedback.red_flags && <section className={`admin-feedback-flags ${redFlags.length ? 'has-flags' : ''}`}><h4><AlertTriangle size={15} />Safety indicators</h4>{redFlags.length ? <ul>{redFlags.map(([key]) => <li key={key}>{titleCase(key)}</li>)}</ul> : <p><Check size={14} />No indicators were flagged in this assessment.</p>}{feedback.red_flags.flag_details && <p>{feedback.red_flags.flag_details}</p>}</section>}
    <details className="admin-feedback-disclosure"><summary>View raw feedback JSON</summary><pre>{JSON.stringify(feedback, null, 2)}</pre></details>
  </section>
}

function ResponseAnswers({ response }) {
  const payload = response.payload || {}
  const feedback = payload.feedback || payload.ai_feedback_json
  const answers = Array.isArray(payload.responses) ? payload.responses : []
  const fields = response.test_type === 'ppdt'
    ? [['Observation', payload.spot_text], ['Action plan', payload.action_text], ['Story', payload.story_text], ['Reasoning', payload.logic_text]]
    : response.test_type === 'tat' ? [['Story', payload.story_text]] : []

  return <div className="admin-response-detail-body">
    <div className="admin-response-meta"><span>Test <strong>{testName(response.test_type)}</strong></span><span>Submitted <strong>{fmtDate(response.created_at)}</strong></span><span>Candidate ref <strong>{response.candidate_ref}</strong></span><span>Score <strong>{response.score == null ? 'Not scored' : `${Number(response.score).toFixed(1)} / 10`}</strong></span></div>
    <ResponsePromptImage testType={response.test_type} payload={payload} />
    {fields.map(([title, value]) => <AnswerSection key={title} title={title} value={value} />)}
    {answers.length > 0 && <section className="admin-answer-section"><h3>Responses <span>{answers.length}</span></h3><div className="admin-answer-list">{answers.map((item, index) => <article key={`${index}-${item.word || item.stem || item.prompt || ''}`}><div><strong>{item.word || item.stem || item.prompt || `Response ${index + 1}`}</strong>{item.response_time_ms != null && <small>{(Number(item.response_time_ms) / 1000).toFixed(1)} sec</small>}</div><p>{item.response || 'No response provided.'}</p></article>)}</div></section>}
    {feedback && typeof feedback === 'object' && <AssessmentFeedback feedback={feedback} response={response} />}
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
      <div className="admin-response-filters"><label>Filter by test<select aria-label="Filter responses by test" value={testType} onChange={(event) => setTestType(event.target.value)}>{TESTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>Through<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label><span>{Number(result?.total || 0).toLocaleString()} attempts</span></div>
      <div className="admin-table-scroll"><table className="admin-user-table admin-response-table"><thead><tr><th>Test</th><th>Submitted</th><th>Candidate</th><th>Answers</th><th>Score</th><th><span className="sr-only">Review answers</span></th></tr></thead><tbody>
        {loading && !result && <tr><td colSpan="6" className="admin-empty">Loading test responses…</td></tr>}
        {!loading && result?.items?.length === 0 && <tr><td colSpan="6" className="admin-empty">No attempts match those filters.</td></tr>}
        {result?.items?.map((item) => <tr key={`${item.test_type}-${item.session_id}`}><td><span className={`admin-test-pill ${item.test_type}`}>{testName(item.test_type)}</span></td><td>{fmtDate(item.created_at)}</td><td><code>{item.candidate_ref}</code></td><td>{Number(item.response_count || 0).toLocaleString()}</td><td>{item.score == null ? '—' : `${Number(item.score).toFixed(1)} / 10`}</td><td><button className="admin-row-open" onClick={() => openResponse(item)}><Eye size={14} /> Review</button></td></tr>)}
      </tbody></table></div>
      <div className="admin-pagination"><span>Page {result?.page || page} of {Math.max(result?.pages || 0, 1)}</span><div><button className="admin-secondary-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1}>Previous</button><button className="admin-secondary-button" onClick={() => setPage((value) => value + 1)} disabled={loading || page >= (result?.pages || 1)}>Next</button></div></div>
    </section>
    <p className="admin-privacy-note">Opening an answer is recorded in the administrator activity log. Candidate names appear only in the audited detail view; the response list remains pseudonymous.</p>
    {selected && <div className="admin-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><aside className="admin-response-drawer" role="dialog" aria-modal="true" aria-labelledby="response-detail-title"><header><div><p className="admin-eyebrow">{testName(selected.test_type)} · RESPONSE DETAIL</p><h2 id="response-detail-title">Candidate answer</h2><small>Candidate: {detail?.candidate_name || '—'} · Reference {selected.candidate_ref}</small></div><button className="admin-icon-button" aria-label="Close response detail" onClick={() => setSelected(null)}><X size={18} /></button></header>{error && <div className="admin-alert" role="alert">{error}</div>}{detailLoading ? <p className="admin-empty">Loading response details…</p> : detail && <ResponseAnswers response={detail} />}</aside></div>}
  </section>
}
